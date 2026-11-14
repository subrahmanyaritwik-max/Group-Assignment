// BookNook Cafe: Express server setup.
const express = require('express');
const { initDatabase } = require('./database');
const { sendError } = require('./utils');
const guestsRouter = require('./routes/guests');
const gamesRouter = require('./routes/games');
const bookingsRouter = require('./routes/bookings');

const app = express();
app.use(express.json()); // read JSON request bodies

const PORT = process.env.PORT || 3000;

// Open the database first; start the server only if that works.
const startServer = async () => {
  try {
    const db = await initDatabase();

    app.get('/', (req, res) => {
      res.status(200).json({ message: 'BookNook API is running. Try /games, /guests or /bookings' });
    });
    app.use('/guests', guestsRouter(db));
    app.use('/games', gamesRouter(db));
    app.use('/bookings', bookingsRouter(db));

    // Unknown routes -> 404 in the same format
    app.use((req, res) => sendError(res, 404, 'Route Not Found'));

    // Invalid JSON body -> 400, anything else -> 500
    app.use((err, req, res, next) => {
      if (err.type === 'entity.parse.failed') return sendError(res, 400, 'Invalid JSON body');
      sendError(res, 500, 'Internal Server Error');
    });

    app.listen(PORT, () => console.log(`BookNook server running at http://localhost:${PORT}/`));
  } catch (error) {
    console.log(`Startup error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
