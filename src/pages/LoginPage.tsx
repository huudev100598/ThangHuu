import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

interface Props {
  onSwitchRegister: () => void;
}

export function LoginPage({ onSwitchRegister }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await login(email.trim(), password);
    setBusy(false);
    if (!res.ok) setError(res.message || 'Đăng nhập thất bại');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">Đăng nhập</h1>
            <p className="text-xs text-slate-500">Mosh &amp; Mode CFO Financial Engine</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Đăng nhập
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={onSwitchRegister}
            className="text-emerald-700 font-semibold hover:underline"
          >
            Đăng ký
          </button>
        </p>
      </div>
    </div>
  );
}
