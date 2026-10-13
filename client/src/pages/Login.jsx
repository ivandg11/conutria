import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(name.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-intro">
        <div className="login-intro-header">
          <div className="login-brand">
            <span className="login-brand-mark" aria-hidden="true">✳</span>
            <span>NutriControl</span>
          </div>
        </div>
        <div className="login-intro-copy">
          <span className="login-eyebrow">Tu consulta, en equilibrio</span>
          <h1>Un espacio claro para acompañar cada progreso.</h1>
          <p>
            Organiza pacientes, consultas y su evolución desde un solo lugar.
          </p>
        </div>
        <div className="login-decor" aria-hidden="true">
          <span className="login-decor-leaf">✳</span>
        </div>
      </section>

      <section className="login-form-side">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-mobile-brand">
            <span className="login-brand-mark" aria-hidden="true">
              ✳
            </span>
            <span>NutriControl</span>
          </div>
          <span className="login-eyebrow">Bienvenida de nuevo</span>
          <h2>Inicia sesión</h2>
          <p className="login-form-description">
            Ingresa tus datos para continuar con tu consulta.
          </p>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <label className="login-field">
            <span>Nombre</span>
            <input
              type="text"
              name="name"
              autoComplete="username"
              placeholder="Tu nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
            />
          </label>
          <label className="login-field">
            <span>Contraseña</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
          <Link to="/" className="login-home-link">
            <span aria-hidden="true">←</span> Volver a la página inicial
          </Link>
          <p className="login-secure-note">
            <span aria-hidden="true">●</span> Acceso privado a tu espacio de
            trabajo
          </p>
        </form>
      </section>
      </main>
  );
}










