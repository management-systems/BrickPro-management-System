import { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6C63FF', '#4ECDC4', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#06B6D4'];

export default function Charts() {
  const [data, setData] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clients').then(r => setClients(r.data)).catch(() => {});
    loadCharts();
  }, []);

  const loadCharts = (clientId?: string) => {
    setLoading(true);
    const url = clientId && clientId !== 'all' ? `/charts?clientId=${clientId}` : '/charts';
    api.get(url).then(r => { setData(r.data); setLoading(false); }).catch(() => { toast.error('Failed to load charts'); setLoading(false); });
  };

  const handleClientChange = (val: string) => {
    setSelectedClient(val);
    loadCharts(val);
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading charts...</div>;
  if (!data) return <div style={{ padding: 40, color: 'var(--muted)' }}>No data available</div>;

  const fmt = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>📈 Analytics & Charts</h1>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            {selectedClient === 'all' ? 'All Clients (Combined)' : clients.find(c => c.id === selectedClient)?.name || ''}
          </span>
        </div>
        <select value={selectedClient} onChange={e => handleClientChange(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
          <option value="all">📊 All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>🏭 {c.name} ({c.mobile})</option>)}
        </select>
      </div>

      {/* Row 1: Revenue vs Expenses + Profit Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>📊 Revenue vs Expenses (12 Months)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="revenue" fill="#4ECDC4" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="profit" stroke="#6C63FF" strokeWidth={2} name="Profit" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>📈 Profit Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="profit" stroke="#6C63FF" strokeWidth={2} fill="url(#profitGrad)" name="Net Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Production + Dispatches */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>🧱 Monthly Production</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="production" fill="#6C63FF" name="Bricks Produced" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>🚛 Monthly Dispatches</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="dispatches" stroke="#4ECDC4" strokeWidth={3} dot={{ r: 4, fill: '#4ECDC4' }} name="Dispatches" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Pie Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>💰 Payment Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.paymentStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.paymentStatus.map((_: any, i: number) => <Cell key={i} fill={['#10B981', '#F59E0B', '#EF4444'][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>🧱 Brick Types</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.brickTypes} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(name || '').split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.brickTypes.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>👥 Client Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.subscriptionStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.subscriptionStatus.map((_: any, i: number) => <Cell key={i} fill={['#F59E0B', '#10B981', '#EF4444', '#6B7280'][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Expense + Client Revenue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>💸 Expense by Category</h3>
          <ResponsiveContainer width="100%" height={Math.max(250, (data.expenseByCategory?.length || 1) * 35)}>
            <BarChart data={data.expenseByCategory} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)' }} width={80} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="value" name="Amount" radius={[0, 6, 6, 0]}>
                {(data.expenseByCategory || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>🏢 Revenue by Client</h3>
          <ResponsiveContainer width="100%" height={Math.max(250, (data.clientRevenue?.length || 1) * 50)}>
            <BarChart data={data.clientRevenue} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)' }} width={100} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="revenue" fill="#4ECDC4" name="Revenue" radius={[0, 4, 4, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
