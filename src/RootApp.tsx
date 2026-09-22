import React, { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import App from './App';
import { Loader2 } from 'lucide-react';

type Screen = 'app' | 'admin' | 'login' | 'register';

export default function RootApp() {
  const { user, loading, isAdmin, logout } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [screen, setScreen] = useState<Screen>('app');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onSwitchRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchLogin={() => setAuthView('login')} />
    );
  }

  if (screen === 'admin' && isAdmin) {
    return <AdminPage onBack={() => setScreen('app')} />;
  }

  return (
    <App
      currentUser={user}
      isAdmin={isAdmin}
      onOpenAdmin={() => setScreen('admin')}
      onLogout={logout}
    />
  );
}
