import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const API = '/api/super-admin';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}`, 'Content-Type': 'application/json' });

export default function FactoryRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${API}/factory-requests`, { headers: headers() })
      .then(r => r.json()).then(setRequests).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const approve = async (id: string) => {
    const remarks = prompt('Remarks (optional):') || '';
    const res = await fetch(`${API}/factory-requests/${id}/approve`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ remarks }) });
    if (res.ok) { toast.success('Factory approved & created!'); load(); }
    else toast.error('Failed to approve');
  };

  const reject = async (id: string) => {
    const remarks = prompt('Reason for rejection:');
    if (!remarks) return;
    const res = await fetch(`${API}/factory-requests/${id}/reject`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ remarks }) });
    if (res.ok) { toast.success('Request rejected'); load(); }
    else toast.error('Failed to reject');
  };

  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🏭 Factory Requests</h2>

      {loading ? <p>Loading...</p> : (
        <>
          {pending.length === 0 && <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No pending requests</div>}

          {pending.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--warning)' }}>⏳ Pending Approval ({pending.length})</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {pending.map(r => (
                  <div key={r.id} className="card" style={{ padding: 16, border: '2px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{r.name}</div>
                        {r.location && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>📍 {r.location}</div>}
                        {r.capacityPerDay && <div style={{ fontSize: 13, color: 'var(--muted)' }}>⚡ Capacity: {r.capacityPerDay}/day</div>}
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                          👤 Client: <strong>{r.client?.name || 'Unknown'}</strong> ({r.client?.mobile || ''})
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          📅 {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => approve(r.id)} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => reject(r.id)} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {processed.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--muted)' }}>📋 History ({processed.length})</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {processed.map(r => (
                  <div key={r.id} className="card" style={{ padding: 12, opacity: 0.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>— {r.client?.name}</span>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: r.status === 'approved' ? '#dcfce7' : '#fee2e2', color: r.status === 'approved' ? '#166534' : '#991b1b' }}>
                        {r.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                      </span>
                    </div>
                    {r.adminRemarks && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>💬 {r.adminRemarks}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
