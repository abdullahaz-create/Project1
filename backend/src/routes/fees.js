const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/fees?class=9&month=1&year=2024
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, month, year, class: classLevel } = req.query;
    const where = {};

    if (studentId) where.studentId = parseInt(studentId);
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (classLevel) where.student = { classLevel: parseInt(classLevel) };

    const fees = await prisma.fee.findMany({
      where,
      include: { student: { select: { id: true, name: true, classLevel: true } } },
      orderBy: { student: { name: 'asc' } },
    });
    res.json(fees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/fees  (upsert)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { studentId, month, year, amount, isPaid } = req.body;
    if (!studentId || !month || !year) {
      return res.status(400).json({ error: 'studentId, month, year are required' });
    }

    const fee = await prisma.fee.upsert({
      where: {
        studentId_month_year: {
          studentId: parseInt(studentId),
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      update: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(isPaid !== undefined && { isPaid: Boolean(isPaid) }),
      },
      create: {
        studentId: parseInt(studentId),
        month: parseInt(month),
        year: parseInt(year),
        amount: amount !== undefined ? parseFloat(amount) : 0,
        isPaid: isPaid !== undefined ? Boolean(isPaid) : false,
      },
      include: { student: { select: { id: true, name: true, classLevel: true } } },
    });
    res.json(fee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/fees/bulk
router.post('/bulk', auth, adminOnly, async (req, res) => {
  try {
    const { fees } = req.body;
    if (!Array.isArray(fees)) {
      return res.status(400).json({ error: 'fees array is required' });
    }

    const saved = await Promise.all(
      fees.map(({ studentId, month, year, amount, isPaid }) =>
        prisma.fee.upsert({
          where: {
            studentId_month_year: {
              studentId: parseInt(studentId),
              month: parseInt(month),
              year: parseInt(year),
            },
          },
          update: {
            ...(amount !== undefined && { amount: parseFloat(amount) }),
            ...(isPaid !== undefined && { isPaid: Boolean(isPaid) }),
          },
          create: {
            studentId: parseInt(studentId),
            month: parseInt(month),
            year: parseInt(year),
            amount: amount !== undefined ? parseFloat(amount) : 0,
            isPaid: isPaid !== undefined ? Boolean(isPaid) : false,
          },
        })
      )
    );
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
