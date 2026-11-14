INSERT INTO guests (name, phone) VALUES
  ('Asha', '9000000001'), ('Ravi', '9000000002'), ('Meena', '9000000003'),
  ('Karthik', '9000000004'), ('Sana', '9000000005');

INSERT INTO games (name, players) VALUES
  ('Chess', 2), ('Ludo', 4), ('Monopoly', 6), ('Catan', 4),
  ('Scrabble', 4), ('Carrom', 4), ('Jenga', 8), ('Uno', 10);

INSERT INTO bookings (guest_id, game_id, booked_at, returned_at) VALUES
  (2, 3, '2026-11-14 10:00:00', NULL),
  (3, 1, '2026-11-14 11:30:00', NULL),
  (4, 5, '2026-11-13 16:00:00', '2026-11-13 18:00:00');
