import React, { useState } from 'react';
import { MonthlyPnlRecord } from '../../utils/reportCalculations';
import { formatNumberVi } from '../../utils/formatters';
import { 
  ShoppingBag, 
  Store, 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  BarChart2, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  Info,
  Layers,
  Award,
  Zap,
  Target
} from 'lucide-react';

import { ProjectParameters } from '../../types/financial';

interface ChannelPerformanceComparisonProps {
  pnlMonthly: MonthlyPnlRecord[];
  pnlSummary: any;
  totalGrossRevenue: number;
  parameters?: ProjectParameters;
}

interface ChannelMetric {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  icon: any;
  gmv: number;
  gmvShare: number; // %
  units: number;
  unitsShare: number; // %
  grossRevenue: number; // sau VAT
  cogs: number;
  directFees: number; // Phí sàn + vận chuyển
  marketingFees: number; // Ads nội sàn + Affiliate
  totalDirectCosts: number;
  contributionMargin: number; // Lợi nhuận đóng góp
  contributionMarginRatio: number; // CM%
  bepRevenue: number; // Doanh thu hòa vốn ước tính riêng kênh
  strategicRole: string;
  recommendation: string;
  statusColor: string;
}

export const ChannelPerformanceComparison: React.FC<ChannelPerformanceComparisonProps> = ({
  pnlMonthly = [],
  pnlSummary,
  totalGrossRevenue,
  parameters,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');

  const vatRate = (parameters?.taxAndCapital?.vatOutputRate ?? 8) / 100;
  const vatMultiplier = Math.max(0, 1 - vatRate);

  // Tổng hợp dữ liệu thực tế từ 4 kênh qua pnlMonthly
  const totalGmv = pnlMonthly.reduce((sum, m) => sum + m.grossRevenue, 0) || totalGrossRevenue || 0;
  const totalUnits = pnlMonthly.reduce((sum, m) => sum + m.totalUnits, 0) || 0;

  // 1. Shopee Mall
  const shopeeGmv = pnlMonthly.reduce((sum, m) => sum + m.revenueByChannel.shopee, 0);
  const shopeeUnits = pnlMonthly.reduce((sum, m) => sum + m.unitsByChannel.shopee, 0);
  const shopeeGmvShare = totalGmv > 0 ? (shopeeGmv / totalGmv) * 100 : 0;
  const shopeeUnitsShare = totalUnits > 0 ? (shopeeUnits / totalUnits) * 100 : 0;
  const shopeeGrossRev = Math.round(shopeeGmv * vatMultiplier);
  const shopeeCogs = totalUnits > 0 ? Math.round((shopeeUnits / totalUnits) * (pnlSummary?.totalCogs || 0)) : 0;
  const totalPlatformFees = pnlSummary?.platformFees || 0;
  const ecomGmvTotal = Math.max(1, shopeeGmv + pnlMonthly.reduce((sum, m) => sum + m.revenueByChannel.tikTokShop, 0));
  const shopeePlatformFees = Math.round((shopeeGmv / ecomGmvTotal) * totalPlatformFees);
  const shopeeMarketing = Math.round((shopeeGmv / ecomGmvTotal) * (pnlMonthly.reduce((sum, m) => sum + m.marketingPlatform.total, 0)));
  const shopeeDirectCosts = shopeeCogs + shopeePlatformFees + shopeeMarketing;
  const shopeeCm = Math.max(0, shopeeGrossRev - shopeeDirectCosts);
  const shopeeCmr = shopeeGrossRev > 0 ? (shopeeCm / shopeeGrossRev) * 100 : 0;

  // 2. TikTok Shop
  const tikTokGmv = pnlMonthly.reduce((sum, m) => sum + m.revenueByChannel.tikTokShop, 0);
  const tikTokUnits = pnlMonthly.reduce((sum, m) => sum + m.unitsByChannel.tikTokShop, 0);
  const tikTokGmvShare = totalGmv > 0 ? (tikTokGmv / totalGmv) * 100 : 0;
  const tikTokUnitsShare = totalUnits > 0 ? (tikTokUnits / totalUnits) * 100 : 0;
  const tikTokGrossRev = Math.round(tikTokGmv * vatMultiplier);
  const tikTokCogs = totalUnits > 0 ? Math.round((tikTokUnits / totalUnits) * (pnlSummary?.totalCogs || 0)) : 0;
  const tikTokPlatformFees = Math.round((tikTokGmv / ecomGmvTotal) * totalPlatformFees);
  const tikTokMarketing = Math.round((tikTokGmv / ecomGmvTotal) * (pnlMonthly.reduce((sum, m) => sum + m.marketingPlatform.total, 0)));
  const tikTokDirectCosts = tikTokCogs + tikTokPlatformFees + tikTokMarketing;
  const tikTokCm = Math.max(0, tikTokGrossRev - tikTokDirectCosts);
  const tikTokCmr = tikTokGrossRev > 0 ? (tikTokCm / tikTokGrossRev) * 100 : 0;

  // 3. B2B & Đại Lý Sỉ
  const b2bGmv = pnlMonthly.reduce((sum, m) => sum + m.revenueByChannel.b2b, 0);
  const b2bUnits = pnlMonthly.reduce((sum, m) => sum + m.unitsByChannel.b2b, 0);
  const b2bGmvShare = totalGmv > 0 ? (b2bGmv / totalGmv) * 100 : 0;
  const b2bUnitsShare = totalUnits > 0 ? (b2bUnits / totalUnits) * 100 : 0;
  const b2bGrossRev = Math.round(b2bGmv * vatMultiplier);
  const b2bCogs = totalUnits > 0 ? Math.round((b2bUnits / totalUnits) * (pnlSummary?.totalCogs || 0)) : 0;
  const b2bShipping = pnlMonthly.reduce((sum, m) => sum + m.shippingB2bRetail.b2bShipping, 0);
  const b2bDirectCosts = b2bCogs + b2bShipping;
  const b2bCm = Math.max(0, b2bGrossRev - b2bDirectCosts);
  const b2bCmr = b2bGrossRev > 0 ? (b2bCm / b2bGrossRev) * 100 : 0;

  // 4. Bán Lẻ Khác (Retail / D2C)
  const retailGmv = pnlMonthly.reduce((sum, m) => sum + m.revenueByChannel.retail, 0);
  const retailUnits = pnlMonthly.reduce((sum, m) => sum + m.unitsByChannel.retail, 0);
  const retailGmvShare = totalGmv > 0 ? (retailGmv / totalGmv) * 100 : 0;
  const retailUnitsShare = totalUnits > 0 ? (retailUnits / totalUnits) * 100 : 0;
  const retailGrossRev = Math.round(retailGmv * vatMultiplier);
  const retailCogs = totalUnits > 0 ? Math.round((retailUnits / totalUnits) * (pnlSummary?.totalCogs || 0)) : 0;
  const retailShipping = pnlMonthly.reduce((sum, m) => sum + m.shippingB2bRetail.retailShipping, 0);
  const retailDirectCosts = retailCogs + retailShipping;
  const retailCm = Math.max(0, retailGrossRev - retailDirectCosts);
  const retailCmr = retailGrossRev > 0 ? (retailCm / retailGrossRev) * 100 : 0;

  // Phân bổ định phí (FC) theo tỷ trọng đóng góp để tính BEP từng kênh
  const totalFixedCosts = (pnlSummary?.laborCost || 0) + (pnlSummary?.operatingExpenses?.total || 0);

  const channels: ChannelMetric[] = [
    {
      id: 'shopee',
      name: 'Kênh Shopee Mall',
      badge: 'Trọng Tâm TMĐT',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: ShoppingBag,
      gmv: shopeeGmv,
      gmvShare: shopeeGmvShare,
      units: shopeeUnits,
      unitsShare: shopeeUnitsShare,
      grossRevenue: shopeeGrossRev,
      cogs: shopeeCogs,
      directFees: shopeePlatformFees,
      marketingFees: shopeeMarketing,
      totalDirectCosts: shopeeDirectCosts,
      contributionMargin: shopeeCm,
      contributionMarginRatio: shopeeCmr,
      bepRevenue: shopeeCmr > 0 ? Math.round((totalFixedCosts * (shopeeGmvShare / 100)) / (shopeeCmr / 100)) : 0,
      strategicRole: 'Ngôi Sao Tăng Trưởng (Star)',
      recommendation: 'Duy trì ngân sách Shopee Ads vào các ngày Mega Sale (D-Day); tối ưu gói Voucher Xtra để giảm phí sàn.',
      statusColor: 'text-orange-600',
    },
    {
      id: 'tiktok',
      name: 'Kênh TikTok Shop',
      badge: 'Bùng Nổ & KOC',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      icon: Store,
      gmv: tikTokGmv,
      gmvShare: tikTokGmvShare,
      units: tikTokUnits,
      unitsShare: tikTokUnitsShare,
      grossRevenue: tikTokGrossRev,
      cogs: tikTokCogs,
      directFees: tikTokPlatformFees,
      marketingFees: tikTokMarketing,
      totalDirectCosts: tikTokDirectCosts,
      contributionMargin: tikTokCm,
      contributionMarginRatio: tikTokCmr,
      bepRevenue: tikTokCmr > 0 ? Math.round((totalFixedCosts * (tikTokGmvShare / 100)) / (tikTokCmr / 100)) : 0,
      strategicRole: 'Kênh Tạo Xu Hướng (Viral Driver)',
      recommendation: 'Đẩy mạnh tiếp thị liên kết (Affiliate KOC) trả thưởng theo hoa hồng đơn thành công để hạn chế rủi ro chi phí cố định.',
      statusColor: 'text-cyan-700',
    },
    {
      id: 'b2b',
      name: 'Kênh B2B & Đại Lý Sỉ',
      badge: 'Bò Sữa Sinh Tiền',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: Building2,
      gmv: b2bGmv,
      gmvShare: b2bGmvShare,
      units: b2bUnits,
      unitsShare: b2bUnitsShare,
      grossRevenue: b2bGrossRev,
      cogs: b2bCogs,
      directFees: b2bShipping,
      marketingFees: 0,
      totalDirectCosts: b2bDirectCosts,
      contributionMargin: b2bCm,
      contributionMarginRatio: b2bCmr,
      bepRevenue: b2bCmr > 0 ? Math.round((totalFixedCosts * (b2bGmvShare / 100)) / (b2bCmr / 100)) : 0,
      strategicRole: 'Bò Sữa Lợi Nhuận (Cash Cow)',
      recommendation: 'Không tốn phí sàn 10-15%, biên lãi đóng góp (CM%) rất cao. Cần đàm phán hợp đồng cung ứng dài hạn và kiểm soát kỳ hạn công nợ.',
      statusColor: 'text-emerald-700',
    },
    {
      id: 'retail',
      name: 'Kênh Bán Lẻ Khác (Retail/D2C)',
      badge: 'Biên Lãi Dày',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: Users,
      gmv: retailGmv,
      gmvShare: retailGmvShare,
      units: retailUnits,
      unitsShare: retailUnitsShare,
      grossRevenue: retailGrossRev,
      cogs: retailCogs,
      directFees: retailShipping,
      marketingFees: 0,
      totalDirectCosts: retailDirectCosts,
      contributionMargin: retailCm,
      contributionMarginRatio: retailCmr,
      bepRevenue: retailCmr > 0 ? Math.round((totalFixedCosts * (retailGmvShare / 100)) / (retailCmr / 100)) : 0,
      strategicRole: 'Biên Lãi Cao (High Margin Niche)',
      recommendation: 'Đơn giá bán lẻ đầy đủ (không chiết khấu đại lý), tạo dòng tiền tức thời. Tối ưu chi phí bao bì và đóng gói giao nhanh.',
      statusColor: 'text-indigo-700',
    },
  ];

  // Kênh có tỷ suất lợi nhuận đóng góp cao nhất
  const bestCmChannel = [...channels].sort((a, b) => b.contributionMarginRatio - a.contributionMarginRatio)[0];
  // Kênh có doanh thu lớn nhất
  const highestRevChannel = [...channels].sort((a, b) => b.gmv - a.gmv)[0];

  return (
    <div id="channel-performance-comparison-card" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shadow-2xs">
            <BarChart2 className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                So Sánh Hiệu Quả Giữa Các Kênh Bán Hàng (Cross-Channel Performance)
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                4 Kênh Trực Tuyến & Sỉ
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân tích đa chiều về Doanh thu GMV, Chi phí đặc thù kênh, Lợi nhuận đóng góp (CM) và Điểm hòa vốn từng kênh
            </p>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            CM% Cao Nhất: {bestCmChannel?.name} ({bestCmChannel?.contributionMarginRatio.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* 4 THẺ TÓM TẮT NHANH 4 KÊNH BÁN HÀNG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {channels.map((ch) => {
          const IconComp = ch.icon;
          const isSelected = selectedChannelId === ch.id;
          return (
            <div 
              key={ch.id}
              onClick={() => setSelectedChannelId(selectedChannelId === ch.id ? 'all' : ch.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected 
                  ? 'ring-2 ring-blue-600 bg-blue-50/30 border-blue-300 shadow-sm' 
                  : 'bg-white hover:bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <IconComp className={`w-4 h-4 ${ch.statusColor}`} />
                  <span className="text-xs font-bold text-slate-900">{ch.name}</span>
                </div>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${ch.badgeColor}`}>
                  {ch.badge}
                </span>
              </div>

              <div className="mt-3">
                <div className="text-[11px] text-slate-500 font-medium">Doanh thu GMV</div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  {formatNumberVi(ch.gmv)} đ
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Chiếm {ch.gmvShare.toFixed(1)}% GMV • {formatNumberVi(ch.units)} sp
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Lợi Nhuận Đóng Góp</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {formatNumberVi(ch.contributionMargin)} đ
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Tỷ suất CM%</span>
                  <span className="font-bold text-blue-700 font-mono">
                    {ch.contributionMarginRatio.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BẢNG SO SÁNH MA TRẬN CHI TIẾT CÁC KÊNH */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Bảng Ma Trận So Sánh Chỉ Số Kinh Tế Đơn Vị & Lợi Nhuận Đóng Góp (Unit Economics)
          </span>
          <span className="text-[11px] text-slate-400">
            Đơn vị tính: VNĐ / %
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Kênh Bán Hàng</th>
                <th className="py-2.5 px-3 text-right">Doanh Thu GMV</th>
                <th className="py-2.5 px-3 text-right">Tỷ Trọng GMV</th>
                <th className="py-2.5 px-3 text-right">Sản Lượng (sp)</th>
                <th className="py-2.5 px-3 text-right">Giá Vốn (COGS)</th>
                <th className="py-2.5 px-3 text-right">Phí Sàn & VC</th>
                <th className="py-2.5 px-3 text-right">MKT Kênh</th>
                <th className="py-2.5 px-3 text-right bg-emerald-50 text-emerald-900 font-extrabold">
                  Lợi Nhuận Góp (CM)
                </th>
                <th className="py-2.5 px-3 text-right bg-emerald-50 text-emerald-900 font-extrabold">
                  Tỷ Suất CM%
                </th>
                <th className="py-2.5 px-3 text-right">BEP Kênh (ước tính)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {channels.map((ch) => (
                <tr key={`row-${ch.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-sans font-bold text-slate-900 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ch.statusColor.replace('text-', 'bg-')}`} />
                    {ch.name}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-800 font-semibold">
                    {formatNumberVi(ch.gmv)} đ
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {ch.gmvShare.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">
                    {formatNumberVi(ch.units)} sp
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {formatNumberVi(ch.cogs)} đ
                  </td>
                  <td className="py-3 px-3 text-right text-amber-700">
                    {formatNumberVi(ch.directFees)} đ
                  </td>
                  <td className="py-3 px-3 text-right text-blue-700">
                    {formatNumberVi(ch.marketingFees)} đ
                  </td>
                  <td className="py-3 px-3 text-right bg-emerald-50/50 text-emerald-800 font-bold">
                    {formatNumberVi(ch.contributionMargin)} đ
                  </td>
                  <td className="py-3 px-3 text-right bg-emerald-50/50 text-emerald-800 font-black">
                    {ch.contributionMarginRatio.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">
                    {formatNumberVi(ch.bepRevenue)} đ
                  </td>
                </tr>
              ))}
              {/* Hàng Tổng Cộng */}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-2.5 px-3 font-sans">TỔNG CỘNG TOÀN DỰ ÁN</td>
                <td className="py-2.5 px-3 text-right">{formatNumberVi(totalGmv)} đ</td>
                <td className="py-2.5 px-3 text-right">100.0%</td>
                <td className="py-2.5 px-3 text-right">{formatNumberVi(totalUnits)} sp</td>
                <td className="py-2.5 px-3 text-right">{formatNumberVi(pnlSummary?.totalCogs || 0)} đ</td>
                <td className="py-2.5 px-3 text-right">{formatNumberVi((pnlSummary?.platformFees || 0) + (pnlSummary?.shippingB2bRetail || 0))} đ</td>
                <td className="py-2.5 px-3 text-right">{formatNumberVi(pnlMonthly.reduce((sum, m) => sum + m.marketingPlatform.total, 0))} đ</td>
                <td className="py-2.5 px-3 text-right bg-emerald-100 text-emerald-900">{formatNumberVi(channels.reduce((sum, c) => sum + c.contributionMargin, 0))} đ</td>
                <td className="py-2.5 px-3 text-right bg-emerald-100 text-emerald-900">
                  {totalGmv > 0 ? ((channels.reduce((sum, c) => sum + c.contributionMargin, 0) / (totalGmv * 0.92)) * 100).toFixed(1) : 0}%
                </td>
                <td className="py-2.5 px-3 text-right">{formatNumberVi(pnlSummary?.grossRevenue || 0)} đ</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ĐÁNH GIÁ VỊ THẾ CHIẾN LƯỢC & GỢI Ý PHÂN BỔ NGÂN SÁCH KÊNH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((ch) => (
          <div key={`strat-${ch.id}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${ch.statusColor.replace('text-', 'bg-')}`} />
                {ch.name}
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Vai trò: {ch.strategicRole}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              {ch.recommendation}
            </p>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Đóng góp: {ch.gmvShare.toFixed(1)}% GMV</span>
              <span className="font-bold text-emerald-700">Tỷ suất CM%: {ch.contributionMarginRatio.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
