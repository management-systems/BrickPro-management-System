import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store/app';
import { useAuthStore } from '../store/auth';
import { tr } from '../lib/i18n';
import api from '../lib/api';
import toast from 'react-hot-toast';

const BRICK_TYPES = ['Fly Ash Brick', 'Red Brick', 'AAC Block', 'Hollow Brick', 'Solid Brick', 'Paver Block', 'Fire Brick'];

export default function Dispatch() {
  const lang = useAppStore((s) => s.lang);
  const activeFactory = useAppStore((s) => s.activeFactory);
  const location = useLocation();
  const preSelectedCustomer = (location.state as any)?.customerId || '';
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(!!preSelectedCustomer);
  const [showPayment, setShowPayment] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingDispatch, setEditingDispatch] = useState<any>(null);
  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const lastBrick = localStorage.getItem('last_brickType') || 'Fly Ash Brick';
  const [form, setForm] = useState({
    customerId: preSelectedCustomer, ticketNo: '', truckNo: '', brickType: lastBrick,
    quantity: '', rate: '', amountReceived: '0', remarks: '', date: new Date().toISOString().slice(0, 10), distance: '',
  });

  const load = () => {
    api.get('/dispatch', { params: { factoryId: activeFactory } }).then((r) => setDispatches(r.data));
    api.get('/customers').then((r) => setCustomers(r.data));
  };
  useEffect(() => { load(); }, [activeFactory]);

  const updateForm = (updates: any) => {
    if (updates.brickType) localStorage.setItem('last_brickType', updates.brickType);
    setForm({ ...form, ...updates });
  };

  const submit = async () => {
    if (!form.customerId || !form.quantity || !form.rate) return toast.error('Customer, quantity, rate required');
    if (editingDispatch) {
      await api.put(`/dispatch/${editingDispatch.id}`, { ...form, factoryId: activeFactory, quantity: +form.quantity, rate: +form.rate, amountReceived: +form.amountReceived, distance: form.distance ? +form.distance : undefined });
      toast.success('Challan updated!');
      setEditingDispatch(null);
    } else {
      await api.post('/dispatch', { ...form, factoryId: activeFactory, quantity: +form.quantity, rate: +form.rate, amountReceived: +form.amountReceived, distance: form.distance ? +form.distance : undefined });
      toast.success('Challan created!');
    }
    setShowForm(false);
    setForm({ customerId: '', ticketNo: '', truckNo: '', brickType: localStorage.getItem('last_brickType') || 'Red Brick', quantity: '', rate: '', amountReceived: '0', remarks: '', date: new Date().toISOString().slice(0, 10), distance: '' });
    load();
  };

  const editDispatch = (d: any) => {
    setForm({
      customerId: d.customerId, ticketNo: d.challanNo || '', truckNo: d.truckNo || '',
      brickType: d.brickType, quantity: d.quantity?.toString() || '', rate: d.rate?.toString() || '',
      amountReceived: d.amountReceived?.toString() || '0', remarks: d.remarks || '',
      date: new Date(d.date).toISOString().slice(0, 10), distance: d.distance?.toString() || '',
    });
    setEditingDispatch(d);
    setShowForm(true);
  };

  const deleteDispatch = async (d: any) => {
    if (!confirm(`Delete challan ${d.challanNo}? This cannot be undone.`)) return;
    await api.delete(`/dispatch/${d.id}`);
    toast.success('Deleted!');
    load();
  };

  const recordPayment = async () => {
    if (!payAmount || +payAmount <= 0) return toast.error('Enter amount');
    await api.patch(`/dispatch/${showPayment.id}/payment`, { amount: +payAmount });
    toast.success('Payment recorded!');
    const newBalance = showPayment.balanceDue - +payAmount;
    const customer = showPayment.customer?.name || 'Customer';
    const mobile = showPayment.customer?.mobile || customers.find((c: any) => c.id === showPayment.customerId)?.mobile || '';
    const text = `🧱 *BrickPro - Payment Received*
━━━━━━━━━━━━━━━━━━
👤 Customer: ${customer}
📋 Challan: ${showPayment.challanNo}
📅 Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}

💰 Payment Received: ₹${(+payAmount).toLocaleString()}
💵 Total Bill: ₹${showPayment.amount?.toLocaleString()}
✅ Total Paid: ₹${(showPayment.amountReceived + +payAmount).toLocaleString()}
${newBalance > 0 ? `⚠️ Still Pending: ₹${newBalance.toLocaleString()}` : '✅ Fully Paid - No Pending!'}
━━━━━━━━━━━━━━━━━━
Thank you! 🙏`;

    const shareUrl = mobile
      ? `https://wa.me/91${mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    setShowPayment(null);
    setPayAmount('');
    load();

    // Ask to share
    if (confirm('Payment saved! Share receipt on WhatsApp?')) {
      window.open(shareUrl, '_blank');
    }
  };

  const shareWhatsApp = (d: any) => {
    const customer = d.customer?.name || 'Customer';
    const mobile = d.customer?.mobile || customers.find((c: any) => c.id === d.customerId)?.mobile || '';
    const text = `🧱 *BrickPro - Sale Challan*
━━━━━━━━━━━━━━━━━━
📋 Ticket: ${d.challanNo}
📅 Date: ${new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
👤 Customer: ${customer}

🧱 ${d.brickType} × ${d.quantity?.toLocaleString()}
💰 Rate: ₹${d.rate} / brick
💵 Total: ₹${d.amount?.toLocaleString()}
✅ Received: ₹${d.amountReceived?.toLocaleString()}
${d.balanceDue > 0 ? `⚠️ Pending: ₹${d.balanceDue?.toLocaleString()}` : '✅ Fully Paid'}

🚛 Truck: ${d.truckNo || '—'}${d.distance ? `\n📍 Distance: ${d.distance} KM` : ''}
━━━━━━━━━━━━━━━━━━
Thank you for your business! 🙏`;

    const url = mobile
      ? `https://wa.me/91${mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filtered = (filter === 'all' ? dispatches : dispatches.filter((d) => d.paymentStatus === filter)).filter(d => !search || d.customer?.name?.toLowerCase().includes(search.toLowerCase()) || d.challanNo?.toLowerCase().includes(search.toLowerCase()) || new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (status: string) => {
    const cls = status === 'PAID' ? 'badge-paid' : status === 'PARTIAL' ? 'badge-partial' : 'badge-credit';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>🚛 {lang === 'en' ? 'Sell Bricks' : 'ईंट बिक्री'}</h2>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => setShowForm(!showForm)}>+ New Sale</button>
      </div>

      {/* Search */}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search customer, ticket..." style={{ marginBottom: 12 }} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {[['all', 'All'], ['CREDIT', 'Pending'], ['PARTIAL', 'Partial'], ['PAID', 'Paid']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 20, border: 'none', whiteSpace: 'nowrap', background: filter === k ? 'var(--primary)' : 'var(--surface)', color: filter === k ? 'white' : 'var(--text)', boxShadow: filter === k ? 'none' : 'var(--shadow)', fontWeight: filter === k ? 600 : 500 }}>{l}</button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>{editingDispatch ? 'Edit Sale Entry' : 'New Sale Entry'}</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Ticket No.</label>
              <input value={form.ticketNo} onChange={(e) => updateForm({ ticketNo: e.target.value })} placeholder="e.g. 001" />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => updateForm({ date: e.target.value })} />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Brick Type</label>
              <select value={form.brickType} onChange={(e) => updateForm({ brickType: e.target.value })}>
                {BRICK_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{tr('customer', lang)} *</label>
              <select value={form.customerId} onChange={(e) => {
                const custId = e.target.value;
                // Auto-fill rate from last dispatch of this customer
                const lastDispatch = dispatches.find(d => d.customerId === custId);
                const autoRate = lastDispatch?.rate?.toString() || form.rate;
                updateForm({ customerId: custId, rate: autoRate });
              }}>
                <option value="">-- Select Customer --</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.firm ? ` (${c.firm})` : ''}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" inputMode="numeric" value={form.quantity} onChange={(e) => updateForm({ quantity: e.target.value })} placeholder="5000" />
            </div>
            <div className="form-group">
              <label>Rate (₹/brick) *</label>
              <input type="number" inputMode="decimal" value={form.rate} onChange={(e) => updateForm({ rate: e.target.value })} placeholder="8.5" />
            </div>
            <div className="form-group">
              <label>Total</label>
              <input value={`₹ ${(+form.quantity * +form.rate).toLocaleString()}`} disabled style={{ background: '#f9fafb', fontWeight: 600 }} />
            </div>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Received (₹)</label>
              <input type="number" inputMode="numeric" value={form.amountReceived} onChange={(e) => updateForm({ amountReceived: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Truck No.</label>
              <input value={form.truckNo} onChange={(e) => updateForm({ truckNo: e.target.value })} placeholder="HR-XX-XXXX" />
            </div>
            <div className="form-group">
              <label>Distance (KM)</label>
              <input type="number" inputMode="numeric" value={form.distance} onChange={(e) => updateForm({ distance: e.target.value })} placeholder="e.g. 25" />
            </div>
          </div>
          <div className="form-group">
            <label>Remark</label>
            <input value={form.remarks} onChange={(e) => updateForm({ remarks: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => { setShowForm(false); setEditingDispatch(null); }} style={{ flex: 1, padding: 12, background: '#f3f4f6', borderRadius: 8, fontWeight: 500 }}>Cancel</button>
            <button onClick={submit} className="btn-primary" style={{ flex: 2 }}>{editingDispatch ? 'Update' : tr('save', lang)}</button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Ticket</th><th>Date</th><th>Customer</th><th>Brick Type</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Received</th><th>Due</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((d) => (
            <tr key={d.id}>
              <td style={{ fontWeight: 600 }}>{d.challanNo || '-'}</td>
              <td>{new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
              <td style={{ fontWeight: 500 }}>{d.customer?.name}</td>
              <td>{d.brickType}</td>
              <td>{d.quantity?.toLocaleString()}</td>
              <td style={{ color: 'var(--text-light)' }}>₹{d.rate}</td>
              <td style={{ fontWeight: 600 }}>₹{d.amount?.toLocaleString()}</td>
              <td style={{ color: 'var(--success)' }}>₹{d.amountReceived?.toLocaleString()}</td>
              <td style={{ color: d.balanceDue > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                {d.balanceDue > 0 ? `₹${d.balanceDue.toLocaleString()}` : '✓'}
              </td>
              <td>{statusBadge(d.paymentStatus)}</td>
              <td>
                {d.balanceDue > 0 && (
                  <button onClick={() => { setShowPayment(d); setPayAmount(''); }} style={{ fontSize: 12, background: 'var(--primary)', color: 'white', padding: '5px 10px', borderRadius: 6 }}>+ Pay</button>
                )}
                <button onClick={() => shareWhatsApp(d)} style={{ fontSize: 12, background: '#25D366', color: 'white', padding: '5px 10px', borderRadius: 6, marginLeft: 4 }}>📱</button>
                {isOwner && (
                  <>
                    <button onClick={() => editDispatch(d)} style={{ fontSize: 12, background: '#f59e0b', color: 'white', padding: '5px 10px', borderRadius: 6, marginLeft: 4 }}>✏️</button>
                    <button onClick={() => deleteDispatch(d)} style={{ fontSize: 12, background: '#ef4444', color: 'white', padding: '5px 10px', borderRadius: 6, marginLeft: 4 }}>🗑️</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="data-cards-mobile">
        {filtered.map((d) => (
          <div key={d.id} className="data-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{d.customer?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{d.challanNo} • {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
              </div>
              {statusBadge(d.paymentStatus)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-light)' }}>{d.brickType} × {d.quantity?.toLocaleString()} @ ₹{d.rate}</span>
              <span style={{ fontWeight: 700 }}>₹{d.amount?.toLocaleString()}</span>
            </div>
            {d.balanceDue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>Due: ₹{d.balanceDue.toLocaleString()}</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => shareWhatsApp(d)} style={{ fontSize: 12, background: '#25D366', color: 'white', padding: '6px 10px', borderRadius: 6, fontWeight: 600 }}>📱 Share</button>
                  <button onClick={() => { setShowPayment(d); setPayAmount(''); }} style={{ fontSize: 12, background: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: 6, fontWeight: 600 }}>+ Pay</button>
                  {isOwner && (
                    <>
                      <button onClick={() => editDispatch(d)} style={{ fontSize: 12, background: '#f59e0b', color: 'white', padding: '6px 10px', borderRadius: 6, fontWeight: 600 }}>✏️</button>
                      <button onClick={() => deleteDispatch(d)} style={{ fontSize: 12, background: '#ef4444', color: 'white', padding: '6px 10px', borderRadius: 6, fontWeight: 600 }}>🗑️</button>
                    </>
                  )}
                </div>
              </div>
            )}
            {d.balanceDue <= 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button onClick={() => shareWhatsApp(d)} style={{ fontSize: 12, background: '#25D366', color: 'white', padding: '6px 10px', borderRadius: 6, fontWeight: 600 }}>📱 Share</button>
                {isOwner && (
                  <>
                    <button onClick={() => editDispatch(d)} style={{ fontSize: 12, background: '#f59e0b', color: 'white', padding: '6px 10px', borderRadius: 6, fontWeight: 600, marginLeft: 6 }}>✏️</button>
                    <button onClick={() => deleteDispatch(d)} style={{ fontSize: 12, background: '#ef4444', color: 'white', padding: '6px 10px', borderRadius: 6, fontWeight: 600, marginLeft: 6 }}>🗑️</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: 40, fontSize: 14 }}>No entries yet</p>}

      {/* Payment Modal */}
      {showPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 360 }}>
            <h3 style={{ marginBottom: 8, fontSize: 16 }}>Record Payment</h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
              {showPayment.customer?.name} • Due: <strong style={{ color: 'var(--danger)' }}>₹{showPayment.balanceDue?.toLocaleString()}</strong>
            </p>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" inputMode="numeric" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Enter amount" autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPayment(null)} style={{ flex: 1, padding: 12, background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>Cancel</button>
              <button onClick={recordPayment} style={{ flex: 1, padding: 12, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
