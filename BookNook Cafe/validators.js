// Input checks. Each function returns an error message, or null when the input is fine.
const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const isWholeNumber = (v) => typeof v === 'number' && Number.isInteger(v);

// Games: name (text) and players (whole number from 1 to 20)
const validateGame = (body) => {
  const { name, players } = body || {};
  if (!isNonEmptyString(name)) return 'name is required and must be a non-empty string';
  if (name.trim().length > 50) return 'name must be 50 characters or fewer';
  if (!isWholeNumber(players) || players < 1 || players > 20) {
    return 'players is required and must be a whole number from 1 to 20';
  }
  return null;
};

// Guests: name (required), phone (optional text)
const validateGuest = (body) => {
  const { name, phone } = body || {};
  if (!isNonEmptyString(name)) return 'name is required and must be a non-empty string';
  if (phone !== undefined && phone !== null && typeof phone !== 'string') {
    return 'phone must be a string when provided';
  }
  return null;
};

// Bookings: guest_id and game_id (positive whole numbers)
const validateBooking = (body) => {
  const { guest_id, game_id } = body || {};
  if (!isWholeNumber(guest_id) || guest_id < 1) return 'guest_id is required and must be a positive whole number';
  if (!isWholeNumber(game_id) || game_id < 1) return 'game_id is required and must be a positive whole number';
  return null;
};

// Game search: ?players=4 and ?in_use=true
const validateGameSearch = (query) => {
  if (query.players !== undefined && !/^[1-9]\d*$/.test(String(query.players))) {
    return 'players must be a positive whole number';
  }
  if (query.in_use !== undefined && !['true', 'false'].includes(query.in_use)) {
    return 'in_use must be true or false';
  }
  return null;
};

module.exports = { validateGame, validateGuest, validateBooking, validateGameSearch };
