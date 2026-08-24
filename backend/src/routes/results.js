const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/results/subjects
router.get('/subjects', auth, async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/results?studentId=1&class=9
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, class: classLevel, examId } = req.query;
    const where = {};

    if (studentId) where.studentId = parseInt(studentId);
    if (classLevel) where.student = { classLevel: parseInt(classLevel) };
    if (examId) where.examId = parseInt(examId);

    const results = await prisma.result.findMany({
      where,
      include: {
        subject: true,
        exam: true,
        student: { select: { id: true, name: true, classLevel: true } },
      },
      orderBy: [{ exam: { id: 'asc' } }, { subject: { name: 'asc' } }],
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/results (upsert single)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { studentId, examId, subjectId, obtainedMarks, totalMarks } = req.body;
    if (!studentId || !examId || !subjectId || obtainedMarks === undefined || totalMarks === undefined) {
      return res.status(400).json({ error: 'studentId, examId, subjectId, obtainedMarks, totalMarks are required' });
    }

    const result = await prisma.result.upsert({
      where: {
        studentId_examId_subjectId: {
          studentId: parseInt(studentId),
          examId: parseInt(examId),
          subjectId: parseInt(subjectId),
        }
      },
      update: { obtainedMarks: parseFloat(obtainedMarks), totalMarks: parseFloat(totalMarks) },
      create: {
        studentId: parseInt(studentId),
        examId: parseInt(examId),
        subjectId: parseInt(subjectId),
        obtainedMarks: parseFloat(obtainedMarks),
        totalMarks: parseFloat(totalMarks),
      },
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/results/bulk — save all subjects for a student + exam
router.post('/bulk', auth, adminOnly, async (req, res) => {
  try {
    const { studentId, examId, results } = req.body;
    if (!studentId || !examId || !Array.isArray(results)) {
      return res.status(400).json({ error: 'studentId, examId, and results array are required' });
    }

    const saved = await Promise.all(
      results.map(({ subjectId, obtainedMarks, totalMarks }) =>
        prisma.result.upsert({
          where: {
            studentId_examId_subjectId: {
              studentId: parseInt(studentId),
              examId: parseInt(examId),
              subjectId: parseInt(subjectId),
            }
          },
          update: { obtainedMarks: parseFloat(obtainedMarks), totalMarks: parseFloat(totalMarks) },
          create: {
            studentId: parseInt(studentId),
            examId: parseInt(examId),
            subjectId: parseInt(subjectId),
            obtainedMarks: parseFloat(obtainedMarks),
            totalMarks: parseFloat(totalMarks),
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
