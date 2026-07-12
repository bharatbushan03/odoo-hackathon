require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use('/api', apiLimiter);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.get('/api/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ status: 'ok', db_time: result.rows[0].current_time });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

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

app.use('/api', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
