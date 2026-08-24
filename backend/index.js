// Vercel Services entrypoint — exports Express app (no app.listen)
require('dotenv').config();

// Ensure JWT_SECRET is always set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'unique_science_academy_secure_secret_2026';
}

const createApp = require('./src/app');
const app = createApp();

const SUBJECT_NAMES = [
  'Physics', 'Chemistry', 'Biology',
  'Mathematics', 'Islamiat', 'English', 'Computer'
];
const EXAM_NAMES = [
  'Monthly Test 1', 'Monthly Test 2', 'Monthly Test 3',
  'Midterm', 'Final Exam'
];

let seeded = false;
async function seedData() {
  if (seeded) return;
  try {
    const prisma = require('./src/lib/prisma');
    for (const name of SUBJECT_NAMES) {
      await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
    }
    for (const name of EXAM_NAMES) {
      await prisma.exam.upsert({ where: { name }, update: {}, create: { name } });
    }
    seeded = true;
    console.log('[Vercel] Seeded subjects and exams.');
  } catch (err) {
    console.warn('[Vercel] Seeding skipped:', err.message);
  }
}

seedData();

module.exports = app;
