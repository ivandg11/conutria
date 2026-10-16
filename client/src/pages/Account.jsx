import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';

const date = (value) =>
  value
    ? new Date(value).toLocaleDateString('es-MX', {
        timeZone: 'UTC',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Sin fecha registrada';
const money = (value) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    value ?? 0,
  );
const planName = (plan) =>
  ({ MONTHLY: 'Mensual', ANNUAL: 'Anual', PRODUCTION_TEST: 'Prueba temporal de produccion', LIFETIME: 'De por vida' })[plan] ??
  plan ??
  'Sin plan';
const statusName = (status) =>
  ({
    ACTIVE: 'Activa',
    CANCELED: 'Cancelada',
    PAST_DUE: 'Pago pendiente',
    TRIAL: 'Prueba',
  })[status] ?? status;
const paymentStatus = (status) =>
  ({ PAID: 'Pagado', FAILED: 'Fallido', PENDING: 'Pendiente' })[status] ??
  status;

export default function Account() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const loadAccount = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/auth/account');
      setAccount(response.data);
    } catch {
      setError('No pudimos cargar los datos de tu cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  async function cancelSubscription() {
    setCanceling(true);
    setError('');
    try {
      await api.post('/auth/account/cancel-subscription');
      setConfirmCancel(false);
      await loadAccount();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'No pudimos cancelar la suscripción. Intenta de nuevo.',
      );
    } finally {
      setCanceling(false);
    }
  }

  const subscription = account?.subscription;
  const isLifetime = subscription?.plan === 'LIFETIME';

  return (
    <div className="account-page">
      {confirmCancel && (
        <ConfirmDialog
          title="Cancelar suscripción"
          message="La cancelación detendrá la renovación. Conservarás el acceso hasta que termine el periodo que ya pagaste. No procesa reembolsos ni modifica pagos anteriores."
          confirmLabel={canceling ? 'Cancelando…' : 'Sí, cancelar'}
          danger
          onCancel={() => !canceling && setConfirmCancel(false)}
          onConfirm={cancelSubscription}
        />
      )}

      <header className="account-heading account-page-heading">
        <div>
          <p className="account-eyebrow">TU ESPACIO</p>
          <h1>Cuenta</h1>
          <p>Administra tu perfil y consulta tu suscripción.</p>
        </div>
      </header>

      {error && (
        <p className="account-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="account-muted">Cargando tu cuenta…</p>
      ) : (
        <div className="account-grid">
          <section className="account-card account-profile">
            <div className="account-card-heading">
              <span className="account-icon">◎</span>
              <div>
                <h2>Perfil</h2>
                <p>Datos de acceso a Conutria</p>
              </div>
            </div>
            <dl className="account-details">
              <div>
                <dt>Nombre</dt>
                <dd>{account?.user?.name || '—'}</dd>
              </div>
              <div>
                <dt>Correo electrónico</dt>
                <dd>{account?.user?.email || '—'}</dd>
              </div>
              <div>
                <dt>Miembro desde</dt>
                <dd>{date(account?.user?.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="account-card account-subscription">
            <div className="account-card-heading">
              <span className="account-icon">✳</span>
              <div>
                <h2>Suscripción</h2>
                <p>Plan y estado actual</p>
              </div>
            </div>
            {subscription ? (
              <>
                <div className="account-plan-line">
                  <strong>{planName(subscription.plan)}</strong>
                  <span
                    className={`account-status ${subscription.status === 'ACTIVE' ? 'is-active' : ''}`}
                  >
                    {subscription.cancelAtPeriodEnd ? 'Cancelacion programada' : statusName(subscription.status)}
                  </span>
                </div>
                <p className="account-price">
                  {isLifetime ? (
                    'Acceso sin costo'
                  ) : (
                    <>
                      {money(subscription.price)}{' '}
                      <span>
                        / {subscription.plan === 'ANNUAL' ? 'año' : 'mes'}
                      </span>
                    </>
                  )}
                </p>
                <dl className="account-details account-sub-details">
                  <div>
                    <dt>Inicio</dt>
                    <dd>{date(subscription.startedAt)}</dd>
                  </div>
                  <div>
                    <dt>
                      {isLifetime
                        ? 'Vigencia'
                        : subscription.cancelAtPeriodEnd
                          ? 'Acceso hasta'
                          : subscription.status === 'CANCELED'
                            ? 'Cancelada el'
                            : 'Próxima renovación'}
                    </dt>
                    <dd>
                      {isLifetime
                        ? 'De por vida'
                        : date(
                            subscription.status === 'CANCELED'
                              ? subscription.canceledAt
                              : subscription.renewsAt,
                          )}
                    </dd>
                  </div>
                </dl>
                {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && !isLifetime && (
                  <button
                    className="account-cancel"
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancelar suscripción
                  </button>
                )}
                {subscription.status === 'CANCELED' && (
                  <p className="account-muted">
                    Tu suscripción está cancelada.
                  </p>
                )}
              </>
            ) : (
              <div className="account-no-plan">
                <strong>No tienes una suscripción registrada</strong>
                <p>
                  Si esperabas ver un plan aquí, contacta a soporte para revisar
                  tu cuenta.
                </p>
              </div>
            )}
          </section>

          <section className="account-card account-payments">
            <div className="account-card-heading">
              <span className="account-icon">＄</span>
              <div>
                <h2>Historial de pagos</h2>
                <p>Tus movimientos recientes</p>
              </div>
            </div>
            {account?.payments?.length ? (
              <div className="account-table-wrap">
                <table className="account-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Estado</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{date(payment.paidAt || payment.createdAt)}</td>
                        <td>Plan {planName(payment.plan)}</td>
                        <td>{paymentStatus(payment.status)}</td>
                        <td>{money(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="account-muted">Aún no hay pagos registrados.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
