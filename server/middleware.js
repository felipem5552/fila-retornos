const { verifyToken } = require('./auth');

/* Exige que exista um cookie de sessão válido. Preenche req.user com
   { id, username, role } a partir do token — nunca confia em nada que
   venha do corpo da requisição para identificar quem está logado. */
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Não autenticado. Faça login novamente.' });
  req.user = payload;
  next();
}

/* Só deixa passar se o usuário autenticado for admin. Sempre usado
   depois de requireAuth. */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Ação restrita ao administrador.' });
  }
  next();
}

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.ALERTS_API_KEY) {
    return res.status(401).json({ error: 'Chave de API inválida ou ausente.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireApiKey };
