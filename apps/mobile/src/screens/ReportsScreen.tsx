import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ReportsScreen() {
  const { activeFactory, theme, lang } = useAppStore();
  const colors = getColors(theme);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [rawPurchases, setRawPurchases] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    api.get('/dispatch', { params: { factoryId: activeFactory } }).then(r => setDispatches(r.data)).catch(() => {});
    api.get('/expenditure', { params: { factoryId: activeFactory } }).then(r => setExpenditures(r.data)).catch(() => {});
    api.get('/raw-materials/purchases').then(r => setRawPurchases(r.data)).catch(() => {});
  }, [activeFactory]);

  const monthStart = new Date(filterYear, filterMonth - 1, 1);
  const monthEnd = new Date(filterYear, filterMonth, 0, 23, 59, 59);
  const inMonth = (d: string) => { const dt = new Date(d); return dt >= monthStart && dt <= monthEnd; };

  const mDisp = dispatches.filter(d => inMonth(d.date));
  const mExp = expenditures.filter(e => inMonth(e.date));
  const mRaw = rawPurchases.filter(p => inMonth(p.date));

  const totalSales = mDisp.reduce((s, d) => s + (d.amount || 0), 0);
  const totalReceived = mDisp.reduce((s, d) => s + (d.amountReceived || 0), 0);
  const totalExpense = mExp.reduce((s, e) => s + (e.amount || 0), 0);
  const totalRawCost = mRaw.reduce((s, p) => s + (p.totalCost || 0), 0);
  const netProfit = totalReceived - totalExpense - totalRawCost;

  // Expense by category
  const expByCat: Record<string, number> = {};
  mExp.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount; });

  // Top customers
  const custMap: Record<string, { qty: number; amt: number }> = {};
  mDisp.forEach(d => { const n = d.customer?.name || '?'; if (!custMap[n]) custMap[n] = { qty: 0, amt: 0 }; custMap[n].qty += d.quantity || 0; custMap[n].amt += d.amount || 0; });
  const topCust = Object.entries(custMap).sort((a, b) => b[1].amt - a[1].amt).slice(0, 5);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Month Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity key={i} onPress={() => setFilterMonth(i + 1)} style={[styles.chip, { backgroundColor: filterMonth === i + 1 ? colors.primary : colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: filterMonth === i + 1 ? '#fff' : colors.textLight, fontWeight: '600' }}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* P&L Summary */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 }}>📊 Profit & Loss</Text>
        <Row label="Sales (Income)" value={`₹${totalSales.toLocaleString()}`} color={colors.success} colors={colors} />
        <Row label="Received" value={`₹${totalReceived.toLocaleString()}`} color={colors.success} colors={colors} />
        <Row label="Expenses" value={`- ₹${totalExpense.toLocaleString()}`} color={colors.danger} colors={colors} />
        <Row label="Raw Material" value={`- ₹${totalRawCost.toLocaleString()}`} color={colors.danger} colors={colors} />
        <View style={{ borderTopWidth: 2, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 }}>
          <Row label="Net Profit" value={`₹${netProfit.toLocaleString()}`} color={netProfit >= 0 ? colors.success : colors.danger} colors={colors} bold />
        </View>
      </View>

      {/* Income - Green */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.success, marginBottom: 12 }}>🟢 Top Customers (Income)</Text>
        {topCust.length === 0 && <Text style={{ color: colors.textMuted }}>No sales</Text>}
        {topCust.map(([name, val]) => (
          <View key={name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text }}>{name}</Text>
              <Text style={{ fontSize: 11, color: colors.textLight }}>{val.qty.toLocaleString()} bricks</Text>
            </View>
            <Text style={{ fontWeight: '600', color: colors.success }}>₹{val.amt.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Expenses - Red */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger, marginBottom: 12 }}>🔴 Expenses Breakdown</Text>
        {Object.entries(expByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
          <View key={cat} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 13, color: colors.text }}>{cat}</Text>
            <Text style={{ fontWeight: '600', color: colors.danger }}>₹{amt.toLocaleString()}</Text>
          </View>
        ))}
        {Object.keys(expByCat).length === 0 && <Text style={{ color: colors.textMuted }}>No expenses</Text>}
      </View>

      {/* Raw Material - Red */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger, marginBottom: 12 }}>🔴 Raw Material Purchases</Text>
        <Row label="Total Cost" value={`₹${totalRawCost.toLocaleString()}`} color={colors.danger} colors={colors} />
        <Row label="Paid" value={`₹${mRaw.reduce((s, p) => s + (p.amountPaid || 0), 0).toLocaleString()}`} color={colors.success} colors={colors} />
        <Row label="Pending" value={`₹${mRaw.reduce((s, p) => s + (p.balanceDue || 0), 0).toLocaleString()}`} color={colors.danger} colors={colors} />
        {(() => {
          const matMap: Record<string, number> = {};
          mRaw.forEach(p => { matMap[p.material?.name || '?'] = (matMap[p.material?.name || '?'] || 0) + p.totalCost; });
          return Object.entries(matMap).sort((a, b) => b[1] - a[1]).map(([name, amt]) => (
            <View key={name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: colors.textLight }}>{name}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>₹{amt.toLocaleString()}</Text>
            </View>
          ));
        })()}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Row({ label, value, color, colors, bold }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: 13, color: colors.textLight, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ fontSize: bold ? 16 : 13, fontWeight: bold ? '700' : '600', color }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  card: { borderRadius: 12, padding: spacing.md, marginBottom: 16 },
});
