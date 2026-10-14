import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/useAuth';
import './Agenda.css';

const pad = (value) => String(value).padStart(2, '0');
const dayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const localDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  return `${dayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const dateLabel = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('es-MX', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const timeLabel = (value) => new Date(value).toLocaleTimeString('es-MX', {
  hour: '2-digit', minute: '2-digit',
});
const monthLabel = (date) => date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
const newForm = (date = new Date()) => ({ patientId: '', startsAt: `${dayKey(date)}T10:00`, reason: '' });
const normalizeName = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');

export default function Agenda() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => newForm());
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const from = monthStart(month);
      const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
      const response = await api.get('/appointments', { params: { from: from.toISOString(), to: to.toISOString() } });
      setAppointments(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No pudimos cargar la agenda. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  useEffect(() => {
    Promise.all([
      api.get('/patients', { params: { status: 'ACTIVE' } }),
      api.get('/patients', { params: { status: 'DISCHARGED' } }),
    ]).then(([active, discharged]) => {
      setPatients([...active.data, ...discharged.data].sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'es')));
    }).catch(() => setError('No pudimos cargar la lista de pacientes.'));
  }, []);

  const calendarDays = useMemo(() => {
    const first = monthStart(month);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { date, key: dayKey(date), inMonth: date.getMonth() === month.getMonth() };
    });
  }, [month]);

  const appointmentsByDay = useMemo(() => appointments.reduce((groups, appointment) => {
    const key = dayKey(new Date(appointment.startsAt));
    groups[key] = [...(groups[key] || []), appointment];
    return groups;
  }, {}), [appointments]);

  const dayAppointments = appointmentsByDay[selectedDay] || [];
  const bookablePatients = patients.filter((patient) => normalizeName(`${patient.firstName} ${patient.lastName}`) !== normalizeName(user?.name));

  function changeMonth(amount) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
    setSelectedDay((current) => {
      const selected = new Date(`${current}T12:00:00`);
      const next = new Date(selected.getFullYear(), selected.getMonth() + amount, 1);
      return dayKey(next);
    });
  }

  function chooseDay(day) {
    setSelectedDay(day.key);
    if (!day.inMonth) setMonth(monthStart(day.date));
  }

  function openCreate() {
    const selected = new Date(`${selectedDay}T12:00:00`);
    setEditing(null);
    setForm(newForm(selected));
    setModalOpen(true);
  }

  function openEdit(appointment) {
    setEditing(appointment);
    setForm({
      patientId: String(appointment.patientId),
      startsAt: localDateTime(appointment.startsAt),
      reason: appointment.reason || '',
    });
    setModalOpen(true);
  }

  async function saveAppointment(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      patientId: Number(form.patientId),
      startsAt: new Date(form.startsAt).toISOString(),
      reason: form.reason.trim(),
    };
    try {
      if (editing) await api.put(`/appointments/${editing.id}`, payload);
      else await api.post('/appointments', payload);
      const appointmentDate = new Date(payload.startsAt);
      const targetMonth = monthStart(appointmentDate);
      const monthUnchanged = targetMonth.getTime() === month.getTime();
      setSelectedDay(dayKey(appointmentDate));
      if (!monthUnchanged) setMonth(targetMonth);
      setModalOpen(false);
      setEditing(null);
      if (monthUnchanged) await loadAppointments();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No pudimos guardar la cita.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAppointment() {
    const appointment = pendingDelete;
    if (!appointment) return;
    try {
      await api.delete(`/appointments/${appointment.id}`);
      setPendingDelete(null);
      await loadAppointments();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No pudimos eliminar la cita.');
      setPendingDelete(null);
    }
  }

  async function finishAppointment(appointment) {
    setUpdatingId(appointment.id);
    setError('');
    try {
      const response = await api.patch(`/appointments/${appointment.id}/status`, { status: 'COMPLETED' });
      setAppointments((current) => current.map((item) => item.id === appointment.id ? response.data : item));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No pudimos finalizar la cita.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="agenda-page">
      {pendingDelete && <ConfirmDialog title="Eliminar cita" message={`¿Quieres eliminar la cita de ${pendingDelete.patient.firstName} ${pendingDelete.patient.lastName}? Esta acción no se puede deshacer.`} confirmLabel="Eliminar cita" danger onCancel={() => setPendingDelete(null)} onConfirm={deleteAppointment} />}

      {modalOpen && <div className="agenda-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModalOpen(false)}>
        <form className="agenda-modal" onSubmit={saveAppointment}>
          <div className="agenda-modal-heading"><div><p className="agenda-eyebrow">AGENDA</p><h2>{editing ? 'Editar cita' : 'Agendar cita'}</h2></div><button type="button" className="agenda-modal-close" aria-label="Cerrar" onClick={() => setModalOpen(false)}>×</button></div>
          {error && <p className="agenda-error" role="alert">{error}</p>}
          <label>Paciente<select required value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}><option value="">Selecciona un paciente</option>{bookablePatients.map((patient) => <option value={patient.id} key={patient.id}>{patient.firstName} {patient.lastName}{patient.status === 'DISCHARGED' ? ' · Alta' : ''}</option>)}</select></label>
          <label>Fecha y hora<input required type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label>
          <label>Motivo o nota <span>(opcional)</span><textarea rows={3} maxLength={191} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Ej. consulta de seguimiento" /></label>
          <div className="agenda-modal-actions"><button type="button" className="agenda-secondary" onClick={() => setModalOpen(false)}>Volver</button><button className="agenda-primary" type="submit" disabled={saving || bookablePatients.length === 0}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agendar cita'}</button></div>
          {bookablePatients.length === 0 && <p className="agenda-hint">Agrega un paciente distinto a tu propia cuenta antes de agendar una cita.</p>}
        </form>
      </div>}

      <header className="agenda-heading"><div><p className="agenda-eyebrow">ORGANIZA TU CONSULTA</p><h1>Agenda</h1><p>Administra las próximas citas de tus pacientes.</p></div><button className="agenda-primary" type="button" onClick={openCreate}>＋ Agendar cita</button></header>
      {error && !modalOpen && <p className="agenda-error" role="alert">{error}</p>}

      <div className="agenda-layout">
        <section className="agenda-calendar-card">
          <div className="agenda-month-controls"><button type="button" aria-label="Mes anterior" onClick={() => changeMonth(-1)}>‹</button><h2>{monthLabel(month)}</h2><button type="button" aria-label="Mes siguiente" onClick={() => changeMonth(1)}>›</button><button type="button" className="agenda-today" onClick={() => { const now = new Date(); setMonth(monthStart(now)); setSelectedDay(dayKey(now)); }}>Hoy</button></div>
          <div className="agenda-calendar-grid agenda-weekdays">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="agenda-calendar-grid agenda-days">{calendarDays.map((day) => {
            const count = (appointmentsByDay[day.key] || []).filter((appointment) => appointment.status !== 'COMPLETED').length;
            return <button type="button" key={day.key} className={`agenda-day ${day.inMonth ? '' : 'is-outside'} ${day.key === selectedDay ? 'is-selected' : ''} ${day.key === dayKey(new Date()) ? 'is-today' : ''}`} onClick={() => chooseDay(day)} aria-label={`${dateLabel(day.key)}${count ? `, ${count} citas` : ''}`} aria-pressed={day.key === selectedDay}><span>{day.date.getDate()}</span>{count > 0 && <i aria-hidden="true">{count > 3 ? '3+' : count}</i>}</button>;
          })}</div>
          {loading && <p className="agenda-hint">Actualizando citas…</p>}
        </section>

        <section className="agenda-day-card">
          <div className="agenda-day-heading"><div><p className="agenda-eyebrow">CITAS DEL DÍA</p><h2>{dateLabel(selectedDay)}</h2></div><span className="agenda-day-count">{dayAppointments.length}</span></div>
          {!loading && dayAppointments.length === 0 ? <div className="agenda-empty"><span aria-hidden="true">▦</span><strong>No hay citas para este día</strong><p>Agenda una cita para organizar tu consulta.</p><button type="button" onClick={openCreate}>Agendar para este día</button></div> : <div className="agenda-appointments">{dayAppointments.map((appointment) => <article className={`agenda-appointment ${appointment.status === 'COMPLETED' ? 'is-completed' : ''}`} key={appointment.id}><time>{timeLabel(appointment.startsAt)}</time><div className="agenda-appointment-main"><strong>{appointment.patient.firstName} {appointment.patient.lastName}</strong><p>{appointment.reason || 'Consulta nutricional'}</p>{appointment.patient.phone && <small>{appointment.patient.phone}</small>}{appointment.status === 'COMPLETED' && <span className="agenda-completed-badge">Finalizada</span>}</div><div className="agenda-appointment-actions">{appointment.status !== 'COMPLETED' && <button type="button" className="is-finish" disabled={updatingId === appointment.id} onClick={() => finishAppointment(appointment)}>{updatingId === appointment.id ? 'Guardando…' : 'Finalizar'}</button>}<button type="button" onClick={() => openEdit(appointment)}>Editar</button><button type="button" className="is-delete" onClick={() => setPendingDelete(appointment)}>Eliminar</button></div></article>)}</div>}
        </section>
      </div>
    </div>
  );
}
