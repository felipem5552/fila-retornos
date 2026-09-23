const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth, requireApiKey } = require('../middleware');

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

router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    await pool.query(`UPDATE alerts SET read = TRUE WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/read-all?onlyNonUrgent=true — limpa em lote
router.patch('/read-all', requireAuth, async (req, res) => {
  const onlyNonUrgent = req.query.onlyNonUrgent === 'true';
  const query = onlyNonUrgent
    ? `UPDATE alerts SET read = TRUE WHERE read = FALSE AND urgencia != 'Alta'`
    : `UPDATE alerts SET read = TRUE WHERE read = FALSE`;
  try {
    await pool.query(query);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
