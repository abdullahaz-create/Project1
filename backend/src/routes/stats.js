const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const ALL_SUBJECTS = ['Math', 'Physics', 'Urdu', 'Computer', 'Chemistry', 'Bio', 'ISL'];
const CLASS_LEVELS = [9, 10, 11, 12];

// GET /api/stats
// Returns per-class student totals and per-class per-subject counts
router.get('/', auth, async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: { id: true, classLevel: true, subjects: true },
    });

    const classSummary = {};
    CLASS_LEVELS.forEach(c => {
      classSummary[c] = { totalStudents: 0, subjects: {} };
      ALL_SUBJECTS.forEach(s => { classSummary[c].subjects[s] = 0; });
    });

    students.forEach(student => {
      const cl = student.classLevel;
      if (!classSummary[cl]) return;
      classSummary[cl].totalStudents += 1;
      (student.subjects || []).forEach(sub => {
        if (classSummary[cl].subjects[sub] !== undefined) {
          classSummary[cl].subjects[sub] += 1;
        }
      });
    });

    // Overall totals
    const overall = {
      totalStudents: students.length,
      subjects: {},
    };
    ALL_SUBJECTS.forEach(s => {
      overall.subjects[s] = students.filter(st => (st.subjects || []).includes(s)).length;
    });

    res.json({ classSummary, overall, allSubjects: ALL_SUBJECTS, classLevels: CLASS_LEVELS });
  } catch (err) {
    console.error('[stats GET]', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;
