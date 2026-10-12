import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="app-navbar">
        <div className="app-navbar-inner">
          <Link to="/" className="app-brand" aria-label="NutriControl, inicio">
            <span className="app-brand-mark" aria-hidden="true">✳</span>
            <span>NutriControl</span>
          </Link>

          <nav className="app-navbar-nav" aria-label="Navegación principal">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `app-nav-link ${isActive ? 'is-active' : ''}`}
            >
              <span aria-hidden="true">⌂</span>
              Dashboard
            </NavLink>
          </nav>

          <div className="app-navbar-account">
            <span className="app-user-name">{user?.name}</span>
            <button type="button" onClick={logout} className="app-logout">
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
