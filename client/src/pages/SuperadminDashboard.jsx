import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/useAuth';
import Logo from '../components/Logo';
import AppIcon from '../components/AppIcon';
import ConfirmDialog from '../components/ConfirmDialog';
import './SuperadminDashboard.css';

const sections = [
  'Resumen',
  'Planes',
  'Suscripciones',
  'Cobros',
  'Usuarios',
  'Soporte',
  'Bitácora',
  'Sistema',
];
const sectionIcons = {
  Resumen: 'dashboard',
  Planes: 'plans',
  Suscripciones: 'subscriptions',
  Cobros: 'payments',
  Usuarios: 'users',
  Soporte: 'support',
  Bitácora: 'audit',
  Sistema: 'system',
};
const sectionDescriptions = {
  Resumen: 'Indicadores generales de suscripciones e ingresos.',
  Planes: 'Distribución de planes e ingresos estimados.',
  Suscripciones: 'Consulta y cancela suscripciones administradas por Stripe.',
  Cobros: 'Pagos recientes y próximas renovaciones.',
  Usuarios: 'Cuentas, actividad y pacientes registrados.',
  Soporte: 'Solicitudes de clientes y seguimiento de conversaciones.',
  Bitácora: 'Acciones realizadas en el panel administrativo.',
  Sistema: 'Estado técnico, respaldos y errores recientes.',
};
const date = (value) =>
  value
    ? new Date(value).toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';
const currency = (value, currencyCode = 'USD') =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
const planText = {
  WEEKLY_USD: 'Cada 7 días · USD',
  MONTHLY_USD: 'Mensual · USD',
  ANNUAL_USD: 'Anual · USD',
  MONTHLY: 'Mensual · MXN (anterior)',
  ANNUAL: 'Anual · MXN (anterior)',
  PRODUCTION_TEST: 'Prueba $10/mes',
  LIFETIME: 'De por vida',
};
const statusText = {
  ACTIVE: 'Activa',
  TRIAL: 'En prueba',
  PAST_DUE: 'Morosa',
  CANCELED: 'Cancelada',
  NO_PLAN: 'Sin plan',
  PAID: 'Pagado',
  FAILED: 'Fallido',
  PENDING: 'Pendiente',
};

function Table({ headers, rows, empty }) {
  if (!rows.length) return <p className="sa-empty">{empty}</p>;
  return (
    <div className="sa-table-wrap">
      <table className="sa-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key ?? i}>
              {row.cells.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SuperadminDashboard() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState('Resumen');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketError, setTicketError] = useState('');
  const [ticketBusy, setTicketBusy] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState(null);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo cargar el panel.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => active && loadDashboard());
    return () => { active = false; };
  }, [loadDashboard]);

  const loadSupportTickets = useCallback(async () => {
    try {
      const response = await api.get('/admin/support-tickets');
      setSupportTickets(response.data);
      setActiveTicketId((current) => current ?? response.data[0]?.id ?? null);
      setTicketError('');
    } catch (err) {
      setTicketError(
        err.response?.data?.error ?? 'No se pudieron cargar los tickets.',
      );
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => active && loadSupportTickets());
    return () => { active = false; };
  }, [loadSupportTickets]);
  useEffect(() => {
    const timer = setInterval(loadSupportTickets, 30000);
    return () => clearInterval(timer);
  }, [loadSupportTickets]);

  async function sendTicketReply(event) {
    event.preventDefault();
    if (!activeTicketId || !ticketReply.trim()) return;
    setTicketBusy(true);
    setTicketError('');
    try {
      await api.post(`/admin/support-tickets/${activeTicketId}/messages`, {
        message: ticketReply,
      });
      setTicketReply('');
      await loadSupportTickets();
    } catch (err) {
      setTicketError(
        err.response?.data?.error ?? 'No se pudo enviar la respuesta.',
      );
    } finally {
      setTicketBusy(false);
    }
  }

  async function cancelAdminSubscription() {
    if (!subscriptionToCancel) return;
    setSubscriptionBusy(true);
    setSubscriptionError('');
    try {
      await api.post(`/admin/subscriptions/${subscriptionToCancel.id}/cancel`);
      setSubscriptionToCancel(null);
      await loadDashboard();
    } catch (err) {
      setSubscriptionError(err.response?.data?.error ?? 'No se pudo cancelar la suscripcion.');
    } finally {
      setSubscriptionBusy(false);
    }
  }

  async function updateTicketStatus(status) {
    if (!activeTicketId) return;
    setTicketBusy(true);
    setTicketError('');
    try {
      await api.patch(`/admin/support-tickets/${activeTicketId}`, { status });
      await loadSupportTickets();
    } catch (err) {
      setTicketError(
        err.response?.data?.error ?? 'No se pudo actualizar el ticket.',
      );
    } finally {
      setTicketBusy(false);
    }
  }

  if (error)
    return (
      <main className="sa-shell">
        <p className="sa-error">{error}</p>
        <Link to="/">Volver al inicio</Link>
      </main>
    );
  if (!data)
    return (
      <main className="sa-shell">
        <p>Cargando panel de administración…</p>
      </main>
    );

  const summaryCards = [
    ['Suscriptoras activas', data.summary.active],
    ['En prueba', data.summary.trial],
    ['Morosas', data.summary.pastDue],
    ['Canceladas', data.summary.canceled],
    ['MRR (USD)', currency(data.summary.mrr.USD, 'USD')],
    ['MRR (MXN)', currency(data.summary.mrr.MXN, 'MXN')],
    ['Altas este mes', data.summary.newThisMonth],
    ['Bajas este mes', data.summary.cancellationsThisMonth],
  ];
  const activeTicket = supportTickets.find(
    (ticket) => ticket.id === activeTicketId,
  );

  return (
    <main className="sa-shell">
      {subscriptionToCancel && (
        <ConfirmDialog
          title="Cancelar suscripcion ahora"
          message={`Se cancelara inmediatamente el plan ${planText[subscriptionToCancel.plan] ?? subscriptionToCancel.plan} de ${subscriptionToCancel.name}. Stripe detendra las renovaciones futuras. Esta accion no procesa reembolsos.`}
          confirmLabel={subscriptionBusy ? 'Cancelando...' : 'Si, cancelar ahora'}
          danger
          onCancel={() => !subscriptionBusy && setSubscriptionToCancel(null)}
          onConfirm={cancelAdminSubscription}
        />
      )}
      <header className="sa-header">
        <Link
          to="/admin"
          className="sa-brand"
          aria-label="Conutria, panel de administración"
        >
          <Logo size={36} />
          <span className="sa-brand-section">Superadmin</span>
        </Link>
        <div className="sa-account">
          <span className="sa-avatar" aria-hidden="true">
            {user?.name?.slice(0, 1)?.toUpperCase() ?? 'S'}
          </span>

          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </header>
      <div className="sa-layout">
        <aside className="sa-sidebar">
          <p className="sa-eyebrow">MENÚ PRINCIPAL</p>
          <nav aria-label="Secciones de administración">
            {sections.map((item) => (
              <button
                key={item}
                aria-current={section === item ? 'page' : undefined}
                className={section === item ? 'is-active' : ''}
                onClick={() => setSection(item)}
              >
                <span className="sa-nav-icon" aria-hidden="true">
                  <AppIcon name={sectionIcons[item]} size={17} />
                </span>
                <span>{item}</span>
                {item === 'Soporte' &&
                  supportTickets.some((ticket) => ticket.status === 'OPEN') && (
                    <i
                      className="sa-notification-dot"
                      role="img"
                      aria-label="Hay tickets abiertos"
                      title="Hay tickets abiertos"
                    />
                  )}
              </button>
            ))}
          </nav>
          <div className="sa-sidebar-help">
            <strong>Centro de control</strong>
            <p>
              Revisa la actividad y el estado de Conutria desde un solo lugar.
            </p>
          </div>
        </aside>
        <section className="sa-content">
          <div className="sa-title">
            <div>
              <span className="sa-eyebrow">PANEL DE SUPERADMIN</span>
              <h1>{section}</h1>
              <p>{sectionDescriptions[section]}</p>
            </div>
            <button
              className="sa-refresh"
              onClick={() => {
                loadDashboard();
                loadSupportTickets();
              }}
              disabled={refreshing}
            >
              <span aria-hidden="true">↻</span>
              {refreshing ? 'Actualizando…' : 'Actualizar datos'}
            </button>
          </div>
          {section === 'Resumen' && (
            <>
              <div className="sa-card-grid">
                {summaryCards.map(([label, value]) => (
                  <article className="sa-stat" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>
              <p className="sa-note">MRR significa ingreso mensual recurrente estimado: suma los planes recurrentes activos y prorratea los anuales. No representa necesariamente dinero ya cobrado; las membresias vitalicias se excluyen.</p>
              <div className="sa-panel">
                <h2>Estado de la plataforma</h2>
                <p>
                  {data.summary.totalUsers} usuarios registradas ·{' '}
                  {data.summary.subscribers} con suscripción vigente
                </p>
              </div>
              <p className="sa-note">{data.dataNotice}</p>
            </>
          )}
          {section === 'Planes' && (
            <>
              <div className="sa-card-grid">
                <article className="sa-stat">
                  <span>Plan de 7 días · USD 1.99</span>
                  <strong>{data.plans.weeklyUsd}</strong>
                </article>
                <article className="sa-stat">
                  <span>Plan mensual · USD 7.99</span>
                  <strong>{data.plans.monthlyUsd}</strong>
                </article>
                <article className="sa-stat">
                  <span>Plan anual · USD 79.99</span>
                  <strong>{data.plans.annualUsd}</strong>
                </article>
                <article className="sa-stat">
                  <span>Ingreso del mes · USD</span>
                  <strong>{currency(data.plans.monthlyRevenue.USD, 'USD')}</strong>
                </article>
                <article className="sa-stat">
                  <span>Ingreso del mes · MXN anterior</span>
                  <strong>{currency(data.plans.monthlyRevenue.MXN, 'MXN')}</strong>
                </article>
                <article className="sa-stat">
                  <span>Proyección anual · USD</span>
                  <strong>{currency(data.plans.annualProjection.USD, 'USD')}</strong>
                </article>
                <article className="sa-stat">
                  <span>Proyección anual · MXN</span>
                  <strong>{currency(data.plans.annualProjection.MXN, 'MXN')}</strong>
                </article>
              </div>
              <p className="sa-note">
                La proyección anualiza el MRR actual; no representa cobros
                garantizados.
              </p>
            </>
          )}
          {section === 'Suscripciones' && (
            <div className="sa-panel">
              {subscriptionError && <p className="sa-error" role="alert">{subscriptionError}</p>}
              <p className="sa-note">Cancelar ahora detiene la renovacion en Stripe de inmediato. Las membresias vitalicias o manuales no se pueden cancelar desde aqui.</p>
              <Table
                headers={['Usuario', 'Correo', 'Plan', 'Estado', 'Importe', 'Renovacion', 'Accion']}
                empty="No hay suscripciones registradas."
                rows={data.subscriptions.map((subscription) => ({
                  key: subscription.id,
                  cells: [
                    subscription.name,
                    subscription.email,
                    planText[subscription.plan] ?? subscription.plan,
                    subscription.cancelAtPeriodEnd ? 'Cancelacion programada' : (statusText[subscription.status] ?? subscription.status),
                    currency(subscription.price, subscription.currency),
                    date(subscription.renewsAt),
                    subscription.stripeSubscriptionId && subscription.status !== 'CANCELED'
                      ? <button type="button" className="sa-subscription-cancel" onClick={() => { setSubscriptionError(''); setSubscriptionToCancel(subscription); }}>Cancelar ahora</button>
                      : subscription.plan === 'LIFETIME' ? 'Vitalicia' : 'No disponible',
                  ],
                }))}
              />
            </div>
          )}
          {section === 'Cobros' && (
            <>
              <div className="sa-columns">
                <div className="sa-panel">
                  <h2>Pagos recientes</h2>
                  <Table
                    headers={['Usuario', 'Importe', 'Estado', 'Fecha']}
                    empty="Aún no hay pagos registrados."
                    rows={data.payments.map((p) => ({
                      key: p.id,
                      cells: [
                        p.name,
                        currency(p.amount, p.currency),
                        statusText[p.status] ?? p.status,
                        date(p.paidAt ?? p.createdAt),
                      ],
                    }))}
                  />
                </div>
                <div className="sa-panel">
                  <h2>Pagos fallidos</h2>
                  <Table
                    headers={['Usuario', 'Importe', 'Fecha']}
                    empty="No hay pagos fallidos."
                    rows={data.failedPayments.map((p) => ({
                      key: p.id,
                      cells: [p.name, currency(p.amount, p.currency), date(p.createdAt)],
                    }))}
                  />
                </div>
              </div>
              <div className="sa-columns">
                <div className="sa-panel">
                  <h2>Renovaciones en 7 días</h2>
                  <Renewals items={data.renewals.next7Days} />
                </div>
                <div className="sa-panel">
                  <h2>Renovaciones en 8–30 días</h2>
                  <Renewals items={data.renewals.next30Days} />
                </div>
              </div>
              <p className="sa-note">{data.dataNotice}</p>
            </>
          )}
          {section === 'Usuarios' && (
            <div className="sa-panel">
              <Table
                headers={[
                  'Nombre',
                  'Correo',
                  'Plan',
                  'Estado',
                  'Registro',
                  'Último acceso',
                  'Pacientes',
                  'Próximo cobro',
                ]}
                empty="Aún no hay usuarios registradas."
                rows={data.users.map((u) => ({
                  key: u.id,
                  cells: [
                    u.name,
                    u.email,
                    planText[u.plan] ?? (u.plan ?? '—'),
                    statusText[u.status] ?? u.status,
                    date(u.createdAt),
                    date(u.lastLoginAt),
                    u.patientCount,
                    date(u.nextChargeAt),
                  ],
                }))}
              />
            </div>
          )}
          {section === 'Soporte' && (
            <>
              {ticketError && (
                <p className="sa-error" role="alert">
                  {ticketError}
                </p>
              )}
              <div
                className={`sa-support-layout ${activeTicket?.status === 'CLOSED' ? 'is-ticket-closed' : ''}`}
              >
                <div className="sa-panel sa-ticket-list">
                  <h2>Solicitudes</h2>
                  {supportTickets.length === 0 ? (
                    <p className="sa-empty">
                      Todavía no hay solicitudes de soporte.
                    </p>
                  ) : (
                    supportTickets.map((ticket) => (
                      <button
                        type="button"
                        key={ticket.id}
                        className={`sa-ticket-select ${ticket.id === activeTicketId ? 'is-active' : ''}`}
                        onClick={() => setActiveTicketId(ticket.id)}
                      >
                        <span className="sa-ticket-select-top">
                          <strong>{ticket.subject}</strong>
                          <em
                            className={`sa-ticket-status is-${ticket.status.toLowerCase()}`}
                          >
                            {{
                              OPEN: 'Abierto',
                              IN_PROGRESS: 'En seguimiento',
                              CLOSED: 'Cerrado',
                            }[ticket.status] ?? ticket.status}
                          </em>
                        </span>
                        <span>
                          {ticket.user.name} · {date(ticket.updatedAt)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                {activeTicket?.status !== 'CLOSED' && (
                  <div className="sa-panel sa-ticket-detail">
                    {!activeTicket ? (
                      <p className="sa-empty">
                        Selecciona una solicitud para ver la conversación.
                      </p>
                    ) : (
                      <>
                        <div className="sa-ticket-detail-heading">
                          <div>
                            <h2>{activeTicket.subject}</h2>
                            <p>
                              {activeTicket.user.name} ·{' '}
                              {activeTicket.user.email}
                            </p>
                          </div>
                          {activeTicket.status !== 'CLOSED' && (
                            <div className="sa-ticket-heading-actions">
                              <select
                                aria-label="Estado del ticket"
                                value={activeTicket.status}
                                disabled={ticketBusy}
                                onChange={(event) =>
                                  updateTicketStatus(event.target.value)
                                }
                              >
                                <option value="OPEN">Abierto</option>
                                <option value="IN_PROGRESS">
                                  En seguimiento
                                </option>
                                <option value="CLOSED">Cerrado</option>
                              </select>
                              <button
                                type="button"
                                className="sa-ticket-close"
                                disabled={ticketBusy}
                                onClick={() => updateTicketStatus('CLOSED')}
                              >
                                Cerrar ticket
                              </button>
                            </div>
                          )}
                        </div>
                        {activeTicket.status !== 'CLOSED' && (
                          <div className="sa-ticket-messages">
                            {activeTicket.messages.map((message) => (
                              <article
                                className={`sa-ticket-message ${message.authorRole === 'ADMIN' ? 'is-admin' : ''}`}
                                key={message.id}
                              >
                                <div>
                                  <strong>
                                    {message.authorRole === 'ADMIN'
                                      ? message.author?.name || 'Administración'
                                      : activeTicket.user.name}
                                  </strong>
                                  <time>{date(message.createdAt)}</time>
                                </div>
                                <p>{message.content}</p>
                              </article>
                            ))}
                          </div>
                        )}
                        {activeTicket.status !== 'CLOSED' && (
                          <form
                            className="sa-ticket-reply"
                            onSubmit={sendTicketReply}
                          >
                            <textarea
                              rows={3}
                              maxLength={5000}
                              required
                              value={ticketReply}
                              onChange={(event) =>
                                setTicketReply(event.target.value)
                              }
                              placeholder="Escribe una respuesta para el cliente…"
                            />
                            <button type="submit" disabled={ticketBusy}>
                              {ticketBusy
                                ? 'Enviando…'
                                : 'Responder al cliente'}
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          {section === 'Bitácora' && (
            <div className="sa-panel">
              <Table
                headers={['Quién', 'Acción', 'Cuándo', 'IP']}
                empty="Aún no hay acciones registradas."
                rows={data.audit.map((log) => ({
                  key: log.id,
                  cells: [
                    log.actor,
                    `${log.action}${log.details ? ` · ${log.details}` : ''}`,
                    date(log.createdAt),
                    log.ip ?? '—',
                  ],
                }))}
              />
            </div>
          )}
          {section === 'Sistema' && (
            <>
              <div className="sa-card-grid">
                <article className="sa-stat">
                  <span>Último respaldo</span>
                  <strong className="sa-stat-small">
                    {date(data.system.lastBackupAt)}
                  </strong>
                </article>
                <article className="sa-stat">
                  <span>Versión desplegada</span>
                  <strong className="sa-stat-small">
                    {data.system.version}
                  </strong>
                </article>
                <article className="sa-stat">
                  <span>Errores recientes</span>
                  <strong>{data.system.errors.length}</strong>
                </article>
              </div>
              <div className="sa-panel">
                <h2>Errores recientes</h2>
                <Table
                  headers={['Mensaje', 'Fecha']}
                  empty="No hay errores recientes registrados."
                  rows={data.system.errors.map((err) => ({
                    key: err.id,
                    cells: [err.message, date(err.createdAt)],
                  }))}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Renewals({ items }) {
  if (!items.length)
    return <p className="sa-empty">No hay renovaciones en este periodo.</p>;
  return (
    <ul className="sa-renewals">
      {items.map((item) => (
        <li key={item.id}>
          <span>
            <strong>{item.name}</strong>
            <small>
              {planText[item.plan] ?? item.plan} ·{' '}
              {date(item.renewsAt)}
            </small>
          </span>
          <b>{currency(item.price, item.currency)}</b>
        </li>
      ))}
    </ul>
  );
}
