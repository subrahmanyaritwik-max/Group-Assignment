// Small helpers shared by all routes.

// Every error response has the same shape: { "message": "..." }
const sendError = (res, status, message) => res.status(status).json({ message });

// A valid id is a positive whole number written with digits only ("3", not "3abc").
const isValidId = (value) => /^[1-9]\d*$/.test(String(value));

// Tells whether a database error is a UNIQUE / FOREIGN KEY constraint failure.
const isConstraintError = (error, text) =>
  Boolean(error && typeof error.message === 'string' && error.message.includes(text));

module.exports = { sendError, isValidId, isConstraintError };
