import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../store/auth';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';

export default function LoginScreen() {
  const [tab, setTab] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, loginWithOtp, sendOtp } = useAuthStore();
  const { lang, theme, toggleLang } = useAppStore();
  const colors = getColors(theme);

  const handlePasswordLogin = async () => {
    if (!identifier || !password) { Alert.alert('Error', 'Enter email/mobile and password'); return; }
    setLoading(true);
    try { await login(identifier, password); }
    catch (e: any) { Alert.alert('Login Failed', e.response?.data?.error || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    if (!mobile || mobile.length < 10) { Alert.alert('Error', 'Enter valid 10-digit mobile'); return; }
    setLoading(true);
    try { await sendOtp(mobile); setOtpSent(true); Alert.alert('OTP Sent', 'Check your SMS'); }
    catch (e: any) { Alert.alert('Failed', e.response?.data?.error || 'Could not send OTP'); }
    finally { setLoading(false); }
  };

  const handleOtpLogin = async () => {
    if (!otp || otp.length < 6) { Alert.alert('Error', 'Enter 6-digit OTP'); return; }
    setLoading(true);
    try { await loginWithOtp(mobile, otp); }
    catch (e: any) { Alert.alert('Failed', e.response?.data?.error || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.logo}>🧱</Text>
        <Text style={[styles.title, { color: colors.primary }]}>BrickPro</Text>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>{lang === 'en' ? 'Manage your brick factory' : 'अपने कारखाने को मैनेज करें'}</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, tab === 'password' && { backgroundColor: colors.primary }]} onPress={() => setTab('password')}>
            <Text style={[styles.tabText, tab === 'password' && { color: '#fff' }]}>{lang === 'en' ? 'Password' : 'पासवर्ड'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'otp' && { backgroundColor: colors.primary }]} onPress={() => setTab('otp')}>
            <Text style={[styles.tabText, tab === 'otp' && { color: '#fff' }]}>OTP</Text>
          </TouchableOpacity>
        </View>

        {tab === 'password' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textLight }]}>{lang === 'en' ? 'Email or Mobile' : 'ईमेल या मोबाइल'}</Text>
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="admin@factory.com or 9876543210" placeholderTextColor={colors.textMuted} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textLight }]}>{lang === 'en' ? 'Password' : 'पासवर्ड'}</Text>
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="••••••••" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]} onPress={handlePasswordLogin} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Logging in...' : lang === 'en' ? 'Sign In' : 'लॉगिन करें'}</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'otp' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textLight }]}>{lang === 'en' ? 'Mobile Number' : 'मोबाइल नंबर'}</Text>
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="9876543210" placeholderTextColor={colors.textMuted} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} />
            </View>
            {!otpSent ? (
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]} onPress={handleSendOtp} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Sending...' : lang === 'en' ? 'Send OTP' : 'OTP भेजें'}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textLight }]}>{lang === 'en' ? 'Enter OTP' : 'OTP दर्ज करें'}</Text>
                  <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text, textAlign: 'center', fontSize: 20, letterSpacing: 8 }]} placeholder="••••••" placeholderTextColor={colors.textMuted} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
                </View>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]} onPress={handleOtpLogin} disabled={loading}>
                  <Text style={styles.btnText}>{loading ? 'Verifying...' : lang === 'en' ? 'Verify & Login' : 'सत्यापित करें'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(''); }} style={{ marginTop: 12, alignSelf: 'center' }}>
                  <Text style={{ color: colors.primary, fontSize: 13 }}>← {lang === 'en' ? 'Change number' : 'नंबर बदलें'}</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <TouchableOpacity onPress={toggleLang} style={styles.langBtn}>
          <Text style={{ color: colors.textLight, fontSize: 14 }}>{lang === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: { borderRadius: 20, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  logo: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  btn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  langBtn: { alignSelf: 'center', marginTop: 20, padding: 8 },
});
