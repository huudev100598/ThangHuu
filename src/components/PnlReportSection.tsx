import React, { useState } from 'react';
import { SalesMonth } from '../types/salesForecast';
import { MonthlyPnlRecord } from '../utils/reportCalculations';
import { ProjectParameters } from '../types/financial';
import { formatNumberVi } from '../utils/formatters';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  DollarSign, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowUpDown,
  Download,
  Info,
  Target,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { PnlTableRows } from './PnlTableRows';

interface PnlReportSectionProps {
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
  parameters?: ProjectParameters;
}

export const PnlReportSection: React.FC<PnlReportSectionProps> = ({
  months,
  pnlMonthly,
  pnlSummary,
  parameters,
}) => {
  // Trạng thái mở rộng chi tiết của 5 hàng cốt lõi:
  // 1. Doanh thu GMV, 2. Doanh thu gộp (Gross Revenue), 3. Doanh thu thuần (Net Revenue), 4. Lợi nhuận gộp, 5. Lợi nhuận trước thuế (EBIT)
  const [expandedMilestones, setExpandedMilestones] = useState<{
    gmv: boolean;
    grossRevenue: boolean;
    netRevenue: boolean;
    grossProfit: boolean;
    ebit: boolean;
  }>({
    gmv: false,
    grossRevenue: false,
    netRevenue: false,
    grossProfit: false,
    ebit: false,
  });

  // Trạng thái thu gọn / mở rộng chi tiết các nhóm chi phí con bên trong
  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>({
    platformFees: true,
    shippingFees: true,
    mktPlatform: true,
    mktOverall: true,
    fulfillment: true,
    operating: true,
  });

  const [showCostAuditModal, setShowCostAuditModal] = useState<boolean>(false);

  const toggleMilestone = (key: keyof typeof expandedMilestones) => {
    setExpandedMilestones((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSubGroup = (key: string) => {
    setExpandedSubGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Xác định trạng thái thu gọn toàn bộ (cả 5 hàng đều đang đóng)
  const isAllCollapsed = !expandedMilestones.gmv && !expandedMilestones.grossRevenue && !expandedMilestones.netRevenue && !expandedMilestones.grossProfit && !expandedMilestones.ebit;
  const isAllExpanded = expandedMilestones.gmv && expandedMilestones.grossRevenue && expandedMilestones.netRevenue && expandedMilestones.grossProfit && expandedMilestones.ebit;

  const expandAll = () => {
    setExpandedMilestones({
      gmv: true,
      grossRevenue: true,
      netRevenue: true,
      grossProfit: true,
      ebit: true,
    });
    setExpandedSubGroups({
      platformFees: true,
      shippingFees: true,
      mktPlatform: true,
      mktOverall: true,
      fulfillment: true,
      operating: true,
    });
  };

  const collapseAll = () => {
    setExpandedMilestones({
      gmv: false,
      grossRevenue: false,
      netRevenue: false,
      grossProfit: false,
      ebit: false,
    });
    setExpandedSubGroups({
      platformFees: false,
      shippingFees: false,
      mktPlatform: false,
      mktOverall: false,
      fulfillment: false,
      operating: false,
    });
  };

  const handleToggleCompact = () => {
    if (isAllCollapsed) {
      expandAll();
    } else {
      collapseAll();
    }
  };

  // CƠ SỞ TÍNH TỶ TRỌNG (100%): 2. Doanh thu gộp (Gross Revenue) sau khi trừ VAT
  const baseRevenue = pnlSummary.grossRevenueAfterVat;

  // Tính tỷ trọng cho các khoản chi phí (dương %)
  const calcExpenseRatio = (val: number) => {
    if (!baseRevenue || baseRevenue === 0) return '0.0%';
    const ratio = (Math.abs(val) / baseRevenue) * 100;
    return `${ratio.toFixed(1)}%`;
  };

  // Tính tỷ trọng cho các chỉ tiêu lợi nhuận (EBIT, Lợi nhuận ròng, Lợi nhuận gộp) - GIỮ NGUYÊN DẤU ÂM NẾU LỖ
  const calcProfitRatio = (val: number) => {
    if (!baseRevenue || baseRevenue === 0) return '0.0%';
    const ratio = (val / baseRevenue) * 100;
    if (ratio === 0) return '0.0%';
    return `${ratio > 0 ? '+' : ''}${ratio.toFixed(1)}%`;
  };

  // Thuế suất VAT lấy theo thông số chung (Tab 1)
  const vatRate = parameters?.taxAndCapital?.vatOutputRate ?? 8;

  // Định mức % Chi phí Marketing tổng thể thiết lập tại Thông Số Chung (Tab 1)
  const targetMktRate = parameters?.marketingBaseline?.marketingBudgetRateGmv ?? 15;
  const actualMktRate = baseRevenue > 0 ? (pnlSummary.marketingOverall / baseRevenue) * 100 : 0;
  const mktDiff = actualMktRate - targetMktRate;

  // Trạng thái ngân sách MKT Tổng Thể
  const isMktOverBudget = mktDiff > 0.1;
  const isMktOnBudget = Math.abs(mktDiff) <= 0.1;
  const isMktUnderBudget = mktDiff < -0.1;

  // Xuất file CSV báo cáo P&L (hỗ trợ cả chế độ thu gọn 6 hàng cốt lõi và chi tiết từng hàng)
  const handleExportCsv = () => {
    const headers = ['Chỉ Tiêu / Khoản Mục', 'Tổng Cả Kỳ (VNĐ)', 'Tỷ Trọng (% Doanh Thu Gộp)', ...months.map((m) => m.label)];
    let rows: (string | number)[][] = [];

    if (isAllCollapsed) {
      rows = [
        ['1. Doanh thu GMV', pnlSummary.grossRevenue, '—', ...pnlMonthly.map((m) => m.grossRevenue)],
        ['2. Doanh thu gộp (Gross Revenue)', pnlSummary.grossRevenueAfterVat, '100.0%', ...pnlMonthly.map((m) => m.grossRevenueAfterVat)],
        ['3. Doanh thu thuần (Net Revenue)', pnlSummary.netRevenue, calcExpenseRatio(pnlSummary.netRevenue), ...pnlMonthly.map((m) => m.netRevenue)],
        ['4. Lợi nhuận gộp', pnlSummary.grossProfit, calcProfitRatio(pnlSummary.grossProfit), ...pnlMonthly.map((m) => m.grossProfit)],
        ['5. Lợi nhuận trước thuế (EBIT)', pnlSummary.ebit, calcProfitRatio(pnlSummary.ebit), ...pnlMonthly.map((m) => m.ebit)],
        ['6. Lợi nhuận ròng', pnlSummary.netProfit, calcProfitRatio(pnlSummary.netProfit), ...pnlMonthly.map((m) => m.netProfit)],
      ];
    } else {
      // Xuất linh hoạt theo các mục đang được mở rộng
      rows.push(['1. Doanh thu GMV', pnlSummary.grossRevenue, '—', ...pnlMonthly.map((m) => m.grossRevenue)]);
      if (expandedMilestones.gmv) {
        rows.push(['  • Kênh Shopee Mall', pnlMonthly.reduce((s, m) => s + m.revenueByChannel.shopee, 0), '—', ...pnlMonthly.map((m) => m.revenueByChannel.shopee)]);
        rows.push(['  • Kênh TikTok Shop', pnlMonthly.reduce((s, m) => s + m.revenueByChannel.tikTokShop, 0), '—', ...pnlMonthly.map((m) => m.revenueByChannel.tikTokShop)]);
        rows.push(['  • Kênh B2B & Đại Lý Sỉ', pnlMonthly.reduce((s, m) => s + m.revenueByChannel.b2b, 0), '—', ...pnlMonthly.map((m) => m.revenueByChannel.b2b)]);
        rows.push(['  • Kênh Bán Lẻ Khác (Retail)', pnlMonthly.reduce((s, m) => s + m.revenueByChannel.retail, 0), '—', ...pnlMonthly.map((m) => m.revenueByChannel.retail)]);
      }

      rows.push(['2. Doanh thu gộp (Gross Revenue)', pnlSummary.grossRevenueAfterVat, '100.0%', ...pnlMonthly.map((m) => m.grossRevenueAfterVat)]);
      if (expandedMilestones.grossRevenue) {
        rows.push([`  • Thuế VAT đầu ra phải nộp (${vatRate}%)`, -pnlSummary.vatOutput, calcExpenseRatio(pnlSummary.vatOutput), ...pnlMonthly.map((m) => -m.vatOutput)]);
        rows.push(['  • Kênh Shopee Mall (sau VAT)', pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.shopee * (1 - vatRate / 100)), 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.shopee * (1 - vatRate / 100)), 0)), ...pnlMonthly.map((m) => Math.round(m.revenueByChannel.shopee * (1 - vatRate / 100)))]);
        rows.push(['  • Kênh TikTok Shop (sau VAT)', pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.tikTokShop * (1 - vatRate / 100)), 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.tikTokShop * (1 - vatRate / 100)), 0)), ...pnlMonthly.map((m) => Math.round(m.revenueByChannel.tikTokShop * (1 - vatRate / 100)))]);
        rows.push(['  • Kênh B2B & Đại Lý Sỉ (sau VAT)', pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.b2b * (1 - vatRate / 100)), 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.b2b * (1 - vatRate / 100)), 0)), ...pnlMonthly.map((m) => Math.round(m.revenueByChannel.b2b * (1 - vatRate / 100)))]);
        rows.push(['  • Kênh Bán Lẻ Khác (Retail sau VAT)', pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.retail * (1 - vatRate / 100)), 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + Math.round(m.revenueByChannel.retail * (1 - vatRate / 100)), 0)), ...pnlMonthly.map((m) => Math.round(m.revenueByChannel.retail * (1 - vatRate / 100)))]);
      }

      rows.push(['3. Doanh thu thuần (Net Revenue)', pnlSummary.netRevenue, calcExpenseRatio(pnlSummary.netRevenue), ...pnlMonthly.map((m) => m.netRevenue)]);
      if (expandedMilestones.netRevenue) {
        rows.push(['  Chi phí sàn (TMĐT)', -pnlSummary.platformFees, calcExpenseRatio(pnlSummary.platformFees), ...pnlMonthly.map((m) => -m.platformFees.total)]);
        if (expandedSubGroups.platformFees) {
          rows.push(['    - Phí thanh toán sàn', -pnlMonthly.reduce((s, m) => s + m.platformFees.paymentFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.paymentFee, 0)), ...pnlMonthly.map((m) => -m.platformFees.paymentFee)]);
          rows.push(['    - Phí hoa hồng nền tảng', -pnlMonthly.reduce((s, m) => s + m.platformFees.commissionFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.commissionFee, 0)), ...pnlMonthly.map((m) => -m.platformFees.commissionFee)]);
          rows.push(['    - Phí dịch vụ Voucher Xtra', -pnlMonthly.reduce((s, m) => s + m.platformFees.voucherXtraFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.voucherXtraFee, 0)), ...pnlMonthly.map((m) => -m.platformFees.voucherXtraFee)]);
          rows.push(['    - Phí xử lý đơn hàng', -pnlMonthly.reduce((s, m) => s + m.platformFees.handlingFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.handlingFee, 0)), ...pnlMonthly.map((m) => -m.platformFees.handlingFee)]);
          rows.push(['    - Phí bồi hoàn sàn', -pnlMonthly.reduce((s, m) => s + m.platformFees.compensationFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.compensationFee, 0)), ...pnlMonthly.map((m) => -m.platformFees.compensationFee)]);
        }
        rows.push(['  Chi phí vận chuyển (B2B/Retail)', -pnlSummary.shippingB2bRetail, calcExpenseRatio(pnlSummary.shippingB2bRetail), ...pnlMonthly.map((m) => -m.shippingB2bRetail.total)]);
        if (expandedSubGroups.shippingFees) {
          rows.push(['    - Vận chuyển B2B (Logistics 5%)', -pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.b2bShipping, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.b2bShipping, 0)), ...pnlMonthly.map((m) => -m.shippingB2bRetail.b2bShipping)]);
          rows.push(['    - Vận chuyển Retail (COD giao hàng)', -pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.retailShipping, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.retailShipping, 0)), ...pnlMonthly.map((m) => -m.shippingB2bRetail.retailShipping)]);
        }
      }

      rows.push(['4. Lợi nhuận gộp', pnlSummary.grossProfit, calcProfitRatio(pnlSummary.grossProfit), ...pnlMonthly.map((m) => m.grossProfit)]);
      if (expandedMilestones.grossProfit) {
        rows.push(['  - Giá vốn hàng bán (COGS)', -pnlSummary.cogsSales, calcExpenseRatio(pnlSummary.cogsSales), ...pnlMonthly.map((m) => -m.cogsSales)]);
      }

      rows.push(['5. Lợi nhuận trước thuế (EBIT)', pnlSummary.ebit, calcProfitRatio(pnlSummary.ebit), ...pnlMonthly.map((m) => m.ebit)]);
      if (expandedMilestones.ebit) {
        rows.push(['  Chi phí MKT Sàn TMĐT', -pnlSummary.marketingPlatform, calcExpenseRatio(pnlSummary.marketingPlatform), ...pnlMonthly.map((m) => -m.marketingPlatform.total)]);
        if (expandedSubGroups.mktPlatform) {
          rows.push(['    - Phí Tiếp Thị Liên Kết', -pnlMonthly.reduce((s, m) => s + m.marketingPlatform.affiliateFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.affiliateFee, 0)), ...pnlMonthly.map((m) => -m.marketingPlatform.affiliateFee)]);
          rows.push(['    - Phí Quảng Cáo Nội Sàn', -pnlMonthly.reduce((s, m) => s + m.marketingPlatform.internalAdsFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.internalAdsFee, 0)), ...pnlMonthly.map((m) => -m.marketingPlatform.internalAdsFee)]);
        }
        rows.push(['  Chi Phí MKT Tổng thể', -pnlSummary.marketingOverall, calcExpenseRatio(pnlSummary.marketingOverall), ...pnlMonthly.map((m) => -m.marketingOverall.total)]);
        if (expandedSubGroups.mktOverall) {
          rows.push(['    - Phí Booking Creator', -pnlMonthly.reduce((s, m) => s + m.marketingOverall.creatorBookingFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingOverall.creatorBookingFee, 0)), ...pnlMonthly.map((m) => -m.marketingOverall.creatorBookingFee)]);
          rows.push(['    - Phí Sampling hàng mẫu', -pnlMonthly.reduce((s, m) => s + m.marketingOverall.samplingCogsFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingOverall.samplingCogsFee, 0)), ...pnlMonthly.map((m) => -m.marketingOverall.samplingCogsFee)]);
        }
        rows.push(['  Chi Phí Fulfillment', -pnlSummary.fulfillment, calcExpenseRatio(pnlSummary.fulfillment), ...pnlMonthly.map((m) => -m.fulfillment.total)]);
        if (expandedSubGroups.fulfillment) {
          rows.push(['    - Chi phí bao bì đóng gói', -pnlMonthly.reduce((s, m) => s + m.fulfillment.packagingFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.fulfillment.packagingFee, 0)), ...pnlMonthly.map((m) => -m.fulfillment.packagingFee)]);
          rows.push(['    - Chi phí hao hụt/lưu kho', -pnlMonthly.reduce((s, m) => s + m.fulfillment.shrinkageWarehouseFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.fulfillment.shrinkageWarehouseFee, 0)), ...pnlMonthly.map((m) => -m.fulfillment.shrinkageWarehouseFee)]);
        }
        rows.push(['  Chi phí nhân sự', -pnlSummary.laborCost, calcExpenseRatio(pnlSummary.laborCost), ...pnlMonthly.map((m) => -m.laborCost)]);
        rows.push(['  Chi phí vận hành', -pnlSummary.operatingExpenses, calcExpenseRatio(pnlSummary.operatingExpenses), ...pnlMonthly.map((m) => -m.operatingExpenses.total)]);
        if (expandedSubGroups.operating) {
          rows.push(['    - Trích khấu hao tài sản ban đầu', -pnlMonthly.reduce((s, m) => s + m.operatingExpenses.capexDepreciation, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.capexDepreciation, 0)), ...pnlMonthly.map((m) => -m.operatingExpenses.capexDepreciation)]);
          rows.push(['    - Chi phí vận hành', -pnlMonthly.reduce((s, m) => s + m.operatingExpenses.operatingOpex, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.operatingOpex, 0)), ...pnlMonthly.map((m) => -m.operatingExpenses.operatingOpex)]);
        }
        rows.push(['  Thuế TNDN', -pnlSummary.corporateTax, calcExpenseRatio(pnlSummary.corporateTax), ...pnlMonthly.map((m) => -m.corporateTax)]);
      }

      rows.push(['6. Lợi nhuận ròng', pnlSummary.netProfit, calcProfitRatio(pnlSummary.netProfit), ...pnlMonthly.map((m) => m.netProfit)]);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PnL_Bao_Cao_Hoat_Dong_Kinh_Doanh_${isAllCollapsed ? 'Thu_Gon' : 'Chi_Tiet'}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 4 Thẻ KPI Tóm Tắt P&L Toàn Kỳ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. GMV */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">1. Doanh Thu GMV</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900">
            {formatNumberVi(pnlSummary.grossRevenue)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Sản lượng: {formatNumberVi(pnlSummary.totalUnits)} sp</span>
            <span className="text-slate-400 font-mono italic">Không xét tỷ trọng</span>
          </div>
        </div>

        {/* 2. Doanh thu gộp (Cơ sở 100%) */}
        <div className="bg-blue-50/50 rounded-xl border border-blue-200 p-4 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">2. Doanh Thu Gộp</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-blue-950">
            {formatNumberVi(pnlSummary.grossRevenueAfterVat)}
          </div>
          <div className="mt-1 text-[11px] text-blue-700 flex items-center justify-between">
            <span>Đã trừ VAT ({vatRate}%)</span>
            <span className="text-blue-900 font-bold font-mono bg-blue-100 px-1.5 py-0.5 rounded">
              Chuẩn 100.0%
            </span>
          </div>
        </div>

        {/* 3. Lợi nhuận gộp */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">4. Lợi Nhuận Gộp</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-teal-700">
            {formatNumberVi(pnlSummary.grossProfit)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>COGS: {formatNumberVi(pnlSummary.cogsSales)}</span>
            <span className="text-teal-700 font-semibold font-mono">
              Tỷ trọng {calcProfitRatio(pnlSummary.grossProfit)}
            </span>
          </div>
        </div>

        {/* 4. Lợi nhuận trước thuế (EBIT) & Lợi nhuận ròng */}
        <div className={`rounded-xl border p-4 shadow-2xs transition-all ${
          pnlSummary.ebit >= 0 
            ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' 
            : 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">5. Lợi Nhuận Trước Thuế (EBIT)</span>
            <ShieldCheck className={`w-4 h-4 ${pnlSummary.ebit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className={`mt-2 text-xl font-bold font-mono ${pnlSummary.ebit >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
            {pnlSummary.ebit >= 0 ? '+' : ''}{formatNumberVi(pnlSummary.ebit)}
          </div>
          <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Ròng sau thuế: {formatNumberVi(pnlSummary.netProfit)}</span>
            <span className={`font-bold font-mono px-1.5 py-0.5 rounded ${
              pnlSummary.ebit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              EBIT {calcProfitRatio(pnlSummary.ebit)}
            </span>
          </div>
        </div>
      </div>

      {/* Banner Cảnh Báo Ngân Sách MKT Tổng Thể (Tab 1 Thông Số Chung) */}
      <div className={`rounded-xl p-3.5 sm:p-4 border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isMktOverBudget 
          ? 'bg-rose-50 border-rose-200 text-rose-950' 
          : isMktOnBudget
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-blue-50 border-blue-200 text-blue-950'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg text-white shrink-0 mt-0.5 ${
            isMktOverBudget ? 'bg-rose-600' : isMktOnBudget ? 'bg-emerald-600' : 'bg-blue-600'
          }`}>
            {isMktOverBudget ? (
              <AlertTriangle className="w-5 h-5" />
            ) : isMktOnBudget ? (
              <Target className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold">
                Cảnh Báo Chi Phí MKT Tổng Thể (Booking &amp; Sampling Creator):
              </h4>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                isMktOverBudget 
                  ? 'bg-rose-200 text-rose-900' 
                  : isMktOnBudget 
                    ? 'bg-emerald-200 text-emerald-900' 
                    : 'bg-blue-200 text-blue-900'
              }`}>
                {isMktOverBudget 
                  ? `VƯỢT ĐỊNH MỨC (+${mktDiff.toFixed(1)}%)` 
                  : isMktOnBudget 
                    ? `ĐẠT CHUẨN ĐỊNH MỨC (${targetMktRate}%)` 
                    : `DƯỚI ĐỊNH MỨC TIẾT KIỆM (${mktDiff.toFixed(1)}%)`}
              </span>
            </div>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
              Chi phí MKT Tổng thể thực tế toàn kỳ là <strong className="font-mono">{formatNumberVi(pnlSummary.marketingOverall)}</strong>, 
              chiếm <strong className="font-mono">{actualMktRate.toFixed(1)}%</strong> Doanh thu gộp 
              (So với định mức cài đặt tại Thông Số Chung là <strong className="font-mono">{targetMktRate}%</strong>).
              {isMktOverBudget && ' Cần tối ưu lại số lượng KOC/KOL hoặc phí booking tại Tab 4 để tránh thâm hụt ngân sách.'}
              {isMktUnderBudget && ' Ngân sách Marketing tổng thể đang được kiểm soát an toàn trong ngưỡng cho phép.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCostAuditModal(true)}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Chi Tiết Phân Bổ</span>
        </button>
      </div>

      {/* Bảng Chi Tiết P&L Đầy Đủ Theo Chuẩn Biểu Mẫu Người Dùng */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        {/* Header Công cụ Bảng */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-700 text-white shadow-2xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH (P&amp;L DỰ ÁN)
                </h3>
                {isAllCollapsed ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Chế độ thu gọn (6 hàng cốt lõi)
                  </span>
                ) : isAllExpanded ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Chế độ mở rộng toàn bộ
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                    Đang mở rộng ({Object.values(expandedMilestones).filter(Boolean).length}/5 hàng)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Tỷ trọng chuẩn hóa theo <strong className="text-slate-800">2. Doanh thu gộp (Gross Revenue = 100.0%)</strong> (Đơn vị tính: VNĐ)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Nút Thu gọn (chỉ hiển thị 6 dòng cốt lõi) */}
            <button
              onClick={collapseAll}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isAllCollapsed
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
              title="Chỉ hiển thị 6 hàng cốt lõi: 1. Doanh thu GMV, 2. Doanh thu gộp, 3. Doanh thu thuần, 4. Lợi nhuận gộp, 5. EBIT, 6. Lợi nhuận ròng"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Thu gọn</span>
            </button>

            {/* Nút Mở rộng tất cả */}
            <button
              onClick={expandAll}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isAllExpanded
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
              title="Mở rộng chi tiết tất cả 5 hàng cốt lõi và các nhóm chi phí con"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Mở rộng tất cả</span>
            </button>

            {/* Nút Xuất CSV */}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* Bảng P&L chuẩn theo mẫu file đính kèm */}
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-300">
                <th className="py-3 px-4 min-w-[280px] sm:min-w-[340px] sticky left-0 bg-slate-100 z-30 border-r border-slate-300 text-slate-900 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  Chỉ Tiêu / Khoản Mục (VNĐ)
                </th>
                <th className="py-3 px-3 min-w-[130px] text-right bg-slate-200 border-r border-slate-300 text-slate-950 font-bold font-mono">
                  Tổng Cả Kỳ
                </th>
                <th className="py-3 px-2.5 min-w-[85px] text-right bg-blue-100 border-r border-slate-300 text-blue-950 font-bold font-mono">
                  Tỷ Trọng
                </th>
                {months.map((m) => (
                  <th key={m.id} className="py-3 px-3 min-w-[115px] text-right border-r border-slate-200 text-slate-800 font-semibold font-mono">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              <PnlTableRows
                months={months}
                pnlMonthly={pnlMonthly}
                pnlSummary={pnlSummary}
                expandedMilestones={expandedMilestones}
                toggleMilestone={toggleMilestone}
                expandedSubGroups={expandedSubGroups}
                toggleSubGroup={toggleSubGroup}
                calcExpenseRatio={calcExpenseRatio}
                calcProfitRatio={calcProfitRatio}
                vatRate={vatRate}
                targetMktRate={targetMktRate}
                actualMktRate={actualMktRate}
                isMktOverBudget={isMktOverBudget}
                isMktOnBudget={isMktOnBudget}
              />
            </tbody>
          </table>
        </div>

        {/* Footer Ghi chú & Phân tích cấu trúc */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
            <span>Tỷ trọng (%) được tính trên <strong>2. Doanh thu gộp (Gross Revenue = 100.0%)</strong> toàn kỳ. 1. Doanh thu GMV không tính tỷ trọng.</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Biên Lợi Nhuận Gộp: <strong className="text-teal-800 font-mono">{calcProfitRatio(pnlSummary.grossProfit)}</strong></span>
            <span>Tỷ Suất Lợi Nhuận Ròng (ROS): <strong className={`font-mono font-bold ${
              pnlSummary.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
            }`}>{calcProfitRatio(pnlSummary.netProfit)}</strong></span>
          </div>
        </div>
      </div>

      {/* Modal Bảng Đối Soát & Kiểm Tra Phân Bổ Chi Phí Kế Hoạch */}
      {showCostAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Bảng Đối Soát &amp; Phân Bổ Đầy Đủ Chi Phí Dự Án</h3>
                  <p className="text-[11px] text-slate-400">Rà soát 100% các hạng mục chi phí theo kế hoạch kinh doanh</p>
                </div>
              </div>
              <button
                onClick={() => setShowCostAuditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto space-y-3 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="font-bold text-blue-950 flex items-center justify-between">
                  <span>Quy Chuẩn Tỷ Trọng (% Doanh Thu Gộp)</span>
                  <span className="text-blue-800 font-mono font-bold">Chuẩn 100%</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">
                  Mục <strong>2. Doanh thu gộp (Gross Revenue)</strong> làm mốc cơ sở 100%. Mục <strong>1. Doanh thu GMV</strong> không hiển thị tỷ trọng. Các chỉ tiêu lợi nhuận (EBIT, Lợi nhuận ròng) khi âm sẽ mang dấu âm chính xác (ví dụ -5.2%).
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>1. Giá vốn hàng bán (COGS)</span>
                  <span className="text-emerald-700">Đã phân bổ 100%</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">
                  Liên kết tự động với BOM và Đơn giá MOQ từ Tab 3 (Giá Vốn Hàng Bán). Đã bóc tách rõ ràng giữa Giá vốn hàng bán thương mại và Giá vốn xuất quà tặng Sampling cho Creator.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>2. Chi phí sàn TMĐT (Shopee &amp; TikTok Shop)</span>
                  <span className="text-emerald-700">Đủ 5 loại phí</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">
                  Bao gồm: Phí thanh toán (5-6%), Phí hoa hồng nền tảng (14-17%), Phí dịch vụ Voucher Xtra (5-5.5%), Phí xử lý đơn hàng (3.000đ/sp), và Phí bồi hoàn (2.000-2.700đ/sp) tự động tính theo doanh thu và số lượng đơn hàng từng tháng.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>3. Chi phí vận chuyển (B2B &amp; Retail)</span>
                  <span className="text-emerald-700">Đã tích hợp</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">
                  Đã bổ sung chi phí vận chuyển Logistics cho đại lý B2B (5% GMV B2B) và chi phí COD giao hàng cho khách lẻ ngoài sàn (25.000đ/đơn).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>4. Chi phí Marketing Sàn &amp; MKT Tổng Thể</span>
                  <span className="text-emerald-700">Đã liên kết định mức</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">
                  Gồm Phí Tiếp Thị Liên Kết, Quảng Cáo Nội Sàn, Tiền mặt Booking Creator và Giá vốn Sampling Creator. Đã có hệ thống cảnh báo tự động khi Chi Phí MKT Tổng thể vượt quá tỷ lệ định mức {targetMktRate}% được cài đặt tại Tab 1.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>5. Chi phí Nhân sự &amp; Vận hành</span>
                  <span className="text-emerald-700">Đã xét tháng bắt đầu</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">
                  Chi phí nhân sự bao gồm lương NET thực nhận, BHXH bắt buộc doanh nghiệp đóng 21.5%, thưởng KPI và thuế TNCN thời vụ từ Tab 5. Chi phí vận hành gồm trích khấu hao Capex ban đầu và Fixed Opex chỉ tính kể từ tháng bắt đầu hoạt động thực tế.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>6. Thuế VAT &amp; Thuế TNDN</span>
                  <span className="text-emerald-700">Tự động liên kết Tab 1</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">
                  Thuế VAT đầu ra tính đúng thuế suất {vatRate}% từ Tab 1. Thuế TNDN 20% tự động trích nộp khi EBIT dương.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowCostAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Đóng Bảng Đối Soát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
