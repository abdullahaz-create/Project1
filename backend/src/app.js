require('dotenv').config();
const express = require('express');
const cors = require('cors');

function createApp() {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/students', require('./routes/students'));
  app.use('/api/attendance', require('./routes/attendance'));
  app.use('/api/results', require('./routes/results'));
  app.use('/api/fees', require('./routes/fees'));
  app.use('/api/exams', require('./routes/exams'));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}

module.exports = createApp;
