import React, { useState } from 'react';
import { InitialCapexItem } from '../types/hrOperations';
import { SalesMonth } from '../types/salesForecast';
import { formatNumberVi } from '../utils/hrCalculations';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Building, 
  RotateCcw, 
  AlertCircle, 
  Info,
  Calendar,
  Layers,
  Save
} from 'lucide-react';

interface InitialCapexModalProps {
  isOpen: boolean;
  onClose: () => void;
  capexItems: InitialCapexItem[];
  months?: SalesMonth[];
  onUpdateCapexItems: (items: InitialCapexItem[]) => void;
  onResetCapex: () => void;
  defaultDepreciationMonths?: number;
}

export const InitialCapexModal: React.FC<InitialCapexModalProps> = ({
  isOpen,
  onClose,
  capexItems,
  months,
  onUpdateCapexItems,
  onResetCapex,
  defaultDepreciationMonths = 12,
}) => {
  const [editingItem, setEditingItem] = useState<InitialCapexItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formAmount, setFormAmount] = useState<number>(5000000);
  const [formMonths, setFormMonths] = useState<number>(defaultDepreciationMonths);
  const [formDisbursement, setFormDisbursement] = useState(months?.[0]?.label || 'Tháng 9.2026');
  const [formCategory, setFormCategory] = useState<InitialCapexItem['category']>('software');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalCapex = capexItems.reduce((sum, item) => sum + item.amount, 0);
  const totalMonthlyDepreciation = capexItems.reduce((sum, item) => {
    if (item.depreciationMonths > 0) {
      return sum + Math.round(item.amount / item.depreciationMonths);
    }
    return sum;
  }, 0);

  const startEdit = (item: InitialCapexItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDetails(item.details || '');
    setFormAmount(item.amount);
    setFormMonths(item.depreciationMonths);
    setFormDisbursement(item.disbursementLabel || item.disbursementMonth || (months?.[0]?.label || 'Tháng 9.2026'));
    setFormCategory(item.category || 'software');
    setIsAddingNew(false);
  };

  const startAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormDetails('');
    setFormAmount(5000000);
    setFormMonths(defaultDepreciationMonths);
    setFormDisbursement(months?.[0]?.label || 'Tháng 9.2026');
    setFormCategory('office');
    setIsAddingNew(true);
  };

  const cancelForm = () => {
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    // Xác định chính xác ID và Nhãn tháng giải ngân
    const matchedMonth = months?.find(
      (m) =>
        m.label.toLowerCase() === formDisbursement.trim().toLowerCase() ||
        m.id.toLowerCase() === formDisbursement.trim().toLowerCase()
    );
    const disbMonthId = matchedMonth ? matchedMonth.id : (editingItem?.disbursementMonth || '2026-09');
    const disbLabel = matchedMonth ? matchedMonth.label : formDisbursement.trim();

    if (isAddingNew) {
      const newItem: InitialCapexItem = {
        id: `capex-${Date.now()}`,
        stt: capexItems.length + 1,
        name: formName.trim(),
        details: formDetails.trim(),
        amount: Number(formAmount) || 0,
        depreciationMonths: Number(formMonths) || 0,
        disbursementMonth: disbMonthId,
        disbursementLabel: disbLabel,
        category: formCategory,
      };
      onUpdateCapexItems([...capexItems, newItem]);
    } else if (editingItem) {
      const updated = capexItems.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              name: formName.trim(),
              details: formDetails.trim(),
              amount: Number(formAmount) || 0,
              depreciationMonths: Number(formMonths) || 0,
              disbursementMonth: disbMonthId,
              disbursementLabel: disbLabel,
              category: formCategory,
            }
          : it
      );
      onUpdateCapexItems(updated);
    }
    cancelForm();
  };

  const handleDelete = (id: string) => {
    const remaining = capexItems.filter((it) => it.id !== id);
    const reIndexed = remaining.map((it, idx) => ({ ...it, stt: idx + 1 }));
    onUpdateCapexItems(reIndexed);
    setDeleteConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-wide font-['Space_Grotesk']">
                  VỐN ĐẦU TƯ BAN ĐẦU (CAPEX)
                </h3>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {formatNumberVi(totalCapex)} đ
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Tài sản cố định, bản quyền phần mềm, chi phí pháp lý &amp; lịch trình trích khấu hao hàng tháng
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onResetCapex}
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

        {/* Sub-bar with Summary Metrics */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6 text-xs">
            <div>
              <span className="text-slate-500 block">Tổng Vốn Đầu Tư:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{formatNumberVi(totalCapex)} đ</span>
            </div>
            <div className="border-l border-slate-300 pl-4">
              <span className="text-slate-500 block">Khấu Hao Phân Bổ / Tháng:</span>
              <span className="font-bold text-amber-700 font-mono text-sm">{formatNumberVi(totalMonthlyDepreciation)} đ</span>
            </div>
            <div className="border-l border-slate-300 pl-4">
              <span className="text-slate-500 block">Số Hạng Mục:</span>
              <span className="font-bold text-slate-800">{capexItems.length} danh mục</span>
            </div>
          </div>

          <button
            onClick={startAdd}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Hạng Mục Đầu Tư</span>
          </button>
        </div>

        {/* Depreciation Policy Note */}
        <div className="bg-amber-50/70 border-b border-amber-200/80 px-6 py-2 flex items-center space-x-2 text-[11px] text-amber-900">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>
            <strong>Nguyên tắc trích khấu hao:</strong> Phân bổ đều từng tháng theo kỳ hạn khấu hao. Nếu kế hoạch bán hàng kết thúc trước kỳ hạn, phần giá trị còn lại chưa trích sẽ được tự động cộng dồn vào tháng cuối cùng của kế hoạch.
          </span>
        </div>

        {/* Form add/edit panel if active */}
        {(isAddingNew || editingItem) && (
          <form onSubmit={handleSaveForm} className="bg-amber-50/60 border-b border-amber-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <span>{isAddingNew ? 'Thêm Hạng Mục Đầu Tư Mới' : 'Chỉnh Sửa Hạng Mục'}</span>
              </h4>
              <button
                type="button"
                onClick={cancelForm}
                className="text-slate-500 hover:text-slate-700 text-xs"
              >
                Hủy bỏ
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tên Hạng Mục Đầu Tư</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Bộ phần mềm kế toán, Đăng ký thương hiệu..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Giá Trị Đầu Tư (VND)</label>
                <input
                  type="number"
                  step={500000}
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kỳ Hạn Khấu Hao (tháng)
                </label>
                <input
                  type="number"
                  value={formMonths}
                  onChange={(e) => setFormMonths(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {formMonths > 0
                    ? `Phân bổ ~${formatNumberVi(Math.round(formAmount / formMonths))} đ/tháng`
                    : 'Không trích khấu hao (chi phí ngay)'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Thời Gian Giải Ngân</label>
                {months && months.length > 0 ? (
                  <select
                    value={formDisbursement}
                    onChange={(e) => setFormDisbursement(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    {months.map((m) => (
                      <option key={m.id} value={m.label}>
                        {m.label} ({m.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formDisbursement}
                    onChange={(e) => setFormDisbursement(e.target.value)}
                    placeholder="VD: Tháng 9.2026"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ghi Chú Chi Tiết</label>
                <input
                  type="text"
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="VD: Chi tiết gói bản quyền 3 năm..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
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
                className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Hạng Mục</span>
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
                  <th className="py-3 px-4 min-w-[280px]">Hạng Mục Đầu Tư</th>
                  <th className="py-3 px-4 text-right min-w-[130px] font-bold">Giá Trị</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Tháng Khấu Hao</th>
                  <th className="py-3 px-3 text-center min-w-[130px]">Thời Gian Giải Ngân</th>
                  <th className="py-3 px-4 text-right min-w-[130px] text-amber-900 bg-amber-50/50">
                    Khấu Hao / Tháng
                  </th>
                  <th className="py-3 px-3 text-center w-[90px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {/* Dòng Tổng cộng hiển thị ở hàng đầu tiên hoặc chân bảng đúng format Excel */}
                <tr className="bg-amber-50/80 font-bold border-b border-amber-200 text-slate-900">
                  <td className="py-2.5 px-3 text-center font-mono"></td>
                  <td className="py-2.5 px-4 uppercase text-amber-950">Tổng Cộng Vốn Đầu Tư Ban Đầu</td>
                  <td className="py-2.5 px-4 text-right font-mono text-sm text-amber-950 font-bold">
                    {formatNumberVi(totalCapex)} đ
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-500">—</td>
                  <td className="py-2.5 px-3 text-center text-slate-500">—</td>
                  <td className="py-2.5 px-4 text-right font-mono text-amber-900 bg-amber-100/70">
                    {formatNumberVi(totalMonthlyDepreciation)} đ/tháng
                  </td>
                  <td></td>
                </tr>

                {capexItems.map((item, idx) => {
                  const monthlyDep = item.depreciationMonths > 0 
                    ? Math.round(item.amount / item.depreciationMonths) 
                    : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{item.stt || idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        {item.details && (
                          <div className="text-[11px] text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                            {item.details}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatNumberVi(item.amount)} đ
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {item.depreciationMonths > 0 ? `${item.depreciationMonths} tháng` : '0 (Không trích)'}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 font-medium">
                        {item.disbursementLabel || 'Tháng 9.2026'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-800 font-medium bg-amber-50/20">
                        {monthlyDep > 0 ? `${formatNumberVi(monthlyDep)} đ` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Sửa hạng mục này"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Xóa hạng mục này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Khấu hao tài sản ban đầu sẽ tự động được hạch toán vào bảng Tổng Hợp Định Phí Hàng Tháng của doanh nghiệp.
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
              <span>Xóa hạng mục đầu tư này?</span>
            </h4>
            <p className="text-xs text-slate-600 mt-2">
              Hạng mục đầu tư và giá trị khấu hao tương ứng sẽ bị gỡ bỏ khỏi mô hình tài chính.
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
