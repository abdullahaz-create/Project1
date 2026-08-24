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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/students
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, classLevel, registrationDate, remarks } = req.body;
    if (!name || !classLevel) {
      return res.status(400).json({ error: 'Name and classLevel are required' });
    }
    const student = await prisma.student.create({
      data: {
        name,
        classLevel: parseInt(classLevel),
        registrationDate: registrationDate ? new Date(registrationDate) : new Date(),
        remarks: remarks || null,
      },
    });
    res.status(201).json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/students/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, classLevel, registrationDate, remarks } = req.body;
    const student = await prisma.student.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(classLevel && { classLevel: parseInt(classLevel) }),
        ...(registrationDate && { registrationDate: new Date(registrationDate) }),
        remarks: remarks !== undefined ? remarks : undefined,
      },
    });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
