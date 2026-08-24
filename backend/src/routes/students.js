const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/students?class=9
router.get('/', auth, async (req, res) => {
  try {
    const classLevel = req.query.class ? parseInt(req.query.class) : undefined;
    const where = classLevel ? { classLevel } : {};
    const students = await prisma.student.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json(students);
  } catch (err) {
    console.error('[students GET]', err);
    res.status(500).json({
      error: 'Server error',
      detail: err.message,
      hint: !process.env.DATABASE_URL
        ? 'DATABASE_URL is not set in Vercel environment variables.'
        : 'Check Vercel function logs for more details.',
    });
  }
});

// GET /api/students/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error('[students GET/:id]', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// POST /api/students
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, classLevel, registrationDate, remarks, subjects } = req.body;
    if (!name || !classLevel) {
      return res.status(400).json({ error: 'Name and classLevel are required' });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured on this server. Go to Vercel → Project Settings → Environment Variables and add DATABASE_URL with your Neon connection string, then redeploy.',
      });
    }
    const student = await prisma.student.create({
      data: {
        name,
        classLevel: parseInt(classLevel),
        registrationDate: registrationDate ? new Date(registrationDate) : new Date(),
        remarks: remarks || null,
        subjects: Array.isArray(subjects) ? subjects : [],
      },
    });
    res.status(201).json(student);
  } catch (err) {
    console.error('[students POST]', err);
    res.status(500).json({
      error: 'Server error',
      detail: err.message,
      hint: !process.env.DATABASE_URL
        ? 'DATABASE_URL environment variable is missing in Vercel.'
        : 'Database may not be initialized. Run: npx prisma db push',
    });
  }
});

// PUT /api/students/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, classLevel, registrationDate, remarks, subjects } = req.body;
    const student = await prisma.student.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(classLevel && { classLevel: parseInt(classLevel) }),
        ...(registrationDate && { registrationDate: new Date(registrationDate) }),
        remarks: remarks !== undefined ? remarks : undefined,
        ...(Array.isArray(subjects) && { subjects }),
      },
    });
    res.json(student);
  } catch (err) {
    console.error('[students PUT]', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await prisma.student.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error('[students DELETE]', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;
