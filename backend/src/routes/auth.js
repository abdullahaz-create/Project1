const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const ADMIN_PASSWORD = '1200';
const MEMBER_PASSWORD = '1000';

// Fallback secret prevents crash when JWT_SECRET is not set in Vercel env vars.
// Override this by adding JWT_SECRET in Vercel Dashboard -> Settings -> Environment Variables.
const JWT_SECRET = process.env.JWT_SECRET || 'unique_science_academy_secure_secret_2026';

router.post('/login', (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const trimmed = String(password).trim();

    let role = null;
    if (trimmed === ADMIN_PASSWORD) role = 'admin';
    else if (trimmed === MEMBER_PASSWORD) role = 'member';

    if (!role) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ role }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, role });
  } catch (err) {
    console.error('[auth/login] Error:', err.message);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
