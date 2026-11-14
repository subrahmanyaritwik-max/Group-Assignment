// Opens the SQLite database, turns on foreign keys and makes sure the tables exist.
const fs = require('fs');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const initDatabase = async () => {
  const db = await open({ filename: path.join(__dirname, 'booknook.db'), driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON;'); // SQLite ignores foreign keys unless this is on
  await db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  return db;
};

module.exports = { initDatabase };
