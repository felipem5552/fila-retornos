const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { readDb, writeDb } = require('../db');
const { requireAuth } = require('../middleware');

// Todo mundo logado pode usar — mas cada um só enxerga os próprios retornos.
router.use(requireAuth);

router.get('/', (req, res) => {
  const db = readDb();
  res.json(db.tasks.filter(t => t.userId === req.user.id));
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.empresa_id || !body.nome || !body.motivo || !body.data_hora) {
    return res.status(400).json({ error: 'ID, nome, motivo e data/hora são obrigatórios.' });
  }
  const db = readDb();
  const agora = new Date().toISOString();
  const task = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    empresa_id: body.empresa_id,
    nome: body.nome,
    motivo: body.motivo,
    data_hora: new Date(body.data_hora).toISOString(),
    link_chat: body.link_chat || '',
    link_ticket: body.link_ticket || '',
    anotacoes: body.anotacoes || '',
    status: 'Pendente',
    notified: false,
    criado_em: agora,
    concluido_em: null,
    tempo_resolucao_min: null,
    ultima_pendencia: null,
    interacoes: []
  };
  if (body.pendenciaInicial) {
    task.ultima_pendencia = body.pendenciaInicial;
    task.interacoes.push({
      id: crypto.randomUUID(), data: agora, acao: 'criacao',
      definitivo: false, motivo_pendencia: body.pendenciaInicial,
      observacao: 'Definido na criação do retorno.'
    });
  }
  db.tasks.push(task);
  writeDb(db);
  res.status(201).json(task);
});

function findOwned(db, req) {
  const task = db.tasks.find(t => t.id === req.params.id);
  if (!task || task.userId !== req.user.id) return null;
  return task;
}

router.put('/:id', (req, res) => {
  const db = readDb();
  const task = findOwned(db, req);
  if (!task) return res.status(404).json({ error: 'Retorno não encontrado.' });

  const body = req.body || {};
  ['empresa_id', 'nome', 'motivo', 'link_chat', 'link_ticket', 'anotacoes'].forEach(k => {
    if (body[k] !== undefined) task[k] = body[k];
  });
  if (body.data_hora) task.data_hora = new Date(body.data_hora).toISOString();
  task.notified = false;

  writeDb(db);
  res.json(task);
});

router.delete('/:id', (req, res) => {
  const db = readDb();
  const task = findOwned(db, req);
  if (!task) return res.status(404).json({ error: 'Retorno não encontrado.' });
  db.tasks = db.tasks.filter(t => t.id !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
});

/* Endpoint único para as ações de status: concluir (definitivo ou só
   atualização), adiar (rápido ou com motivo) e reabrir. Mantém a mesma
   regra de negócio da versão local: tempo de atendimento é congelado
   no momento da conclusão definitiva, e cada mudança de estado fica
   registrada em "interacoes" para o histórico do card. */
router.post('/:id/action', (req, res) => {
  const db = readDb();
  const task = findOwned(db, req);
  if (!task) return res.status(404).json({ error: 'Retorno não encontrado.' });

  const { tipo, definitivo, motivo_pendencia, observacao, nova_data, minutos } = req.body || {};

  function addInteraction({ acao, definitivo, motivo_pendencia = null, observacao = null }) {
    task.interacoes.push({
      id: crypto.randomUUID(), data: new Date().toISOString(),
      acao, definitivo, motivo_pendencia, observacao
    });
    task.ultima_pendencia = definitivo ? null : (motivo_pendencia || 'Atualização pendente');
  }

  if (tipo === 'concluir' && definitivo) {
    const agora = new Date();
    addInteraction({ acao: 'conclusao', definitivo: true });
    task.status = 'Concluido';
    task.concluido_em = agora.toISOString();
    task.tempo_resolucao_min = task.criado_em ? Math.round((agora - new Date(task.criado_em)) / 60000) : null;
  } else if (tipo === 'concluir' && !definitivo) {
    if (!nova_data) return res.status(400).json({ error: 'Informe o novo horário de acompanhamento.' });
    addInteraction({ acao: 'atualizacao', definitivo: false, motivo_pendencia, observacao });
    task.data_hora = new Date(nova_data).toISOString();
  } else if (tipo === 'adiar_rapido') {
    addInteraction({ acao: 'adiamento', definitivo: true });
    task.data_hora = new Date(new Date(task.data_hora).getTime() + (minutos || 0) * 60000).toISOString();
  } else if (tipo === 'adiar_motivo') {
    if (!nova_data) return res.status(400).json({ error: 'Informe o novo horário.' });
    addInteraction({ acao: 'adiamento', definitivo: false, motivo_pendencia, observacao });
    task.data_hora = new Date(nova_data).toISOString();
  } else if (tipo === 'reabrir') {
    task.status = 'Pendente';
    task.concluido_em = null;
    task.tempo_resolucao_min = null;
    task.ultima_pendencia = null;
  } else {
    return res.status(400).json({ error: 'Tipo de ação inválido.' });
  }

  task.notified = false;
  writeDb(db);
  res.json(task);
});

module.exports = router;
