/* ==================================================================
   AUTENTICAÇÃO — hash de senha (bcrypt) + sessão via JWT em cookie
   httpOnly. Isso é segurança de verdade: a senha nunca é salva em
   texto puro, e o token não fica acessível via JavaScript no navegador
   (protege contra roubo de sessão por XSS).
   ================================================================== */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troque-em-producao';
const TOKEN_TTL = '12h';

function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10);
}

function checkPassword(pw, hash) {
  return bcrypt.compareSync(pw, hash);
}

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch (e) { return null; }
}

module.exports = { hashPassword, checkPassword, signToken, verifyToken };
