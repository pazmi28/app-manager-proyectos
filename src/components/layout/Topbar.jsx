// src/components/layout/Topbar.jsx
import { useNavigate, NavLink } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <header className="lay-topbar">
      <div className="lay-topbar-brand">
        <span className="lay-topbar-logo">⬡</span>
        <div>
          <div className="lay-topbar-title">Project Advisor</div>
          <div className="lay-topbar-sub">{user?.email}</div>
        </div>
      </div>

      <nav className="lay-topbar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            'lay-nav-btn' + (isActive ? ' active' : '')
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/sessions"
          className={({ isActive }) =>
            'lay-nav-btn' + (isActive ? ' active' : '')
          }
        >
          Sesiones
        </NavLink>
        <NavLink
          to="/new-project"
          className={({ isActive }) =>
            'lay-nav-btn lay-nav-btn--new' + (isActive ? ' active' : '')
          }
        >
          + Nuevo
        </NavLink>
      </nav>

      <button className="lay-logout-btn" onClick={handleLogout}>
        Salir
      </button>
    </header>
  );
}
