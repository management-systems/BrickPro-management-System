import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function CreateClient() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '', factoryName: '', factoryLocation: '', plan: 'premium' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.password) { toast.error('Name, mobile, password required'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/clients', form);
      toast.success(`Client "${data.client.name}" created!`);
      navigate(`/clients/${data.client.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')}>← Back</button>
          <h1>Create New Admin / Client</h1>
        </div>
      </div>

      <div className="detail-card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Owner Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Rajesh Kumar" />
          </div>
          <div className="form-group">
            <label className="form-label">Mobile *</label>
            <input className="form-input" value={form.mobile} onChange={e => set('mobile', e.target.value)} required placeholder="9876543210" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="owner@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="Strong password" />
          </div>
          <div className="form-group">
            <label className="form-label">Factory Name</label>
            <input className="form-input" value={form.factoryName} onChange={e => set('factoryName', e.target.value)} placeholder="Main Factory" />
          </div>
          <div className="form-group">
            <label className="form-label">Factory Location</label>
            <input className="form-input" value={form.factoryLocation} onChange={e => set('factoryLocation', e.target.value)} placeholder="City, State" />
          </div>
          <div className="form-group">
            <label className="form-label">Plan</label>
            <select className="form-select" value={form.plan} onChange={e => set('plan', e.target.value)}>
              <option value="premium">Premium</option>
              <option value="basic">Basic</option>
              <option value="trial">Trial</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : '✓ Create Client & Admin User'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/clients')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
