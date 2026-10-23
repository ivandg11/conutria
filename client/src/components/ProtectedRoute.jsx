import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <main className="auth-loading" role="status" aria-live="polite">
      <section className="auth-loading-card">
        <span className="auth-loading-mark" aria-hidden="true">C</span>
        <span className="auth-loading-spinner" aria-hidden="true" />
        <p className="auth-loading-eyebrow">CONUTRIA</p>
        <h1>Preparando tu espacio de trabajo</h1>
        <p className="auth-loading-copy">Estamos cargando tus datos de forma segura.</p>
      </section>
    </main>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" replace />;
  return children;
}
