import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [tab, setTab] = useState<'overview' | 'users' | 'customers' | 'reports' | 'payments'>('overview');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', month: '', year: new Date().getFullYear(), remarks: '' });
  const [statusEdit, setStatusEdit] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    try {
      const [c, u] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/clients/${id}/users`),
      ]);
      setClient(c.data);
      setUsers(u.data);
      setStatusEdit(c.data.subscriptionStatus);
      loadReports();
      loadCustomers();
    } catch { toast.error('Failed to load'); }
  };

  const loadCustomers = async () => {
    try {
      const { data } = await api.get(`/clients/${id}/customers`);
      setCustomers(data);
    } catch {}
  };

  const loadReports = async () => {
    try {
      const params: any = {};
      if (month) params.month = month;
      if (year) params.year = year;
      const { data } = await api.get(`/clients/${id}/reports`, { params });
      setReports(data);
    } catch {}
  };

  useEffect(() => { if (id) loadReports(); }, [month, year]);

  const changeStatus = async () => {
    try {
      await api.patch(`/clients/${id}/status`, { status: statusEdit });
      toast.success('Status updated');
      loadAll();
    } catch { toast.error('Failed'); }
  };

  const toggleService = async () => {
    try {
      await api.patch(`/clients/${id}/toggle`);
      toast.success('Toggled');
      loadAll();
    } catch { toast.error('Failed'); }
  };

  const addPayment = async () => {
    try {
      await api.post(`/clients/${id}/payments`, { ...payForm, amount: parseFloat(payForm.amount), year: payForm.year });
      toast.success('Payment added');
      setPayModal(false);
      setPayForm({ amount: '', month: '', year: new Date().getFullYear(), remarks: '' });
      loadAll();
    } catch { toast.error('Failed'); }
  };

  const markCollected = async (payId: string) => {
    try {
      await api.patch(`/payments/${payId}`, { status: 'collected' });
      toast.success('Marked collected');
      loadAll();
    } catch { toast.error('Failed'); }
  };

  if (!client) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>;

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')}>← Back</button>
          <h1>{client.name}</h1>
          <span className={`badge ${client.active ? 'badge-success' : 'badge-danger'}`}>{client.active ? 'ACTIVE' : 'DISABLED'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${client.active ? 'btn-danger' : 'btn-success'} btn-sm`} onClick={toggleService}>
            {client.active ? '⏸ Disable' : '▶ Enable'}
          </button>
          <button className="btn btn-warning btn-sm" onClick={() => setPayModal(true)}>+ Payment</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['overview', 'users', 'customers', 'reports', 'payments'] as const).map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? '📋 Overview' : t === 'users' ? '👤 Users' : t === 'customers' ? '👥 Customers' : t === 'reports' ? '📊 Reports' : '💰 Payments'}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="detail-grid">
          <div className="detail-card">
            <h4>Client Info</h4>
            <p><strong>Name:</strong> {client.name}</p>
            <p><strong>Mobile:</strong> {client.mobile}</p>
            <p><strong>Email:</strong> {client.email || '—'}</p>
            <p><strong>Plan:</strong> {client.plan}</p>
            <p><strong>Registered:</strong> {format(new Date(client.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
            <p><strong>Trial Ends:</strong> {format(new Date(client.trialEndsAt), 'dd MMM yyyy')}</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="form-select" style={{ width: 140 }} value={statusEdit} onChange={e => setStatusEdit(e.target.value)}>
                <option value="TRIAL">TRIAL</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={changeStatus}>Update</button>
            </div>
          </div>

          <div className="detail-card">
            <h4>Factories ({client.factories.length})</h4>
            {client.factories.map((f: any) => (
              <div key={f.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <strong>{f.name}</strong>
                {f.location && <span style={{ color: 'var(--muted)', marginLeft: 8 }}>📍 {f.location}</span>}
              </div>
            ))}
          </div>

          <div className="detail-card">
            <h4>Quick Stats</h4>
            <p><strong>Users:</strong> {users.length}</p>
            <p><strong>Factories:</strong> {client.factories.length}</p>
            <p><strong>Payments:</strong> {client.payments.length}</p>
            <p><strong>Collected:</strong> {fmt(client.payments.filter((p: any) => p.status === 'collected').reduce((s: number, p: any) => s + p.amount, 0))}</p>
            <p><strong>Pending:</strong> {fmt(client.payments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + p.amount, 0))}</p>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div>
          <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 13 }}>All users and their login credentials for this client</p>
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Mobile</th><th>Email</th><th>Password</th><th>PIN</th><th>Status</th><th>Factories</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td><span className="badge badge-info">{u.role}</span></td>
                  <td>{u.mobile || '—'}</td>
                  <td>{u.email || '—'}</td>
                  <td style={{ fontSize: 13 }}>
                    {u.plainPassword ? (
                      <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4, color: '#92400e' }}>{u.plainPassword}</code>
                    ) : u.password ? (
                      <span style={{ color: 'var(--muted)' }}>••••••• <span style={{ fontSize: 10, color: 'var(--warning)' }}>(hashed)</span></span>
                    ) : '—'}
                  </td>
                  <td>{u.pin || '—'}</td>
                  <td>
                    <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>{u.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {u.factories.map((uf: any) => (
                      <div key={uf.id}>{uf.factory.name} <span style={{ color: 'var(--muted)' }}>({uf.role})</span></div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CUSTOMERS TAB */}
      {tab === 'customers' && (
        <div>
          <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 13 }}>All customers of this client ({customers.length})</p>
          {customers.length === 0 ? (
            <p style={{ color: 'var(--muted)', padding: 20 }}>No customers yet</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Mobile</th><th>Address</th><th>GSTIN</th><th>Total Sales</th><th>Outstanding</th><th>Created</th></tr>
              </thead>
              <tbody>
                {customers.map((c: any) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{c.mobile || '—'}</td>
                    <td style={{ fontSize: 12, maxWidth: 200 }}>{c.address || '—'}</td>
                    <td style={{ fontSize: 12 }}>{c.gstin || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(c._totalSales || 0)}</td>
                    <td style={{ fontWeight: 600, color: (c._outstanding || 0) > 0 ? 'var(--danger)' : 'var(--muted)' }}>{fmt(c._outstanding || 0)}</td>
                    <td style={{ fontSize: 12 }}>{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* REPORTS TAB */}
      {tab === 'reports' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <select className="form-select" style={{ width: 120 }} value={month} onChange={e => setMonth(e.target.value)}>
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('en', { month: 'short' })}</option>)}
            </select>
            <select className="form-select" style={{ width: 100 }} value={year} onChange={e => setYear(e.target.value)}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {reports ? (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(reports.totalSales)}</div>
                  <div className="stat-label">Total Sales</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--info)' }}>{fmt(reports.totalReceived)}</div>
                  <div className="stat-label">Amount Received</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--warning)' }}>{fmt(reports.totalOutstanding)}</div>
                  <div className="stat-label">Outstanding</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(reports.totalExpenses)}</div>
                  <div className="stat-label">Total Expenses</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: reports.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(reports.netProfit)}</div>
                  <div className="stat-label">Net Profit / Loss</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--primary)' }}>{reports.totalBricksSold.toLocaleString()}</div>
                  <div className="stat-label">Bricks Sold</div>
                </div>
              </div>

              <div className="detail-grid" style={{ marginTop: 24 }}>
                <div className="detail-card">
                  <h4>Production</h4>
                  <p><strong>Raw Bricks:</strong> {reports.totalRawProduced.toLocaleString()}</p>
                  <p><strong>Fired Bricks:</strong> {reports.totalFiredProduced.toLocaleString()}</p>
                  <p><strong>Production Days:</strong> {reports.productionDays}</p>
                  <p><strong>Dispatches:</strong> {reports.dispatchCount}</p>
                </div>

                <div className="detail-card">
                  <h4>Expense Breakdown</h4>
                  {Object.entries(reports.expenseByCategory).length === 0 ? (
                    <p style={{ color: 'var(--muted)' }}>No expenses</p>
                  ) : (
                    Object.entries(reports.expenseByCategory).sort((a: any, b: any) => b[1] - a[1]).map(([cat, amt]: any) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <span>{cat}</span>
                        <span style={{ fontWeight: 600 }}>{fmt(amt)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="detail-card">
                  <h4>Top Customers</h4>
                  {reports.topCustomers.length === 0 ? (
                    <p style={{ color: 'var(--muted)' }}>No customers</p>
                  ) : (
                    reports.topCustomers.map((c: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <span>{c.name}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600 }}>{fmt(c.totalAmount)}</div>
                          {c.outstanding > 0 && <div style={{ fontSize: 11, color: 'var(--danger)' }}>Due: {fmt(c.outstanding)}</div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* P&L Summary */}
              <div className="detail-card" style={{ marginTop: 24 }}>
                <h4>Profit & Loss Summary</h4>
                <table className="admin-table">
                  <tbody>
                    <tr><td>Total Sales (Income)</td><td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>+ {fmt(reports.totalSales)}</td></tr>
                    <tr><td>Total Expenses</td><td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>- {fmt(reports.totalExpenses)}</td></tr>
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td style={{ fontWeight: 700, fontSize: 16 }}>Net {reports.netProfit >= 0 ? 'Profit' : 'Loss'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: reports.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {reports.netProfit >= 0 ? '+' : ''}{fmt(reports.netProfit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--muted)' }}>Loading reports...</p>
          )}
        </div>
      )}

      {/* PAYMENTS TAB */}
      {tab === 'payments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>Payment History</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setPayModal(true)}>+ Add Payment</button>
          </div>
          {client.payments.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No payments recorded yet</p>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Month</th><th>Year</th><th>Amount</th><th>Status</th><th>Remarks</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {client.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td>{p.month}</td>
                    <td>{p.year}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(p.amount)}</td>
                    <td>
                      <span className={`badge ${p.status === 'collected' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{p.remarks || '—'}</td>
                    <td style={{ fontSize: 12 }}>{format(new Date(p.createdAt), 'dd MMM yyyy')}</td>
                    <td>
                      {p.status === 'pending' && (
                        <button className="btn btn-success btn-sm" onClick={() => markCollected(p.id)}>✓ Collected</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Payment Modal */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add Monthly Payment</h3>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Month</label>
              <select className="form-select" value={payForm.month} onChange={e => setPayForm({ ...payForm, month: e.target.value })}>
                <option value="">Select</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <input className="form-input" type="number" value={payForm.year} onChange={e => setPayForm({ ...payForm, year: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <input className="form-input" value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} placeholder="Optional" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={addPayment}>Add Payment</button>
              <button className="btn btn-ghost" onClick={() => setPayModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
