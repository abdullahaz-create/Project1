// Vercel Serverless Function — entry point for all /api/* routes
const path = require('path');

// Load .env for local development.
// On Vercel, env vars come from the dashboard — dotenv is a no-op if already set.
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Safety check — warn loudly if critical env vars are missing.
if (!process.env.JWT_SECRET) {
  console.warn('[api/index] WARNING: JWT_SECRET is not set. Using insecure fallback. Set it in Vercel Environment Variables.');
  process.env.JWT_SECRET = 'unique_science_academy_secure_secret_2026';
}
if (!process.env.DATABASE_URL) {
  console.warn('[api/index] WARNING: DATABASE_URL is not set. Database operations will fail.');
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

seedData();

module.exports = app;
