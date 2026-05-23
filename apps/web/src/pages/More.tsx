import { Link } from 'react-router-dom';
import { useAppStore } from '../store/app';
import { useAuthStore } from '../store/auth';

export default function More() {
  const lang = useAppStore((s) => s.lang);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const items = [
    { icon: '👷', label: lang === 'en' ? 'Manpower' : 'मजदूर', to: '/labour' },
    { icon: '🪨', label: lang === 'en' ? 'Raw Materials' : 'कच्चा माल', to: '/raw-materials' },
    { icon: '💸', label: lang === 'en' ? 'Expenditure' : 'खर्चे', to: '/expenditure' },
    { icon: '⛽', label: lang === 'en' ? 'Fuel' : 'ईंधन', to: '/fuel' },
    { icon: '📊', label: lang === 'en' ? 'Reports' : 'रिपोर्ट', to: '/reports' },
    ...(user?.role === 'OWNER' ? [{ icon: '👤', label: lang === 'en' ? 'Users' : 'उपयोगकर्ता', to: '/users' }] : []),
    { icon: '⚙️', label: lang === 'en' ? 'Settings' : 'सेटिंग्स', to: '/settings' },
  ];

  return (
    <div className="page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => (
          <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', textDecoration: 'none', color: 'var(--text)', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
          </Link>
        ))}
      </div>
      <button onClick={logout} style={{ marginTop: 20, background: 'var(--danger)', color: 'white', padding: '12px', width: '100%', fontSize: 14, borderRadius: 8, fontWeight: 600 }}>
        {lang === 'en' ? 'Logout' : 'लॉगआउट'}
      </button>
    </div>
  );
}
