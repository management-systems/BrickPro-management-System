import { useEffect, useState } from 'react';
import { useAppStore } from '../store/app';
import { tr } from '../lib/i18n';
import api from '../lib/api';
import toast from 'react-hot-toast';

const BRICK_TYPES = ['Fly Ash Brick', 'Red Brick', 'AAC Block', 'Hollow Brick', 'Solid Brick', 'Paver Block', 'Fire Brick'];

export default function Production() {
  const lang = useAppStore((s) => s.lang);
  const activeFactory = useAppStore((s) => s.activeFactory);
  const [entries, setEntries] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [filterMonth, setFilterMonth] = useState(0);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [stock, setStock] = useState<Record<string, { produced: number; sold: number; stock: number }>>({});

  const [form, setForm] = useState({
    brickType: localStorage.getItem('last_brickType') || 'Fly Ash Brick',
    shift: localStorage.getItem('last_shift') || 'WHOLE_DAY',
    count: '', remarks: '', date: new Date().toISOString().slice(0, 10),
  });

  const load = () => {
    const params: any = { factoryId: activeFactory, year: filterYear };
    if (filterMonth > 0) params.month = filterMonth;
    api.get('/production', { params })
      .then((r) => setEntries(r.data));
  };
  useEffect(() => { load(); }, [activeFactory, filterMonth, filterYear]);
  useEffect(() => { api.get('/reports/stock', { params: { factoryId: activeFactory } }).then(r => setStock(r.data)).catch(() => {}); }, [activeFactory]);

  const submit = async () => {
    if (!form.count) return toast.error('Enter count');
    localStorage.setItem('last_brickType', form.brickType);
    localStorage.setItem('last_shift', form.shift);
    await api.post('/production', {
      factoryId: activeFactory, date: new Date(form.date).toISOString(),
      brickType: form.brickType, shift: form.shift,
      rawCount: +form.count, firedCount: +form.count, scrapCount: 0, remarks: form.remarks,
    });
    toast.success('Saved!');
    setShowForm(false);
    setForm({ ...form, count: '', remarks: '' });
    load();
  };

  // Group by brick type for summary cards
  const filtered = (filterType ? entries.filter(e => e.brickType === filterType) : entries).filter(e => !search || e.brickType?.toLowerCase().includes(search.toLowerCase()) || e.remarks?.toLowerCase().includes(search.toLowerCase()));
  const brickSummary: Record<string, { made: number; sold: number }> = {};
  entries.forEach(e => {
    if (!brickSummary[e.brickType]) brickSummary[e.brickType] = { made: 0, sold: 0 };
    brickSummary[e.brickType].made += e.firedCount || e.rawCount || 0;
  });

  // Group entries by date
  const dateGroups: Record<string, any[]> = {};
  filtered.forEach(e => {
    const d = new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
    if (!dateGroups[d]) dateGroups[d] = [];
    dateGroups[d].push(e);
  });

  const shiftLabel = (s: string) => {
    const map: any = { MORNING: '🌅 Morning', EVENING: '🌇 Evening', NIGHT: '🌙 Night', WHOLE_DAY: '☀️ Full Day' };
    return map[s] || s;
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>🧱 {tr('production', lang)}</h2>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Add</button>
      </div>

      {/* Search + Filters */}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search by brick type, remark..." style={{ marginBottom: 12 }} />
      <div className="filter-bar">
        <select value={filterYear} onChange={(e) => setFilterYear(+e.target.value)}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(+e.target.value)}>
          <option value={0}>All Months</option>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {Object.keys(brickSummary).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Brick Type Summary Cards - hide if zero */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.entries(brickSummary).filter(([, v]) => v.made > 0).map(([type, data]) => (
          <div key={type} className="card card-clickable" onClick={() => setFilterType(filterType === type ? '' : type)}
            style={{ minWidth: 130, textAlign: 'center', padding: 12, border: filterType === type ? '2px solid var(--primary)' : undefined }}>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>{type}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{data.made.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Made this month</div>
          </div>
        ))}
      </div>

      {/* Brick Stock Card */}
      {Object.keys(stock).length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🧱 Brick Stock (Production - Sold = In Hand)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {Object.entries(stock).map(([type, val]) => (
              <div key={type} style={{ padding: 12, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>{type}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: val.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>{val.stock.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>P:{val.produced.toLocaleString()} | S:{val.sold.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>New Entry</h3>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Brick Type</label>
              <select value={form.brickType} onChange={(e) => setForm({ ...form, brickType: e.target.value })}>
                {BRICK_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Shift</label>
              <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                <option value="WHOLE_DAY">Full Day</option>
                <option value="MORNING">Morning</option>
                <option value="EVENING">Evening</option>
                <option value="NIGHT">Night</option>
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Count (number of bricks)</label>
              <input type="number" inputMode="numeric" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} placeholder="e.g. 5000" />
            </div>
            <div className="form-group">
              <label>Remark</label>
              <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} className="btn-outline btn-sm" style={{ flex: 1 }}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2 }} onClick={submit}>Save</button>
          </div>
        </div>
      )}

      {/* Selected Entry Detail */}
      {selected && (
        <div className="detail-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Entry Details</h3>
            <button onClick={() => setSelected(null)} className="btn-outline btn-sm">✕ Close</button>
          </div>
          <div className="detail-row"><span>Date</span><span className="date-highlight">{new Date(selected.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          <div className="detail-row"><span>Brick Type</span><strong>{selected.brickType}</strong></div>
          <div className="detail-row"><span>Shift</span><span>{shiftLabel(selected.shift)}</span></div>
          <div className="detail-row"><span>Count</span><strong style={{ fontSize: 18, color: 'var(--primary)' }}>{(selected.firedCount || selected.rawCount || 0).toLocaleString()}</strong></div>
          {selected.remarks && <div className="detail-row"><span>Remark</span><span>{selected.remarks}</span></div>}
        </div>
      )}

      {/* Entries grouped by date */}
      {Object.entries(dateGroups).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 16 }}>
          <div className="date-highlight" style={{ marginBottom: 8 }}>📅 {date} — {items.reduce((s, e) => s + (e.firedCount || e.rawCount || 0), 0).toLocaleString()} bricks</div>
          {items.map((e) => (
            <div key={e.id} className="data-card" onClick={() => setSelected(e)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{e.brickType}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-light)' }}>{shiftLabel(e.shift)}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                  {(e.firedCount || e.rawCount || 0).toLocaleString()}
                </div>
              </div>
              {e.remarks && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{e.remarks}</div>}
            </div>
          ))}
        </div>
      ))}

      {Object.keys(dateGroups).length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>No entries found</p>}
    </div>
  );
}
