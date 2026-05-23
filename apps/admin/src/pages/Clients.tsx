import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch { toast.error('Failed to load clients'); }
  };

  const toggleService = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/clients/${id}/toggle`);
      toast.success('Updated');
      loadClients();
    } catch { toast.error('Failed'); }
  };

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search);
    const matchStatus = !statusFilter || c.subscriptionStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Clients ({clients.length})</h1>
        <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>+ Create Admin</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input className="form-input" style={{ maxWidth: 300 }} placeholder="Search by name or mobile..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ maxWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="TRIAL">Trial</option>
          <option value="EXPIRED">Expired</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <table className="admin-table">
        <thead>
          <tr><th>Name</th><th>Mobile</th><th>Email</th><th>Status</th><th>Active</th><th>Plan</th><th>Factories</th><th>Users</th><th>Started</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/clients/${c.id}`)}>
              <td style={{ fontWeight: 500 }}>{c.name}</td>
              <td>{c.mobile}</td>
              <td style={{ color: 'var(--muted)' }}>{c.email || '—'}</td>
              <td>
                <span className={`badge ${c.subscriptionStatus === 'ACTIVE' ? 'badge-success' : c.subscriptionStatus === 'TRIAL' ? 'badge-warning' : 'badge-danger'}`}>
                  {c.subscriptionStatus}
                </span>
              </td>
              <td>
                <span style={{ color: c.active ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {c.active ? '● ON' : '● OFF'}
                </span>
              </td>
              <td>{c.plan}</td>
              <td>{c.factories.length}</td>
              <td>{c.users.length}</td>
              <td style={{ fontSize: 12, color: 'var(--muted)' }}>{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
              <td onClick={e => e.stopPropagation()}>
                <button className={`btn btn-sm ${c.active ? 'btn-danger' : 'btn-success'}`} onClick={e => toggleService(c.id, e)}>
                  {c.active ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
