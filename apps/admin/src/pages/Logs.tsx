import { useEffect, useState } from 'react';
import api from '../lib/api';
import { format } from 'date-fns';

export default function Logs() {
  const [tab, setTab] = useState<'admin' | 'activity'>('admin');
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadLogs(); }, [tab, page]);

  const loadLogs = async () => {
    try {
      if (tab === 'admin') {
        const { data } = await api.get(`/logs?page=${page}&limit=30`);
        setAdminLogs(data.logs);
        setTotalPages(data.totalPages);
      } else {
        const { data } = await api.get(`/activity?page=${page}&limit=30`);
        setActivityLogs(data.logs);
        setTotalPages(data.totalPages);
      }
    } catch {}
  };

  const actionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'badge-info';
    if (action.includes('DISABLE') || action.includes('EXPIRED') || action.includes('DELETE')) return 'badge-danger';
    if (action.includes('ENABLE') || action.includes('CREATE') || action.includes('COLLECTED')) return 'badge-success';
    if (action.includes('PAYMENT')) return 'badge-warning';
    return 'badge-info';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Logs</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => { setTab('admin'); setPage(1); }}>Admin Actions</button>
        <button className={`tab ${tab === 'activity' ? 'active' : ''}`} onClick={() => { setTab('activity'); setPage(1); }}>User Activity</button>
      </div>

      {tab === 'admin' && (
        <table className="admin-table">
          <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Target</th><th>Details</th><th>IP</th></tr></thead>
          <tbody>
            {adminLogs.map(log => (
              <tr key={log.id}>
                <td style={{ fontSize: 12 }}>{format(new Date(log.createdAt), 'dd MMM, hh:mm a')}</td>
                <td>{log.admin.name}</td>
                <td><span className={`badge ${actionColor(log.action)}`}>{log.action}</span></td>
                <td>{log.target || '—'}</td>
                <td style={{ color: 'var(--muted)', maxWidth: 200 }}>{log.details || '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--muted)' }}>{log.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'activity' && (
        <table className="admin-table">
          <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>Target</th><th>Details</th></tr></thead>
          <tbody>
            {activityLogs.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No activity logs yet</td></tr>
            )}
            {activityLogs.map(log => (
              <tr key={log.id}>
                <td style={{ fontSize: 12 }}>{format(new Date(log.createdAt), 'dd MMM, hh:mm a')}</td>
                <td>{log.userName || '—'}</td>
                <td><span className={`badge ${actionColor(log.action)}`}>{log.action}</span></td>
                <td>{log.module || '—'}</td>
                <td>{log.target || '—'}</td>
                <td style={{ color: 'var(--muted)', maxWidth: 200 }}>{log.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
        <span style={{ color: 'var(--muted)', alignSelf: 'center', fontSize: 13 }}>Page {page} of {totalPages}</span>
        <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
      </div>
    </div>
  );
}
