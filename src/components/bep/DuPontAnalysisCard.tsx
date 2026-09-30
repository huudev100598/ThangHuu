import React, { useState } from 'react';
import { formatNumberVi } from '../../utils/formatters';
import { 
  Sparkles, 
  TrendingUp, 
  PieChart, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  HelpCircle,
  Percent,
  Layers,
  Activity,
  Zap,
  Target,
  ShieldCheck
} from 'lucide-react';

import { ProjectParameters } from '../../types/financial';

interface DuPontAnalysisCardProps {
  pnlSummary: {
    grossRevenue: number;
    grossRevenueAfterVat: number;
    netRevenue: number;
    grossProfit: number;
    ebit: number;
    ebt: number;
    corporateTax: number;
    netProfit: number;
    marketingOverall: number;
    platformFees: number;
    totalUnits: number;
  };
  cashFlowSummary?: {
    startingCash: number;
    totalInflow: number;
    totalOutflow: number;
    finalCashBalance: number;
    minCashBalance: number;
  };
  totalRevenue: number;
  breakEvenRevenue: number;
  parameters?: ProjectParameters;
}

export const DuPontAnalysisCard: React.FC<DuPontAnalysisCardProps> = ({
  pnlSummary,
  cashFlowSummary,
  totalRevenue,
  breakEvenRevenue,
  parameters,
}) => {
  const [modelType, setModelType] = useState<'3-step' | '5-step'>('3-step');

  // Doanh thu cơ sở chuẩn hóa (sau VAT)
  const baseRevenue = pnlSummary.grossRevenueAfterVat || totalRevenue || 0;
  const netProfit = pnlSummary.netProfit || 0;
  const ebit = pnlSummary.ebit || 0;
  const ebt = pnlSummary.ebt || ebit;

  // 1. Biên Lợi Nhuận Ròng (Net Profit Margin - NPM)
  const netProfitMargin = baseRevenue > 0 ? (netProfit / baseRevenue) * 100 : 0;

  // Vốn chủ sở hữu ban đầu lấy trực tiếp từ Tham số chung (Tab 1)
  const initialEquity = parameters?.taxAndCapital?.startingCash ?? cashFlowSummary?.startingCash ?? 0;
  // Tổng tài sản hoạt động thực tế = Vốn ban đầu + Vốn lưu động thâm hụt tài trợ
  const workingCapitalNeed = Math.max(0, -(cashFlowSummary?.minCashBalance || 0));
  const totalAssets = initialEquity + workingCapitalNeed;

  // 2. Vòng Quay Tổng Tài Sản (Asset Turnover - ATO)
  const assetTurnover = totalAssets > 0 ? baseRevenue / totalAssets : 0;

  // 3. Tỷ Suất Sinh Lời Trên Tài Sản (ROA) = NPM × ATO
  const roa = baseRevenue > 0 && totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;

  // 4. Đòn Bẩy Tài Chính / Hệ Số Vốn Cổ Phần (Equity Multiplier - FL)
  const equityMultiplier = totalAssets > 0 && initialEquity > 0 
    ? Math.max(1.0, Number((totalAssets / initialEquity).toFixed(2))) 
    : 1.0;

  // 5. Tỷ Suất Sinh Lời Trên Vốn Chủ Sở Hữu (ROE) = ROA × FL
  const roe = initialEquity > 0 ? (netProfit / initialEquity) * 100 : 0;

  // 5-Step Extended DuPont factors
  const taxBurden = ebt !== 0 ? (netProfit / ebt) : 1; // 1 - T
  const interestBurden = ebit !== 0 ? (ebt / ebit) : 1; // EBT / EBIT
  const operatingMargin = (ebit / baseRevenue) * 100; // EBIT Margin

  // Đánh giá sức khỏe DuPont & Động lực sinh lời chính
  const isRoeHealthy = roe >= 15;
  const isRoeModerate = roe > 0 && roe < 15;

  // Tự động phân tích động lực chính (Primary Driver) của ROE
  const primaryDriver = 
    Math.abs(netProfitMargin) > 12 
      ? 'Biên Lợi Nhuận (Profit Margin Dominant)' 
      : assetTurnover > 3 
      ? 'Tốc Độ Vòng Quay Vốn (Velocity/Turnover Dominant)' 
      : 'Cấu Trúc Đòn Bẩy Vốn (Financial Structure)';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <PieChart className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Phân Tích Mô Hình DuPont (DuPont Financial Analysis Framework)
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Chuẩn Quản Trị CFO
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bóc tách tỷ suất sinh lời ROE thành 3 động lực cốt lõi: <strong>Biên Lãi Ròng</strong>, <strong>Vòng Quay Tài Sản</strong> và <strong>Đòn Bẩy Vốn</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Toggle 3-Step vs 5-Step */}
        <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setModelType('3-step')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              modelType === '3-step'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DuPont 3 Nhân Tố (Cơ Bản)
          </button>
          <button
            type="button"
            onClick={() => setModelType('5-step')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              modelType === '5-step'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DuPont 5 Nhân Tố (Chuyên Sâu)
          </button>
        </div>
      </div>

      {/* 3 Thẻ Chỉ Số Cốt Lõi Tạo Nên ROE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {/* THẺ TỔNG HỢP ROE */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          isRoeHealthy 
            ? 'bg-purple-50/80 border-purple-200 text-purple-950' 
            : isRoeModerate 
              ? 'bg-blue-50/80 border-blue-200 text-blue-950' 
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                ROE Toàn Kỳ
              </span>
              <span className="p-1 rounded bg-purple-200/60 text-purple-800 text-[10px] font-mono font-bold">
                Mục tiêu ≥ 15%
              </span>
            </div>
            <div className={`mt-2 text-2xl font-black font-mono ${
              roe >= 0 ? 'text-purple-700' : 'text-rose-700'
            }`}>
              {roe >= 0 ? '+' : ''}{roe.toFixed(1)}%
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              Tỷ suất lợi nhuận trên vốn chủ sở hữu đầu tư ({formatNumberVi(initialEquity)} đ)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-purple-200/50 flex items-center justify-between text-[11px] font-semibold">
            <span>Đánh giá:</span>
            <span className={`font-bold ${roe >= 15 ? 'text-emerald-700' : roe > 0 ? 'text-blue-700' : 'text-rose-700'}`}>
              {roe >= 20 ? '🌟 Siêu Lợi Nhuận' : roe >= 15 ? '✓ Đạt Chuẩn Cao' : roe > 0 ? '⚠ Khá Khiêm Tốn' : '✕ Thua Lỗ Vốn'}
            </span>
          </div>
        </div>

        {/* NHÂN TỐ 1: BIÊN LỢI NHUẬN RÒNG (NPM) */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">
                1. Biên Lãi Ròng (NPM)
              </span>
              <Percent className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className={`mt-2 text-xl font-bold font-mono ${
              netProfitMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {netProfitMargin >= 0 ? '+' : ''}{netProfitMargin.toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Lợi nhuận ròng / Doanh thu gộp sau thuế VAT
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
            <span>Hiệu quả chi phí:</span>
            <span className="font-bold font-mono text-slate-800">
              {netProfit >= 0 ? `${formatNumberVi(netProfit)} đ` : `-${formatNumberVi(Math.abs(netProfit))} đ`}
            </span>
          </div>
        </div>

        {/* NHÂN TỐ 2: VÒNG QUAY TỔNG TÀI SẢN (ATO) */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">
                2. Vòng Quay Vốn (ATO)
              </span>
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-indigo-700">
              {assetTurnover.toFixed(2)}x
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Doanh thu / Tổng vốn đầu tư (Lần quay/kỳ)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
            <span>Hiệu suất tài sản:</span>
            <span className="font-bold text-indigo-700">
              {assetTurnover >= 2.5 ? 'Rất Linh Hoạt' : 'Mức Tiêu Chuẩn'}
            </span>
          </div>
        </div>

        {/* NHÂN TỐ 3: ĐÒN BẨY TÀI CHÍNH (FL) */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">
                3. Đòn Bẩy Vốn (FL)
              </span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-slate-800">
              {equityMultiplier.toFixed(2)}x
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tổng tài sản / Vốn chủ sở hữu (Equity Multiplier)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
            <span>Mức độ rủi ro nợ:</span>
            <span className="font-bold text-emerald-700">
              An Toàn (Tự tài trợ)
            </span>
          </div>
        </div>
      </div>

      {/* Sơ Đồ Cây Phân Rã DuPont (DuPont Tree Decomposition) */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl text-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
              Sơ Đồ Phân Rã Công Thức Mô Hình DuPont
            </h4>
          </div>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono">
            ROE = {modelType === '3-step' ? 'NPM × ATO × FL' : 'Tax × Interest × EBIT Margin × ATO × FL'}
          </span>
        </div>

        {modelType === '3-step' ? (
          <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2 text-center text-xs">
            <div className="p-3 bg-white/10 rounded-xl border border-white/15">
              <span className="text-[11px] text-purple-300 font-semibold block">ROE (Sinh Lời Vốn)</span>
              <span className={`text-base font-black font-mono mt-1 block ${roe >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {roe.toFixed(1)}%
              </span>
            </div>

            <div className="text-slate-400 font-bold text-sm hidden sm:block">=</div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium block">Biên Lãi Ròng (NPM)</span>
              <span className="text-sm font-bold font-mono text-emerald-300 mt-1 block">
                {netProfitMargin.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Kiểm soát chi phí</span>
            </div>

            <div className="text-slate-400 font-bold text-sm hidden sm:block">×</div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium block">Vòng Quay Vốn (ATO)</span>
              <span className="text-sm font-bold font-mono text-blue-300 mt-1 block">
                {assetTurnover.toFixed(2)} lần
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Tốc độ sinh doanh thu</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-center">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 block">Gánh Nặng Thuế</span>
              <span className="text-xs font-bold font-mono text-emerald-300 mt-0.5 block">
                {(taxBurden * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400">Net Profit / EBT</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 block">Gánh Lãi Vay</span>
              <span className="text-xs font-bold font-mono text-sky-300 mt-0.5 block">
                {interestBurden.toFixed(2)}x
              </span>
              <span className="text-[9px] text-slate-400">EBT / EBIT</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 block">Biên Lãi HĐ (EBIT)</span>
              <span className="text-xs font-bold font-mono text-amber-300 mt-0.5 block">
                {operatingMargin.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400">EBIT / Doanh Thu</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 block">Vòng Quay Vốn</span>
              <span className="text-xs font-bold font-mono text-purple-300 mt-0.5 block">
                {assetTurnover.toFixed(2)} lần
              </span>
              <span className="text-[9px] text-slate-400">Doanh Thu / Tài Sản</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 block">Đòn Bẩy Vốn</span>
              <span className="text-xs font-bold font-mono text-indigo-300 mt-0.5 block">
                {equityMultiplier.toFixed(2)}x
              </span>
              <span className="text-[9px] text-slate-400">Tài Sản / Vốn CS</span>
            </div>
          </div>
        )}
      </div>

      {/* Gợi Ý Quản Trị Theo Thời Gian Thực Dựa Vào DuPont */}
      <div className="bg-amber-50/50 rounded-2xl border border-amber-200/90 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-sm">
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <span>Khuyến Nghị Chiến Lược Cải Thiện ROE Thời Gian Thực:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs text-slate-700">
          <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
            <span className="font-bold text-amber-950 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-600" />
              1. Tối Ưu Biên Lợi Nhuận (NPM)
            </span>
            <p className="text-[11px] leading-relaxed text-slate-600">
              {netProfitMargin < 10 ? (
                <>Biên lãi ròng hiện tại ({netProfitMargin.toFixed(1)}%) đang bị bào mòn bởi chi phí sàn và Marketing. Cần đàm phán giảm 2-3% phí hoa hồng đại lý và tối ưu giá vốn MOQ.</>
              ) : (
                <>Biên lãi ròng ({netProfitMargin.toFixed(1)}%) đang duy trì rất tốt. Hãy tiếp tục duy trì định mức chi phí đóng gói và voucher sàn trong ngưỡng an toàn.</>
              )}
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              2. Tăng Vòng Quay Vốn (ATO)
            </span>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Vòng quay hiện đạt <strong className="font-mono">{assetTurnover.toFixed(1)} lần/kỳ</strong>. Để nâng cao ROE mà không cần tăng giá bán, hãy rút ngắn chu kỳ thu hồi tiền từ sàn TMĐT (Tab 2) và giảm lượng tồn kho đệm an toàn.
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
            <span className="font-bold text-purple-950 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              3. Động Lực Trọng Tâm: {primaryDriver}
            </span>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Mô hình xác định dự án của bạn tăng trưởng chủ yếu dựa trên <strong>{primaryDriver}</strong>. Duy trì đòn bẩy tài chính an toàn ở mức {equityMultiplier.toFixed(1)}x để tránh rủi ro lãi vay.
            </p>
          </div>
        </div>
      </div>

      {/* CÔNG CỤ MÔ PHỎNG ĐỘ NHẠY WHAT-IF THỜI GIAN THỰC CỦA DUPONT */}
      <div className="p-4 sm:p-5 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-purple-950 font-bold text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Mô Phỏng Độ Nhạy Tác Động Lên ROE (What-If DuPont Simulator)</span>
          </div>
          <span className="text-[10px] text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200 font-mono">
            Kế hoạch chuẩn: ROE {roe.toFixed(1)}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Kịch bản 1: Cải thiện Net Margin +2% */}
          <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-800 block">Kịch Bản A: Tối Ưu Phí Sàn / Giảm COGS</span>
            <p className="text-[10px] text-slate-500">Giả định Net Margin tăng thêm +2.0% (đạt {(netProfitMargin + 2).toFixed(1)}%)</p>
            <div className="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-100">
              <span className="text-[10px] text-slate-500">ROE Mới:</span>
              <span className="text-xs font-black font-mono text-emerald-700">
                {((netProfitMargin + 2) * assetTurnover * equityMultiplier).toFixed(1)}% 
                <span className="text-[10px] font-normal text-emerald-600 ml-1">
                  (+{(2 * assetTurnover * equityMultiplier).toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>

          {/* Kịch bản 2: Tăng Vòng quay vốn thêm +0.5x */}
          <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-800 block">Kịch Bản B: Thu Hồi Tiền Nhanh & Giảm Tồn Kho</span>
            <p className="text-[10px] text-slate-500">Giả định Vòng quay tài sản tăng +0.5x (đạt {(assetTurnover + 0.5).toFixed(2)}x)</p>
            <div className="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-100">
              <span className="text-[10px] text-slate-500">ROE Mới:</span>
              <span className="text-xs font-black font-mono text-blue-700">
                {(netProfitMargin * (assetTurnover + 0.5) * equityMultiplier).toFixed(1)}%
                <span className="text-[10px] font-normal text-blue-600 ml-1">
                  (+{(netProfitMargin * 0.5 * equityMultiplier).toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>

          {/* Kịch bản 3: Tối ưu hiệp đồng cả 2 */}
          <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-purple-900 block">Kịch Bản C: Hiệp Đồng Hai Động Lực</span>
            <p className="text-[10px] text-slate-500">Tăng Net Margin +1.5% VÀ Tăng Vòng quay +0.3x</p>
            <div className="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-100">
              <span className="text-[10px] text-slate-500">ROE Mục Tiêu:</span>
              <span className="text-xs font-black font-mono text-purple-700">
                {((netProfitMargin + 1.5) * (assetTurnover + 0.3) * equityMultiplier).toFixed(1)}%
                <span className="text-[10px] font-normal text-purple-600 ml-1">
                  (+{(((netProfitMargin + 1.5) * (assetTurnover + 0.3) * equityMultiplier) - roe).toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
