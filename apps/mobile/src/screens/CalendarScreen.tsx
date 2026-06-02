import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const { theme, activeFactory } = useAppStore();
  const colors = getColors(theme);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dateMap, setDateMap] = useState<Record<string, any>>({});
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [dayData, setDayData] = useState<any>(null);
  const [rangeData, setRangeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadMonth(); }, [currentMonth, currentYear, activeFactory]);

  const loadMonth = async () => {
    try {
      const { data } = await api.get('/reports/calendar', { params: { month: currentMonth + 1, year: currentYear, factoryId: activeFactory } });
      setDateMap(data.dates || {});
    } catch {}
  };

  const loadDay = async (dateStr: string) => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/calendar', { params: { date: dateStr, factoryId: activeFactory } });
      setDayData(data);
    } catch {} finally { setLoading(false); }
  };

  const loadRange = async (from: string, to: string) => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/calendar', { params: { from, to, factoryId: activeFactory } });
      setRangeData(data);
    } catch {} finally { setLoading(false); }
  };

  const handleDateClick = (dateStr: string) => {
    if (mode === 'single') {
      setSelectedDate(dateStr);
      setRangeStart(null); setRangeEnd(null); setRangeData(null);
      loadDay(dateStr);
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(dateStr); setRangeEnd(null); setRangeData(null); setDayData(null);
      } else {
        const end = dateStr > rangeStart ? dateStr : rangeStart;
        const start = dateStr > rangeStart ? rangeStart : dateStr;
        setRangeStart(start); setRangeEnd(end);
        loadRange(start, end);
      }
    }
  };

  const switchMode = (m: 'single' | 'range') => {
    setMode(m);
    setSelectedDate(null); setRangeStart(null); setRangeEnd(null);
    setDayData(null); setRangeData(null);
  };

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); };

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const isToday = (day: number) => { const t = new Date(); return day === t.getDate() && currentMonth === t.getMonth() && currentYear === t.getFullYear(); };
  const isInRange = (dateStr: string) => rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd;
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Mode Toggle */}
      <View style={[styles.modeToggle, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => switchMode('single')} style={[styles.modeBtn, mode === 'single' && { backgroundColor: colors.primary }]}>
          <Text style={{ color: mode === 'single' ? '#fff' : colors.textLight, fontSize: 13, fontWeight: '600' }}>📌 Single Date</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => switchMode('range')} style={[styles.modeBtn, mode === 'range' && { backgroundColor: colors.primary }]}>
          <Text style={{ color: mode === 'range' ? '#fff' : colors.textLight, fontSize: 13, fontWeight: '600' }}>📅 Date Range</Text>
        </TouchableOpacity>
      </View>

      {mode === 'range' && !rangeEnd && (
        <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: 8 }}>
          {!rangeStart ? 'Tap start date' : 'Now tap end date'}
        </Text>
      )}

      {/* Month Navigation */}
      <View style={[styles.monthNav, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text style={{ fontSize: 20, color: colors.text }}>‹</Text></TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{MONTHS[currentMonth]} {currentYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text style={{ fontSize: 20, color: colors.text }}>›</Text></TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map(d => <Text key={d} style={[styles.dayHeader, { color: colors.textMuted }]}>{d}</Text>)}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={i} style={styles.cell} />;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasData = dateMap[dateStr];
          const isSelected = selectedDate === dateStr || rangeStart === dateStr || rangeEnd === dateStr;
          const inRange = isInRange(dateStr);

          return (
            <TouchableOpacity key={i} onPress={() => handleDateClick(dateStr)} style={[styles.cell, {
              backgroundColor: isSelected ? colors.primary : inRange ? `${colors.primary}20` : 'transparent',
              borderWidth: isToday(day) && !isSelected ? 2 : 0,
              borderColor: colors.primary,
              borderRadius: 12,
            }]}>
              <Text style={{ fontSize: 15, fontWeight: isSelected || isToday(day) ? '700' : '500', color: isSelected ? '#fff' : inRange ? colors.primary : colors.text }}>{day}</Text>
              {hasData && (
                <View style={{ flexDirection: 'row', gap: 2, marginTop: 3 }}>
                  {hasData.production > 0 && <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : '#6C63FF' }]} />}
                  {hasData.sales > 0 && <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : '#10B981' }]} />}
                  {hasData.expenses > 0 && <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : '#EF4444' }]} />}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#6C63FF' }]} /><Text style={{ fontSize: 10, color: colors.textLight }}>Production</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#10B981' }]} /><Text style={{ fontSize: 10, color: colors.textLight }}>Sales</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#EF4444' }]} /><Text style={{ fontSize: 10, color: colors.textLight }}>Expense</Text></View>
      </View>

      {/* Loading */}
      {loading && <View style={[styles.detailCard, { backgroundColor: colors.surface, marginTop: 16 }]}><Text style={{ color: colors.textMuted, textAlign: 'center' }}>Loading...</Text></View>}

      {/* Single Date Details */}
      {!loading && dayData && mode === 'single' && (
        <View style={{ marginTop: 16 }}>
          <View style={[styles.dateHeader, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
              {new Date(dayData.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>{dayData.summary.totalBricks.toLocaleString()}</Text>
              <Text style={{ fontSize: 10, color: colors.textLight }}>🧱 Bricks</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.success }}>{fmt(dayData.summary.totalSales)}</Text>
              <Text style={{ fontSize: 10, color: colors.textLight }}>🚛 Sales</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.danger }}>{fmt(dayData.summary.totalExpenses)}</Text>
              <Text style={{ fontSize: 10, color: colors.textLight }}>💸 Expenses</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.warning }}>{fmt(dayData.summary.totalFuel)}</Text>
              <Text style={{ fontSize: 10, color: colors.textLight }}>⛽ Fuel</Text>
            </View>
          </View>

          {dayData.production.length > 0 && (
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 8 }}>🧱 Production</Text>
              {dayData.production.map((p: any) => (
                <View key={p.id} style={styles.detailRow}>
                  <Text style={{ fontSize: 13, color: colors.text }}>{p.brickType} <Text style={{ color: colors.textMuted, fontSize: 11 }}>({p.shift.replace('_', ' ')})</Text></Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{(p.firedCount || p.rawCount).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}

          {dayData.dispatches.length > 0 && (
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.success, marginBottom: 8 }}>🚛 Sales ({dayData.dispatches.length})</Text>
              {dayData.dispatches.map((d: any) => (
                <View key={d.id} style={styles.detailRow}>
                  <Text style={{ fontSize: 13, color: colors.text }}>{d.customer?.name} <Text style={{ color: colors.textMuted, fontSize: 11 }}>({d.quantity.toLocaleString()})</Text></Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.success }}>{fmt(d.amount)}</Text>
                </View>
              ))}
            </View>
          )}

          {dayData.expenditures.length > 0 && (
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger, marginBottom: 8 }}>💸 Expenses</Text>
              {dayData.expenditures.map((e: any) => (
                <View key={e.id} style={styles.detailRow}>
                  <Text style={{ fontSize: 13, color: colors.text }}>{e.category}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger }}>{fmt(e.amount)}</Text>
                </View>
              ))}
            </View>
          )}

          {dayData.fuel.length > 0 && (
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.warning, marginBottom: 8 }}>⛽ Fuel</Text>
              {dayData.fuel.map((f: any) => (
                <View key={f.id} style={styles.detailRow}>
                  <Text style={{ fontSize: 13, color: colors.text }}>{f.fuelType} ({f.quantity} {f.unit})</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.warning }}>{fmt(f.totalCost)}</Text>
                </View>
              ))}
            </View>
          )}

          {dayData.summary.totalBricks === 0 && dayData.summary.totalSales === 0 && dayData.summary.totalExpenses === 0 && dayData.summary.totalFuel === 0 && (
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <Text style={{ textAlign: 'center', color: colors.textMuted, padding: 20 }}>No activity on this date</Text>
            </View>
          )}
        </View>
      )}

      {/* Range Summary */}
      {!loading && rangeData && mode === 'range' && (
        <View style={{ marginTop: 16 }}>
          <View style={[styles.dateHeader, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
              {new Date(rangeStart!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(rangeEnd!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>{rangeData.summary.totalBricks.toLocaleString()}</Text>
              <Text style={{ fontSize: 10, color: colors.textLight }}>🧱 Bricks</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.success }}>{fmt(rangeData.summary.totalSales)}</Text>
              <Text style={{ fontSize: 10, color: colors.textLight }}>🚛 Sales</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.info }}>{fmt(rangeData.summary.totalReceived)}</Text>
              <Text style={{ fontSize: 10, color: colors.textLight }}>💰 Received</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.warning }}>{fmt(rangeData.summary.totalPending)}</Text>
              <Text style={{ fontSize: 10, color: colors.textLight }}>⚠️ Pending</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.danger }}>{fmt(rangeData.summary.totalExpenses)}</Text>
              <Text style={{ fontSize: 10, color: colors.textLight }}>💸 Expenses</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: rangeData.summary.netProfit >= 0 ? colors.success : colors.danger }}>{fmt(rangeData.summary.netProfit)}</Text>
              <Text style={{ fontSize: 10, color: colors.textLight }}>📊 Net Profit</Text>
            </View>
          </View>

          {/* Expense Breakdown */}
          {Object.keys(rangeData.expByCategory || {}).length > 0 && (
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger, marginBottom: 8 }}>💸 Expense Breakdown</Text>
              {Object.entries(rangeData.expByCategory).sort((a: any, b: any) => b[1] - a[1]).map(([cat, amt]: any) => (
                <View key={cat} style={styles.detailRow}>
                  <Text style={{ fontSize: 13, color: colors.text }}>{cat}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.danger }}>{fmt(amt)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Top Customers */}
          {rangeData.topCustomers?.length > 0 && (
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.success, marginBottom: 8 }}>👥 Top Customers</Text>
              {rangeData.topCustomers.map((c: any, i: number) => (
                <View key={i} style={styles.detailRow}>
                  <Text style={{ fontSize: 13, color: colors.text }}>{c.name}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.success }}>{fmt(c.amount)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Empty State */}
      {!loading && !dayData && !rangeData && (
        <View style={[styles.detailCard, { backgroundColor: colors.surface, marginTop: 16 }]}>
          <Text style={{ textAlign: 'center', fontSize: 32, marginBottom: 8 }}>📅</Text>
          <Text style={{ textAlign: 'center', fontWeight: '600', color: colors.text }}>
            {mode === 'single' ? 'Tap a date to see details' : 'Tap start & end date'}
          </Text>
          <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
            {mode === 'single' ? 'All activity for that day' : 'Get summary for selected period'}
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  modeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 12 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 12 },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayHeaders: { flexDirection: 'row', marginBottom: 4 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', padding: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateHeader: { padding: 14, borderRadius: 12, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  summaryCard: { width: '47%', borderRadius: 12, padding: 14, alignItems: 'center' },
  detailCard: { borderRadius: 12, padding: 14, marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F020' },
});
