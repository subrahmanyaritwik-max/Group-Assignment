// Guests: get all, get one, add, update, delete.
const express = require('express');
const { sendError, isValidId, isConstraintError } = require('../utils');
const { validateGuest } = require('../validators');

module.exports = (db) => {
  const router = express.Router();

  // GET /guests/
  router.get('/', async (req, res) => {
    try {
      res.status(200).json(await db.all('SELECT * FROM guests ORDER BY id;'));
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // GET /guests/:guestId/
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

  // POST /guests/
  router.post('/', async (req, res) => {
    const problem = validateGuest(req.body);
    if (problem) return sendError(res, 400, problem);
    const { name, phone } = req.body;
    try {
      const result = await db.run('INSERT INTO guests (name, phone) VALUES (?, ?);', [name.trim(), phone.trim()]);
      res.status(201).json({ message: 'Guest Added Successfully', guestId: result.lastID });
    } catch (error) {
      if (isConstraintError(error)) return sendError(res, 409, 'Phone number already registered to another guest');
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // PUT /guests/:guestId/
  router.put('/:guestId', async (req, res) => {
    const { guestId } = req.params;
    if (!isValidId(guestId)) return sendError(res, 400, 'guestId must be a positive whole number');
    const problem = validateGuest(req.body);
    if (problem) return sendError(res, 400, problem);
    const { name, phone } = req.body;
    try {
      const result = await db.run('UPDATE guests SET name = ?, phone = ? WHERE id = ?;', [name.trim(), phone.trim(), guestId]);
      if (result.changes === 0) return sendError(res, 404, 'Guest Not Found');
      res.status(200).json({ message: 'Guest Updated Successfully' });
    } catch (error) {
      if (isConstraintError(error)) return sendError(res, 409, 'Phone number already registered to another guest');
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // DELETE /guests/:guestId/
  router.delete('/:guestId', async (req, res) => {
    const { guestId } = req.params;
    if (!isValidId(guestId)) return sendError(res, 400, 'guestId must be a positive whole number');
    try {
      const result = await db.run('DELETE FROM guests WHERE id = ?;', [guestId]);
      if (result.changes === 0) return sendError(res, 404, 'Guest Not Found');
      res.status(200).json({ message: 'Guest Deleted Successfully' });
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  return router;
};
