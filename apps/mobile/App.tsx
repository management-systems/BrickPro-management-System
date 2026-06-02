import 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text, StyleSheet, Platform, Alert, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/auth';
import { useAppStore } from './src/store/app';
import { colors, getColors } from './src/lib/theme';
import LoginScreen from './src/screens/LoginScreen';
import BlockedScreen from './src/screens/BlockedScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProductionScreen from './src/screens/ProductionScreen';
import DispatchScreen from './src/screens/DispatchScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import RawMaterialsScreen from './src/screens/RawMaterialsScreen';
import LabourScreen from './src/screens/LabourScreen';
import ExpenditureScreen from './src/screens/ExpenditureScreen';
import FuelScreen from './src/screens/FuelScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AdOverlay from './src/components/AdOverlay';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const drawerItems = [
  { name: 'Dashboard', icon: '🏠', label: 'Dashboard' },
  { name: 'Notifications', icon: '🔔', label: 'Notifications' },
  { name: 'Production', icon: '🧱', label: 'Production' },
  { name: 'Dispatch', icon: '🚛', label: 'Sell Bricks' },
  { name: 'Customers', icon: '👥', label: 'Customers' },
  { name: 'RawMaterials', icon: '🪨', label: 'Raw Materials' },
  { name: 'Labour', icon: '👷', label: 'Labour' },
  { name: 'Expenditure', icon: '💸', label: 'Expenditure' },
  { name: 'Fuel', icon: '⛽', label: 'Fuel' },
  { name: 'Reports', icon: '📊', label: 'Reports' },
  { name: 'Calendar', icon: '📅', label: 'Calendar' },
  { name: 'Settings', icon: '⚙️', label: 'Settings' },
];

function CustomDrawerContent(props: any) {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const { factories, activeFactory, setActiveFactory, theme, toggleTheme } = useAppStore();
  const c = getColors(theme);

  const handleLogout = () => {
    props.navigation.closeDrawer();
    setTimeout(() => {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]);
    }, 300);
  };

  const navigateTo = (name: string) => {
    props.navigation.closeDrawer();
    setTimeout(() => props.navigation.navigate(name), 100);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }} style={{ backgroundColor: c.bg }}>
        <View style={[styles.drawerHeader, { borderBottomColor: c.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.drawerBrand, { color: c.text }]}>🧱 BrickPro</Text>
            <TouchableOpacity onPress={toggleTheme} style={{ padding: 10 }}>
              <Text style={{ fontSize: 18 }}>{theme === 'light' ? '🌙' : '☀️'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.drawerUser, { color: c.textLight }]}>{user?.name}</Text>
          <Text style={[styles.drawerRole, { color: c.textMuted }]}>{user?.role}</Text>
        </View>

        {factories.length > 1 && (
          <View style={[styles.factorySection, { borderBottomColor: c.border }]}>
            <Text style={{ fontSize: 11, color: c.textMuted, paddingHorizontal: 16, paddingTop: 8, fontWeight: '600' }}>FACTORIES</Text>
            {factories.map(f => (
              <TouchableOpacity key={f.id} onPress={() => setActiveFactory(f.id)} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                <Text style={{ color: activeFactory === f.id ? c.primary : c.textMuted, fontSize: 13, fontWeight: activeFactory === f.id ? '600' : '400' }}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.drawerNav}>
          {drawerItems.map(item => {
            const isActive = props.state.routes[props.state.index]?.name === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => navigateTo(item.name)}
                activeOpacity={0.6}
                style={[styles.drawerItem, isActive && { backgroundColor: c.primaryLight }]}
              >
                <Text style={{ color: isActive ? c.primary : c.textLight, fontSize: 14, fontWeight: isActive ? '600' : '400' }}>
                  {item.icon}  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Footer outside ScrollView so it's always visible and tappable */}
      <View style={[styles.drawerFooter, { borderTopColor: c.border, backgroundColor: c.bg }]}>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.6} style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
          <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '600' }}>🚪  Logout</Text>
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', fontSize: 10, color: c.textMuted, paddingBottom: 10 }}>
          managementsystems.in
        </Text>
      </View>
    </View>
  );
}

function MainDrawer() {
  const theme = useAppStore(s => s.theme);
  const c = getColors(theme);
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: c.surface, elevation: 2, shadowOpacity: 0.05 },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        drawerStyle: { backgroundColor: c.bg, width: 280 },
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: '🏠 Dashboard' }} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: '🔔 Notifications' }} />
      <Drawer.Screen name="Production" component={ProductionScreen} options={{ title: '🧱 Production' }} />
      <Drawer.Screen name="Dispatch" component={DispatchScreen} options={{ title: '🚛 Sell Bricks' }} />
      <Drawer.Screen name="Customers" component={CustomersScreen} options={{ title: '👥 Customers' }} />
      <Drawer.Screen name="RawMaterials" component={RawMaterialsScreen} options={{ title: '🪨 Raw Materials' }} />
      <Drawer.Screen name="Labour" component={LabourScreen} options={{ title: '👷 Labour' }} />
      <Drawer.Screen name="Expenditure" component={ExpenditureScreen} options={{ title: '💸 Expenditure' }} />
      <Drawer.Screen name="Fuel" component={FuelScreen} options={{ title: '⛽ Fuel' }} />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ title: '📊 Reports' }} />
      <Drawer.Screen name="Calendar" component={CalendarScreen} options={{ title: '📅 Calendar' }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: '⚙️ Settings' }} />
    </Drawer.Navigator>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, info: any) {
    console.error('App Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>😵</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center' }}>Please restart the app. If the problem persists, contact support.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { user, loading, checkAuth, blocked } = useAuthStore();
  const loadFactories = useAppStore(s => s.loadFactories);
  const theme = useAppStore(s => s.theme);
  const [adDismissed, setAdDismissed] = useState(false);

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { if (user) loadFactories(); }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <Text style={{ fontSize: 56 }}>🧱</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#6C63FF', marginTop: 12 }}>BrickPro</Text>
        <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {user && !blocked && !adDismissed && (
            <AdOverlay onDismiss={() => setAdDismissed(true)} />
          )}
          <NavigationContainer>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
              {blocked ? (
                <Stack.Screen name="Blocked" component={BlockedScreen} />
              ) : user ? (
                <Stack.Screen name="Main" component={MainDrawer} />
              ) : (
                <Stack.Screen name="Login" component={LoginScreen} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  drawerHeader: { padding: 24, paddingTop: Platform.OS === 'ios' ? 8 : 16, borderBottomWidth: 1, marginBottom: 8 },
  drawerBrand: { fontSize: 20, fontWeight: '700' },
  drawerUser: { fontSize: 14, marginTop: 8 },
  drawerRole: { fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  factorySection: { borderBottomWidth: 1, paddingBottom: 8, marginBottom: 8 },
  drawerNav: { paddingTop: 4 },
  drawerItem: { borderRadius: 8, marginHorizontal: 8, marginVertical: 2, paddingHorizontal: 16, paddingVertical: 12 },
  drawerFooter: { borderTopWidth: 1, marginTop: 16, paddingTop: 8 },
});
