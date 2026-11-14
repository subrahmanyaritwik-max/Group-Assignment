// Games: get all, get one, add, update, delete.
const express = require('express');
const { sendError, isValidId, isConstraintError } = require('../utils');
const { validateGame } = require('../validators');

const GAME_SELECT = `
  SELECT games.id, games.name, games.players,
         (SELECT COUNT(*) FROM bookings
           WHERE bookings.game_id = games.id AND bookings.returned_at IS NULL) AS in_use
  FROM games`;

module.exports = (db) => {
  const router = express.Router();

  // GET /games/
  router.get('/', async (req, res) => {
    try {
      res.status(200).json(await db.all(`${GAME_SELECT} ORDER BY games.id;`));
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // GET /games/:gameId/
  router.get('/:gameId', async (req, res) => {
    const { gameId } = req.params;
    if (!isValidId(gameId)) return sendError(res, 400, 'gameId must be a positive whole number');
    try {
      const game = await db.get(`${GAME_SELECT} WHERE games.id = ?;`, [gameId]);
      if (!game) return sendError(res, 404, 'Game Not Found');
      res.status(200).json(game);
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // POST /games/
  router.post('/', async (req, res) => {
    const problem = validateGame(req.body);
    if (problem) return sendError(res, 400, problem);
    const { name, players } = req.body;
    try {
      const result = await db.run('INSERT INTO games (name, players) VALUES (?, ?);', [name.trim(), Number(players)]);
      res.status(201).json({ message: 'Game Added Successfully', gameId: result.lastID });
    } catch (error) {
      if (isConstraintError(error)) return sendError(res, 409, 'A game with this name already exists');
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // PUT /games/:gameId/
  router.put('/:gameId', async (req, res) => {
    const { gameId } = req.params;
    if (!isValidId(gameId)) return sendError(res, 400, 'gameId must be a positive whole number');
    const problem = validateGame(req.body);
    if (problem) return sendError(res, 400, problem);
    const { name, players } = req.body;
    try {
      const result = await db.run('UPDATE games SET name = ?, players = ? WHERE id = ?;', [name.trim(), Number(players), gameId]);
      if (result.changes === 0) return sendError(res, 404, 'Game Not Found');
      res.status(200).json({ message: 'Game Updated Successfully' });
    } catch (error) {
      if (isConstraintError(error)) return sendError(res, 409, 'A game with this name already exists');
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // DELETE /games/:gameId/
  router.delete('/:gameId', async (req, res) => {
    const { gameId } = req.params;
    if (!isValidId(gameId)) return sendError(res, 400, 'gameId must be a positive whole number');
    try {
      const result = await db.run('DELETE FROM games WHERE id = ?;', [gameId]);
      if (result.changes === 0) return sendError(res, 404, 'Game Not Found');
      res.status(200).json({ message: 'Game Deleted Successfully' });
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  });

  return router;
};
