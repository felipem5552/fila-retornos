export async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro inesperado.');
  return data;
}

export const AuthAPI = {
  login: (username, password) => api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => api('/api/auth/logout', { method: 'POST' }),
  me: () => api('/api/auth/me')
};

export const TasksAPI = {
  list: () => api('/api/tasks'),
  create: (body) => api('/api/tasks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => api(`/api/tasks/${id}`, { method: 'DELETE' }),
  action: (id, body) => api(`/api/tasks/${id}/action`, { method: 'POST', body: JSON.stringify(body) })
};

export const UsersAPI = {
  list: () => api('/api/users'),
  create: (body) => api('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => api(`/api/users/${id}`, { method: 'DELETE' })
};
