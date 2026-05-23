import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/app';
import { tr } from '../lib/i18n';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Customers() {
  const lang = useAppStore((s) => s.lang);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('cash');
  const [form, setForm] = useState({ name: '', firm: '', mobile: '', address: '', type: 'dealer', ratePer1000: '', ratePerBrick: '' });
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [moreForm, setMoreForm] = useState({ contact2: '', paymentContact: '', address2: '', bankName: '', accountNo: '', ifsc: '', upiId: '' });
  const navigate = useNavigate();

  const loadCustomers = () => api.get('/customers').then((r) => setCustomers(r.data));
  useEffect(() => { loadCustomers(); }, []);

  const submit = async () => {
    if (!form.name) return toast.error('Name required');
    await api.post('/customers', form);
    toast.success('Customer added!');
    setShowForm(false);
    setForm({ name: '', firm: '', mobile: '', address: '', type: 'dealer', ratePer1000: '', ratePerBrick: '' });
    loadCustomers();
  };

  const openDetail = async (c: any) => {
    const { data } = await api.get(`/customers/${c.id}/details`);
    setSelected(c);
    setDetails(data);
  };

  const closeDetail = () => { setSelected(null); setDetails(null); setShowPayForm(false); };

  const recordPayment = async () => {
    if (!payAmount || +payAmount <= 0) return toast.error('Enter amount');
    await api.post(`/customers/${selected.id}/payment`, { amount: +payAmount, mode: payMode });
    toast.success('Payment recorded!');

    const custName = selected.name || 'Customer';
    const mobile = selected.mobile || '';
    const outstanding = (selected.outstanding || 0) - +payAmount;
    const text = `🧱 *BrickPro - Payment Received*
━━━━━━━━━━━━━━━━━━
👤 Customer: ${custName}
📅 Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}

💰 Payment Received: ₹${(+payAmount).toLocaleString()}
💳 Mode: ${payMode.toUpperCase()}
${outstanding > 0 ? `⚠️ Total Pending: ₹${outstanding.toLocaleString()}` : '✅ All Clear - No Pending!'}
━━━━━━━━━━━━━━━━━━
Thank you! 🙏`;

    const shareUrl = mobile
      ? `https://wa.me/91${mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    setPayAmount('');
    setShowPayForm(false);
    openDetail(selected);
    loadCustomers();

    if (confirm('Payment saved! Share receipt on WhatsApp?')) {
      window.open(shareUrl, '_blank');
    }
  };

  const goToSell = () => {
    navigate('/dispatch', { state: { customerId: selected.id } });
  };

  const filtered = search
    ? customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.firm?.toLowerCase().includes(search.toLowerCase()) || c.mobile?.includes(search))
    : customers;

  // ===== DETAIL VIEW =====
  if (selected && details) {
    return (
      <div className="page">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={closeDetail} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>← Back</button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selected.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
              {selected.firm && <span>{selected.firm} • </span>}
              {selected.mobile && <span>{selected.mobile}</span>}
              {selected.address && <span> • {selected.address}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selected.mobile && <a href={`tel:${selected.mobile}`} style={{ fontSize: 22, textDecoration: 'none', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}>📞</a>}
            {selected.mobile && <a href={`https://wa.me/91${selected.mobile}`} target="_blank" style={{ fontSize: 22, textDecoration: 'none', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}>💬</a>}
          </div>
        </div>

        {/* Summary */}
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          <div className="card stat-card">
            <div className="value">{details.totalSold?.toLocaleString()}</div>
            <div className="label">Bricks Sold</div>
          </div>
          <div className="card stat-card">
            <div className="value">₹{details.totalAmount?.toLocaleString()}</div>
            <div className="label">Total Business</div>
          </div>
          <div className="card stat-card">
            <div className="value" style={{ color: 'var(--success)' }}>₹{details.totalReceived?.toLocaleString()}</div>
            <div className="label">Received</div>
          </div>
          <div className="card stat-card">
            <div className="value" style={{ color: details.totalDue > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{details.totalDue?.toLocaleString()}</div>
            <div className="label">Pending</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={goToSell} style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
            🚛 Sell Bricks
          </button>
          <button onClick={() => setShowPayForm(!showPayForm)} style={{ flex: 1, padding: '12px', background: 'var(--success)', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
            💰 Add Payment
          </button>
          <button onClick={() => {
            const custName = selected.name || 'Customer';
            const mobile = selected.mobile || '';
            const outstanding = details?.summary?.totalDue || 0;
            const totalBought = details?.summary?.totalAmount || 0;
            const totalPaid = details?.summary?.totalPaid || 0;
            const text = `\ud83e\uddf1 *BrickPro - Customer Statement*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\ud83d\udc64 Customer: ${custName}\n\ud83d\udcc5 Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n\n\ud83d\udcb5 Total Purchased: \u20b9${totalBought.toLocaleString()}\n\u2705 Total Paid: \u20b9${totalPaid.toLocaleString()}\n${outstanding > 0 ? `\u26a0\ufe0f Total Pending: \u20b9${outstanding.toLocaleString()}` : '\u2705 All Clear - No Pending!'}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nPlease clear pending amount. Thank you! \ud83d\ude4f`;
            const url = mobile ? `https://wa.me/91${mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
          }} style={{ padding: '12px', background: '#25D366', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
            📱 WhatsApp
          </button>
        </div>

        {/* Payment Form */}
        {showPayForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Record Payment</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Amount (₹)</label>
                <input type="number" inputMode="numeric" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Enter amount" autoFocus />
              </div>
              <div className="form-group">
                <label>Payment Mode</label>
                <select value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>
            <button onClick={recordPayment} className="btn-primary">Save Payment</button>
          </div>
        )}

        {/* Sales & Payments History */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Ledger ({details.dispatches.length} sales)</h3>
        </div>

        {/* Running balance ledger */}
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Details</th><th>Debit (₹)</th><th>Credit (₹)</th><th>Balance</th></tr>
          </thead>
          <tbody>
            {(() => {
              // Build ledger sorted by date (oldest first) to calculate running balance
              const ledger: any[] = [];
              details.dispatches.forEach((d: any) => {
                ledger.push({ date: d.date, type: 'sale', detail: `${d.brickType} × ${d.quantity?.toLocaleString()}`, debit: d.amount || 0, credit: 0 });
                if (d.amountReceived > 0) {
                  ledger.push({ date: d.date, type: 'payment', detail: 'Payment received', debit: 0, credit: d.amountReceived });
                }
              });
              // Sort oldest first to calculate running balance correctly
              ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              let runningBalance = 0;
              ledger.forEach(row => { runningBalance += row.debit - row.credit; row.balance = runningBalance; });
              // Display newest first
              return ledger.reverse().map((row, i) => (
                <tr key={i} style={{ background: row.type === 'payment' ? 'rgba(16,185,129,0.05)' : undefined }}>
                  <td><span className="date-highlight">{new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span></td>
                  <td><span className="badge" style={{ background: row.type === 'sale' ? '#fee2e2' : '#dcfce7', color: row.type === 'sale' ? '#991b1b' : '#166534' }}>{row.type === 'sale' ? '🧱 Sale' : '💰 Payment'}</span></td>
                  <td style={{ fontSize: 12 }}>{row.detail}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: row.debit ? 600 : 400 }}>{row.debit ? `₹${row.debit.toLocaleString()}` : ''}</td>
                  <td style={{ color: 'var(--success)', fontWeight: row.credit ? 600 : 400 }}>{row.credit ? `₹${row.credit.toLocaleString()}` : ''}</td>
                  <td style={{ fontWeight: 600, color: row.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{row.balance.toLocaleString()}</td>
                </tr>
              ));
            })()}
          </tbody>
        </table>

        {/* Mobile Cards */}
        <div className="data-cards-mobile">
          {(() => {
            const ledger: any[] = [];
            details.dispatches.forEach((d: any) => {
              ledger.push({ date: d.date, type: 'sale', detail: `${d.brickType} × ${d.quantity?.toLocaleString()}`, debit: d.amount || 0, credit: 0 });
              if (d.amountReceived > 0) {
                ledger.push({ date: d.date, type: 'payment', detail: 'Payment received', debit: 0, credit: d.amountReceived });
              }
            });
            ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            let runningBalance = 0;
            ledger.forEach(row => { runningBalance += row.debit - row.credit; row.balance = runningBalance; });
            return ledger.reverse().map((row, i) => (
              <div key={i} className="data-card" style={{ borderLeft: `3px solid ${row.type === 'sale' ? 'var(--danger)' : 'var(--success)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="date-highlight">{new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    <span style={{ marginLeft: 8, fontSize: 12 }}>{row.type === 'sale' ? '🧱 Sale' : '💰 Payment'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {row.debit > 0 && <div style={{ color: 'var(--danger)', fontWeight: 600 }}>+₹{row.debit.toLocaleString()}</div>}
                    {row.credit > 0 && <div style={{ color: 'var(--success)', fontWeight: 600 }}>-₹{row.credit.toLocaleString()}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-light)' }}>{row.detail}</span>
                  <span style={{ fontWeight: 600, color: row.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>Bal: ₹{row.balance.toLocaleString()}</span>
                </div>
              </div>
            ));
          })()}
        </div>

        {details.dispatches.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: 30, fontSize: 14 }}>No sales yet. Tap "Sell Bricks" to create first sale.</p>}
      </div>
    );
  }

  // ===== CUSTOMER LIST VIEW =====
  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>👥 {lang === 'en' ? 'Customers' : 'ग्राहक'}</h2>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => setShowForm(!showForm)}>+ Add Customer</button>
      </div>

      {/* Search */}
      <input
        value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder={lang === 'en' ? '🔍 Search by name, firm or mobile...' : '🔍 नाम, फर्म या मोबाइल से खोजें...'}
        style={{ marginBottom: 16 }}
      />

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>New Customer</h3>
          <div className="form-grid-2">
            <div className="form-group"><label>{tr('name', lang)} *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" /></div>
            <div className="form-group"><label>Firm / Company</label><input value={form.firm} onChange={(e) => setForm({ ...form, firm: e.target.value })} placeholder="Firm name" /></div>
          </div>
          <div className="form-grid-3">
            <div className="form-group"><label>{tr('mobile', lang)}</label><input type="tel" inputMode="numeric" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} maxLength={10} placeholder="Mobile number" /></div>
            <div className="form-group"><label>Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="City/Area" /></div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="dealer">Dealer</option>
                <option value="contractor">Contractor</option>
                <option value="direct">Direct Customer</option>
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group"><label>Rate per 1000 bricks (₹)</label><input type="number" value={form.ratePer1000} onChange={(e) => setForm({ ...form, ratePer1000: e.target.value })} placeholder="e.g. 7500" /></div>
            <div className="form-group"><label>Rate per brick (₹)</label><input type="number" inputMode="decimal" value={form.ratePerBrick} onChange={(e) => setForm({ ...form, ratePerBrick: e.target.value })} placeholder="e.g. 7.5 (auto from per 1000)" /></div>
          </div>
          <button type="button" onClick={() => setShowMoreDetails(!showMoreDetails)} style={{ background: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 500, marginBottom: 12, padding: 0 }}>
            {showMoreDetails ? '▼ Hide' : '▶'} Additional Details
          </button>
          {showMoreDetails && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <div className="form-grid-2">
                <div className="form-group"><label>Contact 2</label><input value={moreForm.contact2} onChange={(e) => setMoreForm({ ...moreForm, contact2: e.target.value })} placeholder="Alternate number" /></div>
                <div className="form-group"><label>Payment Contact</label><input value={moreForm.paymentContact} onChange={(e) => setMoreForm({ ...moreForm, paymentContact: e.target.value })} placeholder="Payment person" /></div>
              </div>
              <div className="form-group"><label>Address 2</label><input value={moreForm.address2} onChange={(e) => setMoreForm({ ...moreForm, address2: e.target.value })} placeholder="Full address" /></div>
              <div className="form-grid-3">
                <div className="form-group"><label>Bank Name</label><input value={moreForm.bankName} onChange={(e) => setMoreForm({ ...moreForm, bankName: e.target.value })} /></div>
                <div className="form-group"><label>Account No</label><input value={moreForm.accountNo} onChange={(e) => setMoreForm({ ...moreForm, accountNo: e.target.value })} /></div>
                <div className="form-group"><label>IFSC</label><input value={moreForm.ifsc} onChange={(e) => setMoreForm({ ...moreForm, ifsc: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>UPI ID</label><input value={moreForm.upiId} onChange={(e) => setMoreForm({ ...moreForm, upiId: e.target.value })} placeholder="name@upi" /></div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 12, background: '#f3f4f6', borderRadius: 8, fontWeight: 500 }}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2 }} onClick={submit}>{tr('save', lang)}</button>
          </div>
        </div>
      )}

      {/* Total Customers Card */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>Total Customers</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{customers.length}</span>
      </div>

      {/* Desktop Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th><th>Firm</th><th>Mobile</th><th>Address</th><th>Type</th><th>Pending</th><th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => {
            const hasPending = c.dispatches?.some((d: any) => d.balanceDue > 0 && new Date(d.date) < new Date(Date.now() - 30*24*60*60*1000));
            return (
              <tr key={c.id} onClick={() => openDetail(c)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 600 }}>{c.name}{hasPending && <span className="red-dot"></span>}</td>
                <td>{c.firm || '-'}</td>
                <td>{c.mobile || '-'}</td>
                <td>{c.address || '-'}</td>
                <td><span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-light)' }}>{c.type || 'dealer'}</span></td>
                <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{c.totalDue > 0 ? `₹${c.totalDue?.toLocaleString()}` : '—'}</td>
                <td style={{ color: 'var(--primary)', fontWeight: 500 }}>View →</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="data-cards-mobile">
        {filtered.map((c) => {
          const hasPending = c.dispatches?.some((d: any) => d.balanceDue > 0 && new Date(d.date) < new Date(Date.now() - 30*24*60*60*1000));
          return (
            <div key={c.id} className="data-card" onClick={() => openDetail(c)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}{hasPending && <span className="red-dot"></span>}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                    {c.firm && <span>{c.firm} • </span>}
                    {c.mobile && <span>{c.mobile}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {c.totalDue > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>₹{c.totalDue?.toLocaleString()}</div>}
                  <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-light)' }}>{c.type || 'dealer'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: 40, fontSize: 14 }}>{search ? 'No results found' : 'No customers yet. Add your first customer!'}</p>}
    </div>
  );
}
