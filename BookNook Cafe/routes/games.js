// Games: get all (with search), get one, add, update, delete.
const express = require('express');
const { sendError, isValidId, isConstraintError } = require('../utils');
const { validateGame, validateGameSearch } = require('../validators');

// in_use = how many active (not yet returned) bookings the game has right now.
const GAME_SELECT = `
  SELECT games.id, games.name, games.players,
         (SELECT COUNT(*) FROM bookings
           WHERE bookings.game_id = games.id AND bookings.returned_at IS NULL) AS in_use
  FROM games`;

module.exports = (db) => {
  const router = express.Router();

  // GET /games/                 -> all games (with in_use count)
  // GET /games/?players=4       -> games for 4 players
  // GET /games/?search_q=ch     -> games whose name contains "ch"
  // GET /games/?in_use=true     -> only games that are out right now (false = on the shelf)
  router.get('/', async (req, res) => {
    const problem = validateGameSearch(req.query);
    if (problem) return sendError(res, 400, problem);

    const conditions = [];
    const params = [];
    if (req.query.players !== undefined) {
      conditions.push('games.players = ?');
      params.push(Number(req.query.players));
    }
    if (req.query.search_q !== undefined && String(req.query.search_q).trim() !== '') {
      conditions.push('games.name LIKE ?');
      params.push(`%${req.query.search_q}%`);
    }
    if (req.query.in_use !== undefined) {
      conditions.push(
        `${req.query.in_use === 'true' ? '' : 'NOT '}EXISTS (SELECT 1 FROM bookings
           WHERE bookings.game_id = games.id AND bookings.returned_at IS NULL)`
      );
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    try {
      res.status(200).json(await db.all(`${GAME_SELECT} ${where} ORDER BY games.id;`, params));
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

  // POST /games/  -> 201
  router.post('/', async (req, res) => {
    const problem = validateGame(req.body);
    if (problem) return sendError(res, 400, problem);
    const { name, players } = req.body;
    try {
      const result = await db.run('INSERT INTO games (name, players) VALUES (?, ?);', [name.trim(), players]);
      res.status(201).json({ message: 'Game Added Successfully', gameId: result.lastID });
    } catch (error) {
      if (isConstraintError(error, 'UNIQUE')) return sendError(res, 409, 'A game with this name already exists');
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // PUT /games/:gameId/  -> 200
  router.put('/:gameId', async (req, res) => {
    const { gameId } = req.params;
    if (!isValidId(gameId)) return sendError(res, 400, 'gameId must be a positive whole number');
    const problem = validateGame(req.body);
    if (problem) return sendError(res, 400, problem);
    const { name, players } = req.body;
    try {
      const result = await db.run('UPDATE games SET name = ?, players = ? WHERE id = ?;', [name.trim(), players, gameId]);
      if (result.changes === 0) return sendError(res, 404, 'Game Not Found');
      res.status(200).json({ message: 'Game Updated Successfully' });
    } catch (error) {
      if (isConstraintError(error, 'UNIQUE')) return sendError(res, 409, 'A game with this name already exists');
      sendError(res, 500, 'Internal Server Error');
    }
  });

  // DELETE /games/:gameId/  -> 200 (409 if the game has bookings)
  router.delete('/:gameId', async (req, res) => {
    const { gameId } = req.params;
    if (!isValidId(gameId)) return sendError(res, 400, 'gameId must be a positive whole number');
    try {
      const result = await db.run('DELETE FROM games WHERE id = ?;', [gameId]);
      if (result.changes === 0) return sendError(res, 404, 'Game Not Found');
      res.status(200).json({ message: 'Game Deleted Successfully' });
    } catch (error) {
      if (isConstraintError(error, 'FOREIGN KEY')) return sendError(res, 409, 'Game has bookings and cannot be deleted');
      sendError(res, 500, 'Internal Server Error');
    }
  });

  return router;
};
