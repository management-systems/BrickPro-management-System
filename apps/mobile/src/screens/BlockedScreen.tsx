import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '../store/auth';

export default function BlockedScreen() {
  const { blockedMessage, logout } = useAuthStore();
  const isExpired = blockedMessage.toLowerCase().includes('trial') || blockedMessage.toLowerCase().includes('expired');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.icon}>{isExpired ? '⏰' : '🚫'}</Text>
      <Text style={styles.title}>{isExpired ? 'Free Trial Ended' : 'Account Suspended'}</Text>
      <Text style={styles.message}>{blockedMessage}</Text>

      {isExpired && (
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Continue using BrickPro</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 8 }}>
            <Text style={styles.priceOld}>₹2,999</Text>
            <Text style={styles.price}>₹999</Text>
            <Text style={styles.priceMonth}>/month</Text>
          </View>
          <Text style={styles.discount}>🎉 67% OFF — Limited Time Offer!</Text>
          <Text style={styles.features}>✓ Unlimited Production & Dispatch{'\n'}✓ Invoices, Reports & Charts{'\n'}✓ Unlimited Users & Factories{'\n'}✓ WhatsApp & Email Support</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{isExpired ? '🛒 Subscribe Now' : '📞 Contact Admin'}</Text>

        <TouchableOpacity style={[styles.btn, { backgroundColor: '#25D366' }]} onPress={() => Linking.openURL('https://wa.me/919992662555?text=Hi%2C%20I%20want%20to%20subscribe%20to%20BrickPro%20at%20%E2%82%B9999%2Fmonth.%20Please%20activate%20my%20account.')}>
          <Text style={styles.btnText}>💬  WhatsApp — Subscribe</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: '#2563eb' }]} onPress={() => Linking.openURL('mailto:admin@managementsystems.in?subject=BrickPro Subscription - ₹999/month')}>
          <Text style={styles.btnText}>✉️  admin@managementsystems.in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={() => Linking.openURL('tel:+919992662555')}>
          <Text style={styles.btnText}>📞  Call: +91 9992662555</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => Linking.openURL('https://managementsystems.in')}>
        <Text style={styles.link}>🌐 managementsystems.in</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' },
  icon: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#ef4444', marginBottom: 8 },
  message: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 20 },
  priceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '100%', marginBottom: 20, borderWidth: 2, borderColor: '#2563eb', alignItems: 'center' },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  priceOld: { fontSize: 16, color: '#9ca3af', textDecorationLine: 'line-through', marginRight: 8 },
  price: { fontSize: 32, fontWeight: '800', color: '#2563eb' },
  priceMonth: { fontSize: 14, color: '#6b7280', marginLeft: 2 },
  discount: { fontSize: 12, color: '#10b981', fontWeight: '600', marginTop: 6 },
  features: { fontSize: 13, color: '#555', lineHeight: 22, marginTop: 12, textAlign: 'left', alignSelf: 'flex-start' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12, textAlign: 'center' },
  btn: { padding: 14, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  link: { color: '#2563eb', fontSize: 12, marginBottom: 20 },
  logoutBtn: { backgroundColor: '#ef4444', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
