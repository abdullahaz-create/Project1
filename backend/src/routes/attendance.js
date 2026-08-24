const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/attendance?class=9&date=2024-01-15
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, date, class: classLevel } = req.query;
    const where = {};

    if (studentId) where.studentId = parseInt(studentId);
    if (date) where.date = new Date(date);
    if (classLevel) {
      where.student = { classLevel: parseInt(classLevel) };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { student: { select: { id: true, name: true, classLevel: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/attendance  (upsert single)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { studentId, date, status } = req.body;
    if (!studentId || !date || !status) {
      return res.status(400).json({ error: 'studentId, date, and status are required' });
    }
    if (!['PRESENT', 'ABSENT'].includes(status)) {
      return res.status(400).json({ error: 'status must be PRESENT or ABSENT' });
    }

    const dateObj = new Date(date);

    const record = await prisma.attendance.upsert({
      where: { studentId_date: { studentId: parseInt(studentId), date: dateObj } },
      update: { status },
      create: { studentId: parseInt(studentId), date: dateObj, status },
    });
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/attendance/bulk
router.post('/bulk', auth, adminOnly, async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records array is required' });
    }

    const results = await Promise.all(
      records.map(({ studentId, date, status }) => {
        const dateObj = new Date(date);
        return prisma.attendance.upsert({
          where: { studentId_date: { studentId: parseInt(studentId), date: dateObj } },
          update: { status },
          create: { studentId: parseInt(studentId), date: dateObj, status },
        });
      })
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
