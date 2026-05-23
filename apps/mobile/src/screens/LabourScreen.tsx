import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';

const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [0, 2024, 2025, 2026];

export default function LabourScreen() {
  const { activeFactory, theme } = useAppStore();
  const colors = getColors(theme);
  const [tab, setTab] = useState<'list' | 'production' | 'payments'>('list');
  const [labourList, setLabourList] = useState<any[]>([]);
  const [productions, setProductions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showProd, setShowProd] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [filterMonth, setFilterMonth] = useState(0); // 0 = All
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ name: '', mobile: '', type: 'PER_BRICK', perBrickRate: '' });
  const [prodForm, setProdForm] = useState({ labourId: '', quantity: '', rate: '', brickType: 'Red Brick' });
  const [payForm, setPayForm] = useState({ labourId: '', amount: '', mode: 'cash' });

  useEffect(() => {
    api.get('/labour', { params: { factoryId: activeFactory } }).then(r => setLabourList(r.data)).catch(() => {});
    const params: any = { factoryId: activeFactory };
    if (filterMonth > 0) params.month = filterMonth;
    params.year = filterYear > 0 ? filterYear : undefined;
    api.get('/labour/production', { params }).then(r => setProductions(r.data)).catch(() => {});
    api.get('/labour/payments', { params: { month: filterMonth > 0 ? filterMonth : undefined, year: filterYear > 0 ? filterYear : undefined } }).then(r => setPayments(r.data)).catch(() => {});
  }, [activeFactory, filterMonth, filterYear]);

  const addLabour = async () => {
    if (!form.name) { Alert.alert('Name required'); return; }
    await api.post('/labour', { factoryId: activeFactory, name: form.name, mobile: form.mobile || undefined, type: form.type, perBrickRate: +form.perBrickRate || null });
    Alert.alert('Added!'); setShowAdd(false); setForm({ name: '', mobile: '', type: 'PER_BRICK', perBrickRate: '' });
    api.get('/labour', { params: { factoryId: activeFactory } }).then(r => setLabourList(r.data));
  };

  const addProd = async () => {
    if (!prodForm.labourId || !prodForm.quantity) { Alert.alert('Select labour & qty'); return; }
    const l = labourList.find(x => x.id === prodForm.labourId);
    await api.post('/labour/production', { ...prodForm, quantity: +prodForm.quantity, rate: +prodForm.rate || l?.perBrickRate || 0, date: new Date().toISOString() });
    Alert.alert('Saved!'); setShowProd(false);
    api.get('/labour/production', { params: { factoryId: activeFactory, month: filterMonth, year: new Date().getFullYear() } }).then(r => setProductions(r.data));
  };

  const addPay = async () => {
    if (!payForm.labourId || !payForm.amount) { Alert.alert('Select labour & amount'); return; }
    await api.post('/labour/payments', { ...payForm, amount: +payForm.amount, date: new Date().toISOString() });
    Alert.alert('Paid!'); setShowPay(false);
    api.get('/labour/payments', { params: { month: filterMonth, year: new Date().getFullYear() } }).then(r => setPayments(r.data));
  };

  const getSummary = (l: any) => {
    const lP = productions.filter(p => (p.labourId || p.labour?.id) === l.id);
    const lPay = payments.filter(p => (p.labourId || p.labour?.id) === l.id);
    const earned = lP.reduce((s, p) => s + (p.amount || p.quantity * (p.rate || l.perBrickRate || 0)), 0);
    const paid = lPay.reduce((s, p) => s + p.amount, 0);
    return { earned, paid, pending: earned - paid, bricks: lP.reduce((s, p) => s + p.quantity, 0) };
  };

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

      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
        {[['list','👷 Workers'],['production','🧱 Work'],['payments','💰 Pay']].map(([k,l]) => (
          <TouchableOpacity key={k} style={[styles.tabBtn, { backgroundColor: tab === k ? colors.primary : colors.surface }]} onPress={() => setTab(k as any)}>
            <Text style={{ color: tab === k ? '#fff' : colors.textLight, fontWeight: '600', fontSize: 12 }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'list' && (
        <>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAdd(!showAdd)}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{showAdd ? '✕' : '+ Add Labour'}</Text>
          </TouchableOpacity>
          {showAdd && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Name *" placeholderTextColor={colors.textMuted} value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Rate per brick (₹)" placeholderTextColor={colors.textMuted} value={form.perBrickRate} onChangeText={v => setForm({ ...form, perBrickRate: v })} keyboardType="numeric" />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addLabour}><Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text></TouchableOpacity>
            </View>
          )}
          {labourList.map(l => {
            const s = getSummary(l);
            return (
              <TouchableOpacity key={l.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setSelected(selected?.id === l.id ? null : l)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontWeight: '600', fontSize: 15, color: colors.text }}>{l.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textLight }}>₹{l.perBrickRate}/brick {l.mobile && `• ${l.mobile}`}</Text>
                  </View>
                  {s.pending > 0 && <Text style={{ fontWeight: '700', color: colors.danger }}>₹{s.pending.toLocaleString()}</Text>}
                  {s.pending <= 0 && s.earned > 0 && <Text style={{ color: colors.success, fontWeight: '600' }}>✓</Text>}
                </View>
                {selected?.id === l.id && (
                  <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={{ fontSize: 12, color: colors.textLight }}>Bricks: {s.bricks.toLocaleString()} × ₹{l.perBrickRate} = <Text style={{ color: colors.success, fontWeight: '700' }}>₹{s.earned.toLocaleString()}</Text></Text>
                    <Text style={{ fontSize: 12, color: colors.textLight }}>Paid: ₹{s.paid.toLocaleString()}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: s.pending > 0 ? colors.danger : colors.success, marginTop: 4 }}>Pending: ₹{s.pending.toLocaleString()}</Text>
                    {/* All payments for this worker */}
                    {payments.filter(p => (p.labourId || p.labour?.id) === l.id).length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textLight, marginBottom: 4 }}>Payment History:</Text>
                        {payments.filter(p => (p.labourId || p.labour?.id) === l.id).map(p => (
                          <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                            <Text style={{ fontSize: 11, color: colors.textMuted }}>{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.danger }}>₹{p.amount?.toLocaleString()}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {tab === 'production' && (
        <>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.success }]} onPress={() => setShowProd(!showProd)}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{showProd ? '✕' : '+ Record Work'}</Text>
          </TouchableOpacity>
          {showProd && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                <Picker selectedValue={prodForm.labourId} onValueChange={v => { const l = labourList.find(x => x.id === v); setProdForm({ ...prodForm, labourId: v, rate: l?.perBrickRate?.toString() || '' }); }} style={{ color: colors.text }}>
                  <Picker.Item label="-- Select --" value="" />
                  {labourList.filter(l => l.type === 'PER_BRICK').map(l => <Picker.Item key={l.id} label={`${l.name} (₹${l.perBrickRate})`} value={l.id} />)}
                </Picker>
              </View>
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Quantity *" placeholderTextColor={colors.textMuted} value={prodForm.quantity} onChangeText={v => setProdForm({ ...prodForm, quantity: v })} keyboardType="numeric" />
              {prodForm.quantity && prodForm.rate && <Text style={{ color: colors.success, fontWeight: '700', marginBottom: 10 }}>{prodForm.quantity} × ₹{prodForm.rate} = ₹{(+prodForm.quantity * +prodForm.rate).toLocaleString()}</Text>}
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.success }]} onPress={addProd}><Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text></TouchableOpacity>
            </View>
          )}
          {productions.map(p => (
            <View key={p.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                  <Text style={{ fontWeight: '600', color: colors.text }}>{p.labour?.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{p.quantity?.toLocaleString()} bricks</Text>
                  <Text style={{ fontSize: 12, color: colors.success }}>₹{p.amount?.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {tab === 'payments' && (
        <>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.warning }]} onPress={() => setShowPay(!showPay)}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{showPay ? '✕' : '+ Give Money'}</Text>
          </TouchableOpacity>
          {showPay && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                <Picker selectedValue={payForm.labourId} onValueChange={v => setPayForm({ ...payForm, labourId: v })} style={{ color: colors.text }}>
                  <Picker.Item label="-- Select --" value="" />
                  {labourList.map(l => <Picker.Item key={l.id} label={l.name} value={l.id} />)}
                </Picker>
              </View>
              <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]} placeholder="Amount (₹) *" placeholderTextColor={colors.textMuted} value={payForm.amount} onChangeText={v => setPayForm({ ...payForm, amount: v })} keyboardType="numeric" />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.warning }]} onPress={addPay}><Text style={{ color: '#fff', fontWeight: '600' }}>Pay</Text></TouchableOpacity>
            </View>
          )}
          {payments.map(p => (
            <View key={p.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                  <Text style={{ fontWeight: '600', color: colors.text }}>{p.labour?.name}</Text>
                </View>
                <Text style={{ fontWeight: '700', fontSize: 16, color: colors.danger }}>₹{p.amount?.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {((tab === 'list' && labourList.length === 0) || (tab === 'production' && productions.length === 0) || (tab === 'payments' && payments.length === 0)) && <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 30 }}>No data</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  addBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  card: { borderRadius: 12, padding: spacing.md, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  pickerWrap: { borderWidth: 1, borderRadius: 10, marginBottom: 10 },
  entryCard: { borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1 },
});
