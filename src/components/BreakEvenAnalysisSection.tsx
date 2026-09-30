import React, { useState } from 'react';
import { BreakEvenPointAnalysis, MonthlyPnlRecord } from '../utils/reportCalculations';
import { SalesMonth, ChannelMixConfig, SalesVolumeMap } from '../types/salesForecast';
import { ProductSku, Sheet3CogsData } from '../types/sku';
import { ProjectParameters } from '../types/financial';
import { formatNumberVi } from '../utils/formatters';
import { BreakEvenChart } from './bep/BreakEvenChart';
import { MarginOfSafetyCard } from './bep/MarginOfSafetyCard';
import { BreakEvenTabularReport } from './bep/BreakEvenTabularReport';
import { DuPontAnalysisCard } from './bep/DuPontAnalysisCard';
import { ProjectHealthDiagnosis } from './bep/ProjectHealthDiagnosis';
import { ChannelPerformanceComparison } from './bep/ChannelPerformanceComparison';
import { 
  Target, 
  ShieldCheck, 
  Package, 
  LineChart,
  Table,
  Split,
  Activity,
  PieChart,
  BarChart2,
  Layers,
  Sparkles
} from 'lucide-react';

interface BreakEvenAnalysisSectionProps {
  bep: BreakEvenPointAnalysis;
  totalGrossRevenue: number;
  months?: SalesMonth[];
  pnlMonthly?: MonthlyPnlRecord[];
  pnlSummary?: any;
  cashFlowSummary?: any;
  skus?: ProductSku[];
  channelMix?: ChannelMixConfig;
  volumes?: SalesVolumeMap;
  sheet3CogsMap?: Record<string, Sheet3CogsData>;
  parameters?: ProjectParameters;
}

export type BepViewMode = 'chart' | 'tabular' | 'mos';
export type BepModuleTab = 'all' | 'cvp' | 'health' | 'dupont' | 'channels';

export const BreakEvenAnalysisSection: React.FC<BreakEvenAnalysisSectionProps> = ({
  bep,
  totalGrossRevenue,
  months = [],
  pnlMonthly = [],
  pnlSummary,
  cashFlowSummary,
  skus = [],
  channelMix,
  volumes = {},
  sheet3CogsMap = {},
  parameters,
}) => {
  // Module tab điều hướng nhanh: Tất cả / CVP / Sức khỏe / DuPont / Kênh
  const [activeModuleTab, setActiveModuleTab] = useState<BepModuleTab>('all');
  // Chế độ hiển thị CVP: Biểu đồ, Dạng bảng, hoặc Báo cáo Quản trị MoS
  const [activeView, setActiveView] = useState<BepViewMode>('chart');

  const isHealthy = bep.marginOfSafetyRevenue > 0;

  return (
    <div id="break-even-analysis-root" className="space-y-6">
      {/* Real-time Business Plan Sync Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Đồng bộ Kế Hoạch Kinh Doanh Theo Thời Gian Thực (Real-time Business Plan)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                100% Live Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Số liệu điểm hòa vốn, định phí, biến phí và biên an toàn được tính toán trực tiếp từ Kế hoạch bán hàng (Tab 4), Danh mục SKU (Tab 2), COGS Nhà máy (Tab 3) và Nhân sự vận hành (Tab 5).
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 shrink-0 font-medium flex items-center gap-2">
          <span>Kỳ kế hoạch: <strong className="text-slate-800">{months.length} tháng</strong></span>
          {months.length > 0 && (
            <span className="text-slate-400 text-[11px]">({months[0]?.label} – {months[months.length - 1]?.label})</span>
          )}
        </div>
      </div>

      {totalGrossRevenue === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Kế hoạch bán hàng hiện tại đang có sản lượng bằng 0. Điểm hòa vốn hiển thị 0 tương ứng với kế hoạch thực tế. Bạn có thể nhập sản lượng bán tại <strong>Tab 4: Kế Hoạch Bán Hàng</strong> để xem điểm hòa vốn tự động cập nhật ngay lập tức.</span>
          </div>
        </div>
      )}

      {/* 4 THẺ CHỈ SỐ TỔNG QUAN CVP & BEP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Doanh Thu Hòa Vốn */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Doanh Thu Hòa Vốn</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-indigo-700 tracking-tight">
            {formatNumberVi(bep.breakEvenRevenue)} đ
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Kế hoạch: {formatNumberVi(totalGrossRevenue)} đ</span>
            <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
              CMR: {bep.contributionMarginRatio.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 2. Sản Lượng Hòa Vốn */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Sản Lượng Hòa Vốn</span>
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 tracking-tight">
            {formatNumberVi(bep.breakEvenUnits)} sp
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Kế hoạch: {formatNumberVi(bep.totalUnits)} sp</span>
            <span className="text-slate-700 font-medium">
              Giá TB: {formatNumberVi(bep.averageSellingPrice)} đ
            </span>
          </div>
        </div>

        {/* 3. Bóc Tách Chi Phí: Định Phí (FC) vs Biến Phí (VC) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cơ Cấu Chi Phí (FC / VC)</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Split className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 tracking-tight">
            {formatNumberVi(bep.totalFixedCosts)} đ
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Biến phí: {formatNumberVi(bep.totalVariableCosts)} đ</span>
            <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
              VC: {bep.variableCostRatio.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 4. Biên Độ An Toàn (Margin of Safety - MoS) */}
        <div className={`rounded-2xl border p-4 shadow-xs ${
          isHealthy ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Biên Độ An Toàn (MoS)
            </span>
            <span className={`p-1.5 rounded-lg ${isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className={`mt-2 text-xl font-extrabold tracking-tight ${isHealthy ? 'text-emerald-800' : 'text-rose-700'}`}>
            {isHealthy ? '+' : ''}{formatNumberVi(bep.marginOfSafetyRevenue)} đ
          </div>
          <div className="mt-1.5 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Sản lượng: {isHealthy ? '+' : ''}{formatNumberVi(bep.marginOfSafetyUnits)} sp</span>
            <span className={`font-bold px-1.5 py-0.5 rounded ${
              isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {bep.marginOfSafetyPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG NHANH CÁC KHỐI BÁO CÁO & PHÂN TÍCH */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center flex-wrap gap-1.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveModuleTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeModuleTab === 'all'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tất Cả Báo Cáo (Tổng Hợp)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('cvp')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeModuleTab === 'cvp'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>1. Phân Tích Hòa Vốn CVP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('health')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeModuleTab === 'health'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Tự Động Chẩn Đoán Sức Khỏe Dự Án</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('dupont')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeModuleTab === 'dupont'
              ? 'bg-purple-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>3. Mô Hình DuPont & Gợi Ý Thời Gian Thực</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('channels')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeModuleTab === 'channels'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>4. So Sánh Hiệu Quả Các Kênh Bán Hàng</span>
        </button>
      </div>

      {/* KHỐI 1: PHÂN TÍCH HÒA VỐN BEP & CVP (KÈM 3 CHẾ ĐỘ: BIỂU ĐỒ, DẠNG BẢNG, BÁO CÁO MOS) */}
      {(activeModuleTab === 'all' || activeModuleTab === 'cvp') && (
        <div className="space-y-4">
          <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center flex-wrap gap-1 border border-slate-200 text-xs font-semibold">
            <button
              id="bep-view-chart-btn"
              type="button"
              onClick={() => setActiveView('chart')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'chart'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LineChart className="w-4 h-4" />
              Biểu Đồ Điểm Hòa Vốn (Break-even Chart)
            </button>

            <button
              id="bep-view-tabular-btn"
              type="button"
              onClick={() => setActiveView('tabular')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'tabular'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Table className="w-4 h-4" />
              Dạng Bảng Số Liệu Phân Tích (Tabular Report)
            </button>

            <button
              id="bep-view-mos-btn"
              type="button"
              onClick={() => setActiveView('mos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'mos'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Báo Cáo Quản Trị: Biên Độ An Toàn (MoS)
            </button>
          </div>

          {/* VIEW 1: BIỂU ĐỒ ĐIỂM HÒA VỐN */}
          {activeView === 'chart' && (
            <BreakEvenChart
              fixedCosts={bep.totalFixedCosts}
              variableCostRatio={bep.variableCostRatio}
              totalRevenue={totalGrossRevenue}
              totalUnits={bep.totalUnits}
              breakEvenRevenue={bep.breakEvenRevenue}
              breakEvenUnits={bep.breakEvenUnits}
              averageSellingPrice={bep.averageSellingPrice}
              unitVariableCost={bep.unitVariableCost}
              unitContributionMargin={bep.unitContributionMargin}
              marginOfSafetyRevenue={bep.marginOfSafetyRevenue}
              marginOfSafetyUnits={bep.marginOfSafetyUnits}
              marginOfSafetyPercent={bep.marginOfSafetyPercent}
            />
          )}

          {/* VIEW 2: DẠNG BẢNG SỐ LIỆU PHÂN TÍCH */}
          {activeView === 'tabular' && (
            <BreakEvenTabularReport
              bep={bep}
              pnlMonthly={pnlMonthly}
              months={months}
              skus={skus}
              sheet3CogsMap={sheet3CogsMap}
              volumes={volumes}
              channelMix={channelMix}
              parameters={parameters}
            />
          )}

          {/* VIEW 3: BÁO CÁO QUẢN TRỊ MOS */}
          {activeView === 'mos' && (
            <MarginOfSafetyCard
              marginOfSafetyRevenue={bep.marginOfSafetyRevenue}
              marginOfSafetyUnits={bep.marginOfSafetyUnits}
              marginOfSafetyPercent={bep.marginOfSafetyPercent}
              safetyRating={bep.safetyRating}
              totalRevenue={totalGrossRevenue}
              totalUnits={bep.totalUnits}
              breakEvenRevenue={bep.breakEvenRevenue}
              breakEvenUnits={bep.breakEvenUnits}
              fixedCosts={bep.totalFixedCosts}
              unitContributionMargin={bep.unitContributionMargin}
              averageSellingPrice={bep.averageSellingPrice}
              contributionMarginRatio={bep.contributionMarginRatio}
            />
          )}
        </div>
      )}

      {/* KHỐI 2: TỰ ĐỘNG CHẨN ĐOÁN SỨC KHỎE DỰ ÁN */}
      {(activeModuleTab === 'all' || activeModuleTab === 'health') && (
        <ProjectHealthDiagnosis
          bep={bep}
          pnlSummary={pnlSummary}
          cashFlowSummary={cashFlowSummary}
          totalGrossRevenue={totalGrossRevenue}
        />
      )}

      {/* KHỐI 3: MÔ HÌNH DUPONT & GỢI Ý THỜI GIAN THỰC */}
      {(activeModuleTab === 'all' || activeModuleTab === 'dupont') && (
        <DuPontAnalysisCard
          pnlSummary={pnlSummary}
          cashFlowSummary={cashFlowSummary}
          totalRevenue={totalGrossRevenue}
          breakEvenRevenue={bep.breakEvenRevenue}
          parameters={parameters}
        />
      )}

      {/* KHỐI 4: SO SÁNH HIỆU QUẢ CÁC KÊNH BÁN HÀNG */}
      {(activeModuleTab === 'all' || activeModuleTab === 'channels') && (
        <ChannelPerformanceComparison
          pnlMonthly={pnlMonthly}
          pnlSummary={pnlSummary}
          totalGrossRevenue={totalGrossRevenue}
          parameters={parameters}
        />
      )}
    </div>
  );
};

