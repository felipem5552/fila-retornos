import { useCallback, useEffect, useRef, useState } from 'react';
import { TasksAPI } from '../api/client';
import { minutesUntil } from '../utils/format';

const ALARM_REPEAT_MS = 6000;
const SOUND_KEY = 'retornos_sound_v1';
const POLL_MS = 20000;

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ringingQueue, setRingingQueue] = useState([]);

  const soundOnRef = useRef(localStorage.getItem(SOUND_KEY) !== 'off');
  const [soundOn, setSoundOnState] = useState(soundOnRef.current);
  const notifiedRef = useRef(new Set());
  const ringingRef = useRef(new Set());
  const alarmIntervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  const setSoundOn = (v) => {
    soundOnRef.current = v; setSoundOnState(v);
    localStorage.setItem(SOUND_KEY, v ? 'on' : 'off');
  };

  const playAlarmTone = useCallback(() => {
    if (!soundOnRef.current) return;
    try {
      audioCtxRef.current = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      [0, 0.22].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square'; osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.22, now + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset); osc.stop(now + offset + 0.22);
      });
    } catch (e) {}
  }, []);

  const fireAlert = useCallback((task) => {
    ringingRef.current.add(task.id);
    setRingingQueue(Array.from(ringingRef.current));
    if (!alarmIntervalRef.current) {
      playAlarmTone();
      alarmIntervalRef.current = setInterval(playAlarmTone, ALARM_REPEAT_MS);
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(`Hora de retornar para ${task.nome}!`, { body: task.motivo, tag: task.id }); } catch (e) {}
    }
  }, [playAlarmTone]);

  const checkAlerts = useCallback((list) => {
    const pendentes = list.filter(t => t.status === 'Pendente');
    pendentes.forEach(t => {
      if (minutesUntil(t.data_hora) <= 0 && !notifiedRef.current.has(t.id)) {
        notifiedRef.current.add(t.id);
        fireAlert(t);
      }
    });
    ringingRef.current.forEach(id => { if (!pendentes.some(t => t.id === id)) ringingRef.current.delete(id); });
    setRingingQueue(Array.from(ringingRef.current));
    if (ringingRef.current.size === 0 && alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current); alarmIntervalRef.current = null;
    }
  }, [fireAlert]);

  const load = useCallback(async () => {
    const data = await TasksAPI.list();
    setTasks(data);
    setLoading(false);
    checkAlerts(data);
    return data;
  }, [checkAlerts]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    load();
    const id = setInterval(load, POLL_MS);
    return () => { clearInterval(id); if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current); };
  }, [load]);

  const createTask = useCallback(async (body) => {
    const created = await TasksAPI.create(body);
    setTasks(prev => [...prev, created]);
    load();
  }, [load]);
  const updateTask = useCallback(async (id, body) => {
    const updated = await TasksAPI.update(id, body);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    load();
  }, [load]);
  const deleteTask = useCallback(async (id) => { await TasksAPI.remove(id); await load(); }, [load]);
  const runAction = useCallback(async (id, body) => {
    ringingRef.current.delete(id);
    setRingingQueue(Array.from(ringingRef.current));
    await TasksAPI.action(id, body);
    await load();
  }, [load]);
  const dismissAlarm = useCallback((id) => {
    ringingRef.current.delete(id);
    setRingingQueue(Array.from(ringingRef.current));
  }, []);

  return { tasks, loading, soundOn, setSoundOn, ringingQueue, load, createTask, updateTask, deleteTask, runAction, dismissAlarm };
}
