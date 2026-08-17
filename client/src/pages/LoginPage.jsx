import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) { navigate('/', { replace: true }); return null; }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await login(username.trim(), password);
      navigate(data.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <form className="card login-card" onSubmit={handleSubmit} style={{ width:340, maxWidth:'92vw', padding:'28px 26px' }}>
        <h1 style={{ fontSize:17, margin:'0 0 4px' }}>Fila de Retornos</h1>
        <p style={{ fontSize:12.5, color:'var(--text-tertiary)', margin:'0 0 22px' }}>Entre com seu usuário e senha.</p>
        {error && (
          <div style={{ background:'var(--crit-bg)', border:'1px solid var(--crit-border)', color:'var(--crit-text)', borderRadius:8, padding:'9px 12px', fontSize:12.5, marginBottom:16 }}>
            {error}
          </div>
        )}
        <div className="field">
          <label>Usuário</label>
          <input type="text" autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', justifyContent:'center', marginTop:4 }}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
