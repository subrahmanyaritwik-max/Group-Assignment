// Rebuilds booknook.db from schema.sql + seed.sql.  Run:  node seed.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const dbFile = path.join(__dirname, 'booknook.db');
if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
const db = new sqlite3.Database(dbFile);
const sql = ['schema.sql', 'seed.sql'].map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
db.exec(sql, (error) => {
  if (error) { console.log(`Seed error: ${error.message}`); process.exit(1); }
  console.log('booknook.db created with guests, games and bookings.');
  db.close();
});
