import { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [form, setForm] = useState({
    originalPrice: '2999',
    discountedPrice: '999',
    paymentDueDay: '25',
    contactName: 'Mandeep',
    contactPhone: '9992662555',
    contactEmail: 'admin@managementsystems.in',
    upiId: '',
    upiName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });

  useEffect(() => {
    api.get('/settings').then(r => {
      setForm({
        originalPrice: r.data.originalPrice?.toString() || '2999',
        discountedPrice: r.data.discountedPrice?.toString() || '999',
        paymentDueDay: r.data.paymentDueDay?.toString() || '25',
        contactName: r.data.contactName || 'Mandeep',
        contactPhone: r.data.contactPhone || '9992662555',
        contactEmail: r.data.contactEmail || 'admin@managementsystems.in',
        upiId: r.data.upiId || '',
        upiName: r.data.upiName || '',
        bankName: r.data.bankName || '',
        accountNumber: r.data.accountNumber || '',
        ifscCode: r.data.ifscCode || '',
      });
    }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await api.patch('/settings', {
        originalPrice: +form.originalPrice,
        discountedPrice: +form.discountedPrice,
        paymentDueDay: +form.paymentDueDay,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        upiId: form.upiId,
        upiName: form.upiName,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        ifscCode: form.ifscCode,
      });
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ App Settings</h1>
        <button className="btn btn-primary" onClick={save}>💾 Save Changes</button>
      </div>

      <div className="detail-grid">
        {/* Pricing */}
        <div className="detail-card">
          <h4>💰 Pricing</h4>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Shown to users in Settings page</p>
          <div className="form-group">
            <label className="form-label">Original Price (₹/month)</label>
            <input className="form-input" type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Discounted Price (₹/month)</label>
            <input className="form-input" type="number" value={form.discountedPrice} onChange={e => setForm({ ...form, discountedPrice: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Due Day</label>
            <input className="form-input" type="number" value={form.paymentDueDay} onChange={e => setForm({ ...form, paymentDueDay: e.target.value })} min="1" max="28" />
          </div>
          <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
            <span style={{ textDecoration: 'line-through', color: 'var(--muted)' }}>₹{(+form.originalPrice).toLocaleString()}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)', marginLeft: 10 }}>₹{(+form.discountedPrice).toLocaleString()}</span>
            <span style={{ color: 'var(--muted)' }}>/month</span>
            <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>
              {Math.round((1 - +form.discountedPrice / +form.originalPrice) * 100)}% OFF — Pay before {form.paymentDueDay}th
            </div>
          </div>
        </div>

        {/* UPI & Payment */}
        <div className="detail-card">
          <h4>💳 Payment / UPI Details</h4>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Users will see this to make payment</p>
          <div className="form-group">
            <label className="form-label">UPI ID</label>
            <input className="form-input" value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} placeholder="e.g. 9992662555@paytm" />
          </div>
          <div className="form-group">
            <label className="form-label">UPI Name (Payee Name)</label>
            <input className="form-input" value={form.upiName} onChange={e => setForm({ ...form, upiName: e.target.value })} placeholder="e.g. Mandeep Singh" />
          </div>
          <div className="form-group">
            <label className="form-label">Bank Name</label>
            <input className="form-input" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="e.g. State Bank of India" />
          </div>
          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input className="form-input" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} placeholder="e.g. 1234567890" />
          </div>
          <div className="form-group">
            <label className="form-label">IFSC Code</label>
            <input className="form-input" value={form.ifscCode} onChange={e => setForm({ ...form, ifscCode: e.target.value })} placeholder="e.g. SBIN0001234" />
          </div>
        </div>

        {/* Contact */}
        <div className="detail-card">
          <h4>📞 Contact Details</h4>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Shown in user's "Contact Us" section</p>
          <div className="form-group">
            <label className="form-label">Contact Name</label>
            <input className="form-input" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}
