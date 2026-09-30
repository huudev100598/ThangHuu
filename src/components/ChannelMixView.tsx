import React, { useState, useMemo } from 'react';
import { ProductSku } from '../types/sku';
import { SalesMonth, SalesVolumeMap, ChannelMixConfig } from '../types/salesForecast';
import { ProjectParameters } from '../types/financial';
import { 
  ShoppingBag, 
  Smartphone, 
  Store, 
  Building, 
  Sliders, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  DollarSign,
  Package,
  CreditCard,
  CheckCircle2,
  Receipt,
  Info
} from 'lucide-react';

interface ChannelMixViewProps {
  skus: ProductSku[];
  months: SalesMonth[];
  volumes: SalesVolumeMap;
  channelMix: ChannelMixConfig;
  onChangeChannelMix: (mix: ChannelMixConfig) => void;
  parameters: ProjectParameters;
}

export const ChannelMixView: React.FC<ChannelMixViewProps> = ({
  skus,
  months,
  volumes,
  channelMix,
  onChangeChannelMix,
  parameters,
}) => {
  const [displayMode, setDisplayMode] = useState<'both' | 'revenue' | 'net' | 'units'>('both');
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({});

  const totalPercentage = channelMix.shopee + channelMix.tikTokShop + channelMix.retail + channelMix.b2b;
  const isTotalValid = Math.abs(totalPercentage - 100) < 0.1;

  // Calculate total units planned across all SKUs and months
  const totalVolume = useMemo(() => {
    return skus.reduce((skuSum, sku) => {
      return (
        skuSum +
        months.reduce((monthSum, m) => {
          const v = volumes[sku.id]?.[m.id];
          return monthSum + (typeof v === 'number' ? v : 0);
        }, 0)
      );
    }, 0);
  }, [skus, months, volumes]);

  // Channels definitions with styles and platform fee rates (Link từ Tab 1 & khớp P&L Sản phẩm)
  const channels = useMemo(() => {
    const shopeeFees = parameters.platformFees?.shopee || {
      paymentFeeRate: 5.0,
      platformCommissionRate: 14.0,
      voucherXtraRate: 5.5,
      orderHandlingFeePerItem: 3000,
      compensationFeePerItem: 2700,
      packagingAndWarehousingRate: 2.0,
      shrinkageRate: 1.0,
    };

    const tikTokFees = parameters.platformFees?.tikTokShop || {
      paymentFeeRate: 6.0,
      platformCommissionRate: 15.5,
      voucherXtraRate: 5.0,
      orderHandlingFeePerItem: 3000,
      compensationFeePerItem: 2008,
      packagingAndWarehousingRate: 2.0,
      shrinkageRate: 1.0,
    };

    const d2cFees = parameters.d2cFees || {};
    const shopeeAffiliate = d2cFees.shopeeAffiliateRate ?? d2cFees.affiliateRate ?? 8.0;
    const shopeeInternalAds = d2cFees.shopeeInternalAdsRate ?? d2cFees.internalAdsRate ?? 5.0;
    const tikTokAffiliate = d2cFees.tikTokAffiliateRate ?? d2cFees.affiliateRate ?? 8.0;
    const tikTokInternalAds = d2cFees.tikTokInternalAdsRate ?? d2cFees.internalAdsRate ?? 5.0;

    return [
      {
        key: 'shopee' as const,
        name: 'Shopee',
        icon: ShoppingBag,
        color: 'orange',
        bgLight: 'bg-orange-50',
        borderLight: 'border-orange-200',
        textDark: 'text-orange-900',
        textAccent: 'text-orange-600',
        barColor: 'bg-orange-500',
        percent: channelMix.shopee,
        description: 'Gian hàng chính hãng Shopee Mall, tối ưu Freeship Xtra & Flash Sale',
        percentFeeRate: (shopeeFees.paymentFeeRate || 0) + (shopeeFees.platformCommissionRate || 0) + (shopeeFees.voucherXtraRate || 0),
        fixedFeePerItem: (shopeeFees.orderHandlingFeePerItem || 0) + (shopeeFees.compensationFeePerItem || 0),
        feeDetail: {
          paymentFeeRate: shopeeFees.paymentFeeRate || 0,
          commissionRate: shopeeFees.platformCommissionRate || 0,
          voucherXtraRate: shopeeFees.voucherXtraRate || 0,
          orderHandlingFeePerItem: shopeeFees.orderHandlingFeePerItem || 0,
          compensationFeePerItem: shopeeFees.compensationFeePerItem || 0,
        },
        directMarketing: {
          affiliateRate: shopeeAffiliate,
          internalAdsRate: shopeeInternalAds,
          totalRate: shopeeAffiliate + shopeeInternalAds,
        },
      },
      {
        key: 'tikTokShop' as const,
        name: 'TikTok Shop',
        icon: Smartphone,
        color: 'pink',
        bgLight: 'bg-rose-50',
        borderLight: 'border-rose-200',
        textDark: 'text-rose-900',
        textAccent: 'text-rose-600',
        barColor: 'bg-rose-500',
        percent: channelMix.tikTokShop,
        description: 'Livestream, Video Affiliate Creator & TikTok Shop Mall',
        percentFeeRate: (tikTokFees.paymentFeeRate || 0) + (tikTokFees.platformCommissionRate || 0) + (tikTokFees.voucherXtraRate || 0),
        fixedFeePerItem: (tikTokFees.orderHandlingFeePerItem || 0) + (tikTokFees.compensationFeePerItem || 0),
        feeDetail: {
          paymentFeeRate: tikTokFees.paymentFeeRate || 0,
          commissionRate: tikTokFees.platformCommissionRate || 0,
          voucherXtraRate: tikTokFees.voucherXtraRate || 0,
          orderHandlingFeePerItem: tikTokFees.orderHandlingFeePerItem || 0,
          compensationFeePerItem: tikTokFees.compensationFeePerItem || 0,
        },
        directMarketing: {
          affiliateRate: tikTokAffiliate,
          internalAdsRate: tikTokInternalAds,
          totalRate: tikTokAffiliate + tikTokInternalAds,
        },
      },
      {
        key: 'retail' as const,
        name: 'Bán Lẻ',
        icon: Store,
        color: 'emerald',
        bgLight: 'bg-emerald-50',
        borderLight: 'border-emerald-200',
        textDark: 'text-emerald-900',
        textAccent: 'text-emerald-600',
        barColor: 'bg-emerald-500',
        percent: channelMix.retail,
        description: 'Chuỗi cửa hàng mỹ phẩm Watsons, Guardian, Hasaki, chuỗi nhà thuốc',
        percentFeeRate: 0,
        fixedFeePerItem: 0,
        feeDetail: {
          paymentFeeRate: 0,
          commissionRate: 0,
          voucherXtraRate: 0,
          orderHandlingFeePerItem: 0,
          compensationFeePerItem: 0,
        },
        directMarketing: {
          affiliateRate: 0,
          internalAdsRate: 0,
          totalRate: 0,
        },
      },
      {
        key: 'b2b' as const,
        name: 'B2B',
        icon: Building,
        color: 'sky',
        bgLight: 'bg-sky-50',
        borderLight: 'border-sky-200',
        textDark: 'text-sky-900',
        textAccent: 'text-sky-600',
        barColor: 'bg-sky-500',
        percent: channelMix.b2b,
        description: 'Spa, Thẩm mỹ viện triệt lông, Phòng khám Da liễu & Nhà phân phối tỉnh',
        percentFeeRate: 0,
        fixedFeePerItem: 0,
        feeDetail: {
          paymentFeeRate: 0,
          commissionRate: 0,
          voucherXtraRate: 0,
          orderHandlingFeePerItem: 0,
          compensationFeePerItem: 0,
        },
        directMarketing: {
          affiliateRate: 0,
          internalAdsRate: 0,
          totalRate: 0,
        },
      },
    ];
  }, [channelMix, parameters.platformFees, parameters.d2cFees]);

  // Compute detailed monthly matrix for each channel and SKU
  const channelMatrix = useMemo(() => {
    const result: Record<
      string,
      {
        channelKey: 'shopee' | 'tikTokShop' | 'retail' | 'b2b';
        name: string;
        percent: number;
        percentFeeRate: number;
        fixedFeePerItem: number;
        effectiveFeeRate: number;
        totalUnits: number;
        totalRevenue: number;
        totalPlatformFee: number;
        totalNetRevenue: number;
        // Chi tiết 5 khoản mục phí theo logic P&L Sản Phẩm
        paymentFeeTotal: number;
        commissionFeeTotal: number;
        voucherXtraFeeTotal: number;
        orderHandlingFeeTotal: number;
        compensationFeeTotal: number;
        // Chi phí tiếp thị trực tiếp D2C (Affiliate & Ads)
        affiliateFeeTotal: number;
        internalAdsFeeTotal: number;
        directMarketingTotal: number;
        months: Record<
          string,
          {
            units: number;
            revenue: number;
            platformFee: number;
            netRevenue: number;
          }
        >;
        skuBreakdown: Array<{
          sku: ProductSku;
          channelPrice: number;
          totalUnits: number;
          totalRevenue: number;
          totalPlatformFee: number;
          months: Record<
            string,
            {
              units: number;
              revenue: number;
              platformFee: number;
            }
          >;
        }>;
      }
    > = {};

    channels.forEach((ch) => {
      let chTotalUnits = 0;
      let chTotalRevenue = 0;
      let chTotalPlatformFee = 0;

      const monthlyMap: Record<
        string,
        {
          units: number;
          revenue: number;
          platformFee: number;
          netRevenue: number;
        }
      > = {};

      months.forEach((m) => {
        monthlyMap[m.id] = {
          units: 0,
          revenue: 0,
          platformFee: 0,
          netRevenue: 0,
        };
      });

      const skuBreakdown = skus.map((sku) => {
        const channelPrice = sku.prices[ch.key] || sku.prices.standard;
        let skuTotalUnits = 0;
        let skuTotalRevenue = 0;
        let skuTotalPlatformFee = 0;

        const skuMonths: Record<string, { units: number; revenue: number; platformFee: number }> = {};

        months.forEach((m) => {
          const vol = volumes[sku.id]?.[m.id] || 0;
          const allocatedUnits = Math.round((vol * ch.percent) / 100);
          const allocatedRevenue = allocatedUnits * channelPrice;

          // Biến phí & Phí sàn TMĐT tính chuẩn theo logic P&L Sản Phẩm:
          // % Doanh thu (Phí thanh toán + Hoa hồng + Voucher Xtra) + Phí cố định/sản phẩm (Phí xử lý đơn + Phí bồi hoàn)
          let allocatedPlatformFee = 0;
          if (ch.percentFeeRate > 0 || ch.fixedFeePerItem > 0) {
            const percentFee = Math.round((allocatedRevenue * ch.percentFeeRate) / 100);
            const fixedFee = allocatedUnits * ch.fixedFeePerItem;
            allocatedPlatformFee = percentFee + fixedFee;
          }

          skuMonths[m.id] = {
            units: allocatedUnits,
            revenue: allocatedRevenue,
            platformFee: allocatedPlatformFee,
          };

          skuTotalUnits += allocatedUnits;
          skuTotalRevenue += allocatedRevenue;
          skuTotalPlatformFee += allocatedPlatformFee;

          monthlyMap[m.id].units += allocatedUnits;
          monthlyMap[m.id].revenue += allocatedRevenue;
          monthlyMap[m.id].platformFee += allocatedPlatformFee;
          monthlyMap[m.id].netRevenue = monthlyMap[m.id].revenue - monthlyMap[m.id].platformFee;
        });

        return {
          sku,
          channelPrice,
          totalUnits: skuTotalUnits,
          totalRevenue: skuTotalRevenue,
          totalPlatformFee: skuTotalPlatformFee,
          months: skuMonths,
        };
      });

      // Tổng toàn kỳ của kênh
      months.forEach((m) => {
        chTotalUnits += monthlyMap[m.id].units;
        chTotalRevenue += monthlyMap[m.id].revenue;
        chTotalPlatformFee += monthlyMap[m.id].platformFee;
      });

      const totalNetRevenue = chTotalRevenue - chTotalPlatformFee;
      const effectiveFeeRate = chTotalRevenue > 0 ? (chTotalPlatformFee / chTotalRevenue) * 100 : 0;

      // Tính chi tiết 5 khoản mục Biến phí & Phí sàn TMĐT
      const paymentFeeTotal = Math.round((chTotalRevenue * ch.feeDetail.paymentFeeRate) / 100);
      const commissionFeeTotal = Math.round((chTotalRevenue * ch.feeDetail.commissionRate) / 100);
      const voucherXtraFeeTotal = Math.round((chTotalRevenue * ch.feeDetail.voucherXtraRate) / 100);
      const orderHandlingFeeTotal = chTotalUnits * ch.feeDetail.orderHandlingFeePerItem;
      const compensationFeeTotal = chTotalUnits * ch.feeDetail.compensationFeePerItem;

      // Chi phí tiếp thị trực tiếp D2C
      const affiliateFeeTotal = Math.round((chTotalRevenue * ch.directMarketing.affiliateRate) / 100);
      const internalAdsFeeTotal = Math.round((chTotalRevenue * ch.directMarketing.internalAdsRate) / 100);
      const directMarketingTotal = affiliateFeeTotal + internalAdsFeeTotal;

      result[ch.key] = {
        channelKey: ch.key,
        name: ch.name,
        percent: ch.percent,
        percentFeeRate: ch.percentFeeRate,
        fixedFeePerItem: ch.fixedFeePerItem,
        effectiveFeeRate,
        totalUnits: chTotalUnits,
        totalRevenue: chTotalRevenue,
        totalPlatformFee: chTotalPlatformFee,
        totalNetRevenue,
        paymentFeeTotal,
        commissionFeeTotal,
        voucherXtraFeeTotal,
        orderHandlingFeeTotal,
        compensationFeeTotal,
        affiliateFeeTotal,
        internalAdsFeeTotal,
        directMarketingTotal,
        months: monthlyMap,
        skuBreakdown,
      };
    });

    return result;
  }, [channels, skus, months, volumes]);

  // Aggregate monthly totals across all channels
  const grandMonthlyTotals = useMemo(() => {
    const map: Record<
      string,
      {
        units: number;
        revenue: number;
        platformFee: number;
        netRevenue: number;
      }
    > = {};

    months.forEach((m) => {
      let units = 0;
      let revenue = 0;
      let platformFee = 0;
      let netRevenue = 0;

      channels.forEach((ch) => {
        const data = channelMatrix[ch.key]?.months[m.id];
        if (data) {
          units += data.units;
          revenue += data.revenue;
          platformFee += data.platformFee;
          netRevenue += data.netRevenue;
        }
      });

      map[m.id] = { units, revenue, platformFee, netRevenue };
    });

    return map;
  }, [months, channels, channelMatrix]);

  // Aggregate grand total across all channels and months
  const grandTotals = useMemo(() => {
    let units = 0;
    let revenue = 0;
    let platformFee = 0;
    let netRevenue = 0;

    channels.forEach((ch) => {
      const data = channelMatrix[ch.key];
      if (data) {
        units += data.totalUnits;
        revenue += data.totalRevenue;
        platformFee += data.totalPlatformFee;
        netRevenue += data.totalNetRevenue;
      }
    });

    return { units, revenue, platformFee, netRevenue };
  }, [channels, channelMatrix]);

  const handlePercentChange = (key: keyof ChannelMixConfig, val: number) => {
    onChangeChannelMix({
      ...channelMix,
      [key]: isNaN(val) ? 0 : Math.max(0, Math.min(100, val)),
    });
  };

  const toggleChannelExpand = (key: string) => {
    setExpandedChannels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const allExpanded = useMemo(() => {
    return channels.every((ch) => expandedChannels[ch.key]);
  }, [channels, expandedChannels]);

  const toggleExpandAll = () => {
    const nextState = !allExpanded;
    const newState: Record<string, boolean> = {};
    channels.forEach((ch) => {
      newState[ch.key] = nextState;
    });
    setExpandedChannels(newState);
  };

  const [showEcomFeeAnalysis, setShowEcomFeeAnalysis] = useState<boolean>(true);

  // Tính các chỉ số tổng hợp chi tiết kênh E-Commerce (Khớp P&L Sản phẩm)
  const ecomMetrics = useMemo(() => {
    const shopeeData = channelMatrix.shopee;
    const tikTokData = channelMatrix.tikTokShop;

    const shopeeRev = shopeeData?.totalRevenue || 0;
    const shopeeUnits = shopeeData?.totalUnits || 0;
    const shopeeFee = shopeeData?.totalPlatformFee || 0;
    const shopeeRate = shopeeRev > 0 ? (shopeeFee / shopeeRev) * 100 : 0;

    const tikTokRev = tikTokData?.totalRevenue || 0;
    const tikTokUnits = tikTokData?.totalUnits || 0;
    const tikTokFee = tikTokData?.totalPlatformFee || 0;
    const tikTokRate = tikTokRev > 0 ? (tikTokFee / tikTokRev) * 100 : 0;

    const totalRev = shopeeRev + tikTokRev;
    const totalUnits = shopeeUnits + tikTokUnits;
    const totalFee = shopeeFee + tikTokFee;
    const avgRate = totalRev > 0 ? (totalFee / totalRev) * 100 : 0;

    // Chi tiết từng khoản mục biến phí
    const paymentFee = (shopeeData?.paymentFeeTotal || 0) + (tikTokData?.paymentFeeTotal || 0);
    const commissionFee = (shopeeData?.commissionFeeTotal || 0) + (tikTokData?.commissionFeeTotal || 0);
    const voucherXtraFee = (shopeeData?.voucherXtraFeeTotal || 0) + (tikTokData?.voucherXtraFeeTotal || 0);
    const orderHandlingFee = (shopeeData?.orderHandlingFeeTotal || 0) + (tikTokData?.orderHandlingFeeTotal || 0);
    const compensationFee = (shopeeData?.compensationFeeTotal || 0) + (tikTokData?.compensationFeeTotal || 0);

    // Chi phí tiếp thị trực tiếp D2C (Affiliate & Ads sàn) lấy từ Tab 1
    const affiliateFee = (shopeeData?.affiliateFeeTotal || 0) + (tikTokData?.affiliateFeeTotal || 0);
    const internalAdsFee = (shopeeData?.internalAdsFeeTotal || 0) + (tikTokData?.internalAdsFeeTotal || 0);
    const totalMarketingFee = affiliateFee + internalAdsFee;

    return {
      shopeeRev,
      shopeeUnits,
      shopeeFee,
      shopeeRate,
      shopeePaymentFee: shopeeData?.paymentFeeTotal || 0,
      shopeeCommissionFee: shopeeData?.commissionFeeTotal || 0,
      shopeeXtraFee: shopeeData?.voucherXtraFeeTotal || 0,
      shopeeHandlingFee: shopeeData?.orderHandlingFeeTotal || 0,
      shopeeCompFee: shopeeData?.compensationFeeTotal || 0,
      shopeeAffiliateFee: shopeeData?.affiliateFeeTotal || 0,
      shopeeAdsFee: shopeeData?.internalAdsFeeTotal || 0,

      tikTokRev,
      tikTokUnits,
      tikTokFee,
      tikTokRate,
      tikTokPaymentFee: tikTokData?.paymentFeeTotal || 0,
      tikTokCommissionFee: tikTokData?.commissionFeeTotal || 0,
      tikTokXtraFee: tikTokData?.voucherXtraFeeTotal || 0,
      tikTokHandlingFee: tikTokData?.orderHandlingFeeTotal || 0,
      tikTokCompFee: tikTokData?.compensationFeeTotal || 0,
      tikTokAffiliateFee: tikTokData?.affiliateFeeTotal || 0,
      tikTokAdsFee: tikTokData?.internalAdsFeeTotal || 0,

      totalRev,
      totalUnits,
      totalFee,
      avgRate,
      paymentFee,
      commissionFee,
      voucherXtraFee,
      orderHandlingFee,
      compensationFee,

      affiliateFee,
      internalAdsFee,
      totalMarketingFee,
    };
  }, [channelMatrix]);

  return (
    <div className="space-y-6">
      {/* 1. Header Info & Configuration Sliders */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-700" />
              Cấu Hình Tỷ Trọng Phân Bổ Kênh Bán Hàng (Sales Channel Mix)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tỷ lệ phân bổ sẽ tự động chia nhỏ doanh số và sản lượng theo từng tháng dựa trên bảng giá 4 kênh đã cấu hình ở Tab 2
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
            isTotalValid ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}>
            <span>Tổng Tỷ Trọng: {totalPercentage.toFixed(0)}%</span>
            {!isTotalValid && (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            )}
          </div>
        </div>

        {/* Visual Channel Share Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
            {channels.map((ch) => (
              <div
                key={ch.key}
                style={{ width: `${Math.max(0, ch.percent)}%` }}
                className={`${ch.barColor} transition-all duration-300`}
                title={`${ch.name}: ${ch.percent}%`}
              />
            ))}
          </div>
        </div>

        {/* 4 Channel Input Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {channels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div key={ch.key} className={`p-3.5 rounded-xl ${ch.bgLight} border ${ch.borderLight} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${ch.textDark} flex items-center gap-1.5`}>
                    <Icon className="w-4 h-4" />
                    {ch.name}
                  </span>
                  <div className="flex items-center rounded-lg bg-white border border-slate-300 px-2 py-1 w-20 focus-within:border-emerald-600">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={ch.percent}
                      onChange={(e) => handlePercentChange(ch.key, parseFloat(e.target.value))}
                      className="w-full text-right text-xs font-mono font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-mono ml-1">%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ch.percent}
                  onChange={(e) => handlePercentChange(ch.key, parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate">{ch.description}</span>
                  {ch.percentFeeRate > 0 && (
                    <span className="text-rose-600 font-mono font-medium ml-1 shrink-0" title={`Gồm ${ch.percentFeeRate}% GMV + ${ch.fixedFeePerItem.toLocaleString('vi-VN')} đ/sp cố định`}>
                      Phí: {ch.percentFeeRate}% + {ch.fixedFeePerItem.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Executive KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Tổng Doanh Thu Kênh (Gross)</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-900">
            {grandTotals.revenue.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Phân bổ 4 kênh toàn kỳ
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Tổng Sản Lượng Toàn Kỳ</span>
            <Package className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-base font-bold font-mono text-slate-900">
            {grandTotals.units.toLocaleString('vi-VN')} sp
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Quy đổi theo tỷ trọng 100%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Ước Tính Phí Sàn E-Com</span>
            <CreditCard className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-base font-bold font-mono text-rose-700">
            -{grandTotals.platformFee.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[10px] text-rose-600 font-mono mt-0.5 flex items-center justify-between">
            <span>Hiệu dụng: {ecomMetrics.avgRate.toFixed(1)}% GMV sàn</span>
            <span className="text-slate-400">Shopee + TikTok</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Doanh Thu Thu Về (Net)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-800">
            {grandTotals.netRevenue.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
            Gross trừ tổng phí sàn
          </div>
        </div>
      </div>

      {/* 2.1 BẢNG PHÂN TÍCH CHI TIẾT BIẾN PHÍ & PHÍ SÀN TMĐT (KHỚP CHUẨN LOGIC P&L SẢN PHẨM & LIÊN KẾT TAB 1) */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-rose-50/70 via-orange-50/40 to-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1 rounded-md bg-rose-100 text-rose-700">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm font-['Space_Grotesk']">
                  Bảng tính tổng phí sàn E-Commerce
                </h4>
                <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-mono font-medium">
                  Khớp P&amp;L Sản Phẩm
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono font-medium">
                  Liên kết Tab 1
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tính toán chính xác theo cơ cấu % Doanh thu sàn + Phí cố định/sản phẩm (xử lý đơn + bồi hoàn) từ thông số chung
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowEcomFeeAnalysis(!showEcomFeeAnalysis)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
          >
            {showEcomFeeAnalysis ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Thu gọn phân tích</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span>Xem chi tiết phí ({grandTotals.platformFee.toLocaleString('vi-VN')} đ)</span>
              </>
            )}
          </button>
        </div>

        {showEcomFeeAnalysis && (
          <div className="p-4 space-y-4 bg-slate-50/40">
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3.5">Khoản Mục Biến Phí & Phí Sàn TMĐT</th>
                    <th className="py-2.5 px-3.5 text-center bg-orange-50/60 text-orange-950 min-w-[140px]">
                      Kênh Shopee Mall ({channelMix.shopee}%)
                    </th>
                    <th className="py-2.5 px-3.5 text-center bg-rose-50/60 text-rose-950 min-w-[140px]">
                      Kênh TikTok Shop ({channelMix.tikTokShop}%)
                    </th>
                    <th className="py-2.5 px-3.5 text-center bg-emerald-50/60 text-emerald-950 min-w-[160px]">
                      Tổng Chi Phí E-Com
                    </th>
                    <th className="py-2.5 px-3.5 min-w-[200px]">Cơ Chế Tính & Ghi Chú P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {/* DÒNG GMV / SẢN LƯỢNG */}
                  <tr className="bg-slate-50/60 font-semibold text-slate-900">
                    <td className="py-2 px-3.5 font-sans font-medium">Doanh Thu Kênh Sàn (GMV Gross)</td>
                    <td className="py-2 px-3.5 text-center text-orange-900">
                      {ecomMetrics.shopeeRev.toLocaleString('vi-VN')} đ ({ecomMetrics.shopeeUnits.toLocaleString('vi-VN')} sp)
                    </td>
                    <td className="py-2 px-3.5 text-center text-rose-900">
                      {ecomMetrics.tikTokRev.toLocaleString('vi-VN')} đ ({ecomMetrics.tikTokUnits.toLocaleString('vi-VN')} sp)
                    </td>
                    <td className="py-2 px-3.5 text-center text-emerald-900">
                      {ecomMetrics.totalRev.toLocaleString('vi-VN')} đ ({ecomMetrics.totalUnits.toLocaleString('vi-VN')} sp)
                    </td>
                    <td className="py-2 px-3.5 text-[10px] font-sans text-slate-500 font-normal">
                      Sản lượng × Giá niêm yết theo từng kênh
                    </td>
                  </tr>

                  {/* 1. Phí thanh toán */}
                  <tr>
                    <td className="py-2 px-3.5 font-sans">
                      <span className="font-medium text-slate-800">1. Phí thanh toán sàn</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Payment Processing Fee</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-orange-800">
                      -{ecomMetrics.shopeePaymentFee.toLocaleString('vi-VN')} đ
                      <span className="block text-[10px] text-slate-400">({channels[0].feeDetail.paymentFeeRate}%)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-rose-800">
                      -{ecomMetrics.tikTokPaymentFee.toLocaleString('vi-VN')} đ
                      <span className="block text-[10px] text-slate-400">({channels[1].feeDetail.paymentFeeRate}%)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-slate-900 font-semibold">
                      -{ecomMetrics.paymentFee.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2 px-3.5 text-[10px] font-sans text-slate-500">
                      Khấu trừ trên tổng giá trị thanh toán đơn hàng
                    </td>
                  </tr>

                  {/* 2. Phí hoa hồng sàn */}
                  <tr>
                    <td className="py-2 px-3.5 font-sans">
                      <span className="font-medium text-slate-800">2. Phí hoa hồng cố định sàn</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Platform Commission Fee (Mall)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-orange-800">
                      -{ecomMetrics.shopeeCommissionFee.toLocaleString('vi-VN')} đ
                      <span className="block text-[10px] text-slate-400">({channels[0].feeDetail.commissionRate}%)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-rose-800">
                      -{ecomMetrics.tikTokCommissionFee.toLocaleString('vi-VN')} đ
                      <span className="block text-[10px] text-slate-400">({channels[1].feeDetail.commissionRate}%)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-slate-900 font-semibold">
                      -{ecomMetrics.commissionFee.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2 px-3.5 text-[10px] font-sans text-slate-500">
                      Phí hoa hồng gian hàng chính hãng quy định theo ngành hàng
                    </td>
                  </tr>

                  {/* 3. Phí dịch vụ Voucher Xtra */}
                  <tr>
                    <td className="py-2 px-3.5 font-sans">
                      <span className="font-medium text-slate-800">3. Phí dịch vụ Voucher Xtra / Freeship</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Service Fee / Flash Sale Support</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-orange-800">
                      -{ecomMetrics.shopeeXtraFee.toLocaleString('vi-VN')} đ
                      <span className="block text-[10px] text-slate-400">({channels[0].feeDetail.voucherXtraRate}%)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-rose-800">
                      -{ecomMetrics.tikTokXtraFee.toLocaleString('vi-VN')} đ
                      <span className="block text-[10px] text-slate-400">({channels[1].feeDetail.voucherXtraRate}%)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-slate-900 font-semibold">
                      -{ecomMetrics.voucherXtraFee.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2 px-3.5 text-[10px] font-sans text-slate-500">
                      Hỗ trợ mã giảm giá sàn và trợ giá vận chuyển
                    </td>
                  </tr>

                  {/* 4. Phí xử lý đơn hàng */}
                  <tr>
                    <td className="py-2 px-3.5 font-sans">
                      <span className="font-medium text-slate-800">4. Phí xử lý đơn hàng</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Order Handling &amp; Packaging Fee</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-orange-800">
                      -{ecomMetrics.shopeeHandlingFee.toLocaleString('vi-VN')} đ
                      <span className="block text-[10px] text-slate-400">({channels[0].feeDetail.orderHandlingFeePerItem.toLocaleString('vi-VN')} đ/sp)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-rose-800">
                      -{ecomMetrics.tikTokHandlingFee.toLocaleString('vi-VN')} đ
                      <span className="block text-[10px] text-slate-400">({channels[1].feeDetail.orderHandlingFeePerItem.toLocaleString('vi-VN')} đ/sp)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-slate-900 font-semibold">
                      -{ecomMetrics.orderHandlingFee.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2 px-3.5 text-[10px] font-sans text-slate-500">
                      Định mức cố định tính trên từng đơn vị sản phẩm xuất kho
                    </td>
                  </tr>

                  {/* 5. Phí bồi hoàn sàn */}
                  <tr>
                    <td className="py-2 px-3.5 font-sans">
                      <span className="font-medium text-slate-800">5. Phí bồi hoàn sàn</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Platform Compensation / Return Fee</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-orange-800">
                      -{ecomMetrics.shopeeCompFee.toLocaleString('vi-VN')} đ
                      <span className="block text-[10px] text-slate-400">({channels[0].feeDetail.compensationFeePerItem.toLocaleString('vi-VN')} đ/sp)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-rose-800">
                      -{ecomMetrics.tikTokCompFee.toLocaleString('vi-VN')} đ
                      <span className="block text-[10px] text-slate-400">({channels[1].feeDetail.compensationFeePerItem.toLocaleString('vi-VN')} đ/sp)</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-slate-900 font-semibold">
                      -{ecomMetrics.compensationFee.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2 px-3.5 text-[10px] font-sans text-slate-500">
                      Chi phí dự phòng hàng hoàn, đổi trả và tổn thất vận chuyển
                    </td>
                  </tr>

                  {/* DÒNG TỔNG CỘNG BIẾN PHÍ SÀN */}
                  <tr className="bg-rose-50/80 font-bold text-rose-900 border-t-2 border-rose-200">
                    <td className="py-2.5 px-3.5 font-sans text-xs">
                      Tổng phí E-Commerce
                    </td>
                    <td className="py-2.5 px-3.5 text-center text-rose-700">
                      -{ecomMetrics.shopeeFee.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3.5 text-center text-rose-700">
                      -{ecomMetrics.tikTokFee.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3.5 text-center text-rose-700 text-xs">
                      -{ecomMetrics.totalFee.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3.5 font-sans text-[11px] text-rose-800">
                      Khấu trừ tự động vào Doanh thu thu về (Net)
                    </td>
                  </tr>

                  {/* TỶ LỆ HIỆU DỤNG */}
                  <tr className="bg-rose-100/60 font-bold text-rose-950">
                    <td className="py-2 px-3.5 font-sans text-xs">
                      Tỷ lệ trên GMV
                    </td>
                    <td className="py-2 px-3.5 text-center text-rose-900">
                      {ecomMetrics.shopeeRate.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3.5 text-center text-rose-900">
                      {ecomMetrics.tikTokRate.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3.5 text-center text-rose-900 text-xs">
                      {ecomMetrics.avgRate.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3.5 font-sans text-[10px] text-rose-800 font-normal">
                      Khớp logic tính toán P&L Sản Phẩm từng SKU
                    </td>
                  </tr>

                  {/* HÀNG THAM CHIẾU TIẾP THỊ TRỰC TIẾP D2C (Lấy từ Tab 1) */}
                  <tr className="bg-blue-50/50 border-t-2 border-blue-200 text-blue-950">
                    <td className="py-2.5 px-3.5 font-sans font-semibold">
                      <span>Chi phí D2C</span>
                      <span className="text-[10px] text-blue-600 block font-normal font-sans">Affiliate hoa hồng &amp; Quảng cáo sàn/Live</span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-blue-900">
                      -{ecomMetrics.shopeeAffiliateFee + ecomMetrics.shopeeAdsFee > 0 ? (ecomMetrics.shopeeAffiliateFee + ecomMetrics.shopeeAdsFee).toLocaleString('vi-VN') : 0} đ
                      <span className="block text-[10px] text-blue-600">
                        (Affiliate: {channels[0].directMarketing.affiliateRate}% + Ads: {channels[0].directMarketing.internalAdsRate}%)
                      </span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-blue-900">
                      -{ecomMetrics.tikTokAffiliateFee + ecomMetrics.tikTokAdsFee > 0 ? (ecomMetrics.tikTokAffiliateFee + ecomMetrics.tikTokAdsFee).toLocaleString('vi-VN') : 0} đ
                      <span className="block text-[10px] text-blue-600">
                        (Affiliate: {channels[1].directMarketing.affiliateRate}% + Ads: {channels[1].directMarketing.internalAdsRate}%)
                      </span>
                    </td>
                    <td className="py-2 px-3.5 text-center text-blue-900 font-semibold">
                      -{ecomMetrics.totalMarketingFee.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2 px-3.5 font-sans text-[10px] text-blue-700">
                      Tách bạch theo cơ cấu D2C: nằm ở phần Chi phí Tiếp thị trong P&L Doanh nghiệp
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Toàn bộ dữ liệu phí sàn TMĐT ở bảng này đã được đồng bộ chuẩn hóa với <strong>P&L Sản Phẩm</strong> và <strong>Tab 1. Tham Số Chung</strong>. Mọi thay đổi về phí hoa hồng, thanh toán, xử lý đơn hay tỷ lệ tiếp thị tại Tab 1 sẽ tự động phản ánh vào dự báo phân bổ này.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. BẢNG DOANH SỐ PHÂN BỔ THEO KÊNH BÁN HÀNG & THEO THÁNG (Có Cột Tổng Toàn Kỳ Sticky như ở Sub 1) */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Banner */}
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
            <h3 className="font-bold text-slate-900 text-sm tracking-wide font-['Space_Grotesk'] uppercase">
              DỰ BÁO DOANH SỐ THEO KÊNH BÁN HÀNG
            </h3>
            <span className="text-[11px] text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
              4 Kênh Bán Hàng • Chia theo tháng &amp; Cột tổng toàn kỳ
            </span>
            <span className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">
              {months.length} tháng ({months[0]?.dateStr || ''} → {months[months.length - 1]?.dateStr || ''})
            </span>
          </div>

          {/* Controls: Display mode filter pills & Expand SKU breakdown */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px]">
              <button
                onClick={() => setDisplayMode('both')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  displayMode === 'both' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Doanh số &amp; SL
              </button>
              <button
                onClick={() => setDisplayMode('revenue')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  displayMode === 'revenue' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chỉ Doanh số (Gross)
              </button>
              <button
                onClick={() => setDisplayMode('net')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  displayMode === 'net' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chỉ Net Thu Về
              </button>
              <button
                onClick={() => setDisplayMode('units')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  displayMode === 'units' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chỉ Sản Lượng (sp)
              </button>
            </div>

            <button
              onClick={toggleExpandAll}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              title="Mở rộng hoặc thu gọn chi tiết từng sản phẩm bên trong mỗi kênh"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>{allExpanded ? 'Thu Gọn SKU' : 'Chi Tiết SKU'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse table-auto">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                {/* Cột 1: Kênh Bán Hàng */}
                <th className="py-3 px-3.5 w-[140px] min-w-[140px] max-w-[140px] sticky top-0 left-0 bg-slate-100 z-40 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap">
                  Kênh Bán Hàng
                </th>

                {/* Cột 2: Tỷ Trọng */}
                <th className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky top-0 left-[140px] bg-slate-100 z-40 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap">
                  Tỷ Trọng &amp; Phí Sàn
                </th>

                {/* Cột 3: CỘT TỔNG CỘNG TOÀN KỲ (Nằm kế cột tên kênh, sticky left) */}
                <th className="py-3 px-3.5 w-[170px] min-w-[170px] max-w-[170px] bg-emerald-100 text-emerald-900 border-x border-emerald-200 sticky top-0 left-[300px] z-40 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-bold flex items-center gap-1 text-xs">
                      Tổng Cộng Toàn Kỳ
                    </span>
                    <span className="text-[10px] text-emerald-700 font-normal">
                      (Doanh số &amp; Sản lượng)
                    </span>
                  </div>
                </th>

                {/* Cột 4+: Các tháng/năm */}
                {months.map((m) => (
                  <th
                    key={m.id}
                    className="py-3 px-3 min-w-[115px] text-center border-r border-slate-200 whitespace-nowrap sticky top-0 bg-slate-100 z-30"
                  >
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      {m.label}
                    </span>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5 font-mono">
                      {m.dateStr}
                    </div>
                  </th>
                ))}

                {/* Cột Cuối: Chính Sách Kênh */}
                <th className="py-3 px-4 min-w-[110px] text-center sticky top-0 bg-slate-100 z-30 whitespace-nowrap">
                  <span className="text-[10px] text-slate-500 font-medium">Chính Sách Kênh</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {channels.map((ch) => {
                const chData = channelMatrix[ch.key];
                const isExpanded = !!expandedChannels[ch.key];
                const Icon = ch.icon;

                return (
                  <React.Fragment key={ch.key}>
                    {/* HÀNG KÊNH CHÍNH */}
                    <tr className="hover:bg-slate-50/80 transition-colors font-medium">
                      {/* Cột 1: Kênh Bán Hàng */}
                      <td className="py-3 px-3.5 w-[140px] min-w-[140px] max-w-[140px] sticky left-0 bg-white z-20 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap">
                        <button
                          onClick={() => toggleChannelExpand(ch.key)}
                          className="flex items-center gap-2 text-left w-full group cursor-pointer"
                        >
                          <div className={`p-1 rounded-md ${ch.bgLight} border ${ch.borderLight}`}>
                            <Icon className={`w-3.5 h-3.5 ${ch.textAccent}`} />
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {ch.name}
                          </span>
                          <span className="text-slate-400 ml-auto group-hover:text-slate-700">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                        </button>
                      </td>

                      {/* Cột 2: Tỷ Trọng */}
                      <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[140px] bg-white z-20 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800 text-[11px]">
                            {ch.percent}%
                          </span>
                          {ch.percentFeeRate > 0 || ch.fixedFeePerItem > 0 ? (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-rose-600 font-mono font-bold">
                                Phí: {chData?.effectiveFeeRate.toFixed(1)}% (P&amp;L)
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                ({ch.percentFeeRate}% + {ch.fixedFeePerItem.toLocaleString('vi-VN')}đ/sp)
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-mono">
                              0% phí sàn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: CỘT TỔNG CỘNG TOÀN KỲ (Sticky left, kế cột thông tin) */}
                      <td className="py-3 px-3.5 w-[170px] min-w-[170px] max-w-[170px] bg-emerald-50 border-x border-emerald-200 sticky left-[300px] z-20 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap">
                        {displayMode === 'units' ? (
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {chData?.totalUnits.toLocaleString('vi-VN')} <span className="text-[10px] text-slate-500 font-normal">sp</span>
                          </div>
                        ) : displayMode === 'net' ? (
                          <div>
                            <div className="font-mono font-bold text-emerald-950 text-xs">
                              {chData?.totalNetRevenue.toLocaleString('vi-VN')} đ
                            </div>
                            {chData && chData.totalPlatformFee > 0 && (
                              <div className="text-[10px] text-rose-600 font-mono">
                                Phí: -{chData.totalPlatformFee.toLocaleString('vi-VN')} đ
                              </div>
                            )}
                          </div>
                        ) : displayMode === 'revenue' ? (
                          <div className="font-mono font-bold text-emerald-950 text-xs">
                            {chData?.totalRevenue.toLocaleString('vi-VN')} đ
                          </div>
                        ) : (
                          <div>
                            <div className="font-mono font-bold text-emerald-950 text-xs">
                              {chData?.totalRevenue.toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-[10px] text-slate-600 font-mono flex items-center justify-between mt-0.5">
                              <span>{chData?.totalUnits.toLocaleString('vi-VN')} sp</span>
                              {chData && chData.totalPlatformFee > 0 && (
                                <span className="text-emerald-700 font-medium ml-1">
                                  Net: {chData.totalNetRevenue.toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Cột 4+: Các tháng bán hàng */}
                      {months.map((m) => {
                        const mData = chData?.months[m.id];
                        const mRev = mData?.revenue || 0;
                        const mUnits = mData?.units || 0;
                        const mNet = mData?.netRevenue || 0;

                        return (
                          <td key={m.id} className="py-2.5 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                            {mRev > 0 || mUnits > 0 ? (
                              <div>
                                {displayMode === 'units' ? (
                                  <span className="font-bold text-slate-900 font-mono text-xs">
                                    {mUnits.toLocaleString('vi-VN')} sp
                                  </span>
                                ) : displayMode === 'net' ? (
                                  <div>
                                    <span className="font-bold text-emerald-900 font-mono text-xs">
                                      {mNet.toLocaleString('vi-VN')} đ
                                    </span>
                                    {mData && mData.platformFee > 0 && (
                                      <div className="text-[9px] text-rose-600 font-mono">
                                        -{mData.platformFee.toLocaleString('vi-VN')}
                                      </div>
                                    )}
                                  </div>
                                ) : displayMode === 'revenue' ? (
                                  <span className="font-bold text-slate-900 font-mono text-xs">
                                    {mRev.toLocaleString('vi-VN')} đ
                                  </span>
                                ) : (
                                  <div>
                                    <span className="font-bold text-slate-900 font-mono text-xs">
                                      {mRev.toLocaleString('vi-VN')} đ
                                    </span>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      {mUnits.toLocaleString('vi-VN')} sp
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Cột Cuối: Chính sách kênh */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${ch.bgLight} ${ch.borderLight} ${ch.textDark} font-medium`}>
                          {ch.percentFeeRate > 0 || ch.fixedFeePerItem > 0 ? `Biến phí P&L (${chData?.effectiveFeeRate.toFixed(1)}%)` : 'Kênh Trực Tiếp'}
                        </span>
                      </td>
                    </tr>

                    {/* HÀNG CHI TIẾT TỪNG SẢN PHẨM (KHI BẤM EXPAND KÊNH) */}
                    {isExpanded && chData?.skuBreakdown.map((skuItem) => {
                      if (skuItem.totalUnits === 0 && totalVolume > 0) return null;

                      return (
                        <tr key={`${ch.key}-${skuItem.sku.id}`} className="bg-slate-50/50 hover:bg-slate-100/60 transition-colors text-[11px]">
                          {/* Mã SKU thụt dòng */}
                          <td className="py-2 px-3.5 w-[140px] min-w-[140px] max-w-[140px] sticky left-0 bg-slate-50 z-20 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap pl-7">
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700">
                              {skuItem.sku.skuCode}
                            </span>
                          </td>

                          {/* Tên SKU & Đơn giá kênh */}
                          <td className="py-2 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[140px] bg-slate-50 z-20 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                            <div className="text-slate-700 truncate font-medium text-[11px]" title={skuItem.sku.name}>
                              {skuItem.sku.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Giá kênh: {skuItem.channelPrice.toLocaleString('vi-VN')} đ
                            </div>
                          </td>

                          {/* Tổng SKU Toàn kỳ trong kênh này */}
                          <td className="py-2 px-3.5 w-[170px] min-w-[170px] max-w-[170px] bg-emerald-50 border-x border-emerald-200 sticky left-[300px] z-20 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap">
                            <div className="font-mono font-semibold text-slate-800 text-[11px]">
                              {skuItem.totalRevenue.toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                              <span>{skuItem.totalUnits.toLocaleString('vi-VN')} sp</span>
                              {skuItem.totalPlatformFee > 0 && (
                                <span className="text-rose-600 font-mono text-[9px] font-medium ml-1">
                                  -Phí: {skuItem.totalPlatformFee.toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Từng tháng cho SKU */}
                          {months.map((m) => {
                            const sMonth = skuItem.months[m.id];
                            const sRev = sMonth?.revenue || 0;
                            const sUnits = sMonth?.units || 0;

                            return (
                              <td key={m.id} className="py-1.5 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                                {sRev > 0 || sUnits > 0 ? (
                                  <div>
                                    <div className="font-mono text-slate-800 text-[11px]">
                                      {displayMode === 'net' 
                                        ? `${(sRev - (sMonth?.platformFee || 0)).toLocaleString('vi-VN')} đ`
                                        : `${sRev.toLocaleString('vi-VN')} đ`
                                      }
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-mono">
                                      {sUnits.toLocaleString('vi-VN')} sp
                                      {sMonth && sMonth.platformFee > 0 && displayMode !== 'units' && (
                                        <span className="text-rose-500 ml-1">(-{sMonth.platformFee.toLocaleString('vi-VN')})</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 font-mono">-</span>
                                )}
                              </td>
                            );
                          })}

                          <td className="py-1.5 px-4 text-center whitespace-nowrap">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {skuItem.channelPrice.toLocaleString('vi-VN')} đ
                            </span>
                            {skuItem.totalPlatformFee > 0 && (
                              <div className="text-[9px] text-rose-600 font-mono font-medium">
                                Phí: {((skuItem.totalPlatformFee / skuItem.totalRevenue) * 100).toFixed(1)}%
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* FOOTER: CÁC DÒNG TỔNG HỢP TOÀN KỲ & THEO THÁNG */}
            <tfoot>
              {/* DÒNG 1: TỔNG DOANH THU KÊNH (GROSS) */}
              <tr className="bg-emerald-50/80 border-t-2 border-emerald-300 font-bold text-xs text-emerald-950">
                <td className="py-3 px-3.5 w-[140px] min-w-[140px] max-w-[140px] sticky left-0 bg-emerald-100 z-20 border-r border-emerald-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap">
                  TỔNG DOANH SỐ (GROSS)
                </td>
                <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[140px] bg-emerald-100 z-20 border-r border-emerald-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-[11px] text-emerald-800 font-mono">
                  Tổng 4 kênh ({totalPercentage.toFixed(0)}%)
                </td>
                <td className="py-3 px-3.5 w-[170px] min-w-[170px] max-w-[170px] sticky left-[300px] z-20 bg-emerald-200 border-x border-emerald-300 font-mono font-bold text-emerald-950 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs whitespace-nowrap">
                  {grandTotals.revenue.toLocaleString('vi-VN')} đ
                </td>
                {months.map((m) => {
                  const mRev = grandMonthlyTotals[m.id]?.revenue || 0;
                  return (
                    <td key={m.id} className="py-3 px-3 text-center font-mono font-bold text-emerald-950 border-r border-slate-200 whitespace-nowrap bg-emerald-50/60">
                      {mRev > 0 ? `${mRev.toLocaleString('vi-VN')} đ` : '-'}
                    </td>
                  );
                })}
                <td className="py-3 px-4 text-center whitespace-nowrap text-[10px] text-emerald-800 font-mono">
                  100% doanh số
                </td>
              </tr>

              {/* DÒNG 2: TỔNG SẢN LƯỢNG KÊNH (UNITS) */}
              <tr className="bg-slate-50 border-t border-slate-200 text-xs text-slate-800">
                <td className="py-2.5 px-3.5 w-[140px] min-w-[140px] max-w-[140px] sticky left-0 bg-slate-100 z-20 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] font-semibold whitespace-nowrap">
                  TỔNG SẢN LƯỢNG (SP)
                </td>
                <td className="py-2.5 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[140px] bg-slate-100 z-20 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-[11px] text-slate-500 font-mono">
                  Hàng bán phân bổ
                </td>
                <td className="py-2.5 px-3.5 w-[170px] min-w-[170px] max-w-[170px] sticky left-[300px] z-20 bg-slate-200 border-x border-slate-300 font-mono font-bold text-slate-900 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs whitespace-nowrap">
                  {grandTotals.units.toLocaleString('vi-VN')} sp
                </td>
                {months.map((m) => {
                  const mUnits = grandMonthlyTotals[m.id]?.units || 0;
                  return (
                    <td key={m.id} className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                      {mUnits > 0 ? `${mUnits.toLocaleString('vi-VN')} sp` : '-'}
                    </td>
                  );
                })}
                <td className="py-2.5 px-4 text-center whitespace-nowrap text-[10px] text-slate-500 font-mono">
                  Khớp bảng dự báo
                </td>
              </tr>

              {/* DÒNG 3: ƯỚC TÍNH PHÍ SÀN */}
              <tr className="bg-rose-50/50 border-t border-rose-200 text-xs text-rose-900">
                <td className="py-2.5 px-3.5 w-[140px] min-w-[140px] max-w-[140px] sticky left-0 bg-rose-100 z-20 border-r border-rose-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] font-semibold whitespace-nowrap">
                  PHÍ SÀN ƯỚC TÍNH
                </td>
                <td className="py-2.5 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[140px] bg-rose-100 z-20 border-r border-rose-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-[11px] text-rose-700 font-mono">
                  Biến phí TMĐT ({ecomMetrics.avgRate.toFixed(1)}%)
                </td>
                <td className="py-2.5 px-3.5 w-[170px] min-w-[170px] max-w-[170px] sticky left-[300px] z-20 bg-rose-200 border-x border-rose-300 font-mono font-bold text-rose-700 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs whitespace-nowrap">
                  -{grandTotals.platformFee.toLocaleString('vi-VN')} đ
                </td>
                {months.map((m) => {
                  const mFee = grandMonthlyTotals[m.id]?.platformFee || 0;
                  return (
                    <td key={m.id} className="py-2.5 px-3 text-center font-mono text-rose-700 border-r border-slate-200 whitespace-nowrap">
                      {mFee > 0 ? `-${mFee.toLocaleString('vi-VN')} đ` : '-'}
                    </td>
                  );
                })}
                <td className="py-2.5 px-4 text-center whitespace-nowrap text-[10px] text-rose-600 font-mono">
                  Shopee &amp; TikTok
                </td>
              </tr>

              {/* DÒNG 4: DOANH THU THU VỀ (NET REVENUE) */}
              <tr className="bg-emerald-100/70 border-t border-emerald-300 font-bold text-xs text-emerald-950">
                <td className="py-3 px-3.5 w-[140px] min-w-[140px] max-w-[140px] sticky left-0 bg-emerald-200 z-20 border-r border-emerald-300 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap">
                  DOANH THU THU VỀ (NET)
                </td>
                <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[140px] bg-emerald-200 z-20 border-r border-emerald-300 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-[11px] text-emerald-800 font-mono">
                  Gross trừ phí sàn
                </td>
                <td className="py-3 px-3.5 w-[170px] min-w-[170px] max-w-[170px] sticky left-[300px] z-20 bg-emerald-300 border-x border-emerald-400 font-mono font-bold text-emerald-950 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs whitespace-nowrap">
                  {grandTotals.netRevenue.toLocaleString('vi-VN')} đ
                </td>
                {months.map((m) => {
                  const mNet = grandMonthlyTotals[m.id]?.netRevenue || 0;
                  return (
                    <td key={m.id} className="py-3 px-3 text-center font-mono font-bold text-emerald-900 border-r border-slate-200 whitespace-nowrap bg-emerald-100/50">
                      {mNet > 0 ? `${mNet.toLocaleString('vi-VN')} đ` : '-'}
                    </td>
                  );
                })}
                <td className="py-3 px-4 text-center whitespace-nowrap text-[10px] text-emerald-900 font-mono font-bold">
                  Thực nhận
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

