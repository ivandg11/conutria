import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import './CheckoutPages.css';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setComplete(true);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="nc-checkout-page">
      <section className="nc-checkout-panel">
        <span className="nc-pricing-eyebrow">SEGURIDAD DE TU CUENTA</span>
        <h1>{complete ? 'Contraseña actualizada' : 'Crea una contraseña nueva'}</h1>
        {complete ? (
          <>
            <p role="status">Tu contraseña cambió. Ya puedes iniciar sesión con ella.</p>
            <Link className="nc-checkout-submit nc-checkout-button-link" to="/login">Ir a iniciar sesión</Link>
          </>
        ) : !token ? (
          <>
            <p>Este enlace no es válido. Solicita uno nuevo desde la pantalla de acceso.</p>
            <Link className="nc-checkout-link" to="/recuperar-contrasena">Solicitar otro enlace</Link>
          </>
        ) : (
          <>
            <p>Elige una contraseña de al menos 8 caracteres. Este enlace solo se puede usar una vez.</p>
            <form onSubmit={submit}>
              <label>Contraseña nueva<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <label>Confirmar contraseña<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
              {error && <p className="nc-checkout-error" role="alert">{error}</p>}
              <button className="nc-checkout-submit" disabled={loading}>{loading ? 'Guardando…' : 'Cambiar contraseña'}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
