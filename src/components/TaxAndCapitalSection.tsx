import React from 'react';
import { 
  Building2, 
  Coins, 
  HelpCircle, 
  Receipt, 
  ShieldAlert, 
  Clock, 
  UserCheck,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { TaxAndCapitalConfig } from '../types/financial';
import { formatVND, formatPercent } from '../utils/formatters';

interface TaxAndCapitalSectionProps {
  config: TaxAndCapitalConfig;
  onChange: (updated: TaxAndCapitalConfig) => void;
}

export const TaxAndCapitalSection: React.FC<TaxAndCapitalSectionProps> = ({
  config,
  onChange,
}) => {
  const updateField = <K extends keyof TaxAndCapitalConfig>(
    field: K,
    value: TaxAndCapitalConfig[K]
  ) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xs font-bold font-mono">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Vốn Ban Đầu &amp; Quy Định Thuế Việt Nam
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cơ sở pháp lý thuế, chính sách lao động và nguồn lực tiền mặt ban đầu cho Mosh&amp;Mode.
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
          Tuân thủ luật VN 2026
        </span>
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Starting Cash */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Vốn Ban Đầu</span>
            </label>
            <span className="text-[11px] font-mono text-emerald-700 font-medium">Starting Cash</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-colors mt-1">
            <input
              type="number"
              step="5000000"
              min="0"
              value={config.startingCash || ''}
              onChange={(e) => updateField('startingCash', Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
              placeholder="Nhập số tiền..."
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-emerald-700 font-mono font-semibold select-none shrink-0">
              VNĐ
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
            <span>Hiển thị: <strong className="text-emerald-700">{formatVND(config.startingCash)}</strong></span>
            <span className="text-slate-400 font-mono">{config.startingCash.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {/* Chi phí dự phòng hàng tháng */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>2. Chi Phí Dự Phòng Hàng Tháng</span>
            </label>
            <span className="text-[11px] font-mono text-amber-700 font-medium">Dự phòng (Cố định)</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-500/20 transition-colors mt-1">
            <input
              type="number"
              step="1000000"
              min="0"
              value={config.contingencyReserveMonthly ?? 0}
              onChange={(e) => updateField('contingencyReserveMonthly', Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
              placeholder="Nhập số tiền dự phòng..."
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-amber-700 font-mono font-semibold select-none shrink-0">
              VNĐ/tháng
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
            <span>Mỗi tháng: <strong className="text-amber-700">{formatVND(config.contingencyReserveMonthly ?? 0)}</strong></span>
            <span className="text-slate-400 font-mono">{(config.contingencyReserveMonthly ?? 0).toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {/* VAT Output */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Thuế Suất VAT Đầu Ra</span>
            </label>
            <span className="text-[11px] font-mono text-blue-700 font-medium">VAT (%)</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-500/20 transition-colors mt-1">
            <input
              type="number"
              step="0.5"
              min="0"
              max="20"
              value={config.vatOutputRate}
              onChange={(e) => updateField('vatOutputRate', Number(e.target.value))}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-blue-700 font-mono font-semibold select-none shrink-0">
              %
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            Thuế suất theo quy định hàng hóa mỹ phẩm ({formatPercent(config.vatOutputRate)}).
          </p>
        </div>

        {/* Corporate Income Tax (CIT) */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              <span>3. Thuế TNDN (CIT)</span>
            </label>
            <span className="text-[11px] font-mono text-purple-700 font-medium">CIT (%)</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-500/20 transition-colors mt-1">
            <input
              type="number"
              step="1"
              min="0"
              max="50"
              value={config.corporateIncomeTaxRate}
              onChange={(e) => updateField('corporateIncomeTaxRate', Number(e.target.value))}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-purple-700 font-mono font-semibold select-none shrink-0">
              %
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            Áp dụng trên Lợi nhuận trước thuế EBT ({formatPercent(config.corporateIncomeTaxRate)} chuẩn DN VN).
          </p>
        </div>

        {/* Social Insurance (BHXH) */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-teal-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
              <span>4. BHXH Cho Người Lao Động</span>
            </label>
            <span className="text-[11px] font-mono text-teal-700 font-medium">BHXH (%)</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-teal-600 focus-within:ring-1 focus-within:ring-teal-500/20 transition-colors mt-1">
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={config.socialInsuranceRate}
              onChange={(e) => updateField('socialInsuranceRate', Number(e.target.value))}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-teal-700 font-mono font-semibold select-none shrink-0">
              %
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            Phần doanh nghiệp đóng (Hưu trí 14%, Thai sản 3%, BHTN 1%, BHYT 3%, TNLĐ 0.5% = 21.5%).
          </p>
        </div>

        {/* Seasonal Personal Income Tax */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>5. Thuế TNCN Lao Động Thời Vụ</span>
            </label>
            <span className="text-[11px] font-mono text-amber-700 font-medium">TNCN (%)</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-500/20 transition-colors mt-1">
            <input
              type="number"
              step="1"
              min="0"
              max="30"
              value={config.seasonalPersonalIncomeTaxRate}
              onChange={(e) => updateField('seasonalPersonalIncomeTaxRate', Number(e.target.value))}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-amber-700 font-mono font-semibold select-none shrink-0">
              %
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            Khấu trừ tại nguồn 10% với thu nhập vãng lai/thời vụ &gt;= 2.000.000 đ/lần chi trả.
          </p>
        </div>

        {/* Asset Depreciation Period */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>6. Kỳ Hạn Khấu Hao Tài Sản</span>
            </label>
            <span className="text-[11px] font-mono text-rose-700 font-medium">Tháng</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-rose-600 focus-within:ring-1 focus-within:ring-rose-500/20 transition-colors mt-1">
            <input
              type="number"
              step="1"
              min="6"
              max="120"
              value={config.depreciationMonths}
              onChange={(e) => updateField('depreciationMonths', Math.max(1, Number(e.target.value)))}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-rose-700 font-mono font-semibold select-none shrink-0">
              tháng
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            Áp dụng phương pháp đường thẳng ({config.depreciationMonths} tháng = {(config.depreciationMonths / 12).toFixed(1)} năm) cho máy móc, thiết bị đóng gói, khuôn mẫu.
          </p>
        </div>

      </div>

      {/* CFO Strategic Guidance Callout */}
      <div className="mt-2 p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-start space-x-3 text-xs text-slate-700">
        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
          <TrendingUp className="w-3 h-3" />
        </div>
        <div>
          <span className="font-semibold text-emerald-900">Góc nhìn CFO Mosh&amp;Mode: </span>
          <span>
            Với số vốn hạt giống <strong>{formatVND(config.startingCash)}</strong>, chi phí thuế đầu ra 8% và BHXH 21.5% là chi phí tiền mặt bắt buộc. Khấu hao 24 tháng giúp phân bổ chi phí khuôn mẫu chai lọ Underarm Care mà không làm bào mòn dòng tiền vận hành tháng 1.
          </span>
        </div>
      </div>
    </div>
  );
};
