require('dotenv').config();
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const prisma = require('./src/config/prisma');
const authRoutes = require('./src/routes/authRoutes');
const orgRoutes = require('./src/routes/orgRoutes');
const assetRoutes = require('./src/routes/assetRoutes');
const allocationRoutes = require('./src/routes/allocationRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.get('/api/db-check', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', orgRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/allocations', allocationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
