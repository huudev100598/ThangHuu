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
  Info
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

  // Tính toán các thông số đồ thị CVP
  const maxUnitsRef = Math.max(totalUnits * 1.5, breakEvenUnits * 1.35, 1000);
  const maxRevenueRef = Math.max(totalRevenue * 1.5, breakEvenRevenue * 1.35, maxUnitsRef * averageSellingPrice, 10000000);

  // Kích thước SVG
  const width = 860;
  const height = 440;
  const padding = { top: 40, right: 60, bottom: 65, left: 95 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Hàm chuyển đổi tọa độ
  const getX = (units: number) => {
    return padding.left + (units / maxUnitsRef) * innerWidth;
  };

  const getY = (amount: number) => {
    return padding.top + innerHeight - (amount / maxRevenueRef) * innerHeight;
  };

  // Tọa độ các điểm chính
  const bepX = getX(breakEvenUnits);
  const bepY = getY(breakEvenRevenue);

  const planX = getX(totalUnits);
  const planY = getY(totalRevenue);

  // Điểm mô phỏng hiện tại
  const simUnits = Math.round((totalUnits * simulatedRatio) / 100);
  const simRevenue = Math.round(simUnits * averageSellingPrice);
  const simVariableCosts = Math.round(simUnits * unitVariableCost);
  const simTotalCosts = fixedCosts + simVariableCosts;
  const simProfit = simRevenue - simTotalCosts;
  const simX = getX(simUnits);
  const simYRev = getY(simRevenue);
  const simYCost = getY(simTotalCosts);

  // Đường Chi phí cố định (Fixed Costs): y = FC (nằm ngang)
  const fcY = getY(fixedCosts);

  // Đường Tổng chi phí (Total Costs): từ (0, FC) đến (maxUnitsRef, FC + VC(maxUnitsRef))
  const tcEndAmount = fixedCosts + maxUnitsRef * unitVariableCost;
  const tcEndY = getY(tcEndAmount);

  // Đường Doanh thu (Total Revenue): từ (0, 0) đến (maxUnitsRef, maxUnitsRef * P)
  const trEndAmount = maxUnitsRef * averageSellingPrice;
  const trEndY = getY(trEndAmount);

  // Vùng Thua Lỗ (Loss Polygon): từ (0,0) -> (0, FC) -> (BEP_X, BEP_Y) -> đóng
  const lossPolygonPoints = `${getX(0)},${getY(0)} ${getX(0)},${fcY} ${bepX},${bepY}`;

  // Vùng Sinh Lời (Profit Polygon): từ (BEP_X, BEP_Y) -> (maxX, tcEndY) -> (maxX, trEndY) -> đóng
  const profitPolygonPoints = `${bepX},${bepY} ${getX(maxUnitsRef)},${tcEndY} ${getX(maxUnitsRef)},${trEndY}`;

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
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
            <button
              id="bep-axis-units-btn"
              type="button"
              onClick={() => setAxisMode('units')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                axisMode === 'units'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trục: Sản Lượng (Units)
            </button>
            <button
              id="bep-axis-revenue-btn"
              type="button"
              onClick={() => setAxisMode('revenue')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                axisMode === 'revenue'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trục: Doanh Thu (VND)
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

          {/* Lưới tọa độ ngang (Grid lines) */}
          {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
            const val = maxRevenueRef * step;
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
                  className="text-[11px] fill-slate-400 font-medium"
                >
                  {val >= 1000000000
                    ? `${(val / 1000000000).toFixed(1)} tỷ`
                    : `${Math.round(val / 1000000)} tr`}
                </text>
              </g>
            );
          })}

          {/* Lưới tọa độ dọc (Grid lines X) */}
          {[0.25, 0.5, 0.75, 1].map((step, idx) => {
            const valUnits = Math.round(maxUnitsRef * step);
            const x = getX(valUnits);
            return (
              <g key={`grid-x-${idx}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className="text-[11px] fill-slate-400 font-medium"
                >
                  {axisMode === 'units'
                    ? `${formatNumberVi(valUnits)} sp`
                    : `${((valUnits / (totalUnits || 1)) * 100).toFixed(0)}% KH`}
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
            x2={getX(maxUnitsRef)}
            y2={tcEndY}
            stroke="#f59e0b"
            strokeWidth="2.8"
          />

          {/* 3. Đường Tổng Doanh Thu (Total Revenue Line) - Màu xanh ngọc emerald */}
          <line
            x1={padding.left}
            y1={getY(0)}
            x2={getX(maxUnitsRef)}
            y2={trEndY}
            stroke="#10b981"
            strokeWidth="3.2"
          />

          {/* Nhãn vùng Lỗ và Lãi */}
          <text
            x={getX(breakEvenUnits * 0.45)}
            y={getY(fixedCosts * 0.55)}
            className="text-[12px] font-bold fill-rose-600/90 tracking-wide"
            textAnchor="middle"
          >
            VÙNG THUA LỖ
          </text>
          <text
            x={getX(Math.min(maxUnitsRef * 0.85, breakEvenUnits * 1.35))}
            y={getY(breakEvenRevenue * 1.18)}
            className="text-[12px] font-bold fill-emerald-700/90 tracking-wide"
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
          <g transform={`translate(${planX}, ${Math.max(padding.top + 20, planY - 35)})`}>
            <rect
              x="-65"
              y="-12"
              width="130"
              height="28"
              rx="6"
              fill="#1e293b"
              className="drop-shadow-md"
            />
            <text x="0" y="5" textAnchor="middle" className="text-[11px] font-bold fill-white">
              KẾ HOẠCH: {formatNumberVi(totalUnits)} sp
            </text>
          </g>

          {/* Điểm Giao Hòa Vốn (BEP Point) */}
          <circle cx={bepX} cy={bepY} r="14" fill="#6366f1" fillOpacity="0.18" />
          <circle cx={bepX} cy={bepY} r="8" fill="#4f46e5" stroke="#ffffff" strokeWidth="2.5" />

          {/* Nhãn Điểm Hòa Vốn */}
          <g transform={`translate(${bepX}, ${bepY + 28})`}>
            <rect
              x="-80"
              y="-12"
              width="160"
              height="46"
              rx="8"
              fill="#ffffff"
              stroke="#6366f1"
              strokeWidth="1.5"
              className="drop-shadow-md"
            />
            <text x="0" y="4" textAnchor="middle" className="text-[11px] font-extrabold fill-indigo-700">
              ĐIỂM HÒA VỐN (BEP)
            </text>
            <text x="0" y="21" textAnchor="middle" className="text-[10px] font-medium fill-slate-600">
              {formatNumberVi(breakEvenUnits)} sp • {formatNumberVi(breakEvenRevenue)} đ
            </text>
          </g>

          {/* Thanh thể hiện khoảng cách Biên độ an toàn MoS hoặc Khoảng thâm hụt */}
          {breakEvenUnits < totalUnits ? (
            <g transform={`translate(0, ${height - padding.bottom - 16})`}>
              <line
                x1={bepX}
                y1="0"
                x2={planX}
                y2="0"
                stroke="#0284c7"
                strokeWidth="2.5"
                markerEnd="url(#arrow)"
              />
              <circle cx={bepX} cy="0" r="3" fill="#0284c7" />
              <circle cx={planX} cy="0" r="3" fill="#0284c7" />
              <text
                x={(bepX + planX) / 2}
                y="-6"
                textAnchor="middle"
                className="text-[10px] font-bold fill-sky-800"
              >
                Biên an toàn MoS: +{formatNumberVi(marginOfSafetyUnits)} sp (+{marginOfSafetyPercent.toFixed(1)}%)
              </text>
            </g>
          ) : (
            <g transform={`translate(0, ${height - padding.bottom - 16})`}>
              <line
                x1={planX}
                y1="0"
                x2={bepX}
                y2="0"
                stroke="#e11d48"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                markerEnd="url(#arrow)"
              />
              <circle cx={planX} cy="0" r="3" fill="#e11d48" />
              <circle cx={bepX} cy="0" r="3" fill="#e11d48" />
              <text
                x={(bepX + planX) / 2}
                y="-6"
                textAnchor="middle"
                className="text-[10px] font-bold fill-rose-700"
              >
                Chưa hòa vốn: Thiếu {formatNumberVi(Math.abs(marginOfSafetyUnits))} sp ({marginOfSafetyPercent.toFixed(1)}%)
              </text>
            </g>
          )}

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
            className="text-[12px] font-bold fill-slate-600"
          >
            {axisMode === 'units' ? 'Sản lượng tiêu thụ (Sản phẩm)' : 'Doanh số dự phóng (VND)'} →
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
      <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Mô Phỏng Tương Tác: Thử nghiệm Mức Sản Lượng Tiêu Thụ
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Mức sản lượng:</span>
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {simulatedRatio}% Kế hoạch ({formatNumberVi(simUnits)} sp)
            </span>
            {simulatedRatio !== 100 && (
              <button
                type="button"
                onClick={() => setSimulatedRatio(100)}
                className="text-xs text-slate-500 hover:text-slate-800 underline ml-1"
              >
                Đặt lại 100%
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
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
        />
        <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
          <span>20% (Khởi động)</span>
          <span>{breakEvenUnits > 0 ? `${((breakEvenUnits / totalUnits) * 100).toFixed(0)}% (BEP)` : 'BEP'}</span>
          <span>100% (Kế hoạch chuẩn)</span>
          <span>140% (Mở rộng)</span>
          <span>180% (Bùng nổ)</span>
        </div>

        {/* Kết quả mô phỏng tức thì */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-200/60">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Doanh Thu Tại Mức Này</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{formatNumberVi(simRevenue)} đ</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{formatNumberVi(simUnits)} sp × {formatNumberVi(averageSellingPrice)} đ</div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Tổng Chi Phí (FC + VC)</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{formatNumberVi(simTotalCosts)} đ</div>
            <div className="text-[10px] text-slate-400 mt-0.5">FC: {formatNumberVi(fixedCosts)} | VC: {formatNumberVi(simVariableCosts)}</div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Số Dư Đảm Phí (CM)</div>
            <div className="text-sm font-bold text-indigo-600 mt-0.5">
              {formatNumberVi(Math.max(0, simRevenue - simVariableCosts))} đ
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Đơn vị: {formatNumberVi(unitContributionMargin)} đ/sp</div>
          </div>

          <div className={`p-2.5 rounded-lg border ${
            simProfit >= 0
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}>
            <div className="text-[11px] font-medium opacity-80">Lợi Nhuận Dự Kiến (EBT)</div>
            <div className={`text-sm font-bold mt-0.5 ${simProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {simProfit >= 0 ? `+${formatNumberVi(simProfit)} đ` : `-${formatNumberVi(Math.abs(simProfit))} đ`}
            </div>
            <div className="text-[10px] opacity-75 mt-0.5">
              {simProfit >= 0 ? '✓ Đã vượt điểm hòa vốn' : '⚠ Đang nằm trong vùng lỗ'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
