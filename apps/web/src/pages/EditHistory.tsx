import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import api from '../lib/api';

export default function EditHistory() {
  const user = useAuthStore(s => s.user);
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterModule, setFilterModule] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [page, filterModule]);

  const load = async () => {
    try {
      const params: any = { page };
      if (filterModule) params.module = filterModule;
      const { data } = await api.get('/edit/history', { params });
      setLogs(data.logs);
      setTotal(data.total);
    } catch {}
  };

  if (!['OWNER', 'MANAGER'].includes(user?.role || '')) {
    return <div className="page"><div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>⚠️ Only Owner and Manager can view edit history</div></div>;
  }

  const moduleColor = (m: string) => {
    const map: Record<string, string> = { production: '#6C63FF', dispatch: '#10B981', expenditure: '#EF4444', fuel: '#F59E0B' };
    return map[m] || 'var(--text-light)';
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>📝 Edit History</h2>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} total edits</span>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by user, field, reason..." style={{ flex: 1 }} />
        <select value={filterModule} onChange={e => { setFilterModule(e.target.value); setPage(1); }}>
          <option value="">All Modules</option>
          <option value="production">Production</option>
          <option value="dispatch">Dispatch / Sales</option>
          <option value="expenditure">Expenditure</option>
          <option value="fuel">Fuel</option>
        </select>
      </div>

      {/* Edit Log Table (Desktop) */}
      <table className="data-table">
        <thead>
          <tr><th>Time</th><th>User</th><th>Role</th><th>Module</th><th>Field</th><th>Old Value</th><th>New Value</th><th>Reason</th></tr>
        </thead>
        <tbody>
          {logs.filter(l => !search || l.userName?.toLowerCase().includes(search.toLowerCase()) || l.field?.toLowerCase().includes(search.toLowerCase()) || l.reason?.toLowerCase().includes(search.toLowerCase()) || l.module?.toLowerCase().includes(search.toLowerCase()) || l.oldValue?.toLowerCase().includes(search.toLowerCase()) || l.newValue?.toLowerCase().includes(search.toLowerCase())).map(log => (
            <tr key={log.id}>
              <td style={{ fontSize: 12 }}>{new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
              <td style={{ fontWeight: 500 }}>{log.userName}</td>
              <td><span className="badge" style={{ background: 'var(--bg)', fontSize: 10 }}>{log.userRole}</span></td>
              <td><span style={{ color: moduleColor(log.module), fontWeight: 600, fontSize: 12 }}>{log.module.toUpperCase()}</span></td>
              <td style={{ fontSize: 13 }}>{log.field}</td>
              <td style={{ color: 'var(--danger)', fontSize: 13, textDecoration: 'line-through' }}>{log.oldValue || '—'}</td>
              <td style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>{log.newValue || '—'}</td>
              <td style={{ fontSize: 12, color: 'var(--text-light)', maxWidth: 150 }}>{log.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="data-cards-mobile">
        {logs.filter(l => !search || l.userName?.toLowerCase().includes(search.toLowerCase()) || l.field?.toLowerCase().includes(search.toLowerCase()) || l.reason?.toLowerCase().includes(search.toLowerCase()) || l.module?.toLowerCase().includes(search.toLowerCase())).map(log => (
          <div key={log.id} className="data-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <span style={{ fontWeight: 600 }}>{log.userName}</span>
                <span className="badge" style={{ marginLeft: 6, background: 'var(--bg)', fontSize: 10 }}>{log.userRole}</span>
              </div>
              <span style={{ color: moduleColor(log.module), fontWeight: 600, fontSize: 11 }}>{log.module.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              <strong>{log.field}:</strong>{' '}
              <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{log.oldValue}</span>
              {' → '}
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{log.newValue}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>💬 {log.reason}</span>
              <span>{new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>

      {logs.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>No edits recorded yet</p>}

      {/* Pagination */}
      {total > 50 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-outline btn-sm">← Prev</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>Page {page}</span>
          <button disabled={logs.length < 50} onClick={() => setPage(page + 1)} className="btn-outline btn-sm">Next →</button>
        </div>
      )}

      {/* Time Limits Info */}
      <div className="card" style={{ marginTop: 24, padding: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>⏱️ Edit Time Limits</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, fontSize: 12 }}>
          <div><strong>Owner:</strong> Anytime</div>
          <div><strong>Manager:</strong> 24 hours</div>
          <div><strong>Supervisor:</strong> 2 hours</div>
          <div><strong>Accountant:</strong> 24 hours</div>
          <div><strong>Operator:</strong> 30 minutes</div>
          <div><strong>Worker:</strong> Cannot edit</div>
        </div>
      </div>
    </div>
  );
}
