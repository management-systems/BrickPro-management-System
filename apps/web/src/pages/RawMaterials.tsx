import { useEffect, useState } from 'react';
import { useAppStore } from '../store/app';
import { tr } from '../lib/i18n';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function RawMaterials() {
  const lang = useAppStore((s) => s.lang);
  const activeFactory = useAppStore((s) => s.activeFactory);
  const [tab, setTab] = useState<'stock' | 'materials' | 'purchases'>('stock');
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [materials, setMaterials] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showPayModal, setShowPayModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [supplierInput, setSupplierInput] = useState('');
  const [newSupplierMobile, setNewSupplierMobile] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [matForm, setMatForm] = useState({ name: '', nameHindi: '', unit: 'ton', lowStockThreshold: '' });
  const [purchaseForm, setPurchaseForm] = useState({ materialId: '', supplierId: '', quantity: '', rate: '', invoiceNo: '', paymentStatus: 'CREDIT', amountPaid: '0', date: new Date().toISOString().slice(0, 10) });

  const loadAll = () => {
    api.get('/raw-materials/materials').then((r) => setMaterials(r.data));
    api.get('/raw-materials/stock', { params: { factoryId: activeFactory } }).then((r) => setStock(r.data));
    api.get('/raw-materials/suppliers').then((r) => setSuppliers(r.data));
    api.get('/raw-materials/purchases', { params: { factoryId: activeFactory } }).then((r) => setPurchases(r.data));
  };
  useEffect(() => { loadAll(); }, [activeFactory]);

  const addMaterial = async () => {
    if (!matForm.name) return toast.error('Name required');
    await api.post('/raw-materials/materials', { ...matForm, lowStockThreshold: +matForm.lowStockThreshold || null });
    toast.success('Material added!');
    setShowAdd(false);
    setMatForm({ name: '', nameHindi: '', unit: 'ton', lowStockThreshold: '' });
    loadAll();
  };

  const handleSupplierSelect = (value: string) => {
    if (value === '__new__') {
      setSupplierInput('');
      setPurchaseForm({ ...purchaseForm, supplierId: '' });
    } else {
      setPurchaseForm({ ...purchaseForm, supplierId: value });
      setSupplierInput('');
    }
  };

  const submitPurchase = async () => {
    if (!purchaseForm.materialId || !purchaseForm.quantity || !purchaseForm.rate) return toast.error('Material, quantity, rate required');

    let supplierId = purchaseForm.supplierId;
    // Create new supplier if typed
    if (!supplierId && supplierInput.trim()) {
      const { data } = await api.post('/raw-materials/suppliers', { name: supplierInput.trim(), mobile: newSupplierMobile || undefined, address: newSupplierAddress || undefined });
      supplierId = data.id;
    }
    if (!supplierId) return toast.error('Select or enter supplier');

    await api.post('/raw-materials/purchases', {
      ...purchaseForm, supplierId, factoryId: activeFactory,
      date: new Date(purchaseForm.date).toISOString(),
      quantity: +purchaseForm.quantity, rate: +purchaseForm.rate, amountPaid: +purchaseForm.amountPaid,
    });
    toast.success('Purchase recorded!');
    setShowPurchaseForm(false);
    setPurchaseForm({ materialId: '', supplierId: '', quantity: '', rate: '', invoiceNo: '', paymentStatus: 'CREDIT', amountPaid: '0', date: new Date().toISOString().slice(0, 10) });
    setSupplierInput('');
    loadAll();
  };

  const recordPayment = async () => {
    if (!payAmount || +payAmount <= 0) return toast.error('Enter amount');
    await api.patch(`/raw-materials/purchases/${showPayModal.id}/payment`, { amount: +payAmount });
    toast.success('Payment recorded!');
    setShowPayModal(null);
    setPayAmount('');
    loadAll();
  };

  const totalPending = purchases.reduce((s, p) => s + (p.balanceDue || 0), 0);
  const totalPaid = purchases.reduce((s, p) => s + (p.amountPaid || 0), 0);

  return (
    <div className="page">
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🪨 {tr('rawMaterials', lang)}</h2>

      {/* Month Filter */}
      <div className="filter-bar">
        <select value={filterMonth} onChange={(e) => setFilterMonth(+e.target.value)}>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(+e.target.value)}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['stock', 'purchases', 'materials'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px', background: tab === t ? 'var(--primary)' : 'var(--surface)', color: tab === t ? 'white' : 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: tab === t ? 600 : 500 }}>
            {t === 'stock' ? 'Stock' : t === 'purchases' ? 'Purchases' : 'Materials'}
          </button>
        ))}
      </div>

      {/* ===== STOCK TAB ===== */}
      {tab === 'stock' && (
        <div>
          {stock.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: 30 }}>Add materials first</p>}
          {stock.map((s) => (
            <div key={s.id} className="data-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                {s.nameHindi && <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.nameHindi}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.lowStock ? 'var(--danger)' : 'var(--success)' }}>
                  {s.currentStock.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 400 }}>{s.unit}</span>
                </div>
                {s.lowStock && <div style={{ fontSize: 11, color: 'var(--danger)' }}>⚠️ Low Stock</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== PURCHASES TAB ===== */}
      {tab === 'purchases' && (
        <div>
          {/* Summary */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div className="card" style={{ flex: 1, textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>₹{totalPending.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Pending</div>
            </div>
            <div className="card" style={{ flex: 1, textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>₹{totalPaid.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Paid</div>
            </div>
          </div>

          <button className="btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowPurchaseForm(!showPurchaseForm)}>+ New Purchase</button>

          {/* Purchase Form */}
          {showPurchaseForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Record Purchase</h4>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Material *</label>
                  <select value={purchaseForm.materialId} onChange={(e) => {
                    if (e.target.value === '__new__') { setTab('materials'); setShowAdd(true); setShowPurchaseForm(false); }
                    else setPurchaseForm({ ...purchaseForm, materialId: e.target.value });
                  }}>
                    <option value="">-- Select Material --</option>
                    {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                    <option value="__new__">+ Add New Material</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Supplier *</label>
                  {purchaseForm.supplierId ? (
                    <select value={purchaseForm.supplierId} onChange={(e) => handleSupplierSelect(e.target.value)}>
                      <option value="">-- Select --</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}{s.firm ? ` (${s.firm})` : ''}</option>)}
                      <option value="__new__">+ Type new supplier</option>
                    </select>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input
                        value={supplierInput}
                        onChange={(e) => setSupplierInput(e.target.value)}
                        placeholder="Type new supplier name"
                        list="supplier-list"
                      />
                      <datalist id="supplier-list">
                        {suppliers.map((s) => <option key={s.id} value={s.name} />)}
                      </datalist>
                      {suppliers.length > 0 && !supplierInput && (
                        <button onClick={() => setPurchaseForm({ ...purchaseForm, supplierId: suppliers[0]?.id || '' })} style={{ position: 'absolute', right: 8, top: 8, fontSize: 11, background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 4, padding: '3px 6px' }}>Select ▾</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* New supplier details */}
              {!purchaseForm.supplierId && supplierInput && (
                <div className="form-grid-2">
                  <div className="form-group"><label>Supplier Mobile</label><input type="tel" value={newSupplierMobile} onChange={(e) => setNewSupplierMobile(e.target.value)} placeholder="Contact number" maxLength={10} /></div>
                  <div className="form-group"><label>Supplier Address</label><input value={newSupplierAddress} onChange={(e) => setNewSupplierAddress(e.target.value)} placeholder="City/Area" /></div>
                </div>
              )}
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={purchaseForm.date} onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" inputMode="decimal" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} placeholder="e.g. 10" />
                </div>
                <div className="form-group">
                  <label>Rate (₹/unit) *</label>
                  <input type="number" inputMode="decimal" value={purchaseForm.rate} onChange={(e) => setPurchaseForm({ ...purchaseForm, rate: e.target.value })} placeholder="e.g. 5000" />
                </div>
              </div>
              <div className="form-group">
                <label>Total: ₹{(+purchaseForm.quantity * +purchaseForm.rate).toLocaleString()}</label>
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Payment</label>
                  <select value={purchaseForm.paymentStatus} onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentStatus: e.target.value })}>
                    <option value="CREDIT">Credit (उधार)</option>
                    <option value="PAID">Full Paid</option>
                    <option value="PARTIAL">Partial</option>
                  </select>
                </div>
                {(purchaseForm.paymentStatus === 'PAID' || purchaseForm.paymentStatus === 'PARTIAL') && (
                  <div className="form-group">
                    <label>Amount Paid (₹)</label>
                    <input type="number" inputMode="numeric" value={purchaseForm.amountPaid} onChange={(e) => setPurchaseForm({ ...purchaseForm, amountPaid: e.target.value })} />
                  </div>
                )}
                <div className="form-group">
                  <label>Invoice No.</label>
                  <input value={purchaseForm.invoiceNo} onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNo: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowPurchaseForm(false)} style={{ flex: 1, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>Cancel</button>
                <button onClick={submitPurchase} className="btn-primary" style={{ flex: 2 }}>Save Purchase</button>
              </div>
            </div>
          )}

          {/* Purchase List */}
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Material</th><th>Supplier</th><th>Qty</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} onClick={() => setSelectedPurchase(selectedPurchase?.id === p.id ? null : p)} style={{ cursor: 'pointer' }}>
                  <td><span className="date-highlight">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span></td>
                  <td style={{ fontWeight: 500 }}>{p.material?.name}</td>
                  <td>{p.supplier?.name}</td>
                  <td>{p.quantity} {p.material?.unit}</td>
                  <td style={{ fontWeight: 600 }}>₹{p.totalCost?.toLocaleString()}</td>
                  <td style={{ color: 'var(--success)' }}>₹{p.amountPaid?.toLocaleString()}</td>
                  <td style={{ color: p.balanceDue > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{p.balanceDue > 0 ? `₹${p.balanceDue.toLocaleString()}` : '✓'}</td>
                  <td><span className={`badge badge-${p.paymentStatus?.toLowerCase()}`}>{p.paymentStatus}</span></td>
                  <td>
                    {p.balanceDue > 0 && <button onClick={(e) => { e.stopPropagation(); setShowPayModal(p); setPayAmount(''); }} style={{ fontSize: 12, background: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: 6 }}>Pay</button>}
                    {!p.used && <button onClick={(e) => { e.stopPropagation(); api.patch(`/raw-materials/purchases/${p.id}/mark-used`).then(() => { toast.success('Marked as used'); loadAll(); }); }} style={{ fontSize: 11, background: 'var(--success)', color: 'white', padding: '4px 8px', borderRadius: 6, marginLeft: 4 }}>✓ Used</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="data-cards-mobile">
            {purchases.map((p) => (
              <div key={p.id} className="data-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.material?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{p.supplier?.name} • {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                  </div>
                  <span className={`badge badge-${p.paymentStatus?.toLowerCase()}`}>{p.paymentStatus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{p.quantity} {p.material?.unit} @ ₹{p.rate}</span>
                  <span style={{ fontWeight: 700 }}>₹{p.totalCost?.toLocaleString()}</span>
                </div>
                {p.balanceDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--success)' }}>Paid: ₹{p.amountPaid?.toLocaleString()}</span>
                      <span style={{ color: 'var(--danger)', fontWeight: 600, marginLeft: 10 }}>Due: ₹{p.balanceDue?.toLocaleString()}</span>
                    </div>
                    <button onClick={() => { setShowPayModal(p); setPayAmount(''); }} style={{ fontSize: 12, background: 'var(--primary)', color: 'white', padding: '6px 10px', borderRadius: 6 }}>+ Pay</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {purchases.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No purchases yet</p>}
        </div>
      )}

      {/* ===== MATERIALS TAB ===== */}
      {tab === 'materials' && (
        <div>
          {/* Search */}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search materials..." style={{ marginBottom: 12 }} />

          <button className="btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowAdd(!showAdd)}>+ Add Material</button>
          {showAdd && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="form-grid-2">
                <div className="form-group"><label>Name *</label><input value={matForm.name} onChange={(e) => setMatForm({ ...matForm, name: e.target.value })} placeholder="e.g. Coal" /></div>
                <div className="form-group"><label>Name (Hindi)</label><input value={matForm.nameHindi} onChange={(e) => setMatForm({ ...matForm, nameHindi: e.target.value })} placeholder="e.g. कोयला" /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Unit</label>
                  <select value={matForm.unit} onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })}>
                    <option value="ton">Ton</option><option value="kg">Kg</option><option value="quintal">Quintal</option><option value="litre">Litre</option><option value="cubic_ft">Cubic Ft</option><option value="trolley">Trolley</option>
                  </select>
                </div>
                <div className="form-group"><label>Low Stock Alert</label><input type="number" value={matForm.lowStockThreshold} onChange={(e) => setMatForm({ ...matForm, lowStockThreshold: e.target.value })} placeholder="Threshold qty" /></div>
              </div>
              <button className="btn-primary" onClick={addMaterial}>Save Material</button>
            </div>
          )}

          {/* Material Detail View */}
          {selectedMaterial && (
            <div className="detail-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{selectedMaterial.name} {selectedMaterial.nameHindi && <span style={{ color: 'var(--text-light)', fontSize: 14 }}>({selectedMaterial.nameHindi})</span>}</h3>
                <button onClick={() => setSelectedMaterial(null)} className="btn-outline btn-sm">✕ Close</button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 12 }}>Unit: {selectedMaterial.unit} • Status: {selectedMaterial.active ? 'Active' : 'Inactive'}</p>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Purchase History</h4>
              {purchases.filter(p => p.materialId === selectedMaterial.id).length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No purchases for this material</p>
              )}
              {purchases.filter(p => p.materialId === selectedMaterial.id).map(p => (
                <div key={p.id} className="data-card" style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="date-highlight">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-light)' }}>{p.supplier?.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>₹{p.totalCost?.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{p.quantity} {selectedMaterial.unit} @ ₹{p.rate}</div>
                    </div>
                  </div>
                  {p.balanceDue > 0 && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>Pending: ₹{p.balanceDue?.toLocaleString()}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Material List */}
          {!selectedMaterial && materials.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase())).map((m) => (
            <div key={m.id} className="data-card card-clickable" onClick={() => setSelectedMaterial(m)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name} {m.nameHindi && <span style={{ color: 'var(--text-light)' }}>({m.nameHindi})</span>}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Unit: {m.unit}{m.lowStockThreshold ? ` • Alert below: ${m.lowStockThreshold}` : ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={(e) => { e.stopPropagation(); api.patch(`/raw-materials/materials/${m.id}/toggle`).then(() => { toast.success(m.active ? 'Deactivated' : 'Activated'); loadAll(); }).catch(() => toast.error('Failed')); }} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: m.active ? '#fee2e2' : '#dcfce7', color: m.active ? '#991b1b' : '#166534', border: 'none', cursor: 'pointer' }}>
                  {m.active ? 'Deactivate' : 'Activate'}
                </button>
                <span style={{ color: 'var(--text-light)', fontSize: 16 }}>›</span>
              </div>
            </div>
          ))}
          {materials.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No materials added yet</p>}
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 360 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Record Payment</h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
              {showPayModal.material?.name} from {showPayModal.supplier?.name}<br />
              Due: <strong style={{ color: 'var(--danger)' }}>₹{showPayModal.balanceDue?.toLocaleString()}</strong>
            </p>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" inputMode="numeric" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Enter amount" autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPayModal(null)} style={{ flex: 1, padding: 12, background: '#f3f4f6', border: 'none', borderRadius: 8, fontWeight: 500 }}>Cancel</button>
              <button onClick={recordPayment} style={{ flex: 1, padding: 12, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
