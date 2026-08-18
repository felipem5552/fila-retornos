require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { readDb, writeDb } = require('./db');
const { hashPassword } = require('./auth');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const tasksRoutes = require('./routes/tasks.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
const REACT_BUILD_DIR = path.join(__dirname, '..', 'public_react');
const REACT_INDEX = path.join(REACT_BUILD_DIR, 'index.html');

app.use(express.static(REACT_BUILD_DIR));

// Fallback de SPA: qualquer rota que não seja /api/* recebe o index.html do
// React (as rotas do react-router, tipo /admin, são resolvidas no navegador).
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (!fs.existsSync(REACT_INDEX)) {
    return res.status(500).send(
      'Build do front-end não encontrado (public_react/index.html). ' +
      'Rode "npm run build:client" antes de "npm start".'
    );
  }
  res.sendFile(REACT_INDEX);
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);

/* Cria os logins iniciais só na primeiríssima vez que o servidor sobe
   (banco vazio). Depois disso, tudo é gerenciado pelo painel Admin —
   este seed nunca roda de novo nem sobrescreve o que já existe. */
function seedIfEmpty() {
  const db = readDb();
  if (db.users.length > 0) return;

  const now = new Date().toISOString();
  db.users.push(
    { id: crypto.randomUUID(), username: 'admin', nome: 'Administrador', role: 'admin', passwordHash: hashPassword('admin123'), createdAt: now },
    { id: crypto.randomUUID(), username: 'felipe', nome: 'Felipe', role: 'user', passwordHash: hashPassword('poli123'), createdAt: now },
    { id: crypto.randomUUID(), username: 'analista2', nome: 'Analista 2', role: 'user', passwordHash: hashPassword('poli123'), createdAt: now }
  );
  writeDb(db);

  console.log('==================================================================');
  console.log('Logins iniciais criados (troque as senhas depois de entrar):');
  console.log('  admin      / admin123   (acesso ao Painel Admin)');
  console.log('  felipe     / poli123');
  console.log('  analista2  / poli123');
  console.log('==================================================================');
}
seedIfEmpty();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
