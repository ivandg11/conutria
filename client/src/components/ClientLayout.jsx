import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Logo from './Logo';
import AppIcon from './AppIcon';
import './ClientLayout.css';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/agenda', label: 'Agenda', icon: 'calendar' },
  { to: '/account', label: 'Cuenta', icon: 'account' },
  { to: '/support', label: 'Soporte', icon: 'support' },
];

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const subscriptionExpired = user?.role !== 'SUPERADMIN' && user?.hasAccess === false;
  const viewingAccount = location.pathname === '/account';

  return (
    <div className="client-app">
      <header className="client-header">
        <Link
          to="/dashboard"
          className="client-brand"
          aria-label="Conutria, dashboard"
        >
          <Logo size={36} />
        </Link>
        <div className="client-account">
          <span className="client-avatar" aria-hidden="true">
            {user?.name?.slice(0, 1)?.toUpperCase() || 'U'}
          </span>
          <span className="client-user-name">{user?.name}</span>
          <button type="button" onClick={logout} className="client-logout">
            Salir
          </button>
        </div>
      </header>
      {subscriptionExpired && !viewingAccount ? (
        <main className="subscription-locked-page">
          <span className="subscription-locked-icon" aria-hidden="true">!</span>
          <p className="account-eyebrow">SUSCRIPCIÓN VENCIDA</p>
          <h1>Renueva tu plan para continuar</h1>
          <p>El acceso a pacientes, consultas y agenda está pausado hasta que renueves tu suscripción.</p>
          {user.subscription?.renewsAt && <p>Venció el <strong>{new Date(user.subscription.renewsAt).toLocaleDateString('es-MX')}</strong>.</p>}
          <div className="subscription-locked-actions">
            <Link to="/planes" className="subscription-renew-link">Ver planes y renovar</Link>
            <Link to="/account" className="subscription-account-link">Ver los datos de mi cuenta</Link>
            <button type="button" onClick={logout}>Cerrar sesión</button>
          </div>
        </main>
      ) : (
      <div className="client-layout">
        <aside className="client-sidebar">
          <p className="client-sidebar-eyebrow">MENÚ PRINCIPAL</p>
          <nav className="client-sidebar-nav" aria-label="Secciones de cliente">
            {navigation.map(({ to, label, icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `client-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="client-nav-icon" aria-hidden="true">
                  <AppIcon name={icon} size={17} />
                </span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="client-sidebar-help">
            <strong>Tu consulta, en orden</strong>
            <p>
              Administra pacientes, tu cuenta y tus solicitudes de ayuda desde
              aquí.
            </p>
          </div>
        </aside>
        <main className="client-content">
          <Outlet />
        </main>
      </div>
      )}
    </div>
  );
}
