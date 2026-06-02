import { useEffect, useState } from 'react';
import api from '../lib/api';

const AD_COOLDOWN = 2 * 60 * 1000; // 2 minutes
const BACKEND_URL = window.location.origin;

interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
}

export default function AdOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const lastShown = localStorage.getItem('ad_last_shown');
    if (lastShown && Date.now() - parseInt(lastShown) < AD_COOLDOWN) {
      onDismiss();
      return;
    }
    api.get('/super-admin/ads/active')
      .then(({ data }) => {
        if (data && data.id) {
          setAd(data);
          localStorage.setItem('ad_last_shown', Date.now().toString());
        } else {
          onDismiss();
        }
      })
      .catch(() => onDismiss());
  }, []);

  useEffect(() => {
    if (!ad || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, ad]);

  if (!ad) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        {countdown > 0 ? (
          <span style={{ color: '#fff', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 20, fontSize: 14 }}>{countdown}s</span>
        ) : (
          <button onClick={() => { setAd(null); onDismiss(); }} style={{ background: '#fff', border: 'none', padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Skip ✕</button>
        )}
      </div>
      <a href={ad.linkUrl || '#'} target={ad.linkUrl ? '_blank' : undefined} rel="noopener noreferrer" style={{ maxWidth: '90%', maxHeight: '80vh' }}>
        <img src={`${BACKEND_URL}${ad.imageUrl}`} alt={ad.title} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }} />
      </a>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 12 }}>Ad • {ad.title}</p>
    </div>
  );
}
