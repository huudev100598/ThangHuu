import React from 'react';
import { SalesMonth } from '../types/salesForecast';
import { MonthlyPnlRecord } from '../utils/reportCalculations';
import { formatNumberVi } from '../utils/formatters';
import { 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  Target, 
  ShieldCheck 
} from 'lucide-react';

interface PnlTableRowsProps {
  months: SalesMonth[];
  pnlMonthly: MonthlyPnlRecord[];
  pnlSummary: {
    grossRevenue: number;
    vatOutput: number;
    grossRevenueAfterVat: number;
    platformFees: number;
    shippingB2bRetail: number;
    netRevenue: number;
    cogsSales: number;
    cogsSampling: number;
    totalCogs: number;
    grossProfit: number;
    grossMargin: number;
    marketingPlatform: number;
    marketingOverall: number;
    fulfillment: number;
    laborCost: number;
    operatingExpenses: number;
    ebit: number;
    sellingExpenses: number;
    gaExpenses: number;
    ebitda: number;
    ebt: number;
    corporateTax: number;
    netProfit: number;
    netMargin: number;
    totalUnits: number;
  };
  expandedMilestones: {
    gmv: boolean;
    grossRevenue: boolean;
    netRevenue: boolean;
    grossProfit: boolean;
    ebit: boolean;
  };
  toggleMilestone: (key: 'gmv' | 'grossRevenue' | 'netRevenue' | 'grossProfit' | 'ebit') => void;
  expandedSubGroups: Record<string, boolean>;
  toggleSubGroup: (key: string) => void;
  calcExpenseRatio: (val: number) => string;
  calcProfitRatio: (val: number) => string;
  vatRate: number;
  targetMktRate: number;
  actualMktRate: number;
  isMktOverBudget: boolean;
  isMktOnBudget: boolean;
}

export const PnlTableRows: React.FC<PnlTableRowsProps> = ({
  months,
  pnlMonthly,
  pnlSummary,
  expandedMilestones,
  toggleMilestone,
  expandedSubGroups,
  toggleSubGroup,
  calcExpenseRatio,
  calcProfitRatio,
  vatRate,
  targetMktRate,
  actualMktRate,
  isMktOverBudget,
  isMktOnBudget,
}) => {
  return (
    <>
      {/* =========================================================================
          HÀNG 1: 1. Doanh thu GMV (Có nút > xem chi tiết 4 kênh bán hàng)
          ========================================================================= */}
      <tr className="bg-blue-50/50 font-bold text-slate-900 hover:bg-blue-50 transition-colors">
        <td className="py-2.5 px-4 sticky left-0 bg-blue-50 z-20 border-r border-slate-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => toggleMilestone('gmv')}
                className="p-1 rounded hover:bg-blue-200/70 text-blue-700 transition-colors cursor-pointer mr-1 inline-flex items-center justify-center"
                title={expandedMilestones.gmv ? 'Thu gọn chi tiết GMV' : 'Xem chi tiết 4 kênh GMV'}
              >
                {expandedMilestones.gmv ? (
                  <ChevronDown className="w-4 h-4 text-blue-800" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-blue-800" />
                )}
              </button>
              <span className="text-slate-900 font-bold">1. Doanh thu GMV</span>
            </div>
            <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-mono">
              4 kênh
            </span>
          </div>
        </td>
        <td className="py-2.5 px-3 text-right bg-blue-100/50 text-slate-950 border-r border-slate-300 font-bold">
          {formatNumberVi(pnlSummary.grossRevenue)}
        </td>
        <td className="py-2.5 px-2.5 text-right bg-slate-100/60 text-slate-400 border-r border-slate-300 font-medium text-center">
          —
        </td>
        {pnlMonthly.map((m) => (
          <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-slate-950 font-bold">
            {formatNumberVi(m.grossRevenue)}
          </td>
        ))}
      </tr>

      {/* Chi tiết 4 kênh bán hàng của Doanh thu GMV */}
      {expandedMilestones.gmv && (
        <>
          <tr className="text-slate-600 text-[11px] bg-slate-50/50 hover:bg-slate-100/50">
            <td className="py-1.5 pl-9 pr-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              • Kênh Shopee Mall
            </td>
            <td className="py-1.5 px-3 text-right bg-slate-100/50 border-r border-slate-300 text-slate-700">
              {formatNumberVi(pnlMonthly.reduce((s, m) => s + m.revenueByChannel.shopee, 0))}
            </td>
            <td className="py-1.5 px-2.5 text-right bg-slate-100/30 border-r border-slate-300 text-slate-400 text-center">
              —
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-600">
                {formatNumberVi(m.revenueByChannel.shopee)}
              </td>
            ))}
          </tr>
          <tr className="text-slate-600 text-[11px] bg-slate-50/50 hover:bg-slate-100/50">
            <td className="py-1.5 pl-9 pr-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              • Kênh TikTok Shop
            </td>
            <td className="py-1.5 px-3 text-right bg-slate-100/50 border-r border-slate-300 text-slate-700">
              {formatNumberVi(pnlMonthly.reduce((s, m) => s + m.revenueByChannel.tikTokShop, 0))}
            </td>
            <td className="py-1.5 px-2.5 text-right bg-slate-100/30 border-r border-slate-300 text-slate-400 text-center">
              —
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-600">
                {formatNumberVi(m.revenueByChannel.tikTokShop)}
              </td>
            ))}
          </tr>
          <tr className="text-slate-600 text-[11px] bg-slate-50/50 hover:bg-slate-100/50">
            <td className="py-1.5 pl-9 pr-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              • Kênh B2B &amp; Đại Lý Sỉ
            </td>
            <td className="py-1.5 px-3 text-right bg-slate-100/50 border-r border-slate-300 text-slate-700">
              {formatNumberVi(pnlMonthly.reduce((s, m) => s + m.revenueByChannel.b2b, 0))}
            </td>
            <td className="py-1.5 px-2.5 text-right bg-slate-100/30 border-r border-slate-300 text-slate-400 text-center">
              —
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-600">
                {formatNumberVi(m.revenueByChannel.b2b)}
              </td>
            ))}
          </tr>
          <tr className="text-slate-600 text-[11px] bg-slate-50/50 hover:bg-slate-100/50">
            <td className="py-1.5 pl-9 pr-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              • Kênh Bán Lẻ Khác (Retail)
            </td>
            <td className="py-1.5 px-3 text-right bg-slate-100/50 border-r border-slate-300 text-slate-700">
              {formatNumberVi(pnlMonthly.reduce((s, m) => s + m.revenueByChannel.retail, 0))}
            </td>
            <td className="py-1.5 px-2.5 text-right bg-slate-100/30 border-r border-slate-300 text-slate-400 text-center">
              —
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-600">
                {formatNumberVi(m.revenueByChannel.retail)}
              </td>
            ))}
          </tr>
        </>
      )}

      {/* =========================================================================
          HÀNG 2: 2. Doanh thu gộp (Gross Revenue) (Có nút > xem Thuế VAT & Kênh sau VAT)
          ========================================================================= */}
      <tr className="bg-blue-100/50 font-bold text-slate-900 hover:bg-blue-100/70 transition-colors border-t-2 border-b-2 border-blue-300">
        <td className="py-2.5 px-4 sticky left-0 bg-blue-100 z-20 border-r border-slate-300 font-sans text-blue-950 font-bold shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => toggleMilestone('grossRevenue')}
                className="p-1 rounded hover:bg-blue-200 text-blue-800 transition-colors cursor-pointer mr-1 inline-flex items-center justify-center"
                title={expandedMilestones.grossRevenue ? 'Thu gọn chi tiết Doanh thu gộp' : 'Xem chi tiết Thuế VAT & Doanh thu gộp sau VAT'}
              >
                {expandedMilestones.grossRevenue ? (
                  <ChevronDown className="w-4 h-4 text-blue-900" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-blue-900" />
                )}
              </button>
              <span>2. Doanh thu gộp (Gross Revenue)</span>
            </div>
            <span className="text-[10px] text-blue-800 bg-blue-200/80 px-1.5 py-0.5 rounded font-semibold font-mono">
              Gốc chuẩn 100%
            </span>
          </div>
        </td>
        <td className="py-2.5 px-3 text-right bg-blue-200/60 text-blue-950 border-r border-slate-300 font-bold">
          {formatNumberVi(pnlSummary.grossRevenueAfterVat)}
        </td>
        <td className="py-2.5 px-2.5 text-right bg-blue-200/90 text-blue-950 border-r border-slate-300 font-bold text-xs">
          100.0%
        </td>
        {pnlMonthly.map((m) => (
          <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-blue-950 font-bold">
            {formatNumberVi(m.grossRevenueAfterVat)}
          </td>
        ))}
      </tr>

      {/* Chi tiết Thuế VAT & Doanh thu gộp sau VAT theo từng kênh */}
      {expandedMilestones.grossRevenue && (
        <>
          <tr className="text-slate-700 bg-blue-50/30 hover:bg-blue-50/60 transition-colors">
            <td className="py-1.5 pl-9 pr-4 sticky left-0 bg-blue-50/40 z-20 border-r border-slate-200 font-sans text-rose-800 font-medium shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span>• Thuế VAT đầu ra phải nộp ({vatRate}%)</span>
                <span className="text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  Khấu trừ từ GMV
                </span>
              </div>
            </td>
            <td className="py-1.5 px-3 text-right bg-slate-50 border-r border-slate-300 text-rose-700 font-medium">
              -{formatNumberVi(pnlSummary.vatOutput)}
            </td>
            <td className="py-1.5 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500 text-[11px]">
              {calcExpenseRatio(pnlSummary.vatOutput)}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700">
                -{formatNumberVi(m.vatOutput)}
              </td>
            ))}
          </tr>
          <tr className="text-slate-600 text-[11px] bg-slate-50/30 hover:bg-slate-50/60">
            <td className="py-1.5 pl-9 pr-4 sticky left-0 bg-slate-50/40 z-20 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              • Kênh Shopee Mall (sau VAT)
            </td>
            <td className="py-1.5 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
              {formatNumberVi(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.shopee * (1 - vatRate / 100)), 0))}
            </td>
            <td className="py-1.5 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500 text-[11px]">
              {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.shopee * (1 - vatRate / 100)), 0))}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-600">
                {formatNumberVi(Math.round(m.revenueByChannel.shopee * (1 - vatRate / 100)))}
              </td>
            ))}
          </tr>
          <tr className="text-slate-600 text-[11px] bg-slate-50/30 hover:bg-slate-50/60">
            <td className="py-1.5 pl-9 pr-4 sticky left-0 bg-slate-50/40 z-20 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              • Kênh TikTok Shop (sau VAT)
            </td>
            <td className="py-1.5 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
              {formatNumberVi(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.tikTokShop * (1 - vatRate / 100)), 0))}
            </td>
            <td className="py-1.5 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500 text-[11px]">
              {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.tikTokShop * (1 - vatRate / 100)), 0))}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-600">
                {formatNumberVi(Math.round(m.revenueByChannel.tikTokShop * (1 - vatRate / 100)))}
              </td>
            ))}
          </tr>
          <tr className="text-slate-600 text-[11px] bg-slate-50/30 hover:bg-slate-50/60">
            <td className="py-1.5 pl-9 pr-4 sticky left-0 bg-slate-50/40 z-20 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              • Kênh B2B &amp; Đại Lý Sỉ (sau VAT)
            </td>
            <td className="py-1.5 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
              {formatNumberVi(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.b2b * (1 - vatRate / 100)), 0))}
            </td>
            <td className="py-1.5 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500 text-[11px]">
              {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.b2b * (1 - vatRate / 100)), 0))}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-600">
                {formatNumberVi(Math.round(m.revenueByChannel.b2b * (1 - vatRate / 100)))}
              </td>
            ))}
          </tr>
          <tr className="text-slate-600 text-[11px] bg-slate-50/30 hover:bg-slate-50/60">
            <td className="py-1.5 pl-9 pr-4 sticky left-0 bg-slate-50/40 z-20 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              • Kênh Bán Lẻ Khác (Retail sau VAT)
            </td>
            <td className="py-1.5 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
              {formatNumberVi(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.retail * (1 - vatRate / 100)), 0))}
            </td>
            <td className="py-1.5 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500 text-[11px]">
              {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.retail * (1 - vatRate / 100)), 0))}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-600">
                {formatNumberVi(Math.round(m.revenueByChannel.retail * (1 - vatRate / 100)))}
              </td>
            ))}
          </tr>
        </>
      )}

      {/* =========================================================================
          HÀNG 3: 3. Doanh thu thuần (Net Revenue) (Có nút > xem Chi phí sàn & Ship)
          ========================================================================= */}
      <tr className="bg-emerald-100/50 font-bold text-emerald-950 hover:bg-emerald-100/70 transition-colors border-t-2 border-b-2 border-emerald-300">
        <td className="py-2.5 px-4 sticky left-0 bg-emerald-100 z-20 border-r border-slate-300 font-sans text-emerald-950 font-bold shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => toggleMilestone('netRevenue')}
                className="p-1 rounded hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer mr-1 inline-flex items-center justify-center"
                title={expandedMilestones.netRevenue ? 'Thu gọn chi tiết Doanh thu thuần' : 'Xem chi tiết Chi phí sàn TMĐT & Vận chuyển'}
              >
                {expandedMilestones.netRevenue ? (
                  <ChevronDown className="w-4 h-4 text-emerald-900" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-emerald-900" />
                )}
              </button>
              <span>3. Doanh thu thuần (Net Revenue)</span>
            </div>
            <span className="text-[10px] text-emerald-800 bg-emerald-200/80 px-1.5 py-0.5 rounded font-semibold font-mono">
              Sau phí sàn &amp; ship
            </span>
          </div>
        </td>
        <td className="py-2.5 px-3 text-right bg-emerald-200/70 text-emerald-950 border-r border-slate-300 font-bold">
          {formatNumberVi(pnlSummary.netRevenue)}
        </td>
        <td className="py-2.5 px-2.5 text-right bg-emerald-100/70 text-emerald-950 border-r border-slate-300 font-bold text-[11px]">
          {calcExpenseRatio(pnlSummary.netRevenue)}
        </td>
        {pnlMonthly.map((m) => (
          <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-emerald-950 font-bold">
            {formatNumberVi(m.netRevenue)}
          </td>
        ))}
      </tr>

      {/* Chi tiết Chi phí sàn TMĐT & Chi phí vận chuyển */}
      {expandedMilestones.netRevenue && (
        <>
          {/* Nhóm Chi phí sàn (TMĐT) */}
          <tr className="bg-rose-50/40 font-semibold text-rose-900 hover:bg-rose-50 transition-colors">
            <td className="py-2 px-4 sticky left-0 bg-rose-50 z-20 border-r border-slate-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-950 pl-5">• Chi phí sàn (TMĐT)</span>
                <button
                  onClick={() => toggleSubGroup('platformFees')}
                  className="p-1 hover:bg-rose-100 rounded text-rose-600 transition-colors cursor-pointer"
                  title="Bật/tắt 5 phí sàn con"
                >
                  {expandedSubGroups.platformFees ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </td>
            <td className="py-2 px-3 text-right bg-rose-100/50 text-rose-900 border-r border-slate-300 font-bold">
              -{formatNumberVi(pnlSummary.platformFees)}
            </td>
            <td className="py-2 px-2.5 text-right bg-rose-50/50 text-rose-800 border-r border-slate-300 text-[11px] font-medium">
              {calcExpenseRatio(pnlSummary.platformFees)}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                -{formatNumberVi(m.platformFees.total)}
              </td>
            ))}
          </tr>

          {expandedSubGroups.platformFees && (
            <>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Phí thanh toán sàn
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.platformFees.paymentFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.paymentFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.platformFees.paymentFee)}
                  </td>
                ))}
              </tr>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Phí hoa hồng nền tảng
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.platformFees.commissionFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.commissionFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.platformFees.commissionFee)}
                  </td>
                ))}
              </tr>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Phí dịch vụ Voucher Xtra
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.platformFees.voucherXtraFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.voucherXtraFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.platformFees.voucherXtraFee)}
                  </td>
                ))}
              </tr>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Phí xử lý đơn hàng
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.platformFees.handlingFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.handlingFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.platformFees.handlingFee)}
                  </td>
                ))}
              </tr>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Phí bồi hoàn sàn
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.platformFees.compensationFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.compensationFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.platformFees.compensationFee)}
                  </td>
                ))}
              </tr>
            </>
          )}

          {/* Nhóm Chi phí vận chuyển (B2B/Retail) */}
          <tr className="text-slate-800 hover:bg-slate-50/70 transition-colors">
            <td className="py-2 px-4 sticky left-0 bg-white z-20 border-r border-slate-300 font-sans text-slate-800 font-medium shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span className="pl-5">• Chi phí vận chuyển (B2B/Retail)</span>
                <button
                  onClick={() => toggleSubGroup('shippingFees')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors cursor-pointer"
                  title="Bật/tắt 2 phí vận chuyển con"
                >
                  {expandedSubGroups.shippingFees ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </td>
            <td className="py-2 px-3 text-right bg-slate-50 border-r border-slate-300 text-rose-700 font-medium">
              -{formatNumberVi(pnlSummary.shippingB2bRetail)}
            </td>
            <td className="py-2 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500 text-[11px]">
              {calcExpenseRatio(pnlSummary.shippingB2bRetail)}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-700">
                -{formatNumberVi(m.shippingB2bRetail.total)}
              </td>
            ))}
          </tr>

          {expandedSubGroups.shippingFees && (
            <>
              <tr className="text-slate-500 text-[11px] hover:bg-slate-50/50">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-500 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Vận chuyển B2B (Logistics 5%)
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-600">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.b2bShipping, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-400">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.b2bShipping, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-500">
                    -{formatNumberVi(m.shippingB2bRetail.b2bShipping)}
                  </td>
                ))}
              </tr>
              <tr className="text-slate-500 text-[11px] hover:bg-slate-50/50">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-500 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Vận chuyển Retail (COD giao hàng)
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-600">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.retailShipping, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-400">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.retailShipping, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-500">
                    -{formatNumberVi(m.shippingB2bRetail.retailShipping)}
                  </td>
                ))}
              </tr>
            </>
          )}
        </>
      )}

      {/* =========================================================================
          HÀNG 4: 4. Lợi nhuận gộp (Có nút > xem Giá vốn hàng bán COGS)
          ========================================================================= */}
      <tr className="bg-teal-100/50 font-bold text-teal-950 hover:bg-teal-100/70 transition-colors border-t-2 border-b-2 border-teal-300">
        <td className="py-2.5 px-4 sticky left-0 bg-teal-100 z-20 border-r border-slate-300 font-sans text-teal-950 font-bold shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => toggleMilestone('grossProfit')}
                className="p-1 rounded hover:bg-teal-200 text-teal-800 transition-colors cursor-pointer mr-1 inline-flex items-center justify-center"
                title={expandedMilestones.grossProfit ? 'Thu gọn chi tiết Lợi nhuận gộp' : 'Xem chi tiết Giá vốn hàng bán (COGS)'}
              >
                {expandedMilestones.grossProfit ? (
                  <ChevronDown className="w-4 h-4 text-teal-900" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-teal-900" />
                )}
              </button>
              <span>4. Lợi nhuận gộp</span>
            </div>
            <span className="text-[10px] text-teal-800 bg-teal-200/80 px-1.5 py-0.5 rounded font-semibold font-mono">
              Sau COGS
            </span>
          </div>
        </td>
        <td className="py-2.5 px-3 text-right bg-teal-200/70 text-teal-950 border-r border-slate-300 font-bold">
          {formatNumberVi(pnlSummary.grossProfit)}
        </td>
        <td className="py-2.5 px-2.5 text-right bg-teal-100/70 text-teal-950 border-r border-slate-300 font-bold text-[11px]">
          {calcProfitRatio(pnlSummary.grossProfit)}
        </td>
        {pnlMonthly.map((m) => (
          <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-teal-950 font-bold">
            {formatNumberVi(m.grossProfit)}
          </td>
        ))}
      </tr>

      {/* Chi tiết Giá vốn hàng bán (COGS) */}
      {expandedMilestones.grossProfit && (
        <tr className="text-amber-900 bg-amber-50/30 hover:bg-amber-50/60 transition-colors font-medium">
          <td className="py-2 pl-9 pr-4 sticky left-0 bg-amber-50/40 z-20 border-r border-slate-300 font-sans text-amber-950 font-medium shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <span>• Giá vốn hàng bán (COGS)</span>
              <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                BOM &amp; MOQ Tab 3
              </span>
            </div>
          </td>
          <td className="py-2 px-3 text-right bg-amber-50/60 text-amber-950 border-r border-slate-300 font-semibold">
            -{formatNumberVi(pnlSummary.cogsSales)}
          </td>
          <td className="py-2 px-2.5 text-right bg-amber-50/40 text-amber-800 border-r border-slate-300 text-[11px]">
            {calcExpenseRatio(pnlSummary.cogsSales)}
          </td>
          {pnlMonthly.map((m) => (
            <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-amber-900 font-medium">
              -{formatNumberVi(m.cogsSales)}
            </td>
          ))}
        </tr>
      )}

      {/* =========================================================================
          HÀNG 5: 5. Lợi nhuận trước thuế (EBIT) (Có nút > xem 5 Chi phí hoạt động & Thuế)
          ========================================================================= */}
      <tr className={`font-bold border-t-2 border-b-2 transition-colors ${
        pnlSummary.ebit >= 0 
          ? 'bg-indigo-50/80 text-indigo-950 border-indigo-300 hover:bg-indigo-100/70' 
          : 'bg-rose-100/50 text-rose-950 border-rose-300 hover:bg-rose-100/70'
      }`}>
        <td className={`py-2.5 px-4 sticky left-0 z-20 border-r border-slate-300 font-sans font-bold shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] ${
          pnlSummary.ebit >= 0 ? 'bg-indigo-50 text-indigo-950' : 'bg-rose-100 text-rose-950'
        }`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => toggleMilestone('ebit')}
                className={`p-1 rounded transition-colors cursor-pointer mr-1 inline-flex items-center justify-center ${
                  pnlSummary.ebit >= 0 ? 'hover:bg-indigo-200 text-indigo-800' : 'hover:bg-rose-200 text-rose-800'
                }`}
                title={expandedMilestones.ebit ? 'Thu gọn chi tiết EBIT' : 'Xem chi tiết Chi phí Marketing, Fulfillment, Vận hành, Nhân sự, Thuế'}
              >
                {expandedMilestones.ebit ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              <span>5. Lợi nhuận trước thuế (EBIT)</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              pnlSummary.ebit >= 0 ? 'bg-indigo-200/80 text-indigo-900' : 'bg-rose-200 text-rose-900'
            }`}>
              {pnlSummary.ebit >= 0 ? 'Lãi trước thuế' : 'Lỗ trước thuế'}
            </span>
          </div>
        </td>
        <td className={`py-2.5 px-3 text-right border-r border-slate-300 font-bold ${
          pnlSummary.ebit >= 0 ? 'bg-indigo-100/80 text-indigo-950' : 'bg-rose-200/60 text-rose-900'
        }`}>
          {pnlSummary.ebit >= 0 ? '+' : ''}{formatNumberVi(pnlSummary.ebit)}
        </td>
        <td className={`py-2.5 px-2.5 text-right border-r border-slate-300 font-bold text-xs ${
          pnlSummary.ebit >= 0 ? 'bg-indigo-100/90 text-indigo-950' : 'bg-rose-200/90 text-rose-950'
        }`}>
          {calcProfitRatio(pnlSummary.ebit)}
        </td>
        {pnlMonthly.map((m) => (
          <td key={m.month.id} className={`py-2.5 px-3 text-right border-r border-slate-200 font-bold ${
            m.ebit >= 0 ? 'text-indigo-950' : 'text-rose-800'
          }`}>
            {m.ebit >= 0 ? '+' : ''}{formatNumberVi(m.ebit)}
          </td>
        ))}
      </tr>

      {/* Chi tiết Chi phí MKT sàn, MKT tổng thể, Fulfillment, Nhân sự, Vận hành, Thuế TNDN */}
      {expandedMilestones.ebit && (
        <>
          {/* 1. Chi phí MKT Sàn TMĐT */}
          <tr className="bg-slate-50/70 font-semibold text-slate-800 hover:bg-slate-100/60 transition-colors">
            <td className="py-2 px-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 pl-5">• Chi phí MKT Sàn TMĐT</span>
                <button
                  onClick={() => toggleSubGroup('mktPlatform')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                  title="Bật/tắt phí con"
                >
                  {expandedSubGroups.mktPlatform ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </td>
            <td className="py-2 px-3 text-right bg-slate-100/80 text-rose-800 border-r border-slate-300 font-bold">
              -{formatNumberVi(pnlSummary.marketingPlatform)}
            </td>
            <td className="py-2 px-2.5 text-right bg-slate-100/50 text-slate-600 border-r border-slate-300 text-[11px] font-medium">
              {calcExpenseRatio(pnlSummary.marketingPlatform)}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                -{formatNumberVi(m.marketingPlatform.total)}
              </td>
            ))}
          </tr>

          {expandedSubGroups.mktPlatform && (
            <>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Phí Tiếp Thị Liên Kết
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.affiliateFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.affiliateFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.marketingPlatform.affiliateFee)}
                  </td>
                ))}
              </tr>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Phí Quảng Cáo Nội Sàn
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.internalAdsFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.internalAdsFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.marketingPlatform.internalAdsFee)}
                  </td>
                ))}
              </tr>
            </>
          )}

          {/* 2. Chi Phí MKT Tổng thể */}
          <tr className="bg-slate-50/70 font-semibold text-slate-800 hover:bg-slate-100/60 transition-colors">
            <td className="py-2 px-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap pl-5">
                  <span className="font-semibold text-slate-900">• Chi Phí MKT Tổng thể</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                    isMktOverBudget 
                      ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                      : isMktOnBudget 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {isMktOverBudget ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Vượt chuẩn ({actualMktRate.toFixed(1)}% &gt; {targetMktRate}%)</span>
                      </>
                    ) : isMktOnBudget ? (
                      <>
                        <Target className="w-3 h-3 text-emerald-600" />
                        <span>Đạt chuẩn ({targetMktRate}%)</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        <span>Dưới chuẩn ({actualMktRate.toFixed(1)}% &lt; {targetMktRate}%)</span>
                      </>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => toggleSubGroup('mktOverall')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors ml-2 cursor-pointer"
                  title="Bật/tắt phí con"
                >
                  {expandedSubGroups.mktOverall ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </td>
            <td className="py-2 px-3 text-right bg-slate-100/80 text-rose-800 border-r border-slate-300 font-bold">
              -{formatNumberVi(pnlSummary.marketingOverall)}
            </td>
            <td className={`py-2 px-2.5 text-right border-r border-slate-300 text-[11px] font-bold ${
              isMktOverBudget ? 'bg-rose-100/60 text-rose-800' : 'bg-slate-100/50 text-slate-700'
            }`}>
              {calcExpenseRatio(pnlSummary.marketingOverall)}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                -{formatNumberVi(m.marketingOverall.total)}
              </td>
            ))}
          </tr>

          {expandedSubGroups.mktOverall && (
            <>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Phí Booking Creator
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.marketingOverall.creatorBookingFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingOverall.creatorBookingFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.marketingOverall.creatorBookingFee)}
                  </td>
                ))}
              </tr>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Phí Sampling hàng mẫu
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.marketingOverall.samplingCogsFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingOverall.samplingCogsFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.marketingOverall.samplingCogsFee)}
                  </td>
                ))}
              </tr>
            </>
          )}

          {/* 3. Chi Phí Fulfillment */}
          <tr className="bg-slate-50/70 font-semibold text-slate-800 hover:bg-slate-100/60 transition-colors">
            <td className="py-2 px-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 pl-5">• Chi Phí Fullfilment</span>
                <button
                  onClick={() => toggleSubGroup('fulfillment')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                  title="Bật/tắt phí con"
                >
                  {expandedSubGroups.fulfillment ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </td>
            <td className="py-2 px-3 text-right bg-slate-100/80 text-rose-800 border-r border-slate-300 font-bold">
              -{formatNumberVi(pnlSummary.fulfillment)}
            </td>
            <td className="py-2 px-2.5 text-right bg-slate-100/50 text-slate-600 border-r border-slate-300 text-[11px] font-medium">
              {calcExpenseRatio(pnlSummary.fulfillment)}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                -{formatNumberVi(m.fulfillment.total)}
              </td>
            ))}
          </tr>

          {expandedSubGroups.fulfillment && (
            <>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Chi phí bao bì đóng gói
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.fulfillment.packagingFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.fulfillment.packagingFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.fulfillment.packagingFee)}
                  </td>
                ))}
              </tr>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Chi phí hao hụt/lưu kho
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.fulfillment.shrinkageWarehouseFee, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.fulfillment.shrinkageWarehouseFee, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.fulfillment.shrinkageWarehouseFee)}
                  </td>
                ))}
              </tr>
            </>
          )}

          {/* 4. Chi phí nhân sự */}
          <tr className="bg-slate-50/80 font-semibold text-slate-900 hover:bg-slate-100/60 transition-colors">
            <td className="py-2 pl-9 pr-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-300 font-sans text-slate-900 font-semibold shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              • Chi phí nhân sự
            </td>
            <td className="py-2 px-3 text-right bg-slate-100/80 text-rose-800 border-r border-slate-300 font-bold">
              -{formatNumberVi(pnlSummary.laborCost)}
            </td>
            <td className="py-2 px-2.5 text-right bg-slate-100/50 text-slate-600 border-r border-slate-300 text-[11px] font-medium">
              {calcExpenseRatio(pnlSummary.laborCost)}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                -{formatNumberVi(m.laborCost)}
              </td>
            ))}
          </tr>

          {/* 5. Chi phí vận hành */}
          <tr className="bg-slate-50/70 font-semibold text-slate-800 hover:bg-slate-100/60 transition-colors">
            <td className="py-2 px-4 sticky left-0 bg-slate-50 z-20 border-r border-slate-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 pl-5">• Chi phí vận hành</span>
                <button
                  onClick={() => toggleSubGroup('operating')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                  title="Bật/tắt phí con"
                >
                  {expandedSubGroups.operating ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </td>
            <td className="py-2 px-3 text-right bg-slate-100/80 text-rose-800 border-r border-slate-300 font-bold">
              -{formatNumberVi(pnlSummary.operatingExpenses)}
            </td>
            <td className="py-2 px-2.5 text-right bg-slate-100/50 text-slate-600 border-r border-slate-300 text-[11px] font-medium">
              {calcExpenseRatio(pnlSummary.operatingExpenses)}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                -{formatNumberVi(m.operatingExpenses.total)}
              </td>
            ))}
          </tr>

          {expandedSubGroups.operating && (
            <>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Trích khấu hao tài sản ban đầu
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.capexDepreciation, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.capexDepreciation, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.operatingExpenses.capexDepreciation)}
                  </td>
                ))}
              </tr>
              <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                <td className="py-1 pl-12 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  - Chi phí vận hành
                </td>
                <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                  -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.operatingOpex, 0))}
                </td>
                <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                  {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.operatingOpex, 0))}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    -{formatNumberVi(m.operatingExpenses.operatingOpex)}
                  </td>
                ))}
              </tr>
            </>
          )}

          {/* 6. Thuế TNDN */}
          <tr className="text-slate-700 hover:bg-slate-50/60 transition-colors">
            <td className="py-2 pl-9 pr-4 sticky left-0 bg-white z-20 border-r border-slate-200 font-sans text-slate-700 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span>• Thuế TNDN</span>
                <span className="text-[10px] text-slate-400 font-mono">20% khi EBIT &gt; 0</span>
              </div>
            </td>
            <td className="py-2 px-3 text-right bg-slate-50 border-r border-slate-300 text-rose-700 font-medium">
              -{formatNumberVi(pnlSummary.corporateTax)}
            </td>
            <td className="py-2 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500 text-[11px]">
              {calcExpenseRatio(pnlSummary.corporateTax)}
            </td>
            {pnlMonthly.map((m) => (
              <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-700">
                -{formatNumberVi(m.corporateTax)}
              </td>
            ))}
          </tr>
        </>
      )}

      {/* =========================================================================
          HÀNG 6: 6. Lợi nhuận ròng (Bottom Line)
          ========================================================================= */}
      <tr className={`font-bold text-sm border-t-2 border-b-2 ${
        pnlSummary.netProfit >= 0 
          ? 'bg-emerald-200/60 text-emerald-950 border-emerald-500 hover:bg-emerald-200/80' 
          : 'bg-rose-200/60 text-rose-950 border-rose-500 hover:bg-rose-200/80'
      }`}>
        <td className={`py-3 px-4 sticky left-0 z-20 border-r border-slate-400 font-sans font-bold shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] ${
          pnlSummary.netProfit >= 0 ? 'bg-emerald-200 text-emerald-950' : 'bg-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1.5 pl-6">
              <span>6. Lợi nhuận ròng</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
              pnlSummary.netProfit >= 0 ? 'bg-emerald-300/80 text-emerald-950' : 'bg-rose-300/80 text-rose-950'
            }`}>
              {pnlSummary.netProfit >= 0 ? 'LÃI RÒNG' : 'LỖ RÒNG'}
            </span>
          </div>
        </td>
        <td className={`py-3 px-3 text-right border-r border-slate-400 font-mono font-bold ${
          pnlSummary.netProfit >= 0 ? 'text-emerald-950 bg-emerald-300/40' : 'text-rose-950 bg-rose-300/40'
        }`}>
          {pnlSummary.netProfit >= 0 ? '+' : ''}{formatNumberVi(pnlSummary.netProfit)}
        </td>
        <td className={`py-3 px-2.5 text-right border-r border-slate-400 font-mono font-bold text-xs ${
          pnlSummary.netProfit >= 0 ? 'text-emerald-950 bg-emerald-300/40' : 'text-rose-950 bg-rose-300/40'
        }`}>
          {calcProfitRatio(pnlSummary.netProfit)}
        </td>
        {pnlMonthly.map((m) => (
          <td
            key={m.month.id}
            className={`py-3 px-3 text-right border-r border-slate-300 font-mono font-bold ${
              m.netProfit >= 0 ? 'text-emerald-950' : 'text-rose-800'
            }`}
          >
            {m.netProfit >= 0 ? '+' : ''}{formatNumberVi(m.netProfit)}
          </td>
        ))}
      </tr>
    </>
  );
};
