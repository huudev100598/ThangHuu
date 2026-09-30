import React, { useState, useMemo } from 'react';
import { formatNumberVi } from '../../utils/formatters';
import { 
  TrendingUp, 
  Target, 
  HelpCircle, 
  Sliders, 
  Layers, 
  Maximize2, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Package
} from 'lucide-react';

interface BreakEvenChartProps {
  fixedCosts: number;
  variableCostRatio: number; // % (e.g. 65)
  totalRevenue: number;
  totalUnits: number;
  breakEvenRevenue: number;
  breakEvenUnits: number;
  averageSellingPrice: number;
  unitVariableCost: number;
  unitContributionMargin: number;
  marginOfSafetyRevenue: number;
  marginOfSafetyUnits: number;
  marginOfSafetyPercent: number;
}

export const BreakEvenChart: React.FC<BreakEvenChartProps> = ({
  fixedCosts,
  variableCostRatio,
  totalRevenue,
  totalUnits,
  breakEvenRevenue,
  breakEvenUnits,
  averageSellingPrice,
  unitVariableCost,
  unitContributionMargin,
  marginOfSafetyRevenue,
  marginOfSafetyUnits,
  marginOfSafetyPercent,
}) => {
  // Chế độ trục hoành: Theo Sản lượng (Units) hoặc Theo Doanh thu (VND)
  const [axisMode, setAxisMode] = useState<'units' | 'revenue'>('units');
  
  // Tỷ lệ mô phỏng sản lượng (từ 0% đến 180% kế hoạch)
  const [simulatedRatio, setSimulatedRatio] = useState<number>(100);

  // Hàm tính toán thang đo tròn số đẹp mắt cho trục đồ thị
  const getNiceUnitMax = (val: number) => {
    if (val <= 0) return 1000;
    const target = val * 1.35;
    const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
    const residual = target / magnitude;
    let niceMultiplier = 2;
    if (residual <= 1.5) niceMultiplier = 1.5;
    else if (residual <= 2) niceMultiplier = 2;
    else if (residual <= 2.5) niceMultiplier = 2.5;
    else if (residual <= 5) niceMultiplier = 5;
    else niceMultiplier = 10;
    return Math.max(1000, Math.round(niceMultiplier * magnitude));
  };

  const getNiceRevenueMax = (val: number) => {
    if (val <= 0) return 100000000;
    const target = val * 1.35;
    // Bội số 100 triệu hoặc 500 triệu hoặc 1 tỷ
    if (target < 500000000) {
      return Math.ceil(target / 50000000) * 50000000;
    } else if (target < 2000000000) {
      return Math.ceil(target / 200000000) * 200000000;
    } else {
      return Math.ceil(target / 500000000) * 500000000;
    }
  };

  // Thang đo trục hoành độc lập theo từng chế độ
  const maxUnitsRef = getNiceUnitMax(Math.max(totalUnits, breakEvenUnits));
  const maxRevenueRef = getNiceRevenueMax(Math.max(totalRevenue, breakEvenRevenue));

  // Thang đo trục tung (Chi phí & Doanh thu tính bằng VNĐ)
  const maxCostRevenueY = getNiceRevenueMax(
    axisMode === 'units'
      ? Math.max(totalRevenue, breakEvenRevenue, maxUnitsRef * averageSellingPrice, fixedCosts * 1.5)
      : Math.max(maxRevenueRef, fixedCosts + maxRevenueRef * (variableCostRatio / 100))
  );

  // Kích thước SVG
  const width = 860;
  const height = 440;
  const padding = { top: 40, right: 60, bottom: 65, left: 105 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Chuyển đổi tọa độ Y (theo số tiền VNĐ)
  const getY = (amount: number) => {
    return padding.top + innerHeight - (Math.min(Math.max(0, amount), maxCostRevenueY) / maxCostRevenueY) * innerHeight;
  };

  // Chuyển đổi tọa độ X (độc lập theo chế độ trục hoành)
  const getX = (valUnits: number, valRevenue?: number) => {
    if (axisMode === 'revenue') {
      const rev = valRevenue !== undefined ? valRevenue : valUnits * averageSellingPrice;
      return padding.left + (Math.min(Math.max(0, rev), maxRevenueRef) / maxRevenueRef) * innerWidth;
    }
    return padding.left + (Math.min(Math.max(0, valUnits), maxUnitsRef) / maxUnitsRef) * innerWidth;
  };

  // Tọa độ Điểm Hòa Vốn (BEP)
  const bepX = axisMode === 'revenue' 
    ? padding.left + (Math.min(breakEvenRevenue, maxRevenueRef) / maxRevenueRef) * innerWidth
    : padding.left + (Math.min(breakEvenUnits, maxUnitsRef) / maxUnitsRef) * innerWidth;
  const bepY = getY(breakEvenRevenue);

  // Tọa độ Điểm Kế Hoạch (Plan)
  const planX = axisMode === 'revenue'
    ? padding.left + (Math.min(totalRevenue, maxRevenueRef) / maxRevenueRef) * innerWidth
    : padding.left + (Math.min(totalUnits, maxUnitsRef) / maxUnitsRef) * innerWidth;
  const planY = getY(totalRevenue);

  // Điểm mô phỏng hiện tại
  const simUnits = Math.round((totalUnits * simulatedRatio) / 100);
  const simRevenue = Math.round((totalRevenue * simulatedRatio) / 100);
  const simVariableCosts = axisMode === 'revenue'
    ? Math.round(simRevenue * (variableCostRatio / 100))
    : Math.round(simUnits * unitVariableCost);
  const simTotalCosts = fixedCosts + simVariableCosts;
  const simProfit = simRevenue - simTotalCosts;
  const simX = axisMode === 'revenue'
    ? padding.left + (Math.min(simRevenue, maxRevenueRef) / maxRevenueRef) * innerWidth
    : padding.left + (Math.min(simUnits, maxUnitsRef) / maxUnitsRef) * innerWidth;
  const simYRev = getY(simRevenue);
  const simYCost = getY(simTotalCosts);

  // Đường Chi phí cố định (Fixed Costs): y = FC (nằm ngang)
  const fcY = getY(fixedCosts);

  // Đường Tổng chi phí (Total Costs)
  const tcEndAmount = axisMode === 'revenue'
    ? fixedCosts + maxRevenueRef * (variableCostRatio / 100)
    : fixedCosts + maxUnitsRef * unitVariableCost;
  const tcEndY = getY(tcEndAmount);

  // Đường Doanh thu (Total Revenue)
  const trEndAmount = axisMode === 'revenue' ? maxRevenueRef : maxUnitsRef * averageSellingPrice;
  const trEndY = getY(trEndAmount);

  const maxXCoord = padding.left + innerWidth;

  // Vùng Thua Lỗ (Loss Polygon): từ (0,0) -> (0, FC) -> (BEP_X, BEP_Y) -> đóng
  const lossPolygonPoints = `${padding.left},${getY(0)} ${padding.left},${fcY} ${bepX},${bepY}`;

  // Vùng Sinh Lời (Profit Polygon): từ (BEP_X, BEP_Y) -> (maxX, tcEndY) -> (maxX, trEndY) -> đóng
  const profitPolygonPoints = `${bepX},${bepY} ${maxXCoord},${tcEndY} ${maxXCoord},${trEndY}`;

  // Kích thước và Tọa độ Thẻ Điểm Hòa Vốn (BEP Badge)
  const bepBadgeW = 188;
  const bepBadgeH = 50;

  // Giữ thẻ BEP không bị tràn ra ngoài 2 mép đồ thị (trái/phải)
  let bepBadgeX = Math.max(padding.left + bepBadgeW / 2 + 10, Math.min(width - padding.right - bepBadgeW / 2 - 10, bepX));

  // Thẻ Kế Hoạch (Plan Badge) nằm tại (planX, planBadgeY)
  const planBadgeY = Math.max(padding.top + 22, planY - 32);

  // Vị trí tối ưu nhất cho Thẻ BEP: Nằm PHÍA TRÊN điểm giao nhau (bepX, bepY)
  // Vì phía trên điểm giao BEP là khoảng không gian mở hình chữ V giữa đường Total Cost và Total Revenue
  const hasRoomAbove = bepY >= padding.top + bepBadgeH + 34;
  let bepBadgeY = hasRoomAbove ? bepY - 38 : bepY + 38;

  // Tránh xung đột với Thẻ Kế Hoạch khi 2 điểm ở gần nhau theo cả 2 trục:
  if (Math.abs(planX - bepBadgeX) < 145 && Math.abs(planBadgeY - bepBadgeY) < 55) {
    bepBadgeX = Math.max(padding.left + bepBadgeW / 2 + 10, bepX - 70);
  }

  // Tọa độ thanh Đo Biên Độ An Toàn (MoS Bracket):
  // Đặt ở vị trí TOP của dải màu MoS (y = padding.top + 18), hoàn toàn cách ly khỏi điểm BEP và trục hoành!
  const mosY = padding.top + 18;
  const mosMidX = (bepX + planX) / 2;
  const isProfitable = breakEvenUnits <= totalUnits;

  // Nhãn phân vùng Vùng Thua Lỗ và Vùng Sinh Lời không đè lên đường và điểm BEP
  const lossLabelX = padding.left + Math.max(45, (bepX - padding.left) * 0.35);
  const lossLabelY = Math.min(height - padding.bottom - 20, fcY + (height - padding.bottom - fcY) * 0.5);

  const profitLabelX = Math.min(width - padding.right - 65, bepX + (maxXCoord - bepX) * 0.6);
  const profitLabelY = Math.max(padding.top + 50, (trEndY + tcEndY) / 2);

  return (
    <div id="bep-chart-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Đồ Thị Điểm Hòa Vốn CVP (Cost - Volume - Profit Chart)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mô hình trực quan hóa tương tác giữa Doanh thu, Định phí, Biến phí và Biên độ an toàn
              </p>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Toggle axis unit */}
          <div className="inline-flex rounded-xl border border-slate-300 p-1 bg-slate-100 text-xs font-semibold shadow-2xs">
            <button
              id="bep-axis-units-btn"
              type="button"
              onClick={() => setAxisMode('units')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                axisMode === 'units'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Trục: Sản Lượng (sp)</span>
            </button>
            <button
              id="bep-axis-revenue-btn"
              type="button"
              onClick={() => setAxisMode('revenue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                axisMode === 'revenue'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trục: Doanh Thu (VNĐ)</span>
            </button>
          </div>

          {/* Quick badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            marginOfSafetyPercent >= 20
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : marginOfSafetyPercent > 0
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Biên an toàn: {marginOfSafetyPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Thông tin giải thích chế độ trục hiện tại */}
      <div className={`mt-3 px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
        axisMode === 'revenue' 
          ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-900' 
          : 'bg-indigo-50/80 border border-indigo-200 text-indigo-900'
      }`}>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            {axisMode === 'revenue' ? (
              <>Đang hiển thị trục hoành theo <strong>Doanh Thu Tiêu Thụ (VNĐ)</strong>. Điểm hòa vốn: <strong>{formatNumberVi(breakEvenRevenue)} đ</strong>. Biên an toàn tiền tệ: <strong>+{formatNumberVi(marginOfSafetyRevenue)} đ</strong>.</>
            ) : (
              <>Đang hiển thị trục hoành theo <strong>Sản Lượng Tiêu Thụ (Sản Phẩm)</strong>. Điểm hòa vốn: <strong>{formatNumberVi(breakEvenUnits)} sp</strong>. Biên an toàn sản lượng: <strong>+{formatNumberVi(marginOfSafetyUnits)} sp</strong>.</>
            )}
          </span>
        </div>
        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white shadow-2xs shrink-0 ml-2">
          {axisMode === 'revenue' ? 'Chế độ Doanh Thu (VNĐ)' : 'Chế độ Sản Lượng (sp)'}
        </span>
      </div>

      {/* 4 Thẻ Thông Tin Cố Định Ở Điểm Hòa Vốn (Luôn hiển thị rõ ràng, không bị đè hay che khuất) */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: BEP */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          axisMode === 'revenue'
            ? 'bg-emerald-50/50 border-emerald-200'
            : 'bg-indigo-50/50 border-indigo-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="uppercase tracking-wider">Điểm Hòa Vốn (BEP)</span>
            <span className={`p-1 rounded-lg ${axisMode === 'revenue' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
              <Target className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className={`text-base font-extrabold mt-1 tracking-tight ${axisMode === 'revenue' ? 'text-emerald-700' : 'text-indigo-700'}`}>
            {axisMode === 'revenue' ? `${formatNumberVi(breakEvenRevenue)} đ` : `${formatNumberVi(breakEvenUnits)} sp`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{axisMode === 'revenue' ? `Q_bep: ${formatNumberVi(breakEvenUnits)} sp` : `S_bep: ${formatNumberVi(breakEvenRevenue)} đ`}</span>
            <span className="font-semibold text-slate-700">
              {totalRevenue > 0 ? `${((breakEvenRevenue / totalRevenue) * 100).toFixed(1)}% KH` : '0%'}
            </span>
          </div>
        </div>

        {/* Card 2: Kế hoạch */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="uppercase tracking-wider">Kế Hoạch Bán Hàng</span>
            <span className="p-1 rounded-lg bg-blue-50 text-blue-700">
              <Package className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-base font-extrabold text-slate-900 mt-1 tracking-tight">
            {axisMode === 'revenue' ? `${formatNumberVi(totalRevenue)} đ` : `${formatNumberVi(totalUnits)} sp`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{axisMode === 'revenue' ? `${formatNumberVi(totalUnits)} sp` : `${formatNumberVi(totalRevenue)} đ`}</span>
            <span className="text-slate-600 font-medium">Giá TB: {formatNumberVi(averageSellingPrice)} đ</span>
          </div>
        </div>

        {/* Card 3: Biên an toàn MoS */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          marginOfSafetyRevenue >= 0 ? 'bg-sky-50/50 border-sky-200' : 'bg-rose-50/50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="uppercase tracking-wider">Biên An Toàn (MoS)</span>
            <span className={`p-1 rounded-lg ${marginOfSafetyRevenue >= 0 ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className={`text-base font-extrabold mt-1 tracking-tight ${marginOfSafetyRevenue >= 0 ? 'text-sky-700' : 'text-rose-700'}`}>
            {marginOfSafetyRevenue >= 0 ? '+' : ''}{axisMode === 'revenue' ? `${formatNumberVi(marginOfSafetyRevenue)} đ` : `${formatNumberVi(marginOfSafetyUnits)} sp`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Tỷ lệ: <strong className={marginOfSafetyRevenue >= 0 ? 'text-sky-700' : 'text-rose-700'}>{marginOfSafetyPercent.toFixed(1)}%</strong></span>
            <span className="font-semibold text-slate-700">
              {marginOfSafetyPercent >= 20 ? 'An Toàn Cao' : marginOfSafetyPercent > 0 ? 'Khả Quan' : 'Chưa Hòa Vốn'}
            </span>
          </div>
        </div>

        {/* Card 4: Định phí & Lãi đảm phí */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="uppercase tracking-wider">Định Phí (FC) & CMR</span>
            <span className="p-1 rounded-lg bg-amber-50 text-amber-700">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-base font-extrabold text-slate-900 mt-1 tracking-tight">
            {formatNumberVi(fixedCosts)} đ
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>CMR: <strong className="text-amber-700">{(100 - variableCostRatio).toFixed(1)}%</strong></span>
            <span className="text-slate-600 font-mono">UCM: {formatNumberVi(unitContributionMargin)} đ</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Rendering */}
      <div className="mt-4 relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[700px] select-none"
          style={{ maxHeight: '480px' }}
        >
          <defs>
            {/* Vùng lỗ đỏ mờ */}
            <linearGradient id="lossGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0.05" />
            </linearGradient>

            {/* Vùng lãi xanh ngọc mờ */}
            <linearGradient id="profitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.22" />
            </linearGradient>

            {/* Vùng khoảng cách Margin of Safety */}
            <pattern id="mosPattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.25" />
            </pattern>
          </defs>

          {/* Lưới tọa độ ngang (Grid lines Y - Cost/Revenue VNĐ) */}
          {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
            const val = maxCostRevenueY * step;
            const y = getY(val);
            return (
              <g key={`grid-y-${idx}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-400 font-medium font-mono"
                >
                  {val >= 1000000000
                    ? `${(val / 1000000000).toFixed(1)} tỷ`
                    : `${Math.round(val / 1000000)} tr`}
                </text>
              </g>
            );
          })}

          {/* Lưới tọa độ dọc (Grid lines X - Đổi hoàn toàn theo axisMode) */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((step, idx) => {
            const valUnits = Math.round(maxUnitsRef * step);
            const valRevenue = Math.round(maxRevenueRef * step);
            const x = padding.left + step * innerWidth;
            return (
              <g key={`grid-x-${idx}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke={axisMode === 'revenue' ? '#ecfdf5' : '#f1f5f9'}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className={`text-[11px] font-medium font-mono ${
                    axisMode === 'revenue' ? 'fill-emerald-700' : 'fill-indigo-700'
                  }`}
                >
                  {axisMode === 'units'
                    ? `${formatNumberVi(valUnits)} sp`
                    : valRevenue >= 1000000000
                    ? `${(valRevenue / 1000000000).toFixed(1)} tỷ`
                    : `${Math.round(valRevenue / 1000000)} tr`}
                </text>
              </g>
            );
          })}

          {/* Vùng Thua Lỗ (Loss Zone Polygon) */}
          <polygon points={lossPolygonPoints} fill="url(#lossGradient)" />

          {/* Vùng Sinh Lời (Profit Zone Polygon) */}
          <polygon points={profitPolygonPoints} fill="url(#profitGradient)" />

          {/* Dải thể hiện Khoảng cách Biên độ an toàn (Margin of Safety Zone) */}
          {breakEvenUnits < totalUnits && (
            <rect
              x={bepX}
              y={padding.top}
              width={Math.max(0, planX - bepX)}
              height={innerHeight}
              fill="url(#mosPattern)"
            />
          )}

          {/* Trục X và Trục Y chính */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#64748b"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* 1. Đường Chi Phí Cố Định (Fixed Costs Line) - Nét đứt màu xanh slate */}
          <line
            x1={padding.left}
            y1={fcY}
            x2={width - padding.right}
            y2={fcY}
            stroke="#475569"
            strokeWidth="2.2"
            strokeDasharray="6 4"
          />
          <text
            x={width - padding.right - 8}
            y={fcY - 8}
            textAnchor="end"
            className="text-[11px] font-bold fill-slate-600 tracking-wide"
          >
            Định Phí (FC): {formatNumberVi(fixedCosts)} đ
          </text>

          {/* 2. Đường Tổng Chi Phí (Total Costs Line) - Màu cam/amber */}
          <line
            x1={padding.left}
            y1={fcY}
            x2={maxXCoord}
            y2={tcEndY}
            stroke="#f59e0b"
            strokeWidth="2.8"
          />

          {/* 3. Đường Tổng Doanh Thu (Total Revenue Line) - Màu xanh ngọc emerald */}
          <line
            x1={padding.left}
            y1={getY(0)}
            x2={maxXCoord}
            y2={trEndY}
            stroke="#10b981"
            strokeWidth="3.2"
          />

          {/* Nhãn vùng Lỗ và Lãi - Đặt ở các góc an toàn không bao giờ đè lên BEP hay trục */}
          <text
            x={lossLabelX}
            y={lossLabelY}
            className="text-[11px] font-bold fill-rose-500/80 tracking-wider select-none"
            textAnchor="middle"
          >
            VÙNG THUA LỖ
          </text>
          <text
            x={profitLabelX}
            y={profitLabelY}
            className="text-[11px] font-bold fill-emerald-600/80 tracking-wider select-none"
            textAnchor="middle"
          >
            VÙNG SINH LỜI
          </text>

          {/* Đường dóng tại Điểm Kế Hoạch Hiện Tại (Planned Point) */}
          <line
            x1={planX}
            y1={padding.top}
            x2={planX}
            y2={height - padding.bottom}
            stroke="#3b82f6"
            strokeWidth="1.8"
            strokeDasharray="4 3"
          />

          {/* Điểm Kế hoạch trên đường Doanh thu */}
          <circle cx={planX} cy={planY} r="6" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
          
          {/* Nhãn Điểm Kế Hoạch */}
          <g transform={`translate(${planX}, ${planBadgeY})`}>
            <rect
              x="-80"
              y="-12"
              width="160"
              height="26"
              rx="6"
              fill="#1e293b"
              className="drop-shadow-md"
            />
            <text x="0" y="4" textAnchor="middle" className="text-[10px] font-bold fill-white">
              {axisMode === 'revenue' 
                ? `KẾ HOẠCH: ${formatNumberVi(totalRevenue)} đ` 
                : `KẾ HOẠCH: ${formatNumberVi(totalUnits)} sp`}
            </text>
          </g>

          {/* Thanh thể hiện khoảng cách Biên độ an toàn MoS (Định vị ở đỉnh dải an toàn, cách ly hoàn toàn khỏi BEP và trục hoành) */}
          {isProfitable ? (
            <g className="select-none">
              <line
                x1={bepX}
                y1={mosY}
                x2={planX}
                y2={mosY}
                stroke="#0284c7"
                strokeWidth="1.8"
                strokeDasharray="4 2"
              />
              <line x1={bepX} y1={mosY - 6} x2={bepX} y2={mosY + 6} stroke="#0284c7" strokeWidth="1.8" />
              <line x1={planX} y1={mosY - 6} x2={planX} y2={mosY + 6} stroke="#0284c7" strokeWidth="1.8" />
              <g transform={`translate(${mosMidX}, ${mosY})`}>
                <rect
                  x="-96"
                  y="-11"
                  width="192"
                  height="22"
                  rx="11"
                  fill="#ffffff"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  className="drop-shadow-xs"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  className="text-[10px] font-extrabold fill-sky-800"
                >
                  {axisMode === 'revenue'
                    ? `Biên an toàn MoS: +${formatNumberVi(marginOfSafetyRevenue)} đ (+${marginOfSafetyPercent.toFixed(1)}%)`
                    : `Biên an toàn MoS: +${formatNumberVi(marginOfSafetyUnits)} sp (+${marginOfSafetyPercent.toFixed(1)}%)`}
                </text>
              </g>
            </g>
          ) : (
            <g className="select-none">
              <line
                x1={planX}
                y1={mosY}
                x2={bepX}
                y2={mosY}
                stroke="#e11d48"
                strokeWidth="1.8"
                strokeDasharray="4 2"
              />
              <line x1={planX} y1={mosY - 6} x2={planX} y2={mosY + 6} stroke="#e11d48" strokeWidth="1.8" />
              <line x1={bepX} y1={mosY - 6} x2={bepX} y2={mosY + 6} stroke="#e11d48" strokeWidth="1.8" />
              <g transform={`translate(${mosMidX}, ${mosY})`}>
                <rect
                  x="-96"
                  y="-11"
                  width="192"
                  height="22"
                  rx="11"
                  fill="#ffffff"
                  stroke="#fb7185"
                  strokeWidth="1.5"
                  className="drop-shadow-xs"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  className="text-[10px] font-extrabold fill-rose-700"
                >
                  {axisMode === 'revenue'
                    ? `Chưa hòa vốn: Thiếu ${formatNumberVi(Math.abs(marginOfSafetyRevenue))} đ (${marginOfSafetyPercent.toFixed(1)}%)`
                    : `Chưa hòa vốn: Thiếu ${formatNumberVi(Math.abs(marginOfSafetyUnits))} sp (${marginOfSafetyPercent.toFixed(1)}%)`}
                </text>
              </g>
            </g>
          )}

          {/* Đường gióng trục từ Điểm Hòa Vốn (BEP Drop Lines) */}
          <line
            x1={bepX}
            y1={bepY}
            x2={bepX}
            y2={height - padding.bottom}
            stroke={axisMode === 'revenue' ? '#059669' : '#4f46e5'}
            strokeWidth="1.8"
            strokeDasharray="3 3"
          />
          {axisMode === 'revenue' && (
            <line
              x1={padding.left}
              y1={bepY}
              x2={bepX}
              y2={bepY}
              stroke="#059669"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Điểm Giao Hòa Vốn (BEP Point Highlight) */}
          <circle 
            cx={bepX} 
            cy={bepY} 
            r="16" 
            fill={axisMode === 'revenue' ? '#10b981' : '#6366f1'} 
            fillOpacity="0.22" 
          />
          <circle 
            cx={bepX} 
            cy={bepY} 
            r="8" 
            fill={axisMode === 'revenue' ? '#059669' : '#4f46e5'} 
            stroke="#ffffff" 
            strokeWidth="2.5" 
          />

          {/* Đường chỉ thị mảnh kết nối Điểm BEP tới Thẻ Thông Tin */}
          <line
            x1={bepX}
            y1={hasRoomAbove ? bepY - 10 : bepY + 10}
            x2={bepBadgeX}
            y2={hasRoomAbove ? bepBadgeY + bepBadgeH / 2 : bepBadgeY - bepBadgeH / 2}
            stroke={axisMode === 'revenue' ? '#059669' : '#4f46e5'}
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <circle 
            cx={bepX} 
            cy={hasRoomAbove ? bepY - 10 : bepY + 10} 
            r="2.5" 
            fill={axisMode === 'revenue' ? '#059669' : '#4f46e5'} 
          />

          {/* Thẻ Thông Tin Điểm Hòa Vốn (Vị trí Thích Ứng Thông Minh Không Bao Giờ Bị Che) */}
          <g transform={`translate(${bepBadgeX}, ${bepBadgeY})`}>
            <rect
              x={-bepBadgeW / 2}
              y={-bepBadgeH / 2}
              width={bepBadgeW}
              height={bepBadgeH}
              rx="8"
              fill="#ffffff"
              stroke={axisMode === 'revenue' ? '#059669' : '#4f46e5'}
              strokeWidth="2"
              className="drop-shadow-lg"
            />
            <text 
              x="0" 
              y={-bepBadgeH / 2 + 15} 
              textAnchor="middle" 
              className={`text-[10px] font-extrabold tracking-wide ${
                axisMode === 'revenue' ? 'fill-emerald-800' : 'fill-indigo-800'
              }`}
            >
              {axisMode === 'revenue' ? 'DOANH THU HÒA VỐN (BEP)' : 'SẢN LƯỢNG HÒA VỐN (BEP)'}
            </text>
            <text 
              x="0" 
              y={-bepBadgeH / 2 + 30} 
              textAnchor="middle" 
              className={`text-[12px] font-extrabold font-mono ${
                axisMode === 'revenue' ? 'fill-emerald-700' : 'fill-indigo-700'
              }`}
            >
              {axisMode === 'revenue' 
                ? `${formatNumberVi(breakEvenRevenue)} đ`
                : `${formatNumberVi(breakEvenUnits)} sản phẩm`}
            </text>
            <text x="0" y={-bepBadgeH / 2 + 42} textAnchor="middle" className="text-[9px] fill-slate-500 font-medium">
              {axisMode === 'revenue' 
                ? `Công thức: S_bep = FC / CMR` 
                : `Công thức: Q_bep = FC / (P - v)`}
            </text>
          </g>

          {/* Điểm Thử Nghiệm Mô Phỏng (Simulated Point) nếu khác 100% */}
          {simulatedRatio !== 100 && (
            <g>
              <line
                x1={simX}
                y1={padding.top}
                x2={simX}
                y2={height - padding.bottom}
                stroke="#8b5cf6"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle cx={simX} cy={simYRev} r="5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {/* Tên trục */}
          <text
            x={width - padding.right}
            y={height - padding.bottom + 42}
            textAnchor="end"
            className="text-[12px] font-bold fill-slate-700"
          >
            {axisMode === 'units' ? 'Sản lượng tiêu thụ Q (Sản phẩm)' : 'Doanh thu tiêu thụ R (VNĐ)'} →
          </text>
          <text
            x={padding.left}
            y={padding.top - 16}
            textAnchor="start"
            className="text-[12px] font-bold fill-slate-600"
          >
            ↑ Giá trị Doanh thu & Chi phí (VND)
          </text>
        </svg>
      </div>

      {/* Legend (Chú giải) */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-emerald-500 rounded-full" />
            <span className="font-semibold text-slate-700">Tổng Doanh Thu (P × Q)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-amber-500 rounded-full" />
            <span className="font-semibold text-slate-700">Tổng Chi Phí (FC + VC)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-slate-600" />
            <span className="font-semibold text-slate-700">Chi Phí Cố Định (FC)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
            <span className="font-semibold text-indigo-700">Điểm Hòa Vốn (BEP)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
            <span className="font-semibold text-blue-700">Kế Hoạch Dự Phóng</span>
          </div>
        </div>

        <div className="text-slate-500 text-xs italic">
          * Đồ thị được chuẩn hóa theo phương pháp Kế toán Quản trị CVP
        </div>
      </div>

      {/* Thanh trượt mô phỏng tương tác (Interactive What-If Simulation Slider) */}
      <div className={`mt-5 p-4 rounded-xl border transition-colors ${
        axisMode === 'revenue' 
          ? 'bg-emerald-50/40 border-emerald-200/80' 
          : 'bg-indigo-50/40 border-indigo-200/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Sliders className={`w-4 h-4 ${axisMode === 'revenue' ? 'text-emerald-700' : 'text-indigo-700'}`} />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {axisMode === 'revenue' 
                ? 'Mô Phỏng Tương Tác: Thử nghiệm Mức Doanh Thu Tiêu Thụ' 
                : 'Mô Phỏng Tương Tác: Thử nghiệm Mức Sản Lượng Tiêu Thụ'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Mức thử nghiệm:</span>
            <span className={`font-bold px-2 py-0.5 rounded border ${
              axisMode === 'revenue'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-indigo-700 bg-indigo-50 border-indigo-200'
            }`}>
              {axisMode === 'revenue'
                ? `${simulatedRatio}% Kế hoạch (${formatNumberVi(simRevenue)} đ)`
                : `${simulatedRatio}% Kế hoạch (${formatNumberVi(simUnits)} sp)`}
            </span>
            {simulatedRatio !== 100 && (
              <button
                type="button"
                onClick={() => setSimulatedRatio(100)}
                className="text-xs text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
              >
                Về mức chuẩn 100%
              </button>
            )}
          </div>
        </div>

        {/* Range Slider */}
        <input
          id="bep-sim-slider"
          type="range"
          min="20"
          max="180"
          step="5"
          value={simulatedRatio}
          onChange={(e) => setSimulatedRatio(Number(e.target.value))}
          className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none ${
            axisMode === 'revenue' ? 'accent-emerald-600' : 'accent-indigo-600'
          }`}
        />
        <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-medium font-mono">
          <span>20% (Khởi động)</span>
          <span>
            {axisMode === 'revenue'
              ? `${breakEvenRevenue > 0 ? ((breakEvenRevenue / totalRevenue) * 100).toFixed(0) : 0}% (Hòa Vốn BEP)`
              : `${breakEvenUnits > 0 ? ((breakEvenUnits / totalUnits) * 100).toFixed(0) : 0}% (Hòa Vốn BEP)`}
          </span>
          <span>100% (Kế hoạch chuẩn)</span>
          <span>140% (Mở rộng)</span>
          <span>180% (Bùng nổ)</span>
        </div>

        {/* Kết quả mô phỏng tức thì */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-200/60">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">
              {axisMode === 'revenue' ? 'Doanh Thu Mô Phỏng' : 'Doanh Thu & Sản Lượng'}
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{formatNumberVi(simRevenue)} đ</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
              {axisMode === 'revenue'
                ? `${simulatedRatio}% × ${formatNumberVi(totalRevenue)} đ`
                : `${formatNumberVi(simUnits)} sp × ${formatNumberVi(averageSellingPrice)} đ`}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">Tổng Chi Phí (FC + VC)</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{formatNumberVi(simTotalCosts)} đ</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
              FC: {formatNumberVi(fixedCosts)} | VC: {formatNumberVi(simVariableCosts)}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">
              {axisMode === 'revenue' ? 'Lãi Trên Biến Phí (CMR)' : 'Lãi Gộp Đơn Vị (UCM)'}
            </div>
            <div className={`text-sm font-bold mt-0.5 ${axisMode === 'revenue' ? 'text-emerald-700' : 'text-indigo-700'}`}>
              {formatNumberVi(Math.max(0, simRevenue - simVariableCosts))} đ
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
              {axisMode === 'revenue'
                ? `Tỷ lệ CMR: ${(100 - variableCostRatio).toFixed(1)}%`
                : `Lãi gộp: ${formatNumberVi(unitContributionMargin)} đ/sp`}
            </div>
          </div>

          <div className={`p-2.5 rounded-lg border shadow-2xs ${
            simProfit >= 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="text-[11px] font-medium opacity-80">Lợi Nhuận Dự Kiến (EBT)</div>
            <div className={`text-sm font-bold mt-0.5 ${simProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {simProfit >= 0 ? `+${formatNumberVi(simProfit)} đ` : `-${formatNumberVi(Math.abs(simProfit))} đ`}
            </div>
            <div className="text-[10px] opacity-75 mt-0.5 font-medium">
              {simProfit >= 0 ? '✓ Đã vượt điểm hòa vốn' : '⚠ Đang nằm trong vùng lỗ'}
            </div>
          </div>
        </div>

        {/* 4 Thẻ chỉ số chuyên sâu bổ trợ theo chế độ trục đang chọn */}
        <div className="mt-3 pt-3 border-t border-slate-200/50">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>
              {axisMode === 'revenue' 
                ? 'Bộ Chỉ Số Phân Tích Quản Trị Theo Doanh Thu (VNĐ & Tỷ Lệ %)' 
                : 'Bộ Chỉ Số Phân Tích Quản Trị Theo Sản Lượng (sp & Chi Phí Đơn Vị)'}
            </span>
            <span className="text-[10px] font-normal text-slate-400 italic">
              Tự động cập nhật theo chế độ trục đang chọn
            </span>
          </div>

          {axisMode === 'revenue' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/70">
                <span className="text-[10px] text-slate-500 font-medium">Tỷ lệ Lãi Góp (CMR)</span>
                <div className="text-xs font-extrabold text-emerald-700 mt-0.5">
                  {(100 - variableCostRatio).toFixed(1)}%
                </div>
                <span className="text-[9px] text-slate-400">1 đ doanh thu mang lại {(100 - variableCostRatio).toFixed(1)} xu bù định phí</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200/70">
                <span className="text-[10px] text-slate-500 font-medium">Tỷ lệ Biến Phí (VCR)</span>
                <div className="text-xs font-extrabold text-amber-700 mt-0.5">
                  {variableCostRatio.toFixed(1)}%
                </div>
                <span className="text-[9px] text-slate-400">Giá vốn + Phí sàn + MKT biến đổi</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/70">
                <span className="text-[10px] text-slate-500 font-medium">Doanh Thu Hòa Vốn (BEP)</span>
                <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                  {formatNumberVi(breakEvenRevenue)} đ
                </div>
                <span className="text-[9px] text-slate-400">Đạt {((breakEvenRevenue / totalRevenue) * 100).toFixed(1)}% kế hoạch</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/70">
                <span className="text-[10px] text-slate-500 font-medium">Biên An Toàn Tiền Tệ</span>
                <div className={`text-xs font-extrabold mt-0.5 ${marginOfSafetyRevenue >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {marginOfSafetyRevenue >= 0 ? '+' : ''}{formatNumberVi(marginOfSafetyRevenue)} đ
                </div>
                <span className="text-[9px] text-slate-400">Đệm an toàn {marginOfSafetyPercent.toFixed(1)}%</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white/80 p-2 rounded-lg border border-indigo-200/70">
                <span className="text-[10px] text-slate-500 font-medium">Giá Bán Bình Quân (P)</span>
                <div className="text-xs font-extrabold text-indigo-700 mt-0.5">
                  {formatNumberVi(averageSellingPrice)} đ/sp
                </div>
                <span className="text-[9px] text-slate-400">Doanh thu / Tổng sản lượng</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium">Biến Phí Đơn Vị (v)</span>
                <div className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {formatNumberVi(unitVariableCost)} đ/sp
                </div>
                <span className="text-[9px] text-slate-400">Chi phí phát sinh trên mỗi sp</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-indigo-200/70">
                <span className="text-[10px] text-slate-500 font-medium">Lãi Gộp Đơn Vị (UCM)</span>
                <div className="text-xs font-extrabold text-indigo-700 mt-0.5">
                  {formatNumberVi(unitContributionMargin)} đ/sp
                </div>
                <span className="text-[9px] text-slate-400">UCM = Giá bán - Biến phí</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-indigo-200/70">
                <span className="text-[10px] text-slate-500 font-medium">Sản Lượng An Toàn</span>
                <div className={`text-xs font-extrabold mt-0.5 ${marginOfSafetyUnits >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                  {marginOfSafetyUnits >= 0 ? '+' : ''}{formatNumberVi(marginOfSafetyUnits)} sp
                </div>
                <span className="text-[9px] text-slate-400">Sản lượng vượt điểm hòa vốn</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
