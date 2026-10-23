import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import './ConsultationPdf.css';

const dateLabel = (value) => value ? new Date(value).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin fecha';
const imc = (weight, height) => weight && height ? (Number(weight) / ((Number(height) / 100) ** 2)).toFixed(1) : null;
const waist = (consultation) => consultation?.measures?.perimetros?.cintura ?? null;
const showText = (value) => String(value ?? '').trim() || 'Sin indicaciones registradas.';

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
    ['Grasa corporal', 'bodyFatPct', '%'], ['Cintura', '__cintura', 'cm'],
  ].map(([label, key, unit]) => {
    const value = key === '__imc' ? imc(consultation.weightKg, consultation.heightCm) : key === '__cintura' ? waist(consultation) : consultation[key];
    const old = !previous ? null : key === '__imc' ? imc(previous.weightKg, previous.heightCm) : key === '__cintura' ? waist(previous) : previous[key];
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
    } finally {
      setSaving(false);
    }
  }
  async function saveAndPrint() {
    if (await saveReport()) window.print();
  }
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
