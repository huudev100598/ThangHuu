import React, { useState } from 'react';
import { MonthlyOperatingExpense } from '../types/hrOperations';
import { SalesMonth } from '../types/salesForecast';
import { formatNumberVi } from '../utils/hrCalculations';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Boxes, 
  RotateCcw, 
  AlertCircle, 
  Save,
  Calendar,
  DollarSign
} from 'lucide-react';

interface MonthlyOpexModalProps {
  isOpen: boolean;
  onClose: () => void;
  opexItems: MonthlyOperatingExpense[];
  months?: SalesMonth[];
  onUpdateOpexItems: (items: MonthlyOperatingExpense[]) => void;
  onResetOpex: () => void;
}

export const MonthlyOpexModal: React.FC<MonthlyOpexModalProps> = ({
  isOpen,
  onClose,
  opexItems,
  months = [],
  onUpdateOpexItems,
  onResetOpex,
}) => {
  const [editingItem, setEditingItem] = useState<MonthlyOperatingExpense | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState<number>(1000000);
  const [formStartMonth, setFormStartMonth] = useState<string>(months[0]?.id || '2026-09');
  const [formCategory, setFormCategory] = useState<MonthlyOperatingExpense['category']>('warehouse');
  const [formNotes, setFormNotes] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalMonthlyOpex = opexItems.reduce((sum, item) => sum + item.amount, 0);

  const getMonthLabel = (monthId?: string) => {
    if (!monthId) return months[0]?.label || 'T9.2026';
    const found = months.find((m) => m.id === monthId || m.dateStr === monthId);
    return found ? found.label : monthId;
  };

  const startEdit = (item: MonthlyOperatingExpense) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormAmount(item.amount);
    setFormStartMonth(item.startMonth || months[0]?.id || '2026-09');
    setFormCategory(item.category || 'warehouse');
    setFormNotes(item.notes || '');
    setIsAddingNew(false);
  };

  const startAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormAmount(1000000);
    setFormStartMonth(months[0]?.id || '2026-09');
    setFormCategory('warehouse');
    setFormNotes('');
    setIsAddingNew(true);
  };

  const cancelForm = () => {
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (isAddingNew) {
      const newItem: MonthlyOperatingExpense = {
        id: `opex-${Date.now()}`,
        stt: opexItems.length + 1,
        name: formName.trim(),
        amount: Number(formAmount) || 0,
        startMonth: formStartMonth || (months[0]?.id || '2026-09'),
        category: formCategory,
        notes: formNotes.trim(),
      };
      onUpdateOpexItems([...opexItems, newItem]);
    } else if (editingItem) {
      const updated = opexItems.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              name: formName.trim(),
              amount: Number(formAmount) || 0,
              startMonth: formStartMonth || (months[0]?.id || '2026-09'),
              category: formCategory,
              notes: formNotes.trim(),
            }
          : it
      );
      onUpdateOpexItems(updated);
    }
    cancelForm();
  };

  const handleDelete = (id: string) => {
    const remaining = opexItems.filter((it) => it.id !== id);
    const reIndexed = remaining.map((it, idx) => ({ ...it, stt: idx + 1 }));
    onUpdateOpexItems(reIndexed);
    setDeleteConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-wide font-['Space_Grotesk']">
                  CHI PHÍ VẬN HÀNH HÀNG THÁNG (FIXED OPEX)
                </h3>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {formatNumberVi(totalMonthlyOpex)} đ / tháng
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Kho bãi, điện nước, hạ tầng IT &amp; chi phí quản lý cố định duy trì hoạt động
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onResetOpex}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 flex items-center space-x-1.5 transition-colors"
              title="Khôi phục danh mục mẫu theo bảng tính Mosh&Mode"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại mẫu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar with metrics */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6 text-xs">
            <div>
              <span className="text-slate-500 block">Tổng Chi Phí Vận Hành / Tháng:</span>
              <span className="font-bold text-blue-700 font-mono text-base">{formatNumberVi(totalMonthlyOpex)} đ</span>
            </div>
            <div className="border-l border-slate-300 pl-4">
              <span className="text-slate-500 block">Quy Mô Cả Năm (12 Tháng):</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{formatNumberVi(totalMonthlyOpex * 12)} đ</span>
            </div>
            <div className="border-l border-slate-300 pl-4">
              <span className="text-slate-500 block">Số Hạng Mục:</span>
              <span className="font-bold text-slate-800">{opexItems.length} danh mục</span>
            </div>
          </div>

          <button
            onClick={startAdd}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Hạng Mục Chi Phí</span>
          </button>
        </div>

        {/* Form add/edit panel if active */}
        {(isAddingNew || editingItem) && (
          <form onSubmit={handleSaveForm} className="bg-blue-50/60 border-b border-blue-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <span>{isAddingNew ? 'Thêm Hạng Mục Chi Phí Vận Hành Mới' : 'Chỉnh Sửa Hạng Mục'}</span>
              </h4>
              <button
                type="button"
                onClick={cancelForm}
                className="text-slate-500 hover:text-slate-700 text-xs"
              >
                Hủy bỏ
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tên Hạng Mục Chi Phí</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Tiền thuê kho, Chi phí điện nước kho..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Chi Phí Mỗi Tháng (VND)</label>
                <input
                  type="number"
                  step={100000}
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span>Bắt Đầu Từ Tháng</span>
                </label>
                {months && months.length > 0 ? (
                  <select
                    value={formStartMonth}
                    onChange={(e) => setFormStartMonth(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  >
                    {months.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} ({m.dateStr})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formStartMonth}
                    onChange={(e) => setFormStartMonth(e.target.value)}
                    placeholder="VD: 2026-09 hoặc T9.2026"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  />
                )}
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Không tính chi phí trước tháng này
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ghi Chú Mục Đích Sử Dụng</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="VD: Mặt bằng kho bảo quản & đóng gói đơn hàng..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={cancelForm}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Chi Phí</span>
              </button>
            </div>
          </form>
        )}

        {/* Table Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-3 w-[60px] text-center">STT</th>
                  <th className="py-3 px-4 min-w-[240px]">Hạng Mục Chi Phí</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">Bắt Đầu Từ</th>
                  <th className="py-3 px-4 text-right min-w-[130px] font-bold">Giá Trị / Tháng</th>
                  <th className="py-3 px-4 text-right min-w-[130px] text-slate-500">Quy Mô / Năm</th>
                  <th className="py-3 px-4 min-w-[200px]">Ghi Chú &amp; Chi Tiết</th>
                  <th className="py-3 px-3 text-center w-[90px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {/* Dòng Tổng chi phí vận hành tháng (Format Excel chuẩn từ ảnh chụp) */}
                <tr className="bg-blue-50/80 font-bold border-b border-blue-200 text-slate-900">
                  <td className="py-2.5 px-3 text-center font-mono"></td>
                  <td className="py-2.5 px-4 uppercase text-blue-950">Tổng Chi Phí Vận Hành Tháng</td>
                  <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">Cố định/tháng</td>
                  <td className="py-2.5 px-4 text-right font-mono text-base text-blue-950 font-bold">
                    {formatNumberVi(totalMonthlyOpex)} đ
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                    {formatNumberVi(totalMonthlyOpex * 12)} đ
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 text-[11px]">Cố định hàng tháng (Fixed Opex)</td>
                  <td></td>
                </tr>

                {opexItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{item.stt || idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{item.name}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {getMonthLabel(item.startMonth)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 text-sm">
                      {formatNumberVi(item.amount)} đ
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatNumberVi(item.amount * 12)} đ
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed">
                      {item.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa chi phí này"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Xóa chi phí này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Chi phí vận hành tháng sẽ tự động kết nối vào các báo cáo P&amp;L và Điểm Hòa Vốn (BEP).
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>Xóa hạng mục chi phí này?</span>
            </h4>
            <p className="text-xs text-slate-600 mt-2">
              Hạng mục chi phí vận hành sẽ bị gỡ khỏi định phí hàng tháng.
            </p>
            <div className="mt-4 flex items-center justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
