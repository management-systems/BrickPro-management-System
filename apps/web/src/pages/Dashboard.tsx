import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/app';
import api from '../lib/api';

export default function Dashboard() {
  const lang = useAppStore((s) => s.lang);
  const activeFactory = useAppStore((s) => s.activeFactory);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [productions, setProductions] = useState<any[]>([]);
  const [labourCount, setLabourCount] = useState(0);
  const [stock, setStock] = useState<Record<string, { produced: number; sold: number; stock: number }>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeFactory) return;
    api.get('/dispatch', { params: { factoryId: activeFactory } }).then(r => setDispatches(r.data)).catch(() => {});
    api.get('/expenditure', { params: { factoryId: activeFactory } }).then(r => setExpenditures(r.data)).catch(() => {});
    api.get('/production', { params: { factoryId: activeFactory } }).then(r => setProductions(r.data)).catch(() => {});
    api.get('/labour', { params: { factoryId: activeFactory } }).then(r => setLabourCount(r.data?.length || 0)).catch(() => {});
    api.get('/reports/stock', { params: { factoryId: activeFactory } }).then(r => setStock(r.data)).catch(() => {});
  }, [activeFactory]);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const todayProd = productions.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).reduce((s, p) => s + (p.firedCount || p.rawCount || 0), 0);
  const monthDisp = dispatches.filter(d => { const dt = new Date(d.date); return dt.getMonth() === thisMonth && dt.getFullYear() === thisYear; });
  const monthExp = expenditures.filter(e => { const dt = new Date(e.date); return dt.getMonth() === thisMonth && dt.getFullYear() === thisYear; });

  const monthRevenue = monthDisp.reduce((s, d) => s + (d.amount || 0), 0);
  const monthExpenses = monthExp.reduce((s, e) => s + (e.amount || 0), 0);
  const totalOutstanding = dispatches.reduce((s, d) => s + (d.balanceDue || 0), 0);

  const stats = [
    { icon: '🧱', value: todayProd.toLocaleString(), label: lang === 'en' ? "Month Bricks" : 'इस महीने की ईंटें', to: '/production', color: 'var(--primary)' },
    { icon: '💰', value: `₹${(monthRevenue / 1000).toFixed(0)}K`, label: lang === 'en' ? 'Month Revenue' : 'महीने की आय', to: '/dispatch', color: 'var(--success)' },
    { icon: '💸', value: `₹${(monthExpenses / 1000).toFixed(0)}K`, label: lang === 'en' ? 'Expenses' : 'खर्चे', to: '/expenditure', color: 'var(--warning)' },
    { icon: '⚠️', value: `₹${(totalOutstanding / 1000).toFixed(0)}K`, label: lang === 'en' ? 'Pending' : 'बकाया', to: '/customers', color: 'var(--danger)' },
  ];

  const actions = [
    { icon: '🧱', label: lang === 'en' ? 'Production' : 'उत्पादन', to: '/production' },
    { icon: '🚛', label: lang === 'en' ? 'Sell' : 'बिक्री', to: '/dispatch' },
    { icon: '👷', label: lang === 'en' ? 'Labour' : 'मजदूर', to: '/labour' },
    { icon: '🪨', label: lang === 'en' ? 'Material' : 'सामग्री', to: '/raw-materials' },
    { icon: '💸', label: lang === 'en' ? 'Expense' : 'खर्चे', to: '/expenditure' },
    { icon: '👥', label: lang === 'en' ? 'Customers' : 'ग्राहक', to: '/customers' },
  ];

  return (
    <div className="page">
      {/* Clickable Stat Cards */}
      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.to} className="card card-clickable stat-card" onClick={() => navigate(s.to)}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div className="value" style={{ color: s.color }}>{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="card card-clickable" style={{ textAlign: 'center', textDecoration: 'none', color: 'var(--text)', padding: '12px 6px' }}>
            <div style={{ fontSize: 22 }}>{a.icon}</div>
            <div style={{ fontSize: 11, marginTop: 3, fontWeight: 500 }}>{a.label}</div>
          </Link>
        ))}
      </div>

      {/* Monthly Summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📈 This Month Summary</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-light)', fontSize: 13 }}>Revenue</span>
          <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{(monthRevenue / 1000).toFixed(0)}K</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-light)', fontSize: 13 }}>Expenses</span>
          <span style={{ fontWeight: 600, color: 'var(--danger)' }}>₹{(monthExpenses / 1000).toFixed(0)}K</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-light)', fontSize: 13 }}>Net Profit</span>
          <span style={{ fontWeight: 700, color: monthRevenue - monthExpenses >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ₹{((monthRevenue - monthExpenses) / 1000).toFixed(0)}K
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ color: 'var(--text-light)', fontSize: 13 }}>Total Pending</span>
          <span style={{ fontWeight: 600, color: 'var(--warning)' }}>₹{(totalOutstanding / 1000).toFixed(0)}K</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-light)', fontSize: 13 }}>Active Labour</span>
          <span style={{ fontWeight: 600 }}>{labourCount}</span>
        </div>
      </div>
      {/* Brick Stock */}
      {Object.keys(stock).length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🧱 Brick Stock (In Hand)</h3>
          {Object.entries(stock).map(([type, val]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{type}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>P:{val.produced.toLocaleString()} | S:{val.sold.toLocaleString()}</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: val.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>{val.stock.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
