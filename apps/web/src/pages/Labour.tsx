import { useEffect, useState } from 'react';
import { useAppStore } from '../store/app';
import api from '../lib/api';
import toast from 'react-hot-toast';

const BRICK_TYPES = ['Red Brick', 'Fly Ash Brick', 'AAC Block', 'Hollow Brick', 'Solid Brick', 'Paver Block', 'Fire Brick'];

export default function Labour() {
  const activeFactory = useAppStore((s) => s.activeFactory);
  const [tab, setTab] = useState<'list' | 'production' | 'payments'>('list');
  const [labourList, setLabourList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showProd, setShowProd] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const [form, setForm] = useState({ name: '', mobile: '', type: 'PER_BRICK', dailyRate: '', perBrickRate: '', monthlySalary: '' });
  const [prodForm, setProdForm] = useState({ labourId: '', brickType: 'Red Brick', quantity: '', rate: '', date: new Date().toISOString().slice(0, 10) });
  const [payForm, setPayForm] = useState({ labourId: '', amount: '', mode: 'cash', remarks: '', date: new Date().toISOString().slice(0, 10) });

  const [productions, setProductions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);

  const load = () => {
    api.get('/labour', { params: { factoryId: activeFactory } }).then((r) => setLabourList(r.data));
    api.get('/labour/production', { params: { factoryId: activeFactory, month: filterMonth, year: filterYear } }).then((r) => setProductions(r.data)).catch(() => {});
    api.get('/labour/payments', { params: { month: filterMonth, year: filterYear } }).then((r) => setPayments(r.data)).catch(() => {});
    api.get('/labour/payments').then((r) => setAllPayments(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [activeFactory, filterMonth, filterYear]);

  const addLabour = async () => {
    if (!form.name) return toast.error('Name required');
    await api.post('/labour', {
      factoryId: activeFactory, name: form.name, mobile: form.mobile || undefined,
      type: form.type, dailyRate: form.type === 'DAILY' ? +form.dailyRate || null : null,
      perBrickRate: form.type === 'PER_BRICK' ? +form.perBrickRate || null : null,
      monthlySalary: form.type === 'PERMANENT' ? +form.monthlySalary || null : null,
    });
    toast.success('Labour added!');
    setShowAdd(false);
    setForm({ name: '', mobile: '', type: 'PER_BRICK', dailyRate: '', perBrickRate: '', monthlySalary: '' });
    load();
  };

  const addProduction = async () => {
    if (!prodForm.labourId || !prodForm.quantity) return toast.error('Select labour and enter quantity');
    const labour = labourList.find(l => l.id === prodForm.labourId);
    const rate = +prodForm.rate || labour?.perBrickRate || 0;
    await api.post('/labour/production', { ...prodForm, quantity: +prodForm.quantity, rate });
    toast.success('Production recorded!');
    setShowProd(false);
    setProdForm({ labourId: '', brickType: 'Red Brick', quantity: '', rate: '', date: new Date().toISOString().slice(0, 10) });
    api.get('/labour/production', { params: { factoryId: activeFactory, month: filterMonth, year: filterYear } }).then((r) => setProductions(r.data));
  };

  const addPayment = async () => {
    if (!payForm.labourId || !payForm.amount) return toast.error('Select labour and enter amount');
    await api.post('/labour/payments', { ...payForm, amount: +payForm.amount });
    toast.success('Payment recorded!');
    setShowPay(false);
    setPayForm({ labourId: '', amount: '', mode: 'cash', remarks: '', date: new Date().toISOString().slice(0, 10) });
    api.get('/labour/payments', { params: { month: filterMonth, year: filterYear } }).then((r) => setPayments(r.data));
  };

  // Calculate pending for each labour
  const getLabourSummary = (l: any) => {
    const lProds = productions.filter(p => p.labourId === l.id || p.labour?.id === l.id);
    const lPays = payments.filter(p => p.labourId === l.id || p.labour?.id === l.id);
    const totalEarned = lProds.reduce((s, p) => s + (p.amount || p.quantity * (p.rate || l.perBrickRate || 0)), 0);
    const totalPaid = lPays.reduce((s, p) => s + p.amount, 0);
    const pending = totalEarned - totalPaid;
    const totalBricks = lProds.reduce((s, p) => s + p.quantity, 0);
    return { totalEarned, totalPaid, pending, totalBricks };
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>👷 Labour</h2>
        <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      {/* Search + Month Filter */}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search labour..." style={{ marginBottom: 12 }} />
      <div className="filter-bar">
        <select value={filterMonth} onChange={(e) => setFilterMonth(+e.target.value)}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(+e.target.value)}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>👷 Workers</button>
        <button className={`tab ${tab === 'production' ? 'active' : ''}`} onClick={() => setTab('production')}>🧱 Brick Work</button>
        <button className={`tab ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>💰 Payments</button>
      </div>

      {/* ===== LABOUR LIST TAB ===== */}
      {tab === 'list' && (
        <>
          {labourList.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase())).map((l) => {
            const summary = getLabourSummary(l);
            return (
              <div key={l.id} className="data-card" onClick={() => setSelected(selected?.id === l.id ? null : l)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{l.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                      {l.type === 'PER_BRICK' && `₹${l.perBrickRate}/brick`}
                      {l.type === 'DAILY' && `₹${l.dailyRate}/day`}
                      {l.type === 'PERMANENT' && `₹${l.monthlySalary}/month`}
                      {l.mobile && ` • ${l.mobile}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {summary.pending > 0 && (
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>₹{summary.pending.toLocaleString()}<span className="red-dot"></span></div>
                    )}
                    {summary.pending <= 0 && summary.totalEarned > 0 && (
                      <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>✓ Clear</div>
                    )}
                  </div>
                </div>
                {/* Expanded detail */}
                {selected?.id === l.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13 }}>
                    <div className="detail-row">
                      <span>This month bricks</span>
                      <strong>{summary.totalBricks.toLocaleString()}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Earned ({summary.totalBricks} × ₹{l.perBrickRate || '?'})</span>
                      <strong style={{ color: 'var(--success)' }}>₹{summary.totalEarned.toLocaleString()}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Paid this month</span>
                      <strong>₹{summary.totalPaid.toLocaleString()}</strong>
                    </div>
                    <div className="detail-row" style={{ background: summary.pending > 0 ? '#fef2f2' : '#f0fdf4', padding: '8px', borderRadius: 6, marginTop: 4 }}>
                      <span style={{ fontWeight: 700 }}>Pending</span>
                      <strong style={{ fontSize: 16, color: summary.pending > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        ₹{Math.abs(summary.pending).toLocaleString()} {summary.pending < 0 ? '(overpaid)' : ''}
                      </strong>
                    </div>
                    {/* All payments history */}
                    <div style={{ marginTop: 12 }}>
                      <strong style={{ fontSize: 12, color: 'var(--text-light)' }}>All Payments:</strong>
                      {allPayments.filter(p => p.labourId === l.id || p.labour?.id === l.id).length === 0 && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No payments yet</p>
                      )}
                      {allPayments.filter(p => p.labourId === l.id || p.labour?.id === l.id).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p: any) => (
                        <div key={p.id} className="detail-row" style={{ fontSize: 12 }}>
                          <span>{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })} • {p.mode || 'cash'}</span>
                          <strong style={{ color: 'var(--danger)' }}>₹{p.amount?.toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {labourList.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 30 }}>No labour added yet</p>}
        </>
      )}

      {/* ===== PRODUCTION TAB ===== */}
      {tab === 'production' && (
        <>
          <button onClick={() => setShowProd(true)} className="btn-success btn-sm" style={{ marginBottom: 12 }}>+ Record Brick Work</button>
          {productions.map((p) => (
            <div key={p.id} className="data-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="date-highlight">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  <strong style={{ marginLeft: 8 }}>{p.labour?.name}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{p.quantity?.toLocaleString()} bricks</div>
                  <div style={{ fontSize: 12, color: 'var(--success)' }}>₹{p.amount?.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>{p.brickType} @ ₹{p.rate}/brick</div>
            </div>
          ))}
          {productions.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 20 }}>No records this month</p>}
        </>
      )}

      {/* ===== PAYMENTS TAB ===== */}
      {tab === 'payments' && (
        <>
          <button onClick={() => setShowPay(true)} className="btn-primary btn-sm" style={{ marginBottom: 12, background: 'var(--warning)' }}>+ Give Money</button>
          {payments.map((p) => (
            <div key={p.id} className="data-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="date-highlight">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  <strong style={{ marginLeft: 8 }}>{p.labour?.name}</strong>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>₹{p.amount?.toLocaleString()}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>{p.mode} {p.remarks && `• ${p.remarks}`}</div>
            </div>
          ))}
          {payments.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 20 }}>No payments this month</p>}
        </>
      )}

      {/* Add Labour Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Add Labour</h3>
            <div className="form-grid-2">
              <div className="form-group"><label>Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Labour name" /></div>
              <div className="form-group"><label>Mobile</label><input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} maxLength={10} /></div>
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="PER_BRICK">Per Brick Rate (ठेका)</option>
                <option value="DAILY">Daily Wages (दिहाड़ी)</option>
                <option value="PERMANENT">Monthly Salary</option>
              </select>
            </div>
            {form.type === 'PER_BRICK' && <div className="form-group"><label>Rate per Brick (₹)</label><input type="number" inputMode="decimal" value={form.perBrickRate} onChange={(e) => setForm({ ...form, perBrickRate: e.target.value })} placeholder="e.g. 0.70" /></div>}
            {form.type === 'DAILY' && <div className="form-group"><label>Daily Rate (₹)</label><input type="number" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} placeholder="e.g. 500" /></div>}
            {form.type === 'PERMANENT' && <div className="form-group"><label>Monthly Salary (₹)</label><input type="number" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} placeholder="e.g. 15000" /></div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setShowAdd(false)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
              <button onClick={addLabour} className="btn-primary" style={{ flex: 1 }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Production Modal */}
      {showProd && (
        <div className="modal-overlay" onClick={() => setShowProd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Record Brick Work</h3>
            <div className="form-grid-2">
              <div className="form-group"><label>Date</label><input type="date" value={prodForm.date} onChange={(e) => setProdForm({ ...prodForm, date: e.target.value })} /></div>
              <div className="form-group">
                <label>Labour *</label>
                <select value={prodForm.labourId} onChange={(e) => { const l = labourList.find(x => x.id === e.target.value); setProdForm({ ...prodForm, labourId: e.target.value, rate: l?.perBrickRate?.toString() || '' }); }}>
                  <option value="">-- Select --</option>
                  {labourList.filter(l => l.type === 'PER_BRICK').map((l) => <option key={l.id} value={l.id}>{l.name} (₹{l.perBrickRate}/brick)</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid-3">
              <div className="form-group">
                <label>Brick Type</label>
                <select value={prodForm.brickType} onChange={(e) => setProdForm({ ...prodForm, brickType: e.target.value })}>
                  {BRICK_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Quantity *</label><input type="number" inputMode="numeric" value={prodForm.quantity} onChange={(e) => setProdForm({ ...prodForm, quantity: e.target.value })} placeholder="e.g. 2000" /></div>
              <div className="form-group"><label>Rate (₹/brick)</label><input type="number" inputMode="decimal" value={prodForm.rate} onChange={(e) => setProdForm({ ...prodForm, rate: e.target.value })} placeholder="Auto from labour" /></div>
            </div>
            {prodForm.quantity && prodForm.rate && (
              <div style={{ padding: 10, background: 'var(--bg)', borderRadius: 8, marginBottom: 12, textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{prodForm.quantity} × ₹{prodForm.rate} = </span>
                <strong style={{ fontSize: 18, color: 'var(--success)' }}>₹{(+prodForm.quantity * +prodForm.rate).toLocaleString()}</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowProd(false)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
              <button onClick={addProduction} className="btn-success" style={{ flex: 1, padding: 12 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPay && (
        <div className="modal-overlay" onClick={() => setShowPay(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Give Money to Labour</h3>
            <div className="form-grid-2">
              <div className="form-group"><label>Date</label><input type="date" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} /></div>
              <div className="form-group">
                <label>Labour *</label>
                <select value={payForm.labourId} onChange={(e) => setPayForm({ ...payForm, labourId: e.target.value })}>
                  <option value="">-- Select --</option>
                  {labourList.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label>Amount (₹) *</label><input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} placeholder="Enter amount" /></div>
              <div className="form-group">
                <label>Mode</label>
                <select value={payForm.mode} onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })}>
                  <option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>Remark</label><input value={payForm.remarks} onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })} placeholder="e.g. Weekly payment" /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setShowPay(false)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
              <button onClick={addPayment} className="btn-primary" style={{ flex: 1, padding: 12, background: 'var(--warning)' }}>Pay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
