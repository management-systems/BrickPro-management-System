import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';

const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [0, 2024, 2025, 2026];

export default function RawMaterialsScreen() {
  const { activeFactory, theme } = useAppStore();
  const colors = getColors(theme);
  const [tab, setTab] = useState<'stock' | 'purchases'>('stock');
  const [stock, setStock] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [selectedMat, setSelectedMat] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState(0);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ materialId: '', supplierId: '', quantity: '', rate: '', amountPaid: '0' });
  const [supplierForm, setSupplierForm] = useState({ name: '', mobile: '', address: '' });

  useEffect(() => { loadAll(); }, [activeFactory]);
  const loadAll = () => {
    api.get('/raw-materials/stock', { params: { factoryId: activeFactory } }).then(r => setStock(r.data)).catch(() => {});
    api.get('/raw-materials/purchases').then(r => setPurchases(r.data)).catch(() => {});
    api.get('/raw-materials/materials').then(r => setMaterials(r.data)).catch(() => {});
    api.get('/raw-materials/suppliers').then(r => setSuppliers(r.data)).catch(() => {});
  };

  const submit = async () => {
    if (!form.materialId || !form.quantity || !form.rate) { Alert.alert('Fill material, qty, rate'); return; }
    await api.post('/raw-materials/purchases', { ...form, factoryId: activeFactory, date: new Date().toISOString(), quantity: +form.quantity, rate: +form.rate, amountPaid: +form.amountPaid, paymentStatus: +form.amountPaid >= +form.quantity * +form.rate ? 'PAID' : +form.amountPaid > 0 ? 'PARTIAL' : 'CREDIT' });
    Alert.alert('Saved!'); setShowForm(false); setForm({ materialId: '', supplierId: '', quantity: '', rate: '', amountPaid: '0' }); loadAll();
  };

  const addSupplier = async () => {
    if (!supplierForm.name) { Alert.alert('Name required'); return; }
    await api.post('/raw-materials/suppliers', supplierForm);
    Alert.alert('Supplier added!'); setShowSupplierForm(false); setSupplierForm({ name: '', mobile: '', address: '' }); loadAll();
  };

  const markUsed = async (id: string) => {
    await api.patch(`/raw-materials/purchases/${id}/mark-used`).catch(() => {});
    Alert.alert('Marked as used'); loadAll();
  };

  const totalPending = purchases.reduce((s, p) => s + (p.balanceDue || 0), 0);

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
          <TouchableOpacity key={i} onPress={() => setFilterMonth(i + 1)} style={[styles.chip, { backgroundColor: filterMonth === i + 1 ? colors.primary : colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: filterMonth === i + 1 ? '#fff' : colors.textLight, fontWeight: '600' }}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity style={[styles.tabBtn, { backgroundColor: tab === 'stock' ? colors.primary : colors.surface }]} onPress={() => setTab('stock')}>
          <Text style={{ color: tab === 'stock' ? '#fff' : colors.textLight, fontWeight: '600', fontSize: 13 }}>📦 Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, { backgroundColor: tab === 'purchases' ? colors.primary : colors.surface }]} onPress={() => setTab('purchases')}>
          <Text style={{ color: tab === 'purchases' ? '#fff' : colors.textLight, fontWeight: '600', fontSize: 13 }}>🛒 Purchases</Text>
        </TouchableOpacity>
      </View>

      {tab === 'stock' && (
        <>
          {/* Click material to see all purchases */}
          {selectedMat && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{selectedMat.name}</Text>
                <TouchableOpacity onPress={() => setSelectedMat(null)}><Text style={{ color: colors.danger }}>✕</Text></TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: colors.textLight, marginBottom: 8 }}>All purchases:</Text>
              {purchases.filter(p => p.material?.name === selectedMat.name || p.materialId === selectedMat.id).map(p => (
                <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 12, color: colors.textLight }}>{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {p.quantity} {selectedMat.unit}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>₹{p.totalCost?.toLocaleString()}</Text>
                </View>
              ))}
              {purchases.filter(p => p.material?.name === selectedMat.name || p.materialId === selectedMat.id).length === 0 && (
                <Text style={{ fontSize: 12, color: colors.textMuted }}>No purchases yet</Text>
              )}
            </View>
          )}

          {stock.map(s => (
            <TouchableOpacity key={s.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setSelectedMat(selectedMat?.id === s.id ? null : s)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '600', fontSize: 15, color: colors.text }}>{s.name}</Text>
                  {s.nameHindi && <Text style={{ fontSize: 11, color: colors.textLight }}>{s.nameHindi}</Text>}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: s.lowStock ? colors.danger : colors.success }}>{s.currentStock?.toFixed(1)} <Text style={{ fontSize: 12 }}>{s.unit}</Text></Text>
                  {s.lowStock && <Text style={{ fontSize: 10, color: colors.danger }}>⚠️ Low</Text>}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {stock.length === 0 && <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 30 }}>No materials</Text>}
        </>
      )}

      {tab === 'purchases' && (
        <>
          <View style={[styles.totalCard, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 12, color: colors.textLight }}>Total Pending</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.danger }}>₹{totalPending.toLocaleString()}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={() => setShowForm(!showForm)}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{showForm ? '✕' : '+ Purchase'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.success, flex: 1 }]} onPress={() => setShowSupplierForm(!showSupplierForm)}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{showSupplierForm ? '✕' : '+ Supplier'}</Text>
            </TouchableOpacity>
          </View>

          {showSupplierForm && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 8 }}>Add Supplier</Text>
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Name *" placeholderTextColor={colors.textMuted} value={supplierForm.name} onChangeText={v => setSupplierForm({ ...supplierForm, name: v })} />
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Mobile" placeholderTextColor={colors.textMuted} value={supplierForm.mobile} onChangeText={v => setSupplierForm({ ...supplierForm, mobile: v })} keyboardType="phone-pad" />
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Address" placeholderTextColor={colors.textMuted} value={supplierForm.address} onChangeText={v => setSupplierForm({ ...supplierForm, address: v })} />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.success }]} onPress={addSupplier}><Text style={{ color: '#fff', fontWeight: '600' }}>Save Supplier</Text></TouchableOpacity>
            </View>
          )}

          {showForm && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                <Picker selectedValue={form.materialId} onValueChange={v => setForm({ ...form, materialId: v })} style={{ color: colors.text }}>
                  <Picker.Item label="-- Material --" value="" />
                  {materials.map(m => <Picker.Item key={m.id} label={m.name} value={m.id} />)}
                </Picker>
              </View>
              <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                <Picker selectedValue={form.supplierId} onValueChange={v => setForm({ ...form, supplierId: v })} style={{ color: colors.text }}>
                  <Picker.Item label="-- Supplier --" value="" />
                  {suppliers.map(s => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
                </Picker>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text, flex: 1 }]} placeholder="Qty *" placeholderTextColor={colors.textMuted} value={form.quantity} onChangeText={v => setForm({ ...form, quantity: v })} keyboardType="numeric" />
                <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text, flex: 1 }]} placeholder="Rate *" placeholderTextColor={colors.textMuted} value={form.rate} onChangeText={v => setForm({ ...form, rate: v })} keyboardType="numeric" />
              </View>
              {form.quantity && form.rate && <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 10 }}>Total: ₹{(+form.quantity * +form.rate).toLocaleString()}</Text>}
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Amount Paid (₹)" placeholderTextColor={colors.textMuted} value={form.amountPaid} onChangeText={v => setForm({ ...form, amountPaid: v })} keyboardType="numeric" />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={submit}><Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text></TouchableOpacity>
            </View>
          )}

          {purchases.map(p => (
            <TouchableOpacity key={p.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setSelected(selected?.id === p.id ? null : p)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '600', color: colors.text }}>{p.material?.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.textLight }}>{p.supplier?.name} • {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>₹{p.totalCost?.toLocaleString()}</Text>
                  {p.balanceDue > 0 && <Text style={{ fontSize: 11, color: colors.danger }}>Due: ₹{p.balanceDue?.toLocaleString()}</Text>}
                </View>
              </View>
              {selected?.id === p.id && (
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={{ fontSize: 12, color: colors.textLight }}>{p.quantity} {p.material?.unit} @ ₹{p.rate}/{p.material?.unit}</Text>
                  <Text style={{ fontSize: 12, color: colors.textLight }}>Paid: ₹{p.amountPaid?.toLocaleString()} • Status: {p.paymentStatus}</Text>
                  {!p.used && (
                    <TouchableOpacity onPress={() => markUsed(p.id)} style={{ marginTop: 8, backgroundColor: colors.success, padding: 8, borderRadius: 8, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>✓ Mark as Used</Text>
                    </TouchableOpacity>
                  )}
                  {p.used && <Text style={{ color: colors.success, fontWeight: '600', marginTop: 6 }}>✓ Used</Text>}
                </View>
              )}
            </TouchableOpacity>
          ))}
          {purchases.length === 0 && <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 30 }}>No purchases</Text>}
        </>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  totalCard: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  addBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  card: { borderRadius: 12, padding: spacing.md, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  pickerWrap: { borderWidth: 1, borderRadius: 10, marginBottom: 10 },
  entryCard: { borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1 },
});
