import React from 'react';
import { 
  Factory, 
  Megaphone, 
  Clock, 
  CalendarRange, 
  Flame, 
  CheckCircle2, 
  HelpCircle, 
  BadgePercent 
} from 'lucide-react';
import { SupplyChainConfig, MarketingBaselineConfig } from '../types/financial';
import { formatPercent } from '../utils/formatters';

interface LeadTimeMarketingSectionProps {
  supplyChain: SupplyChainConfig;
  marketing: MarketingBaselineConfig;
  onUpdateSupplyChain: (updated: SupplyChainConfig) => void;
  onUpdateMarketing: (updated: MarketingBaselineConfig) => void;
}

export const LeadTimeMarketingSection: React.FC<LeadTimeMarketingSectionProps> = ({
  supplyChain,
  marketing,
  onUpdateSupplyChain,
  onUpdateMarketing,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 3. THỜI GIAN SẢN XUẤT */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-xs font-bold font-mono">
                3
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Thời Gian Sản Xuất Của Nhà Cung Cấp
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Lead-time chuỗi cung ứng mỹ phẩm (R&amp;D, bao bì chai lọ, chiết rót, kiểm nghiệm vi sinh).
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded bg-amber-50 text-amber-700 font-mono border border-amber-200">
            Supply Chain PO
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-amber-600" />
              <span>7. Thời Gian Sản Xuất Sau Khi Nhận PO</span>
            </label>
            <span className="text-[11px] font-mono text-amber-700 font-medium">Lead-time</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-500/20 transition-colors mt-1">
            <input
              type="number"
              step="1"
              min="1"
              max="180"
              value={supplyChain.productionLeadTimeDays}
              onChange={(e) => onUpdateSupplyChain({ productionLeadTimeDays: Math.max(1, Number(e.target.value)) })}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-amber-700 font-mono font-semibold select-none shrink-0">
              ngày
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
          <strong className="text-slate-800">Ý nghĩa tài chính:</strong> Do chu kỳ sản xuất là {supplyChain.productionLeadTimeDays} ngày, Mosh&amp;Mode cần dự trù vốn cọc sản xuất và đặt lệnh PO trước để kịp thời hàng hóa lên kệ đúng kế hoạch kinh doanh.
        </p>
      </div>

      {/* 4. CHI PHÍ MARKETING */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center text-xs font-bold font-mono">
                4
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Chi Phí Marketing Tổng Thể Dự Án (Baseline)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ngân sách triển khai Marketing tổng thể dự án theo % GMV (<span className="text-amber-700 font-semibold">không bao gồm quảng cáo nội sàn</span>).
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-mono border border-rose-200">
            % GMV Budget
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <BadgePercent className="w-3.5 h-3.5 text-rose-600" />
              <span>8. Chi Phí Marketing Tổng Thể (Theo GMV)</span>
            </label>
            <span className="text-[11px] font-mono text-rose-700 font-medium">Marketing Dự Án / GMV</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-rose-600 focus-within:ring-1 focus-within:ring-rose-500/20 transition-colors mt-1">
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={marketing.marketingBudgetRateGmv}
              onChange={(e) => onUpdateMarketing({ marketingBudgetRateGmv: Number(e.target.value) })}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-rose-700 font-mono font-semibold select-none shrink-0">
              %
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between p-2 rounded bg-white border border-slate-200 text-xs text-slate-700">
            <span>Ngân sách chuẩn Marketing tổng thể:</span>
            <span className="font-bold text-emerald-700">{formatPercent(marketing.marketingBudgetRateGmv)} GMV</span>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1 leading-relaxed">
          <p>
            <strong className="text-slate-800">Phạm vi áp dụng &amp; Phân định ngân sách:</strong> Tỷ lệ {formatPercent(marketing.marketingBudgetRateGmv)} GMV này <span className="text-amber-800 font-semibold underline decoration-amber-500/50">không bao gồm phí quảng cáo nội sàn</span> (quảng cáo nội sàn và hoa hồng affiliate được quản lý riêng tại mục Tham Số Phí D2C).
          </p>
          <p className="text-[11px] text-slate-500">
            Đây là nguồn ngân sách dành cho các hoạt động triển khai Marketing cho tổng thể dự án: Nhận diện thương hiệu (Brand Awareness), sản xuất tài nguyên media/video, booking chuyên gia da liễu và các chiến dịch kích hoạt thương hiệu dài hạn.
          </p>
        </div>
      </div>
    </div>
  );
};
