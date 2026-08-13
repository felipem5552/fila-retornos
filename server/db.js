/* ==================================================================
   PERSISTÊNCIA — arquivo JSON simples em disco.
   Escolhido no lugar de um banco "de verdade" (Postgres/SQLite nativo)
   para não depender de nenhuma dependência nativa/compilação, o que
   facilita rodar em qualquer host (Render, Railway, VPS, etc) sem dor
   de cabeça. Para uma equipe pequena/média isso é suficiente. Se um
   dia o volume crescer muito, trocar por Postgres é uma migração
   localizada só neste arquivo — o resto do app não muda.
   ================================================================== */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], tasks: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readDb, writeDb };
