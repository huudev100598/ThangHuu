import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { UserPlus, Loader2 } from 'lucide-react';

interface Props {
  onSwitchLogin: () => void;
}

export function RegisterPage({ onSwitchLogin }: Props) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Mật khẩu tối thiểu 8 ký tự');
      return;
    }
    setBusy(true);
    const res = await register(email.trim(), password, fullName.trim());
    setBusy(false);
    if (!res.ok) setError(res.message || 'Đăng ký thất bại');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">Tạo tài khoản</h1>
            <p className="text-xs text-slate-500">Dùng email công ty để quản lý dự án tài chính</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Họ tên</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
            />
          </div>
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
              placeholder="Tối thiểu 8 ký tự"
              autoComplete="new-password"
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
            Đăng ký
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={onSwitchLogin}
            className="text-emerald-700 font-semibold hover:underline"
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
}
