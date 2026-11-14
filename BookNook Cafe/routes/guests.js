// Guests: get all (with search), get one, add, update, delete.
const express = require('express');
const { sendError, isValidId, isConstraintError } = require('../utils');
const { validateGuest } = require('../validators');

module.exports = (db) => {
  const router = express.Router();

  // GET /guests/   or   GET /guests/?search_q=asha
  router.get('/', async (req, res) => {
    const q = req.query.search_q;
    const hasSearch = q !== undefined && String(q).trim() !== '';
    try {
      const guests = hasSearch
        ? await db.all('SELECT * FROM guests WHERE name LIKE ? ORDER BY id;', [`%${q}%`])
        : await db.all('SELECT * FROM guests ORDER BY id;');
      res.status(200).json(guests);
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  router.get('/:guestId', async (req, res) => {
    const { guestId } = req.params;
    if (!isValidId(guestId)) return sendError(res, 400, 'guestId must be a positive whole number');
    try {
      const guest = await db.get('SELECT * FROM guests WHERE id = ?;', [guestId]);
      if (!guest) return sendError(res, 404, 'Guest Not Found');
      res.status(200).json(guest);
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  router.post('/', async (req, res) => {
    const problem = validateGuest(req.body);
    if (problem) return sendError(res, 400, problem);
    const { name, phone = null } = req.body;
    try {
      const result = await db.run('INSERT INTO guests (name, phone) VALUES (?, ?);', [name.trim(), phone]);
      res.status(201).json({ message: 'Guest Added Successfully', guestId: result.lastID });
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  router.put('/:guestId', async (req, res) => {
    const { guestId } = req.params;
    if (!isValidId(guestId)) return sendError(res, 400, 'guestId must be a positive whole number');
    const problem = validateGuest(req.body);
    if (problem) return sendError(res, 400, problem);
    const { name, phone = null } = req.body;
    try {
      const result = await db.run('UPDATE guests SET name = ?, phone = ? WHERE id = ?;', [name.trim(), phone, guestId]);
      if (result.changes === 0) return sendError(res, 404, 'Guest Not Found');
      res.status(200).json({ message: 'Guest Updated Successfully' });
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  router.delete('/:guestId', async (req, res) => {
    const { guestId } = req.params;
    if (!isValidId(guestId)) return sendError(res, 400, 'guestId must be a positive whole number');
    try {
      const result = await db.run('DELETE FROM guests WHERE id = ?;', [guestId]);
      if (result.changes === 0) return sendError(res, 404, 'Guest Not Found');
      res.status(200).json({ message: 'Guest Deleted Successfully' });
    } catch (error) {
      if (isConstraintError(error, 'FOREIGN KEY')) return sendError(res, 409, 'Guest has bookings and cannot be deleted');
      sendError(res, 500, 'Internal Server Error');
    }
  });

  return router;
};
