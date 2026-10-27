import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/useAuth';
import ConfirmDialog from '../components/ConfirmDialog';
import { getCachedPatients, getPatients, invalidatePatientLists } from '../lib/patientCache';

export default function Patients() {
  const location = useLocation();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage ?? '');
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [loading, setLoading] = useState(() => !getCachedPatients({ q: '', status: 'ACTIVE' }));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!location.state?.successMessage) return;
    setSuccessMessage(location.state.successMessage);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(''), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    let active = true;
    api.get('/patients/summary')
      .then(({ data }) => { if (active) setSummary(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const params = { q: q.trim(), status };
    const cached = getCachedPatients(params);
    let active = true;
    if (cached) {
      setPatients(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setLoadError('');
    const timer = window.setTimeout(() => {
      getPatients(params)
        .then((data) => { if (active) setPatients(data); })
        .catch(() => { if (active) setLoadError('No se pudieron cargar los pacientes. Intenta de nuevo.'); })
        .finally(() => { if (active) setLoading(false); });
    }, q ? 250 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [q, status]);

  function handleDelete(id) {
    setPendingDelete(id);
  }

  async function confirmDelete() {
    const id = pendingDelete;
    setPendingDelete(null);
    await api.delete(`/patients/${id}`);
    invalidatePatientLists();
    setPatients((list) => list.filter((p) => p.id !== id));
    setSuccessMessage('Paciente eliminado correctamente.');
    api.get('/patients/summary').then(({ data }) => setSummary(data)).catch(() => {});
  }

  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="patient-page">
      {successMessage && (
        <div role="status" className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-900 bg-emerald-800 px-4 py-3 text-sm font-semibold text-white shadow-md">
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-emerald-800">✓</span>
          {successMessage}
        </div>
      )}
      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar paciente"
          message="Se eliminará este paciente y todo su historial. Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      <section className="patient-hero">
        <div>
          {firstName && <p className="patient-greeting">Hola, {firstName}</p>}
          <h1>Tus pacientes</h1>
        </div>
        <Link to="/patients/new" className="patient-hero-action">
          + Nuevo paciente
        </Link>
      </section>

      <section className="dashboard-shortcuts" aria-label="Resumen principal">
        <article className="dashboard-shortcut">
          <strong>Pacientes</strong>
          <span className="dashboard-shortcut-count">{summary ? summary.activePatients : '—'}</span>
          <span>Activos</span>
        </article>
        <article className="dashboard-shortcut">
          <strong>Consultas</strong>
          <span className="dashboard-shortcut-count">{summary ? summary.consultations : '—'}</span>
          <span>Registradas</span>
        </article>
      </section>

      <section id="patient-directory" className="patient-controls" aria-label="Buscar y filtrar pacientes">
        <label className="patient-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Buscar pacientes"
            placeholder="Buscar por nombre o apellido"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div className="patient-filters">
          {[
            ['ACTIVE', 'En seguimiento'],
            ['DISCHARGED', 'Dados de alta'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`patient-filter ${status === value ? 'is-active' : ''}`}
              aria-pressed={status === value}
            >
              {label}{status === value ? ` · ${patients.length}` : ''}
            </button>
          ))}
        </div>
      </section>

      <section className="patient-grid" aria-label="Lista de pacientes">
        {loadError && <p role="alert" className="patient-empty">{loadError}</p>}
        {loading && patients.length === 0 && <p className="patient-empty">Cargando pacientes…</p>}
        {patients.map((patient) => {
          const initials = `${patient.firstName?.[0] ?? ''}${patient.lastName?.[0] ?? ''}`;
          return (
            <article className="patient-card" key={patient.id}>
              <div className="patient-card-profile">
                <div className="patient-avatar" aria-hidden="true">{initials}</div>
                <div className="patient-card-name">
                  <h2>{patient.firstName} {patient.lastName}</h2>
                  <p>{patient.phone || 'Sin teléfono registrado'}</p>
                </div>
              </div>

              <div className="patient-goal">
                <span>Objetivo</span>
                <p>{patient.goal || 'Sin objetivo registrado'}</p>
              </div>

              <div className="patient-card-actions">
                <Link to={`/patients/${patient.id}`} className="patient-view-link">Ver ficha</Link>
                <Link to={`/patients/${patient.id}/edit`} className="patient-edit-link">Editar</Link>
                <button type="button" className="patient-delete-link" onClick={() => handleDelete(patient.id)}>Eliminar</button>
              </div>
            </article>
          );
        })}

        <Link to="/patients/new" className="patient-add-card">
          <span aria-hidden="true">+</span>
          <strong>Agregar paciente</strong>
        </Link>

        {!loading && !loadError && patients.length === 0 && (
          <p className="patient-empty">
            {status === 'ACTIVE' ? 'Sin pacientes en seguimiento. Agrega uno para comenzar.' : 'Sin pacientes dados de alta.'}
          </p>
        )}
      </section>
    </div>
  );
}



