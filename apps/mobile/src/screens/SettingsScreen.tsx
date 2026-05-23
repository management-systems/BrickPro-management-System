import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, Clipboard } from 'react-native';
import { useAppStore } from '../store/app';
import { useAuthStore } from '../store/auth';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';

export default function SettingsScreen() {
  const { theme, toggleTheme, lang, toggleLang, factories, activeFactory, setActiveFactory } = useAppStore();
  const { user, logout } = useAuthStore();
  const colors = getColors(theme);
  const [settings, setSettings] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    api.get('/super-admin/public-settings').then(r => setSettings(r.data)).catch(() => {});
  }, []);

  const s = settings || { originalPrice: 2999, discountedPrice: 999, paymentDueDay: 25, contactName: 'Mandeep', contactPhone: '9992662555', contactEmail: 'admin@managementsystems.in', upiId: '', upiName: '', bankName: '', accountNumber: '', ifscCode: '' };
  const discount = Math.round((1 - s.discountedPrice / s.originalPrice) * 100);

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

      {/* Subscription Card */}
      <View style={[styles.subCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 13, color: colors.textLight }}>Current Plan</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 }}>Premium</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, textDecorationLine: 'line-through' }}>₹{s.originalPrice}</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.success }}>₹{s.discountedPrice}<Text style={{ fontSize: 12, fontWeight: '400', color: colors.textLight }}>/mo</Text></Text>
          </View>
        </View>
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

      {/* Quick Settings */}
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SettingRow icon="🎨" label="Theme" value={theme === 'light' ? 'Light' : 'Dark'} onPress={toggleTheme} colors={colors} />
        <SettingRow icon="🌐" label="Language" value={lang === 'en' ? 'English' : 'हिंदी'} onPress={toggleLang} colors={colors} last />
      </View>

      {/* Factory */}
      {factories.length > 1 && (
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Factory</Text>
          {factories.map((f, i) => (
            <TouchableOpacity key={f.id} style={[styles.settingRow, i === factories.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]} onPress={() => setActiveFactory(f.id)}>
              <Text style={{ fontSize: 14, color: colors.text }}>{f.name}</Text>
              {activeFactory === f.id && <Text style={{ color: colors.primary, fontSize: 16 }}>●</Text>}
            </TouchableOpacity>
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
  subCard: { marginHorizontal: spacing.md, marginTop: 12, borderRadius: 14, padding: 18, borderWidth: 1 },
  discountStrip: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
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
  logoutBtn: { marginHorizontal: spacing.md, marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
});
