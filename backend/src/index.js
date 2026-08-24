require('dotenv').config();
const createApp = require('./app');

const app = createApp();
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
    console.warn('Seeding skipped (database not connected):', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await seedData();
});
