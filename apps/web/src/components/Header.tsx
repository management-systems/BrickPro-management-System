import { useState, useEffect } from 'react';
import { useAppStore } from '../store/app';
import { useAuthStore } from '../store/auth';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Props {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: Props) {
  const { lang, theme, toggleLang, toggleTheme, factories, activeFactory, setActiveFactory, loadFactories } = useAppStore();
  const user = useAuthStore((s) => s.user);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    api.get('/reports/notifications').then(r => setNotifications(r.data)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/reports/notifications').then(r => setNotifications(r.data)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: string) => {
    await api.patch(`/reports/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => api.patch(`/reports/notifications/${n.id}/read`).catch(() => {})));
    setNotifications([]);
  };

  const activeFactoryName = factories.find((f) => f.id === activeFactory)?.name || '';

  const handleAddFactory = async () => {
    if (!newName.trim()) return toast.error('Enter factory name');
    try {
      await api.post('/factories', { name: newName.trim() });
      toast.success('Factory added!');
      setNewName('');
      setShowAdd(false);
      await loadFactories();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  return (
    <>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Hamburger - mobile only */}
          <button onClick={onMenuClick} className="hamburger-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {factories.length > 1 ? (
            <select
              value={activeFactory || ''}
              onChange={(e) => setActiveFactory(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '4px 24px 4px 8px', fontSize: 13, fontWeight: 600, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              {factories.map((f) => (
                <option key={f.id} value={f.id} style={{ color: '#333' }}>{f.name}</option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 600 }}>{activeFactoryName}</span>
          )}
          {user?.role === 'OWNER' && (
            <button onClick={() => setShowAdd(true)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', width: 22, height: 22, borderRadius: 4, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>+</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Notification Bell */}
          <button onClick={() => setShowNotif(!showNotif)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 18, padding: 0 }}>
            🔔
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--danger)', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
          </button>
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={toggleLang} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '3px 8px', fontSize: 11, borderRadius: 4 }}>
            {lang === 'en' ? 'हि' : 'EN'}
          </button>
        </div>
      </div>

      {showNotif && (
        <div style={{ position: 'fixed', top: 50, right: 10, width: 320, maxHeight: '70vh', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 1000, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>🔔 Notifications</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unreadCount > 0 && <button onClick={clearAll} style={{ background: 'none', fontSize: 11, padding: '4px 8px', color: 'var(--primary)', border: '1px solid var(--border)', borderRadius: 4 }}>✓ Clear All</button>}
              <button onClick={() => setShowNotif(false)} style={{ background: 'none', fontSize: 18, padding: 0, color: 'var(--text-light)' }}>✕</button>
            </div>
          </div>
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notifications</p>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.read ? 'transparent' : 'var(--primary-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{n.title}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4, lineHeight: 1.4 }}>{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {showNotif && <div onClick={() => setShowNotif(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 20, width: '100%', maxWidth: 300 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Add Factory</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Factory name"
              style={{ marginBottom: 12 }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFactory()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 9, background: '#f3f4f6', borderRadius: 6 }}>Cancel</button>
              <button onClick={handleAddFactory} style={{ flex: 1, padding: 9, background: 'var(--primary)', color: 'white', borderRadius: 6 }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
