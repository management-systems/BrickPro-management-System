import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Platform, Alert, Animated, PanResponder } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '../store/app';
import { getColors, spacing } from '../lib/theme';
import api from '../lib/api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }),
});

export default function NotificationsScreen() {
  const { theme } = useAppStore();
  const colors = getColors(theme);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const lastCheckRef = useRef<string | null>(null);

  const load = async () => {
    try {
      const { data } = await api.get('/reports/notifications');
      // Show local push for new unread notifications
      if (lastCheckRef.current) {
        const newOnes = data.filter((n: any) => !n.read && new Date(n.createdAt) > new Date(lastCheckRef.current!));
        newOnes.forEach((n: any) => {
          Notifications.scheduleNotificationAsync({
            content: { title: n.title, body: n.message, sound: true },
            trigger: null,
          });
        });
      }
      lastCheckRef.current = new Date().toISOString();
      setNotifications(data);
    } catch {}
  };

  useEffect(() => {
    registerForPushNotifications();
    load();
    const interval = setInterval(load, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const markRead = async (id: string) => {
    await api.patch(`/reports/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismissNotification = async (id: string) => {
    await api.patch(`/reports/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    Alert.alert('Clear All', 'Clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', onPress: async () => {
        const unread = notifications.filter(n => !n.read);
        await Promise.all(unread.map(n => api.patch(`/reports/notifications/${n.id}/read`).catch(() => {})));
        setNotifications([]);
      }},
    ]);
  };

  const typeIcons: any = { info: 'ℹ️', warning: '⚠️', promo: '🎉', update: '🔄' };
  const typeColors: any = { info: '#3b82f6', warning: '#f59e0b', promo: '#10b981', update: '#6C63FF' };
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header with clear button */}
      {notifications.length > 0 && (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>{unreadCount} unread</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={clearAll} style={[styles.clearBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>✓ Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingTop: 8 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map(n => (
            <SwipeToDelete key={n.id} onDelete={() => dismissNotification(n.id)} colors={colors}>
              <TouchableOpacity onPress={() => markRead(n.id)} style={[styles.card, { backgroundColor: n.read ? colors.surface : colors.primaryLight, borderColor: colors.border, borderLeftColor: typeColors[n.type] || colors.primary }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Text style={{ fontSize: 16 }}>{typeIcons[n.type] || '🔔'}</Text>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{n.title}</Text>
                  </View>
                  {!n.read && <View style={styles.dot} />}
                </View>
                <Text style={[styles.message, { color: colors.textLight }]}>{n.message}</Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
            </SwipeToDelete>
          ))
        )}
      </ScrollView>
    </View>
  );
}

async function registerForPushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'BrickPro',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
      sound: 'default',
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;
}

// Swipe to delete component
function SwipeToDelete({ children, onDelete, colors }: { children: React.ReactNode; onDelete: () => void; colors: any }) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -100) {
          Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(onDelete);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={{ position: 'relative', marginBottom: 10 }}>
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, backgroundColor: '#ef4444', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>🗑 Remove</Text>
      </View>
      <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX }] }}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  card: { borderRadius: 12, padding: 16, borderWidth: 1, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 14, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  message: { fontSize: 13, lineHeight: 20 },
  time: { fontSize: 11, marginTop: 8 },
});
