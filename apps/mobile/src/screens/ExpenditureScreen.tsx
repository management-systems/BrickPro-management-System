import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';
import EditModal from '../components/EditModal';

const CATEGORIES = ['Electricity', 'Repair & Maintenance', 'Transport', 'JCB', 'Office/Stationery', 'Food/Tea', 'Rent', 'Insurance', 'Water', 'Loading/Unloading', 'Labour Advance', 'Miscellaneous', 'Other'];
const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2024, 2025, 2026];

// Category colors for easy tracking
const CAT_COLORS: Record<string, string> = {
  'Electricity': '#FEF3C7',
  'Repair & Maintenance': '#DBEAFE',
  'Transport': '#E0E7FF',
  'Office/Stationery': '#F3E8FF',
  'Food/Tea': '#FED7AA',
  'Rent': '#CFFAFE',
  'Insurance': '#E2E8F0',
  'Water': '#BFDBFE',
  'Loading/Unloading': '#D1FAE5',
  'Labour Advance': '#FCE7F3',
  'Miscellaneous': '#F1F5F9',
  'Other': '#F5F5F5',
};

export default function ExpenditureScreen() {
  const { activeFactory, theme } = useAppStore();
  const colors = getColors(theme);
  const [entries, setEntries] = useState<any[]>([]);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [tab, setTab] = useState<'all' | 'category'>('all');
  const [filterMonth, setFilterMonth] = useState(0); // 0 = All
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCat, setFilterCat] = useState('All');
  const [form, setForm] = useState({ category: 'Electricity', amount: '', description: '', paymentMode: 'cash', paidTo: '' });

  useEffect(() => { load(); }, [activeFactory]);

  const load = () => {
    api.get('/expenditure', { params: { factoryId: activeFactory } }).then(r => {
      setAllEntries(r.data);
    }).catch(() => {});
  };

  // Apply filters locally
  useEffect(() => {
    let filtered = [...allEntries];
    if (filterMonth > 0) {
      filtered = filtered.filter(e => new Date(e.date).getMonth() + 1 === filterMonth);
    }
    if (filterYear) {
      filtered = filtered.filter(e => new Date(e.date).getFullYear() === filterYear);
    }
    if (filterCat !== 'All') {
      filtered = filtered.filter(e => e.category === filterCat);
    }
    setEntries(filtered);
  }, [allEntries, filterMonth, filterYear, filterCat]);

  const submit = async () => {
    if (!form.amount) { Alert.alert('Amount required'); return; }
    await api.post('/expenditure', { ...form, factoryId: activeFactory, date: new Date().toISOString(), amount: +form.amount });
    Alert.alert('Saved!');
    setShowForm(false);
    setForm({ category: 'Electricity', amount: '', description: '', paymentMode: 'cash', paidTo: '' });
    load();
  };

  const total = entries.reduce((s, e) => s + e.amount, 0);

  // Group by category
  const byCategory: Record<string, any[]> = {};
  entries.forEach(e => { if (!byCategory[e.category]) byCategory[e.category] = []; byCategory[e.category].push(e); });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Year Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {YEARS.map(y => (
          <TouchableOpacity key={y} onPress={() => setFilterYear(y)} style={[styles.chip, { backgroundColor: filterYear === y ? colors.primary : colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: filterYear === y ? '#fff' : colors.textLight, fontWeight: '600' }}>{y}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Month Selection (with All) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity key={i} onPress={() => setFilterMonth(i)} style={[styles.chip, { backgroundColor: filterMonth === i ? colors.primary : colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: filterMonth === i ? '#fff' : colors.textLight, fontWeight: '600' }}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category Filter (with All) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <TouchableOpacity onPress={() => setFilterCat('All')} style={[styles.chip, { backgroundColor: filterCat === 'All' ? colors.primary : colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 11, color: filterCat === 'All' ? '#fff' : colors.textLight, fontWeight: '600' }}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} onPress={() => setFilterCat(filterCat === c ? 'All' : c)} style={[styles.chip, { backgroundColor: filterCat === c ? colors.primary : colors.surface, borderColor: filterCat === c ? colors.primary : colors.border }]}>
            <Text style={{ fontSize: 11, color: filterCat === c ? '#fff' : colors.text, fontWeight: '500' }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Total */}
      <View style={[styles.totalCard, { backgroundColor: colors.surface }]}>
        <Text style={{ fontSize: 12, color: colors.textLight }}>Total ({filterMonth === 0 ? 'All' : MONTHS[filterMonth]} {filterYear})</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.danger }}>₹{total.toLocaleString()}</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity style={[styles.tabBtn, { backgroundColor: tab === 'all' ? colors.primary : colors.surface }]} onPress={() => setTab('all')}>
          <Text style={{ color: tab === 'all' ? '#fff' : colors.textLight, fontWeight: '600', fontSize: 13 }}>📋 All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, { backgroundColor: tab === 'category' ? colors.primary : colors.surface }]} onPress={() => setTab('category')}>
          <Text style={{ color: tab === 'category' ? '#fff' : colors.textLight, fontWeight: '600', fontSize: 13 }}>📂 By Category</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(!showForm)}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>{showForm ? '✕ Cancel' : '+ Add Expense'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <Picker selectedValue={form.category} onValueChange={v => setForm({ ...form, category: v })} style={{ color: colors.text }}>
              {CATEGORIES.map(c => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
          </View>
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Amount (₹) *" placeholderTextColor={colors.textMuted} value={form.amount} onChangeText={v => setForm({ ...form, amount: v })} keyboardType="numeric" />
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Paid To" placeholderTextColor={colors.textMuted} value={form.paidTo} onChangeText={v => setForm({ ...form, paidTo: v })} />
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Description" placeholderTextColor={colors.textMuted} value={form.description} onChangeText={v => setForm({ ...form, description: v })} />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={submit}><Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text></TouchableOpacity>
        </View>
      )}

      {/* ALL TAB */}
      {tab === 'all' && entries.map(e => (
        <TouchableOpacity key={e.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: CAT_COLORS[e.category] ? colors.primary : colors.border }]} onPress={() => setSelected(selected?.id === e.id ? null : e)}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={[styles.dateChip, { backgroundColor: colors.primaryLight }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
              </View>
              <View style={[styles.catBadge, { backgroundColor: CAT_COLORS[e.category] || '#f0f0f0' }]}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#333' }}>{e.category}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.danger }}>₹{e.amount?.toLocaleString()}</Text>
          </View>
          {selected?.id === e.id && (
            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ fontSize: 12, color: colors.textLight }}>Paid To: {e.paidTo || '—'}</Text>
              <Text style={{ fontSize: 12, color: colors.textLight }}>Mode: {e.paymentMode}</Text>
              {e.description && <Text style={{ fontSize: 12, color: colors.textLight }}>Note: {e.description}</Text>}
              <TouchableOpacity onPress={() => setEditItem(e)} style={{ marginTop: 8, backgroundColor: colors.primaryLight, padding: 8, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* BY CATEGORY TAB */}
      {tab === 'category' && Object.entries(byCategory).sort((a, b) => b[1].reduce((s, e) => s + e.amount, 0) - a[1].reduce((s, e) => s + e.amount, 0)).map(([cat, items]) => (
        <View key={cat} style={{ marginBottom: 16 }}>
          <View style={[styles.catHeader, { backgroundColor: CAT_COLORS[cat] || colors.surface }]}>
            <Text style={{ fontWeight: '600', color: '#333' }}>{cat}</Text>
            <Text style={{ fontWeight: '700', color: colors.danger }}>₹{items.reduce((s, e) => s + e.amount, 0).toLocaleString()}</Text>
          </View>
          {items.map(e => (
            <TouchableOpacity key={e.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border, marginLeft: 12 }]} onPress={() => setSelected(selected?.id === e.id ? null : e)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: colors.textLight }}>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {e.paidTo && `• ${e.paidTo}`}</Text>
                <Text style={{ fontWeight: '600', color: colors.danger }}>₹{e.amount?.toLocaleString()}</Text>
              </View>
              {selected?.id === e.id && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.textLight }}>Mode: {e.paymentMode} {e.description && `• ${e.description}`}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {entries.length === 0 && <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 30 }}>No entries for selected filters</Text>}

      {/* Edit Modal */}
      {editItem && (
        <EditModal
          visible={!!editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => { setSelected(null); load(); }}
          module="expenditure"
          recordId={editItem.id}
          title="Edit Expense"
          fields={[
            { key: 'amount', label: 'Amount (₹)', value: String(editItem.amount || 0), type: 'number' },
            { key: 'category', label: 'Category', value: editItem.category || '', type: 'text' },
            { key: 'description', label: 'Description', value: editItem.description || '', type: 'text' },
            { key: 'paidTo', label: 'Paid To', value: editItem.paidTo || '', type: 'text' },
          ]}
        />
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 6, borderWidth: 1 },
  totalCard: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  addBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  card: { borderRadius: 12, padding: spacing.md, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  pickerWrap: { borderWidth: 1, borderRadius: 10, marginBottom: 10 },
  entryCard: { borderRadius: 10, padding: 14, marginBottom: 6, borderWidth: 1 },
  dateChip: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 8, marginBottom: 8 },
});
