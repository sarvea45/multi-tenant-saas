const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes'); // <--- NEW IMPORT

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health Check (MANDATORY)
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed', error);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes); // <--- NEW ROUTE

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error', 
    error: err.message 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});