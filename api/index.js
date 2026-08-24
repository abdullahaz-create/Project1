// Vercel Serverless Function — entry point for all /api/* routes
const path = require('path');

// Load .env only in local development (Vercel uses dashboard env vars)
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
}

const createApp = require('../backend/src/app');
const app = createApp();

const SUBJECT_NAMES = [
  'Physics', 'Chemistry', 'Biology',
  'Mathematics', 'Islamiat', 'English', 'Computer'
];
const EXAM_NAMES = [
  'Monthly Test 1', 'Monthly Test 2', 'Monthly Test 3',
  'Midterm', 'Final Exam'
];

// Seed on cold start (runs once per serverless instance)
let seeded = false;
async function seedData() {
  if (seeded) return;
  try {
    const prisma = require('../backend/src/lib/prisma');
    for (const name of SUBJECT_NAMES) {
      await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
    }
    for (const name of EXAM_NAMES) {
      await prisma.exam.upsert({ where: { name }, update: {}, create: { name } });
    }
    seeded = true;
    console.log('[Vercel] Subjects and exams seeded.');
  } catch (err) {
    console.warn('[Vercel] Seeding skipped:', err.message);
  }
}

// Run seeding immediately (async, non-blocking)
seedData();

module.exports = app;
