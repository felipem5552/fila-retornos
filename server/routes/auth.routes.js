const express = require('express');
const router = express.Router();
const { readDb } = require('../db');
const { checkPassword, signToken } = require('../auth');
const { requireAuth } = require('../middleware');

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha.' });
  }

  const db = readDb();
  const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());

  if (!user || !checkPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }

  const token = signToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 12 * 3600 * 1000
  });
  res.json({ username: user.username, role: user.role, nome: user.nome });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ username: user.username, role: user.role, nome: user.nome });
});

module.exports = router;
