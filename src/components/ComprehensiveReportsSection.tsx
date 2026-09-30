import React, { useState, useMemo } from 'react';
import { ProductSku, Sheet3CogsData, SupplierQuotation } from '../types/sku';
import { SalesMonth, SalesVolumeMap, ChannelMixConfig, CreatorCampaign } from '../types/salesForecast';
import { SalaryStructurePosition, HeadcountPlanMap, InitialCapexItem, MonthlyOperatingExpense, HrOperationsConfig } from '../types/hrOperations';
import { ProjectParameters } from '../types/financial';
import { calculateFullFinancialReport } from '../utils/reportCalculations';
import { PnlReportSection } from './PnlReportSection';
import { CashFlowReportSection } from './CashFlowReportSection';
import { BreakEvenAnalysisSection } from './BreakEvenAnalysisSection';
import { 
  PieChart, 
  Wallet, 
  LineChart, 
  FileSpreadsheet, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ArrowRight,
  ShieldCheck,
  Building2,
  SlidersHorizontal
} from 'lucide-react';

export type ReportSubTab = 'pnl' | 'cashflow' | 'bep';

interface ComprehensiveReportsSectionProps {
  skus: ProductSku[];
  sheet3CogsMap: Record<string, Sheet3CogsData>;
  months: SalesMonth[];
  volumes: SalesVolumeMap;
  channelMix: ChannelMixConfig;
  creatorCampaigns: CreatorCampaign[];
  positions: SalaryStructurePosition[];
  headcountMap: HeadcountPlanMap;
  capexItems: InitialCapexItem[];
  opexItems: MonthlyOperatingExpense[];
  hrConfig: HrOperationsConfig;
  parameters: ProjectParameters;
  quotations?: SupplierQuotation[];
  initialSubTab?: ReportSubTab;
}

export const ComprehensiveReportsSection: React.FC<ComprehensiveReportsSectionProps> = ({
  skus,
  sheet3CogsMap,
  months,
  volumes,
  channelMix,
  creatorCampaigns,
  positions,
  headcountMap,
  capexItems,
  opexItems,
  hrConfig,
  parameters,
  quotations = [],
  initialSubTab = 'pnl',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Tính toán toàn bộ Báo cáo Tài chính Real-time theo Kế hoạch Bán hàng & Dữ liệu 5 Tab
  const reportData = useMemo(() => {
    return calculateFullFinancialReport(
      skus,
      sheet3CogsMap,
      months,
      volumes,
      channelMix,
      creatorCampaigns,
      positions,
      headcountMap,
      capexItems,
      opexItems,
      hrConfig,
      parameters,
      quotations
    );
  }, [
    skus,
    sheet3CogsMap,
    months,
    volumes,
    channelMix,
    creatorCampaigns,
    positions,
    headcountMap,
    capexItems,
    opexItems,
    hrConfig,
    parameters,
    quotations,
  ]);

  return (
    <div className="space-y-6">
      {/* Header Banner Tab 6 */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Báo Cáo Tài Chính &amp; Phân Tích Hòa Vốn</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Space_Grotesk']">
            Báo Cáo P&amp;L, Dòng Tiền &amp; Vốn, Phân Tích Hòa Vốn BEP
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Tự động tổng hợp và tính toán theo thời gian thực (Real-time) từ kế hoạch bán hàng, tỷ trọng kênh, chiến dịch Creator, bảng lương nhân sự, định phí vận hành và giá vốn sản xuất.
          </p>
        </div>

        {/* Sub-tabs switch */}
        <div className="shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:max-w-md">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 lg:text-right">
            Báo cáo chi tiết (Sub-reports):
          </div>
          <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
            <button
              onClick={() => setActiveSubTab('pnl')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                activeSubTab === 'pnl'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Báo Cáo P&amp;L</span>
            </button>

            <button
              onClick={() => setActiveSubTab('cashflow')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                activeSubTab === 'cashflow'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Dòng Tiền &amp; Vốn</span>
            </button>

            <button
              onClick={() => setActiveSubTab('bep')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                activeSubTab === 'bep'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Điểm Hòa Vốn BEP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tab 1: BÁO CÁO P&L */}
      {activeSubTab === 'pnl' && (
        <PnlReportSection
          months={months}
          pnlMonthly={reportData.pnlMonthly}
          pnlSummary={reportData.pnlSummary}
          parameters={parameters}
        />
      )}

      {/* Sub-tab 2: BÁO CÁO DÒNG TIỀN VÀ VỐN */}
      {activeSubTab === 'cashflow' && (
        <CashFlowReportSection
          months={months}
          cashFlowMonthly={reportData.cashFlowMonthly}
          cashFlowSummary={reportData.cashFlowSummary}
          parameters={parameters}
        />
      )}

      {/* Sub-tab 3: PHÂN TÍCH ĐIỂM HÒA VỐN BEP */}
      {activeSubTab === 'bep' && (
        <BreakEvenAnalysisSection
          bep={reportData.bep}
          totalGrossRevenue={reportData.pnlSummary.grossRevenue}
          months={months}
          pnlMonthly={reportData.pnlMonthly}
          pnlSummary={reportData.pnlSummary}
          cashFlowSummary={reportData.cashFlowSummary}
          skus={skus}
          channelMix={channelMix}
          volumes={volumes}
          sheet3CogsMap={sheet3CogsMap}
          parameters={parameters}
        />
      )}
    </div>
  );
};
