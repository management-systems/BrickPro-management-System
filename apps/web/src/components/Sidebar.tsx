import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/app';
import { useAuthStore } from '../store/auth';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const lang = useAppStore((s) => s.lang);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const items = [
    { to: '/', icon: '🏠', label: lang === 'en' ? 'Dashboard' : 'डैशबोर्ड' },
    { to: '/production', icon: '🧱', label: lang === 'en' ? 'Production' : 'उत्पादन' },
    { to: '/dispatch', icon: '🚛', label: lang === 'en' ? 'Sell Bricks' : 'ईंट बिक्री' },
    { to: '/invoice', icon: '📄', label: lang === 'en' ? 'Invoice' : 'बिल' },
    { to: '/customers', icon: '👥', label: lang === 'en' ? 'Customers' : 'ग्राहक' },
    { to: '/labour', icon: '👷', label: lang === 'en' ? 'Manpower' : 'मजदूर' },
    { to: '/raw-materials', icon: '🪨', label: lang === 'en' ? 'Raw Materials' : 'कच्चा माल' },
    { to: '/expenditure', icon: '💸', label: lang === 'en' ? 'Expenditure' : 'खर्चे' },
    { to: '/fuel', icon: '⛽', label: lang === 'en' ? 'Fuel' : 'ईंधन' },
    { to: '/reports', icon: '📊', label: lang === 'en' ? 'Reports' : 'रिपोर्ट' },
    { to: '/calendar', icon: '📅', label: lang === 'en' ? 'Calendar' : 'कैलेंडर' },
    ...(user?.role === 'OWNER' || user?.role === 'MANAGER' ? [{ to: '/edit-history', icon: '📝', label: lang === 'en' ? 'Edit History' : 'संपादन इतिहास' }] : []),
    ...(user?.role === 'OWNER' ? [{ to: '/users', icon: '👤', label: lang === 'en' ? 'Users' : 'उपयोगकर्ता' }] : []),
    { to: '/settings', icon: '⚙️', label: lang === 'en' ? 'Settings' : 'सेटिंग्स' },
  ];


  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span style={{ fontSize: 20 }}>🧱</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>BrickPro</span>
        </div>

        <div className="sidebar-user">
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{user?.role}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => onClose()}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a href="https://managementsystems.in" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', fontSize: 10, color: 'var(--text-light)', textDecoration: 'none', marginBottom: 8 }}>
            🌐 managementsystems.in
          </a>
          <button onClick={() => { logout(); onClose(); }} className="sidebar-logout">
            🚪 {lang === 'en' ? 'Logout' : 'लॉगआउट'}
          </button>
        </div>
      </aside>
    </>
  );
}
