import { useEffect, useState } from 'react';
import { useAppStore } from '../store/app';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Fuel() {
  const lang = useAppStore((s) => s.lang);
  const activeFactory = useAppStore((s) => s.activeFactory);
  const [entries, setEntries] = useState<any[]>([]);
  const [fuelExpenses, setFuelExpenses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fuelType: 'Diesel', quantity: '', unit: 'litre', rate: '', supplier: '', invoiceNo: '', date: new Date().toISOString().slice(0, 10) });

  const load = () => {
    api.get('/fuel').then((r) => setEntries(r.data));
    api.get('/expenditure', { params: { factoryId: activeFactory, category: 'Diesel/Fuel' } }).then((r) => setFuelExpenses(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [activeFactory]);

  const submit = async () => {
    if (!form.quantity || !form.rate) return toast.error('Quantity and rate required');
    await api.post('/fuel', { ...form, factoryId: activeFactory, date: new Date(form.date).toISOString(), quantity: +form.quantity, rate: +form.rate });
    toast.success('Fuel entry saved!');
    setShowForm(false);
    setForm({ fuelType: 'Diesel', quantity: '', unit: 'litre', rate: '', supplier: '', invoiceNo: '', date: new Date().toISOString().slice(0, 10) });
    load();
  };

  const totalCost = entries.reduce((s, e) => s + (e.totalCost || 0), 0) + fuelExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>⛽ {lang === 'en' ? 'Fuel' : 'ईंधन'}</h2>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => setShowForm(!showForm)}>+ Add</button>
      </div>

      {/* Total */}
      <div className="card" style={{ textAlign: 'center', padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>₹{totalCost.toLocaleString()}</div>
        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Total Fuel Cost</div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>New Fuel Entry</h4>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Fuel Type</label>
              <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Coal">Coal</option>
                <option value="Gas">Gas (LPG/CNG)</option>
                <option value="Wood">Wood</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="litre">Litre</option>
                <option value="kg">Kg</option>
                <option value="ton">Ton</option>
                <option value="trolley">Trolley</option>
              </select>
            </div>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" inputMode="decimal" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 50" />
            </div>
            <div className="form-group">
              <label>Rate (₹/unit) *</label>
              <input type="number" inputMode="decimal" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="e.g. 90" />
            </div>
            <div className="form-group">
              <label>Total</label>
              <input value={`₹ ${(+form.quantity * +form.rate).toLocaleString()}`} disabled style={{ background: '#f9fafb', fontWeight: 600 }} />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group"><label>Supplier</label><input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Optional" /></div>
            <div className="form-group"><label>Invoice No.</label><input value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} placeholder="Optional" /></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>Cancel</button>
            <button onClick={submit} className="btn-primary" style={{ flex: 2 }}>Save</button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <table className="data-table">
        <thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Rate</th><th>Total</th><th>Supplier</th></tr></thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
              <td style={{ fontWeight: 500 }}>{e.fuelType}</td>
              <td>{e.quantity} {e.unit}</td>
              <td>₹{e.rate}</td>
              <td style={{ fontWeight: 600 }}>₹{e.totalCost?.toLocaleString()}</td>
              <td style={{ color: 'var(--text-light)' }}>{e.supplier || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="data-cards-mobile">
        {entries.map((e) => (
          <div key={e.id} className="data-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {e.fuelType}</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>₹{e.totalCost?.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 13 }}>{e.quantity} {e.unit} @ ₹{e.rate}/{e.unit}</div>
            {e.supplier && <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{e.supplier}</div>}
          </div>
        ))}
      </div>

      {entries.length === 0 && fuelExpenses.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>No fuel entries yet</p>}

      {/* Fuel from Expenditure */}
      {fuelExpenses.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-light)' }}>From Expenditure (Diesel/Fuel category)</h3>
          {fuelExpenses.map((e) => (
            <div key={e.id} className="data-card" style={{ borderLeft: '3px solid var(--warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {e.paidTo && `• ${e.paidTo}`}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger)' }}>₹{e.amount?.toLocaleString()}</span>
              </div>
              {e.description && <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>{e.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
