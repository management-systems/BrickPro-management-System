import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';
import EditModal from '../components/EditModal';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DispatchScreen() {
  const { activeFactory, theme } = useAppStore();
  const colors = getColors(theme);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [payItem, setPayItem] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [form, setForm] = useState({ customerId: '', ticketNo: '', truckNo: '', brickType: 'Red Brick', quantity: '', rate: '', amountReceived: '0', distance: '' });

  useEffect(() => { load(); api.get('/customers').then(r => setCustomers(r.data)).catch(() => {}); }, [activeFactory]);
  const load = () => api.get('/dispatch', { params: { factoryId: activeFactory } }).then(r => setDispatches(r.data)).catch(() => {});

  const shareWhatsApp = (d: any) => {
    const customer = d.customer?.name || 'Customer';
    const mobile = d.customer?.mobile || customers.find((c: any) => c.id === d.customerId)?.mobile || '';
    const text = `🧱 *BrickPro - Sale Challan*\n━━━━━━━━━━━━━━━━━━\n📋 Ticket: ${d.challanNo}\n📅 Date: ${new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n👤 Customer: ${customer}\n\n🧱 ${d.brickType} × ${d.quantity?.toLocaleString()}\n💰 Rate: ₹${d.rate} / brick\n💵 Total: ₹${d.amount?.toLocaleString()}\n✅ Received: ₹${d.amountReceived?.toLocaleString()}\n${d.balanceDue > 0 ? `⚠️ Pending: ₹${d.balanceDue?.toLocaleString()}` : '✅ Fully Paid'}\n\n🚛 Truck: ${d.truckNo || '—'}\n━━━━━━━━━━━━━━━━━━\nThank you! 🙏`;
    const url = mobile
      ? `https://wa.me/91${mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url);
  };

  const submit = async () => {
    if (!form.customerId || !form.quantity || !form.rate) { Alert.alert('Fill customer, quantity, rate'); return; }
    await api.post('/dispatch', { ...form, factoryId: activeFactory, date: new Date().toISOString(), quantity: +form.quantity, rate: +form.rate, amountReceived: +form.amountReceived, distance: form.distance ? +form.distance : undefined });
    Alert.alert('Challan created!');
    setShowForm(false);
    setForm({ customerId: '', ticketNo: '', truckNo: '', brickType: 'Red Brick', quantity: '', rate: '', amountReceived: '0', distance: '' });
    load();
  };

  const filtered = filter === 'all' ? dispatches : dispatches.filter(d => d.paymentStatus === filter);
  const monthFiltered = filtered.filter(d => new Date(d.date).getMonth() + 1 === filterMonth);
  const totalAmount = monthFiltered.reduce((s, d) => s + (d.amount || 0), 0);
  const totalDue = monthFiltered.reduce((s, d) => s + (d.balanceDue || 0), 0);

  // Group by date
  const dateGroups: Record<string, any[]> = {};
  monthFiltered.forEach(e => {
    const d = new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    if (!dateGroups[d]) dateGroups[d] = [];
    dateGroups[d].push(e);
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Month Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity key={i} onPress={() => setFilterMonth(i + 1)} style={[styles.chip, { backgroundColor: filterMonth === i + 1 ? colors.primary : colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: filterMonth === i + 1 ? '#fff' : colors.textLight, fontWeight: '600' }}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.success }}>₹{(totalAmount / 1000).toFixed(0)}K</Text>
          <Text style={{ fontSize: 10, color: colors.textLight }}>Sales</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.danger }}>₹{(totalDue / 1000).toFixed(0)}K</Text>
          <Text style={{ fontSize: 10, color: colors.textLight }}>Pending</Text>
        </View>
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {[['all','All'],['CREDIT','Pending'],['PARTIAL','Partial'],['PAID','Paid']].map(([k,l]) => (
          <TouchableOpacity key={k} onPress={() => setFilter(k)} style={[styles.chip, { backgroundColor: filter === k ? colors.primary : colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: filter === k ? '#fff' : colors.textLight, fontWeight: '600' }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(!showForm)}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{showForm ? '✕ Cancel' : '+ Sell Bricks'}</Text>
      </TouchableOpacity>

      {/* Form */}
      {showForm && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Ticket No" placeholderTextColor={colors.textMuted} value={form.ticketNo} onChangeText={v => setForm({ ...form, ticketNo: v })} />
          <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <Picker selectedValue={form.customerId} onValueChange={v => {
              // Auto-fill rate from last dispatch of this customer
              const lastDispatch = dispatches.find((d: any) => d.customerId === v);
              const autoRate = lastDispatch?.rate?.toString() || form.rate;
              setForm({ ...form, customerId: v, rate: autoRate });
            }} style={{ color: colors.text }}>
              <Picker.Item label="-- Select Customer --" value="" />
              {customers.map(c => <Picker.Item key={c.id} label={c.name} value={c.id} />)}
            </Picker>
          </View>
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Truck No" placeholderTextColor={colors.textMuted} value={form.truckNo} onChangeText={v => setForm({ ...form, truckNo: v })} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text, flex: 1 }]} placeholder="Qty *" placeholderTextColor={colors.textMuted} value={form.quantity} onChangeText={v => setForm({ ...form, quantity: v })} keyboardType="numeric" />
            <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text, flex: 1 }]} placeholder="Rate *" placeholderTextColor={colors.textMuted} value={form.rate} onChangeText={v => setForm({ ...form, rate: v })} keyboardType="numeric" />
          </View>
          {form.quantity && form.rate && <Text style={{ marginBottom: 10, fontWeight: '700', fontSize: 16, color: colors.success }}>Total: ₹{(+form.quantity * +form.rate).toLocaleString()}</Text>}
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Amount Received (₹)" placeholderTextColor={colors.textMuted} value={form.amountReceived} onChangeText={v => setForm({ ...form, amountReceived: v })} keyboardType="numeric" />
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Distance (KM)" placeholderTextColor={colors.textMuted} value={form.distance} onChangeText={v => setForm({ ...form, distance: v })} keyboardType="numeric" />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={submit}><Text style={{ color: '#fff', fontWeight: '600' }}>Create Challan</Text></TouchableOpacity>
        </View>
      )}

      {/* Selected Detail */}
      {selected && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>Sale Details</Text>
            <TouchableOpacity onPress={() => setSelected(null)}><Text style={{ color: colors.danger, fontWeight: '600' }}>✕</Text></TouchableOpacity>
          </View>
          <Text style={{ color: colors.textLight, marginTop: 8 }}>Customer: <Text style={{ fontWeight: '700', color: colors.text }}>{selected.customer?.name}</Text></Text>
          <Text style={{ color: colors.textLight, marginTop: 4 }}>Ticket: {selected.challanNo} • Truck: {selected.truckNo || '—'}</Text>
          <Text style={{ color: colors.textLight, marginTop: 4 }}>{selected.brickType} × {selected.quantity?.toLocaleString()}</Text>
          <Text style={{ color: colors.primary, marginTop: 4, fontWeight: '600' }}>Rate: ₹{selected.rate} / brick</Text>
          <Text style={{ color: colors.success, fontSize: 18, fontWeight: '700', marginTop: 8 }}>₹{selected.amount?.toLocaleString()}</Text>
          {selected.balanceDue > 0 && <Text style={{ color: colors.danger, fontWeight: '600', marginTop: 4 }}>Due: ₹{selected.balanceDue?.toLocaleString()}</Text>}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity onPress={() => shareWhatsApp(selected)} style={{ flex: 1, backgroundColor: '#25D366', padding: 10, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>📱 WhatsApp</Text>
            </TouchableOpacity>
            {selected.balanceDue > 0 && (
              <TouchableOpacity onPress={() => { setPayItem(selected); setPayAmount(''); }} style={{ flex: 1, backgroundColor: colors.success, padding: 10, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>💰 Pay</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setEditItem(selected)} style={{ flex: 1, backgroundColor: colors.primaryLight, padding: 10, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit Modal */}
      {editItem && (
        <EditModal
          visible={!!editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => { setSelected(null); load(); }}
          module="dispatch"
          recordId={editItem.id}
          title="Edit Sale"
          fields={[
            { key: 'quantity', label: 'Quantity', value: String(editItem.quantity || 0), type: 'number' },
            { key: 'rate', label: 'Rate (₹/brick)', value: String(editItem.rate || 0), type: 'number' },
            { key: 'truckNo', label: 'Truck No', value: editItem.truckNo || '', type: 'text' },
            { key: 'remarks', label: 'Remarks', value: editItem.remarks || '', type: 'text' },
          ]}
        />
      )}

      {/* Entries grouped by date */}
      {Object.entries(dateGroups).map(([date, items]) => (
        <View key={date} style={{ marginBottom: 16 }}>
          <View style={[styles.dateHeader, { backgroundColor: colors.primaryLight }]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>📅 {date} — ₹{items.reduce((s, d) => s + d.amount, 0).toLocaleString()}</Text>
          </View>
          {items.map(item => (
            <TouchableOpacity key={item.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setSelected(item)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text }}>{item.customer?.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.textLight }}>{item.challanNo} • {item.quantity?.toLocaleString()} bricks</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>₹{item.amount?.toLocaleString()}</Text>
                  <View style={[styles.badge, { backgroundColor: item.paymentStatus === 'PAID' ? '#DCFCE7' : item.paymentStatus === 'PARTIAL' ? '#FEF9C3' : '#FEE2E2' }]}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: item.paymentStatus === 'PAID' ? colors.success : item.paymentStatus === 'PARTIAL' ? colors.warning : colors.danger }}>{item.paymentStatus}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {Object.keys(dateGroups).length === 0 && <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 40 }}>No entries</Text>}

      {/* Payment Modal */}
      {payItem && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.success }]}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 }}>💰 Record Payment</Text>
          <Text style={{ fontSize: 13, color: colors.textLight, marginBottom: 12 }}>{payItem.customer?.name} • Due: <Text style={{ color: colors.danger, fontWeight: '700' }}>₹{payItem.balanceDue?.toLocaleString()}</Text></Text>
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Amount (₹)" placeholderTextColor={colors.textMuted} value={payAmount} onChangeText={setPayAmount} keyboardType="numeric" autoFocus />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => setPayItem(null)} style={{ flex: 1, backgroundColor: colors.bg, padding: 12, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: colors.textLight, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              if (!payAmount || +payAmount <= 0) { Alert.alert('Enter amount'); return; }
              await api.patch(`/dispatch/${payItem.id}/payment`, { amount: +payAmount });
              const newBalance = payItem.balanceDue - +payAmount;
              const customer = payItem.customer?.name || 'Customer';
              const mobile = payItem.customer?.mobile || customers.find((c: any) => c.id === payItem.customerId)?.mobile || '';
              const text = `🧱 *BrickPro - Payment Received*\n━━━━━━━━━━━━━━━━━━\n👤 Customer: ${customer}\n📋 Challan: ${payItem.challanNo}\n📅 Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n\n💰 Payment Received: ₹${(+payAmount).toLocaleString()}\n💵 Total Bill: ₹${payItem.amount?.toLocaleString()}\n✅ Total Paid: ₹${(payItem.amountReceived + +payAmount).toLocaleString()}\n${newBalance > 0 ? `⚠️ Still Pending: ₹${newBalance.toLocaleString()}` : '✅ Fully Paid - No Pending!'}\n━━━━━━━━━━━━━━━━━━\nThank you! 🙏`;
              const url = mobile ? `https://wa.me/91${mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
              setPayItem(null); setPayAmount(''); setSelected(null); load();
              Alert.alert('Payment Saved!', 'Share receipt on WhatsApp?', [
                { text: 'No', style: 'cancel' },
                { text: 'Share', onPress: () => Linking.openURL(url) },
              ]);
            }} style={{ flex: 2, backgroundColor: colors.success, padding: 12, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Save & Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  addBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  card: { borderRadius: 12, padding: spacing.md, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  pickerWrap: { borderWidth: 1, borderRadius: 10, marginBottom: 10 },
  dateHeader: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 8 },
  entryCard: { borderRadius: 10, padding: 14, marginBottom: 6, borderWidth: 1 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
});
