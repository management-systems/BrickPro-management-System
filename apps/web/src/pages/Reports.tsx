import { useEffect, useState } from 'react';
import { useAppStore } from '../store/app';
import api from '../lib/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6C63FF', '#4ECDC4', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#06B6D4'];

export default function Reports() {
  const lang = useAppStore((s) => s.lang);
  const activeFactory = useAppStore((s) => s.activeFactory);
  const factories = useAppStore((s) => s.factories);
  const [tab, setTab] = useState<'summary' | 'charts'>('summary');
  const [, setData] = useState<any>(null);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [productions, setProductions] = useState<any[]>([]);
  const [rawPurchases, setRawPurchases] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [chartLoading, setChartLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(-1); // -1 = All
  const [selectedYear, setSelectedYear] = useState(0); // 0 = All years

  useEffect(() => {
    api.get('/reports/dashboard').then((r) => setData(r.data)).catch(() => {});
    api.get('/dispatch', { params: { factoryId: activeFactory } }).then((r) => setDispatches(r.data)).catch(() => {});
    api.get('/expenditure', { params: { factoryId: activeFactory } }).then((r) => setExpenditures(r.data)).catch(() => {});
    api.get('/production', { params: { factoryId: activeFactory } }).then((r) => setProductions(r.data)).catch(() => {});
    api.get('/raw-materials/purchases').then((r) => setRawPurchases(r.data)).catch(() => {});
  }, [activeFactory]);

  useEffect(() => {
    if (tab === 'charts' && !chartData) {
      setChartLoading(true);
      api.get('/reports/charts').then((r) => { setChartData(r.data); setChartLoading(false); }).catch(() => setChartLoading(false));
    }
  }, [tab]);

  const fmt = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`;

  // Filter by month
  const inRange = (dateStr: string) => {
    const date = new Date(dateStr);
    if (selectedMonth === -1 && selectedYear === 0) return true; // All data
    if (selectedMonth === -1) return date.getFullYear() === selectedYear;
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    return date >= start && date <= end;
  };

  const monthDispatches = dispatches.filter(d => inRange(d.date));
  const monthExpenses = expenditures.filter(e => inRange(e.date));
  const monthProductions = productions.filter(p => inRange(p.date));
  const monthRaw = rawPurchases.filter(p => inRange(p.date));

  const totalBricksMade = monthProductions.reduce((s, p) => s + (p.firedCount || p.rawCount || 0), 0);
  const totalBricksSold = monthDispatches.reduce((s, d) => s + (d.quantity || 0), 0);
  const totalSales = monthDispatches.reduce((s, d) => s + (d.amount || 0), 0);
  const totalReceived = monthDispatches.reduce((s, d) => s + (d.amountReceived || 0), 0);
  const totalPending = totalSales - totalReceived;
  const totalExpense = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalRawCost = monthRaw.reduce((s, p) => s + (p.totalCost || 0), 0);

  // Expense by category
  const expenseByCategory: Record<string, number> = {};
  monthExpenses.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });
  const sortedExpenses = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  // Current filter label used in downloads
  void(selectedMonth); // used in inRange

  const downloadPDF = () => {
    const monthName = selectedMonth === -1 ? (selectedYear === 0 ? 'All Time' : `All ${selectedYear}`) : `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][selectedMonth]} ${selectedYear}`;
    const content = `<html><head><style>
      body{font-family:Arial,sans-serif;padding:40px;color:#333}
      h1{color:#1a73e8;border-bottom:2px solid #1a73e8;padding-bottom:10px}
      h2{color:#333;margin-top:24px}
      table{width:100%;border-collapse:collapse;margin:12px 0}
      th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px}
      th{background:#f5f5f5;font-weight:600}
      .green{color:#10b981}.red{color:#ef4444}.bold{font-weight:700}
    </style></head><body>
      <h1>🧱 BrickPro Report — ${monthName}</h1>
      <h2>Summary</h2>
      <table><tr><th>Bricks Made</th><th>Bricks Sold</th><th>Total Income</th><th>Received</th><th>Pending</th><th>Expenses</th><th>Net Profit</th></tr>
      <tr><td>${totalBricksMade.toLocaleString()}</td><td>${totalBricksSold.toLocaleString()}</td><td>₹${totalSales.toLocaleString()}</td><td class="green">₹${totalReceived.toLocaleString()}</td><td class="red">₹${totalPending.toLocaleString()}</td><td class="red">₹${totalExpense.toLocaleString()}</td><td class="${(totalReceived - totalExpense) >= 0 ? 'green' : 'red'} bold">₹${(totalReceived - totalExpense).toLocaleString()}</td></tr></table>
      <h2>Expenses</h2>
      <table><tr><th>Category</th><th>Amount</th></tr>${sortedExpenses.map(([c, a]) => `<tr><td>${c}</td><td class="red">₹${a.toLocaleString()}</td></tr>`).join('')}</table>
      <h2>Dispatches</h2>
      <table><tr><th>Date</th><th>Customer</th><th>Qty</th><th>Amount</th><th>Received</th><th>Due</th></tr>${monthDispatches.slice(0, 50).map(d => `<tr><td>${new Date(d.date).toLocaleDateString()}</td><td>${d.customer?.name || ''}</td><td>${d.quantity}</td><td>₹${d.amount?.toLocaleString()}</td><td>₹${d.amountReceived?.toLocaleString()}</td><td>₹${d.balanceDue?.toLocaleString()}</td></tr>`).join('')}</table>
      <p style="margin-top:40px;font-size:11px;color:#999">Generated by BrickPro on ${new Date().toLocaleDateString()}</p>
    </body></html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const win = window.open(URL.createObjectURL(blob), '_blank');
    setTimeout(() => { win?.print(); }, 500);
  };

  const downloadExcel = () => {
    const monthName = selectedMonth === -1 ? (selectedYear === 0 ? 'All_Time' : `All_${selectedYear}`) : `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][selectedMonth]}_${selectedYear}`;
    let csv = `BrickPro Report - ${monthName}\n\nSUMMARY\nBricks Made,Bricks Sold,Total Income,Received,Pending,Expenses,Net Profit\n`;
    csv += `${totalBricksMade},${totalBricksSold},${totalSales},${totalReceived},${totalPending},${totalExpense},${totalReceived - totalExpense}\n\n`;
    csv += 'EXPENSES\nCategory,Amount\n';
    sortedExpenses.forEach(([c, a]) => { csv += `${c},${a}\n`; });
    csv += `\nDISPATCHES\nDate,Customer,Brick Type,Qty,Amount,Received,Due,Status\n`;
    monthDispatches.forEach(d => { csv += `${new Date(d.date).toLocaleDateString()},${d.customer?.name || ''},${d.brickType},${d.quantity},${d.amount},${d.amountReceived},${d.balanceDue},${d.paymentStatus}\n`; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `BrickPro_Report_${monthName.replace(/\s/g, '_')}.csv`; a.click();
  };

  const renderCharts = () => {
    if (chartLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>Loading charts...</div>;
    if (!chartData) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>No data</div>;

    return (
      <div>
        {/* Revenue vs Expenses */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📊 Revenue vs Expenses (12 Months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" fill="#4ECDC4" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="profit" stroke="#6C63FF" strokeWidth={2} name="Profit" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Trend */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📈 Profit Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
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

        {/* Production + Dispatches */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🧱 Monthly Production</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip />
              <Bar dataKey="production" fill="#6C63FF" name="Bricks Produced" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🚛 Monthly Dispatches</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="dispatches" stroke="#4ECDC4" strokeWidth={3} dot={{ r: 4, fill: '#4ECDC4' }} name="Dispatches" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💰 Payment Status</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={chartData.paymentStatus} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {chartData.paymentStatus.map((_: any, i: number) => <Cell key={i} fill={['#10B981', '#F59E0B', '#EF4444'][i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🧱 Brick Types</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={chartData.brickTypes} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${(name || '').split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {chartData.brickTypes.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense by Category */}
        {chartData.expenseByCategory.length > 0 && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>💸 Expense by Category</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, chartData.expenseByCategory.length * 32)}>
              <BarChart data={chartData.expenseByCategory} layout="vertical" margin={{ left: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
                  {chartData.expenseByCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Customers */}
        {chartData.topCustomers.length > 0 && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>👥 Top Customers</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, chartData.topCustomers.length * 35)}>
              <BarChart data={chartData.topCustomers} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" fill="#4ECDC4" name="Revenue" radius={[0, 4, 4, 0]} />
                <Bar dataKey="pending" fill="#EF4444" name="Pending" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>📊 {lang === 'en' ? 'Reports' : 'रिपोर्ट'}</h2>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button onClick={() => setTab('summary')} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer', background: tab === 'summary' ? 'var(--primary)' : '#f3f4f6', color: tab === 'summary' ? 'white' : '#6b7280' }}>📋 Summary</button>
        <button onClick={() => setTab('charts')} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer', background: tab === 'charts' ? 'var(--primary)' : '#f3f4f6', color: tab === 'charts' ? 'white' : '#6b7280' }}>📈 Charts</button>
      </div>

      {tab === 'charts' && renderCharts()}

      {tab === 'summary' && (<>
      {/* Filter + Download */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <select value={selectedYear} onChange={(e) => setSelectedYear(+e.target.value)} style={{ fontSize: 14, fontWeight: 600 }}>
          <option value={0}>All Years</option>
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(+e.target.value)} style={{ fontSize: 14, fontWeight: 600 }}>
          <option value={-1}>All Months</option>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        {factories.length > 1 && (
          <span style={{ fontSize: 12, color: 'var(--text-light)', padding: '8px 0' }}>Factory: {factories.find(f => f.id === activeFactory)?.name || 'All'}</span>
        )}
        <button onClick={downloadPDF} className="btn-primary btn-sm" style={{ background: 'var(--danger)' }}>📄 PDF</button>
        <button onClick={downloadExcel} className="btn-primary btn-sm" style={{ background: 'var(--success)' }}>📊 Excel</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        <div className="card stat-card"><div className="value" style={{ color: 'var(--primary)' }}>{totalBricksMade.toLocaleString()}</div><div className="label">Bricks Made</div></div>
        <div className="card stat-card"><div className="value" style={{ color: 'var(--info)' }}>{totalBricksSold.toLocaleString()}</div><div className="label">Bricks Sold</div></div>
        <div className="card stat-card"><div className="value" style={{ color: 'var(--success)' }}>₹{(totalSales / 1000).toFixed(0)}K</div><div className="label">Total Income</div></div>
        <div className="card stat-card"><div className="value" style={{ color: 'var(--success)' }}>₹{(totalReceived / 1000).toFixed(0)}K</div><div className="label">Received</div></div>
        <div className="card stat-card"><div className="value" style={{ color: 'var(--danger)' }}>₹{(totalPending / 1000).toFixed(0)}K</div><div className="label">Pending</div></div>
        <div className="card stat-card"><div className="value" style={{ color: 'var(--danger)' }}>₹{(totalExpense / 1000).toFixed(0)}K</div><div className="label">Expenses</div></div>
      </div>

      {/* Profit/Loss */}
      <div className="card" style={{ marginBottom: 16, textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Net Profit / Loss</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: (totalReceived - totalExpense - totalRawCost) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          ₹{(totalReceived - totalExpense - totalRawCost).toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Received - Expenses - Raw Material</div>
      </div>

      {/* Income - Green */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--success)' }}>🟢 Income</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}><span>Total Sales</span><strong>₹{totalSales.toLocaleString()}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}><span>Received</span><strong style={{ color: 'var(--success)' }}>₹{totalReceived.toLocaleString()}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>Pending</span><strong style={{ color: 'var(--danger)' }}>₹{totalPending.toLocaleString()}</strong></div>
      </div>

      {/* Expenses - Red */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>🔴 Expenses</h3>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>₹{totalExpense.toLocaleString()}</span>
        </div>
        {sortedExpenses.map(([cat, amt]) => (
          <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13 }}>{cat}</span><span style={{ fontSize: 13, fontWeight: 600 }}>₹{amt.toLocaleString()}</span>
          </div>
        ))}
        {sortedExpenses.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No expenses</p>}
      </div>

      {/* Raw Material */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--danger)' }}>🔴 Raw Material</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}><span>Total</span><strong style={{ color: 'var(--danger)' }}>₹{totalRawCost.toLocaleString()}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}><span>Paid</span><strong style={{ color: 'var(--success)' }}>₹{monthRaw.reduce((s, p) => s + (p.amountPaid || 0), 0).toLocaleString()}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>Pending</span><strong style={{ color: 'var(--danger)' }}>₹{monthRaw.reduce((s, p) => s + (p.balanceDue || 0), 0).toLocaleString()}</strong></div>
        {(() => {
          const matMap: Record<string, number> = {};
          monthRaw.forEach(p => { matMap[p.material?.name || '?'] = (matMap[p.material?.name || '?'] || 0) + p.totalCost; });
          return Object.entries(matMap).sort((a, b) => b[1] - a[1]).map(([n, a]) => (
            <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}><span>{n}</span><span>₹{a.toLocaleString()}</span></div>
          ));
        })()}
      </div>

      {/* Customers (Last 2 Months) */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--success)' }}>🟢 Customers (Last 2 Months)</h3>
        {(() => {
          const twoMonthsAgo = new Date(); twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
          const recent = dispatches.filter(d => new Date(d.date) >= twoMonthsAgo);
          const map: any = {};
          recent.forEach(d => { const n = d.customer?.name || '?'; if (!map[n]) map[n] = { qty: 0, amt: 0, due: 0 }; map[n].qty += d.quantity || 0; map[n].amt += d.amount || 0; map[n].due += d.balanceDue || 0; });
          const sorted = Object.entries(map).sort((a: any, b: any) => b[1].amt - a[1].amt);
          if (!sorted.length) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No sales</p>;
          return sorted.map(([name, val]: any, i) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div><div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>{val.qty.toLocaleString()} bricks</div></div>
              <div style={{ textAlign: 'right' }}><span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{val.amt.toLocaleString()}</span>{val.due > 0 && <div style={{ fontSize: 11, color: 'var(--danger)' }}>Pending: ₹{val.due.toLocaleString()}</div>}</div>
            </div>
          ));
        })()}
      </div>
      </>)}
    </div>
  );
}
