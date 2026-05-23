export default function Blocked() {
  const message = localStorage.getItem('account_blocked') || 'Your account has been disabled. Contact admin.';
  const isExpired = message.toLowerCase().includes('trial') || message.toLowerCase().includes('expired');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>{isExpired ? '⏰' : '🚫'}</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>{isExpired ? 'Free Trial Ended' : 'Account Suspended'}</h1>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>{message}</p>

        {isExpired && (
          <div style={{ background: '#fff', border: '2px solid #2563eb', borderRadius: 12, padding: 24, marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>Continue using BrickPro</p>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: '#9ca3af', textDecoration: 'line-through' }}>₹2,999</span>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#2563eb' }}>₹999</span>
              <span style={{ fontSize: 14, color: '#6b7280' }}>/month</span>
            </div>
            <p style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 6 }}>🎉 67% OFF — Limited Time Offer!</p>
            <div style={{ textAlign: 'left', marginTop: 14, fontSize: 13, color: '#555', lineHeight: 1.8 }}>
              ✓ Unlimited Production & Dispatch<br/>
              ✓ Invoices, Reports & Charts<br/>
              ✓ Unlimited Users & Factories<br/>
              ✓ WhatsApp & Email Support
            </div>
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#333' }}>{isExpired ? '🛒 Subscribe Now' : '📞 Contact Admin'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="https://wa.me/919992662555?text=Hi%2C%20I%20want%20to%20subscribe%20to%20BrickPro%20at%20%E2%82%B9999%2Fmonth.%20Please%20activate%20my%20account." target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', background: '#25D366', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              💬 WhatsApp — Subscribe
            </a>
            <a href="mailto:admin@managementsystems.in?subject=BrickPro Subscription - ₹999/month" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', background: '#2563eb', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              ✉️ admin@managementsystems.in
            </a>
            <a href="tel:+919992662555" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', background: '#3b82f6', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              📞 Call: +91 9992662555
            </a>
          </div>
        </div>

        <a href="https://managementsystems.in" target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 12, color: '#2563eb', marginBottom: 16, textDecoration: 'none' }}>
          🌐 managementsystems.in
        </a>

        <button onClick={handleLogout} style={{ padding: '12px 28px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </div>
  );
}
