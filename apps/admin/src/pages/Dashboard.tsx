import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/overview'),
      api.get('/clients'),
    ]).then(([s, o, c]) => {
      setStats(s.data);
      setOverview(o.data);
      setClients(c.data.slice(0, 5));
    }).catch(() => toast.error('Failed to load'));
  }, []);

  if (!stats || !overview) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>;

  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>+ New Client</button>
      </div>

      <div className="stat-grid">
        {[
          { label: 'Total Clients', value: stats.totalClients, color: 'var(--primary)', to: '/clients' },
          { label: 'Active (Paid)', value: stats.premiumClients, color: 'var(--success)', to: '/clients' },
          { label: 'Free Trial', value: stats.trialClients, color: 'var(--warning)', to: '/clients' },
          { label: 'Expired', value: stats.expiredClients, color: 'var(--danger)', to: '/clients' },
          { label: 'Total Factories', value: stats.totalFactories, color: 'var(--info)', to: '/clients' },
          { label: 'Total Users', value: stats.totalUsers, color: '#a29bfe', to: '/clients' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ cursor: 'pointer', transition: 'transform 0.15s' }} onClick={() => navigate(s.to)} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => (e.currentTarget.style.transform = 'none')}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {[
          { label: 'Total Revenue (All Clients)', value: fmt(overview.totalRevenue), color: 'var(--success)' },
          { label: 'This Month Revenue', value: fmt(overview.monthRevenue), color: 'var(--info)' },
          { label: 'Total Expenses', value: fmt(overview.totalExpenses), color: 'var(--danger)' },
          { label: 'Net Profit (All Time)', value: fmt(overview.netProfit), color: overview.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>💰 Payment Collection (Due 25th)</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/payments')}>View All →</button>
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>Client</th><th>Amount</th><th>Month</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {clients.filter((c: any) => c.payments?.some((p: any) => p.status === 'pending')).slice(0, 5).map((c: any) => {
              const pending = c.payments?.find((p: any) => p.status === 'pending');
              return pending ? (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{pending.amount?.toLocaleString()}</td>
                  <td>{pending.month} {pending.year}</td>
                  <td><span className="badge badge-warning">Not Collected</span></td>
                  <td>
                    <button className="btn btn-success btn-sm" onClick={async (e) => { e.stopPropagation(); try { await api.patch(`/payments/${pending.id}`, { status: 'collected' }); toast.success('Marked collected!'); window.location.reload(); } catch { toast.error('Failed'); } }}>✓ Collected</button>
                  </td>
                </tr>
              ) : null;
            })}
            {clients.filter((c: any) => c.payments?.some((p: any) => p.status === 'pending')).length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>All payments collected ✅</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>Recent Clients</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')}>View All →</button>
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Mobile</th><th>Status</th><th>Factories</th><th>Users</th><th></th></tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/clients/${c.id}`)}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td>{c.mobile}</td>
                <td>
                  <span className={`badge ${c.subscriptionStatus === 'ACTIVE' ? 'badge-success' : c.subscriptionStatus === 'TRIAL' ? 'badge-warning' : 'badge-danger'}`}>
                    {c.subscriptionStatus}
                  </span>
                  {!c.active && <span className="badge badge-danger" style={{ marginLeft: 4 }}>DISABLED</span>}
                </td>
                <td>{c.factories.length}</td>
                <td>{c.users.length}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/clients/${c.id}`); }}>View →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
