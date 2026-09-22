const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth, requireApiKey } = require('../middleware');

// GET /api/alerts?unread=true — painel logado busca os alertas
router.get('/', requireAuth, async (req, res) => {
  const unreadOnly = req.query.unread === 'true';
  const query = unreadOnly
    ? `SELECT * FROM alerts WHERE read = FALSE ORDER BY created_at DESC`
    : `SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50`;
  try {
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts — chamado pelo n8n (chave de API, não cookie)
router.post('/', requireApiKey, async (req, res) => {
  const { cliente, urgencia, resumo, attendance_uuid } = req.body || {};
  try {
    await pool.query(
      `INSERT INTO alerts (cliente, urgencia, resumo, attendance_uuid) VALUES ($1, $2, $3, $4)`,
      [cliente, urgencia, resumo, attendance_uuid]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/read — painel logado marca como lido
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    await pool.query(`UPDATE alerts SET read = TRUE WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
