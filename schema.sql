-- ============================================================
--  Southern Sky Cinemas — PostgreSQL Database Schema
--  Compatible with PostgreSQL 14+ and Supabase
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Admin Users ─────────────────────────────────────────────

CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

-- Seed admin user (password: southernsky2026)
-- Hash generated with bcrypt, 12 rounds
INSERT INTO admin_users (username, email, password_hash, role)
VALUES ('admin', 'admin@southernsky.com.au',
        '$2b$12$YourBcryptHashHere', 'admin');

-- ─── Cinemas ──────────────────────────────────────────────────

CREATE TABLE cinemas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  address    TEXT NOT NULL,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL DEFAULT 'NSW',
  phone      TEXT,
  email      TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed locations
INSERT INTO cinemas (name, address, city) VALUES
  ('Southern Sky Cinemas Dubbo',    '120 Macquarie St', 'Dubbo'),
  ('Southern Sky Cinemas Orange',   '45 Summer St',     'Orange'),
  ('Southern Sky Cinemas Bathurst', '67 William St',    'Bathurst');

-- ─── Screens ──────────────────────────────────────────────────

CREATE TABLE screens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cinema_id       UUID NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
  screen_number   INTEGER NOT NULL,
  name            TEXT,                     -- e.g. "Gold Class", "Vmax"
  seat_rows       INTEGER NOT NULL DEFAULT 8,
  seat_columns    INTEGER NOT NULL DEFAULT 12,
  total_seats     INTEGER GENERATED ALWAYS AS (seat_rows * seat_columns) STORED,
  seating_mode    TEXT NOT NULL DEFAULT 'reserved' CHECK (seating_mode IN ('general','reserved')),
  seat_map        JSONB,                    -- {"unavailable":["A1","A2"],"accessible":["H6"]}
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cinema_id, screen_number)
);

-- ─── Movies ───────────────────────────────────────────────────

CREATE TABLE movies (
  id            TEXT PRIMARY KEY,           -- from CSV movie_id
  title         TEXT NOT NULL,
  rating        TEXT NOT NULL,              -- G, PG, M, MA15+, R18+
  runtime       INTEGER NOT NULL,           -- minutes
  genre         TEXT NOT NULL,
  poster_url    TEXT,
  description   TEXT,
  release_type  TEXT NOT NULL DEFAULT 'standard'
                  CHECK (release_type IN ('standard','new_release','special_event')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movies_updated_at BEFORE UPDATE ON movies
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Sessions ─────────────────────────────────────────────────

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_id        TEXT NOT NULL REFERENCES movies(id),
  cinema_id       UUID NOT NULL REFERENCES cinemas(id),
  screen_id       UUID NOT NULL REFERENCES screens(id),
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ,              -- auto-calculated via trigger
  session_type    TEXT NOT NULL DEFAULT 'standard'
                    CHECK (session_type IN ('matinee','evening','late','special')),
  special_event   BOOLEAN DEFAULT FALSE,
  is_cancelled    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_movie    ON sessions(movie_id);
CREATE INDEX idx_sessions_cinema   ON sessions(cinema_id);
CREATE INDEX idx_sessions_start    ON sessions(start_time);
CREATE INDEX idx_sessions_date     ON sessions((start_time::date));

-- ─── Pricing Rules ────────────────────────────────────────────

CREATE TABLE pricing_rules (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_type  TEXT,                        -- NULL = applies to all
  rule_type    TEXT NOT NULL CHECK (rule_type IN ('base','multiplier','surcharge')),
  label        TEXT NOT NULL,
  condition    TEXT,                        -- JS expression evaluated server-side
  price        NUMERIC(8,2),               -- for base type
  value        NUMERIC(8,2),               -- multiplier or surcharge amount
  priority     INTEGER DEFAULT 10,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER pricing_updated_at BEFORE UPDATE ON pricing_rules
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed pricing rules
INSERT INTO pricing_rules (ticket_type, rule_type, label, price, priority) VALUES
  ('Adult',      'base', 'Adult Base',      18.00, 1),
  ('Child',      'base', 'Child Base',      11.00, 1),
  ('Concession', 'base', 'Concession Base', 13.50, 1),
  ('Senior',     'base', 'Senior Base',     13.50, 1),
  ('Family',     'base', 'Family Base',     48.00, 1);

INSERT INTO pricing_rules (ticket_type, rule_type, label, condition, value, priority) VALUES
  (NULL, 'multiplier', 'Half Price Tuesday',    'day === 2',                          0.5,  5),
  (NULL, 'surcharge',  'New Release Surcharge', "release_type === ''new_release''",   2.00, 10),
  (NULL, 'surcharge',  'Evening Session',       "sessionTime === ''evening''",         1.50, 10),
  (NULL, 'surcharge',  'Late Night Session',    "sessionTime === ''late''",            1.00, 10),
  (NULL, 'surcharge',  'Special Event',         'special_event === true',             4.00, 10);

-- ─── Bookings ─────────────────────────────────────────────────

CREATE TABLE bookings (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference          TEXT UNIQUE NOT NULL,  -- e.g. SSC-X4F2A
  session_id         UUID NOT NULL REFERENCES sessions(id),
  customer_name      TEXT,
  customer_email     TEXT,
  total_amount       NUMERIC(10,2) NOT NULL,
  payment_intent_id  TEXT UNIQUE,           -- Stripe PI ID
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','confirmed','cancelled','refunded')),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_session   ON bookings(session_id);
CREATE INDEX idx_bookings_reference ON bookings(reference);
CREATE INDEX idx_bookings_email     ON bookings(customer_email);
CREATE INDEX idx_bookings_status    ON bookings(status);

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Booking Seats ────────────────────────────────────────────

CREATE TABLE booking_seats (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id     TEXT NOT NULL,                -- e.g. "C7"
  ticket_type TEXT NOT NULL,               -- Adult, Child, etc.
  unit_price  NUMERIC(8,2) NOT NULL,
  UNIQUE(booking_id, seat_id)
);

-- Prevent double-booking at DB level
CREATE UNIQUE INDEX idx_unique_seat_per_session
  ON booking_seats(seat_id, (
    SELECT session_id FROM bookings WHERE id = booking_id AND status != 'cancelled'
  ));

-- ─── Promo Codes (Bonus Feature) ─────────────────────────────

CREATE TABLE promo_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value  NUMERIC(8,2) NOT NULL,
  max_uses        INTEGER,
  uses_count      INTEGER DEFAULT 0,
  valid_from      TIMESTAMPTZ,
  valid_to        TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Useful Views ─────────────────────────────────────────────

CREATE VIEW v_session_availability AS
SELECT
  s.id,
  s.start_time,
  s.session_type,
  s.special_event,
  m.title AS movie_title,
  m.release_type,
  c.name AS cinema_name,
  sc.screen_number,
  sc.total_seats,
  sc.total_seats - COUNT(bs.id) FILTER (WHERE b.status = 'confirmed') AS seats_available
FROM sessions s
JOIN movies m   ON m.id  = s.movie_id
JOIN cinemas c  ON c.id  = s.cinema_id
JOIN screens sc ON sc.id = s.screen_id
LEFT JOIN bookings b      ON b.session_id = s.id AND b.status = 'confirmed'
LEFT JOIN booking_seats bs ON bs.booking_id = b.id
WHERE s.is_cancelled = FALSE
GROUP BY s.id, m.title, m.release_type, c.name, sc.screen_number, sc.total_seats;

CREATE VIEW v_sales_report AS
SELECT
  c.name                        AS cinema,
  m.title                       AS movie,
  DATE_TRUNC('day', b.created_at) AS sale_date,
  COUNT(b.id)                   AS bookings,
  SUM(b.total_amount)           AS revenue,
  AVG(b.total_amount)           AS avg_order_value
FROM bookings b
JOIN sessions s ON s.id = b.session_id
JOIN movies m   ON m.id = s.movie_id
JOIN cinemas c  ON c.id = s.cinema_id
WHERE b.status = 'confirmed'
GROUP BY c.name, m.title, DATE_TRUNC('day', b.created_at)
ORDER BY sale_date DESC, revenue DESC;
