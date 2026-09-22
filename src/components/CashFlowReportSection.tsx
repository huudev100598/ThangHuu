import React, { useState } from 'react';
import { SalesMonth } from '../types/salesForecast';
import { MonthlyCashFlowRecord } from '../utils/reportCalculations';
import { formatNumberVi } from '../utils/formatters';
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Package, 
  Users, 
  Cpu, 
  Megaphone, 
  ShieldAlert,
  Download,
  Info,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface CashFlowReportSectionProps {
  months: SalesMonth[];
  cashFlowMonthly: MonthlyCashFlowRecord[];
  cashFlowSummary: {
    startingCash: number;
    totalInflow: number;
    inflowNetRevenue: number;
    inflowAffiliateFee: number;
    // 4 Nhóm chính
    cogsOutflow: number;
    cogsSales: number;
    cogsSampling: number;
    laborOutflow: number;
    operationsOutflow: number;
    capexDisbursement: number;
    operatingOpex: number;
    fulfillmentTotal: number;
    packagingFee: number;
    shrinkageWarehouseFee: number;
    marketingSalesOutflow: number;
    internalAdsFee: number;
    creatorBookingFee: number;
    taxOutflow: number;
    totalOutflow: number;
    netCashFlow: number;
    finalCashBalance: number;
    minCashBalance: number;
    minCashMonthLabel: string;
    totalWorkingCapitalDeficit: number;
    workingCapitalOutflow?: number;
    hrOutflow?: number;
    marketingOutflow?: number;
  };
}

export const CashFlowReportSection: React.FC<CashFlowReportSectionProps> = ({
  months,
  cashFlowMonthly,
  cashFlowSummary,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    inflow: true,
    cogs: true,
    labor: true,
    operations: true,
    fulfillmentSub: false,
    marketing: true,
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    setExpandedGroups({
      inflow: true,
      cogs: true,
      labor: true,
      operations: true,
      fulfillmentSub: true,
      marketing: true,
    });
  };

  const collapseAll = () => {
    setExpandedGroups({
      inflow: false,
      cogs: false,
      labor: false,
      operations: false,
      fulfillmentSub: false,
      marketing: false,
    });
  };

  // Xuất CSV báo cáo Dòng tiền & Vốn
  const exportCashFlowCsv = () => {
    const headers = ['Khoản mục dòng tiền', 'Tổng Cả Kỳ', 'Tỷ Trọng (%)', ...months.map(m => m.label)];
    const rows: (string | number)[][] = [];

    // Số dư đầu kỳ
    rows.push([
      'SỐ DƯ TIỀN MẶT ĐẦU KỲ',
      cashFlowSummary.startingCash,
      '-',
      ...cashFlowMonthly.map(m => m.startingBalance)
    ]);

    // I. Dòng tiền vào
    rows.push([
      'I. DÒNG TIỀN VÀO THỰC THU (CASH INFLOW)',
      cashFlowSummary.totalInflow,
      '100%',
      ...cashFlowMonthly.map(m => m.cashInflow.totalInflow)
    ]);
    rows.push([
      '  • Doanh thu thuần (Net Revenue từ P&L)',
      cashFlowSummary.inflowNetRevenue,
      '-',
      ...cashFlowMonthly.map(m => m.cashInflow.netRevenue)
    ]);
    rows.push([
      '  • (-) Phí tiếp thị liên kết (Affiliate sàn cấn trừ)',
      -cashFlowSummary.inflowAffiliateFee,
      '-',
      ...cashFlowMonthly.map(m => -m.cashInflow.affiliateFeeDeducted)
    ]);

    // II. Dòng tiền ra
    rows.push([
      'II. DÒNG TIỀN RA (CASH OUTFLOW) - 4 NHÓM CHÍNH',
      cashFlowSummary.totalOutflow,
      '100%',
      ...cashFlowMonthly.map(m => m.totalCashOutflow)
    ]);

    // Nhóm 1: Vốn hàng bán
    rows.push([
      '1. Nhóm: Vốn hàng bán (COGS)',
      cashFlowSummary.cogsOutflow,
      cashFlowSummary.totalOutflow > 0 ? ((cashFlowSummary.cogsOutflow / cashFlowSummary.totalOutflow) * 100).toFixed(1) + '%' : '0%',
      ...cashFlowMonthly.map(m => m.cogsOutflow.total)
    ]);
    rows.push([
      '  • Tiền đặt hàng',
      cashFlowSummary.tienDatHang ?? cashFlowSummary.cogsSales,
      '-',
      ...cashFlowMonthly.map(m => m.cogsOutflow.tienDatHang ?? m.cogsOutflow.cogsSales)
    ]);

    // Nhóm 2: Nhân sự
    rows.push([
      '2. Nhóm: Nhân sự (HR)',
      cashFlowSummary.laborOutflow,
      cashFlowSummary.totalOutflow > 0 ? ((cashFlowSummary.laborOutflow / cashFlowSummary.totalOutflow) * 100).toFixed(1) + '%' : '0%',
      ...cashFlowMonthly.map(m => m.laborOutflow.total)
    ]);

    // Nhóm 3: Vận hành
    rows.push([
      '3. Nhóm: Vận hành (Operations & Fulfillment)',
      cashFlowSummary.operationsOutflow,
      cashFlowSummary.totalOutflow > 0 ? ((cashFlowSummary.operationsOutflow / cashFlowSummary.totalOutflow) * 100).toFixed(1) + '%' : '0%',
      ...cashFlowMonthly.map(m => m.operationsOutflow.total)
    ]);
    rows.push([
      '  • Chi phí đầu tư ban đầu (Capex giải ngân)',
      cashFlowSummary.capexDisbursement,
      '-',
      ...cashFlowMonthly.map(m => m.operationsOutflow.capexDisbursement)
    ]);
    rows.push([
      '  • Chi phí vận hành mỗi tháng (Fixed Opex)',
      cashFlowSummary.operatingOpex,
      '-',
      ...cashFlowMonthly.map(m => m.operationsOutflow.operatingOpex)
    ]);
    rows.push([
      '  • Nhóm phí fulfillment (Bao bì & Hao hụt)',
      cashFlowSummary.fulfillmentTotal,
      '-',
      ...cashFlowMonthly.map(m => m.operationsOutflow.fulfillmentTotal)
    ]);

    // Nhóm 4: MKT Bán hàng
    rows.push([
      '4. Nhóm: MKT Bán Hàng (Sales & Marketing)',
      cashFlowSummary.marketingSalesOutflow,
      cashFlowSummary.totalOutflow > 0 ? ((cashFlowSummary.marketingSalesOutflow / cashFlowSummary.totalOutflow) * 100).toFixed(1) + '%' : '0%',
      ...cashFlowMonthly.map(m => m.marketingSalesOutflow.total)
    ]);
    rows.push([
      '  • Phí quảng cáo nội sàn (Shopee & TikTok Ads)',
      cashFlowSummary.internalAdsFee,
      '-',
      ...cashFlowMonthly.map(m => m.marketingSalesOutflow.internalAdsFee)
    ]);
    rows.push([
      '  • Phí Booking Creator (KOL/KOC/UGC)',
      cashFlowSummary.creatorBookingFee,
      '-',
      ...cashFlowMonthly.map(m => m.marketingSalesOutflow.creatorBookingFee)
    ]);

    // Thuế TNDN
    if (cashFlowSummary.taxOutflow > 0) {
      rows.push([
        'Thuế TNDN tạm nộp',
        cashFlowSummary.taxOutflow,
        '-',
        ...cashFlowMonthly.map(m => m.corporateTaxOutflow)
      ]);
    }

    // Lưu chuyển tiền thuần & Số dư cuối kỳ
    rows.push([
      'LƯU CHUYỂN TIỀN THUẦN (NET CASH FLOW)',
      cashFlowSummary.netCashFlow,
      '-',
      ...cashFlowMonthly.map(m => m.netCashFlow)
    ]);
    rows.push([
      'SỐ DƯ TIỀN MẶT CUỐI KỲ (ENDING CASH BALANCE)',
      cashFlowSummary.finalCashBalance,
      '-',
      ...cashFlowMonthly.map(m => m.endingBalance)
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Dong_Tien_Va_Von_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tỷ trọng các nhóm chi phí
  const totalOut = cashFlowSummary.totalOutflow || 1;
  const cogsPercent = ((cashFlowSummary.cogsOutflow / totalOut) * 100).toFixed(1);
  const laborPercent = ((cashFlowSummary.laborOutflow / totalOut) * 100).toFixed(1);
  const opexPercent = ((cashFlowSummary.operationsOutflow / totalOut) * 100).toFixed(1);
  const mktPercent = ((cashFlowSummary.marketingSalesOutflow / totalOut) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* 4 Thẻ KPI Tóm Tắt Dòng Tiền & Vốn */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Vốn tiền mặt đầu kỳ */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Vốn Đầu Kỳ (Starting Cash)</span>
            <Wallet className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900">
            {formatNumberVi(cashFlowSummary.startingCash)} đ
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Thiết lập ban đầu</span>
            <span className="text-emerald-700 font-medium">Khả dụng</span>
          </div>
        </div>

        {/* Tổng Dòng Tiền Vào (Net Inflow) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Tổng Thu Tiền Mặt (Inflow)</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-700">
            +{formatNumberVi(cashFlowSummary.totalInflow)} đ
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between truncate">
            <span>Net Revenue - Affiliate</span>
            <span className="text-emerald-700 font-mono font-medium">Thực nhận</span>
          </div>
        </div>

        {/* Tổng Dòng Tiền Ra (Total Outflow) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Tổng Chi Tiền Mặt (Outflow)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-rose-700">
            -{formatNumberVi(cashFlowSummary.totalOutflow)} đ
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>4 Nhóm chi phí trọng yếu</span>
            <span className="text-rose-700 font-mono font-medium">100% Outflow</span>
          </div>
        </div>

        {/* Số dư cuối kỳ / Thâm hụt vốn */}
        <div className={`rounded-xl border p-4 shadow-2xs ${
          cashFlowSummary.finalCashBalance >= 0 
            ? 'bg-emerald-50/50 border-emerald-200' 
            : 'bg-rose-50/70 border-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Số Dư Tiền Mặt Cuối Kỳ</span>
            {cashFlowSummary.finalCashBalance >= 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className={`mt-2 text-xl font-bold font-mono ${
            cashFlowSummary.finalCashBalance >= 0 ? 'text-emerald-900' : 'text-rose-700'
          }`}>
            {cashFlowSummary.finalCashBalance >= 0 ? '+' : ''}{formatNumberVi(cashFlowSummary.finalCashBalance)} đ
          </div>
          <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Điểm đáy: {formatNumberVi(cashFlowSummary.minCashBalance)} đ</span>
            <span className={`font-semibold font-mono ${cashFlowSummary.finalCashBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ({cashFlowSummary.minCashMonthLabel})
            </span>
          </div>
        </div>
      </div>

      {/* Thanh phân bổ 4 nhóm chi phí ra trực quan */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5 text-xs text-slate-700 font-semibold">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Cơ Cấu 4 Nhóm Dòng Tiền Ra (Cash Outflows Breakdown)</span>
          </div>
          <span className="text-slate-500 font-mono">Tổng: {formatNumberVi(cashFlowSummary.totalOutflow)} đ</span>
        </div>

        {/* Progress Bar 4 đoạn */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
          <div 
            className="bg-amber-500 transition-all duration-300 hover:opacity-90" 
            style={{ width: `${cogsPercent}%` }}
            title={`Vốn hàng bán: ${cogsPercent}%`}
          />
          <div 
            className="bg-blue-600 transition-all duration-300 hover:opacity-90" 
            style={{ width: `${laborPercent}%` }}
            title={`Nhân sự: ${laborPercent}%`}
          />
          <div 
            className="bg-teal-600 transition-all duration-300 hover:opacity-90" 
            style={{ width: `${opexPercent}%` }}
            title={`Vận hành: ${opexPercent}%`}
          />
          <div 
            className="bg-purple-600 transition-all duration-300 hover:opacity-90" 
            style={{ width: `${mktPercent}%` }}
            title={`MKT Bán hàng: ${mktPercent}%`}
          />
        </div>

        {/* 4 Chú thích nhóm chi phí */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <div className="truncate">
              <span className="text-slate-600">1. Vốn hàng bán: </span>
              <span className="font-bold text-slate-900 font-mono">{cogsPercent}%</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <div className="truncate">
              <span className="text-slate-600">2. Nhân sự: </span>
              <span className="font-bold text-slate-900 font-mono">{laborPercent}%</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
            <div className="truncate">
              <span className="text-slate-600">3. Vận hành: </span>
              <span className="font-bold text-slate-900 font-mono">{opexPercent}%</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
            <div className="truncate">
              <span className="text-slate-600">4. MKT Bán hàng: </span>
              <span className="font-bold text-slate-900 font-mono">{mktPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cảnh báo nhu cầu vốn lưu động nếu có điểm âm tiền mặt */}
      {cashFlowSummary.totalWorkingCapitalDeficit > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300/80 flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950">
              Khuyến Nghị Vốn Lưu Động: Cần Dự Trữ Bổ Sung Tối Thiểu ~{formatNumberVi(cashFlowSummary.totalWorkingCapitalDeficit)} đ
            </h4>
            <p className="leading-relaxed text-amber-800">
              Mô hình phát hiện số dư tiền mặt bị âm tại <strong className="text-amber-950">{cashFlowSummary.minCashMonthLabel}</strong> do gối đầu vốn sản xuất/nhập hàng và các khoản chi giải ngân ban đầu trước khi dòng tiền bán hàng về đủ bù đắp. Cần chuẩn bị hạn mức tín dụng hoặc gối vốn đầu tư để duy trì tính thanh khoản liên tục.
            </p>
          </div>
        </div>
      )}

      {/* Bảng Báo Cáo Dòng Tiền Phân Nhóm 4 Nhóm Chuẩn */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Header điều khiển */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                BÁO CÁO LƯU CHUYỂN TIỀN TỆ &amp; KẾ HOẠCH VỐN (CASH FLOW STATEMENT)
              </h3>
              <p className="text-[11px] text-slate-500">
                Dòng tiền vào = Doanh thu thuần - Phí tiếp thị liên kết • Dòng tiền ra gồm 4 nhóm: Vốn hàng bán, Nhân sự, Vận hành, MKT Bán hàng
              </p>
            </div>
          </div>

          {/* Action buttons: Expand/Collapse & Export */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 rounded bg-slate-200/70 hover:bg-slate-300/70 text-slate-700 font-medium transition"
            >
              Mở rộng tất cả
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 rounded bg-slate-200/70 hover:bg-slate-300/70 text-slate-700 font-medium transition"
            >
              Thu gọn
            </button>
            <button
              onClick={exportCashFlowCsv}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* Bảng Dữ Liệu */}
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 min-w-[300px] sticky left-0 bg-slate-100 z-20 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  Khoản Mục Dòng Tiền Thực Tế
                </th>
                <th className="py-3 px-3 min-w-[135px] text-right bg-slate-200/80 border-r border-slate-300 font-bold text-slate-900">
                  TỔNG CẢ KỲ
                </th>
                <th className="py-3 px-2 min-w-[70px] text-right bg-slate-200/50 border-r border-slate-300 text-slate-600 font-mono">
                  Tỷ Trọng
                </th>
                {months.map((m) => (
                  <th key={m.id} className="py-3 px-3 min-w-[115px] text-right border-r border-slate-200 font-mono">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {/* SỐ DƯ ĐẦU KỲ */}
              <tr className="bg-slate-50/80 font-semibold text-slate-800">
                <td className="py-2.5 px-4 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  SỐ DƯ TIỀN MẶT ĐẦU KỲ (STARTING CASH)
                </td>
                <td className="py-2.5 px-3 text-right bg-slate-100/80 border-r border-slate-300 font-bold text-slate-900">
                  {formatNumberVi(cashFlowSummary.startingCash)} đ
                </td>
                <td className="py-2.5 px-2 text-right bg-slate-50 border-r border-slate-300 text-[11px] text-slate-400">
                  -
                </td>
                {cashFlowMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-slate-800">
                    {formatNumberVi(m.startingBalance)} đ
                  </td>
                ))}
              </tr>

              {/* I. DÒNG TIỀN VÀO (INFLOW) */}
              <tr className="bg-emerald-50/50 font-bold text-emerald-950 border-t border-emerald-200">
                <td className="py-2.5 px-4 sticky left-0 bg-emerald-50/95 z-10 border-r border-slate-200 flex items-center justify-between font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center space-x-1.5">
                    <ArrowDownRight className="w-4 h-4 text-emerald-700" />
                    <span>I. DÒNG TIỀN VÀO THỰC THU (CASH INFLOW)</span>
                  </div>
                  <button
                    onClick={() => toggleGroup('inflow')}
                    className="p-1 hover:bg-emerald-100 rounded text-slate-500"
                    title="Đóng / Mở chi tiết dòng tiền vào"
                  >
                    {expandedGroups.inflow ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right bg-emerald-100/60 text-emerald-900 border-r border-slate-300 font-bold">
                  +{formatNumberVi(cashFlowSummary.totalInflow)} đ
                </td>
                <td className="py-2.5 px-2 text-right bg-emerald-50/40 text-emerald-800 border-r border-slate-300 text-[11px] font-bold">
                  100%
                </td>
                {cashFlowMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-emerald-800 font-bold">
                    +{formatNumberVi(m.cashInflow.totalInflow)} đ
                  </td>
                ))}
              </tr>

              {/* Chi tiết Dòng tiền vào */}
              {expandedGroups.inflow && (
                <>
                  <tr className="text-slate-600 text-[11px] bg-slate-50/30">
                    <td className="py-1.5 px-7 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                      • Doanh thu thuần (Net Revenue từ P&amp;L)
                    </td>
                    <td className="py-1.5 px-3 text-right bg-slate-100/60 border-r border-slate-200">
                      +{formatNumberVi(cashFlowSummary.inflowNetRevenue)} đ
                    </td>
                    <td className="py-1.5 px-2 text-right bg-slate-100/30 border-r border-slate-200 text-slate-500 text-[10px]">
                      {cashFlowSummary.totalInflow > 0
                        ? ((cashFlowSummary.inflowNetRevenue / cashFlowSummary.totalInflow) * 100).toFixed(1)
                        : 0}%
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-700">
                        +{formatNumberVi(m.cashInflow.netRevenue)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-rose-600 text-[11px] bg-slate-50/30">
                    <td className="py-1.5 px-7 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)] flex items-center justify-between">
                      <span>• (-) Phí tiếp thị liên kết (Affiliate sàn cấn trừ trực tiếp)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-sans">Tự động trừ</span>
                    </td>
                    <td className="py-1.5 px-3 text-right bg-rose-50/60 border-r border-slate-200 font-medium">
                      -{formatNumberVi(cashFlowSummary.inflowAffiliateFee)} đ
                    </td>
                    <td className="py-1.5 px-2 text-right bg-rose-50/30 border-r border-slate-200 text-rose-600 text-[10px]">
                      {cashFlowSummary.totalInflow > 0
                        ? (-((cashFlowSummary.inflowAffiliateFee / cashFlowSummary.totalInflow) * 100)).toFixed(1)
                        : 0}%
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-600">
                        -{formatNumberVi(m.cashInflow.affiliateFeeDeducted)} đ
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* II. DÒNG TIỀN RA THEO 4 NHÓM CHÍNH */}
              <tr className="bg-rose-50/40 font-bold text-rose-950 border-t-2 border-rose-200">
                <td colSpan={months.length + 3} className="py-2.5 px-4 bg-rose-50/70 font-sans text-xs uppercase tracking-wide">
                  II. DÒNG TIỀN RA THEO 4 NHÓM CHI PHÍ CHÍNH (CASH OUTFLOW)
                </td>
              </tr>

              {/* NHÓM 1: VỐN HÀNG BÁN */}
              <tr className="font-semibold text-slate-900 bg-amber-50/20">
                <td className="py-2.5 px-4 sticky left-0 bg-amber-50/80 z-10 border-r border-slate-200 flex items-center justify-between font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-amber-700" />
                    <span>1. Nhóm: VỐN HÀNG BÁN (COGS)</span>
                  </div>
                  <button
                    onClick={() => toggleGroup('cogs')}
                    className="p-1 hover:bg-amber-100 rounded text-slate-500"
                  >
                    {expandedGroups.cogs ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right bg-amber-100/40 text-amber-900 border-r border-slate-300 font-bold">
                  -{formatNumberVi(cashFlowSummary.cogsOutflow)} đ
                </td>
                <td className="py-2.5 px-2 text-right bg-amber-50/30 text-amber-800 border-r border-slate-300 text-[11px] font-bold">
                  {cogsPercent}%
                </td>
                {cashFlowMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-amber-900 font-semibold">
                    -{formatNumberVi(m.cogsOutflow.total)} đ
                  </td>
                ))}
              </tr>

              {expandedGroups.cogs && (
                <>
                  <tr className="text-slate-600 text-[11px] bg-white">
                    <td className="py-2 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">• Tiền đặt hàng</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          Theo ngày phát lệnh PO
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right bg-slate-50 border-r border-slate-200 font-semibold text-slate-800">
                      -{formatNumberVi(cashFlowSummary.tienDatHang ?? cashFlowSummary.cogsSales)} đ
                    </td>
                    <td className="py-2 px-2 text-right bg-slate-50 border-r border-slate-200 text-[10px]">
                      {totalOut > 0 ? (((cashFlowSummary.tienDatHang ?? cashFlowSummary.cogsSales) / totalOut) * 100).toFixed(1) : 0}%
                    </td>
                    {cashFlowMonthly.map((m) => {
                      const poVal = m.cogsOutflow.tienDatHang ?? m.cogsOutflow.cogsSales;
                      const batches = m.cogsOutflow.poBatches || [];
                      const hasBatches = batches.length > 0;
                      const titleTooltip = hasBatches
                        ? `Các lệnh PO ghi nhận chi phí tháng ${m.month.label} (theo Ngày phát lệnh PO):\n` +
                          batches
                            .map(
                              (b) =>
                                `• ${b.batchCode} (${b.skuCode}): ${formatNumberVi(b.totalCost)} đ | Phát lệnh: ${b.orderDate} -> Về kho: ${b.deliveryDate}${b.isPreHorizon ? ' [Đặt trước kỳ]' : ''}`
                            )
                            .join('\n')
                        : `Không có lệnh PO phát trong tháng ${m.month.label}`;

                      return (
                        <td
                          key={m.month.id}
                          className={`py-2 px-3 text-right border-r border-slate-200 ${
                            poVal > 0 ? 'bg-amber-50/15' : ''
                          }`}
                          title={titleTooltip}
                        >
                          <div className="flex flex-col items-end">
                            <span className={poVal > 0 ? 'font-medium text-slate-800' : 'text-slate-400'}>
                              -{formatNumberVi(poVal)} đ
                            </span>
                            {hasBatches && (
                              <span className="text-[9px] text-amber-700 bg-amber-100/70 px-1 py-0.2 rounded mt-0.5 whitespace-nowrap">
                                {batches.length} lệnh PO
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </>
              )}

              {/* NHÓM 2: NHÂN SỰ */}
              <tr className="font-semibold text-slate-900 bg-blue-50/20">
                <td className="py-2.5 px-4 sticky left-0 bg-blue-50/80 z-10 border-r border-slate-200 flex items-center justify-between font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-blue-700" />
                    <span>2. Nhóm: NHÂN SỰ (Human Resources)</span>
                  </div>
                  <button
                    onClick={() => toggleGroup('labor')}
                    className="p-1 hover:bg-blue-100 rounded text-slate-500"
                  >
                    {expandedGroups.labor ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-100/40 text-blue-900 border-r border-slate-300 font-bold">
                  -{formatNumberVi(cashFlowSummary.laborOutflow)} đ
                </td>
                <td className="py-2.5 px-2 text-right bg-blue-50/30 text-blue-800 border-r border-slate-300 text-[11px] font-bold">
                  {laborPercent}%
                </td>
                {cashFlowMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-blue-900 font-semibold">
                    -{formatNumberVi(m.laborOutflow.total)} đ
                  </td>
                ))}
              </tr>

              {expandedGroups.labor && (
                <tr className="text-slate-600 text-[11px] bg-white">
                  <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                    • Chi phí nhân sự (Lương thực nhận, BHXH 21.5%, thưởng KPI &amp; thuế TNCN)
                  </td>
                  <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-200">
                    -{formatNumberVi(cashFlowSummary.laborOutflow)} đ
                  </td>
                  <td className="py-1 px-2 text-right bg-slate-50 border-r border-slate-200 text-[10px]">
                    {laborPercent}%
                  </td>
                  {cashFlowMonthly.map((m) => (
                    <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200">
                      -{formatNumberVi(m.laborOutflow.salaryCost)} đ
                    </td>
                  ))}
                </tr>
              )}

              {/* NHÓM 3: VẬN HÀNH */}
              <tr className="font-semibold text-slate-900 bg-teal-50/20">
                <td className="py-2.5 px-4 sticky left-0 bg-teal-50/80 z-10 border-r border-slate-200 flex items-center justify-between font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4 text-teal-700" />
                    <span>3. Nhóm: VẬN HÀNH (Operations &amp; Fulfillment)</span>
                  </div>
                  <button
                    onClick={() => toggleGroup('operations')}
                    className="p-1 hover:bg-teal-100 rounded text-slate-500"
                  >
                    {expandedGroups.operations ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right bg-teal-100/40 text-teal-900 border-r border-slate-300 font-bold">
                  -{formatNumberVi(cashFlowSummary.operationsOutflow)} đ
                </td>
                <td className="py-2.5 px-2 text-right bg-teal-50/30 text-teal-800 border-r border-slate-300 text-[11px] font-bold">
                  {opexPercent}%
                </td>
                {cashFlowMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-teal-900 font-semibold">
                    -{formatNumberVi(m.operationsOutflow.total)} đ
                  </td>
                ))}
              </tr>

              {expandedGroups.operations && (
                <>
                  <tr className="text-slate-600 text-[11px] bg-white">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                      • Chi phí đầu tư ban đầu (Capex giải ngân thực tế)
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-200">
                      -{formatNumberVi(cashFlowSummary.capexDisbursement)} đ
                    </td>
                    <td className="py-1 px-2 text-right bg-slate-50 border-r border-slate-200 text-[10px]">
                      {totalOut > 0 ? ((cashFlowSummary.capexDisbursement / totalOut) * 100).toFixed(1) : 0}%
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200">
                        -{formatNumberVi(m.operationsOutflow.capexDisbursement)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] bg-white">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                      • Chi phí vận hành mỗi tháng (Fixed Opex kho bãi, điện nước, phần mềm...)
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-200">
                      -{formatNumberVi(cashFlowSummary.operatingOpex)} đ
                    </td>
                    <td className="py-1 px-2 text-right bg-slate-50 border-r border-slate-200 text-[10px]">
                      {totalOut > 0 ? ((cashFlowSummary.operatingOpex / totalOut) * 100).toFixed(1) : 0}%
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200">
                        -{formatNumberVi(m.operationsOutflow.operatingOpex)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-700 text-[11px] bg-slate-50/40 font-medium">
                    <td className="py-1 px-8 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)] flex items-center justify-between">
                      <span>• Nhóm phí fulfillment (Bao bì đóng gói &amp; Hao hụt kho)</span>
                      <button
                        onClick={() => toggleGroup('fulfillmentSub')}
                        className="text-[10px] text-teal-700 hover:underline"
                      >
                        {expandedGroups.fulfillmentSub ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                      </button>
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-100/60 border-r border-slate-200">
                      -{formatNumberVi(cashFlowSummary.fulfillmentTotal)} đ
                    </td>
                    <td className="py-1 px-2 text-right bg-slate-100/30 border-r border-slate-200 text-[10px]">
                      {totalOut > 0 ? ((cashFlowSummary.fulfillmentTotal / totalOut) * 100).toFixed(1) : 0}%
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200">
                        -{formatNumberVi(m.operationsOutflow.fulfillmentTotal)} đ
                      </td>
                    ))}
                  </tr>
                  {expandedGroups.fulfillmentSub && (
                    <>
                      <tr className="text-slate-500 text-[10px] bg-slate-50/20">
                        <td className="py-1 px-12 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                          - Chi phí bao bì đóng gói (thùng carton, màng xốp)
                        </td>
                        <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-200">
                          -{formatNumberVi(cashFlowSummary.packagingFee)} đ
                        </td>
                        <td className="py-1 px-2 text-right bg-slate-50 border-r border-slate-200 text-[9px]">
                          -
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200">
                            -{formatNumberVi(m.operationsOutflow.packagingFee)} đ
                          </td>
                        ))}
                      </tr>
                      <tr className="text-slate-500 text-[10px] bg-slate-50/20">
                        <td className="py-1 px-12 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                          - Chi phí hao hụt lưu kho sàn
                        </td>
                        <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-200">
                          -{formatNumberVi(cashFlowSummary.shrinkageWarehouseFee)} đ
                        </td>
                        <td className="py-1 px-2 text-right bg-slate-50 border-r border-slate-200 text-[9px]">
                          -
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200">
                            -{formatNumberVi(m.operationsOutflow.shrinkageWarehouseFee)} đ
                          </td>
                        ))}
                      </tr>
                    </>
                  )}
                </>
              )}

              {/* NHÓM 4: MARKETING BÁN HÀNG */}
              <tr className="font-semibold text-slate-900 bg-purple-50/20">
                <td className="py-2.5 px-4 sticky left-0 bg-purple-50/80 z-10 border-r border-slate-200 flex items-center justify-between font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center space-x-1.5">
                    <Megaphone className="w-4 h-4 text-purple-700" />
                    <span>4. Nhóm: MKT BÁN HÀNG (Sales &amp; Marketing)</span>
                  </div>
                  <button
                    onClick={() => toggleGroup('marketing')}
                    className="p-1 hover:bg-purple-100 rounded text-slate-500"
                  >
                    {expandedGroups.marketing ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right bg-purple-100/40 text-purple-900 border-r border-slate-300 font-bold">
                  -{formatNumberVi(cashFlowSummary.marketingSalesOutflow)} đ
                </td>
                <td className="py-2.5 px-2 text-right bg-purple-50/30 text-purple-800 border-r border-slate-300 text-[11px] font-bold">
                  {mktPercent}%
                </td>
                {cashFlowMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-purple-900 font-semibold">
                    -{formatNumberVi(m.marketingSalesOutflow.total)} đ
                  </td>
                ))}
              </tr>

              {expandedGroups.marketing && (
                <>
                  <tr className="text-slate-600 text-[11px] bg-white">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                      • Phí quảng cáo nội sàn (Shopee Ads &amp; TikTok Ads)
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-200">
                      -{formatNumberVi(cashFlowSummary.internalAdsFee)} đ
                    </td>
                    <td className="py-1 px-2 text-right bg-slate-50 border-r border-slate-200 text-[10px]">
                      {totalOut > 0 ? ((cashFlowSummary.internalAdsFee / totalOut) * 100).toFixed(1) : 0}%
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200">
                        -{formatNumberVi(m.marketingSalesOutflow.internalAdsFee)} đ
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-600 text-[11px] bg-white">
                    <td className="py-1 px-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                      • Phí Booking Creator (Hợp đồng KOC / KOL / UGC)
                    </td>
                    <td className="py-1 px-3 text-right bg-slate-50 border-r border-slate-200">
                      -{formatNumberVi(cashFlowSummary.creatorBookingFee)} đ
                    </td>
                    <td className="py-1 px-2 text-right bg-slate-50 border-r border-slate-200 text-[10px]">
                      {totalOut > 0 ? ((cashFlowSummary.creatorBookingFee / totalOut) * 100).toFixed(1) : 0}%
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-1 px-3 text-right border-r border-slate-200">
                        -{formatNumberVi(m.marketingSalesOutflow.creatorBookingFee)} đ
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* Thuế TNDN tạm nộp nếu có */}
              {cashFlowSummary.taxOutflow > 0 && (
                <tr className="text-slate-600 text-[11px] bg-slate-50/40">
                  <td className="py-1.5 px-4 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                    • Thuế TNDN tạm nộp (nếu có lãi P&amp;L)
                  </td>
                  <td className="py-1.5 px-3 text-right bg-slate-100/60 border-r border-slate-200">
                    -{formatNumberVi(cashFlowSummary.taxOutflow)} đ
                  </td>
                  <td className="py-1.5 px-2 text-right bg-slate-100/30 border-r border-slate-200 text-[10px]">
                    {totalOut > 0 ? ((cashFlowSummary.taxOutflow / totalOut) * 100).toFixed(1) : 0}%
                  </td>
                  {cashFlowMonthly.map((m) => (
                    <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                      -{formatNumberVi(m.corporateTaxOutflow)} đ
                    </td>
                  ))}
                </tr>
              )}

              {/* TỔNG CHI TIỀN MẶT */}
              <tr className="bg-rose-100/60 font-bold text-rose-950 border-t-2 border-rose-300">
                <td className="py-2.5 px-4 sticky left-0 bg-rose-100/95 z-10 border-r border-slate-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  TỔNG CHI TIỀN MẶT (TOTAL CASH OUTFLOW)
                </td>
                <td className="py-2.5 px-3 text-right bg-rose-200/70 text-rose-950 border-r border-slate-300 font-bold">
                  -{formatNumberVi(cashFlowSummary.totalOutflow)} đ
                </td>
                <td className="py-2.5 px-2 text-right bg-rose-100/50 text-rose-800 border-r border-slate-300 text-[11px] font-bold">
                  100%
                </td>
                {cashFlowMonthly.map((m) => (
                  <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-slate-200 text-rose-900 font-bold">
                    -{formatNumberVi(m.totalCashOutflow)} đ
                  </td>
                ))}
              </tr>

              {/* LƯU CHUYỂN TIỀN THUẦN */}
              <tr className="bg-slate-100/90 font-bold text-slate-900 border-t border-slate-300">
                <td className="py-2.5 px-4 sticky left-0 bg-slate-100 z-10 border-r border-slate-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                  LƯU CHUYỂN TIỀN THUẦN TRONG THÁNG (NET CASH FLOW)
                </td>
                <td className={`py-2.5 px-3 text-right border-r border-slate-300 font-bold ${
                  cashFlowSummary.netCashFlow >= 0 ? 'text-emerald-800 bg-emerald-100/50' : 'text-rose-800 bg-rose-100/50'
                }`}>
                  {cashFlowSummary.netCashFlow >= 0 ? '+' : ''}{formatNumberVi(cashFlowSummary.netCashFlow)} đ
                </td>
                <td className="py-2.5 px-2 text-right border-r border-slate-300 text-[11px] text-slate-400">
                  -
                </td>
                {cashFlowMonthly.map((m) => (
                  <td
                    key={m.month.id}
                    className={`py-2.5 px-3 text-right border-r border-slate-200 font-bold ${
                      m.netCashFlow >= 0 ? 'text-emerald-800' : 'text-rose-700'
                    }`}
                  >
                    {m.netCashFlow >= 0 ? '+' : ''}{formatNumberVi(m.netCashFlow)} đ
                  </td>
                ))}
              </tr>

              {/* SỐ DƯ TIỀN MẶT CUỐI KỲ */}
              <tr className={`font-bold text-sm border-t-2 border-slate-900 ${
                cashFlowSummary.finalCashBalance >= 0 ? 'bg-emerald-100/80 text-emerald-950' : 'bg-rose-100/80 text-rose-950'
              }`}>
                <td className={`py-3 px-4 sticky left-0 z-10 border-r border-slate-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)] ${
                  cashFlowSummary.finalCashBalance >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
                }`}>
                  SỐ DƯ TIỀN MẶT CUỐI KỲ (ENDING CASH BALANCE)
                </td>
                <td className={`py-3 px-3 text-right border-r border-slate-400 font-mono font-bold ${
                  cashFlowSummary.finalCashBalance >= 0 ? 'text-emerald-950 bg-emerald-200/90' : 'text-rose-950 bg-rose-200/90'
                }`}>
                  {cashFlowSummary.finalCashBalance >= 0 ? '+' : ''}{formatNumberVi(cashFlowSummary.finalCashBalance)} đ
                </td>
                <td className="py-3 px-2 text-right border-r border-slate-400 text-xs font-mono font-bold">
                  {cashFlowSummary.finalCashBalance >= 0 ? 'An Toàn' : 'Thâm Hụt'}
                </td>
                {cashFlowMonthly.map((m) => (
                  <td
                    key={m.month.id}
                    className={`py-3 px-3 text-right border-r border-slate-200 font-mono ${
                      m.endingBalance >= 0 ? 'text-emerald-950 font-bold' : 'text-rose-700 bg-rose-50/90 font-bold'
                    }`}
                  >
                    {m.endingBalance >= 0 ? '+' : ''}{formatNumberVi(m.endingBalance)} đ
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer ghi chú quy chuẩn */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              <strong>Ghi chú quy chuẩn:</strong> Phí tiếp thị liên kết (Affiliate Fee) được cấn trừ trực tiếp tại Dòng tiền vào do sàn tự động trừ trước khi đối soát giải ngân về ví doanh nghiệp.
            </span>
          </div>
          <div className="text-slate-400 shrink-0">
            Kế toán quản trị thương mại điện tử
          </div>
        </div>
      </div>
    </div>
  );
};
