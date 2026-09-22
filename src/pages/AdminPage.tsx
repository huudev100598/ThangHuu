import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  AuthUser,
  adminListUsers,
  adminSetUserRole,
  adminSetUserStatus,
} from '../api/authApi';
import { ArrowLeft, Loader2, Shield, Users } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function AdminPage({ onBack }: Props) {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await adminListUsers();
    if (res.success && res.data) {
      setUsers(res.data);
    } else {
      setError(res.message || 'Không tải được danh sách user');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Không có quyền truy cập.
      </div>
    );
  }

  const toggleStatus = async (u: AuthUser) => {
    if (u.id === user?.id) return;
    setBusyId(u.id);
    const next = u.status === 'active' ? 'disabled' : 'active';
    const res = await adminSetUserStatus(u.id, next);
    setBusyId(null);
    if (res.success) load();
    else setError(res.message || 'Cập nhật status thất bại');
  };

  const toggleRole = async (u: AuthUser) => {
    if (u.id === user?.id) return;
    setBusyId(u.id);
    const next = u.role === 'admin' ? 'user' : 'admin';
    const res = await adminSetUserRole(u.id, next);
    setBusyId(null);
    if (res.success) load();
    else setError(res.message || 'Cập nhật role thất bại');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại app
            </button>
          </div>
          <div className="flex items-center gap-2 text-emerald-800">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Admin Panel</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            <h1 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">Quản lý tài khoản</h1>
          </div>

          {error && (
            <div className="mx-5 mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-10 flex justify-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">ID</th>
                    <th className="text-left px-5 py-3 font-semibold">Họ tên</th>
                    <th className="text-left px-5 py-3 font-semibold">Email</th>
                    <th className="text-left px-5 py-3 font-semibold">Role</th>
                    <th className="text-left px-5 py-3 font-semibold">Status</th>
                    <th className="text-right px-5 py-3 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3 text-slate-500">{u.id}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{u.fullName}</td>
                      <td className="px-5 py-3 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            u.role === 'admin'
                              ? 'bg-violet-50 text-violet-800 border border-violet-200'
                              : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right space-x-2">
                        <button
                          type="button"
                          disabled={busyId === u.id || u.id === user?.id}
                          onClick={() => toggleRole(u)}
                          className="text-xs font-semibold text-violet-700 hover:underline disabled:opacity-40"
                        >
                          {u.role === 'admin' ? 'Hạ user' : 'Lên admin'}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === u.id || u.id === user?.id}
                          onClick={() => toggleStatus(u)}
                          className="text-xs font-semibold text-slate-700 hover:underline disabled:opacity-40"
                        >
                          {u.status === 'active' ? 'Vô hiệu' : 'Kích hoạt'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
