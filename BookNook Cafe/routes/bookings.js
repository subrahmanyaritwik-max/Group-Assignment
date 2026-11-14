// Bookings: the JOIN endpoint, create a booking (with the limit of 3), and return a game.
const express = require('express');
const { sendError, isValidId } = require('../utils');
const { validateBooking } = require('../validators');

const MAX_ACTIVE = 3; // the twist: a guest can hold at most 3 active bookings

// The join: each booking with the guest's name and the game's name.
const BOOKING_JOIN = `
  SELECT bookings.id,
         guests.id   AS guest_id,
         guests.name AS guest_name,
         games.id    AS game_id,
         games.name  AS game_name,
         bookings.booked_at,
         bookings.returned_at,
         CASE WHEN bookings.returned_at IS NULL THEN 'active' ELSE 'returned' END AS status
  FROM bookings
  JOIN guests ON guests.id = bookings.guest_id
  JOIN games  ON games.id  = bookings.game_id`;

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

module.exports = (db) => {
  const router = express.Router();

  // GET /bookings/                  -> all bookings with guest_name and game_name
  // GET /bookings/?status=active    -> only games that are out right now (or status=returned)
  // GET /bookings/?guest_id=1       -> bookings of one guest
  router.get('/', async (req, res) => {
    const { status, guest_id } = req.query;
    const conditions = [];
    const params = [];
    if (status !== undefined) {
      if (!['active', 'returned'].includes(status)) {
        return sendError(res, 400, 'status must be active or returned');
      }
      conditions.push(status === 'active' ? 'bookings.returned_at IS NULL' : 'bookings.returned_at IS NOT NULL');
    }
    if (guest_id !== undefined) {
      if (!isValidId(guest_id)) return sendError(res, 400, 'guest_id must be a positive whole number');
      conditions.push('bookings.guest_id = ?');
      params.push(Number(guest_id));
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    try {
      res.status(200).json(await db.all(`${BOOKING_JOIN} ${where} ORDER BY bookings.id;`, params));
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // GET /bookings/:bookingId/
  router.get('/:bookingId', async (req, res) => {
    const { bookingId } = req.params;
    if (!isValidId(bookingId)) return sendError(res, 400, 'bookingId must be a positive whole number');
    try {
      const booking = await db.get(`${BOOKING_JOIN} WHERE bookings.id = ?;`, [bookingId]);
      if (!booking) return sendError(res, 404, 'Booking Not Found');
      res.status(200).json(booking);
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // POST /bookings/  body: { "guest_id": 1, "game_id": 2 }
  // 201 created | 400 bad body | 404 guest or game missing | 409 "Limit of 3 reached"
  router.post('/', async (req, res) => {
    const problem = validateBooking(req.body);
    if (problem) return sendError(res, 400, problem);
    const { guest_id, game_id } = req.body;

    try {
      if (!(await db.get('SELECT id FROM guests WHERE id = ?;', [guest_id]))) {
        return sendError(res, 404, 'Guest Not Found');
      }
      if (!(await db.get('SELECT id FROM games WHERE id = ?;', [game_id]))) {
        return sendError(res, 404, 'Game Not Found');
      }

      // Count and insert in ONE statement: the row is only inserted while the guest
      // has fewer than 3 active bookings, so two requests at the same moment cannot
      // both slip past the check.
      const result = await db.run(
        `INSERT INTO bookings (guest_id, game_id, booked_at)
         SELECT ?, ?, ?
         WHERE (SELECT COUNT(*) FROM bookings
                 WHERE guest_id = ? AND returned_at IS NULL) < ${MAX_ACTIVE};`,
        [guest_id, game_id, now(), guest_id]
      );
      if (result.changes === 0) return sendError(res, 409, 'Limit of 3 reached');

      const booking = await db.get(`${BOOKING_JOIN} WHERE bookings.id = ?;`, [result.lastID]);
      res.status(201).json({ message: 'Booking Added Successfully', bookingId: result.lastID, booking });
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // POST /bookings/:bookingId/return  -> 200, frees one place for the guest
  // 404 unknown booking | 409 "Already returned"
  router.post('/:bookingId/return', async (req, res) => {
    const { bookingId } = req.params;
    if (!isValidId(bookingId)) return sendError(res, 400, 'bookingId must be a positive whole number');
    try {
      const result = await db.run(
        'UPDATE bookings SET returned_at = ? WHERE id = ? AND returned_at IS NULL;',
        [now(), bookingId]
      );
      if (result.changes === 0) {
        const exists = await db.get('SELECT id FROM bookings WHERE id = ?;', [bookingId]);
        return exists ? sendError(res, 409, 'Already returned') : sendError(res, 404, 'Booking Not Found');
      }
      const booking = await db.get(`${BOOKING_JOIN} WHERE bookings.id = ?;`, [bookingId]);
      res.status(200).json({ message: 'Game Returned Successfully', booking });
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // DELETE /bookings/:bookingId/  -> 200
  router.delete('/:bookingId', async (req, res) => {
    const { bookingId } = req.params;
    if (!isValidId(bookingId)) return sendError(res, 400, 'bookingId must be a positive whole number');
    try {
      const result = await db.run('DELETE FROM bookings WHERE id = ?;', [bookingId]);
      if (result.changes === 0) return sendError(res, 404, 'Booking Not Found');
      res.status(200).json({ message: 'Booking Deleted Successfully' });
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  return router;
};
