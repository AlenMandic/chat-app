const sqlite3 = require('sqlite3').verbose();
require('dotenv').config()

const dbPath = process.env.DB_PATH

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`Connected to the SQLite database: ${dbPath}`);
      // create the initial DB table if it doesn't already exist, for storing messages.
    }
  });
  
  module.exports = db;