import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/useAuth';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .get('/patients', { params: { q, status } })
        .then((res) => setPatients(res.data));
    }, 300);
    return () => clearTimeout(timer);
  }, [q, status]);

  function handleDelete(id) {
    setPendingDelete(id);
  }

  async function confirmDelete() {
    const id = pendingDelete;
    setPendingDelete(null);
    await api.delete(`/patients/${id}`);
    setPatients((list) => list.filter((p) => p.id !== id));
  }

  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="patient-page">
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

      <section className="patient-controls" aria-label="Buscar y filtrar pacientes">
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

        {patients.length === 0 && (
          <p className="patient-empty">
            {status === 'ACTIVE' ? 'Sin pacientes en seguimiento. Agrega uno para comenzar.' : 'Sin pacientes dados de alta.'}
          </p>
        )}
      </section>
    </div>
  );
}
