import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';
import EditModal from '../components/EditModal';

const BRICK_TYPES = ['Red Brick', 'Fly Ash Brick', 'AAC Block', 'Hollow Brick', 'Solid Brick', 'Paver Block', 'Fire Brick'];
const SHIFTS = ['WHOLE_DAY', 'MORNING', 'EVENING', 'NIGHT'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ProductionScreen() {
  const { activeFactory, theme, lang } = useAppStore();
  const colors = getColors(theme);
  const [entries, setEntries] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [form, setForm] = useState({ brickType: 'Red Brick', shift: 'WHOLE_DAY', count: '' });
  const [stock, setStock] = useState<Record<string, { produced: number; sold: number; stock: number }>>({});

  useEffect(() => { load(); loadStock(); }, [activeFactory, filterMonth]);
  const load = () => api.get('/production', { params: { factoryId: activeFactory, month: filterMonth, year: new Date().getFullYear() } }).then(r => setEntries(r.data)).catch(() => {});
  const loadStock = () => api.get('/reports/stock', { params: { factoryId: activeFactory } }).then(r => setStock(r.data)).catch(() => {});

  const submit = async () => {
    if (!form.count) { Alert.alert('Enter count'); return; }
    await api.post('/production', { factoryId: activeFactory, date: new Date().toISOString(), brickType: form.brickType, shift: form.shift, rawCount: +form.count, firedCount: +form.count, scrapCount: 0 });
    Alert.alert('Saved!');
    setShowForm(false);
    setForm({ ...form, count: '' });
    load();
  };

  // Group by brick type
  const brickSummary: Record<string, number> = {};
  entries.forEach(e => { brickSummary[e.brickType] = (brickSummary[e.brickType] || 0) + (e.firedCount || e.rawCount || 0); });

  // Group by date
  const dateGroups: Record<string, any[]> = {};
  entries.forEach(e => {
    const d = new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    if (!dateGroups[d]) dateGroups[d] = [];
    dateGroups[d].push(e);
  });

  const shiftLabel = (s: string) => ({ MORNING: '🌅', EVENING: '🌇', NIGHT: '🌙', WHOLE_DAY: '☀️' }[s] || s);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Month Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity key={i} onPress={() => setFilterMonth(i + 1)} style={[styles.filterChip, { backgroundColor: filterMonth === i + 1 ? colors.primary : colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: filterMonth === i + 1 ? '#fff' : colors.textLight, fontWeight: '600' }}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Brick Type Summary Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {Object.entries(brickSummary).filter(([, v]) => v > 0).map(([type, count]) => (
          <View key={type} style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryType, { color: colors.textLight }]}>{type}</Text>
            <Text style={[styles.summaryCount, { color: colors.primary }]}>{count.toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Brick Stock Card */}
      {Object.keys(stock).length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 }}>🧱 Brick Stock (Production - Sold)</Text>
          {Object.entries(stock).map(([type, val]) => (
            <View key={type} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 13, color: colors.textLight }}>{type}</Text>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>P:{val.produced.toLocaleString()} S:{val.sold.toLocaleString()}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: val.stock > 0 ? colors.success : colors.danger }}>{val.stock.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add Button */}
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addBtnText}>{showForm ? '✕ Cancel' : '+ Add Production'}</Text>
      </TouchableOpacity>

      {/* Form */}
      {showForm && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <Picker selectedValue={form.brickType} onValueChange={v => setForm({ ...form, brickType: v })} style={{ color: colors.text }}>
              {BRICK_TYPES.map(b => <Picker.Item key={b} label={b} value={b} />)}
            </Picker>
          </View>
          <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <Picker selectedValue={form.shift} onValueChange={v => setForm({ ...form, shift: v })} style={{ color: colors.text }}>
              {SHIFTS.map(s => <Picker.Item key={s} label={s.replace('_', ' ')} value={s} />)}
            </Picker>
          </View>
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Count (number of bricks)" placeholderTextColor={colors.textMuted} value={form.count} onChangeText={v => setForm({ ...form, count: v })} keyboardType="numeric" />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={submit}><Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text></TouchableOpacity>
        </View>
      )}

      {/* Selected Detail */}
      {selected && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[styles.detailTitle, { color: colors.text }]}>Entry Details</Text>
            <TouchableOpacity onPress={() => setSelected(null)}><Text style={{ color: colors.danger }}>✕</Text></TouchableOpacity>
          </View>
          <Text style={{ color: colors.textLight, marginTop: 8 }}>Brick: <Text style={{ fontWeight: '700', color: colors.text }}>{selected.brickType}</Text></Text>
          <Text style={{ color: colors.textLight, marginTop: 4 }}>Shift: {shiftLabel(selected.shift)} {selected.shift.replace('_', ' ')}</Text>
          <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '700', marginTop: 8 }}>{(selected.firedCount || selected.rawCount || 0).toLocaleString()} bricks</Text>
          <TouchableOpacity onPress={() => setEditItem(selected)} style={{ marginTop: 12, backgroundColor: colors.primaryLight, padding: 10, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Modal */}
      {editItem && (
        <EditModal
          visible={!!editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => { setSelected(null); load(); }}
          module="production"
          recordId={editItem.id}
          title="Edit Production"
          fields={[
            { key: 'firedCount', label: 'Brick Count', value: String(editItem.firedCount || editItem.rawCount || 0), type: 'number' },
            { key: 'brickType', label: 'Brick Type', value: editItem.brickType, type: 'text' },
            { key: 'remarks', label: 'Remarks', value: editItem.remarks || '', type: 'text' },
          ]}
        />
      )}

      {/* Entries grouped by date */}
      {Object.entries(dateGroups).map(([date, items]) => (
        <View key={date} style={{ marginBottom: 16 }}>
          <View style={[styles.dateHeader, { backgroundColor: colors.primaryLight }]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>📅 {date} — {items.reduce((s, e) => s + (e.firedCount || e.rawCount || 0), 0).toLocaleString()} bricks</Text>
          </View>
          {items.map((e) => (
            <TouchableOpacity key={e.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setSelected(e)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>{e.brickType}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textLight }}>{shiftLabel(e.shift)}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>{(e.firedCount || e.rawCount || 0).toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {entries.length === 0 && <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 40 }}>No entries this month</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  summaryCard: { borderRadius: 12, padding: 14, marginRight: 10, minWidth: 120, alignItems: 'center' },
  summaryType: { fontSize: 11, marginBottom: 4 },
  summaryCount: { fontSize: 20, fontWeight: '700' },
  addBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: { borderRadius: 12, padding: spacing.md, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  pickerWrap: { borderWidth: 1, borderRadius: 10, marginBottom: 10 },
  submitBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  dateHeader: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 8 },
  entryCard: { borderRadius: 10, padding: 14, marginBottom: 6, borderWidth: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  detailTitle: { fontSize: 15, fontWeight: '700' },
});
