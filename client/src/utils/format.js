export const MOTIVOS = ['Financeiro','Suporte','Homologação','Dúvidas','Outros'];
export const MOTIVO_CLASS = {
  'Financeiro':'b-financeiro','Suporte':'b-suporte','Homologação':'b-homologacao',
  'Dúvidas':'b-duvidas','Outros':'b-outros'
};
export const WARNING_MINUTES = 15;
export const STALE_HOURS = 24;

export function formatDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const p = n => String(n).padStart(2,'0');
  return `${p(d.getDate())}/${p(d.getMonth()+1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function formatDuration(min) {
  if (min == null || isNaN(min)) return '—';
  min = Math.max(0, Math.round(min));
  const h = Math.floor(min/60), m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
export function toLocalInputValue(iso) {
  const d = new Date(iso);
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function toDateInputValue(d) {
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
export function minutesUntil(iso) { return Math.round((new Date(iso).getTime() - Date.now()) / 60000); }
export function isSameDay(a,b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
export function isThisWeek(d) {
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate()-now.getDay()); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(start.getDate()+7);
  return d >= start && d < end;
}
export function isThisMonth(d) {
  const now = new Date();
  return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
}
export function urgencyState(iso) {
  const diff = minutesUntil(iso);
  if (diff < 0) return 'critical';
  if (diff <= WARNING_MINUTES) return 'warning';
  return 'normal';
}
export function formatElapsed(hours) {
  if (hours < 1) return 'há poucos minutos';
  if (hours < 24) return `há ${Math.round(hours)}h`;
  const days = Math.floor(hours/24);
  return `há ${days} dia${days>1?'s':''}`;
}
export function getLastPendenciaDate(task) {
  const abertas = (task.interacoes || []).filter(it => it.definitivo === false);
  return abertas.length ? abertas[abertas.length-1].data : null;
}
export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else fallbackCopy(text);
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}
export function csvEscape(v) { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
export function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
export function buildICS(task) {
  const start = new Date(task.data_hora);
  const end = new Date(start.getTime() + 3600000);
  const fmt = d => d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Fila de Retornos//PT-BR','BEGIN:VEVENT',
    `UID:${task.id}@fila-retornos`,`DTSTAMP:${fmt(new Date())}`,`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,
    `SUMMARY:Retorno para ${task.nome} (${task.motivo})`,
    `DESCRIPTION:${(task.anotacoes||'').replace(/\n/g,'\\n')}`,'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
}
export function buildReturnMessage(task) {
  let msg = `Oi ${task.nome}, tudo bem? Passando para dar retorno sobre ${task.motivo.toLowerCase()}.`;
  if (task.anotacoes) msg += ` ${task.anotacoes}`;
  return msg;
}
export function buildCardSummary(task) {
  return `#${task.empresa_id} · ${task.nome} · ${task.motivo} · ${formatDateTime(task.data_hora)}${task.anotacoes ? ' · ' + task.anotacoes : ''}`;
}
export function generateId() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8); }
