import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAppStore } from '../store/app';
import toast from 'react-hot-toast';

const ROLES = ['MANAGER', 'SUPERVISOR', 'OPERATOR', 'ACCOUNTANT', 'WORKER'];
const ALL_PERMISSIONS = ['production', 'dispatch', 'customers', 'raw_materials', 'fuel', 'labour', 'reports', 'settings'];

interface FactoryAssignment {
  factoryId: string;
  role: string;
  permissions: string[];
  factory?: { id: string; name: string };
}

interface UserItem {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  role: string;
  active: boolean;
  factories: FactoryAssignment[];
}

export default function Users() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const factories = useAppStore((s) => s.factories);

  // Add form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('WORKER');
  const [selectedFactories, setSelectedFactories] = useState<string[]>([]);
  const [addPermissions, setAddPermissions] = useState<Record<string, string[]>>({});

  // Edit form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editFactories, setEditFactories] = useState<FactoryAssignment[]>([]);

  const load = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch { /* empty */ }
  };

  useEffect(() => { load(); }, []);

  const resetAdd = () => {
    setName(''); setEmail(''); setMobile(''); setPin(''); setRole('WORKER');
    setSelectedFactories(factories.length === 1 ? [factories[0].id] : []);
    setAddPermissions({});
  };

  const toggleAddFactory = (fId: string) => {
    setSelectedFactories((prev) => {
      if (prev.includes(fId)) {
        const copy = { ...addPermissions };
        delete copy[fId];
        setAddPermissions(copy);
        return prev.filter((id) => id !== fId);
      }
      setAddPermissions({ ...addPermissions, [fId]: [] });
      return [...prev, fId];
    });
  };

  const toggleAddPermission = (fId: string, perm: string) => {
    setAddPermissions((prev) => {
      const current = prev[fId] || [];
      const has = current.includes(perm);
      return { ...prev, [fId]: has ? current.filter((p) => p !== perm) : [...current, perm] };
    });
  };

  const handleAdd = async () => {
    if (!name.trim()) return toast.error('Name required');
    if (!email.trim() && !mobile.trim()) return toast.error('Email or Mobile required');
    if (!pin || pin.length < 4) return toast.error('Enter 4-digit PIN');
    if (!selectedFactories.length) return toast.error('Select at least one factory');
    try {
      await api.post('/users', {
        name: name.trim(),
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
        password: pin,
        role,
        factories: selectedFactories.map((fId) => ({ factoryId: fId, role, permissions: addPermissions[fId] || [] })),
      });
      toast.success('User added!');
      setShowAdd(false);
      resetAdd();
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const openEdit = (u: UserItem) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email || '');
    setEditMobile(u.mobile || '');
    setEditRole(u.role);
    setEditPin('');
    setEditFactories(u.factories.map((f) => ({
      factoryId: f.factoryId || f.factory?.id || '',
      role: f.role,
      permissions: f.permissions || [],
      factory: f.factory,
    })));
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      await api.patch(`/users/${editUser.id}`, {
        name: editName,
        email: editEmail || undefined,
        mobile: editMobile || undefined,
        role: editRole,
        ...(editPin ? { password: editPin } : {}),
      });
      // Update factory assignments
      await api.put(`/users/${editUser.id}/factories`, {
        factories: editFactories.map((f) => ({
          factoryId: f.factoryId,
          role: f.role,
          permissions: f.permissions,
        })),
      });
      toast.success('User updated!');
      setEditUser(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const toggleFactoryInEdit = (factoryId: string) => {
    const exists = editFactories.find((f) => f.factoryId === factoryId);
    if (exists) {
      setEditFactories(editFactories.filter((f) => f.factoryId !== factoryId));
    } else {
      setEditFactories([...editFactories, { factoryId, role: editRole, permissions: [], factory: factories.find((f) => f.id === factoryId) as any }]);
    }
  };

  const togglePermission = (factoryId: string, perm: string) => {
    setEditFactories(editFactories.map((f) => {
      if (f.factoryId !== factoryId) return f;
      const has = f.permissions.includes(perm);
      return { ...f, permissions: has ? f.permissions.filter((p) => p !== perm) : [...f.permissions, perm] };
    }));
  };

  const toggleActive = async (u: UserItem) => {
    try {
      await api.patch(`/users/${u.id}`, { active: !u.active });
      toast.success(u.active ? 'User disabled' : 'User enabled');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>👤 Users</h2>
        <button onClick={() => { setShowAdd(true); resetAdd(); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>+ Add</button>
      </div>

      {users.length === 0 && <p style={{ color: '#999', textAlign: 'center', marginTop: 40 }}>No users yet</p>}

      {users.map((u) => (
        <div key={u.id} className="card" style={{ marginBottom: 10, opacity: u.active ? 1 : 0.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {u.email}{u.mobile && ` • ${u.mobile}`}
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                {u.factories.map((f) => f.factory?.name).filter(Boolean).join(', ')}
              </div>
              {u.factories.length > 0 && u.factories[0]?.permissions?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                  {[...new Set(u.factories.flatMap((f) => f.permissions || []))].map((p) => (
                    <span key={p} style={{ fontSize: 9, background: '#e8f5e9', color: '#2e7d32', padding: '1px 6px', borderRadius: 8 }}>{p.replace('_', ' ')}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, background: u.role === 'OWNER' ? '#C0392B' : '#3498db', color: 'white', padding: '2px 8px', borderRadius: 4 }}>{u.role}</span>
              {u.role !== 'OWNER' && (
                <>
                  <button onClick={() => openEdit(u)} style={{ background: '#f0f0f0', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => toggleActive(u)} style={{ background: u.active ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
                    {u.active ? 'Off' : 'On'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Add User Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '100%', maxWidth: 380, maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginBottom: 16 }}>Add User</h3>
            <div className="form-group">
              <label>Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Email {!mobile ? '*' : ''}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@email.com" />
            </div>
            <div className="form-group">
              <label>Mobile {!email ? '*' : ''}</label>
              <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={10} placeholder="10-digit mobile" />
            </div>
            <p style={{ fontSize: 11, color: '#999', margin: '-8px 0 8px' }}>* At least one of Email or Mobile is required. Both must be unique.</p>
            <div className="form-group">
              <label>4-Digit PIN *</label>
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" maxLength={4} style={{ letterSpacing: 8, textAlign: 'center', fontSize: 20 }} />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Assign to Factories & Pages *</label>
              {factories.map((f) => {
                const isSelected = selectedFactories.includes(f.id);
                return (
                  <div key={f.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleAddFactory(f.id)} />
                      {f.name}
                    </label>
                    {isSelected && (
                      <div style={{ marginTop: 8, paddingLeft: 24 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ALL_PERMISSIONS.map((perm) => (
                            <button key={perm} type="button" onClick={() => toggleAddPermission(f.id, perm)}
                              style={{
                                padding: '4px 10px', fontSize: 11, borderRadius: 12, cursor: 'pointer', border: 'none',
                                background: (addPermissions[f.id] || []).includes(perm) ? '#27ae60' : '#eee',
                                color: (addPermissions[f.id] || []).includes(perm) ? 'white' : '#666',
                              }}>
                              {perm.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} style={{ flex: 1, padding: 12, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Add User</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '100%', maxWidth: 420, maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginBottom: 16 }}>Edit: {editUser.name}</h3>
            <div className="form-group">
              <label>Name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input type="tel" value={editMobile} onChange={(e) => setEditMobile(e.target.value)} maxLength={10} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>New PIN (leave blank to keep)</label>
              <input type="password" value={editPin} onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" maxLength={4} style={{ letterSpacing: 8, textAlign: 'center', fontSize: 20 }} />
            </div>

            {/* Factory Assignments with Permissions */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Factory Access & Permissions</label>
              {factories.map((f) => {
                const assignment = editFactories.find((ef) => ef.factoryId === f.id);
                const isAssigned = !!assignment;
                return (
                  <div key={f.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                      <input type="checkbox" checked={isAssigned} onChange={() => toggleFactoryInEdit(f.id)} />
                      {f.name}
                    </label>
                    {isAssigned && (
                      <div style={{ marginTop: 8, paddingLeft: 24 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ALL_PERMISSIONS.map((perm) => (
                            <button key={perm} onClick={() => togglePermission(f.id, perm)}
                              style={{
                                padding: '4px 10px', fontSize: 11, borderRadius: 12, cursor: 'pointer', border: 'none',
                                background: assignment!.permissions.includes(perm) ? '#27ae60' : '#eee',
                                color: assignment!.permissions.includes(perm) ? 'white' : '#666',
                              }}>
                              {perm.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setEditUser(null)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ flex: 1, padding: 12, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
