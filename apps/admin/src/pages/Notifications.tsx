import { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TEMPLATES = [
  { id: 'welcome', title: 'Welcome! 🎉', message: 'Welcome to BrickPro! Your account is ready. Explore all features.', type: 'info' },
  { id: 'trial', title: '7 Days Free Trial ⏰', message: 'Your free trial is active for 7 days. Subscribe at ₹999/month to continue after trial.', type: 'promo' },
  { id: 'premium', title: 'Check Premium Plans 💎', message: 'Go to Settings to view premium plan details. Contact admin for yearly discounts!', type: 'info' },
  { id: 'payment_reminder', title: 'Payment Reminder 💰', message: 'Please pay before 25th of this month to avoid service interruption. Contact admin for UPI/Bank details.', type: 'warning' },
  { id: 'yearly_offer', title: '1 Year Plan — Save 20% 🎁', message: 'Get BrickPro for ₹9,999/year (save ₹2,000!). Contact sales to activate yearly plan.', type: 'promo' },
  { id: 'update', title: 'New Update Available 🔄', message: 'BrickPro has been updated with new features. Refresh your app to see the latest changes!', type: 'update' },
  { id: 'maintenance', title: 'Scheduled Maintenance ⚠️', message: 'BrickPro will be under maintenance tonight 11PM-1AM. Sorry for inconvenience.', type: 'warning' },
  { id: 'trial_ending', title: 'Trial Ending Soon ⏳', message: 'Your free trial ends in 2 days. Subscribe now at ₹999/month to keep your data safe.', type: 'warning' },
  { id: 'thank_you', title: 'Thank You! 🙏', message: 'Thank you for using BrickPro. We appreciate your business. Contact us anytime for support.', type: 'info' },
  { id: 'refer', title: 'Refer & Earn 🤝', message: 'Refer BrickPro to another brick factory owner and get 1 month free! Contact admin for details.', type: 'promo' },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [sendTo, setSendTo] = useState<'all' | 'selected'>('all');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'send' | 'templates' | 'history'>('send');

  useEffect(() => {
    load();
    api.get('/clients').then(r => setClients(r.data)).catch(() => {});
  }, []);

  const load = () => {
    api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
  };

  const send = async () => {
    if (!form.title || !form.message) return toast.error('Title and message required');
    setSending(true);
    try {
      if (sendTo === 'all') {
        await api.post('/notifications', { ...form, clientId: null });
      } else {
        if (selectedClients.length === 0) { toast.error('Select at least one client'); setSending(false); return; }
        await Promise.all(selectedClients.map(cId => api.post('/notifications', { ...form, clientId: cId })));
      }
      toast.success(`Notification sent to ${sendTo === 'all' ? 'all clients' : selectedClients.length + ' clients'}!`);
      setForm({ title: '', message: '', type: 'info' });
      setSelectedClients([]);
      load();
    } catch { toast.error('Failed'); }
    setSending(false);
  };

  const useTemplate = (t: any) => {
    setForm({ title: t.title, message: t.message, type: t.type });
    setTab('send');
    toast.success('Template loaded — edit & send!');
  };

  const quickSend = async (t: any, clientId?: string) => {
    try {
      await api.post('/notifications', { title: t.title, message: t.message, type: t.type, clientId: clientId || null });
      toast.success('Sent!');
      load();
    } catch { toast.error('Failed'); }
  };

  const remove = async (id: string) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    load();
  };

  const toggleClient = (id: string) => {
    setSelectedClients(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedClients(clients.map(c => c.id));
  const deselectAll = () => setSelectedClients([]);

  const typeColors: any = { info: '#3b82f6', warning: '#f59e0b', promo: '#10b981', update: '#6C63FF' };
  const tabStyle = (active: boolean) => ({ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600 as const, border: 'none', borderRadius: 8, cursor: 'pointer' as const, background: active ? 'var(--primary)' : 'var(--surface)', color: active ? 'white' : 'var(--text)' });

  // Suggest clients: trial ending soon, expired, no recent activity
  const suggestedClients = clients.filter(c => {
    if (c.subscriptionStatus === 'TRIAL') return true;
    if (c.subscriptionStatus === 'EXPIRED') return true;
    return false;
  });

  return (
    <div>
      <div className="page-header">
        <h1>🔔 Notifications</h1>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Send & manage notifications</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        <button onClick={() => setTab('send')} style={tabStyle(tab === 'send')}>📤 Send</button>
        <button onClick={() => setTab('templates')} style={tabStyle(tab === 'templates')}>📋 Templates</button>
        <button onClick={() => setTab('history')} style={tabStyle(tab === 'history')}>📜 History ({notifications.length})</button>
      </div>

      {/* SEND TAB */}
      {tab === 'send' && (
        <div>
          <div className="stat-card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>📤 Compose Notification</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Payment Reminder" />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="promo">🎉 Promo</option>
                  <option value="update">🔄 Update</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Message *</label>
              <textarea className="form-input" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Notification message..." />
            </div>

            {/* Send To */}
            <div className="form-group">
              <label className="form-label">Send To</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button onClick={() => setSendTo('all')} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: sendTo === 'all' ? 'var(--primary)' : 'var(--surface)', color: sendTo === 'all' ? 'white' : 'var(--text)', fontSize: 13, fontWeight: 500 }}>📢 All Clients</button>
                <button onClick={() => setSendTo('selected')} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: sendTo === 'selected' ? 'var(--primary)' : 'var(--surface)', color: sendTo === 'selected' ? 'white' : 'var(--text)', fontSize: 13, fontWeight: 500 }}>🎯 Select Clients</button>
              </div>
            </div>

            {sendTo === 'selected' && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{selectedClients.length} selected</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={selectAll} style={{ fontSize: 11, color: 'var(--primary)', background: 'none', padding: 0 }}>Select All</button>
                    <button onClick={deselectAll} style={{ fontSize: 11, color: 'var(--danger)', background: 'none', padding: 0 }}>Deselect</button>
                  </div>
                </div>
                {clients.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleClient(c.id)} />
                    <span>{c.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>({c.mobile}) — {c.subscriptionStatus}</span>
                  </label>
                ))}
              </div>
            )}

            <button className="btn btn-primary" onClick={send} disabled={sending} style={{ marginTop: 8 }}>
              {sending ? 'Sending...' : '🚀 Send Notification'}
            </button>
          </div>

          {/* Suggested Clients */}
          {suggestedClients.length > 0 && (
            <div className="stat-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 12 }}>💡 Suggested — Send reminder to these clients</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestedClients.map(c => (
                  <div key={c.id} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{c.name}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: c.subscriptionStatus === 'TRIAL' ? '#fef3c7' : '#fee2e2', color: c.subscriptionStatus === 'TRIAL' ? '#92400e' : '#991b1b' }}>{c.subscriptionStatus}</span>
                    <button onClick={() => { setSelectedClients([c.id]); setSendTo('selected'); setTab('send'); }} style={{ fontSize: 10, color: 'var(--primary)', background: 'none', padding: 0 }}>→ Send</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEMPLATES TAB */}
      {tab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {TEMPLATES.map(t => (
            <div key={t.id} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 10, borderLeft: `4px solid ${typeColors[t.type]}`, background: 'var(--surface)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{t.title}</div>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>{t.message}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => useTemplate(t)} style={{ fontSize: 11, padding: '6px 10px', background: 'var(--primary)', color: 'white', borderRadius: 6 }}>✏️ Edit & Send</button>
                <button onClick={() => quickSend(t)} style={{ fontSize: 11, padding: '6px 10px', background: 'var(--success)', color: 'white', borderRadius: 6 }}>📢 Send to All</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="stat-card" style={{ padding: 20 }}>
          {notifications.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No notifications sent yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.map(n => (
                <div key={n.id} style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, borderLeft: `4px solid ${typeColors[n.type] || '#999'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{format(new Date(n.createdAt), 'dd MMM, hh:mm a')}</span>
                      <button onClick={() => quickSend({ title: n.title, message: n.message, type: n.type })} style={{ background: 'none', color: 'var(--success)', fontSize: 12, padding: '2px 6px' }}>🔁</button>
                      <button onClick={() => remove(n.id)} style={{ background: 'none', color: 'var(--danger)', fontSize: 14, padding: '2px 6px' }}>🗑</button>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{n.message}</p>
                  <span style={{ fontSize: 11, color: typeColors[n.type], fontWeight: 600 }}>
                    {n.clientId ? `→ ${clients.find(c => c.id === n.clientId)?.name || 'Specific client'}` : '→ All Clients'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
