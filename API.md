# Southern Sky Cinemas — API Documentation

**Base URL:** `https://api.southernsky.com.au/api`  
**Auth:** Bearer token (JWT) — required for all `/admin/*` routes

---

## Authentication

### POST /auth/login
Login and receive a JWT.

**Body:**
```json
{ "username": "admin", "password": "yourpassword" }
```
**Response:**
```json
{ "token": "eyJhbGci...", "role": "admin" }
```

---

## Movies

### GET /movies
List all active movies.

**Query params:** `release_type`, `genre`, `search`

**Response:** Array of movie objects.

---

### GET /movies/:id
Get a single movie by ID.

---

### POST /admin/movies/import
Upload a CSV file to bulk-import/update movies.

**Auth required:** admin  
**Content-Type:** `multipart/form-data`  
**Field:** `csv` (file)

**Required CSV columns:**
`movie_id, title, rating, runtime, genre, poster_url, description, release_type`

**Response:**
```json
{ "imported": 6 }
```

---

## Cinemas & Screens

### GET /cinemas
List all cinema locations with their screens.

---

### POST /admin/cinemas
Create a new cinema location.

**Auth required:** admin  
**Body:**
```json
{ "name": "Southern Sky Wagga", "address": "12 Baylis St", "city": "Wagga Wagga", "state": "NSW" }
```

---

### POST /admin/screens
Add a screen to a cinema.

**Body:**
```json
{
  "cinema_id": "uuid",
  "screen_number": 1,
  "seat_rows": 10,
  "seat_columns": 14,
  "seating_mode": "reserved",
  "seat_map": { "unavailable": ["A1","A2","A13","A14"], "accessible": ["J7","J8"] }
}
```

---

## Sessions

### GET /sessions
List upcoming sessions with filtering.

**Query params:** `movie_id`, `cinema_id`, `date` (YYYY-MM-DD)

**Response:** Array of session objects including availability.

---

### POST /admin/sessions
Create a new session.

**Auth required:** admin or staff  
**Body:**
```json
{
  "movie_id": "m001",
  "cinema_id": "uuid",
  "screen_id": "uuid",
  "start_time": "2026-03-15T18:30:00+11:00",
  "session_type": "evening",
  "special_event": false
}
```

---

## Pricing

### GET /pricing
Get all active pricing rules.

---

### GET /pricing/calculate
Calculate ticket prices for a session.

**Query params:** `session_id`, `ticket_types` (JSON array e.g. `["Adult","Child"]`)

**Response:**
```json
{
  "Adult":  { "price": 21.50, "applied": ["New Release Surcharge", "Evening Session"] },
  "Child":  { "price": 11.00, "applied": [] }
}
```

---

### PUT /admin/pricing/:id
Update a pricing rule.

**Auth required:** admin  
**Body:**
```json
{ "price": 20.00, "value": 0.5, "is_active": true }
```

---

## Seat Availability

### GET /sessions/:id/seats
Get the seat map and taken seats for a session.

**Response:**
```json
{
  "rows": 8,
  "cols": 12,
  "seat_map": { "unavailable": ["A1","A12"], "accessible": ["H6"] },
  "taken": ["B5","B6","C3","D8"]
}
```

---

## Checkout & Payment (Stripe)

### POST /checkout/intent
Create a Stripe PaymentIntent. Prices are **re-calculated server-side** — the client-side total is never trusted.

**Rate limited:** 10 requests/minute per IP

**Body:**
```json
{
  "session_id": "uuid",
  "tickets": { "Adult": 2, "Child": 1 },
  "seats": ["C4","C5","C6"]
}
```
**Response:**
```json
{ "client_secret": "pi_xxx_secret_xxx" }
```

Use the `client_secret` with Stripe.js to complete payment on the frontend.

---

### POST /webhook/stripe
Stripe webhook endpoint. Triggered on `payment_intent.succeeded` to confirm bookings and issue QR codes.

**Headers:** `stripe-signature` (verified server-side)

---

## Admin Reports

### GET /admin/reports/sales
Get sales data, filterable by date range and cinema.

**Auth required:** admin  
**Query params:** `from` (date), `to` (date), `cinema_id`

**Response:** Array of `{ cinema, movie, bookings, revenue }` objects.

---

## Security Notes

| Concern | Mitigation |
|---|---|
| SQL Injection | Parameterised queries throughout |
| XSS | Input sanitised with allowlist regex |
| CSRF | JWT Bearer auth (not cookies) |
| Rate limiting | 200 req/15 min general; 10 req/min checkout |
| Payment data | Never stored — Stripe tokenisation only |
| Admin auth | bcrypt password hashing, JWT with 8h expiry |
| HTTPS | Enforced via hosting platform (Vercel/Cloudflare) |

---

## Deployment

### Vercel (Frontend + API Routes)
```bash
vercel deploy
```

### Environment Variables
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_random_256bit_secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://southernsky.com.au
```

### Database (Supabase)
1. Create project at supabase.com
2. Run `docs/schema.sql` in the SQL editor
3. Copy the connection string to `DATABASE_URL`

---

## Embedding the Widget

Add to any existing website:

```html
<!-- Option 1: Route-based -->
<a href="https://tickets.southernsky.com.au">Buy Tickets</a>

<!-- Option 2: iframe widget -->
<iframe
  src="https://tickets.southernsky.com.au?embed=true&cinema=dubbo"
  width="100%"
  height="700"
  frameborder="0"
  allow="payment">
</iframe>
```
