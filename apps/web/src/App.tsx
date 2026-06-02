import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth';
import { useAppStore } from './store/app';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Blocked from './pages/Blocked';
import Dashboard from './pages/Dashboard';
import Production from './pages/Production';
import Dispatch from './pages/Dispatch';
import Customers from './pages/Customers';
import RawMaterials from './pages/RawMaterials';
import More from './pages/More';
import Users from './pages/Users';
import Labour from './pages/Labour';
import Expenditure from './pages/Expenditure';
import Fuel from './pages/Fuel';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import EditHistory from './pages/EditHistory';
import Invoice from './pages/Invoice';
import AdOverlay from './components/AdOverlay';

function ProtectedLayout() {
  const loadFactories = useAppStore((s) => s.loadFactories);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adDismissed, setAdDismissed] = useState(false);

  useEffect(() => { loadFactories(); }, []);

  return (
    <>
      {!adDismissed && <AdOverlay onDismiss={() => setAdDismissed(true)} />}
      <div className="app-layout">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-main">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <Outlet />
          <BottomNav />
        </div>
      </div>
    </>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const user = useAuthStore((s) => s.user);
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => { checkAuth(); }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><span style={{ fontSize: 48 }}>🧱</span></div>;

  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/blocked" element={<Blocked />} />
        <Route element={<RequireAuth><ProtectedLayout /></RequireAuth>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/production" element={<Production />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/raw-materials" element={<RawMaterials />} />
          <Route path="/more" element={<More />} />
          <Route path="/users" element={<Users />} />
          <Route path="/labour" element={<Labour />} />
          <Route path="/expenditure" element={<Expenditure />} />
          <Route path="/fuel" element={<Fuel />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/edit-history" element={<EditHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/invoice" element={<Invoice />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
