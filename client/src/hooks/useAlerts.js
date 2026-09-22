import { useState, useEffect } from 'react';
import { AlertsAPI } from '../api/client';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = () => {
      AlertsAPI.list().then(setAlerts).catch(() => {});
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000); // a cada 8s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    await AlertsAPI.markAsRead(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return { alerts, markAsRead };
}
