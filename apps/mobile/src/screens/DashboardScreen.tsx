import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useAppStore } from '../store/app';
import { useAuthStore } from '../store/auth';
import { tr } from '../lib/i18n';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';

export default function DashboardScreen({ navigation }: any) {
  const { lang, theme, toggleLang, toggleTheme } = useAppStore();
  const colors = getColors(theme);
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    try { const { data: d } = await api.get('/reports/dashboard'); setData(d); }
    catch { setData({ todayProduction: 0, monthRevenue: 0, totalOutstanding: 0, totalLabour: 0, monthExpenses: 0 }); }
    try { const { data: n } = await api.get('/reports/notifications'); setUnreadCount(n.filter((x: any) => !x.read).length); }
    catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const stats = [
    { icon: '🧱', value: data?.monthProduction?.toLocaleString() || '0', label: lang === 'en' ? 'Monthly Bricks' : 'महीने की ईंटें', screen: 'Production', color: colors.primary },
    { icon: '💰', value: `₹${((data?.monthRevenue || 0) / 1000).toFixed(0)}K`, label: tr('monthRevenue', lang), screen: 'Dispatch', color: colors.success },
    { icon: '💸', value: `₹${((data?.monthExpenses || 0) / 1000).toFixed(0)}K`, label: lang === 'en' ? 'Expenses' : 'खर्चे', screen: 'Expenditure', color: colors.warning },
    { icon: '⚠️', value: `₹${((data?.totalOutstanding || 0) / 1000).toFixed(0)}K`, label: tr('outstanding', lang), screen: 'Customers', color: colors.danger },
  ];

  const actions = [
    { icon: '🧱', label: tr('production', lang), screen: 'Production', bg: colors.primaryLight },
    { icon: '🚛', label: tr('dispatch', lang), screen: 'Dispatch', bg: '#F0FDF4' },
    { icon: '👥', label: tr('customers', lang), screen: 'Customers', bg: '#FFF7ED' },
    { icon: '🪨', label: tr('rawMaterials', lang), screen: 'RawMaterials', bg: '#FEF2F2' },
    { icon: '👷', label: tr('labour', lang), screen: 'Labour', bg: '#F5F3FF' },
    { icon: '💸', label: tr('expenditure', lang), screen: 'Expenditure', bg: '#ECFDF5' },
    { icon: '⛽', label: tr('fuel', lang), screen: 'Fuel', bg: '#FEF9C3' },
    { icon: '📊', label: tr('reports', lang), screen: 'Reports', bg: '#EFF6FF' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textLight }]}>{lang === 'en' ? 'Welcome back,' : 'स्वागत है,'}</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.surface, position: 'relative' }]} onPress={() => navigation.navigate('Notifications')}>
            <Text style={{ fontSize: 16 }}>🔔</Text>
            {unreadCount > 0 && <View style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>{unreadCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.surface }]} onPress={toggleTheme}>
            <Text style={{ fontSize: 16 }}>{theme === 'light' ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.primaryLight }]} onPress={toggleLang}>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{lang === 'en' ? 'हिं' : 'EN'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clickable Stat Cards */}
      <View style={styles.statGrid}>
        {stats.map((s) => (
          <TouchableOpacity key={s.screen} style={[styles.statCard, { backgroundColor: colors.surface, borderLeftColor: s.color }]} onPress={() => navigation.navigate(s.screen)}>
            <Text style={{ fontSize: 14 }}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{lang === 'en' ? 'Quick Actions' : 'त्वरित कार्य'}</Text>
      <View style={styles.actionGrid}>
        {actions.map(a => (
          <TouchableOpacity key={a.screen} style={[styles.actionCard, { backgroundColor: theme === 'dark' ? colors.surface : a.bg }]} onPress={() => navigation.navigate(a.screen)}>
            <Text style={{ fontSize: 28 }}>{a.icon}</Text>
            <Text style={[styles.actionLabel, { color: colors.text }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: 0 },
  greeting: { fontSize: 14 },
  userName: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.lg, gap: 12 },
  statCard: { width: '47%', borderRadius: 14, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  statLabel: { fontSize: 11, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', paddingHorizontal: spacing.lg, marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 12, paddingBottom: 32 },
  actionCard: { width: '47%', borderRadius: 14, padding: 20, alignItems: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '500', marginTop: 8 },
});
