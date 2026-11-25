import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="brand">
            JobPilot
          </NavLink>

          <nav className="nav-links">
            <NavLink to="/" end className="nav-link">
              Dashboard
            </NavLink>
            <NavLink to="/resume" className="nav-link">
              Upload Resume
            </NavLink>
            <NavLink to="/preferences" className="nav-link">
              Preferences
            </NavLink>
            <NavLink to="/approvals" className="nav-link">
              Pending Approvals
            </NavLink>
            <NavLink to="/history" className="nav-link">
              Application History
            </NavLink>
          </nav>

          <div className="nav-user">
            <span>{user?.name}</span>
            <button type="button" className="btn btn-outline" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}

