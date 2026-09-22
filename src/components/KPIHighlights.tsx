import React from 'react';
import { 
  Coins, 
  Percent, 
  CalendarClock, 
  Factory, 
  ArrowUpRight, 
  Layers,
  ShoppingBag,
  TrendingDown
} from 'lucide-react';
import { ProjectParameters } from '../types/financial';
import { 
  formatVND, 
  formatPercent, 
  calcTotalPlatformVariableRate,
  calcTotalPlatformFixedFeePerItem 
} from '../utils/formatters';

interface KPIHighlightsProps {
  parameters: ProjectParameters;
  onUpdateStartingCash?: (amount: number) => void;
}

export const KPIHighlights: React.FC<KPIHighlightsProps> = ({ parameters, onUpdateStartingCash }) => {
  const shopeeVarRate = calcTotalPlatformVariableRate(parameters.platformFees.shopee);
  const tiktokVarRate = calcTotalPlatformVariableRate(parameters.platformFees.tikTokShop);
  const shopeeFixed = calcTotalPlatformFixedFeePerItem(parameters.platformFees.shopee);
  const tiktokFixed = calcTotalPlatformFixedFeePerItem(parameters.platformFees.tikTokShop);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Vốn Ban Đầu */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 relative overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Vốn Ban Đầu</span>
          <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Coins className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2.5">
          {onUpdateStartingCash ? (
            <div className="flex items-center rounded-lg bg-slate-50 border border-slate-300 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-500/20 transition-colors overflow-hidden">
              <input
                type="number"
                value={parameters.taxAndCapital.startingCash || ''}
                onChange={(e) => onUpdateStartingCash(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-transparent px-3 py-1.5 text-xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight focus:outline-none"
                placeholder="Nhập vốn ban đầu..."
              />
              <span className="px-2.5 py-1.5 bg-slate-100 text-xs font-mono text-emerald-700 font-semibold border-l border-slate-300 select-none">
                VNĐ
              </span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">
              {formatVND(parameters.taxAndCapital.startingCash)}
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span className="font-mono text-slate-600">
              {parameters.taxAndCapital.startingCash.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-emerald-700 font-medium">Sẵn sàng phân bổ</span>
          </p>
        </div>
      </div>

      {/* KPI 2: Phí sàn TMĐT */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 relative overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Phí sàn TMĐT</span>
          <span className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <ShoppingBag className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-amber-700 font-['Space_Grotesk']">
              {formatPercent(shopeeVarRate)}
            </span>
            <span className="text-xs text-slate-500">Shopee</span>
            <span className="text-slate-300">/</span>
            <span className="text-xl font-bold text-teal-700 font-['Space_Grotesk']">
              {formatPercent(tiktokVarRate)}
            </span>
            <span className="text-xs text-slate-500">TikTok</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Cố định: {formatVND(shopeeFixed)} / {formatVND(tiktokFixed)}</span>
            <span className="text-teal-700 font-medium">-2% TikTok</span>
          </p>
        </div>
      </div>

      {/* KPI 3: Cash Settlement */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 relative overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Chu Kỳ Quyết Toán Tiền Sàn</span>
          <span className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
            <CalendarClock className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold text-purple-900 font-['Space_Grotesk'] tracking-tight flex items-baseline gap-1.5">
            <span>{parameters.settlementCycle.ecommerceSettlementDelayDays}</span>
            <span className="text-xs font-normal text-slate-500">ngày</span>
            <span className="text-xs text-emerald-700 font-medium ml-1">
              (sau giao thành công)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span>Kênh B2B:</span>
            <span className="text-slate-700 font-medium">T+{parameters.settlementCycle.b2bSettlementDelayDays} ngày</span>
            <span>• Giao hàng 3-5 ngày</span>
          </p>
        </div>
      </div>

      {/* KPI 4: Production Lead Time */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 relative overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Lead-Time Sản Xuất (PO)</span>
          <span className="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            <Factory className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold text-amber-900 font-['Space_Grotesk'] tracking-tight flex items-baseline gap-1.5">
            <span>{parameters.supplyChain.productionLeadTimeDays}</span>
            <span className="text-xs font-normal text-slate-500">ngày xuất xưởng</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Marketing tổng thể:</span>
            <span className="text-amber-800 font-medium">{formatPercent(parameters.marketingBaseline.marketingBudgetRateGmv)} GMV (chưa gồm ads)</span>
          </p>
        </div>
      </div>
    </div>
  );
};
