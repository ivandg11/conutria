import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import AppIcon from '../components/AppIcon';
import { useAuth } from '../context/useAuth';
import './SuscriptionPlans.css';

const plans = [
  {
    id: 'weekly',
    name: 'Plan de 7 días',
    description: 'Acceso completo con un periodo de pago corto.',
    price: '$1.99',
    period: '/ cada 7 días',
    features: ['Gestión de pacientes', 'Historial de consultas y mediciones', 'Planes de alimentación', 'Exportación a PDF', 'Cancela cuando quieras'],
    button: 'Elegir plan de 7 días',
  },
  {
    id: 'monthly',
    name: 'Plan mensual',
    description: 'Flexibilidad para tu consulta.',
    price: '$7.99',
    period: '/ mes',
    features: [
      'Gestión de pacientes',
      'Historial de consultas y mediciones',
      'Planes de alimentación',
      'Exportación a PDF',
      'Acceso desde computadora y celular',
    ],
    button: 'Elegir plan mensual',
  },
  {
    id: 'annual',
    name: 'Plan anual',
    description: 'Para llevar tu consulta al siguiente nivel.',
    price: '$79.99',
    period: '/ año',
    equivalent: '$6.67 USD al mes',
    savings: 'AHORRA $15.89 USD AL AÑO (17%)',
    features: [
      'Todo lo incluido en el plan mensual',
      'Un año completo de acceso',
      'Mismas funciones y condiciones',
      'Ahorra frente a 12 pagos mensuales',
      'Ideal para una práctica continua',
    ],
    button: 'Elegir plan anual',
    featured: true,
  },
];

function CheckIcon() {
  return (
    <span className="nc-plan-check" aria-hidden="true">
      ✓
    </span>
  );
}

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function startCheckout(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = user
        ? await api.post('/checkout/renew', { plan: selectedPlan.id })
        : await api.post('/checkout/start', { ...form, plan: selectedPlan.id });
      window.location.assign(data.checkoutUrl);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo iniciar el pago. Inténtalo de nuevo.');
      setLoading(false);
    }
  }
  return (
    <section className="nc-pricing" id="planes">
      <div className="nc-pricing-heading">
        <span className="nc-pricing-eyebrow">PLANES Y PRECIOS</span>

        <h2>Invierte en una consulta más organizada</h2>

        <p>
          Herramientas para acompañarte en cada etapa de tu práctica
          nutricional.
        </p>
        <Link className="nc-back-home" to="/">← Volver al inicio</Link>
      </div>

      <div className="nc-pricing-grid">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`nc-plan-card ${
              plan.featured ? 'nc-plan-featured' : ''
            }`}
          >
            {plan.featured && (
              <span className="nc-plan-badge">MEJOR AHORRO</span>
            )}

            <div className="nc-plan-icon" aria-hidden="true">
              <AppIcon name={plan.id === 'weekly' ? 'calendar' : plan.id === 'monthly' ? 'subscriptions' : 'plans'} size={25} />
            </div>

            <h3>{plan.name}</h3>
            <p className="nc-plan-description">{plan.description}</p>

            <div className="nc-plan-price">
              <strong>{plan.price}</strong>
              <span>{plan.period}</span>
            </div>

            {plan.equivalent && (
              <p className="nc-plan-equivalent">{plan.equivalent}</p>
            )}

            {plan.savings && (
              <span className="nc-plan-savings">{plan.savings}</span>
            )}

            <div className="nc-plan-divider" />

            <p className="nc-plan-includes">¿Qué incluye?</p>

            <ul className="nc-plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button type="button" className={`nc-plan-button ${plan.featured ? 'nc-plan-button-featured' : ''}`} onClick={() => { setSelectedPlan(plan); setAcceptedTerms(false); setError(''); }}>
              {plan.button} <span aria-hidden="true">→</span>
            </button>

            <p className="nc-plan-footnote">{plan.id === 'weekly' ? 'Cargo recurrente cada 7 días. Cancela desde Cuenta para detener futuros cargos.' : plan.id === 'monthly' ? 'Cargo recurrente mensual. Cancela desde Cuenta para detener futuros cargos.' : 'Cargo anual anticipado. Cancela desde Cuenta para detener futuras renovaciones.'}</p>
          </article>
        ))}
      </div>

      <p className="nc-pricing-note">Precios en USD. El pago seguro se procesa con Stripe.</p>
      {selectedPlan && (
        <div className="nc-checkout-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) setSelectedPlan(null); }}>
          <section className="nc-checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="nc-checkout-title">
            <button className="nc-checkout-close" type="button" aria-label="Cerrar" disabled={loading} onClick={() => setSelectedPlan(null)}>×</button>
            <span className="nc-pricing-eyebrow">CONTINUAR CON {selectedPlan.name.toUpperCase()}</span>
            <h2 id="nc-checkout-title">{user ? 'Confirma tu renovación' : 'Tus datos de contacto'}</h2>
            <p>{user ? 'Confirma la renovación de tu cuenta con Stripe.' : 'Te enviaremos el acceso a este correo después de confirmar tu pago.'}</p>
            <form onSubmit={startCheckout}>
              {!user && <>
                <label>Nombre<input autoComplete="given-name" required minLength={2} maxLength={50} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
                <label>Apellido<input autoComplete="family-name" required minLength={2} maxLength={50} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
                <label>Correo electrónico<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              </>}
              <label className="nc-legal-consent"><input type="checkbox" required checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /><span>Leí y acepto los <Link to="/terminos-de-uso" target="_blank" rel="noreferrer">Términos de uso</Link>. He leído el <Link to="/aviso-de-privacidad" target="_blank" rel="noreferrer">Aviso de privacidad</Link>.</span></label>
              {error && <p className="nc-checkout-error" role="alert">{error}</p>}
              <button className="nc-checkout-submit" disabled={loading}>{loading ? 'Conectando con Stripe…' : `Continuar al pago · ${selectedPlan.price} USD`}</button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
