import { useEffect, useState } from 'react';
import { useAppStore } from '../store/app';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electricity', 'Repair & Maintenance', 'Transport', 'JCB', 'Office/Stationery', 'Food/Tea', 'Rent', 'Insurance', 'Water', 'Loading/Unloading', 'Labour Advance', 'Miscellaneous', 'Other'];

export default function Expenditure() {
  const activeFactory = useAppStore((s) => s.activeFactory);
  const [entries, setEntries] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [filterMonth, setFilterMonth] = useState(0); // 0 = All
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCat, setFilterCat] = useState('');
  const [tab, setTab] = useState<'all' | 'by-category'>('all');
  const [allEntries, setAllEntries] = useState<any[]>([]);

  const [form, setForm] = useState({
    category: 'Miscellaneous', amount: '', description: '', paymentMode: 'cash', paidTo: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const load = () => {
    api.get('/expenditure', { params: { factoryId: activeFactory } }).then((r) => setAllEntries(r.data));
  };
  useEffect(() => { load(); }, [activeFactory]);

  // Apply filters locally
  useEffect(() => {
    let filtered = [...allEntries];
    if (filterMonth > 0) filtered = filtered.filter(e => new Date(e.date).getMonth() + 1 === filterMonth);
    if (filterYear) filtered = filtered.filter(e => new Date(e.date).getFullYear() === filterYear);
    if (filterCat) filtered = filtered.filter(e => e.category === filterCat);
    setEntries(filtered);
  }, [allEntries, filterMonth, filterYear, filterCat]);

  const submit = async () => {
    if (!form.amount || +form.amount <= 0) return toast.error('Enter amount');
    await api.post('/expenditure', { ...form, factoryId: activeFactory, amount: +form.amount });
    toast.success('Saved!');
    setShowAdd(false);
    setForm({ category: 'Miscellaneous', amount: '', description: '', paymentMode: 'cash', paidTo: '', date: new Date().toISOString().slice(0, 10) });
    load();
  };

  const total = entries.reduce((s, e) => s + e.amount, 0);

  // Group by category
  const byCategory: Record<string, any[]> = {};
  entries.forEach(e => {
    if (!byCategory[e.category]) byCategory[e.category] = [];
    byCategory[e.category].push(e);
  });

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>💸 Expenditure</h2>
        <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select value={filterYear} onChange={(e) => setFilterYear(+e.target.value)}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(+e.target.value)}>
          <option value={0}>All Months</option>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Total */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>Total This Month</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)' }}>₹{total.toLocaleString()}</span>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>📋 All Entries</button>
        <button className={`tab ${tab === 'by-category' ? 'active' : ''}`} onClick={() => setTab('by-category')}>📂 By Category</button>
      </div>

      {/* ALL TAB */}
      {tab === 'all' && (
        <>
          {entries.map((e) => (
            <div key={e.id} className="data-card" onClick={() => setSelected(selected?.id === e.id ? null : e)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="date-highlight">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  <span className="badge" style={{ marginLeft: 8, background: 'var(--bg)', color: 'var(--text-light)' }}>{e.category}</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>₹{e.amount?.toLocaleString()}</span>
              </div>
              {selected?.id === e.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13 }}>
                  <div className="detail-row"><span>Paid To</span><span>{e.paidTo || '—'}</span></div>
                  <div className="detail-row"><span>Mode</span><span>{e.paymentMode}</span></div>
                  <div className="detail-row"><span>Description</span><span>{e.description || '—'}</span></div>
                </div>
              )}
            </div>
          ))}
          {entries.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 30 }}>No entries this month</p>}
        </>
      )}

      {/* BY CATEGORY TAB */}
      {tab === 'by-category' && (
        <>
          {Object.entries(byCategory).sort((a, b) => b[1].reduce((s, e) => s + e.amount, 0) - a[1].reduce((s, e) => s + e.amount, 0)).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
                <span style={{ fontWeight: 600 }}>{cat}</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{items.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
              </div>
              {items.map((e) => (
                <div key={e.id} className="data-card" onClick={() => setSelected(selected?.id === e.id ? null : e)} style={{ marginLeft: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="date-highlight">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      {e.paidTo && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-light)' }}>{e.paidTo}</span>}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>₹{e.amount?.toLocaleString()}</span>
                  </div>
                  {selected?.id === e.id && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13 }}>
                      <div className="detail-row"><span>Mode</span><span>{e.paymentMode}</span></div>
                      <div className="detail-row"><span>Description</span><span>{e.description || '—'}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {Object.keys(byCategory).length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 30 }}>No entries</p>}
        </>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Add Expenditure</h3>
            <div className="form-grid-2">
              <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="form-group">
                <label>Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label>Amount (₹) *</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Enter amount" /></div>
              <div className="form-group"><label>Paid To</label><input value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} placeholder="Person/Company" /></div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Payment Mode</label>
                <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                  <option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank</option><option value="cheque">Cheque</option>
                </select>
              </div>
              <div className="form-group"><label>Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details" /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setShowAdd(false)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
              <button onClick={submit} className="btn-primary" style={{ flex: 1 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
