import React, { useState } from 'react';
import { 
  Share2, 
  Target, 
  BadgePercent, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Percent,
  Link2,
  Sliders,
  Store,
  ShoppingBag
} from 'lucide-react';
import { D2CFeesConfig } from '../types/financial';
import { formatPercent } from '../utils/formatters';

interface D2CFeesSectionProps {
  d2cFees: D2CFeesConfig;
  marketingBudgetRateGmv: number;
  onChange: (updated: D2CFeesConfig) => void;
}

export const D2CFeesSection: React.FC<D2CFeesSectionProps> = ({
  d2cFees,
  marketingBudgetRateGmv,
  onChange,
}) => {
  const affiliateRate = d2cFees?.affiliateRate ?? 8;
  const internalAdsRate = d2cFees?.internalAdsRate ?? 5;
  const totalD2cRate = affiliateRate + internalAdsRate;
  const totalCombinedBudgetRate = marketingBudgetRateGmv + totalD2cRate;

  // Chế độ tách riêng cấu hình cho Shopee & TikTok
  const [hasCustomChannelFees, setHasCustomChannelFees] = useState<boolean>(() => {
    return !!(
      d2cFees?.shopeeAffiliateRate !== undefined ||
      d2cFees?.shopeeInternalAdsRate !== undefined ||
      d2cFees?.tikTokAffiliateRate !== undefined ||
      d2cFees?.tikTokInternalAdsRate !== undefined
    );
  });

  const shopeeAffiliate = d2cFees?.shopeeAffiliateRate ?? affiliateRate;
  const shopeeAds = d2cFees?.shopeeInternalAdsRate ?? internalAdsRate;
  const tikTokAffiliate = d2cFees?.tikTokAffiliateRate ?? affiliateRate;
  const tikTokAds = d2cFees?.tikTokInternalAdsRate ?? internalAdsRate;

  const handleUpdateAffiliate = (val: number) => {
    const rate = Math.max(0, Math.min(50, val));
    onChange({
      ...d2cFees,
      affiliateRate: rate,
      // Nếu đang không tách riêng, đồng bộ cả hai sàn
      ...(!hasCustomChannelFees ? {
        shopeeAffiliateRate: undefined,
        tikTokAffiliateRate: undefined,
      } : {})
    });
  };

  const handleUpdateInternalAds = (val: number) => {
    const rate = Math.max(0, Math.min(50, val));
    onChange({
      ...d2cFees,
      internalAdsRate: rate,
      ...(!hasCustomChannelFees ? {
        shopeeInternalAdsRate: undefined,
        tikTokInternalAdsRate: undefined,
      } : {})
    });
  };

  const handleUpdateShopeeAffiliate = (val: number) => {
    onChange({
      ...d2cFees,
      shopeeAffiliateRate: Math.max(0, Math.min(50, val)),
    });
  };

  const handleUpdateShopeeAds = (val: number) => {
    onChange({
      ...d2cFees,
      shopeeInternalAdsRate: Math.max(0, Math.min(50, val)),
    });
  };

  const handleUpdateTikTokAffiliate = (val: number) => {
    onChange({
      ...d2cFees,
      tikTokAffiliateRate: Math.max(0, Math.min(50, val)),
    });
  };

  const handleUpdateTikTokAds = (val: number) => {
    onChange({
      ...d2cFees,
      tikTokInternalAdsRate: Math.max(0, Math.min(50, val)),
    });
  };

  const toggleChannelCustomization = () => {
    if (hasCustomChannelFees) {
      // Đưa về dùng chung
      setHasCustomChannelFees(false);
      onChange({
        ...d2cFees,
        shopeeAffiliateRate: undefined,
        shopeeInternalAdsRate: undefined,
        tikTokAffiliateRate: undefined,
        tikTokInternalAdsRate: undefined,
      });
    } else {
      // Khởi tạo tách riêng với giá trị hiện tại
      setHasCustomChannelFees(true);
      onChange({
        ...d2cFees,
        shopeeAffiliateRate: affiliateRate,
        shopeeInternalAdsRate: internalAdsRate,
        tikTokAffiliateRate: affiliateRate,
        tikTokInternalAdsRate: internalAdsRate,
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center text-xs font-bold font-mono">
              5
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Tham Số Chung Cho Phí D2C (Direct-to-Consumer)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình định mức chiết khấu tiếp thị liên kết (Affiliate) và ngân sách quảng cáo nội sàn (Shopee Ads, TikTok Shop Ads) thúc đẩy chuyển đổi trực tiếp.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={toggleChannelCustomization}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              hasCustomChannelFees 
                ? 'bg-purple-50 border-purple-300 text-purple-700 font-semibold' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Nhấn để tùy chỉnh mức chiết khấu & ads riêng biệt cho từng sàn"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>{hasCustomChannelFees ? 'Đang tách riêng theo sàn' : 'Tách riêng từng sàn'}</span>
          </button>
          <span className="text-[11px] px-2.5 py-1 rounded bg-purple-50 border border-purple-200 text-purple-700 font-mono flex items-center gap-1.5 font-semibold">
            <Share2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Tổng Phí D2C: {formatPercent(totalD2cRate)}</span>
          </span>
        </div>
      </div>

      {/* Direct Link to Tab 4 Banner */}
      <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-start gap-2.5 text-xs text-purple-950">
        <Link2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-purple-900">Liên kết tự động tới Tab 4 (P&amp;L Sản Phẩm):</strong> Toàn bộ tỷ lệ <span className="font-semibold">Hoa hồng Tiếp thị liên kết Affiliate</span> và <span className="font-semibold">Chi phí Quảng cáo sàn / Livestream</span> cấu hình tại đây sẽ tự động làm căn cứ tính <span className="font-semibold">"Chi phí tiếp thị trực tiếp"</span> trong mô phỏng P&amp;L từng SKU (Kênh Shopee &amp; TikTok Shop).
        </div>
      </div>

      {/* Main Inputs: Khi dùng định mức chung */}
      {!hasCustomChannelFees ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Phí Affiliate Chung */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-purple-300 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-xs text-slate-700 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700 border border-purple-200">
                  <Share2 className="w-4 h-4" />
                </span>
                <span>1. Phí Tiếp Thị Liên Kết (Affiliate) Chung</span>
              </label>
              <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-medium">
                Shopee &amp; TikTok Shop
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-500/20 transition-colors">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={affiliateRate}
                  onChange={(e) => handleUpdateAffiliate(Number(e.target.value))}
                  className="w-full bg-transparent px-3.5 py-2.5 text-base text-slate-900 font-mono font-bold focus:outline-none"
                />
                <span className="px-3.5 py-2.5 bg-slate-100 border-l border-slate-300 text-xs text-purple-700 font-mono font-bold select-none shrink-0">
                  %
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 mr-1">Mốc chuẩn:</span>
                {[5, 8, 10, 12, 15].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleUpdateAffiliate(rate)}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      affiliateRate === rate
                        ? 'bg-purple-600 text-white border-purple-600 font-semibold shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
              <strong className="text-purple-700 font-semibold">Cơ chế vận hành:</strong> Tỷ lệ hoa hồng chi trả tự động qua sàn cho các nhà sáng tạo nội dung (KOC/KOL/Affiliate) khi có đơn hàng mua sản phẩm qua link tiếp thị liên kết hoặc giỏ hàng livestream.
            </p>
          </div>

          {/* 2. Phí Quảng Cáo Nội Sàn Chung */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-cyan-300 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-xs text-slate-700 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700 border border-cyan-200">
                  <Target className="w-4 h-4" />
                </span>
                <span>2. Phí Quảng Cáo Nội Sàn / Livestream Chung</span>
              </label>
              <span className="text-[11px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-medium">
                Shopee Ads &amp; TikTok Ads
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-cyan-600 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-colors">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={internalAdsRate}
                  onChange={(e) => handleUpdateInternalAds(Number(e.target.value))}
                  className="w-full bg-transparent px-3.5 py-2.5 text-base text-slate-900 font-mono font-bold focus:outline-none"
                />
                <span className="px-3.5 py-2.5 bg-slate-100 border-l border-slate-300 text-xs text-cyan-700 font-mono font-bold select-none shrink-0">
                  %
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 mr-1">Mốc chuẩn:</span>
                {[3, 5, 7, 8, 10].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleUpdateInternalAds(rate)}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      internalAdsRate === rate
                        ? 'bg-cyan-700 text-white border-cyan-700 font-semibold shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
              <strong className="text-cyan-700 font-semibold">Cơ chế vận hành:</strong> Ngân sách nạp trực tiếp vào hệ thống tài khoản Shopee Ads và TikTok Shop Ads (đấu thầu từ khóa, hiển thị sản phẩm tương tự, quảng cáo video / live shopping) trực tiếp tạo ra doanh số.
            </p>
          </div>
        </div>
      ) : (
        /* Khi tách riêng từng sàn */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cấu hình Sàn Shopee */}
          <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-orange-200/70">
              <div className="flex items-center gap-2 font-bold text-xs text-orange-950">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
                <span>Chi Phí Tiếp Thị Trực Tiếp - Sàn Shopee</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold">
                Tổng: {formatPercent(shopeeAffiliate + shopeeAds)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">
                  Hoa hồng Affiliate (%)
                </label>
                <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-orange-500">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={shopeeAffiliate}
                    onChange={(e) => handleUpdateShopeeAffiliate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="px-2 py-1.5 bg-slate-50 text-xs text-slate-500 border-l border-slate-200 font-mono">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">
                  Quảng cáo Shopee Ads (%)
                </label>
                <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-orange-500">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={shopeeAds}
                    onChange={(e) => handleUpdateShopeeAds(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="px-2 py-1.5 bg-slate-50 text-xs text-slate-500 border-l border-slate-200 font-mono">%</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-white/80 p-2 rounded-lg border border-orange-100">
              Áp dụng riêng cho các sản phẩm bán trên Kênh Shopee trong Tab 4 (P&amp;L Sản Phẩm).
            </p>
          </div>

          {/* Cấu hình Sàn TikTok Shop */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <Store className="w-4 h-4 text-slate-900" />
                <span>Chi Phí Tiếp Thị Trực Tiếp - TikTok Shop</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                Tổng: {formatPercent(tikTokAffiliate + tikTokAds)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">
                  Hoa hồng Affiliate (%)
                </label>
                <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-slate-600">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={tikTokAffiliate}
                    onChange={(e) => handleUpdateTikTokAffiliate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="px-2 py-1.5 bg-slate-50 text-xs text-slate-500 border-l border-slate-200 font-mono">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">
                  Quảng cáo sàn / Livestream (%)
                </label>
                <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-slate-600">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={tikTokAds}
                    onChange={(e) => handleUpdateTikTokAds(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="px-2 py-1.5 bg-slate-50 text-xs text-slate-500 border-l border-slate-200 font-mono">%</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-white/80 p-2 rounded-lg border border-slate-200">
              Áp dụng riêng cho các sản phẩm bán trên Kênh TikTok Shop trong Tab 4 (P&amp;L Sản Phẩm).
            </p>
          </div>
        </div>
      )}

      {/* Financial System Hierarchy & Clarification Banner */}
      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Hệ Thống Phân Định &amp; Tổng Hợp Ngân Sách Tiếp Thị (Marketing vs. D2C)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700">
            Tổng Tiếp Thị &amp; D2C: {formatPercent(totalCombinedBudgetRate)} GMV
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          {/* Box 1: Marketing Tổng Thể Dự Án */}
          <div className="p-3 rounded-lg bg-white border border-rose-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Marketing Tổng Thể
              </span>
              <span className="font-mono font-bold text-rose-700">{formatPercent(marketingBudgetRateGmv)} GMV</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-rose-700 font-medium">Không bao gồm quảng cáo nội sàn</strong>. Dành riêng cho nhận diện thương hiệu, sản xuất nội dung media, booking KOL định vị &amp; kích hoạt toàn diện.
            </p>
          </div>

          {/* Box 2: Phí Quảng Cáo Nội Sàn */}
          <div className="p-3 rounded-lg bg-white border border-cyan-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                Quảng Cáo Nội Sàn
              </span>
              <span className="font-mono font-bold text-cyan-700">{formatPercent(internalAdsRate)} GMV</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Ngân sách Shopee Ads &amp; TikTok Ads chuyên dụng cho đấu thầu từ khóa, đẩy traffic trực tiếp và chuyển đổi đơn hàng tại sàn. Tự động đồng bộ vào P&amp;L từng SKU.
            </p>
          </div>

          {/* Box 3: Phí Tiếp Thị Liên Kết (Affiliate) */}
          <div className="p-3 rounded-lg bg-white border border-purple-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                Phí Affiliate D2C
              </span>
              <span className="font-mono font-bold text-purple-700">{formatPercent(affiliateRate)} GMV</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Chi trả hoa hồng chuyển đổi thực tế cho KOC/Creator/Đối tác affiliate tiếp thị giỏ hàng và thúc đẩy chốt đơn D2C. Tự động đồng bộ vào P&amp;L từng SKU.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
