import React, { useState } from 'react';
import { Calendar, Plus, X, AlertCircle } from 'lucide-react';
import { SalesMonth } from '../types/salesForecast';

interface AddMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMonths: SalesMonth[];
  onAddMonth: (newMonth: SalesMonth) => void;
}

export const AddMonthModal: React.FC<AddMonthModalProps> = ({
  isOpen,
  onClose,
  existingMonths,
  onAddMonth,
}) => {
  // Compute default next month
  const getDefaultNextMonth = () => {
    if (existingMonths.length === 0) return '2025-01';
    const last = existingMonths[existingMonths.length - 1].dateStr;
    const [yearStr, monthStr] = last.split('-');
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    return `${y}-${m.toString().padStart(2, '0')}`;
  };

  const [dateStr, setDateStr] = useState<string>(getDefaultNextMonth());
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateStr) {
      setError('Vui lòng chọn tháng/năm');
      return;
    }

    const isDuplicate = existingMonths.some((m) => m.dateStr === dateStr);
    if (isDuplicate) {
      setError(`Tháng ${dateStr} đã tồn tại trong kế hoạch`);
      return;
    }

    const [year, month] = dateStr.split('-');
    const label = `Tháng ${month}/${year}`;
    onAddMonth({
      id: dateStr,
      dateStr,
      label,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                Thêm Cột Tháng/Năm Mới
              </h3>
              <p className="text-xs text-slate-500">
                Mở rộng kỳ kế hoạch sản lượng bán hàng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Chọn Tháng/Năm Kế Hoạch <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-slate-500 font-normal">Định dạng YYYY-MM</span>
            </label>
            <div className="flex items-center rounded-xl bg-white border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 p-2.5">
              <input
                type="month"
                value={dateStr}
                onChange={(e) => {
                  setDateStr(e.target.value);
                  setError('');
                }}
                className="w-full bg-transparent text-sm text-slate-900 font-mono focus:outline-none cursor-pointer"
                required
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">💡 Gợi ý quy trình tài chính:</div>
            <p className="text-[11px] leading-relaxed">
              Thêm tháng mới sẽ tự động mở thêm một cột nhập sản lượng tương ứng cho toàn bộ danh mục SKU (tự link từ Tab 2).
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Cột Tháng</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
