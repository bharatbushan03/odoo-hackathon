require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Plain health check - no DB dependency, proves the server itself is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

// DB health check - proves the full chain: server -> network -> Postgres
app.get('/api/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ status: 'ok', db_time: result.rows[0].current_time });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Tiny CRUD proof - create table on boot, return a row, so judges (or you)
// see actual data round-tripping through Postgres, not just a ping
app.get('/api/hello', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS greetings (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`INSERT INTO greetings (message) VALUES ('hello from postgres')`);
    const result = await pool.query('SELECT * FROM greetings ORDER BY id DESC LIMIT 5');
    res.json({ status: 'ok', rows: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
