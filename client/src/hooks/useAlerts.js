import { useState, useEffect } from 'react';
import { AlertsAPI } from '../api/client';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = () => {
    AlertsAPI.list().then(setAlerts).catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    await AlertsAPI.markAsRead(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const clearAll = async (onlyNonUrgent = false) => {
    await AlertsAPI.clearAll(onlyNonUrgent);
    if (onlyNonUrgent) {
      setAlerts(prev => prev.filter(a => a.urgencia === 'Alta'));
    } else {
      setAlerts([]);
    }
  };

  return { alerts, markAsRead, clearAll };
}
