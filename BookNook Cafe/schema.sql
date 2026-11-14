-- BookNook schema: 3 related tables.
-- bookings.guest_id -> guests.id and bookings.game_id -> games.id (foreign keys).
-- A booking is ACTIVE while returned_at is NULL. Returning a game fills returned_at.
CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  players INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY,
  guest_id INTEGER NOT NULL,
  game_id INTEGER NOT NULL,
  booked_at TEXT NOT NULL,
  returned_at TEXT,
  FOREIGN KEY (guest_id) REFERENCES guests (id),
  FOREIGN KEY (game_id) REFERENCES games (id)
);
