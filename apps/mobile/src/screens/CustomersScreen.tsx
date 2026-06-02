import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';

export default function CustomersScreen({ navigation }: any) {
  const { theme, activeFactory } = useAppStore();
  const colors = getColors(theme);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [form, setForm] = useState({ name: '', mobile: '', firm: '', address: '', ratePer1000: '' });

  useEffect(() => { load(); }, [activeFactory]);
  const load = () => api.get('/customers', { params: { factoryId: activeFactory } }).then(r => setCustomers(r.data)).catch(() => {});

  const submit = async () => {
    if (!form.name || !form.mobile) { Alert.alert('Name and mobile required'); return; }
    await api.post('/customers', form);
    Alert.alert('Customer added!');
    setShowForm(false);
    setForm({ name: '', mobile: '', firm: '', address: '', ratePer1000: '' });
    load();
  };

  const openDetail = async (c: any) => {
    try { const { data } = await api.get(`/customers/${c.id}/details`, { params: { factoryId: activeFactory } }); setSelected(c); setDetails(data); }
    catch { setSelected(c); setDetails({ dispatches: [], totalSold: 0, totalAmount: 0, totalReceived: 0, totalDue: 0 }); }
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile?.includes(search));

  // Detail View
  if (selected && details) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
        <TouchableOpacity onPress={() => { setSelected(null); setDetails(null); }} style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>← Back to list</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{selected.name}</Text>
        <Text style={{ fontSize: 13, color: colors.textLight, marginBottom: 16 }}>{selected.firm || ''} {selected.mobile ? `• ${selected.mobile}` : ''}</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.success }}>₹{details.totalReceived?.toLocaleString()}</Text>
            <Text style={{ fontSize: 10, color: colors.textLight }}>Received</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.danger }}>₹{details.totalDue?.toLocaleString()}</Text>
            <Text style={{ fontSize: 10, color: colors.textLight }}>Pending</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Dispatch')}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>🚛 Sell Bricks</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Ledger ({details.dispatches?.length || 0})</Text>
        {(() => {
          const ledger: any[] = [];
          (details.dispatches || []).forEach((d: any) => {
            ledger.push({ date: d.date, type: 'sale', detail: `${d.brickType} × ${d.quantity?.toLocaleString()}`, debit: d.amount || 0, credit: 0 });
            if (d.amountReceived > 0) ledger.push({ date: d.date, type: 'payment', detail: 'Payment received', debit: 0, credit: d.amountReceived });
          });
          ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          let bal = 0;
          ledger.forEach(r => { bal += r.debit - r.credit; r.balance = bal; });
          return ledger.reverse().map((row, i) => (
            <View key={i} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: row.type === 'sale' ? colors.danger : colors.success }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>{new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                  <Text style={{ fontSize: 12, color: colors.text }}>{row.type === 'sale' ? '🧱 Sale' : '💰 Payment'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {row.debit > 0 && <Text style={{ color: colors.danger, fontWeight: '600' }}>+₹{row.debit.toLocaleString()}</Text>}
                  {row.credit > 0 && <Text style={{ color: colors.success, fontWeight: '600' }}>-₹{row.credit.toLocaleString()}</Text>}
                  <Text style={{ fontSize: 11, fontWeight: '700', color: row.balance > 0 ? colors.danger : colors.success }}>Bal: ₹{row.balance.toLocaleString()}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>{row.detail}</Text>
            </View>
          ));
        })()}
        {(!details.dispatches || details.dispatches.length === 0) && <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 20 }}>No sales yet</Text>}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // List View
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Total Card */}
      <View style={[styles.totalCard, { backgroundColor: colors.surface }]}>
        <Text style={{ fontWeight: '600', color: colors.text }}>Total Customers</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primary }}>{customers.length}</Text>
      </View>

      <TextInput style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="🔍 Search..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(!showForm)}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{showForm ? '✕ Cancel' : '+ Add Customer'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Name *" placeholderTextColor={colors.textMuted} value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Mobile *" placeholderTextColor={colors.textMuted} value={form.mobile} onChangeText={v => setForm({ ...form, mobile: v })} keyboardType="phone-pad" maxLength={10} />
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Firm" placeholderTextColor={colors.textMuted} value={form.firm} onChangeText={v => setForm({ ...form, firm: v })} />
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Address" placeholderTextColor={colors.textMuted} value={form.address} onChangeText={v => setForm({ ...form, address: v })} />
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Rate per 1000 bricks (₹)" placeholderTextColor={colors.textMuted} value={form.ratePer1000} onChangeText={v => setForm({ ...form, ratePer1000: v })} keyboardType="numeric" />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={submit}><Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const hasPending = item.dispatches?.some((d: any) => d.balanceDue > 0 && new Date(d.date) < new Date(Date.now() - 30*24*60*60*1000));
          return (
            <TouchableOpacity style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => openDetail(item)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontWeight: '600', fontSize: 15, color: colors.text }}>{item.name}</Text>
                    {hasPending && <View style={styles.redDot} />}
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textLight }}>{item.firm ? `${item.firm} • ` : ''}{item.mobile}</Text>
                </View>
                <Text style={{ color: colors.primary, fontWeight: '500' }}>→</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 40 }}>No customers yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 16, marginBottom: 12 },
  search: { borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, marginBottom: 12 },
  addBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  card: { borderRadius: 12, padding: spacing.md, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  entryCard: { borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginLeft: 6 },
});
