import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Linking, Modal } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api, { API_URL } from '../lib/api';

const { width, height } = Dimensions.get('window');
const AD_COOLDOWN = 2 * 60 * 1000; // 2 minutes
// Base URL without /api suffix for serving static files
const BASE_URL = API_URL.replace('/api', '');

interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
}

export default function AdOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkAndShowAd();
  }, []);

  const checkAndShowAd = async () => {
    try {
      const lastShown = await SecureStore.getItemAsync('ad_last_shown');
      if (lastShown && Date.now() - parseInt(lastShown) < AD_COOLDOWN) {
        onDismiss();
        return;
      }
      const { data } = await api.get('/super-admin/ads/active');
      if (data && data.id) {
        setAd(data);
        setVisible(true);
        await SecureStore.setItemAsync('ad_last_shown', Date.now().toString());
      } else {
        onDismiss();
      }
    } catch {
      onDismiss();
    }
  };

  useEffect(() => {
    if (!visible) return;
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, visible]);

  const handleSkip = () => {
    setVisible(false);
    onDismiss();
  };

  const handleAdPress = () => {
    if (ad?.linkUrl) Linking.openURL(ad.linkUrl).catch(() => {});
  };

  if (!visible || !ad) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleAdPress} style={styles.imageWrap}>
          <Image source={{ uri: `${BASE_URL}${ad.imageUrl}` }} style={styles.image} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.topBar}>
          <Text style={styles.adLabel}>Ad • {ad.title}</Text>
          {countdown > 0 ? (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{countdown}s</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip ✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  imageWrap: { width, height, justifyContent: 'center', alignItems: 'center' },
  image: { width: width * 0.95, height: height * 0.8 },
  topBar: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adLabel: { color: '#fff', fontSize: 13, opacity: 0.7 },
  countdownBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  countdownText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  skipBtn: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  skipText: { color: '#000', fontSize: 13, fontWeight: '700' },
});
