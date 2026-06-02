import { useEffect, useState } from 'react';
import { useAppStore } from '../store/app';
import { useAuthStore } from '../store/auth';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { lang, theme, toggleLang, toggleTheme } = useAppStore();
  const user = useAuthStore((s) => s.user);
  const [settings, setSettings] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [showFactoryForm, setShowFactoryForm] = useState(false);
  const [factoryForm, setFactoryForm] = useState({ name: '', location: '' });
  const [factoryRequests, setFactoryRequests] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/super-admin/public-settings').then(r => setSettings(r.data)).catch(() => {});
    api.get('/auth/subscription').then(r => setSubscription(r.data)).catch(() => {});
    loadFactoryRequests();
  }, []);

  const loadFactoryRequests = () => {
    api.get('/factories/requests').then(r => setFactoryRequests(r.data)).catch(() => {});
  };

  const requestFactory = async () => {
    if (!factoryForm.name.trim()) return toast.error('Factory name is required');
    setSubmitting(true);
    try {
      await api.post('/factories', { name: factoryForm.name.trim(), location: factoryForm.location.trim() || undefined });
      toast.success('Factory request submitted! Awaiting admin approval.');
      setFactoryForm({ name: '', location: '' });
      setShowFactoryForm(false);
      loadFactoryRequests();
    } catch { toast.error('Failed to submit request'); }
    setSubmitting(false);
  };

  const s = settings || { originalPrice: 2999, discountedPrice: 999, renewalPrice: 1199, yearlyPrice: 9999, paymentDueDay: 25, contactName: 'Mandeep', contactPhone: '9992662555', contactEmail: 'admin@managementsystems.in', upiId: '', upiName: '', bankName: '', accountNumber: '', ifscCode: '' };
  const discount = Math.round((1 - s.discountedPrice / s.originalPrice) * 100);
  const whatsappPay = encodeURIComponent(`Hi, I have paid ₹${s.discountedPrice} for BrickPro subscription.\n\nName: ${user?.name}\nAmount: ₹${s.discountedPrice}\n\nPlease verify and activate my account.`);

  const isPremium = subscription?.plan === 'premium' || subscription?.subscriptionStatus === 'ACTIVE';
  const isYearly = subscription?.planType === 'yearly';
  const expiryDate = subscription?.planExpiryDate ? new Date(subscription.planExpiryDate) : null;
  const startDate = subscription?.planStartDate ? new Date(subscription.planStartDate) : null;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="page">
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>⚙️ {lang === 'en' ? 'Settings' : 'सेटिंग्स'}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>

        {/* Left Column */}
        <div>
          {/* Account */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700 }}>
                {(user?.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{user?.role}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={toggleTheme} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
              <button onClick={toggleLang} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>
                {lang === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
              </button>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="card" style={{ marginBottom: 16, border: isPremium ? '2px solid #10b981' : undefined, position: 'relative' }}>
            {isPremium && (
              <div style={{ position: 'absolute', top: -10, right: 16, background: '#10b981', color: '#fff', padding: '3px 12px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}>✓ PREMIUM</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Subscription</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
                  {isPremium ? 'Premium Plan' : subscription?.subscriptionStatus === 'TRIAL' ? 'Free Trial' : 'Inactive'}
                </div>
                {isYearly && <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>📦 Yearly Plan</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{s.originalPrice.toLocaleString()}</span>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--success)' }}>₹{s.discountedPrice.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-light)' }}>/mo</span></div>
              </div>
            </div>

            {/* Plan Dates */}
            {(startDate || expiryDate) && (
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 12 }}>
                {startDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Started</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                {expiryDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Expires</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: expiryDate < new Date() ? '#ef4444' : '#f59e0b' }}>
                      {expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Plans */}
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>📅 Monthly</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>₹{s.discountedPrice}/mo</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>📦 Yearly (one time)</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>₹{s.yearlyPrice}</span>
              </div>
            </div>

            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>🎉 {discount}% OFF  •  Pay before {s.paymentDueDay}th every month</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.8 }}>
              ✓ Unlimited Production & Dispatch<br/>
              ✓ Invoices, Reports & Charts<br/>
              ✓ Unlimited Users & Factories<br/>
              ✓ WhatsApp & Email Support
            </div>
          </div>

          {/* Payment History */}
          {subscription?.payments?.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>📜 Payment History</div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-light)', fontWeight: 500 }}>Month</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--text-light)', fontWeight: 500 }}>Amount</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--text-light)', fontWeight: 500 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscription.payments.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--text)' }}>{p.month} {p.year}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>₹{p.amount}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: p.status === 'collected' ? '#dcfce7' : '#fef9c3', color: p.status === 'collected' ? '#166534' : '#854d0e' }}>
                          {p.status === 'collected' ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Contact */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>📞 Support</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={`https://wa.me/91${s.contactPhone}?text=${encodeURIComponent('Hi, I need help with BrickPro.')}`} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', background: '#25D366', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13, minWidth: 120 }}>
                💬 WhatsApp
              </a>
              <a href={`tel:+91${s.contactPhone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', background: 'var(--primary)', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13, minWidth: 120 }}>
                📞 Call
              </a>
              <a href={`mailto:${s.contactEmail}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', background: 'var(--info)', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13, minWidth: 120 }}>
                ✉️ Email
              </a>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              {s.contactName} • +91 {s.contactPhone} • {s.contactEmail}
            </div>
          </div>
        </div>

        {/* Right Column - Payment */}
        <div>
          {(s.upiId || s.bankName) && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text)' }}>💳 Make Payment — ₹{s.discountedPrice.toLocaleString()}/month</div>

              {s.upiId && (
                <div onClick={() => copy(s.upiId, 'UPI ID')} style={{ padding: 16, borderRadius: 10, border: '2px solid var(--primary)', background: 'var(--bg)', textAlign: 'center', marginBottom: 14, cursor: 'pointer' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>UPI ID (click to copy)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)', marginTop: 6 }}>{s.upiId}</div>
                  {s.upiName && <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Payee: {s.upiName}</div>}
                </div>
              )}

              {s.bankName && (
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Bank Transfer</div>
                  <table style={{ width: '100%', fontSize: 13 }}>
                    <tbody>
                      {[
                        { label: 'Bank', value: s.bankName },
                        { label: 'A/C No', value: s.accountNumber },
                        { label: 'IFSC', value: s.ifscCode },
                        { label: 'Name', value: s.upiName },
                      ].filter(r => r.value).map(r => (
                        <tr key={r.label} onClick={() => copy(r.value, r.label)} style={{ cursor: 'pointer' }}>
                          <td style={{ padding: '6px 0', color: 'var(--text-light)', width: 80 }}>{r.label}</td>
                          <td style={{ padding: '6px 0', fontWeight: 600, color: 'var(--text)' }}>{r.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>Click any row to copy</div>
                </div>
              )}

              {/* Steps */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['Pay via UPI/Bank', 'Screenshot payment', 'Share on WhatsApp'].map((step, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)', lineHeight: 1.3 }}>{step}</div>
                  </div>
                ))}
              </div>

              <a href={`https://wa.me/91${s.contactPhone}?text=${whatsappPay}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: '#25D366', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                💬 Share Payment Screenshot on WhatsApp
              </a>
            </div>
          )}

          {/* About */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text)' }}>ℹ️ About</div>
            <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>
              BrickPro is a complete brick factory management system — production, sales, customers, raw materials, labour, expenses, invoices, and reports.
            </p>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Version 1.0.0</span>
              <a href="https://managementsystems.in" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                🌐 managementsystems.in
              </a>
            </div>
          </div>

          {/* Request New Factory */}
          {user?.role === 'OWNER' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>🏭 Factory Management</div>
                <button onClick={() => setShowFactoryForm(!showFactoryForm)} style={{ padding: '6px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  + Request New Factory
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Adding a new factory requires admin approval</div>

              {showFactoryForm && (
                <div style={{ padding: 14, background: 'var(--bg)', borderRadius: 8, marginBottom: 12, border: '1px solid var(--border)' }}>
                  <input
                    type="text" placeholder="Factory Name *" value={factoryForm.name}
                    onChange={e => setFactoryForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, marginBottom: 8 }}
                  />
                  <input
                    type="text" placeholder="Location (optional)" value={factoryForm.location}
                    onChange={e => setFactoryForm(f => ({ ...f, location: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, marginBottom: 10 }}
                  />
                  <button onClick={requestFactory} disabled={submitting} style={{ width: '100%', padding: '10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              )}

              {factoryRequests.length > 0 && (
                <div>
                  {factoryRequests.map((r: any) => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                        {r.location && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.location}</div>}
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: r.status === 'pending' ? '#fef9c3' : r.status === 'approved' ? '#dcfce7' : '#fee2e2', color: r.status === 'pending' ? '#854d0e' : r.status === 'approved' ? '#166534' : '#991b1b' }}>
                        {r.status === 'pending' ? '⏳ Pending' : r.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
