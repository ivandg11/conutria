import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Logo from './Logo';
import './ClientLayout.css';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/agenda', label: 'Agenda', icon: '▦' },
  { to: '/account', label: 'Cuenta', icon: '◉' },
  { to: '/support', label: 'Soporte', icon: '✉' },
];

export default function ClientLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="client-app">
      <header className="client-header">
        <Link to="/dashboard" className="client-brand" aria-label="Nutria, dashboard">
          <Logo size={36} />
        </Link>
        <div className="client-account">
          <span className="client-avatar" aria-hidden="true">{user?.name?.slice(0, 1)?.toUpperCase() || 'U'}</span>
          <span className="client-user-name">{user?.name}</span>
          <button type="button" onClick={logout} className="client-logout">Salir</button>
        </div>
      </header>
      <div className="client-layout">
        <aside className="client-sidebar">
          <p className="client-sidebar-eyebrow">MENÚ PRINCIPAL</p>
          <nav className="client-sidebar-nav" aria-label="Secciones de cliente">
            {navigation.map(({ to, label, icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `client-nav-link ${isActive ? 'is-active' : ''}`}>
                <span className="client-nav-icon" aria-hidden="true">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="client-sidebar-help"><strong>Tu consulta, en orden</strong><p>Administra pacientes, tu cuenta y tus solicitudes de ayuda desde aquí.</p></div>
        </aside>
        <main className="client-content"><Outlet /></main>
      </div>
    </div>
  );
}
