const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/exams
router.get('/', auth, async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({ orderBy: { id: 'asc' } });
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
