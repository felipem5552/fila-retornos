/* ==================================================================
   PERSISTÊNCIA — Postgres (Neon), com cache em memória.
   Todas as rotas continuam chamando readDb()/writeDb() de forma
   síncrona, exatamente como antes (nenhuma rota precisou mudar).
   O estado inteiro ({users, tasks}) fica em memória (cache) e é
   espelhado no Postgres a cada writeDb(), como um único JSON numa
   tabela key-value — assim os dados sobrevivem a restart/deploy no
   Render, que tem filesystem efêmero.
   ================================================================== */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let cache = null;

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `);

  const { rows } = await pool.query(`SELECT value FROM kv_store WHERE key = 'db'`);
  if (rows.length > 0) {
    cache = rows[0].value;
  } else {
    cache = { users: [], tasks: [] };
    await pool.query(
      `INSERT INTO kv_store (key, value) VALUES ('db', $1::jsonb)`,
      [JSON.stringify(cache)]
    );
  }
}

function readDb() {
  if (cache === null) {
    throw new Error('DB não inicializado: chame init() (await) antes de usar readDb/writeDb.');
  }
  return cache;
}

function writeDb(data) {
  cache = data;
  // Persistência assíncrona "fire-and-forget": a memória já está
  // atualizada na hora (resposta da API não espera o Postgres),
  // e o Postgres é sincronizado em segundo plano.
  pool.query(
    `UPDATE kv_store SET value = $1::jsonb WHERE key = 'db'`,
    [JSON.stringify(data)]
  ).catch(err => {
    console.error('[db] Falha ao persistir no Postgres:', err.message);
  });
}

module.exports = { init, readDb, writeDb };
