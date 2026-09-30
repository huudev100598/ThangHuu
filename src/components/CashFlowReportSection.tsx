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
  Download, 
  Info, 
  Clock,
  Layers,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface CashFlowReportSectionProps {
  months: SalesMonth[];
  cashFlowMonthly: MonthlyCashFlowRecord[];
  cashFlowSummary: {
    startingCash: number;
    totalInflow: number;
    inflowNetRevenue: number;
    inflowAffiliateFee: number;
    gmv?: number;
    vatOutput?: number;
    grossRevenue?: number;
    totalPlatformFees?: number;
    totalShipping?: number;
    totalInternalAds?: number;
    totalAffiliateFee?: number;
    totalPackagingFee?: number;
    totalShrinkageFee?: number;
    actualInflow?: number;
    totalInflowReceived?: number;
    warehouseDeposit?: number;
    warehouseOperating?: number;
    contingencyReserve?: number;
    corporateTaxOutflow?: number;

    cogsOutflow: number;
    tienDatHang: number;
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
  // Trạng thái thu gọn bảng (chỉ hiển thị 5 dòng cốt lõi) hoặc mở rộng đầy đủ
  const [isCompact, setIsCompact] = useState<boolean>(false);

  // Trạng thái mở rộng các nhóm chi phí con trong chế độ mở rộng
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    grossRevenue: false, // Xem chi tiết Doanh thu gộp (GMV, Thuế VAT 8%)
    cashOutflow: true,   // Xem chi tiết Tổng chi tiền mặt (6 khoản chi tiền mặt)
    platform: true,
    shipping: true,
    marketing: true,
    operations: true,
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExpandAll = () => {
    setIsCompact(false);
    setExpandedGroups({
      grossRevenue: true,
      cashOutflow: true,
      platform: true,
      shipping: true,
      marketing: true,
      operations: true,
    });
  };

  const handleCollapseAll = () => {
    setIsCompact(true);
    setExpandedGroups({
      grossRevenue: false,
      cashOutflow: false,
      platform: false,
      shipping: false,
      marketing: false,
      operations: false,
    });
  };

  // Hàm render số có dấu (+ hoặc - chuẩn xác, không bao giờ bị +-) và đổi màu Đỏ khi âm / Xanh khi dương (đã bỏ đơn vị đ)
  const renderSignedAmount = (val: number, isOutflowExpense: boolean = false) => {
    if (isOutflowExpense) {
      if (val === 0) return <span className="text-slate-500 font-mono font-semibold">0</span>;
      // Chi phí tiền mặt: luôn là dòng tiền ra (-) nên hiển thị ĐỎ
      return <span className="text-rose-700 font-mono font-bold">-{formatNumberVi(Math.abs(val))}</span>;
    }
    if (val > 0) {
      return <span className="text-emerald-700 font-mono font-bold">+{formatNumberVi(val)}</span>;
    }
    if (val < 0) {
      return <span className="text-rose-700 font-mono font-bold">-{formatNumberVi(Math.abs(val))}</span>;
    }
    return <span className="text-slate-600 font-mono font-semibold">0</span>;
  };

  // Hàm chuỗi cho xuất file CSV (đảm bảo không bị +-, không gắn đ)
  const formatSignedString = (val: number, isOutflowExpense: boolean = false) => {
    if (isOutflowExpense) {
      if (val === 0) return '0';
      return `-${formatNumberVi(Math.abs(val))}`;
    }
    if (val > 0) return `+${formatNumberVi(val)}`;
    if (val < 0) return `-${formatNumberVi(Math.abs(val))}`;
    return '0';
  };

  // Tính tổng kỳ cho từng khoản mục
  const totalGmv = cashFlowMonthly.reduce((s, m) => s + m.gmv, 0);
  const totalVat = cashFlowMonthly.reduce((s, m) => s + m.vatOutput, 0);
  const totalGrossRev = cashFlowMonthly.reduce((s, m) => s + m.grossRevenue, 0);

  const totalPlatformFees = cashFlowMonthly.reduce((s, m) => s + m.platformFees.total, 0);
  const totalPaymentFee = cashFlowMonthly.reduce((s, m) => s + m.platformFees.paymentFee, 0);
  const totalCommissionFee = cashFlowMonthly.reduce((s, m) => s + m.platformFees.commissionFee, 0);
  const totalVoucherXtraFee = cashFlowMonthly.reduce((s, m) => s + m.platformFees.voucherXtraFee, 0);
  const totalHandlingFee = cashFlowMonthly.reduce((s, m) => s + m.platformFees.handlingFee, 0);
  const totalCompensationFee = cashFlowMonthly.reduce((s, m) => s + m.platformFees.compensationFee, 0);

  const totalShipping = cashFlowMonthly.reduce((s, m) => s + m.shippingB2bRetail.total, 0);
  const totalB2bShipping = cashFlowMonthly.reduce((s, m) => s + m.shippingB2bRetail.b2bShipping, 0);
  const totalRetailShipping = cashFlowMonthly.reduce((s, m) => s + m.shippingB2bRetail.retailShipping, 0);

  const totalInternalAds = cashFlowMonthly.reduce((s, m) => s + m.marketingOutflowDetail.internalAdsFee, 0);
  const totalAffiliate = cashFlowMonthly.reduce((s, m) => s + m.affiliateFee, 0);
  const totalPackaging = cashFlowMonthly.reduce((s, m) => s + m.operationsOutflowDetail.packagingFee, 0);
  const totalShrinkage = cashFlowMonthly.reduce((s, m) => s + m.shrinkageFee, 0);

  const totalActualInflow = cashFlowMonthly.reduce((s, m) => s + m.actualInflow, 0);
  const totalOutflow = cashFlowMonthly.reduce((s, m) => s + m.totalCashOutflow, 0);

  const totalTienDatHang = cashFlowMonthly.reduce((s, m) => s + m.tienDatHang, 0);
  const totalLabor = cashFlowMonthly.reduce((s, m) => s + m.laborCost, 0);
  const totalMkt = cashFlowMonthly.reduce((s, m) => s + m.marketingOutflowDetail.total, 0);
  const totalBooking = cashFlowMonthly.reduce((s, m) => s + m.marketingOutflowDetail.creatorBookingFee, 0);

  const totalOps = cashFlowMonthly.reduce((s, m) => s + m.operationsOutflowDetail.total, 0);
  const totalCapex = cashFlowMonthly.reduce((s, m) => s + m.operationsOutflowDetail.capexDisbursement, 0);
  const totalDeposit = cashFlowMonthly.reduce((s, m) => s + m.operationsOutflowDetail.warehouseDeposit, 0);
  const totalOperating = cashFlowMonthly.reduce((s, m) => s + m.operationsOutflowDetail.warehouseOperating, 0);

  const totalTax = cashFlowMonthly.reduce((s, m) => s + m.corporateTaxOutflow, 0);
  const totalContingency = cashFlowMonthly.reduce((s, m) => s + m.contingencyReserve, 0);

  // Xuất CSV báo cáo Dòng tiền & Kế hoạch vốn (đã bỏ cột tỷ trọng)
  const exportCashFlowCsv = () => {
    const headers = ['Khoản Mục Dòng Tiền & Kế Hoạch Vốn', 'Tổng Kỳ', ...months.map(m => m.label.replace('Tháng ', 'T.'))];
    const rows: (string | number)[][] = [];

    if (isCompact) {
      // Chế độ thu gọn: Chỉ 5 dòng cốt lõi
      rows.push([
        'Số dư tiền mặt đầu kỳ',
        formatSignedString(cashFlowSummary.startingCash),
        ...cashFlowMonthly.map(m => formatSignedString(m.startingBalance))
      ]);
      rows.push([
        'Doanh thu gộp (Gross Revenue)',
        formatSignedString(totalGrossRev),
        ...cashFlowMonthly.map(m => formatSignedString(m.grossRevenue))
      ]);
      rows.push([
        'Dòng tiền vào thực thu',
        formatSignedString(totalActualInflow),
        ...cashFlowMonthly.map(m => formatSignedString(m.actualInflow))
      ]);
      rows.push([
        'Tổng chi tiền mặt',
        formatSignedString(totalOutflow, true),
        ...cashFlowMonthly.map(m => formatSignedString(m.totalCashOutflow, true))
      ]);
      rows.push([
        'Số dư tiền mặt cuối kỳ',
        formatSignedString(cashFlowSummary.finalCashBalance),
        ...cashFlowMonthly.map(m => formatSignedString(m.endingBalance))
      ]);
    } else {
      // Chế độ mở rộng đầy đủ
      rows.push([
        'Số dư tiền mặt đầu kỳ',
        formatSignedString(cashFlowSummary.startingCash),
        ...cashFlowMonthly.map(m => formatSignedString(m.startingBalance))
      ]);
      rows.push([
        'Doanh thu GMV',
        formatNumberVi(totalGmv),
        ...cashFlowMonthly.map(m => formatNumberVi(m.gmv))
      ]);
      rows.push([
        'Thuế VAT đầu ra phải nộp (8%)',
        '-' + formatNumberVi(totalVat),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.vatOutput))
      ]);
      rows.push([
        'Doanh thu gộp (Gross Revenue)',
        formatSignedString(totalGrossRev),
        ...cashFlowMonthly.map(m => formatSignedString(m.grossRevenue))
      ]);

      rows.push([
        'Chi phí sàn (TMĐT)',
        '-' + formatNumberVi(totalPlatformFees),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.platformFees.total))
      ]);
      rows.push([
        '  - Phí thanh toán sàn',
        '-' + formatNumberVi(totalPaymentFee),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.platformFees.paymentFee))
      ]);
      rows.push([
        '  - Phí hoa hồng nền tảng',
        '-' + formatNumberVi(totalCommissionFee),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.platformFees.commissionFee))
      ]);
      rows.push([
        '  - Phí dịch vụ Voucher Xtra',
        '-' + formatNumberVi(totalVoucherXtraFee),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.platformFees.voucherXtraFee))
      ]);
      rows.push([
        '  - Phí xử lý đơn hàng',
        '-' + formatNumberVi(totalHandlingFee),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.platformFees.handlingFee))
      ]);
      rows.push([
        '  - Phí bồi hoàn sàn',
        '-' + formatNumberVi(totalCompensationFee),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.platformFees.compensationFee))
      ]);

      rows.push([
        'Chi phí vận chuyển (B2B/Retail)',
        '-' + formatNumberVi(totalShipping),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.shippingB2bRetail.total))
      ]);
      rows.push([
        '  - Vận chuyển B2B',
        '-' + formatNumberVi(totalB2bShipping),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.shippingB2bRetail.b2bShipping))
      ]);
      rows.push([
        '  - Vận chuyển Retail',
        '-' + formatNumberVi(totalRetailShipping),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.shippingB2bRetail.retailShipping))
      ]);

      rows.push([
        'Chi phí tiếp thị liên kết',
        '-' + formatNumberVi(totalAffiliate),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.affiliateFee))
      ]);
      rows.push([
        'Chi phí hao hụt/lưu kho',
        '-' + formatNumberVi(totalShrinkage),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.shrinkageFee))
      ]);

      rows.push([
        'Dòng tiền vào thực thu',
        formatSignedString(totalActualInflow),
        ...cashFlowMonthly.map(m => formatSignedString(m.actualInflow))
      ]);

      rows.push([
        'Tổng chi tiền mặt',
        formatSignedString(totalOutflow, true),
        ...cashFlowMonthly.map(m => formatSignedString(m.totalCashOutflow, true))
      ]);
      rows.push([
        '1. Tiền Đặt Hàng (theo ngày phát hành PO)',
        '-' + formatNumberVi(totalTienDatHang),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.tienDatHang))
      ]);
      rows.push([
        '2. Chi Phí Nhân Sự',
        '-' + formatNumberVi(totalLabor),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.laborCost))
      ]);
      rows.push([
        '3. Chi Phí Marketing',
        '-' + formatNumberVi(totalMkt),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.marketingOutflowDetail.total))
      ]);
      rows.push([
        '  - Chi phí Booking',
        '-' + formatNumberVi(totalBooking),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.marketingOutflowDetail.creatorBookingFee))
      ]);
      rows.push([
        '  - Chi phí Quảng Cáo Nội Sàn (ghi nhận chi phí vào tháng trước đó)',
        '-' + formatNumberVi(totalInternalAds),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.marketingOutflowDetail.internalAdsFee))
      ]);

      rows.push([
        '4. Chi Phí Vận Hành',
        '-' + formatNumberVi(totalOps),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.operationsOutflowDetail.total))
      ]);
      rows.push([
        '  - Chi phí đầu tư ban đầu',
        '-' + formatNumberVi(totalCapex),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.operationsOutflowDetail.capexDisbursement))
      ]);
      rows.push([
        '  - Chi phí cọc kho',
        '-' + formatNumberVi(totalDeposit),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.operationsOutflowDetail.warehouseDeposit))
      ]);
      rows.push([
        '  - Chi phí vận hành kho',
        '-' + formatNumberVi(totalOperating),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.operationsOutflowDetail.warehouseOperating))
      ]);
      rows.push([
        '  - Chi phí bao bì đóng gói (ghi nhận chi phí vào tháng trước đó)',
        '-' + formatNumberVi(totalPackaging),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.operationsOutflowDetail.packagingFee))
      ]);

      rows.push([
        '5. Thuế TNDN',
        '-' + formatNumberVi(totalTax),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.corporateTaxOutflow))
      ]);
      rows.push([
        '6. Chi phí dự phòng',
        '-' + formatNumberVi(totalContingency),
        ...cashFlowMonthly.map(m => '-' + formatNumberVi(m.contingencyReserve))
      ]);

      rows.push([
        'Số dư tiền mặt cuối kỳ',
        formatSignedString(cashFlowSummary.finalCashBalance),
        ...cashFlowMonthly.map(m => formatSignedString(m.endingBalance))
      ]);
    }

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Bao_Cao_Dong_Tien_${isCompact ? 'Thu_Gon_' : 'Chi_Tiet_'}${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* 4 Thẻ KPI Tóm Tắt Dòng Tiền & Vốn */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Vốn tiền mặt đầu kỳ */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Vốn Đầu Kỳ</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900">
            {formatNumberVi(cashFlowSummary.startingCash)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Vốn tiền mặt sẵn sàng giải ngân
          </p>
        </div>

        {/* Tổng dòng tiền vào thực thu */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Thực Thu</span>
            <ArrowDownRight className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono">
            {renderSignedAmount(totalActualInflow)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Sau khi trừ phí sàn, Ads &amp; bao bì
          </p>
        </div>

        {/* Tổng chi tiền mặt (6 chi phí) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Chi Tiền Mặt</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono">
            {renderSignedAmount(totalOutflow, true)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            6 nhóm chi phí tiền mặt thực tế
          </p>
        </div>

        {/* Số dư cuối kỳ & Điểm đáy an toàn */}
        <div className={`rounded-xl border p-4 shadow-2xs ${
          cashFlowSummary.finalCashBalance >= 0 
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
            : 'bg-rose-50/70 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Số Dư Cuối Kỳ</span>
            {cashFlowSummary.finalCashBalance >= 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="mt-2 text-xl font-bold font-mono">
            {renderSignedAmount(cashFlowSummary.finalCashBalance)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
            <span>Đáy vốn: {formatNumberVi(cashFlowSummary.minCashBalance)}</span>
            <span className={`font-semibold font-mono ${cashFlowSummary.finalCashBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ({cashFlowSummary.minCashMonthLabel})
            </span>
          </div>
        </div>
      </div>

      {/* Cảnh báo Thâm hụt vốn lưu động nếu có */}
      {cashFlowSummary.totalWorkingCapitalDeficit > 0 && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-3.5 flex items-start space-x-3 text-amber-900 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-950">
              Khuyến Nghị Vốn Lưu Động: Cần Dự Trữ Bổ Sung Tối Thiểu ~{formatNumberVi(cashFlowSummary.totalWorkingCapitalDeficit)}
            </div>
            <p className="text-amber-800 leading-relaxed">
              Mô hình phát hiện số dư tiền mặt bị âm tại <strong className="text-amber-950">{cashFlowSummary.minCashMonthLabel}</strong> do thời gian đối soát tiền bán hàng từ sàn (T-1) và các khoản đặt hàng sản xuất PO hoặc chi phí ban đầu. Cần chuẩn bị hạn mức tín dụng hoặc gối vốn đầu tư để bảo đảm thanh khoản liên tục.
            </p>
          </div>
        </div>
      )}

      {/* Bảng Dòng Tiền & Kế Hoạch Vốn */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Header Action Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">
                  BÁO CÁO DÒNG TIỀN &amp; KẾ HOẠCH VỐN (CASH FLOW STATEMENT)
                </h3>
                {isCompact && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Chế độ thu gọn (5 dòng)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Lập kế hoạch vốn cuốn chiếu theo thời gian thực (Đơn vị tính: VNĐ)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Nút Thu gọn (chỉ hiển thị 5 dòng cốt lõi) */}
            <button
              onClick={handleCollapseAll}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isCompact
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
              title="Chỉ hiển thị 5 dòng cốt lõi: Đầu kỳ, Doanh thu gộp, Thực thu, Tổng chi, Cuối kỳ"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Thu gọn</span>
            </button>

            {/* Nút Mở rộng tất cả */}
            <button
              onClick={handleExpandAll}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !isCompact
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
              title="Mở rộng toàn bộ chi tiết tất cả các khoản mục"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Mở rộng tất cả</span>
            </button>

            {/* Nút Xuất CSV */}
            <button
              onClick={exportCashFlowCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto overflow-y-auto max-h-[75vh] max-w-full rounded-b-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-xs text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-30 bg-slate-100 shadow-xs">
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 h-[41px]">
                <th className="py-2.5 px-4 sticky top-0 left-0 z-40 bg-slate-100 border-r border-slate-300 min-w-[280px]">
                  Khoản Mục Dòng Tiền &amp; Kế Hoạch Vốn (VNĐ)
                </th>
                <th className="py-2.5 px-3 sticky top-0 z-30 text-right border-r border-slate-300 min-w-[130px] font-mono font-bold text-slate-900 bg-slate-200">
                  Tổng Kỳ
                </th>
                {months.map((m) => (
                  <th
                    key={m.id}
                    className="py-2.5 px-3 sticky top-0 z-30 text-right border-r border-slate-300 font-mono font-bold text-slate-800 min-w-[110px] bg-slate-100"
                  >
                    {m.label.replace('Tháng ', 'T.')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {isCompact ? (
                /* =========================================================================
                   CHẾ ĐỘ THU GỌN: CHỈ HIỂN THỊ ĐÚNG 5 DÒNG CỐT LÕI (ĐỎ KHI ÂM, XANH KHI DƯƠNG)
                   ========================================================================= */
                <>
                  {/* DÒNG 1: SỐ DƯ TIỀN MẶT ĐẦU KỲ (Cố định/Khoá khi cuộn) */}
                  <tr className="bg-[#D1FAE5] font-bold border-b border-emerald-300">
                    <td className="py-2.5 px-4 sticky top-[41px] left-0 z-[35] bg-[#D1FAE5] border-r border-b border-emerald-300 font-sans shadow-[2px_2px_4px_-1px_rgba(0,0,0,0.08)] text-emerald-950 font-bold">
                      Số dư tiền mặt đầu kỳ
                    </td>
                    <td className="py-2.5 px-3 text-right sticky top-[41px] z-[25] border-r border-b border-emerald-300 bg-[#A7F3D0] shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                      {renderSignedAmount(cashFlowSummary.startingCash)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td
                        key={m.month.id}
                        className="py-2.5 px-3 text-right sticky top-[41px] z-[25] border-r border-b border-emerald-200 bg-[#D1FAE5] shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]"
                      >
                        {renderSignedAmount(m.startingBalance)}
                      </td>
                    ))}
                  </tr>

                  {/* DÒNG 2: DOANH THU GỘP (GROSS REVENUE) */}
                  <tr className="bg-[#EDE9FE]/85 font-bold border-t border-b border-purple-300">
                    <td className="py-2.5 px-4 sticky left-0 z-20 bg-[#EDE9FE] border-r border-purple-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-purple-950 font-bold">
                      <div className="flex items-center justify-between w-full">
                        <span>Doanh thu gộp (Gross Revenue)</span>
                        <button
                          onClick={() => toggleGroup('grossRevenue')}
                          className="p-1 rounded hover:bg-purple-200/70 text-purple-700 transition-colors cursor-pointer"
                          title={expandedGroups.grossRevenue ? 'Thu gọn chi tiết' : 'Xem chi tiết GMV & Thuế VAT'}
                        >
                          {expandedGroups.grossRevenue ? (
                            <ChevronDown className="w-4 h-4 text-purple-800" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-purple-800" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-purple-300 bg-[#DDD6FE]/60">
                      {renderSignedAmount(totalGrossRev)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td
                        key={m.month.id}
                        className="py-2.5 px-3 text-right border-r border-purple-200"
                      >
                        {renderSignedAmount(m.grossRevenue)}
                      </td>
                    ))}
                  </tr>

                  {/* Chi tiết Doanh thu gộp (GMV & Thuế VAT) khi bấm nút > */}
                  {expandedGroups.grossRevenue && (
                    <>
                      <tr className="bg-white hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] font-medium">
                          - Doanh thu GMV
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/40 text-slate-900 font-semibold">
                          {formatNumberVi(totalGmv)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-800">
                            {formatNumberVi(m.gmv)}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-white hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-rose-700 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] font-medium">
                          - Thuế VAT đầu ra phải nộp (8%)
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/40 text-rose-700 font-semibold">
                          -{formatNumberVi(totalVat)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700">
                            -{formatNumberVi(m.vatOutput)}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {/* DÒNG 3: DÒNG TIỀN VÀO THỰC THU */}
                  <tr className="bg-[#EDE9FE]/95 font-bold border-t border-b border-purple-300">
                    <td className="py-3 px-4 sticky left-0 z-20 bg-[#EDE9FE] border-r border-purple-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-purple-950 font-bold">
                      Dòng tiền vào thực thu
                    </td>
                    <td className="py-3 px-3 text-right border-r border-purple-300 bg-[#DDD6FE]/60">
                      {renderSignedAmount(totalActualInflow)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td
                        key={m.month.id}
                        className="py-3 px-3 text-right border-r border-purple-200"
                      >
                        {renderSignedAmount(m.actualInflow)}
                      </td>
                    ))}
                  </tr>

                  {/* DÒNG 4: TỔNG CHI TIỀN MẶT */}
                  <tr className="bg-[#FFE4E6]/90 font-bold border-t border-b border-rose-300">
                    <td className="py-2.5 px-4 sticky left-0 z-20 bg-[#FFE4E6] border-r border-rose-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-rose-950 font-bold">
                      <div className="flex items-center justify-between w-full">
                        <span>Tổng chi tiền mặt</span>
                        <button
                          onClick={() => toggleGroup('cashOutflow')}
                          className="p-1 rounded hover:bg-rose-200/70 text-rose-700 transition-colors cursor-pointer"
                          title={expandedGroups.cashOutflow ? 'Thu gọn chi tiết' : 'Xem chi tiết 6 khoản chi tiền mặt'}
                        >
                          {expandedGroups.cashOutflow ? (
                            <ChevronDown className="w-4 h-4 text-rose-800" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-rose-800" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-rose-300 bg-[#FECDD3]/60">
                      {renderSignedAmount(totalOutflow, true)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td
                        key={m.month.id}
                        className="py-2.5 px-3 text-right border-r border-rose-200"
                      >
                        {renderSignedAmount(m.totalCashOutflow, true)}
                      </td>
                    ))}
                  </tr>

                  {/* Chi tiết 6 khoản chi tiền mặt khi bấm nút > ở Tổng chi tiền mặt */}
                  {expandedGroups.cashOutflow && (
                    <>
                      <tr className="bg-white hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] font-medium">
                          1. Tiền Đặt Hàng (theo ngày phát hành PO)
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700 bg-slate-50/40 font-medium">
                          -{formatNumberVi(totalTienDatHang)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700">
                            -{formatNumberVi(m.tienDatHang)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] font-medium">
                          2. Chi Phí Nhân Sự
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700 bg-slate-50/40 font-medium">
                          -{formatNumberVi(totalLabor)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700">
                            -{formatNumberVi(m.laborCost)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] font-medium">
                          3. Chi Phí Marketing (Booking, Quảng cáo nội sàn)
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700 bg-slate-50/40 font-medium">
                          -{formatNumberVi(totalMkt)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700">
                            -{formatNumberVi(m.marketingOutflowDetail.total)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] font-medium">
                          4. Chi Phí Vận Hành (Đầu tư ban đầu, Cọc kho, Vận hành kho, Bao bì)
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700 bg-slate-50/40 font-medium">
                          -{formatNumberVi(totalOps)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700">
                            -{formatNumberVi(m.operationsOutflowDetail.total)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] font-medium">
                          5. Thuế TNDN
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700 bg-slate-50/40 font-medium">
                          -{formatNumberVi(totalTax)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700">
                            -{formatNumberVi(m.corporateTaxOutflow)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] font-medium">
                          6. Chi phí dự phòng
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700 bg-slate-50/40 font-medium">
                          -{formatNumberVi(totalContingency)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700">
                            -{formatNumberVi(m.contingencyReserve)}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {/* DÒNG 5: SỐ DƯ TIỀN MẶT CUỐI KỲ */}
                  <tr className="bg-[#D1FAE5]/95 font-bold border-t-2 border-slate-900 text-sm">
                    <td className="py-3 px-4 sticky left-0 z-20 bg-[#D1FAE5] border-r border-emerald-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-emerald-950 font-bold">
                      Số dư tiền mặt cuối kỳ
                    </td>
                    <td className="py-3 px-3 text-right border-r border-emerald-300 bg-[#A7F3D0]/80">
                      {renderSignedAmount(cashFlowSummary.finalCashBalance)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td
                        key={m.month.id}
                        className="py-3 px-3 text-right border-r border-emerald-200 font-bold"
                      >
                        {renderSignedAmount(m.endingBalance)}
                      </td>
                    ))}
                  </tr>
                </>
              ) : (
                /* =========================================================================
                   CHẾ ĐỘ MỞ RỘNG TOÀN BỘ CHI TIẾT
                   ========================================================================= */
                <>
                  {/* 1. SỐ DƯ TIỀN MẶT ĐẦU KỲ (Cố định/Khoá khi cuộn) */}
                  <tr className="bg-[#D1FAE5] font-bold border-b border-emerald-300">
                    <td className="py-2.5 px-4 sticky top-[41px] left-0 z-[35] bg-[#D1FAE5] border-r border-b border-emerald-300 font-sans shadow-[2px_2px_4px_-1px_rgba(0,0,0,0.08)] text-emerald-950 font-bold">
                      Số dư tiền mặt đầu kỳ
                    </td>
                    <td className="py-2.5 px-3 text-right sticky top-[41px] z-[25] border-r border-b border-emerald-300 bg-[#A7F3D0] shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                      {renderSignedAmount(cashFlowSummary.startingCash)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td
                        key={m.month.id}
                        className="py-2.5 px-3 text-right sticky top-[41px] z-[25] border-r border-b border-emerald-200 bg-[#D1FAE5] shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]"
                      >
                        {renderSignedAmount(m.startingBalance)}
                      </td>
                    ))}
                  </tr>

                  {/* 2. DOANH THU GỘP (GROSS REVENUE) (Lavender/Purple) */}
                  <tr className="bg-[#EDE9FE]/85 font-bold border-t border-b border-purple-300">
                    <td className="py-2.5 px-4 sticky left-0 z-20 bg-[#EDE9FE] border-r border-purple-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-purple-950 font-bold">
                      <div className="flex items-center justify-between w-full">
                        <span>Doanh thu gộp (Gross Revenue)</span>
                        <button
                          onClick={() => toggleGroup('grossRevenue')}
                          className="p-1 rounded hover:bg-purple-200/70 text-purple-700 transition-colors cursor-pointer"
                          title={expandedGroups.grossRevenue ? 'Thu gọn chi tiết' : 'Xem chi tiết Doanh thu GMV & Thuế VAT'}
                        >
                          {expandedGroups.grossRevenue ? (
                            <ChevronDown className="w-4 h-4 text-purple-800" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-purple-800" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-purple-300 bg-[#DDD6FE]/60">
                      {renderSignedAmount(totalGrossRev)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-purple-200">
                        {renderSignedAmount(m.grossRevenue)}
                      </td>
                    ))}
                  </tr>

                  {/* Chi tiết Doanh thu gộp (Doanh thu GMV & Thuế VAT đầu ra) */}
                  {expandedGroups.grossRevenue && (
                    <>
                      <tr className="bg-white hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans font-medium text-slate-900 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                          - Doanh thu GMV
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 font-semibold text-slate-900 bg-slate-50/50">
                          {formatNumberVi(totalGmv)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-800">
                            {formatNumberVi(m.gmv)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-rose-700 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] font-medium">
                          - Thuế VAT đầu ra phải nộp (8%)
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700 bg-slate-50/50 font-semibold">
                          -{formatNumberVi(totalVat)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700">
                            -{formatNumberVi(m.vatOutput)}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {/* 3. CHI PHÍ SÀN (TMĐT) (Nút > đẩy xuống cuối hàng) */}
                  <tr className="bg-slate-50/80 hover:bg-slate-100/70 transition-colors font-medium text-slate-900">
                    <td className="py-2 px-4 sticky left-0 z-20 bg-slate-50 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-slate-900">Chi phí sàn (TMĐT)</span>
                        <button
                          onClick={() => toggleGroup('platform')}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title={expandedGroups.platform ? 'Thu gọn chi tiết' : 'Mở rộng chi tiết'}
                        >
                          {expandedGroups.platform ? (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-bold text-slate-900 bg-slate-100/60">
                      -{formatNumberVi(totalPlatformFees)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-slate-800">
                        -{formatNumberVi(m.platformFees.total)}
                      </td>
                    ))}
                  </tr>

                  {/* Chi tiết Chi phí sàn */}
                  {expandedGroups.platform && (
                    <>
                      <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                          - Phí thanh toán sàn
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                          -{formatNumberVi(totalPaymentFee)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                            -{formatNumberVi(m.platformFees.paymentFee)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                          - Phí hoa hồng nền tảng
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                          -{formatNumberVi(totalCommissionFee)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                            -{formatNumberVi(m.platformFees.commissionFee)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                          - Phí dịch vụ Voucher Xtra
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                          -{formatNumberVi(totalVoucherXtraFee)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                            -{formatNumberVi(m.platformFees.voucherXtraFee)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                          - Phí xử lý đơn hàng
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                          -{formatNumberVi(totalHandlingFee)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                            -{formatNumberVi(m.platformFees.handlingFee)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                          - Phí bồi hoàn sàn
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                          -{formatNumberVi(totalCompensationFee)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                            -{formatNumberVi(m.platformFees.compensationFee)}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {/* 4. CHI PHÍ VẬN CHUYỂN (B2B/Retail) (Nút > đẩy xuống cuối hàng) */}
                  <tr className="bg-slate-50/80 hover:bg-slate-100/70 transition-colors font-medium text-slate-900">
                    <td className="py-2 px-4 sticky left-0 z-20 bg-slate-50 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-slate-900">Chi phí vận chuyển (B2B/Retail)</span>
                        <button
                          onClick={() => toggleGroup('shipping')}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title={expandedGroups.shipping ? 'Thu gọn chi tiết' : 'Mở rộng chi tiết'}
                        >
                          {expandedGroups.shipping ? (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-bold text-slate-900 bg-slate-100/60">
                      -{formatNumberVi(totalShipping)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-slate-800">
                        -{formatNumberVi(m.shippingB2bRetail.total)}
                      </td>
                    ))}
                  </tr>

                  {/* Chi tiết Vận chuyển */}
                  {expandedGroups.shipping && (
                    <>
                      <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                          - Vận chuyển B2B
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                          -{formatNumberVi(totalB2bShipping)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                            -{formatNumberVi(m.shippingB2bRetail.b2bShipping)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                        <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                          - Vận chuyển Retail
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                          -{formatNumberVi(totalRetailShipping)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                            -{formatNumberVi(m.shippingB2bRetail.retailShipping)}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {/* 5. CHI PHÍ TIẾP THỊ LIÊN KẾT (Affiliate) */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-slate-900 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                      Chi phí tiếp thị liên kết
                    </td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 text-slate-900 font-medium bg-slate-50/50">
                      -{formatNumberVi(totalAffiliate)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-slate-700">
                        -{formatNumberVi(m.affiliateFee)}
                      </td>
                    ))}
                  </tr>

                  {/* 6. CHI PHÍ HAO HỤT/LƯU KHO */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-slate-900 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                      Chi phí hao hụt/lưu kho
                    </td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 text-slate-900 font-medium bg-slate-50/50">
                      -{formatNumberVi(totalShrinkage)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-slate-700">
                        -{formatNumberVi(m.shrinkageFee)}
                      </td>
                    ))}
                  </tr>

                  {/* 11. DÒNG TIỀN VÀO THỰC THU (Lavender/Purple - Chuẩn chỉ + hoặc -) */}
                  <tr className="bg-[#EDE9FE]/90 font-bold border-t border-b border-purple-300">
                    <td className="py-2.5 px-4 sticky left-0 z-20 bg-[#EDE9FE] border-r border-purple-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-purple-950 font-bold">
                      Dòng tiền vào thực thu
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-purple-300 bg-[#DDD6FE]/60">
                      {renderSignedAmount(totalActualInflow)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-purple-200">
                        {renderSignedAmount(m.actualInflow)}
                      </td>
                    ))}
                  </tr>

                  {/* 10. TỔNG CHI TIỀN MẶT (Light Coral/Pink) */}
                  <tr className="bg-[#FFE4E6]/90 font-bold border-t border-b border-rose-300">
                    <td className="py-2.5 px-4 sticky left-0 z-20 bg-[#FFE4E6] border-r border-rose-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-rose-950 font-bold">
                      <div className="flex items-center justify-between w-full">
                        <span>Tổng chi tiền mặt</span>
                        <button
                          onClick={() => toggleGroup('cashOutflow')}
                          className="p-1 rounded hover:bg-rose-200/70 text-rose-700 transition-colors cursor-pointer"
                          title={expandedGroups.cashOutflow ? 'Thu gọn chi tiết' : 'Xem chi tiết 6 khoản chi tiền mặt'}
                        >
                          {expandedGroups.cashOutflow ? (
                            <ChevronDown className="w-4 h-4 text-rose-800" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-rose-800" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-rose-300 bg-[#FECDD3]/60">
                      {renderSignedAmount(totalOutflow, true)}
                    </td>
                    {cashFlowMonthly.map((m) => (
                      <td key={m.month.id} className="py-2.5 px-3 text-right border-r border-rose-200">
                        {renderSignedAmount(m.totalCashOutflow, true)}
                      </td>
                    ))}
                  </tr>

                  {/* Chi tiết 6 khoản chi tiền mặt khi mở rộng */}
                  {expandedGroups.cashOutflow && (
                    <>
                      {/* 1. TIỀN ĐẶT HÀNG (PO) */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans text-slate-900 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                          <div className="font-medium">1. Tiền Đặt Hàng</div>
                          <div className="text-[10px] text-slate-500 italic font-sans font-normal">
                            (theo ngày phát hành PO)
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right border-r border-slate-200 text-slate-900 font-medium bg-slate-50/50">
                          -{formatNumberVi(totalTienDatHang)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-slate-800">
                            -{formatNumberVi(m.tienDatHang)}
                          </td>
                        ))}
                      </tr>

                      {/* 2. CHI PHÍ NHÂN SỰ */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans font-medium text-slate-900 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                          2. Chi Phí Nhân Sự
                        </td>
                        <td className="py-2 px-3 text-right border-r border-slate-200 text-slate-900 font-medium bg-slate-50/50">
                          -{formatNumberVi(totalLabor)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-slate-800">
                            -{formatNumberVi(m.laborCost)}
                          </td>
                        ))}
                      </tr>

                      {/* 3. CHI PHÍ MARKETING (Nút > đẩy xuống cuối hàng) */}
                      <tr className="bg-slate-50/80 hover:bg-slate-100/70 transition-colors font-medium text-slate-900">
                        <td className="py-2 px-4 sticky left-0 z-20 bg-slate-50 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-slate-900">3. Chi Phí Marketing</span>
                            <button
                              onClick={() => toggleGroup('marketing')}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title={expandedGroups.marketing ? 'Thu gọn chi tiết' : 'Mở rộng chi tiết'}
                            >
                              {expandedGroups.marketing ? (
                                <ChevronDown className="w-4 h-4 text-slate-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right border-r border-slate-200 font-bold text-slate-900 bg-slate-100/60">
                          -{formatNumberVi(totalMkt)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-slate-800">
                            -{formatNumberVi(m.marketingOutflowDetail.total)}
                          </td>
                        ))}
                      </tr>

                      {/* Chi tiết Chi phí Marketing */}
                      {expandedGroups.marketing && (
                        <>
                          <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                            <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                              - Chi phí Booking
                            </td>
                            <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                              -{formatNumberVi(totalBooking)}
                            </td>
                            {cashFlowMonthly.map((m) => (
                              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                                -{formatNumberVi(m.marketingOutflowDetail.creatorBookingFee)}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                            <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                              <div>- Chi phí Quảng Cáo Nội Sàn</div>
                              <div className="text-[10px] text-slate-400 italic font-sans font-normal">
                                (ghi nhận chi phí vào tháng trước đó)
                              </div>
                            </td>
                            <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                              -{formatNumberVi(totalInternalAds)}
                            </td>
                            {cashFlowMonthly.map((m) => (
                              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                                -{formatNumberVi(m.marketingOutflowDetail.internalAdsFee)}
                              </td>
                            ))}
                          </tr>
                        </>
                      )}

                      {/* 4. CHI PHÍ VẬN HÀNH (Nút > đẩy xuống cuối hàng) */}
                      <tr className="bg-slate-50/80 hover:bg-slate-100/70 transition-colors font-medium text-slate-900">
                        <td className="py-2 px-4 sticky left-0 z-20 bg-slate-50 border-r border-slate-200 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-slate-900">4. Chi Phí Vận Hành</span>
                            <button
                              onClick={() => toggleGroup('operations')}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title={expandedGroups.operations ? 'Thu gọn chi tiết' : 'Mở rộng chi tiết'}
                            >
                              {expandedGroups.operations ? (
                                <ChevronDown className="w-4 h-4 text-slate-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right border-r border-slate-200 font-bold text-slate-900 bg-slate-100/60">
                          -{formatNumberVi(totalOps)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-slate-800">
                            -{formatNumberVi(m.operationsOutflowDetail.total)}
                          </td>
                        ))}
                      </tr>

                      {/* Chi tiết Chi phí Vận hành */}
                      {expandedGroups.operations && (
                        <>
                          <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                            <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                              - Chi phí đầu tư ban đầu
                            </td>
                            <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                              -{formatNumberVi(totalCapex)}
                            </td>
                            {cashFlowMonthly.map((m) => (
                              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                                {formatNumberVi(m.operationsOutflowDetail.capexDisbursement) !== '0'
                                  ? `-${formatNumberVi(m.operationsOutflowDetail.capexDisbursement)}`
                                  : '0'}
                              </td>
                            ))}
                          </tr>

                          <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                            <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                              - Chi phí cọc kho
                            </td>
                            <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                              -{formatNumberVi(totalDeposit)}
                            </td>
                            {cashFlowMonthly.map((m) => (
                              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                                {formatNumberVi(m.operationsOutflowDetail.warehouseDeposit) !== '0'
                                  ? `-${formatNumberVi(m.operationsOutflowDetail.warehouseDeposit)}`
                                  : '0'}
                              </td>
                            ))}
                          </tr>

                          <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                            <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                              - Chi phí vận hành kho
                            </td>
                            <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                              -{formatNumberVi(totalOperating)}
                            </td>
                            {cashFlowMonthly.map((m) => (
                              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                                -{formatNumberVi(m.operationsOutflowDetail.warehouseOperating)}
                              </td>
                            ))}
                          </tr>

                          <tr className="bg-white hover:bg-slate-50/50 text-slate-600 text-[11px]">
                            <td className="py-1.5 pl-8 pr-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans">
                              <div>- Chi phí bao bì đóng gói</div>
                              <div className="text-[10px] text-slate-400 italic font-sans font-normal">
                                (ghi nhận chi phí vào tháng trước đó)
                              </div>
                            </td>
                            <td className="py-1.5 px-3 text-right border-r border-slate-200 bg-slate-50/30">
                              -{formatNumberVi(totalPackaging)}
                            </td>
                            {cashFlowMonthly.map((m) => (
                              <td key={m.month.id} className="py-1.5 px-3 text-right border-r border-slate-200">
                                -{formatNumberVi(m.operationsOutflowDetail.packagingFee)}
                              </td>
                            ))}
                          </tr>
                        </>
                      )}

                      {/* 5. THUẾ TNDN */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans font-medium text-slate-900 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                          5. Thuế TNDN
                        </td>
                        <td className="py-2 px-3 text-right border-r border-slate-200 text-slate-900 font-medium bg-slate-50/50">
                          -{formatNumberVi(totalTax)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-slate-800">
                            -{formatNumberVi(m.corporateTaxOutflow)}
                          </td>
                        ))}
                      </tr>

                      {/* 6. CHI PHÍ DỰ PHÒNG (Theo thiết lập Tab 1) */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-4 sticky left-0 z-20 bg-white border-r border-slate-200 font-sans font-medium text-slate-900 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                          6. Chi phí dự phòng
                        </td>
                        <td className="py-2 px-3 text-right border-r border-slate-200 text-slate-900 font-medium bg-slate-50/50">
                          -{formatNumberVi(totalContingency)}
                        </td>
                        {cashFlowMonthly.map((m) => (
                          <td key={m.month.id} className="py-2 px-3 text-right border-r border-slate-200 text-slate-800 font-semibold">
                            -{formatNumberVi(m.contingencyReserve)}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {/* SỐ DƯ TIỀN MẶT CUỐI KỲ (Light Green) */}
                  <tr className="bg-[#D1FAE5]/95 font-bold border-t-2 border-slate-900 text-sm">
                    <td className="py-3 px-4 sticky left-0 z-20 bg-[#D1FAE5] border-r border-emerald-300 font-sans shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-emerald-950 font-bold">
                      Số dư tiền mặt cuối kỳ
                    </td>
                    <td className="py-3 px-3 text-right border-r border-emerald-300 bg-[#A7F3D0]/80">
                      {renderSignedAmount(cashFlowSummary.finalCashBalance)}
                    </td>
                    {cashFlowMonthly.map((m, idx) => (
                      <td
                        key={m.month.id}
                        title={
                          idx === 0
                            ? `Tháng đầu: Đầu kỳ ${formatNumberVi(m.startingBalance)} - Chi ${formatNumberVi(m.totalCashOutflow)} = ${formatNumberVi(m.endingBalance)}`
                            : `Đầu kỳ: ${formatNumberVi(m.startingBalance)} + Tiền sàn về từ tháng trước: ${formatNumberVi(m.inflowReceivedFromPriorMonth)} - Tổng chi: ${formatNumberVi(m.totalCashOutflow)} = ${formatNumberVi(m.endingBalance)}`
                        }
                        className="py-3 px-3 text-right border-r border-emerald-200 font-mono font-bold"
                      >
                        {renderSignedAmount(m.endingBalance)}
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Ghi Chú Quy Chuẩn Tài Chính & Dòng Tiền */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 font-medium text-slate-800">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                <strong>Cơ chế gối đầu dòng tiền (Time-shift T-1):</strong> Chi phí Quảng Cáo Nội Sàn và Bao bì đóng gói của tháng T được chuyển về tháng T-1 để chuẩn bị dòng tiền.
              </span>
            </div>
            <div className="text-slate-500 pl-5">
              Số dư tiền mặt cuối kỳ được tính = Số dư đầu kỳ + Dòng tiền thực thu từ sàn về của tháng trước (T-1) - Tổng 6 chi phí tiền mặt của tháng hiện tại. Chi phí dự phòng lấy theo thiết lập tại Tab 1 (mặc định 0 đ/tháng).
            </div>
          </div>
          <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 shrink-0">
            D2C Cash Flow Engine Active
          </div>
        </div>
      </div>
    </div>
  );
};
