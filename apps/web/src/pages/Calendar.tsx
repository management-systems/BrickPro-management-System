import { useEffect, useState } from 'react';
import { useAppStore } from '../store/app';
import api from '../lib/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
  const lang = useAppStore(s => s.lang);
  const activeFactory = useAppStore(s => s.activeFactory);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dateMap, setDateMap] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'range'>('single');
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

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); };
  const goToday = () => { setCurrentMonth(new Date().getMonth()); setCurrentYear(new Date().getFullYear()); };

  // Build calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const isInRange = (dateStr: string) => rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd;
  const isToday = (day: number) => { const t = new Date(); return day === t.getDate() && currentMonth === t.getMonth() && currentYear === t.getFullYear(); };
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>📅 {lang === 'en' ? 'Calendar' : 'कैलेंडर'}</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('single')} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', background: mode === 'single' ? 'var(--primary)' : 'var(--surface)', color: mode === 'single' ? '#fff' : 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Single Date</button>
          <button onClick={() => setMode('range')} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', background: mode === 'range' ? 'var(--primary)' : 'var(--surface)', color: mode === 'range' ? '#fff' : 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Date Range</button>
        </div>
      </div>

      {mode === 'range' && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Click start date, then click end date</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Calendar Grid */}
        <div>
          <div className="card" style={{ padding: 20 }}>
            {/* Month Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button onClick={prevMonth} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>‹</button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{MONTHS[currentMonth]} {currentYear}</div>
                <button onClick={goToday} style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}>Today</button>
              </div>
              <button onClick={nextMonth} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>›</button>
            </div>

            {/* Day Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: 4 }}>{d}</div>)}
            </div>

            {/* Date Cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasData = dateMap[dateStr];
                const isSelected = selectedDate === dateStr || rangeStart === dateStr || rangeEnd === dateStr;
                const inRange = isInRange(dateStr);

                return (
                  <div key={i} onClick={() => handleDateClick(dateStr)} style={{
                    textAlign: 'center', padding: '8px 4px', borderRadius: 10, cursor: 'pointer', position: 'relative',
                    background: isSelected ? 'var(--primary)' : inRange ? 'rgba(108,99,255,0.1)' : isToday(day) ? 'var(--bg)' : 'transparent',
                    color: isSelected ? '#fff' : 'var(--text)',
                    border: isToday(day) && !isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: isSelected || isToday(day) ? 700 : 500 }}>{day}</div>
                    {/* Activity Dots */}
                    {hasData && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 3 }}>
                        {hasData.production > 0 && <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : '#6C63FF' }} />}
                        {hasData.sales > 0 && <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : '#10B981' }} />}
                        {hasData.expenses > 0 && <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : '#EF4444' }} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-light)' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6C63FF' }} /> Production</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-light)' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Sales</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-light)' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> Expense</span>
            </div>
          </div>
        </div>

        {/* Right Panel — Details */}
        <div>
          {loading && <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}

          {/* Single Date Details */}
          {!loading && dayData && mode === 'single' && (
            <div>
              <div className="card" style={{ padding: 16, marginBottom: 12, background: 'var(--primary)', color: '#fff', borderRadius: 14 }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Selected Date</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{new Date(dayData.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{dayData.summary.totalBricks.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>🧱 Bricks</div>
                </div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{fmt(dayData.summary.totalSales)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>🚛 Sales</div>
                </div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>{fmt(dayData.summary.totalExpenses)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>💸 Expenses</div>
                </div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>{fmt(dayData.summary.totalFuel)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>⛽ Fuel</div>
                </div>
              </div>

              {/* Production Details */}
              {dayData.production.length > 0 && (
                <div className="card" style={{ padding: 14, marginBottom: 10 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--primary)' }}>🧱 Production</h4>
                  {dayData.production.map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                      <span>{p.brickType} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({p.shift.replace('_', ' ')})</span></span>
                      <strong>{(p.firedCount || p.rawCount).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Sales Details */}
              {dayData.dispatches.length > 0 && (
                <div className="card" style={{ padding: 14, marginBottom: 10 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--success)' }}>🚛 Sales ({dayData.dispatches.length} challans)</h4>
                  {dayData.dispatches.map((d: any) => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                      <span>{d.customer?.name} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({d.quantity.toLocaleString()} bricks)</span></span>
                      <strong style={{ color: 'var(--success)' }}>{fmt(d.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Expenses Details */}
              {dayData.expenditures.length > 0 && (
                <div className="card" style={{ padding: 14, marginBottom: 10 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--danger)' }}>💸 Expenses</h4>
                  {dayData.expenditures.map((e: any) => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                      <span>{e.category} {e.paidTo && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({e.paidTo})</span>}</span>
                      <strong style={{ color: 'var(--danger)' }}>{fmt(e.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Fuel Details */}
              {dayData.fuel.length > 0 && (
                <div className="card" style={{ padding: 14, marginBottom: 10 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--warning)' }}>⛽ Fuel</h4>
                  {dayData.fuel.map((f: any) => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                      <span>{f.fuelType} ({f.quantity} {f.unit})</span>
                      <strong style={{ color: 'var(--warning)' }}>{fmt(f.totalCost)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {dayData.summary.totalBricks === 0 && dayData.summary.totalSales === 0 && dayData.summary.totalExpenses === 0 && (
                <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>No activity on this date</div>
              )}
            </div>
          )}

          {/* Range Summary */}
          {!loading && rangeData && mode === 'range' && (
            <div>
              <div className="card" style={{ padding: 16, marginBottom: 12, background: 'linear-gradient(135deg, var(--primary), #4ECDC4)', color: '#fff', borderRadius: 14 }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Date Range</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {new Date(rangeStart!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(rangeEnd!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{rangeData.summary.totalBricks.toLocaleString()}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>🧱 Bricks Made</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{fmt(rangeData.summary.totalSales)}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>🚛 Total Sales</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--info)' }}>{fmt(rangeData.summary.totalReceived)}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>💰 Received</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>{fmt(rangeData.summary.totalPending)}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>⚠️ Pending</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>{fmt(rangeData.summary.totalExpenses)}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>💸 Expenses</div></div>
                <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: rangeData.summary.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(rangeData.summary.netProfit)}</div><div style={{ fontSize: 11, color: 'var(--text-light)' }}>📊 Net Profit</div></div>
              </div>

              {/* Expense Breakdown */}
              {Object.keys(rangeData.expByCategory || {}).length > 0 && (
                <div className="card" style={{ padding: 14, marginBottom: 10 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💸 Expense Breakdown</h4>
                  {Object.entries(rangeData.expByCategory).sort((a: any, b: any) => b[1] - a[1]).map(([cat, amt]: any) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                      <span>{cat}</span><strong style={{ color: 'var(--danger)' }}>{fmt(amt)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Customers */}
              {rangeData.topCustomers?.length > 0 && (
                <div className="card" style={{ padding: 14 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>👥 Top Customers</h4>
                  {rangeData.topCustomers.map((c: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                      <span>{c.name}</span><strong style={{ color: 'var(--success)' }}>{fmt(c.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !dayData && !rangeData && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{mode === 'single' ? 'Click a date to see details' : 'Select start & end date'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>All production, sales, expenses for that day will appear here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
