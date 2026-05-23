import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useAppStore } from '../store/app';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginTab, setLoginTab] = useState<'password' | 'otp'>('password');

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [signupStep, setSignupStep] = useState(1);
  const [sName, setSName] = useState('');
  const [sMobile, setSMobile] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPassword, setSPassword] = useState('');
  const [sConfirmPassword, setSConfirmPassword] = useState('');
  const [sFactoryName, setSFactoryName] = useState('');
  const [sLocation, setSLocation] = useState('');
  const [sOtp, setSOtp] = useState('');

  const { login, loginWithPassword, signup } = useAuthStore();
  const lang = useAppStore((s) => s.lang);
  const toggleLang = useAppStore((s) => s.toggleLang);
  const navigate = useNavigate();

  const handlePasswordLogin = async () => {
    if (!loginId || !password) return toast.error('Enter email/mobile and password');
    try {
      const isEmail = loginId.includes('@');
      await loginWithPassword(isEmail ? loginId : '', !isEmail ? loginId : '', password);
      navigate('/');
    } catch (e: any) { toast.error(e.response?.data?.error || 'Invalid credentials'); }
  };

  const sendOtp = async () => {
    if (!mobile || mobile.length < 10) return toast.error('Enter valid mobile');
    try {
      await api.post('/auth/send-otp', { mobile });
      setOtpSent(true);
      toast.success('OTP sent!');
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleOtpLogin = async () => {
    try { await login(mobile, otp); navigate('/'); }
    catch { toast.error('Invalid OTP'); }
  };

  const goToStep2 = () => {
    if (!sName.trim() || !sMobile || sMobile.length < 10 || !sEmail.trim() || !sFactoryName.trim()) return toast.error('Fill all required fields');
    setSignupStep(2);
  };

  const goToStep3 = async () => {
    if (!sPassword || sPassword.length < 6) return toast.error('Min 6 characters');
    if (sPassword !== sConfirmPassword) return toast.error('Passwords don\'t match');
    try {
      await api.post('/auth/send-email-otp', { email: sEmail });
      setSignupStep(3);
      toast.success('OTP sent to ' + sEmail);
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleSignup = async () => {
    if (!sOtp || sOtp.length < 6) return toast.error('Enter 6-digit OTP');
    try {
      await api.post('/auth/verify-email-otp', { email: sEmail, otp: sOtp });
      await signup(sName, sMobile, sFactoryName, sEmail, sPassword, sLocation);
      toast.success('Welcome to BrickPro! 🧱');
      navigate('/');
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const tabStyle = (active: boolean) => ({
    flex: 1, padding: '8px', fontSize: 13, fontWeight: 500 as const, border: 'none', borderRadius: 6, cursor: 'pointer' as const,
    background: active ? 'var(--primary)' : '#f3f4f6', color: active ? 'white' : '#6b7280',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20, maxWidth: 380, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 4 }}>🧱</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>BrickPro</h1>
        <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
          {lang === 'en' ? 'Brick Factory Management' : 'ईंट कारखाना प्रबंधन'}
        </p>
        <button onClick={toggleLang} style={{ marginTop: 6, background: '#f3f4f6', padding: '4px 10px', fontSize: 11, borderRadius: 4 }}>
          {lang === 'en' ? 'हिंदी' : 'English'}
        </button>
      </div>

      {mode === 'login' && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <button onClick={() => setLoginTab('password')} style={tabStyle(loginTab === 'password')}>Password</button>
            <button onClick={() => setLoginTab('otp')} style={tabStyle(loginTab === 'otp')}>OTP</button>
          </div>

          {loginTab === 'password' && (
            <>
              <div className="form-group">
                <label>Email or Mobile</label>
                <input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="Enter email or mobile" />
              </div>
              <div className="form-group">
                <label>Password / PIN</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password or PIN" onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()} />
              </div>
              <button className="btn-primary" onClick={handlePasswordLogin}>Login</button>
            </>
          )}

          {loginTab === 'otp' && (
            <>
              <div className="form-group">
                <label>Mobile</label>
                <input type="tel" inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={10} placeholder="10-digit mobile" />
              </div>
              {!otpSent ? (
                <button className="btn-primary" onClick={sendOtp}>Send OTP</button>
              ) : (
                <>
                  <div className="form-group">
                    <label>OTP</label>
                    <input type="tel" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="6-digit OTP" onKeyDown={(e) => e.key === 'Enter' && handleOtpLogin()} />
                  </div>
                  <button className="btn-primary" onClick={handleOtpLogin}>Verify</button>
                </>
              )}
            </>
          )}

          <button onClick={() => { setMode('signup'); setSignupStep(1); }} style={{ marginTop: 16, background: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}>
            Don't have an account? Sign Up
          </button>
        </>
      )}

      {mode === 'signup' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, background: signupStep >= s ? 'var(--primary)' : '#e5e7eb', color: signupStep >= s ? 'white' : '#9ca3af' }}>{s}</div>
            ))}
          </div>

          {signupStep === 1 && (
            <>
              <div className="form-group"><label>Full Name *</label><input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Your name" /></div>
              <div className="form-group"><label>Phone *</label><input type="tel" inputMode="numeric" value={sMobile} onChange={(e) => setSMobile(e.target.value)} maxLength={10} placeholder="10-digit mobile" /></div>
              <div className="form-group"><label>Email *</label><input type="email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} placeholder="your@email.com" /></div>
              <div className="form-group"><label>Factory Name *</label><input value={sFactoryName} onChange={(e) => setSFactoryName(e.target.value)} placeholder="e.g. Sharma Brick Kiln" /></div>
              <div className="form-group"><label>Location</label><input value={sLocation} onChange={(e) => setSLocation(e.target.value)} placeholder="City, State" /></div>
              <button className="btn-primary" onClick={goToStep2}>Next →</button>
            </>
          )}

          {signupStep === 2 && (
            <>
              <div className="form-group"><label>Password *</label><input type="password" value={sPassword} onChange={(e) => setSPassword(e.target.value)} placeholder="Min 6 characters" /></div>
              <div className="form-group"><label>Confirm Password *</label><input type="password" value={sConfirmPassword} onChange={(e) => setSConfirmPassword(e.target.value)} placeholder="Re-type password" onKeyDown={(e) => e.key === 'Enter' && goToStep3()} /></div>
              {sPassword && sConfirmPassword && (
                <p style={{ fontSize: 11, marginBottom: 10, color: sPassword === sConfirmPassword ? 'var(--success)' : 'var(--danger)' }}>
                  {sPassword === sConfirmPassword ? '✓ Match' : '✗ Don\'t match'}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSignupStep(1)} style={{ flex: 1, padding: 10, background: '#f3f4f6', borderRadius: 8 }}>← Back</button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={goToStep3}>Send OTP →</button>
              </div>
            </>
          )}

          {signupStep === 3 && (
            <>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-light)', marginBottom: 12 }}>OTP sent to <b>{sEmail}</b></p>
              <div className="form-group">
                <label>6-digit OTP</label>
                <input type="tel" inputMode="numeric" value={sOtp} onChange={(e) => setSOtp(e.target.value)} maxLength={6} placeholder="••••••" style={{ textAlign: 'center', fontSize: 18, letterSpacing: 6 }} onKeyDown={(e) => e.key === 'Enter' && handleSignup()} />
              </div>
              <button className="btn-primary" onClick={handleSignup}>Verify & Create Account</button>
              <button onClick={goToStep3} style={{ marginTop: 8, background: 'none', color: 'var(--primary)', fontSize: 12 }}>Resend OTP</button>
              <button onClick={() => setSignupStep(2)} style={{ marginTop: 4, background: 'none', color: 'var(--text-light)', fontSize: 12 }}>← Back</button>
            </>
          )}

          {signupStep === 1 && (
            <button onClick={() => setMode('login')} style={{ marginTop: 16, background: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}>
              Already have an account? Login
            </button>
          )}
        </>
      )}
      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'var(--text-light)' }}>
        <span>Powered by </span>
        <a href="https://managementsystems.in" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>managementsystems.in</a>
      </div>
    </div>
  );
}
