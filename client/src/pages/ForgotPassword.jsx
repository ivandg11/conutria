import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import './CheckoutPages.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch {
      setError('No pudimos procesar la solicitud. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="nc-checkout-page">
      <section className="nc-checkout-panel">
        <span className="nc-pricing-eyebrow">RECUPERA TU ACCESO</span>
        <h1>¿Olvidaste tu contraseña?</h1>
        {submitted ? (
          <p role="status">Si existe una cuenta con ese correo, enviaremos un enlace para restablecer la contraseña. Revisa también tu carpeta de correo no deseado.</p>
        ) : (
          <>
            <p>Escribe el correo asociado a tu cuenta. Te enviaremos un enlace para crear una contraseña nueva.</p>
            <form onSubmit={submit}>
              <label>Correo electrónico<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              {error && <p className="nc-checkout-error" role="alert">{error}</p>}
              <button className="nc-checkout-submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar enlace'}</button>
            </form>
          </>
        )}
        <Link className="nc-checkout-link" to="/login">Volver a iniciar sesión</Link>
      </section>
    </main>
  );
}
