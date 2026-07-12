const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.stack);
    process.exit(1);
  } else {
    console.log('Database connection successful!');
    client.query('SELECT NOW()', (err, result) => {
      release();
      if (err) {
        console.error('Query error:', err.stack);
      } else {
        console.log('Current time:', result.rows[0]);
      }
      process.exit(0);
    });
  }
});