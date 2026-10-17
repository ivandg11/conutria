import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Logo from '../components/Logo';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={user.role === 'SUPERADMIN' ? '/admin' : '/dashboard'} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const signedInUser = await login(email.trim(), password);
      navigate(signedInUser.role === 'SUPERADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-intro">
        <div className="login-intro-header"><div className="login-brand"><Logo size={38} /></div></div>
        <div className="login-intro-copy">
          <span className="login-eyebrow">Tu consulta, en equilibrio</span>
          <h1>Un espacio claro para acompañar cada progreso.</h1>
          <p>Organiza pacientes, consultas y su evolución desde un solo lugar.</p>
        </div>
        <div className="login-decor" aria-hidden="true"><span className="login-decor-leaf"><svg viewBox="0 0 40 40" fill="none"><path d="M10 29C10 17 17 10 30 10c0 13-7 20-20 19Z" fill="currentColor"/><path d="m11 29 12-12" stroke="#103f34" stroke-width="1.8" stroke-linecap="round"/></svg></span></div>
      </section>
      <section className="login-form-side">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-mobile-brand"><Logo size={38} /></div>
          <span className="login-eyebrow">Bienvenida de nuevo</span>
          <h2>Inicia sesión</h2>
          <p className="login-form-description">Ingresa tus datos para continuar con tu consulta.</p>
          {searchParams.get('registered') === '1' && <p className="login-success" role="status">Tu cuenta se registró correctamente. Inicia sesión para continuar.</p>}
          {searchParams.get('expired') === '1' && <p className="login-session-notice" role="status">Tu sesión se cerró después de 10 minutos sin actividad. Inicia sesión de nuevo.</p>}
          {error && <p className="login-error" role="alert">{error}</p>}
          <label className="login-field">
            <span>Correo electrónico</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="login-field">
            <span>Contraseña</span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="login-password-toggle"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            </button>
          </label>
          <Link to="/recuperar-contrasena" className="login-recovery-link">¿Olvidaste tu contraseña?</Link>
          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
          <Link to="/" className="login-home-link"><span aria-hidden="true">←</span> Volver a la página inicial</Link>
          <p className="login-secure-note"><span aria-hidden="true">●</span> Acceso privado a tu espacio de trabajo</p>
        </form>
      </section>
    </main>
  );
}
