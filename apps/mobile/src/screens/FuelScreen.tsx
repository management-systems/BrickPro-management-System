import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';

const FUEL_TYPES = ['Diesel', 'Petrol', 'Coal', 'Gas', 'Wood'];
const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [0, 2024, 2025, 2026]; // 0 = All

export default function FuelScreen() {
  const { activeFactory, theme } = useAppStore();
  const colors = getColors(theme);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState(0);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ fuelType: 'Diesel', quantity: '', rate: '', unit: 'Litre', supplier: '' });

  useEffect(() => { load(); }, [activeFactory]);
  const load = () => api.get('/fuel', { params: { factoryId: activeFactory } }).then(r => setAllEntries(r.data)).catch(() => {});

  useEffect(() => {
    let f = [...allEntries];
    if (filterYear > 0) f = f.filter(e => new Date(e.date).getFullYear() === filterYear);
    if (filterMonth > 0) f = f.filter(e => new Date(e.date).getMonth() + 1 === filterMonth);
    setEntries(f);
  }, [allEntries, filterMonth, filterYear]);

  const submit = async () => {
    if (!form.quantity || !form.rate) { Alert.alert('Quantity and rate required'); return; }
    await api.post('/fuel', { ...form, factoryId: activeFactory, date: new Date().toISOString(), quantity: +form.quantity, rate: +form.rate });
    Alert.alert('Saved!');
    setShowForm(false);
    setForm({ fuelType: 'Diesel', quantity: '', rate: '', unit: 'Litre', supplier: '' });
    load();
  };

  const total = entries.reduce((s, e) => s + (e.totalCost || 0), 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Year Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {YEARS.map(y => (
          <TouchableOpacity key={y} onPress={() => setFilterYear(y)} style={[styles.chip, { backgroundColor: filterYear === y ? colors.primary : colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: filterYear === y ? '#fff' : colors.textLight, fontWeight: '600' }}>{y === 0 ? 'All' : y}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Month Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity key={i} onPress={() => setFilterMonth(i)} style={[styles.chip, { backgroundColor: filterMonth === i ? colors.primary : colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: filterMonth === i ? '#fff' : colors.textLight, fontWeight: '600' }}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.totalCard, { backgroundColor: colors.surface }]}>
        <Text style={{ fontSize: 12, color: colors.textLight }}>Total Fuel Cost</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.warning }}>₹{total.toLocaleString()}</Text>
      </View>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(!showForm)}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{showForm ? '✕ Cancel' : '+ Add Fuel Entry'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <Picker selectedValue={form.fuelType} onValueChange={v => setForm({ ...form, fuelType: v })} style={{ color: colors.text }}>
              {FUEL_TYPES.map(f => <Picker.Item key={f} label={f} value={f} />)}
            </Picker>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text, flex: 1 }]} placeholder="Qty *" placeholderTextColor={colors.textMuted} value={form.quantity} onChangeText={v => setForm({ ...form, quantity: v })} keyboardType="numeric" />
            <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text, flex: 1 }]} placeholder="Rate *" placeholderTextColor={colors.textMuted} value={form.rate} onChangeText={v => setForm({ ...form, rate: v })} keyboardType="numeric" />
          </View>
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Supplier" placeholderTextColor={colors.textMuted} value={form.supplier} onChangeText={v => setForm({ ...form, supplier: v })} />
          {form.quantity && form.rate && <Text style={{ marginBottom: 10, fontWeight: '700', color: colors.success }}>Total: ₹{(+form.quantity * +form.rate).toLocaleString()}</Text>}
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={submit}><Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text></TouchableOpacity>
        </View>
      )}

      {entries.map(item => (
        <View key={item.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: colors.text }}>⛽ {item.fuelType}</Text>
            <Text style={{ fontWeight: '700', color: colors.warning }}>₹{item.totalCost?.toLocaleString()}</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textLight, marginTop: 4 }}>{item.quantity} {item.unit} × ₹{item.rate}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}{item.supplier ? ` • ${item.supplier}` : ''}</Text>
        </View>
      ))}

      {entries.length === 0 && <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 30 }}>No fuel entries</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 6, borderWidth: 1 },
  totalCard: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  addBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  card: { borderRadius: 12, padding: spacing.md, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  pickerWrap: { borderWidth: 1, borderRadius: 10, marginBottom: 10 },
  entryCard: { borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1 },
});
