import { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  useEffect(() => { loadPayments(); }, [statusFilter, monthFilter]);

  const loadPayments = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (monthFilter) params.month = monthFilter;
      const { data } = await api.get('/payments', { params });
      setPayments(data);
    } catch { toast.error('Failed'); }
  };

  const markCollected = async (id: string) => {
    try {
      await api.patch(`/payments/${id}`, { status: 'collected' });
      toast.success('Marked collected');
      loadPayments();
    } catch { toast.error('Failed'); }
  };

  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalCollected = payments.filter(p => p.status === 'collected').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="page-header">
        <h1>Payments</h1>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>₹{totalCollected.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>₹{totalPending.toLocaleString('en-IN')}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{payments.length}</div>
          <div className="stat-label">Total Records</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="form-select" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="collected">Collected</option>
        </select>
        <select className="form-select" style={{ width: 120 }} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
          <option value="">All Months</option>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <table className="admin-table">
        <thead>
          <tr><th>Client</th><th>Mobile</th><th>Month</th><th>Year</th><th>Amount</th><th>Status</th><th>Remarks</th><th>Date</th><th>Action</th></tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id}>
              <td style={{ fontWeight: 500 }}>{p.client?.name}</td>
              <td>{p.client?.mobile}</td>
              <td>{p.month}</td>
              <td>{p.year}</td>
              <td style={{ fontWeight: 600 }}>₹{p.amount.toLocaleString('en-IN')}</td>
              <td><span className={`badge ${p.status === 'collected' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
              <td style={{ color: 'var(--muted)' }}>{p.remarks || '—'}</td>
              <td style={{ fontSize: 12 }}>{format(new Date(p.createdAt), 'dd MMM yyyy')}</td>
              <td>
                {p.status === 'pending' && (
                  <button className="btn btn-success btn-sm" onClick={() => markCollected(p.id)}>✓ Collect</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
