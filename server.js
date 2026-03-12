/**
 * Southern Sky Cinemas — Backend API
 * Node.js / Express / PostgreSQL / Stripe / JWT
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const csv = require("csv-parse");
const { Pool } = require("pg");
const Stripe = require("stripe");

// ─── Config ──────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());

// Rate limiting — general
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many requests" }));

// Rate limiting — checkout (tighter)
const checkoutLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Auth Middleware ──────────────────────────────────────────────────────────

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorised" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role && req.user?.role !== "admin") {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};

// ─── Input Sanitisation ───────────────────────────────────────────────────────

const sanitise = (str) => String(str).replace(/[<>"'`;]/g, "").trim();

// ─── Auth Routes ──────────────────────────────────────────────────────────────

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const { rows } = await db.query("SELECT * FROM admin_users WHERE username = $1", [sanitise(username)]);
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Movie Routes ─────────────────────────────────────────────────────────────

app.get("/api/movies", async (req, res) => {
  try {
    const { release_type, genre, search } = req.query;
    let query = "SELECT * FROM movies WHERE is_active = true";
    const params = [];
    if (release_type) { params.push(release_type); query += ` AND release_type = $${params.length}`; }
    if (genre) { params.push(`%${sanitise(genre)}%`); query += ` AND genre ILIKE $${params.length}`; }
    if (search) { params.push(`%${sanitise(search)}%`); query += ` AND (title ILIKE $${params.length} OR genre ILIKE $${params.length})`; }
    query += " ORDER BY created_at DESC";
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/movies/:id", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM movies WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Movie not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Upload CSV
app.post("/api/admin/movies/import", authenticate, requireRole("admin"), upload.single("csv"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const records = [];
  const parser = csv.parse({ columns: true, skip_empty_lines: true });
  parser.on("readable", function () {
    let record;
    while ((record = this.read()) !== null) records.push(record);
  });
  parser.on("error", (err) => res.status(400).json({ error: "CSV parse error: " + err.message }));
  parser.on("end", async () => {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      for (const r of records) {
        await client.query(
          `INSERT INTO movies (id, title, rating, runtime, genre, poster_url, description, release_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET title=$2,rating=$3,runtime=$4,genre=$5,poster_url=$6,description=$7,release_type=$8`,
          [sanitise(r.movie_id), sanitise(r.title), sanitise(r.rating), parseInt(r.runtime), sanitise(r.genre), sanitise(r.poster_url), sanitise(r.description), sanitise(r.release_type)]
        );
      }
      await client.query("COMMIT");
      res.json({ imported: records.length });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: "Import failed: " + err.message });
    } finally {
      client.release();
    }
  });
  parser.write(req.file.buffer.toString("utf8"));
  parser.end();
});

// ─── Cinema / Screen Routes ───────────────────────────────────────────────────

app.get("/api/cinemas", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT c.*, json_agg(s ORDER BY s.screen_number) AS screens FROM cinemas c LEFT JOIN screens s ON s.cinema_id = c.id GROUP BY c.id ORDER BY c.name");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/cinemas", authenticate, requireRole("admin"), async (req, res) => {
  const { name, address } = req.body;
  try {
    const { rows } = await db.query("INSERT INTO cinemas (name, address) VALUES ($1,$2) RETURNING *", [sanitise(name), sanitise(address)]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/screens", authenticate, requireRole("admin"), async (req, res) => {
  const { cinema_id, screen_number, seat_rows, seat_columns, seat_map } = req.body;
  try {
    const { rows } = await db.query(
      "INSERT INTO screens (cinema_id, screen_number, seat_rows, seat_columns, seat_map) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [cinema_id, screen_number, seat_rows, seat_columns, JSON.stringify(seat_map)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Session Routes ───────────────────────────────────────────────────────────

app.get("/api/sessions", async (req, res) => {
  try {
    const { movie_id, cinema_id, date } = req.query;
    let query = `SELECT sess.*, m.title AS movie_title, m.release_type, c.name AS cinema_name, sc.screen_number, sc.seat_rows, sc.seat_columns
                 FROM sessions sess
                 JOIN movies m ON m.id = sess.movie_id
                 JOIN cinemas c ON c.id = sess.cinema_id
                 JOIN screens sc ON sc.id = sess.screen_id
                 WHERE sess.start_time > NOW()`;
    const params = [];
    if (movie_id) { params.push(movie_id); query += ` AND sess.movie_id = $${params.length}`; }
    if (cinema_id) { params.push(cinema_id); query += ` AND sess.cinema_id = $${params.length}`; }
    if (date) { params.push(date); query += ` AND sess.start_time::date = $${params.length}`; }
    query += " ORDER BY sess.start_time ASC";
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/sessions", authenticate, requireRole("admin"), async (req, res) => {
  const { movie_id, cinema_id, screen_id, start_time, session_type, special_event } = req.body;
  try {
    const { rows } = await db.query(
      "INSERT INTO sessions (movie_id, cinema_id, screen_id, start_time, session_type, special_event) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [movie_id, cinema_id, screen_id, start_time, session_type, special_event || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Pricing Routes ───────────────────────────────────────────────────────────

app.get("/api/pricing", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM pricing_rules ORDER BY priority ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/pricing/calculate", async (req, res) => {
  try {
    const { session_id, ticket_types } = req.query;
    const { rows: sessions } = await db.query(
      "SELECT sess.*, m.release_type, m.rating FROM sessions sess JOIN movies m ON m.id=sess.movie_id WHERE sess.id=$1",
      [session_id]
    );
    if (!sessions[0]) return res.status(404).json({ error: "Session not found" });
    const sess = sessions[0];
    const dayOfWeek = new Date(sess.start_time).getDay();
    const hour = new Date(sess.start_time).getHours();
    const sessionTime = hour < 17 ? "matinee" : hour < 21 ? "evening" : "late";

    const { rows: rules } = await db.query("SELECT * FROM pricing_rules WHERE is_active=true ORDER BY priority ASC");
    const baseRules = rules.filter(r => r.rule_type === "base");
    const modRules = rules.filter(r => r.rule_type !== "base");

    const types = JSON.parse(ticket_types || "[]");
    const pricing = {};
    for (const type of types) {
      const base = baseRules.find(r => r.ticket_type === type);
      let price = base?.price || 0;
      const applied = [];
      for (const mod of modRules) {
        const ctx = { day: dayOfWeek, release_type: sess.release_type, sessionTime, special_event: sess.special_event };
        try {
          const applies = new Function(...Object.keys(ctx), `return ${mod.condition}`)(...Object.values(ctx));
          if (applies) {
            if (mod.rule_type === "multiplier") price *= mod.value;
            if (mod.rule_type === "surcharge") price += mod.value;
            applied.push(mod.label);
          }
        } catch {}
      }
      pricing[type] = { price: Math.round(price * 100) / 100, applied };
    }
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/admin/pricing/:id", authenticate, requireRole("admin"), async (req, res) => {
  const { price, value, is_active } = req.body;
  try {
    const { rows } = await db.query(
      "UPDATE pricing_rules SET price=$1, value=$2, is_active=$3, updated_at=NOW() WHERE id=$4 RETURNING *",
      [price, value, is_active, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Seat Reservation ─────────────────────────────────────────────────────────

app.get("/api/sessions/:id/seats", async (req, res) => {
  try {
    const { rows: sess } = await db.query(
      "SELECT sc.seat_map, sc.seat_rows, sc.seat_columns FROM sessions s JOIN screens sc ON sc.id=s.screen_id WHERE s.id=$1",
      [req.params.id]
    );
    if (!sess[0]) return res.status(404).json({ error: "Session not found" });
    const { rows: taken } = await db.query(
      "SELECT seat_id FROM bookings b JOIN booking_seats bs ON bs.booking_id=b.id WHERE b.session_id=$1 AND b.status!='cancelled'",
      [req.params.id]
    );
    res.json({ seat_map: sess[0].seat_map, rows: sess[0].seat_rows, cols: sess[0].seat_columns, taken: taken.map(r => r.seat_id) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Checkout / Payment ───────────────────────────────────────────────────────

app.post("/api/checkout/intent", checkoutLimiter, async (req, res) => {
  try {
    const { session_id, tickets, seats } = req.body;
    // Server-side price calculation (never trust client)
    const totalCents = await calculateTotalServer(session_id, tickets);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "aud",
      metadata: { session_id, seats: JSON.stringify(seats), tickets: JSON.stringify(tickets) },
    });
    res.json({ client_secret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: "Payment initialisation failed" });
  }
});

app.post("/api/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send("Webhook signature verification failed");
  }
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    await createBookingFromPayment(pi);
  }
  res.json({ received: true });
});

async function calculateTotalServer(sessionId, tickets) {
  // Re-run pricing engine on server to validate
  const { rows } = await db.query("SELECT * FROM sessions s JOIN movies m ON m.id=s.movie_id WHERE s.id=$1", [sessionId]);
  if (!rows[0]) throw new Error("Session not found");
  let totalCents = 0;
  for (const [type, qty] of Object.entries(tickets)) {
    const price = await getPriceForType(type, rows[0]);
    totalCents += Math.round(price * 100) * qty;
  }
  return totalCents;
}

async function createBookingFromPayment(paymentIntent) {
  const { session_id, seats, tickets } = paymentIntent.metadata;
  const ref = "SSC-" + Math.random().toString(36).toUpperCase().slice(2, 8);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "INSERT INTO bookings (reference, session_id, total_amount, payment_intent_id, status) VALUES ($1,$2,$3,$4,'confirmed') RETURNING id",
      [ref, session_id, paymentIntent.amount / 100, paymentIntent.id]
    );
    const bookingId = rows[0].id;
    for (const seat of JSON.parse(seats)) {
      await client.query("INSERT INTO booking_seats (booking_id, seat_id) VALUES ($1,$2)", [bookingId, seat]);
    }
    await client.query("COMMIT");
    // TODO: send confirmation email with QR code
    return ref;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ─── Admin Reports ────────────────────────────────────────────────────────────

app.get("/api/admin/reports/sales", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { from, to, cinema_id } = req.query;
    const { rows } = await db.query(
      `SELECT c.name AS cinema, m.title AS movie, COUNT(b.id) AS bookings, SUM(b.total_amount) AS revenue
       FROM bookings b
       JOIN sessions s ON s.id = b.session_id
       JOIN movies m ON m.id = s.movie_id
       JOIN cinemas c ON c.id = s.cinema_id
       WHERE b.status = 'confirmed'
         AND ($1::date IS NULL OR s.start_time::date >= $1)
         AND ($2::date IS NULL OR s.start_time::date <= $2)
         AND ($3::text IS NULL OR c.id::text = $3)
       GROUP BY c.name, m.title
       ORDER BY revenue DESC`,
      [from || null, to || null, cinema_id || null]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`Southern Sky API running on port ${PORT}`));

module.exports = app;
