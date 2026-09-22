import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Layers, 
  ArrowRightLeft, 
  Check, 
  Percent, 
  Coins, 
  Calculator, 
  HelpCircle,
  TrendingDown,
  Sparkles,
  Equal
} from 'lucide-react';
import { PlatformFeesConfig, PlatformFeeDetail } from '../types/financial';
import { 
  formatVND, 
  formatPercent, 
  calcTotalPlatformVariableRate, 
  calcTotalPlatformFixedFeePerItem,
  estimatePlatformNetPayout
} from '../utils/formatters';

interface PlatformFeesSectionProps {
  platformFees: PlatformFeesConfig;
  onChange: (updated: PlatformFeesConfig) => void;
}

export const PlatformFeesSection: React.FC<PlatformFeesSectionProps> = ({
  platformFees,
  onChange,
}) => {
  const [testProductPrice, setTestProductPrice] = useState<number>(189000); // 189k: Giá mẫu Serum sáng da nách Mosh&Mode

  const updateShopee = <K extends keyof PlatformFeeDetail>(key: K, val: PlatformFeeDetail[K]) => {
    onChange({
      ...platformFees,
      shopee: {
        ...platformFees.shopee,
        [key]: val,
      },
    });
  };

  const updateTikTok = <K extends keyof PlatformFeeDetail>(key: K, val: PlatformFeeDetail[K]) => {
    onChange({
      ...platformFees,
      tikTokShop: {
        ...platformFees.tikTokShop,
        [key]: val,
      },
    });
  };

  const shopeeVarRate = calcTotalPlatformVariableRate(platformFees.shopee);
  const tikTokVarRate = calcTotalPlatformVariableRate(platformFees.tikTokShop);
  const shopeeFixed = calcTotalPlatformFixedFeePerItem(platformFees.shopee);
  const tikTokFixed = calcTotalPlatformFixedFeePerItem(platformFees.tikTokShop);

  const shopeeSim = estimatePlatformNetPayout(testProductPrice, platformFees.shopee);
  const tikTokSim = estimatePlatformNetPayout(testProductPrice, platformFees.tikTokShop);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold font-mono">
              6
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Tham Số Chung Cho Phí Sàn TMĐT (Shopee vs TikTok Shop)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bảng ma trận bóc tách chi tiết toàn bộ các tầng chiết khấu và phí xử lý của 2 nền tảng bán hàng chủ lực.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
            Shopee: {formatPercent(shopeeVarRate)} + {formatVND(shopeeFixed)}
          </span>
          <span className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 font-semibold border border-teal-200">
            TikTok: {formatPercent(tikTokVarRate)} + {formatVND(tikTokFixed)}
          </span>
        </div>
      </div>

      {/* Main Comparative Matrix Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 uppercase font-mono text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold">STT &amp; Hạng Mục Chi Phí Sàn</th>
              <th className="py-3 px-4 font-semibold text-center w-28">Đơn Vị</th>
              <th className="py-3 px-4 font-semibold text-right text-amber-800 w-44">
                Sàn Shopee
              </th>
              <th className="py-3 px-4 font-semibold text-right text-teal-800 w-44">
                Sàn TikTok Shop
              </th>
              <th className="py-3 px-4 font-semibold text-right text-slate-500 w-36">
                Chênh Lệch
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            
            {/* Nhóm 1: Tỷ lệ theo Doanh Thu */}
            <tr className="bg-slate-50/70">
              <td colSpan={5} className="py-2 px-4 font-bold text-slate-700 text-[11px] uppercase tracking-wider font-mono bg-slate-100/60">
                A. Các Khoản Phí Tính Theo Tỷ Lệ Doanh Thu (% GMV)
              </td>
            </tr>

            {/* 1. Phí thanh toán */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-2.5 px-4 font-medium text-slate-900">
                1. Phí thanh toán (Payment Fee)
                <span className="block text-[11px] text-slate-500">Phí cổng thanh toán trực tuyến &amp; COD</span>
              </td>
              <td className="py-2.5 px-4 text-center text-slate-500 font-mono">% DT</td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformFees.shopee.paymentFeeRate}
                    onChange={(e) => updateShopee('paymentFeeRate', Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformFees.tikTokShop.paymentFeeRate}
                    onChange={(e) => updateTikTok('paymentFeeRate', Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                <span>Bằng nhau</span>
              </td>
            </tr>

            {/* 2. Phí hoa hồng nền tảng */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-2.5 px-4 font-medium text-slate-900">
                2. Phí hoa hồng nền tảng (Platform Commission)
                <span className="block text-[11px] text-slate-500">Hoa hồng chiết khấu tiêu chuẩn của sàn</span>
              </td>
              <td className="py-2.5 px-4 text-center text-slate-500 font-mono">% DT</td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformFees.shopee.platformCommissionRate}
                    onChange={(e) => updateShopee('platformCommissionRate', Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformFees.tikTokShop.platformCommissionRate}
                    onChange={(e) => updateTikTok('platformCommissionRate', Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-teal-700 font-semibold">
                TikTok rẻ hơn 1.5%
              </td>
            </tr>

            {/* 3. Phí Voucher Xtra */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-2.5 px-4 font-medium text-slate-900">
                3. Phí Voucher Xtra / Trợ giá vận chuyển
                <span className="block text-[11px] text-slate-500">Gói hỗ trợ mã giảm giá và FreeShip Xtra</span>
              </td>
              <td className="py-2.5 px-4 text-center text-slate-500 font-mono">% DT</td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformFees.shopee.voucherXtraRate}
                    onChange={(e) => updateShopee('voucherXtraRate', Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformFees.tikTokShop.voucherXtraRate}
                    onChange={(e) => updateTikTok('voucherXtraRate', Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-teal-700 font-semibold">
                TikTok rẻ hơn 0.5%
              </td>
            </tr>

            {/* 4. Phí đóng gói, kho bãi */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-2.5 px-4 font-medium text-slate-900">
                4. Phí đóng gói, kho bãi (Fulfillment)
                <span className="block text-[11px] text-slate-500">Vật tư đóng gói (hộp carton, màng xốp bóng khí) &amp; lưu kho</span>
              </td>
              <td className="py-2.5 px-4 text-center text-slate-500 font-mono">% DT</td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformFees.shopee.packagingAndWarehousingRate}
                    onChange={(e) => updateShopee('packagingAndWarehousingRate', Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformFees.tikTokShop.packagingAndWarehousingRate}
                    onChange={(e) => updateTikTok('packagingAndWarehousingRate', Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                <span>Bằng nhau</span>
              </td>
            </tr>

            {/* 5. Phí hao hụt */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-2.5 px-4 font-medium text-slate-900">
                5. Phí hao hụt &amp; thất thoát hàng hóa
                <span className="block text-[11px] text-slate-500">Hàng móp méo, vỡ chai lọ trong vận chuyển</span>
              </td>
              <td className="py-2.5 px-4 text-center text-slate-500 font-mono">% DT</td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformFees.shopee.shrinkageRate}
                    onChange={(e) => updateShopee('shrinkageRate', Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformFees.tikTokShop.shrinkageRate}
                    onChange={(e) => updateTikTok('shrinkageRate', Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                <span>Bằng nhau</span>
              </td>
            </tr>

            {/* Subtotal Tỷ Lệ Biến Đổi */}
            <tr className="bg-slate-100/80 font-bold border-t border-b border-slate-200 text-slate-900">
              <td className="py-3 px-4 text-emerald-800">
                TỔNG TỶ LỆ PHÍ BIẾN ĐỔI THEO DOANH THU (A)
              </td>
              <td className="py-3 px-4 text-center font-mono text-emerald-700">% GMV</td>
              <td className="py-3 px-4 text-right font-mono text-amber-800 text-sm">
                {formatPercent(shopeeVarRate)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-teal-800 text-sm">
                {formatPercent(tikTokVarRate)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                TikTok -2.00%
              </td>
            </tr>

            {/* Nhóm 2: Phí Cố Định theo Sản Phẩm */}
            <tr className="bg-slate-50/70">
              <td colSpan={5} className="py-2 px-4 font-bold text-slate-700 text-[11px] uppercase tracking-wider font-mono bg-slate-100/60">
                B. Các Khoản Phí Cố Định Tính Theo Sản Phẩm (VND / SP)
              </td>
            </tr>

            {/* 6. Phí xử lý đơn hàng */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-2.5 px-4 font-medium text-slate-900">
                6. Phí xử lý đơn hàng (Order Handling)
                <span className="block text-[11px] text-slate-500">Phí in tem nhãn, phân loại, bốc xếp kiện hàng</span>
              </td>
              <td className="py-2.5 px-4 text-center text-slate-500 font-mono">đ / sp</td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="500"
                    value={platformFees.shopee.orderHandlingFeePerItem}
                    onChange={(e) => updateShopee('orderHandlingFeePerItem', Number(e.target.value))}
                    className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                  <span className="text-slate-500 font-mono">đ</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="500"
                    value={platformFees.tikTokShop.orderHandlingFeePerItem}
                    onChange={(e) => updateTikTok('orderHandlingFeePerItem', Number(e.target.value))}
                    className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                  <span className="text-slate-500 font-mono">đ</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                <span>Bằng nhau</span>
              </td>
            </tr>

            {/* 7. Phí bồi hoàn */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-2.5 px-4 font-medium text-slate-900">
                7. Phí bồi hoàn &amp; xử lý hoàn trả (Compensation Fee)
                <span className="block text-[11px] text-slate-500">Chi phí xử lý đơn giao không thành công hoặc khách trả lại</span>
              </td>
              <td className="py-2.5 px-4 text-center text-slate-500 font-mono">đ / sp</td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="100"
                    value={platformFees.shopee.compensationFeePerItem}
                    onChange={(e) => updateShopee('compensationFeePerItem', Number(e.target.value))}
                    className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                  <span className="text-slate-500 font-mono">đ</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <input
                    type="number"
                    step="100"
                    value={platformFees.tikTokShop.compensationFeePerItem}
                    onChange={(e) => updateTikTok('compensationFeePerItem', Number(e.target.value))}
                    className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                  <span className="text-slate-500 font-mono">đ</span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-teal-700 font-semibold">
                TikTok rẻ hơn 692 đ
              </td>
            </tr>

            {/* Subtotal Phí Cố Định */}
            <tr className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
              <td className="py-3 px-4 text-emerald-800">
                TỔNG PHÍ CỐ ĐỊNH TRÊN MỖI SẢN PHẨM (B)
              </td>
              <td className="py-3 px-4 text-center font-mono text-emerald-700">đ / sp</td>
              <td className="py-3 px-4 text-right font-mono text-amber-800 text-sm">
                {formatVND(shopeeFixed)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-teal-800 text-sm">
                {formatVND(tikTokFixed)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                TikTok -692 đ/sp
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* Live Unit Economics Payout Simulator */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-900 uppercase font-mono">
              Mô Phỏng Unit Economics: Tiền Thực Nhận Cho 1 Sản Phẩm Chăm Sóc Nách Mosh&amp;Mode
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-600">Giá bán lẻ (Retail Price):</span>
            <div className="flex items-center">
              <input
                type="number"
                step="10000"
                value={testProductPrice}
                onChange={(e) => setTestProductPrice(Math.max(10000, Number(e.target.value)))}
                className="w-32 bg-white border border-slate-300 rounded px-2.5 py-1 text-right font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20"
              />
              <span className="ml-1.5 font-mono text-slate-500 font-semibold">VND</span>
            </div>
          </div>
        </div>

        {/* Comparison Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Shopee Payout */}
          <div className="p-4 rounded-lg bg-white border border-amber-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-800 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                Shopee (Chiết khấu {formatPercent(shopeeSim.takeRatePercent)})
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Tổng phí trừ: {formatVND(shopeeSim.totalFeeAmount)}
              </span>
            </div>
            
            <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
              <span className="text-xs text-slate-500">Số tiền thực nhận về ví:</span>
              <span className="text-xl font-bold text-slate-900 font-mono">
                {formatVND(shopeeSim.netPayout)}
              </span>
            </div>
            
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
              <div className="flex justify-between">
                <span>• Phí biến đổi ({formatPercent(shopeeVarRate)}):</span>
                <span className="font-mono text-slate-700">-{formatVND(shopeeSim.variableAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Phí cố định (Xử lý + Bồi hoàn):</span>
                <span className="font-mono text-slate-700">-{formatVND(shopeeSim.fixedAmount)}</span>
              </div>
            </div>
          </div>

          {/* TikTok Payout */}
          <div className="p-4 rounded-lg bg-white border border-teal-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-800 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                TikTok Shop (Chiết khấu {formatPercent(tikTokSim.takeRatePercent)})
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Tổng phí trừ: {formatVND(tikTokSim.totalFeeAmount)}
              </span>
            </div>
            
            <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
              <span className="text-xs text-slate-500">Số tiền thực nhận về ví:</span>
              <span className="text-xl font-bold text-teal-800 font-mono">
                {formatVND(tikTokSim.netPayout)}
              </span>
            </div>
            
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
              <div className="flex justify-between">
                <span>• Phí biến đổi ({formatPercent(tikTokVarRate)}):</span>
                <span className="font-mono text-slate-700">-{formatVND(tikTokSim.variableAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Phí cố định (Xử lý + Bồi hoàn):</span>
                <span className="font-mono text-slate-700">-{formatVND(tikTokSim.fixedAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CFO Delta callout */}
        <div className="text-xs text-slate-700 bg-teal-50/80 p-2.5 rounded-lg border border-teal-200 flex items-center justify-between">
          <span>
            Bán trên TikTok Shop đem lại thêm <strong className="text-teal-900 font-mono">+{formatVND(tikTokSim.netPayout - shopeeSim.netPayout)}</strong> trên mỗi sản phẩm giá {formatVND(testProductPrice)} so với Shopee.
          </span>
          <span className="text-[11px] font-mono text-teal-700 font-semibold">
            Tối ưu biên lợi nhuận
          </span>
        </div>
      </div>
    </div>
  );
};
