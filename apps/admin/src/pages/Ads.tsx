import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const BACKEND_URL = '';

interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  active: boolean;
  createdAt: string;
}

export default function Ads() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAds = async () => {
    const { data } = await api.get('/ads');
    setAds(data);
  };

  useEffect(() => { fetchAds(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!title) { toast.error('Title required'); return; }
    if (!editingId && !file) { toast.error('Image file required'); return; }

    const formData = new FormData();
    formData.append('title', title);
    if (linkUrl) formData.append('linkUrl', linkUrl);
    if (file) formData.append('image', file);

    try {
      if (editingId) {
        await api.patch(`/ads/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Ad updated');
      } else {
        await api.post('/ads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Ad created');
      }
      setTitle(''); setLinkUrl(''); setEditingId(null); setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchAds();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const toggleActive = async (ad: Ad) => {
    const formData = new FormData();
    formData.append('active', String(!ad.active));
    await api.patch(`/ads/${ad.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    toast.success(ad.active ? 'Ad disabled' : 'Ad enabled');
    fetchAds();
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    await api.delete(`/ads/${id}`);
    toast.success('Deleted');
    fetchAds();
  };

  const startEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setTitle(ad.title);
    setLinkUrl(ad.linkUrl || '');
    setPreview(`${BACKEND_URL}${ad.imageUrl}`);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>📢 Ads Management</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 13 }}>
        Upload ad images. Only 1 active ad is shown to users once per hour.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>Title</label>
          <input className="input" placeholder="Ad Title" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>Image</label>
          <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="input" style={{ padding: 8 }} />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>Link Path (optional, e.g. /offers)</label>
          <input className="input" placeholder="/offers" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit">{editingId ? 'Update' : 'Add Ad'}</button>
        {editingId && <button className="btn btn-ghost" type="button" onClick={() => { setEditingId(null); setTitle(''); setLinkUrl(''); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}>Cancel</button>}
      </form>

      {preview && (
        <div style={{ marginBottom: 20, padding: 12, background: 'var(--surface)', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Preview</p>
          <img src={preview} alt="Preview" style={{ maxWidth: 300, maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} />
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {ads.map(ad => (
          <div key={ad.id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, opacity: ad.active ? 1 : 0.5 }}>
            <img src={`${BACKEND_URL}${ad.imageUrl}`} alt={ad.title} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, background: '#eee' }} onError={e => (e.currentTarget.style.display = 'none')} />
            <div style={{ flex: 1 }}>
              <strong>{ad.title}</strong>
              {ad.linkUrl && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Link: {ad.linkUrl}</p>}
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {ad.active ? '🟢 Active' : '🔴 Inactive'} • {new Date(ad.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => toggleActive(ad)}>{ad.active ? 'Disable' : 'Enable'}</button>
              <button className="btn btn-ghost" onClick={() => startEdit(ad)}>Edit</button>
              <button className="btn btn-ghost" style={{ color: '#ef4444' }} onClick={() => deleteAd(ad.id)}>Delete</button>
            </div>
          </div>
        ))}
        {ads.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No ads yet. Upload one above.</p>}
      </div>
    </div>
  );
}
