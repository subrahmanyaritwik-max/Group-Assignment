// Bookings: the JOIN endpoint and basic booking creation.
const express = require('express');
const { sendError, isValidId } = require('../utils');
const { validateBooking } = require('../validators');

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

  // GET /bookings/ -> JOIN endpoint
  router.get('/', async (req, res) => {
    try {
      res.status(200).json(await db.all(`${BOOKING_JOIN} ORDER BY bookings.id;`));
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

  // DELETE /bookings/:bookingId/
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
