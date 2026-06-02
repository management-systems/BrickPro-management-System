import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, Clipboard, TextInput } from 'react-native';
import { useAppStore } from '../store/app';
import { useAuthStore } from '../store/auth';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';

export default function SettingsScreen() {
  const { theme, toggleTheme, lang, toggleLang, factories, activeFactory, setActiveFactory } = useAppStore();
  const { user, logout } = useAuthStore();
  const colors = getColors(theme);
  const [settings, setSettings] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
    if (!factoryForm.name.trim()) return Alert.alert('Error', 'Factory name is required');
    setSubmitting(true);
    try {
      await api.post('/factories', { name: factoryForm.name.trim(), location: factoryForm.location.trim() || undefined });
      Alert.alert('Success', 'Factory request submitted! Awaiting admin approval.');
      setFactoryForm({ name: '', location: '' });
      setShowFactoryForm(false);
      loadFactoryRequests();
    } catch { Alert.alert('Error', 'Failed to submit request'); }
    setSubmitting(false);
  };

  const s = settings || { originalPrice: 2999, discountedPrice: 999, renewalPrice: 1199, yearlyPrice: 9999, paymentDueDay: 25, contactName: 'Mandeep', contactPhone: '9992662555', contactEmail: 'admin@managementsystems.in', upiId: '', upiName: '', bankName: '', accountNumber: '', ifscCode: '' };
  const discount = Math.round((1 - s.discountedPrice / s.originalPrice) * 100);

  const isPremium = subscription?.plan === 'premium' || subscription?.subscriptionStatus === 'ACTIVE';
  const isYearly = subscription?.planType === 'yearly';
  const expiryDate = subscription?.planExpiryDate ? new Date(subscription.planExpiryDate) : null;
  const startDate = subscription?.planStartDate ? new Date(subscription.planStartDate) : null;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  const sharePaymentSS = () => {
    const msg = encodeURIComponent(`Hi, I have paid ₹${s.discountedPrice} for BrickPro subscription.\n\nName: ${user?.name}\nAmount: ₹${s.discountedPrice}\n\nPlease verify and activate my account.`);
    Linking.openURL(`https://wa.me/91${s.contactPhone}?text=${msg}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={styles.profileAvatar}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary }}>{(user?.name || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>{user?.role}</Text>
        </View>
      </View>

      {/* Subscription Status Card */}
      <View style={[styles.subCard, { backgroundColor: colors.surface, borderColor: isPremium ? '#10b981' : colors.border, borderWidth: isPremium ? 2 : 1 }]}>
        {isPremium && (
          <View style={{ position: 'absolute', top: -10, right: 16, backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓ PREMIUM</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 13, color: colors.textLight }}>Current Plan</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 }}>
              {isPremium ? 'Premium' : subscription?.subscriptionStatus === 'TRIAL' ? 'Free Trial' : 'Inactive'}
            </Text>
            {isYearly && <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 }}>📦 Yearly Plan</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {isPremium && subscription?.planPrice > 0 && (
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.success }}>
                ₹{subscription.planPrice}<Text style={{ fontSize: 12, fontWeight: '400', color: colors.textLight }}>/{isYearly ? 'yr' : 'mo'}</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Plan Dates */}
        {(startDate || expiryDate) && (
          <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.bg, borderRadius: 10 }}>
            {startDate && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: colors.textLight }}>Started</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
            )}
            {expiryDate && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: colors.textLight }}>Expires</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: expiryDate < new Date() ? '#ef4444' : '#f59e0b' }}>
                  {expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Pricing Plans */}
        <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.bg, borderRadius: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>📅 Monthly</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>₹{s.discountedPrice}/mo</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>📦 Yearly (one time)</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.success }}>₹{s.yearlyPrice}</Text>
          </View>
        </View>

        {/* Discount Info */}
        <View style={[styles.discountStrip, { backgroundColor: colors.success + '15' }]}>
          <Text style={{ fontSize: 11, color: colors.success, fontWeight: '600' }}>🎉 {discount}% OFF  •  Pay before {s.paymentDueDay}th every month</Text>
        </View>

        {(s.upiId || s.bankName) && (
          <TouchableOpacity style={[styles.payNowBtn, { backgroundColor: colors.primary }]} onPress={() => setShowPayment(!showPayment)}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{showPayment ? '▲ Hide Payment Details' : '💳 Pay Now'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Payment Details (Expandable) */}
      {showPayment && (
        <View style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {s.upiId ? (
            <TouchableOpacity style={[styles.upiBox, { backgroundColor: colors.bg, borderColor: colors.primary + '40' }]} onPress={() => copyToClipboard(s.upiId, 'UPI ID')}>
              <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>UPI ID (tap to copy)</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary, marginTop: 4 }}>{s.upiId}</Text>
              {s.upiName && <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 2 }}>{s.upiName}</Text>}
            </TouchableOpacity>
          ) : null}

          {s.bankName ? (
            <View style={[styles.bankBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Bank Transfer</Text>
              {[
                { label: 'Bank', value: s.bankName },
                { label: 'Account', value: s.accountNumber },
                { label: 'IFSC', value: s.ifscCode },
                { label: 'Name', value: s.upiName },
              ].filter(r => r.value).map(r => (
                <TouchableOpacity key={r.label} style={styles.bankRow} onPress={() => copyToClipboard(r.value, r.label)}>
                  <Text style={{ fontSize: 12, color: colors.textLight }}>{r.label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{r.value}</Text>
                </TouchableOpacity>
              ))}
              <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 6 }}>Tap any field to copy</Text>
            </View>
          ) : null}

          <View style={styles.stepsContainer}>
            {['Pay via UPI or Bank Transfer', 'Take a screenshot of payment', 'Share screenshot below'].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{i + 1}</Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.text, flex: 1 }}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={sharePaymentSS}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>💬 Share Screenshot on WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment History */}
      {subscription?.payments?.length > 0 && (
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowHistory(!showHistory)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>📜 Payment History</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>{showHistory ? '▲' : '▼'} {subscription.payments.length} payments</Text>
          </TouchableOpacity>
          {showHistory && subscription.payments.map((p: any) => (
            <View key={p.id} style={[styles.historyRow, { borderTopColor: colors.border }]}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{p.month} {p.year}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.success }}>₹{p.amount}</Text>
                <View style={{ marginTop: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: p.status === 'collected' ? '#dcfce7' : '#fef9c3' }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: p.status === 'collected' ? '#166534' : '#854d0e' }}>{p.status === 'collected' ? '✓ Paid' : '⏳ Pending'}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Settings */}
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SettingRow icon="🎨" label="Theme" value={theme === 'light' ? 'Light' : 'Dark'} onPress={toggleTheme} colors={colors} />
        <SettingRow icon="🌐" label="Language" value={lang === 'en' ? 'English' : 'हिंदी'} onPress={toggleLang} colors={colors} last />
      </View>

      {/* Factory */}
      {factories.length > 0 && (
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Factory</Text>
          {factories.map((f: any, i: number) => (
            <TouchableOpacity key={f.id} style={[styles.settingRow, i === factories.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]} onPress={() => setActiveFactory(f.id)}>
              <Text style={{ fontSize: 14, color: colors.text }}>{f.name}</Text>
              {activeFactory === f.id && <Text style={{ color: colors.primary, fontSize: 16 }}>●</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Request New Factory */}
      {user?.role === 'OWNER' && (
        <TouchableOpacity
          style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.primary, padding: 14, alignItems: 'center' }]}
          onPress={() => setShowFactoryForm(!showFactoryForm)}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>🏭 + Request New Factory</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>Requires admin approval</Text>
        </TouchableOpacity>
      )}

      {/* Factory Request Form */}
      {showFactoryForm && (
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 }}>New Factory Request</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.bg, color: colors.text, fontSize: 14, marginBottom: 10 }}
            placeholder="Factory Name *"
            placeholderTextColor={colors.textMuted}
            value={factoryForm.name}
            onChangeText={t => setFactoryForm(f => ({ ...f, name: t }))}
          />
          <TextInput
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.bg, color: colors.text, fontSize: 14, marginBottom: 12 }}
            placeholder="Location (optional)"
            placeholderTextColor={colors.textMuted}
            value={factoryForm.location}
            onChangeText={t => setFactoryForm(f => ({ ...f, location: t }))}
          />
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center', opacity: submitting ? 0.6 : 1 }}
            onPress={requestFactory}
            disabled={submitting}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{submitting ? 'Submitting...' : 'Submit Request'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pending Factory Requests */}
      {factoryRequests.length > 0 && (
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Factory Requests</Text>
          {factoryRequests.map((r: any) => (
            <View key={r.id} style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={{ fontSize: 14, color: colors.text }}>{r.name}</Text>
                {r.location && <Text style={{ fontSize: 11, color: colors.textMuted }}>{r.location}</Text>}
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: r.status === 'pending' ? '#fef9c3' : r.status === 'approved' ? '#dcfce7' : '#fee2e2' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: r.status === 'pending' ? '#854d0e' : r.status === 'approved' ? '#166534' : '#991b1b' }}>
                  {r.status === 'pending' ? '⏳ Pending' : r.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Support */}
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Support</Text>
        <SettingRow icon="💬" label="WhatsApp" value={s.contactName} onPress={() => Linking.openURL(`https://wa.me/91${s.contactPhone}?text=${encodeURIComponent('Hi, I need help with BrickPro.')}`)} colors={colors} />
        <SettingRow icon="📞" label="Call" value={`+91 ${s.contactPhone}`} onPress={() => Linking.openURL(`tel:+91${s.contactPhone}`)} colors={colors} />
        <SettingRow icon="✉️" label="Email" value={s.contactEmail} onPress={() => Linking.openURL(`mailto:${s.contactEmail}`)} colors={colors} />
        <SettingRow icon="🌐" label="Website" value="managementsystems.in" onPress={() => Linking.openURL('https://managementsystems.in')} colors={colors} last />
      </View>

      {/* Logout */}
      <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.danger + '40' }]} onPress={handleLogout}>
        <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 15 }}>Logout</Text>
      </TouchableOpacity>

      <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 10, marginTop: 16, marginBottom: 32 }}>BrickPro v1.0.0 • managementsystems.in</Text>
    </ScrollView>
  );
}

function SettingRow({ icon, label, value, onPress, colors, last }: any) {
  return (
    <TouchableOpacity style={[styles.settingRow, last && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
        <Text style={{ fontSize: 14, color: colors.text }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 13, color: colors.textLight }}>{value} ›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: { marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: 16, padding: 24, alignItems: 'center' },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  roleBadge: { marginTop: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  subCard: { marginHorizontal: spacing.md, marginTop: 16, borderRadius: 14, padding: 18, borderWidth: 1 },

  discountStrip: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  payNowBtn: { marginTop: 14, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  paymentCard: { marginHorizontal: spacing.md, marginTop: 8, borderRadius: 14, padding: 16, borderWidth: 1 },
  upiBox: { padding: 14, borderRadius: 10, borderWidth: 1.5, marginBottom: 10, alignItems: 'center' },
  bankBox: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  stepsContainer: { marginBottom: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  stepNum: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  shareBtn: { backgroundColor: '#25D366', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  group: { marginHorizontal: spacing.md, marginTop: 14, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  groupTitle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  logoutBtn: { marginHorizontal: spacing.md, marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
});
