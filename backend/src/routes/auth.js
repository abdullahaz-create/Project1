const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const ADMIN_PASSWORD = '1200';
const MEMBER_PASSWORD = '1000';

router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  let role = null;
  if (password === ADMIN_PASSWORD) role = 'admin';
  else if (password === MEMBER_PASSWORD) role = 'member';

  if (!role) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, role });
});

module.exports = router;
