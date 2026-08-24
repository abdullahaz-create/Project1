require('dotenv').config();
const express = require('express');
const cors = require('cors');

function createApp() {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Diagnostic endpoint — call /api/health to check DB connection
  app.get('/api/health', async (req, res) => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return res.status(500).json({
        status: 'error',
        message: 'DATABASE_URL environment variable is not set in Vercel. Go to Project Settings → Environment Variables and add DATABASE_URL.',
        jwt: process.env.JWT_SECRET ? 'set' : 'missing',
      });
    }
    try {
      const prisma = require('./lib/prisma');
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        database: 'connected',
        jwt: process.env.JWT_SECRET ? 'set' : 'missing (using fallback)',
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        database: 'connection failed',
        message: err.message,
        hint: 'Make sure DATABASE_URL is correct and npx prisma db push has been run.',
      });
    }
  });

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/students', require('./routes/students'));
  app.use('/api/attendance', require('./routes/attendance'));
  app.use('/api/results', require('./routes/results'));
  app.use('/api/fees', require('./routes/fees'));
  app.use('/api/exams', require('./routes/exams'));

  return app;
}

module.exports = createApp;
