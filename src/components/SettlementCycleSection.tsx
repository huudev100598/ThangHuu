import React from 'react';
import { 
  Calendar, 
  Store, 
  ArrowRight, 
  Clock, 
  CheckCircle,
  Truck,
  Wallet,
  Coins
} from 'lucide-react';
import { SettlementCycleConfig } from '../types/financial';

interface SettlementCycleSectionProps {
  config: SettlementCycleConfig;
  onChange: (updated: SettlementCycleConfig) => void;
}

export const SettlementCycleSection: React.FC<SettlementCycleSectionProps> = ({
  config,
  onChange,
}) => {
  const updateField = <K extends keyof SettlementCycleConfig>(
    field: K,
    value: SettlementCycleConfig[K]
  ) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center text-xs font-bold font-mono">
              2
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Chu Kỳ Thanh Toán &amp; Quyết Toán Tiền Sàn
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thời gian giao hàng và chu kỳ quyết toán dòng tiền từ các sàn E-commerce (Shopee, TikTok Shop) và đối tác B2B.
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded bg-purple-50 text-purple-700 font-mono border border-purple-200">
          Cash Conversion Cycle (CCC)
        </span>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TMĐT Settlement Delay */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>5. Thời Gian Quyết Toán Sàn TMĐT</span>
            </label>
            <span className="text-[11px] font-mono text-purple-700 font-medium">Shopee / TikTok Shop</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-500/20 transition-colors mt-1">
            <input
              type="number"
              step="1"
              min="1"
              max="60"
              value={config.ecommerceSettlementDelayDays}
              onChange={(e) => updateField('ecommerceSettlementDelayDays', Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-purple-700 font-mono font-semibold select-none shrink-0">
              ngày
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            Các đơn hàng sẽ được quyết toán sau <strong className="text-purple-700 font-semibold">{config.ecommerceSettlementDelayDays} ngày</strong> sau khi giao hàng thành công.
          </p>
        </div>

        {/* B2B Settlement Delay */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-teal-600" />
              <span>6. Độ Trễ Đối Soát Kênh B2B</span>
            </label>
            <span className="text-[11px] font-mono text-teal-700 font-medium">Đại lý / Ký gửi</span>
          </div>
          <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-teal-600 focus-within:ring-1 focus-within:ring-teal-500/20 transition-colors mt-1">
            <input
              type="number"
              step="1"
              min="0"
              max="120"
              value={config.b2bSettlementDelayDays}
              onChange={(e) => updateField('b2bSettlementDelayDays', Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none"
            />
            <span className="px-3 py-2 bg-slate-100 border-l border-slate-300 text-xs text-teal-700 font-mono font-semibold select-none shrink-0">
              ngày
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            Thời hạn công nợ áp dụng cho đối tác B2B (Chuỗi nhà thuốc, spa, đại lý phân phối).
          </p>
        </div>
      </div>

      {/* Visual Timeline Diagram */}
      <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-600" />
            Sơ Đồ Dòng Chảy Tiền Mặt E-Commerce Mosh&amp;Mode (Cash Timeline)
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Tổng chu kỳ luân chuyển vốn: ~{config.ecommerceSettlementDelayDays + 4} ngày từ khi phát sinh đơn
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1">
          {/* Step 1 */}
          <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  BƯỚC 1 • NGÀY 0
                </span>
                <Coins className="w-4 h-4 text-slate-400" />
              </div>
              <div className="font-semibold text-slate-900 mt-2 text-sm">Phát sinh đơn hàng</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Khách đặt hàng sản phẩm Underarm Care của Mosh&amp;Mode trên Shopee hoặc TikTok Shop.
              </p>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2">
              Đóng gói và bàn giao cho ĐVVC
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-lg bg-purple-50/50 border border-purple-200 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                  BƯỚC 2 • NGÀY 3 - 5
                </span>
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="font-semibold text-purple-900 mt-2 text-sm">Giao hàng thành công</div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Thời gian giao hàng từ <strong>3 - 5 ngày</strong>, tuỳ khu vực nhận hàng của người mua trên toàn quốc.
              </p>
            </div>
            <div className="text-[10px] text-purple-700 font-medium border-t border-purple-100 pt-2">
              Kích hoạt mốc tính 14 ngày quyết toán
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  BƯỚC 3 • SAU {config.ecommerceSettlementDelayDays} NGÀY
                </span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-semibold text-emerald-900 mt-2 text-sm">Quyết toán tiền đơn hàng</div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Các đơn hàng sẽ được <strong>quyết toán sau {config.ecommerceSettlementDelayDays} ngày</strong> sau khi giao hàng thành công. Sàn hoàn tất kiểm tra và giải ngân vào ví.
              </p>
            </div>
            <div className="text-[10px] text-emerald-700 font-medium border-t border-emerald-100 pt-2">
              100% doanh thu thực nhận khả dụng
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-200 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  BƯỚC 4 • TỔNG ~17-19 NGÀY
                </span>
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              <div className="font-semibold text-blue-900 mt-2 text-sm">Rút tiền về tài khoản</div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Doanh nghiệp rút tiền mặt về tài khoản ngân hàng để tái đầu tư nhập hàng đợt mới, chi trả marketing và vận hành.
              </p>
            </div>
            <div className="text-[10px] text-blue-700 font-medium border-t border-blue-100 pt-2">
              Hoàn tất một vòng quay tiền mặt
            </div>
          </div>
        </div>
      </div>

      {/* Summary Note */}
      <div className="p-3.5 rounded-lg bg-purple-50/80 border border-purple-200 flex items-start space-x-3 text-xs text-slate-700">
        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
          <Clock className="w-3 h-3" />
        </div>
        <div>
          <span className="font-semibold text-purple-900">Quy chuẩn Dòng tiền E-Commerce: </span>
          <span>
            Thời gian giao hàng từ <strong>3 - 5 ngày</strong> (tuỳ khu vực nhận hàng). Các đơn hàng sẽ được <strong>quyết toán sau 14 ngày sau khi giao hàng thành công</strong>. Do đó, doanh nghiệp cần duy trì quỹ Vốn Ban Đầu làm đệm thanh khoản trong khoảng <strong>17 - 19 ngày</strong> của mỗi chu kỳ bán hàng.
          </span>
        </div>
      </div>
    </div>
  );
};
