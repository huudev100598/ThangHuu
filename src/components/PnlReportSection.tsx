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
  Target
} from 'lucide-react';

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
  // Trạng thái thu gọn / mở rộng chi tiết các nhóm chi phí con
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    gmvChannels: false,
    platformFees: true,
    shippingFees: true,
    mktPlatform: true,
    mktOverall: true,
    fulfillment: true,
    operating: true,
  });

  const [showCostAuditModal, setShowCostAuditModal] = useState<boolean>(false);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    setExpandedSections({
      gmvChannels: true,
      platformFees: true,
      shippingFees: true,
      mktPlatform: true,
      mktOverall: true,
      fulfillment: true,
      operating: true,
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      gmvChannels: false,
      platformFees: false,
      shippingFees: false,
      mktPlatform: false,
      mktOverall: false,
      fulfillment: false,
      operating: false,
    });
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

  // Xuất file CSV báo cáo P&L
  const handleExportCsv = () => {
    const headers = ['Chỉ Tiêu / Khoản Mục', 'Tổng Cả Kỳ (VNĐ)', 'Tỷ Trọng (% Doanh Thu Gộp)', ...months.map((m) => m.label)];
    const rows: (string | number)[][] = [
      ['1. Doanh thu GMV', pnlSummary.grossRevenue, '—', ...pnlMonthly.map((m) => m.grossRevenue)],
      [`Thuế VAT đầu ra phải nộp (${vatRate}%)`, -pnlSummary.vatOutput, calcExpenseRatio(pnlSummary.vatOutput), ...pnlMonthly.map((m) => -m.vatOutput)],
      ['2. Doanh thu gộp (Gross Revenue)', pnlSummary.grossRevenueAfterVat, '100.0%', ...pnlMonthly.map((m) => m.grossRevenueAfterVat)],
      ['Chi phí sàn (TMĐT)', -pnlSummary.platformFees, calcExpenseRatio(pnlSummary.platformFees), ...pnlMonthly.map((m) => -m.platformFees.total)],
      ['  - Phí thanh toán sàn', -pnlMonthly.reduce((s, m) => s + m.platformFees.paymentFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.paymentFee, 0)), ...pnlMonthly.map((m) => -m.platformFees.paymentFee)],
      ['  - Phí hoa hồng nền tảng', -pnlMonthly.reduce((s, m) => s + m.platformFees.commissionFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.commissionFee, 0)), ...pnlMonthly.map((m) => -m.platformFees.commissionFee)],
      ['  - Phí dịch vụ Voucher Xtra', -pnlMonthly.reduce((s, m) => s + m.platformFees.voucherXtraFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.voucherXtraFee, 0)), ...pnlMonthly.map((m) => -m.platformFees.voucherXtraFee)],
      ['  - Phí xử lý đơn hàng', -pnlMonthly.reduce((s, m) => s + m.platformFees.handlingFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.handlingFee, 0)), ...pnlMonthly.map((m) => -m.platformFees.handlingFee)],
      ['  - Phí bồi hoàn sàn', -pnlMonthly.reduce((s, m) => s + m.platformFees.compensationFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.compensationFee, 0)), ...pnlMonthly.map((m) => -m.platformFees.compensationFee)],
      ['Chi phí vận chuyển (B2B/Retail)', -pnlSummary.shippingB2bRetail, calcExpenseRatio(pnlSummary.shippingB2bRetail), ...pnlMonthly.map((m) => -m.shippingB2bRetail.total)],
      ['3. Doanh thu thuần (Net Revenue)', pnlSummary.netRevenue, calcExpenseRatio(pnlSummary.netRevenue), ...pnlMonthly.map((m) => m.netRevenue)],
      ['Giá vốn hàng bán (COGS)', -pnlSummary.cogsSales, calcExpenseRatio(pnlSummary.cogsSales), ...pnlMonthly.map((m) => -m.cogsSales)],
      ['4. Lợi nhuận gộp', pnlSummary.grossProfit, calcProfitRatio(pnlSummary.grossProfit), ...pnlMonthly.map((m) => m.grossProfit)],
      ['Chi phí MKT Sàn TMĐT', -pnlSummary.marketingPlatform, calcExpenseRatio(pnlSummary.marketingPlatform), ...pnlMonthly.map((m) => -m.marketingPlatform.total)],
      ['  - Phí Tiếp Thị Liên Kết', -pnlMonthly.reduce((s, m) => s + m.marketingPlatform.affiliateFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.affiliateFee, 0)), ...pnlMonthly.map((m) => -m.marketingPlatform.affiliateFee)],
      ['  - Phí Quảng Cáo Nội Sàn', -pnlMonthly.reduce((s, m) => s + m.marketingPlatform.internalAdsFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.internalAdsFee, 0)), ...pnlMonthly.map((m) => -m.marketingPlatform.internalAdsFee)],
      ['Chi Phí MKT Tổng thể', -pnlSummary.marketingOverall, calcExpenseRatio(pnlSummary.marketingOverall), ...pnlMonthly.map((m) => -m.marketingOverall.total)],
      ['  - Phí Booking Creator', -pnlMonthly.reduce((s, m) => s + m.marketingOverall.creatorBookingFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingOverall.creatorBookingFee, 0)), ...pnlMonthly.map((m) => -m.marketingOverall.creatorBookingFee)],
      ['  - Phí Sampling hàng mẫu', -pnlMonthly.reduce((s, m) => s + m.marketingOverall.samplingCogsFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingOverall.samplingCogsFee, 0)), ...pnlMonthly.map((m) => -m.marketingOverall.samplingCogsFee)],
      ['Chi Phí Fulfillment', -pnlSummary.fulfillment, calcExpenseRatio(pnlSummary.fulfillment), ...pnlMonthly.map((m) => -m.fulfillment.total)],
      ['  - Chi phí bao bì đóng gói', -pnlMonthly.reduce((s, m) => s + m.fulfillment.packagingFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.fulfillment.packagingFee, 0)), ...pnlMonthly.map((m) => -m.fulfillment.packagingFee)],
      ['  - Chi phí hao hụt/lưu kho', -pnlMonthly.reduce((s, m) => s + m.fulfillment.shrinkageWarehouseFee, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.fulfillment.shrinkageWarehouseFee, 0)), ...pnlMonthly.map((m) => -m.fulfillment.shrinkageWarehouseFee)],
      ['Chi phí nhân sự', -pnlSummary.laborCost, calcExpenseRatio(pnlSummary.laborCost), ...pnlMonthly.map((m) => -m.laborCost)],
      ['Chi phí vận hành', -pnlSummary.operatingExpenses, calcExpenseRatio(pnlSummary.operatingExpenses), ...pnlMonthly.map((m) => -m.operatingExpenses.total)],
      ['  - Trích khấu hao tài sản ban đầu', -pnlMonthly.reduce((s, m) => s + m.operatingExpenses.capexDepreciation, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.capexDepreciation, 0)), ...pnlMonthly.map((m) => -m.operatingExpenses.capexDepreciation)],
      ['  - Chi phí vận hành', -pnlMonthly.reduce((s, m) => s + m.operatingExpenses.operatingOpex, 0), calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.operatingOpex, 0)), ...pnlMonthly.map((m) => -m.operatingExpenses.operatingOpex)],
      ['5. Lợi nhuận trước thuế (EBIT)', pnlSummary.ebit, calcProfitRatio(pnlSummary.ebit), ...pnlMonthly.map((m) => m.ebit)],
      ['Thuế TNDN', -pnlSummary.corporateTax, calcExpenseRatio(pnlSummary.corporateTax), ...pnlMonthly.map((m) => -m.corporateTax)],
      ['6. Lợi nhuận ròng', pnlSummary.netProfit, calcProfitRatio(pnlSummary.netProfit), ...pnlMonthly.map((m) => m.netProfit)],
    ];

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PnL_Bao_Cao_Hoat_Dong_Kinh_Doanh.csv`;
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
            {formatNumberVi(pnlSummary.grossRevenue)} đ
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
            {formatNumberVi(pnlSummary.grossRevenueAfterVat)} đ
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
            {formatNumberVi(pnlSummary.grossProfit)} đ
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>COGS: {formatNumberVi(pnlSummary.cogsSales)} đ</span>
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
            {pnlSummary.ebit >= 0 ? '+' : ''}{formatNumberVi(pnlSummary.ebit)} đ
          </div>
          <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Ròng sau thuế: {formatNumberVi(pnlSummary.netProfit)} đ</span>
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
              Chi phí MKT Tổng thể thực tế toàn kỳ là <strong className="font-mono">{formatNumberVi(pnlSummary.marketingOverall)} đ</strong>, 
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
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH (P&amp;L DỰ ÁN)
              </h3>
              <p className="text-[11px] text-slate-500">
                Tỷ trọng chuẩn hóa theo <strong className="text-slate-800">2. Doanh thu gộp (Gross Revenue = 100.0%)</strong> — Lợi nhuận âm hiển thị tỷ trọng âm chính xác
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 rounded bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-medium transition-colors"
              title="Mở rộng tất cả các khoản mục con"
            >
              Mở rộng tất cả
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 rounded bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-medium transition-colors"
              title="Thu gọn chi tiết các nhóm"
            >
              Thu gọn
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
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
                <th className="py-3 px-4 min-w-[280px] sm:min-w-[340px] sticky left-0 bg-slate-100 z-10 border-r border-slate-300 text-slate-900">
                  Chỉ Tiêu / Khoản Mục
                </th>
                <th className="py-3 px-3 min-w-[130px] text-right bg-slate-200/90 border-r border-slate-300 text-slate-950 font-bold font-mono">
                  Tổng Cả Kỳ
                </th>
                <th className="py-3 px-2.5 min-w-[85px] text-right bg-blue-100/70 border-r border-slate-300 text-blue-950 font-bold font-mono">
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
              {/* ROW 1: 1. Doanh thu GMV (KHÔNG hiển thị tỷ trọng) */}
              <tr className="bg-blue-50/50 font-bold text-slate-900 hover:bg-blue-50 transition-colors">
                <td className="py-2.5 px-4 sticky left-0 bg-blue-50/95 z-10 border-r border-slate-300 flex items-center justify-between font-sans">
                  <span className="text-slate-900 font-bold">1. Doanh thu GMV</span>
                  <button
                    onClick={() => toggleSection('gmvChannels')}
                    className="p-1 hover:bg-blue-100 rounded text-slate-500 transition-colors"
                    title="Bật/tắt chi tiết 4 kênh"
                  >
                    {expandedSections.gmvChannels ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-100/50 text-slate-950 border-r border-slate-300 font-bold">
                  {formatNumberVi(pnlSummary.grossRevenue)} đ
                </td>
                {/* 1. Doanh thu GMV KHÔNG hiển thị tỷ trọng theo yêu cầu */}
                <td className="py-2.5 px-2.5 text-right bg-slate-100/60 text-slate-400 border-r border-slate-300 font-medium text-center">
                  —
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-slate-950 font-bold">
                    {formatNumberVi(m.grossRevenue)} đ
                  </td>
                ))}
              </tr>

              {/* Sub-breakdown: 4 kênh bán hàng (Nếu người dùng muốn soi) */}
              {expandedSections.gmvChannels && (
                <>
                  <tr className="text-slate-600 text-[11px] bg-slate-50/40">
                    <td className="py-1 px-8 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans text-slate-600">
                      • Kênh Shopee Mall
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-100/50 border-r border-slate-300 text-slate-700">
                      {formatNumberVi(pnlMonthly.reduce((s, m) => s + m.revenueByChannel.shopee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-100/30 border-r border-slate-300 text-slate-400 text-center">
                      —
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        {formatNumberVi(m.revenueByChannel.shopee)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] bg-slate-50/40">
                    <td className="py-1 px-8 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans text-slate-600">
                      • Kênh TikTok Shop
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-100/50 border-r border-slate-300 text-slate-700">
                      {formatNumberVi(pnlMonthly.reduce((s, m) => s + m.revenueByChannel.tikTokShop, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-100/30 border-r border-slate-300 text-slate-400 text-center">
                      —
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        {formatNumberVi(m.revenueByChannel.tikTokShop)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] bg-slate-50/40">
                    <td className="py-1 px-8 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans text-slate-600">
                      • Kênh B2B &amp; Đại Lý Sỉ
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-100/50 border-r border-slate-300 text-slate-700">
                      {formatNumberVi(pnlMonthly.reduce((s, m) => s + m.revenueByChannel.b2b, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-100/30 border-r border-slate-300 text-slate-400 text-center">
                      —
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        {formatNumberVi(m.revenueByChannel.b2b)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] bg-slate-50/40">
                    <td className="py-1 px-8 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans text-slate-600">
                      • Kênh Bán Lẻ Khác (Retail)
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-100/50 border-r border-slate-300 text-slate-700">
                      {formatNumberVi(pnlMonthly.reduce((s, m) => s + m.revenueByChannel.retail, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-100/30 border-r border-slate-300 text-slate-400 text-center">
                      —
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        {formatNumberVi(m.revenueByChannel.retail)} đ
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* ROW 2: Thuế VAT đầu ra phải nộp (Link theo thông số chung) */}
              <tr className="text-slate-700 hover:bg-slate-50/60 transition-colors">
                <td className="py-2 px-4 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-700 flex items-center justify-between">
                  <span>Thuế VAT đầu ra phải nộp</span>
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                    Thuế suất {vatRate}%
                  </span>
                </td>
                <td className="py-2 px-3 text-right bg-slate-50 border-r border-slate-300 text-rose-700 font-medium">
                  -{formatNumberVi(pnlSummary.vatOutput)} đ
                </td>
                <td className="py-2 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500 text-[11px]">
                  {calcExpenseRatio(pnlSummary.vatOutput)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-700">
                    -{formatNumberVi(m.vatOutput)} đ
                  </td>
                ))}
              </tr>

              {/* ROW 3: 2. Doanh thu gộp (Gross Revenue) - ĐẶT LÀ 100.0% THEO YÊU CẦU */}
              <tr className="bg-blue-100/50 font-bold text-slate-900 hover:bg-blue-100/70 transition-colors border-t-2 border-b-2 border-blue-300">
                <td className="py-2.5 px-4 sticky left-0 bg-blue-100/95 z-10 border-r border-slate-300 font-sans text-blue-950 font-bold flex items-center justify-between">
                  <span>2. Doanh thu gộp (Gross Revenue)</span>
                  <span className="text-[10px] text-blue-800 bg-blue-200/80 px-1.5 py-0.5 rounded font-semibold font-mono">
                    Gốc chuẩn
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-200/60 text-blue-950 border-r border-slate-300 font-bold">
                  {formatNumberVi(pnlSummary.grossRevenueAfterVat)} đ
                </td>
                <td className="py-2.5 px-2.5 text-right bg-blue-200/90 text-blue-950 border-r border-slate-300 font-bold text-xs">
                  100.0%
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-blue-950 font-bold">
                    {formatNumberVi(m.grossRevenueAfterVat)} đ
                  </td>
                ))}
              </tr>

              {/* ROW 4: Chi phí sàn (TMĐT) */}
              <tr className="bg-rose-50/40 font-semibold text-rose-900 hover:bg-rose-50 transition-colors">
                <td className="py-2 px-4 sticky left-0 bg-rose-50/90 z-10 border-r border-slate-300 flex items-center justify-between font-sans">
                  <span className="font-semibold text-rose-950">Chi phí sàn (TMĐT)</span>
                  <button
                    onClick={() => toggleSection('platformFees')}
                    className="p-1 hover:bg-rose-100 rounded text-rose-600 transition-colors"
                  >
                    {expandedSections.platformFees ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2 px-3 text-right bg-rose-100/50 text-rose-900 border-r border-slate-300 font-bold">
                  -{formatNumberVi(pnlSummary.platformFees)} đ
                </td>
                <td className="py-2 px-2.5 text-right bg-rose-50/50 text-rose-800 border-r border-slate-300 text-[11px] font-medium">
                  {calcExpenseRatio(pnlSummary.platformFees)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                    -{formatNumberVi(m.platformFees.total)} đ
                  </td>
                ))}
              </tr>

              {/* Sub-items Chi phí sàn (TMĐT) */}
              {expandedSections.platformFees && (
                <>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Phí thanh toán sàn
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.platformFees.paymentFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.paymentFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.platformFees.paymentFee)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Phí hoa hồng nền tảng
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.platformFees.commissionFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.commissionFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.platformFees.commissionFee)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Phí dịch vụ Voucher Xtra
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.platformFees.voucherXtraFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.voucherXtraFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.platformFees.voucherXtraFee)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Phí xử lý đơn hàng
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.platformFees.handlingFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.handlingFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.platformFees.handlingFee)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Phí bồi hoàn sàn
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.platformFees.compensationFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.platformFees.compensationFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.platformFees.compensationFee)} đ
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* ROW 5: Chi phí vận chuyển (B2B/Retail) */}
              <tr className="text-slate-800 hover:bg-slate-50/70 transition-colors">
                <td className="py-2 px-4 sticky left-0 bg-white z-10 border-r border-slate-300 flex items-center justify-between font-sans text-slate-800 font-medium">
                  <span>Chi phí vận chuyển (B2B/Retail)</span>
                  <button
                    onClick={() => toggleSection('shippingFees')}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"
                  >
                    {expandedSections.shippingFees ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2 px-3 text-right bg-slate-50 border-r border-slate-300 text-rose-700 font-medium">
                  -{formatNumberVi(pnlSummary.shippingB2bRetail)} đ
                </td>
                <td className="py-2 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500 text-[11px]">
                  {calcExpenseRatio(pnlSummary.shippingB2bRetail)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-700">
                    -{formatNumberVi(m.shippingB2bRetail.total)} đ
                  </td>
                ))}
              </tr>

              {expandedSections.shippingFees && (
                <>
                  <tr className="text-slate-500 text-[11px] hover:bg-slate-50/50">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-500">
                      - Vận chuyển B2B (Logistics 5%)
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-600">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.b2bShipping, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-400">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.b2bShipping, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-500">
                        -{formatNumberVi(m.shippingB2bRetail.b2bShipping)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-500 text-[11px] hover:bg-slate-50/50">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-500">
                      - Vận chuyển Retail (COD giao hàng)
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-600">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.retailShipping, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-400">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.shippingB2bRetail.retailShipping, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-500">
                        -{formatNumberVi(m.shippingB2bRetail.retailShipping)} đ
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* ROW 6: 3. Doanh thu thuần (Net Revenue) */}
              <tr className="bg-emerald-100/50 font-bold text-emerald-950 hover:bg-emerald-100/70 transition-colors border-t-2 border-b-2 border-emerald-300">
                <td className="py-2.5 px-4 sticky left-0 bg-emerald-100/90 z-10 border-r border-slate-300 font-sans text-emerald-950 font-bold">
                  3. Doanh thu thuần (Net Revenue)
                </td>
                <td className="py-2.5 px-3 text-right bg-emerald-200/70 text-emerald-950 border-r border-slate-300 font-bold">
                  {formatNumberVi(pnlSummary.netRevenue)} đ
                </td>
                <td className="py-2.5 px-2.5 text-right bg-emerald-100/70 text-emerald-950 border-r border-slate-300 font-bold text-[11px]">
                  {calcExpenseRatio(pnlSummary.netRevenue)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-emerald-950 font-bold">
                    {formatNumberVi(m.netRevenue)} đ
                  </td>
                ))}
              </tr>

              {/* ROW 7: Giá vốn hàng bán (COGS) */}
              <tr className="text-amber-900 hover:bg-amber-50/40 transition-colors font-medium">
                <td className="py-2 px-4 sticky left-0 bg-white z-10 border-r border-slate-300 font-sans text-amber-950 font-medium">
                  Giá vốn hàng bán (COGS)
                </td>
                <td className="py-2 px-3 text-right bg-amber-50/60 text-amber-950 border-r border-slate-300 font-semibold">
                  -{formatNumberVi(pnlSummary.cogsSales)} đ
                </td>
                <td className="py-2 px-2.5 text-right bg-amber-50/40 text-amber-800 border-r border-slate-300 text-[11px]">
                  {calcExpenseRatio(pnlSummary.cogsSales)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-amber-900 font-medium">
                    -{formatNumberVi(m.cogsSales)} đ
                  </td>
                ))}
              </tr>

              {/* ROW 8: 4. Lợi nhuận gộp */}
              <tr className="bg-teal-100/50 font-bold text-teal-950 hover:bg-teal-100/70 transition-colors border-t-2 border-b-2 border-teal-300">
                <td className="py-2.5 px-4 sticky left-0 bg-teal-100/90 z-10 border-r border-slate-300 font-sans text-teal-950 font-bold">
                  4. Lợi nhuận gộp
                </td>
                <td className="py-2.5 px-3 text-right bg-teal-200/70 text-teal-950 border-r border-slate-300 font-bold">
                  {formatNumberVi(pnlSummary.grossProfit)} đ
                </td>
                <td className="py-2.5 px-2.5 text-right bg-teal-100/70 text-teal-950 border-r border-slate-300 font-bold text-[11px]">
                  {calcProfitRatio(pnlSummary.grossProfit)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-teal-950 font-bold">
                    {formatNumberVi(m.grossProfit)} đ
                  </td>
                ))}
              </tr>

              {/* ROW 9: Chi phí MKT Sàn TMĐT */}
              <tr className="bg-slate-50 font-semibold text-slate-800 hover:bg-slate-100/60 transition-colors">
                <td className="py-2 px-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-300 flex items-center justify-between font-sans">
                  <span className="font-semibold text-slate-900">Chi phí MKT Sàn TMĐT</span>
                  <button
                    onClick={() => toggleSection('mktPlatform')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                  >
                    {expandedSections.mktPlatform ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2 px-3 text-right bg-slate-100/80 text-rose-800 border-r border-slate-300 font-bold">
                  -{formatNumberVi(pnlSummary.marketingPlatform)} đ
                </td>
                <td className="py-2 px-2.5 text-right bg-slate-100/50 text-slate-600 border-r border-slate-300 text-[11px] font-medium">
                  {calcExpenseRatio(pnlSummary.marketingPlatform)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                    -{formatNumberVi(m.marketingPlatform.total)} đ
                  </td>
                ))}
              </tr>

              {expandedSections.mktPlatform && (
                <>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Phí Tiếp Thị Liên Kết
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.affiliateFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.affiliateFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.marketingPlatform.affiliateFee)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Phí Quảng Cáo Nội Sàn
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.internalAdsFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingPlatform.internalAdsFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.marketingPlatform.internalAdsFee)} đ
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* ROW 10: Chi Phí MKT Tổng thể (CÓ CẢNH BÁO THEO THÔNG SỐ CHUNG) */}
              <tr className="bg-slate-50 font-semibold text-slate-800 hover:bg-slate-100/60 transition-colors">
                <td className="py-2 px-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-300 flex items-center justify-between font-sans">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">Chi Phí MKT Tổng thể</span>
                    {/* Badge cảnh báo vượt / bằng / dưới % thông số chung */}
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
                    onClick={() => toggleSection('mktOverall')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors ml-2"
                  >
                    {expandedSections.mktOverall ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2 px-3 text-right bg-slate-100/80 text-rose-800 border-r border-slate-300 font-bold">
                  -{formatNumberVi(pnlSummary.marketingOverall)} đ
                </td>
                <td className={`py-2 px-2.5 text-right border-r border-slate-300 text-[11px] font-bold ${
                  isMktOverBudget ? 'bg-rose-100/60 text-rose-800' : 'bg-slate-100/50 text-slate-700'
                }`}>
                  {calcExpenseRatio(pnlSummary.marketingOverall)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                    -{formatNumberVi(m.marketingOverall.total)} đ
                  </td>
                ))}
              </tr>

              {expandedSections.mktOverall && (
                <>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Phí Booking Creator
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.marketingOverall.creatorBookingFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingOverall.creatorBookingFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.marketingOverall.creatorBookingFee)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Phí Sampling hàng mẫu
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.marketingOverall.samplingCogsFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.marketingOverall.samplingCogsFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.marketingOverall.samplingCogsFee)} đ
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* ROW 11: Chi Phí Fulfillment */}
              <tr className="bg-slate-50 font-semibold text-slate-800 hover:bg-slate-100/60 transition-colors">
                <td className="py-2 px-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-300 flex items-center justify-between font-sans">
                  <span className="font-semibold text-slate-900">Chi Phí Fullfilment</span>
                  <button
                    onClick={() => toggleSection('fulfillment')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                  >
                    {expandedSections.fulfillment ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2 px-3 text-right bg-slate-100/80 text-rose-800 border-r border-slate-300 font-bold">
                  -{formatNumberVi(pnlSummary.fulfillment)} đ
                </td>
                <td className="py-2 px-2.5 text-right bg-slate-100/50 text-slate-600 border-r border-slate-300 text-[11px] font-medium">
                  {calcExpenseRatio(pnlSummary.fulfillment)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                    -{formatNumberVi(m.fulfillment.total)} đ
                  </td>
                ))}
              </tr>

              {expandedSections.fulfillment && (
                <>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Chi phí bao bì đóng gói
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.fulfillment.packagingFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.fulfillment.packagingFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.fulfillment.packagingFee)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Chi phí hao hụt/lưu kho
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.fulfillment.shrinkageWarehouseFee, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.fulfillment.shrinkageWarehouseFee, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.fulfillment.shrinkageWarehouseFee)} đ
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* ROW 12: Chi phí nhân sự */}
              <tr className="bg-slate-50/80 font-semibold text-slate-900 hover:bg-slate-100/60 transition-colors">
                <td className="py-2 px-4 sticky left-0 bg-slate-50/90 z-10 border-r border-slate-300 font-sans text-slate-900 font-semibold">
                  Chi phí nhân sự
                </td>
                <td className="py-2 px-3 text-right bg-slate-100/80 text-rose-800 border-r border-slate-300 font-bold">
                  -{formatNumberVi(pnlSummary.laborCost)} đ
                </td>
                <td className="py-2 px-2.5 text-right bg-slate-100/50 text-slate-600 border-r border-slate-300 text-[11px] font-medium">
                  {calcExpenseRatio(pnlSummary.laborCost)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                    -{formatNumberVi(m.laborCost)} đ
                  </td>
                ))}
              </tr>

              {/* ROW 13: Chi phí vận hành */}
              <tr className="bg-slate-50 font-semibold text-slate-800 hover:bg-slate-100/60 transition-colors">
                <td className="py-2 px-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-300 flex items-center justify-between font-sans">
                  <span className="font-semibold text-slate-900">Chi phí vận hành</span>
                  <button
                    onClick={() => toggleSection('operating')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                  >
                    {expandedSections.operating ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2 px-3 text-right bg-slate-100/80 text-rose-800 border-r border-slate-300 font-bold">
                  -{formatNumberVi(pnlSummary.operatingExpenses)} đ
                </td>
                <td className="py-2 px-2.5 text-right bg-slate-100/50 text-slate-600 border-r border-slate-300 text-[11px] font-medium">
                  {calcExpenseRatio(pnlSummary.operatingExpenses)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-800 font-medium">
                    -{formatNumberVi(m.operatingExpenses.total)} đ
                  </td>
                ))}
              </tr>

              {expandedSections.operating && (
                <>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Trích khấu hao tài sản ban đầu
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.capexDepreciation, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.capexDepreciation, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.operatingExpenses.capexDepreciation)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] hover:bg-slate-50/60">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                      - Chi phí vận hành
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-300 text-slate-700">
                      -{formatNumberVi(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.operatingOpex, 0))} đ
                    </td>
                    <td className="py-1 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500">
                      {calcExpenseRatio(pnlMonthly.reduce((s, m) => s + m.operatingExpenses.operatingOpex, 0))}
                    </td>
                    {pnlMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                        -{formatNumberVi(m.operatingExpenses.operatingOpex)} đ
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* ROW 14: 5. Lợi nhuận trước thuế (EBIT) - TỶ TRỌNG ÂM KHI EBIT ÂM */}
              <tr className={`font-bold border-t-2 border-b-2 transition-colors ${
                pnlSummary.ebit >= 0 
                  ? 'bg-indigo-50/80 text-indigo-950 border-indigo-300 hover:bg-indigo-100/70' 
                  : 'bg-rose-100/50 text-rose-950 border-rose-300 hover:bg-rose-100/70'
              }`}>
                <td className={`py-2.5 px-4 sticky left-0 z-10 border-r border-slate-300 font-sans font-bold flex items-center justify-between ${
                  pnlSummary.ebit >= 0 ? 'bg-indigo-50/95 text-indigo-950' : 'bg-rose-100/95 text-rose-950'
                }`}>
                  <span>5. Lợi nhuận trước thuế (EBIT)</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    pnlSummary.ebit >= 0 ? 'bg-indigo-200/80 text-indigo-900' : 'bg-rose-200 text-rose-900'
                  }`}>
                    {pnlSummary.ebit >= 0 ? 'Lãi trước thuế' : 'Lỗ trước thuế'}
                  </span>
                </td>
                <td className={`py-2.5 px-3 text-right border-r border-slate-300 font-bold ${
                  pnlSummary.ebit >= 0 ? 'bg-indigo-100/80 text-indigo-950' : 'bg-rose-200/60 text-rose-900'
                }`}>
                  {pnlSummary.ebit >= 0 ? '+' : ''}{formatNumberVi(pnlSummary.ebit)} đ
                </td>
                <td className={`py-2.5 px-2.5 text-right border-r border-slate-300 font-bold text-xs ${
                  pnlSummary.ebit >= 0 ? 'bg-indigo-100/90 text-indigo-950' : 'bg-rose-200/90 text-rose-900'
                }`}>
                  {calcProfitRatio(pnlSummary.ebit)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className={`py-2.5 px-3 text-right border-r border-slate-200 font-bold ${
                    m.ebit >= 0 ? 'text-indigo-950' : 'text-rose-800'
                  }`}>
                    {m.ebit >= 0 ? '+' : ''}{formatNumberVi(m.ebit)} đ
                  </td>
                ))}
              </tr>

              {/* ROW 15: Thuế TNDN */}
              <tr className="text-slate-700 hover:bg-slate-50/60 transition-colors">
                <td className="py-2 px-4 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-700 flex items-center justify-between">
                  <span>Thuế TNDN</span>
                  <span className="text-[10px] text-slate-400 font-mono">20% khi EBIT &gt; 0</span>
                </td>
                <td className="py-2 px-3 text-right bg-slate-50 border-r border-slate-300 text-rose-700 font-medium">
                  -{formatNumberVi(pnlSummary.corporateTax)} đ
                </td>
                <td className="py-2 px-2.5 text-right bg-slate-50 border-r border-slate-300 text-slate-500 text-[11px]">
                  {calcExpenseRatio(pnlSummary.corporateTax)}
                </td>
                {pnlMonthly.map((m) => (
                  <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-rose-700">
                    -{formatNumberVi(m.corporateTax)} đ
                  </td>
                ))}
              </tr>

              {/* ROW 16: 6. Lợi nhuận ròng - TỶ TRỌNG ÂM KHI LỖ */}
              <tr className={`font-bold text-sm border-t-2 border-b-2 ${
                pnlSummary.netProfit >= 0 
                  ? 'bg-emerald-200/60 text-emerald-950 border-emerald-500 hover:bg-emerald-200/80' 
                  : 'bg-rose-200/60 text-rose-950 border-rose-500 hover:bg-rose-200/80'
              }`}>
                <td className={`py-3 px-4 sticky left-0 z-10 border-r border-slate-400 font-sans font-bold flex items-center justify-between ${
                  pnlSummary.netProfit >= 0 ? 'bg-emerald-200/90 text-emerald-950' : 'bg-rose-200/90 text-rose-950'
                }`}>
                  <span>6. Lợi nhuận ròng</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    pnlSummary.netProfit >= 0 ? 'bg-emerald-300/80 text-emerald-950' : 'bg-rose-300/80 text-rose-950'
                  }`}>
                    {pnlSummary.netProfit >= 0 ? 'LÃI RÒNG' : 'LỖ RÒNG'}
                  </span>
                </td>
                <td className={`py-3 px-3 text-right border-r border-slate-400 font-mono font-bold ${
                  pnlSummary.netProfit >= 0 ? 'text-emerald-950 bg-emerald-300/40' : 'text-rose-950 bg-rose-300/40'
                }`}>
                  {pnlSummary.netProfit >= 0 ? '+' : ''}{formatNumberVi(pnlSummary.netProfit)} đ
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
                    {m.netProfit >= 0 ? '+' : ''}{formatNumberVi(m.netProfit)} đ
                  </td>
                ))}
              </tr>
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
