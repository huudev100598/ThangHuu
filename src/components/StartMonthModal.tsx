import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, AlertCircle, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { SalesMonth } from '../types/salesForecast';

interface StartMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonths: SalesMonth[];
  onApplyStartMonth: (startMonth: number, startYear: number) => void;
}

export const StartMonthModal: React.FC<StartMonthModalProps> = ({
  isOpen,
  onClose,
  currentMonths,
  onApplyStartMonth,
}) => {
  // Extract initial MM-YY from first month
  const getInitialValues = () => {
    if (currentMonths.length > 0 && currentMonths[0].dateStr) {
      const parts = currentMonths[0].dateStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) {
        return {
          month: m.toString().padStart(2, '0'),
          year: y.toString(),
          mmYy: `${m.toString().padStart(2, '0')}-${y.toString().slice(2)}`,
        };
      }
    }
    return {
      month: '01',
      year: '2025',
      mmYy: '01-25',
    };
  };

  const [selectedMonth, setSelectedMonth] = useState<string>('01');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [mmYyInput, setMmYyInput] = useState<string>('01-25');
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const init = getInitialValues();
      setSelectedMonth(init.month);
      setSelectedYear(init.year);
      setMmYyInput(init.mmYy);
      setError(null);
    }
  }, [isOpen, currentMonths]);

  if (!isOpen) return null;

  // Handle month dropdown change
  const handleMonthChange = (m: string) => {
    setSelectedMonth(m);
    const newMmYy = `${m}-${selectedYear.slice(2)}`;
    setMmYyInput(newMmYy);
    setError(null);
  };

  // Handle year dropdown change
  const handleYearChange = (y: string) => {
    setSelectedYear(y);
    const newMmYy = `${selectedMonth}-${y.slice(2)}`;
    setMmYyInput(newMmYy);
    setError(null);
  };

  // Handle direct MM-YY typing
  const handleMmYyInputChange = (val: string) => {
    setMmYyInput(val);
    const clean = val.trim();
    // Match patterns like "06-25", "6-25", "06/25", "0625"
    const regex = /^(\d{1,2})[-/]?(\d{2})$/;
    const match = clean.match(regex);
    if (match) {
      const m = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      if (m >= 1 && m <= 12) {
        const fullYear = 2000 + y;
        setSelectedMonth(m.toString().padStart(2, '0'));
        setSelectedYear(fullYear.toString());
        setError(null);
      } else {
        setError('Tháng phải nằm trong khoảng từ 01 đến 12');
      }
    } else if (clean.length >= 4) {
      setError('Định dạng hợp lệ là MM-YY (ví dụ: 06-25)');
    } else {
      setError(null);
    }
  };

  // Preset buttons
  const presets = ['01-25', '03-25', '06-25', '09-25', '10-25', '01-26', '03-26', '06-26'];
  const handleSelectPreset = (preset: string) => {
    const [mStr, yStr] = preset.split('-');
    const fullYear = `20${yStr}`;
    setSelectedMonth(mStr);
    setSelectedYear(fullYear);
    setMmYyInput(preset);
    setError(null);
  };

  // Calculate preview of all months based on selection
  const numMonths = Math.max(currentMonths.length, 1);
  const startM = parseInt(selectedMonth, 10);
  const startY = parseInt(selectedYear, 10);
  const previewMonths: { index: number; label: string; mmYy: string; dateStr: string }[] = [];

  for (let i = 0; i < numMonths; i++) {
    const totalM = startM + i;
    const yearAdd = Math.floor((totalM - 1) / 12);
    const m = ((totalM - 1) % 12) + 1;
    const y = startY + yearAdd;
    const mStr = m.toString().padStart(2, '0');
    const yStr = y.toString().slice(2);
    previewMonths.push({
      index: i + 1,
      label: `Tháng ${mStr}/${y}`,
      mmYy: `${mStr}-${yStr}`,
      dateStr: `${y}-${mStr}`,
    });
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(startM) || isNaN(startY) || startM < 1 || startM > 12) {
      setError('Vui lòng chọn hoặc nhập tháng/năm hợp lệ theo định dạng MM-YY');
      return;
    }
    onApplyStartMonth(startM, startY);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-slate-50 to-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk']">
                Thiết Lập Tháng Bắt Đầu Kinh Doanh
              </h3>
              <p className="text-xs text-slate-500">
                Chọn mốc thời gian bắt đầu theo định dạng <strong className="text-emerald-700 font-mono">MM-YY</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
          {/* Format MM-YY Input & Selectors */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tháng Bắt Đầu (Định Dạng MM-YY)</span>
              </label>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                {selectedMonth}-{selectedYear.slice(2)}
              </span>
            </div>

            {/* Direct MM-YY text input */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="text"
                  value={mmYyInput}
                  onChange={(e) => handleMmYyInputChange(e.target.value)}
                  placeholder="Nhập MM-YY (ví dụ: 06-25)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">
                  MM-YY
                </span>
              </div>
              {error && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Dual Selectors: Month (MM) & Year (YY) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Chọn Tháng (MM)
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const mNum = (i + 1).toString().padStart(2, '0');
                    return (
                      <option key={mNum} value={mNum}>
                        Tháng {mNum} ({mNum})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Chọn Năm (YY)
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  {['2024', '2025', '2026', '2027', '2028', '2029', '2030'].map((y) => (
                    <option key={y} value={y}>
                      Năm {y} ('{y.slice(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Gợi ý chọn nhanh (Presets):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => {
                  const isCurrent = mmYyInput.trim() === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Timeline Sequence Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xem Trước Chuỗi Thời Gian ({numMonths} Tháng):</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Tháng 1 đến Tháng {numMonths}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {previewMonths.map((pm, idx) => (
                <div
                  key={pm.dateStr}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-mono ${
                    idx === 0
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] text-slate-500">#{pm.index}</span>
                  <span>{pm.label}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                    {pm.mmYy}
                  </span>
                  {idx === 0 && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-600 text-white uppercase font-bold tracking-wider">
                      Bắt đầu
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 italic leading-relaxed">
              * Dữ liệu sản lượng đã nhập của từng cột tháng tương ứng sẽ được tự động giữ nguyên và gán liền mạch sang chuỗi thời gian mới.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Cập Nhật Tháng Bắt Đầu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
