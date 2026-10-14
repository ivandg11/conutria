import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/useAuth';
import './CheckoutPages.css';

export default function SetupPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/setup-password', { token: params.get('token'), password });
      setUser(data);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo crear la contraseña.');
      setLoading(false);
    }
  }

  return (
    <main className="nc-checkout-page">
      <section className="nc-checkout-panel">
        <span className="nc-pricing-eyebrow">ACTIVA TU CUENTA</span>
        <h1>Crea tu contraseña</h1>
        <p>Usa al menos 8 caracteres. El enlace solo se puede utilizar una vez.</p>
        <form onSubmit={submit}>
          <label>Contraseña<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label>Confirmar contraseña<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
          {error && <p className="nc-checkout-error" role="alert">{error}</p>}
          <button className="nc-checkout-submit" disabled={loading}>{loading ? 'Guardando…' : 'Crear contraseña y entrar'}</button>
        </form>
        <Link className="nc-checkout-link" to="/">Volver al inicio</Link>
      </section>
    </main>
  );
}
