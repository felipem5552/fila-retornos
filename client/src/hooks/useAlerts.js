import { useState, useEffect } from 'react';
import api from '../api/client';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = () => {
      api.get('/alerts?unread=true').then(res => setAlerts(res.data));
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000); // a cada 8s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    await api.patch(`/alerts/${id}/read`);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return { alerts, markAsRead };
}
