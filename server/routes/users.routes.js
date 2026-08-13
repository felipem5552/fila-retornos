const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { readDb, writeDb } = require('../db');
const { hashPassword } = require('../auth');
const { requireAuth, requireAdmin } = require('../middleware');

// Todas as rotas deste arquivo exigem estar logado E ser admin.
router.use(requireAuth, requireAdmin);

router.get('/', (req, res) => {
  const db = readDb();
  res.json(db.users.map(u => ({ id: u.id, username: u.username, role: u.role, nome: u.nome, createdAt: u.createdAt })));
});

router.post('/', (req, res) => {
  const { username, password, nome, role } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }
  const db = readDb();
  if (db.users.some(u => u.username.toLowerCase() === String(username).toLowerCase())) {
    return res.status(409).json({ error: 'Já existe um usuário com esse login.' });
  }
  const user = {
    id: crypto.randomUUID(),
    username: String(username).trim(),
    nome: nome || username,
    role: role === 'admin' ? 'admin' : 'user',
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDb(db);
  res.status(201).json({ id: user.id, username: user.username, role: user.role, nome: user.nome });
});

router.put('/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const { nome, role, password } = req.body || {};
  if (nome) user.nome = nome;
  if (role) user.role = role === 'admin' ? 'admin' : 'user';
  if (password) user.passwordHash = hashPassword(password);

  writeDb(db);
  res.json({ id: user.id, username: user.username, role: user.role, nome: user.nome });
});

router.delete('/:id', (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário.' });
  }
  const db = readDb();
  const before = db.users.length;
  db.users = db.users.filter(u => u.id !== req.params.id);
  if (db.users.length === before) return res.status(404).json({ error: 'Usuário não encontrado.' });

  // Remove também os retornos que pertenciam a esse usuário.
  db.tasks = db.tasks.filter(t => t.userId !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
});

module.exports = router;
