import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  ShieldCheck, 
  Flame, 
  Sliders, 
  ArrowRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { ProjectParameters } from '../types/financial';
import { 
  formatVND, 
  formatPercent, 
  calcTotalPlatformVariableRate, 
  calcTotalPlatformFixedFeePerItem 
} from '../utils/formatters';

interface CFOSimulatorWidgetProps {
  parameters: ProjectParameters;
}

export const CFOSimulatorWidget: React.FC<CFOSimulatorWidgetProps> = ({ parameters }) => {
  const [projectedMonthlyGmv, setProjectedMonthlyGmv] = useState<number>(200000000); // 200 Triệu GMV / tháng
  const [shopeeSharePercent, setShopeeSharePercent] = useState<number>(60); // 60% Shopee, 40% TikTok Shop
  const [averageOrderValue, setAverageOrderValue] = useState<number>(220000); // AOV: 220.000 đ

  const tiktokSharePercent = 100 - shopeeSharePercent;
  const estimatedTotalOrders = Math.round(projectedMonthlyGmv / averageOrderValue);

  // Shopee breakdown
  const shopeeGmv = (projectedMonthlyGmv * shopeeSharePercent) / 100;
  const shopeeOrders = Math.round((estimatedTotalOrders * shopeeSharePercent) / 100);
  const shopeeVarRate = calcTotalPlatformVariableRate(parameters.platformFees.shopee) / 100;
  const shopeeVarFee = shopeeGmv * shopeeVarRate;
  const shopeeFixedFee = shopeeOrders * calcTotalPlatformFixedFeePerItem(parameters.platformFees.shopee);
  const totalShopeeFees = shopeeVarFee + shopeeFixedFee;

  // TikTok breakdown
  const tiktokGmv = (projectedMonthlyGmv * tiktokSharePercent) / 100;
  const tiktokOrders = estimatedTotalOrders - shopeeOrders;
  const tiktokVarRate = calcTotalPlatformVariableRate(parameters.platformFees.tikTokShop) / 100;
  const tiktokVarFee = tiktokGmv * tiktokVarRate;
  const tiktokFixedFee = tiktokOrders * calcTotalPlatformFixedFeePerItem(parameters.platformFees.tikTokShop);
  const totalTikTokFees = tiktokVarFee + tiktokFixedFee;

  // Aggregate
  const totalPlatformFees = totalShopeeFees + totalTikTokFees;
  const netPlatformRevenue = projectedMonthlyGmv - totalPlatformFees;
  const effectiveTakeRate = (totalPlatformFees / projectedMonthlyGmv) * 100;

  // Marketing baseline spend (5% GMV)
  const marketingSpend = (projectedMonthlyGmv * parameters.marketingBaseline.marketingBudgetRateGmv) / 100;

  // Working Capital Pressure assessment
  const startingCash = parameters.taxAndCapital.startingCash;
  const workingCapitalNeedInCycle = marketingSpend + (projectedMonthlyGmv * 0.35); // 35% estimated COGS/fulfillment deposit during 18 days cycle
  const cashBufferRatio = startingCash > 0 ? (startingCash / workingCapitalNeedInCycle) : 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 font-['Space_Grotesk']">
              Bàn Thử Nghiệm Nhạy Cảm CFO (Quick Stress-Test Engine)
            </h3>
            <p className="text-xs text-slate-500">
              Mô phỏng doanh thu thực nhận, phí sàn TMĐT và cân đối Vốn Ban Đầu khi thay đổi quy mô bán hàng.
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
          Động lực học Dòng tiền
        </span>
      </div>

      {/* Simulator Interactive Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Slider 1: Monthly Target GMV */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Doanh số mục tiêu (GMV/Tháng):</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              {formatVND(projectedMonthlyGmv)}
            </span>
          </div>
          <input
            type="range"
            min="30000000"
            max="1000000000"
            step="10000000"
            value={projectedMonthlyGmv}
            onChange={(e) => setProjectedMonthlyGmv(Number(e.target.value))}
            className="w-full mt-2.5 accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>30 Triệu</span>
            <span>1 Tỷ VND</span>
          </div>
        </div>

        {/* Slider 2: Channel Split */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Tỷ trọng kênh bán:</span>
            <span className="font-mono font-bold text-slate-900 text-xs">
              <span className="text-amber-800">{shopeeSharePercent}% Shopee</span> / <span className="text-teal-800">{tiktokSharePercent}% TikTok</span>
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={shopeeSharePercent}
            onChange={(e) => setShopeeSharePercent(Number(e.target.value))}
            className="w-full mt-2.5 accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>Nghiêng TikTok</span>
            <span>Nghiêng Shopee</span>
          </div>
        </div>

        {/* Input 3: Average Order Value (AOV) */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Giá trị đơn trung bình (AOV):</span>
            <span className="font-mono font-bold text-blue-700 text-sm">
              {formatVND(averageOrderValue)}
            </span>
          </div>
          <input
            type="range"
            min="100000"
            max="600000"
            step="10000"
            value={averageOrderValue}
            onChange={(e) => setAverageOrderValue(Number(e.target.value))}
            className="w-full mt-2.5 accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>Đơn lẻ (100k)</span>
            <span>Combo Full (600k)</span>
          </div>
        </div>
      </div>

      {/* Result Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Net Revenue */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-medium">Doanh Thu Ròng Thực Về</span>
          <div className="mt-1">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {formatVND(netPlatformRevenue)}
            </span>
            <span className="block text-[11px] text-emerald-700 font-medium mt-0.5">
              {(100 - effectiveTakeRate).toFixed(1)}% GMV thu hồi
            </span>
          </div>
        </div>

        {/* Platform Fees Cut */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-medium">Phí Sàn TMĐT Bị Khấu Trừ</span>
          <div className="mt-1">
            <span className="text-xl font-bold text-rose-700 font-mono">
              {formatVND(totalPlatformFees)}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Take-rate bình quân: <strong className="text-rose-700">{effectiveTakeRate.toFixed(2)}%</strong>
            </span>
          </div>
        </div>

        {/* Settlement Cycle Time */}
        <div className="p-3.5 rounded-lg bg-purple-50/70 border border-purple-200 shadow-2xs flex flex-col justify-between">
          <span className="text-xs text-purple-800 font-semibold">Chu Kỳ Quyết Toán Tiền Sàn</span>
          <div className="mt-1">
            <span className="text-xl font-bold text-purple-900 font-mono">
              14 ngày
            </span>
            <span className="block text-[11px] text-purple-700 mt-0.5">
              Sau khi giao hàng thành công (Giao 3-5 ngày)
            </span>
          </div>
        </div>

        {/* Marketing baseline spend */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-medium">Marketing Tổng Thể ({parameters.marketingBaseline.marketingBudgetRateGmv}% GMV)</span>
          <div className="mt-1">
            <span className="text-xl font-bold text-amber-800 font-mono">
              {formatVND(marketingSpend)}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Marketing dự án (chưa gồm ads nội sàn)
            </span>
          </div>
        </div>
      </div>

      {/* CFO Runway & Liquidity Assessment */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        cashBufferRatio >= 1.5 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
          : cashBufferRatio >= 1.0 
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}>
        <div className="flex items-start space-x-3">
          {cashBufferRatio >= 1.5 ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <div className="font-bold text-slate-900 text-sm">
              Đánh giá An Toàn Thanh Khoản: {cashBufferRatio >= 1.5 ? 'AN TOÀN CAO' : cashBufferRatio >= 1.0 ? 'CẢNH BÁO CÂN BẰNG' : 'NGUY CƠ THIẾU HỤT TIỀN MẶT'}
            </div>
            <p className="text-slate-700 mt-1 leading-relaxed">
              Vốn Ban Đầu: <strong className="text-slate-900 font-semibold">{formatVND(startingCash)}</strong>. Nhu cầu vốn gối đầu xoay vòng trong chu kỳ giao hàng &amp; 14 ngày quyết toán ước tính <strong className="text-slate-900 font-semibold">{formatVND(workingCapitalNeedInCycle)}</strong> (gồm Marketing + Chi phí đơn hàng).
              Hệ số bảo đảm vốn đệm: <strong className="font-mono font-bold text-slate-900">{cashBufferRatio.toFixed(2)}x</strong>.
            </p>
          </div>
        </div>

        <div className="text-right text-xs shrink-0 self-end sm:self-center">
          <span className="text-[11px] text-slate-500 block font-medium">Quy mô đơn hàng:</span>
          <span className="font-mono font-bold text-slate-900 text-sm">~{formatVND(estimatedTotalOrders).replace(' đ', '')} đơn/tháng</span>
        </div>
      </div>
    </div>
  );
};

