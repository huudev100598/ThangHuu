import React, { useState } from 'react';
import { BreakEvenPointAnalysis, MonthlyPnlRecord } from '../utils/reportCalculations';
import { SalesMonth, ChannelMixConfig, SalesVolumeMap } from '../types/salesForecast';
import { ProductSku, Sheet3CogsData } from '../types/sku';
import { ProjectParameters } from '../types/financial';
import { formatNumberVi } from '../utils/formatters';
import { BreakEvenChart } from './bep/BreakEvenChart';
import { MarginOfSafetyCard } from './bep/MarginOfSafetyCard';
import { BreakEvenTabularReport } from './bep/BreakEvenTabularReport';
import { 
  Target, 
  ShieldCheck, 
  Package, 
  LineChart,
  Table,
  Split
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

export const BreakEvenAnalysisSection: React.FC<BreakEvenAnalysisSectionProps> = ({
  bep,
  totalGrossRevenue,
  months = [],
  pnlMonthly = [],
  skus = [],
  channelMix,
  volumes = {},
  sheet3CogsMap = {},
  parameters,
}) => {
  // Chế độ hiển thị chính: Biểu đồ, Dạng bảng, hoặc Báo cáo Quản trị MoS
  const [activeView, setActiveView] = useState<BepViewMode>('chart');

  const isHealthy = bep.marginOfSafetyRevenue > 0;

  return (
    <div id="break-even-analysis-root" className="space-y-6">
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

      {/* THANH ĐIỀU HƯỚNG CHỌN CHẾ ĐỘ XEM CHÍNH (3 CHẾ ĐỘ: BIỂU ĐỒ, DẠNG BẢNG, BÁO CÁO MOS) */}
      <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center flex-wrap gap-1 border border-slate-200 text-xs font-semibold">
        <button
          id="bep-view-chart-btn"
          type="button"
          onClick={() => setActiveView('chart')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeView === 'mos'
              ? 'bg-white text-indigo-700 shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Báo Cáo Quản Trị: Biên Độ An Toàn (MoS)
        </button>
      </div>

      {/* VIEW 1: BIỂU ĐỒ ĐIỂM HÒA VỐN (BREAK-EVEN CHART) */}
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

      {/* VIEW 2: DẠNG BẢNG SỐ LIỆU PHÂN TÍCH (TABULAR REPORT) */}
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

      {/* VIEW 3: BÁO CÁO QUẢN TRỊ: CHỈ SỐ BIÊN ĐỘ AN TOÀN (MOS) */}
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
  );
};
