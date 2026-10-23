
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { somatotype } from '../lib/calculations';
import './ConsultationPdf.css';

const dateLabel = (value) => value ? new Date(value).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin fecha';
const imc = (weight, height) => weight && height ? (Number(weight) / ((Number(height) / 100) ** 2)).toFixed(1) : null;
const waist = (consultation) => consultation?.measures?.perimetros?.cintura ?? null;
const showText = (value) => String(value ?? '').trim() || 'Sin indicaciones registradas.';
const CATEGORY_LABELS = [
  'Central', 'Endomorfo balanceado', 'Endomorfo mesomórfico', 'Mesomorfo-endomorfo',
  'Mesomorfo endomórfico', 'Mesomorfo balanceado', 'Mesomorfo ectomórfico', 'Mesomorfo-ectomorfo',
  'Ectomorfo mesomórfico', 'Ectomorfo balanceado', 'Endomorfo ectomórfico', 'Endomorfo-ectomorfo', 'Endomorfo ectomórfico',
];

function classifySomatotype({ endo, meso, ecto }) {
  const max = Math.max(endo, meso, ecto);
  const min = Math.min(endo, meso, ecto);
  if (max - min <= 1) return CATEGORY_LABELS[0];
  const sorted = [endo, meso, ecto].sort((a, b) => b - a);
  if (sorted[0] - sorted[1] <= 0.5) {
    if (Math.abs(endo - meso) <= 0.5 && ecto < Math.min(endo, meso)) return CATEGORY_LABELS[3];
    if (Math.abs(meso - ecto) <= 0.5 && endo < Math.min(meso, ecto)) return CATEGORY_LABELS[7];
    if (Math.abs(endo - ecto) <= 0.5 && meso < Math.min(endo, ecto)) return CATEGORY_LABELS[11];
  }
  if (endo > meso && endo > ecto) return Math.abs(meso - ecto) <= 0.5 ? CATEGORY_LABELS[1] : meso > ecto ? CATEGORY_LABELS[2] : CATEGORY_LABELS[12];
  if (meso > endo && meso > ecto) return Math.abs(endo - ecto) <= 0.5 ? CATEGORY_LABELS[5] : endo > ecto ? CATEGORY_LABELS[4] : CATEGORY_LABELS[6];
  if (ecto > endo && ecto > meso) return Math.abs(endo - meso) <= 0.5 ? CATEGORY_LABELS[9] : endo > meso ? CATEGORY_LABELS[10] : CATEGORY_LABELS[8];
  return CATEGORY_LABELS[0];
}

function SomatotypeChart({ points, brandColor }) {
  const unit = 14;
  const pad = 22;
  const px = (x) => pad + (x + 8) * unit;
  const py = (y) => pad + (16 - y) * unit;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const coords = points.map(({ s }) => ({ cx: px(clamp(s.x, -8, 8)), cy: py(clamp(s.y, -8, 16)) }));
  return <svg viewBox="0 0 260 380" role="img" aria-label="Gráfica del somatotipo Heath-Carter" className="pdf-somato-chart">
    {Array.from({ length: 9 }, (_, i) => -8 + i * 2).map((x) => <line key={`x${x}`} x1={px(x)} y1={py(16)} x2={px(x)} y2={py(-8)} stroke={x === 0 ? '#9ca3af' : '#e5e7eb'} />)}
    {Array.from({ length: 13 }, (_, i) => -8 + i * 2).map((y) => <line key={`y${y}`} x1={px(-8)} y1={py(y)} x2={px(8)} y2={py(y)} stroke={y === 0 ? '#9ca3af' : '#e5e7eb'} />)}
    <text x={px(0)} y="14" textAnchor="middle" fontSize="10" fill="#374151">Mesomorfia</text>
    <text x={px(-8)} y="374" fontSize="10" fill="#374151">Endomorfia</text>
    <text x={px(8)} y="374" textAnchor="end" fontSize="10" fill="#374151">Ectomorfia</text>
    {coords.length > 1 && <polyline points={coords.map(({ cx, cy }) => `${cx},${cy}`).join(' ')} fill="none" stroke={brandColor} strokeOpacity=".45" strokeWidth="2" />}
    {coords.map(({ cx, cy }, i) => <circle key={points[i].c.id} cx={cx} cy={cy} r={i === coords.length - 1 ? 5 : 3} fill={brandColor} />)}
  </svg>;
}

export default function ConsultationPdf({ patient, consultation, consultations, onClose }) {
  const [plans, setPlans] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [nutritionist, setNutritionist] = useState(null);
  const [report, setReport] = useState(() => ({ showMetrics: true, ...consultation.patientReport }));
  const [includeClinicalNote, setIncludeClinicalNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const history = useMemo(() => [...consultations].sort((a, b) => new Date(a.date) - new Date(b.date)), [consultations]);
  const previous = [...history].reverse().find((item) => item.id !== consultation.id && new Date(item.date) < new Date(consultation.date));
  const consultationNumber = history.filter((item) => new Date(item.date) <= new Date(consultation.date)).findIndex((item) => item.id === consultation.id) + 1;

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`/patients/${patient.id}/meal-plans`),
      api.get('/appointments', { params: { from: new Date(consultation.date).toISOString(), to: new Date(new Date(consultation.date).getTime() + 90 * 86400000).toISOString() } }),
      api.get('/auth/account'),
    ]).then(([planResponse, appointmentResponse, accountResponse]) => {
      if (!active) return;
      const eligible = planResponse.data.filter((plan) => new Date(plan.startDate) <= new Date(consultation.date));
      setPlans(eligible.slice(0, 1));
      setAppointment(appointmentResponse.data.find((item) => item.patientId === patient.id && item.status === 'SCHEDULED') ?? null);
      setNutritionist(accountResponse.data.user);
    }).catch(() => {}).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [patient.id, consultation.date]);

  const comparison = [
    ['Peso', 'weightKg', 'kg'], ['Talla', 'heightCm', 'cm'], ['IMC', '__imc', ''],
    ['Grasa corporal', 'bodyFatPct', '%'], ['Masa muscular', 'bodyMusclePct', '%'],
    ['Cintura', '__cintura', 'cm'], ['Cadera', '__cadera', 'cm'],
  ].map(([label, key, unit]) => {
    const value = key === '__imc' ? imc(consultation.weightKg, consultation.heightCm) : key === '__cintura' ? waist(consultation) : key === '__cadera' ? consultation.measures?.perimetros?.cadera ?? null : consultation[key];
    const old = !previous ? null : key === '__imc' ? imc(previous.weightKg, previous.heightCm) : key === '__cintura' ? waist(previous) : key === '__cadera' ? previous.measures?.perimetros?.cadera ?? null : previous[key];
    const delta = value != null && old != null ? (Number(value) - Number(old)).toFixed(1) : null;
    return { label, value, old, delta, unit };
  }).filter((item) => item.value != null);
  const diet = plans[0];
  const name = nutritionist?.name || 'Nutrióloga';
  const weightHistory = history.filter((item) => item.weightKg != null && new Date(item.date) <= new Date(consultation.date));
  const weightPoints = weightHistory.map((item, index) => {
    const values = weightHistory.map((entry) => Number(entry.weightKg));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const x = weightHistory.length === 1 ? 50 : 5 + (index / (weightHistory.length - 1)) * 90;
    const y = max === min ? 20 : 38 - ((Number(item.weightKg) - min) / (max - min)) * 32;
    return `${x},${y}`;
  }).join(' ');
  const somatotypeHistory = history.filter((item) => new Date(item.date) <= new Date(consultation.date)).map((c) => ({ c, s: somatotype(c) })).filter(({ s }) => !s.missing);
  const currentSomatotype = somatotypeHistory.find(({ c }) => c.id === consultation.id) ?? somatotypeHistory[somatotypeHistory.length - 1];

  async function saveReport() {
    setSaving(true);
    setSaveMessage('');
    try {
      await api.put(`/consultations/${consultation.id}`, { patientReport: report });
      setSaveMessage('Cambios guardados en el expediente.');
      return true;
    } catch (error) {
      setSaveMessage(error.response?.data?.error || 'No se pudieron guardar los cambios.');
      return false;
    } finally { setSaving(false); }
  }
  async function saveAndPrint() { if (await saveReport()) window.print(); }
  const setField = (key, value) => setReport((current) => ({ ...current, [key]: value }));
  const textEditor = (key, label, rows = 3) => <label className="pdf-editable"><span>{label}</span><textarea value={report[key] ?? ''} onChange={(event) => setField(key, event.target.value)} rows={rows} /></label>;

  return <div className="consultation-pdf-overlay" role="dialog" aria-modal="true" aria-label="Vista previa del PDF">
    <div className="consultation-pdf-toolbar"><strong>Vista previa del reporte</strong><div>{saveMessage && <span role="status">{saveMessage}</span>}<button type="button" onClick={saveReport} disabled={saving}>{saving ? 'Guardando…' : 'Guardar en expediente'}</button><button type="button" onClick={saveAndPrint} disabled={saving}>{saving ? 'Guardando…' : 'Guardar como PDF / Imprimir'}</button><button type="button" onClick={onClose}>Cerrar</button></div></div>
    <article className="consultation-pdf-sheet" style={{ '--pdf-brand': nutritionist?.brandColor || '#047857' }}>
      <header className="pdf-header"><div className="pdf-practitioner">{nutritionist?.logoUrl && <img src={nutritionist.logoUrl} alt="Logo profesional" />}<div><p className="pdf-eyebrow">REPORTE DE CONSULTA NUTRICIONAL</p><h1>{name}</h1><p>{nutritionist?.professionalLicense ? `Cédula profesional: ${nutritionist.professionalLicense} · ` : ''}{nutritionist?.email || ''}{nutritionist?.whatsapp ? ` · WhatsApp: ${nutritionist.whatsapp}` : ''}</p></div></div><div className="pdf-patient"><b>{patient.firstName} {patient.lastName}</b><span>Consulta #{consultationNumber} · {dateLabel(consultation.date)}</span></div></header>
      <section><h2>Resumen de la consulta</h2><p><b>Motivo:</b> {report.reason || patient.goal || 'Por definir'}</p><p><b>Objetivo acordado:</b> {report.objective || patient.goal || 'Por definir'}</p>
        <label className="pdf-option"><input type="checkbox" checked={report.showMetrics !== false} onChange={(event) => setField('showMetrics', event.target.checked)} /> Incluir mediciones</label>
        {report.showMetrics !== false && <table className="pdf-table"><thead><tr><th>Medición</th><th>Hoy</th><th>Anterior</th><th>Diferencia</th></tr></thead><tbody>{comparison.map((item) => <tr key={item.label}><td>{item.label}</td><td>{item.value}{item.unit ? ` ${item.unit}` : ''}</td><td>{item.old ?? '—'}{item.old != null && item.unit ? ` ${item.unit}` : ''}</td><td>{item.delta == null ? '—' : `${Number(item.delta) > 0 ? '+' : ''}${item.delta}${item.unit ? ` ${item.unit}` : ''}`}</td></tr>)}</tbody></table>}
        {report.showMetrics !== false && weightHistory.length > 1 && <div className="pdf-progress"><b>Progreso de peso</b><svg viewBox="0 0 100 44" role="img" aria-label="Gráfica de progreso del peso"><polyline points={weightPoints} fill="none" stroke={nutritionist?.brandColor || '#047857'} strokeWidth="2" />{weightHistory.map((item, index) => { const [cx, cy] = weightPoints.split(' ')[index].split(','); return <circle key={item.id} cx={cx} cy={cy} r="2" fill={nutritionist?.brandColor || '#047857'} />; })}</svg><div>{weightHistory.map((item) => <span key={item.id}>{dateLabel(item.date)}: {item.weightKg} kg</span>)}</div></div>}
        {report.showMetrics !== false && <div className="pdf-somatotype"><h3>Tipo de cuerpo (somatotipo Heath‑Carter)</h3>{currentSomatotype ? <><p className="pdf-somatotype-result"><b>{currentSomatotype.s.endo} – {currentSomatotype.s.meso} – {currentSomatotype.s.ecto}</b><span>{classifySomatotype(currentSomatotype.s)}</span></p><p>Endomorfia {currentSomatotype.s.endo} · Mesomorfia {currentSomatotype.s.meso} · Ectomorfia {currentSomatotype.s.ecto}. Consulta del {dateLabel(currentSomatotype.c.date)}.</p><SomatotypeChart points={somatotypeHistory} brandColor={nutritionist?.brandColor || '#047857'} /></> : <p>No hay medidas suficientes para calcular el somatotipo de esta consulta.</p>}</div>}
        {textEditor('patientNote', 'Observación breve para el paciente')}
        <p className="pdf-print-value">{showText(report.patientNote)}</p>
        <label className="pdf-option"><input type="checkbox" checked={includeClinicalNote} onChange={(event) => setIncludeClinicalNote(event.target.checked)} /> Incluir nota clínica privada en este PDF</label>
        {includeClinicalNote && <p className="pdf-print-value">{consultation.notes || 'No hay nota clínica registrada.'}</p>}
      </section>
      {report.includeMacros && <section><h2>Información nutricional</h2><p><b>Calorías:</b> {report.calories || 'Sin especificar'}</p><p><b>Macronutrientes:</b> {report.macros || 'Sin especificar'}</p></section>}
      <section><h2>Plan de alimentación</h2>{diet ? <><h3>{diet.title}</h3>{(diet.content?.meals ?? []).map((meal, index) => <div className="pdf-meal" key={`${meal.name}-${index}`}><b>{meal.name}{meal.time ? ` · ${meal.time}` : ''}</b><ul>{(meal.foods ?? []).map((food, fi) => <li key={`${food.name}-${fi}`}>{diet.content?.format === 'equivalents' ? `${food.group}: ${food.equivalents} eq.` : `${food.name} — ${food.portion}${food.equivalents ? ` (${food.equivalents} eq.)` : ''}`}</li>)}</ul></div>)}{diet.content?.notes && <p>{diet.content.notes}</p>}</> : <p>No hay plan de alimentación registrado para esta consulta.</p>}</section>
      <section><h2>Recomendaciones y hábitos</h2><p><b>Alergias e intolerancias:</b> {patient.allergies || 'Ninguna registrada'}</p>{[['hydration','Hidratación'],['activity','Actividad física'],['rest','Descanso'],['foodsToLimit','Alimentos a evitar o limitar'],['supplements','Suplementos (dosis y duración)']].map(([key,label]) => report[key] && <p key={key}><b>{label}:</b> {report[key]}</p>)}<div className="pdf-editable-fields">{textEditor('hydration','Hidratación',2)}{textEditor('activity','Actividad física',2)}{textEditor('rest','Descanso',2)}{textEditor('foodsToLimit','Alimentos a evitar o limitar',2)}{textEditor('supplements','Suplementos (dosis y duración)',2)}</div></section>
      <section><h2>Metas para la próxima consulta</h2>{report.goals && <p className="pdf-print-value">{report.goals}</p>}{textEditor('goals','De 2 a 3 acciones concretas y medibles')}</section>
      <section><h2>Indicaciones médicas</h2>{report.labs && <p><b>Estudios:</b> {report.labs}</p>}{report.warningSigns && <p><b>Señales de alerta:</b> {report.warningSigns}</p>}{textEditor('labs','Estudios de laboratorio',2)}{textEditor('warningSigns','Cuándo contactar a la nutrióloga o a un médico',2)}</section>
      <section><h2>Próxima cita</h2><p>{loading ? 'Buscando cita…' : appointment ? `${dateLabel(appointment.startsAt)} · ${new Date(appointment.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : 'Por agendar.'}</p>{report.rescheduleInfo && <p>{report.rescheduleInfo}</p>}{textEditor('rescheduleInfo','Cómo reprogramar')}</section>
      <footer className="pdf-footer"><b>{name}</b><p>{nutritionist?.professionalLicense ? `Cédula profesional: ${nutritionist.professionalLicense}. ` : ''}Este plan es personalizado y corresponde a la valoración nutricional de la fecha indicada.</p></footer>
    </article>
  </div>;
}
