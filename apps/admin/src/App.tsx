import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Payments from './pages/Payments';
import Logs from './pages/Logs';
import CreateClient from './pages/CreateClient';
import AdminSettings from './pages/Settings';
import Charts from './pages/Charts';
import Notifications from './pages/Notifications';

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('admin_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin_theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return { theme, toggle };
}

function Sidebar() {
  const navigate = useNavigate();
  const links = [
    { to: '/', icon: '📊', label: 'Dashboard' },
    { to: '/charts', icon: '📈', label: 'Charts' },
    { to: '/clients', icon: '👥', label: 'Clients' },
    { to: '/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/payments', icon: '💰', label: 'Payments' },
    { to: '/logs', icon: '📋', label: 'Logs' },
    { to: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <h2>🧱 BrickPro</h2>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Super Admin Panel</span>
      </div>
      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
            <span>{l.icon}</span> {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { localStorage.clear(); navigate('/login'); window.location.reload(); }}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}

function Topbar({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
  return (
    <header className="admin-topbar">
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <span style={{ fontSize: 13 }}>{admin.name || 'Admin'}</span>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff' }}>
          {(admin.name || 'A')[0]}
        </div>
      </div>
    </header>
  );
}

function Layout() {
  const { theme, toggle } = useTheme();
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <Topbar theme={theme} toggleTheme={toggle} />
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('admin_token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) return null;

  const loggedIn = !!localStorage.getItem('admin_token');

  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={loggedIn ? <Navigate to="/" /> : <Login />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<CreateClient />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
