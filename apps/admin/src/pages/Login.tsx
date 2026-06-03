import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [method, setMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordLogin = async () => {
    if (!email || !password) return toast.error('Enter email and password');
    setLoading(true);
    try {
      const { data } = await api.post('/login', { email, password });
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      localStorage.setItem('login_type', 'admin');
      toast.success('Welcome, ' + data.admin.name);
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const sendOtp = async () => {
    if (!email) return toast.error('Enter email');
    setLoading(true);
    try {
      await api.post('/send-otp', { email });
      setOtpSent(true);
      toast.success('OTP sent to ' + email);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const handleOtpLogin = async () => {
    if (!otp || otp.length < 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await api.post('/login', { email, otp });
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      localStorage.setItem('login_type', 'admin');
      toast.success('Welcome, ' + data.admin.name);
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const methodStyle = (active: boolean) => ({
    flex: 1, padding: '8px', fontSize: 12, fontWeight: 500 as const, border: 'none', borderRadius: 6, cursor: 'pointer' as const,
    background: active ? 'var(--primary, #c0392b)' : 'transparent', color: active ? 'white' : '#6b7280',
  });

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>🧱 BrickPro</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, marginBottom: 6 }}>Super Admin Panel</p>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 11, marginBottom: 20 }}>Only authorized administrators can access</p>

        {/* Method Toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
          <button onClick={() => { setMethod('password'); setOtpSent(false); }} style={methodStyle(method === 'password')}>🔑 Password</button>
          <button onClick={() => setMethod('otp')} style={methodStyle(method === 'otp')}>📧 Email OTP</button>
        </div>

        <div className="form-group">
          <label className="form-label">Admin Email</label>
          <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@managementsystems.in" />
        </div>

        {method === 'password' && (
          <>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()} />
            </div>
            <button onClick={handlePasswordLogin} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: 8 }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </>
        )}

        {method === 'otp' && (
          <>
            {!otpSent ? (
              <button onClick={sendOtp} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: 8 }}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Enter OTP</label>
                  <input type="tel" className="form-input" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="6-digit OTP" style={{ textAlign: 'center', fontSize: 18, letterSpacing: 6 }} onKeyDown={e => e.key === 'Enter' && handleOtpLogin()} />
                </div>
                <button onClick={handleOtpLogin} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: 8 }}>
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button onClick={() => { setOtpSent(false); setOtp(''); }} style={{ marginTop: 8, background: 'none', color: 'var(--primary, #c0392b)', fontSize: 12, border: 'none', cursor: 'pointer' }}>
                  ← Back
                </button>
              </>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#9ca3af' }}>
          <a href="https://managementsystems.in" target="_blank" rel="noreferrer" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>managementsystems.in</a>
        </div>
      </div>
    </div>
  );
}
