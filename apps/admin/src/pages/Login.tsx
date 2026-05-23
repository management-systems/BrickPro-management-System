import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import axios from 'axios';
import toast from 'react-hot-toast';

const authApi = axios.create({ baseURL: 'http://localhost:4000/api/auth' });

export default function Login() {
  const [tab, setTab] = useState<'admin' | 'user'>('admin');
  const [adminMethod, setAdminMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Admin - Password Login
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

  // Admin - OTP Login
  const sendAdminOtp = async () => {
    if (!email) return toast.error('Enter email');
    setLoading(true);
    try {
      await api.post('/send-otp', { email });
      setAdminOtpSent(true);
      toast.success('OTP sent to ' + email);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleAdminOtpLogin = async () => {
    if (!adminOtp || adminOtp.length < 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await api.post('/login', { email, otp: adminOtp });
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

  // User - OTP Login
  const sendOtp = async () => {
    if (!mobile || mobile.length < 10) return toast.error('Enter valid 10-digit mobile');
    setLoading(true);
    try {
      await authApi.post('/send-otp', { mobile });
      setOtpSent(true);
      toast.success('OTP sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleOtpLogin = async () => {
    if (!otp || otp.length < 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await authApi.post('/verify-otp', { mobile, otp });
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify({ id: data.user.id, name: data.user.name, role: data.user.role }));
      localStorage.setItem('login_type', 'user');
      toast.success('Welcome, ' + data.user.name);
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const tabStyle = (active: boolean) => ({
    flex: 1, padding: '10px', fontSize: 14, fontWeight: 600 as const, border: 'none', borderRadius: 8, cursor: 'pointer' as const,
    background: active ? 'var(--primary, #c0392b)' : '#f3f4f6', color: active ? 'white' : '#6b7280',
  });

  const methodStyle = (active: boolean) => ({
    flex: 1, padding: '7px', fontSize: 12, fontWeight: 500 as const, border: 'none', borderRadius: 6, cursor: 'pointer' as const,
    background: active ? 'var(--primary, #c0392b)' : 'transparent', color: active ? 'white' : '#6b7280',
  });

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>🧱 BrickPro</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, marginBottom: 16 }}>Management System</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setTab('admin')} style={tabStyle(tab === 'admin')}>Super Admin</button>
          <button onClick={() => setTab('user')} style={tabStyle(tab === 'user')}>User (OTP)</button>
        </div>

        {tab === 'admin' && (
          <>
            {/* Method Toggle */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
              <button onClick={() => { setAdminMethod('password'); setAdminOtpSent(false); }} style={methodStyle(adminMethod === 'password')}>🔑 Password</button>
              <button onClick={() => setAdminMethod('otp')} style={methodStyle(adminMethod === 'otp')}>📧 Email OTP</button>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@managementsystems.in" />
            </div>

            {adminMethod === 'password' && (
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

            {adminMethod === 'otp' && (
              <>
                {!adminOtpSent ? (
                  <button onClick={sendAdminOtp} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: 8 }}>
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Enter OTP</label>
                      <input type="tel" className="form-input" value={adminOtp} onChange={e => setAdminOtp(e.target.value)} maxLength={6} placeholder="6-digit OTP" style={{ textAlign: 'center', fontSize: 18, letterSpacing: 6 }} onKeyDown={e => e.key === 'Enter' && handleAdminOtpLogin()} />
                    </div>
                    <button onClick={handleAdminOtpLogin} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: 8 }}>
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button onClick={() => { setAdminOtpSent(false); setAdminOtp(''); }} style={{ marginTop: 8, background: 'none', color: 'var(--primary, #c0392b)', fontSize: 12, border: 'none', cursor: 'pointer' }}>
                      ← Back
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}

        {tab === 'user' && (
          <>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input type="tel" className="form-input" value={mobile} onChange={e => setMobile(e.target.value)} maxLength={10} placeholder="10-digit mobile" />
            </div>
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
                  ← Change number
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
