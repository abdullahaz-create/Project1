require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/results', require('./routes/results'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/exams', require('./routes/exams'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

const SUBJECT_NAMES = [
  'Physics', 'Chemistry', 'Biology',
  'Mathematics', 'Islamiat', 'English', 'Computer'
];

const EXAM_NAMES = [
  'Monthly Test 1', 'Monthly Test 2', 'Monthly Test 3',
  'Midterm', 'Final Exam'
];

async function seedData() {
  try {
    const prisma = require('./lib/prisma');

    for (const name of SUBJECT_NAMES) {
      await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
    }
    for (const name of EXAM_NAMES) {
      await prisma.exam.upsert({ where: { name }, update: {}, create: { name } });
    }
    console.log('Subjects and exams seeded.');
  } catch (err) {
    console.warn('Seeding skipped (database not connected yet):', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedData();
});
