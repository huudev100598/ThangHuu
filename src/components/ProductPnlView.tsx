import React, { useState, useMemo, useEffect } from 'react';
import { ProductSku, Sheet3CogsData, ProductCategory, ProductQuotation } from '../types/sku';
import { SalesMonth, SalesVolumeMap } from '../types/salesForecast';
import { ProjectParameters } from '../types/financial';
import { 
  SlidersHorizontal, 
  Layers, 
  Store, 
  Building2, 
  ShoppingBag, 
  Edit3, 
  Save, 
  Info, 
  RotateCcw, 
  Settings2, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Package, 
  TrendingUp, 
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export type ChannelKey = 'shopee' | 'tiktok' | 'b2b' | 'retail';

interface ProductPnlViewProps {
  skus: ProductSku[];
  categories: ProductCategory[];
  months: SalesMonth[];
  volumes: SalesVolumeMap;
  sheet3CogsMap: Record<string, Sheet3CogsData>;
  parameters: ProjectParameters;
  quotations?: ProductQuotation[];
  onUpdateSkuPrice?: (
    skuId: string, 
    channel: 'standard' | 'shopee' | 'tikTokShop' | 'retail' | 'b2b', 
    value: number
  ) => void;
}

export const ProductPnlView: React.FC<ProductPnlViewProps> = ({
  skus,
  categories,
  months,
  volumes,
  sheet3CogsMap,
  parameters,
  quotations = [],
  onUpdateSkuPrice,
}) => {
  // 1. Lựa chọn sản phẩm từ Danh mục SKU
  // Ưu tiên chọn sản phẩm 'sku-scrub-150' hoặc SKU đầu tiên
  const [selectedSkuId, setSelectedSkuId] = useState<string>(() => {
    const scrub = skus.find((s) => s.id.includes('scrub') || s.name.toLowerCase().includes('tẩy tế bào'));
    return scrub ? scrub.id : (skus[0]?.id || '');
  });

  // Tìm kiếm SKU khi chọn
  const [skuSearchQuery, setSkuSearchQuery] = useState<string>('');
  const [isSkuDropdownOpen, setIsSkuDropdownOpen] = useState<boolean>(false);

  // 2. Kênh bán hàng đang chọn
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('shopee');

  // 3. State lưu giá niêm yết tùy chỉnh cho từng SKU và từng Kênh
  // Map: [skuId]: { shopee: number, tiktok: number, b2b: number, retail: number }
  const [priceOverrides, setPriceOverrides] = useState<Record<string, Record<ChannelKey, number>>>({});

  // 4. State lưu COGS & MOQ tùy chỉnh (nếu muốn thử kịch bản khác)
  const [customCogsMap, setCustomCogsMap] = useState<Record<string, { cogs: number; moq: number }>>({});

  // 5. Báo giá đang chọn từ Sheet 3 (nếu có nhiều báo giá)
  const [selectedQuoteIdMap, setSelectedQuoteIdMap] = useState<Record<string, string>>({});

  // 6. Panel cấu hình thông số mô phỏng (cho phép sửa trực tiếp các tham số)
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // 7. Thông số mô phỏng có thể chỉnh sửa trực tiếp (được đồng bộ mặc định từ Tab 1)
  const [simParams, setSimParams] = useState(() => ({
    vatRate: parameters.taxAndCapital?.vatOutputRate ?? 8.0,
    // Shopee
    shopee: {
      paymentFeeRate: parameters.platformFees?.shopee?.paymentFeeRate ?? 6.0,
      commissionRate: parameters.platformFees?.shopee?.platformCommissionRate ?? 17.0,
      voucherXtraRate: parameters.platformFees?.shopee?.voucherXtraRate ?? 5.5,
      orderHandlingFee: parameters.platformFees?.shopee?.orderHandlingFeePerItem ?? 3000,
      compensationFee: parameters.platformFees?.shopee?.compensationFeePerItem ?? 2700,
      affiliateRate: parameters.d2cFees?.shopeeAffiliateRate ?? parameters.d2cFees?.affiliateRate ?? 8.0,
      internalAdsRate: parameters.d2cFees?.shopeeInternalAdsRate ?? parameters.d2cFees?.internalAdsRate ?? 5.0,
      packagingRate: parameters.platformFees?.shopee?.packagingAndWarehousingRate ?? 2.0,
      storageLossRate: parameters.platformFees?.shopee?.shrinkageRate ?? 1.0,
    },
    // TikTok Shop
    tiktok: {
      paymentFeeRate: parameters.platformFees?.tikTokShop?.paymentFeeRate ?? 6.0,
      commissionRate: parameters.platformFees?.tikTokShop?.platformCommissionRate ?? 15.5,
      voucherXtraRate: parameters.platformFees?.tikTokShop?.voucherXtraRate ?? 5.0,
      orderHandlingFee: parameters.platformFees?.tikTokShop?.orderHandlingFeePerItem ?? 3000,
      compensationFee: parameters.platformFees?.tikTokShop?.compensationFeePerItem ?? 2008,
      affiliateRate: parameters.d2cFees?.tikTokAffiliateRate ?? parameters.d2cFees?.affiliateRate ?? 8.0,
      internalAdsRate: parameters.d2cFees?.tikTokInternalAdsRate ?? parameters.d2cFees?.internalAdsRate ?? 5.0,
      packagingRate: parameters.platformFees?.tikTokShop?.packagingAndWarehousingRate ?? 2.0,
      storageLossRate: parameters.platformFees?.tikTokShop?.shrinkageRate ?? 1.0,
    },
    // B2B
    b2b: {
      discountRate: 50.0,
      vatRate: parameters.taxAndCapital?.vatOutputRate ?? 8.0,
      logisticsRate: 5.0,
      packagingRate: 2.0,
      storageLossRate: 1.0,
    },
    // Retail
    retail: {
      discountRate: 25.0,
      vatRate: parameters.taxAndCapital?.vatOutputRate ?? 8.0,
      shippingCod: 25000,
      packagingRate: 2.0,
      storageLossRate: 1.0,
    },
  }));

  // Đồng bộ lại simParams khi parameters từ Tab 1 thay đổi
  useEffect(() => {
    setSimParams((prev) => ({
      ...prev,
      vatRate: parameters.taxAndCapital?.vatOutputRate ?? 8.0,
      shopee: {
        ...prev.shopee,
        paymentFeeRate: parameters.platformFees?.shopee?.paymentFeeRate ?? 6.0,
        commissionRate: parameters.platformFees?.shopee?.platformCommissionRate ?? 17.0,
        voucherXtraRate: parameters.platformFees?.shopee?.voucherXtraRate ?? 5.5,
        orderHandlingFee: parameters.platformFees?.shopee?.orderHandlingFeePerItem ?? 3000,
        compensationFee: parameters.platformFees?.shopee?.compensationFeePerItem ?? 2700,
        affiliateRate: parameters.d2cFees?.shopeeAffiliateRate ?? parameters.d2cFees?.affiliateRate ?? 8.0,
        internalAdsRate: parameters.d2cFees?.shopeeInternalAdsRate ?? parameters.d2cFees?.internalAdsRate ?? 5.0,
        packagingRate: parameters.platformFees?.shopee?.packagingAndWarehousingRate ?? 2.0,
        storageLossRate: parameters.platformFees?.shopee?.shrinkageRate ?? 1.0,
      },
      tiktok: {
        ...prev.tiktok,
        paymentFeeRate: parameters.platformFees?.tikTokShop?.paymentFeeRate ?? 6.0,
        commissionRate: parameters.platformFees?.tikTokShop?.platformCommissionRate ?? 15.5,
        voucherXtraRate: parameters.platformFees?.tikTokShop?.voucherXtraRate ?? 5.0,
        orderHandlingFee: parameters.platformFees?.tikTokShop?.orderHandlingFeePerItem ?? 3000,
        compensationFee: parameters.platformFees?.tikTokShop?.compensationFeePerItem ?? 2008,
        affiliateRate: parameters.d2cFees?.tikTokAffiliateRate ?? parameters.d2cFees?.affiliateRate ?? 8.0,
        internalAdsRate: parameters.d2cFees?.tikTokInternalAdsRate ?? parameters.d2cFees?.internalAdsRate ?? 5.0,
        packagingRate: parameters.platformFees?.tikTokShop?.packagingAndWarehousingRate ?? 2.0,
        storageLossRate: parameters.platformFees?.tikTokShop?.shrinkageRate ?? 1.0,
      },
      b2b: {
        ...prev.b2b,
        vatRate: parameters.taxAndCapital?.vatOutputRate ?? 8.0,
      },
      retail: {
        ...prev.retail,
        vatRate: parameters.taxAndCapital?.vatOutputRate ?? 8.0,
      },
    }));
  }, [parameters]);

  // SKU được chọn hiện tại
  const selectedSku = useMemo(() => {
    return skus.find((s) => s.id === selectedSkuId) || skus[0];
  }, [skus, selectedSkuId]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedSku?.categoryId);
  }, [categories, selectedSku]);

  // Xác định đơn vị tính (chai, hũ, tuýp, combo...)
  const productUnit = useMemo(() => {
    if (!selectedSku) return 'sp';
    if (selectedSku.type === 'combo') return 'set';
    const vol = (selectedSku.volume || '').toLowerCase();
    const name = selectedSku.name.toLowerCase();
    if (vol.includes('ml') || name.includes('chai') || name.includes('serum') || name.includes('xịt') || name.includes('spray') || name.includes('gel')) {
      return 'chai';
    }
    if (vol.includes('g') || vol.includes('gram') || name.includes('hũ') || name.includes('scrub')) {
      return 'chai'; // giữ 'chai' đồng bộ với mock chuẩn của user hoặc hũ
    }
    return 'chai';
  }, [selectedSku]);

  // Các báo giá của SKU này từ Sheet 3
  const skuQuotations = useMemo(() => {
    if (!selectedSku) return [];
    return quotations.filter((q) => q.skuId === selectedSku.id);
  }, [quotations, selectedSku]);

  // Xác định Giá Vốn (COGS) và MOQ cho SKU đang chọn
  const { currentCogs, currentMoq, currentFactory } = useMemo(() => {
    if (!selectedSku) {
      return { currentCogs: 39130, currentMoq: 2000, currentFactory: 'Nhà máy chốt OEM' };
    }

    // 1. Kiểm tra nếu người dùng đã nhập tùy chỉnh trực tiếp
    if (customCogsMap[selectedSku.id]) {
      return {
        currentCogs: customCogsMap[selectedSku.id].cogs,
        currentMoq: customCogsMap[selectedSku.id].moq,
        currentFactory: 'Tùy chỉnh mô phỏng',
      };
    }

    // 2. Kiểm tra nếu có báo giá được chọn thủ công trong dropdown
    const chosenQuoteId = selectedQuoteIdMap[selectedSku.id];
    if (chosenQuoteId) {
      const q = skuQuotations.find((item) => item.id === chosenQuoteId);
      if (q) {
        return {
          currentCogs: q.unitPrice,
          currentMoq: q.moq,
          currentFactory: q.factoryName,
        };
      }
    }

    // 3. Kiểm tra báo giá có isChosen = true trong danh sách báo giá Sheet 3
    const activeQuote = skuQuotations.find((q) => q.isChosen);
    if (activeQuote) {
      return {
        currentCogs: activeQuote.unitPrice,
        currentMoq: activeQuote.moq,
        currentFactory: activeQuote.factoryName,
      };
    }

    // 4. Lấy từ sheet3CogsMap
    const sheet3Data = sheet3CogsMap[selectedSku.id];
    if (sheet3Data && sheet3Data.cogsPerUnit > 0) {
      return {
        currentCogs: sheet3Data.cogsPerUnit,
        currentMoq: sheet3Data.moq || 2000,
        currentFactory: sheet3Data.factoryName || 'Nhà máy chốt OEM',
      };
    }

    // 5. Nếu là Combo: cộng dồn từ các SKU con
    if (selectedSku.type === 'combo' && selectedSku.comboItems) {
      const comboCogs = selectedSku.comboItems.reduce((acc, ci) => {
        const itemCogs = sheet3CogsMap[ci.skuId]?.cogsPerUnit || 0;
        return acc + itemCogs * ci.quantity;
      }, 0);
      if (comboCogs > 0) {
        return {
          currentCogs: comboCogs,
          currentMoq: 1000,
          currentFactory: 'Đóng gói tổng hợp Combo',
        };
      }
    }

    // 6. Mặc định theo hình mẫu: 39.130 đ/chai, MOQ 2000
    return {
      currentCogs: 39130,
      currentMoq: 2000,
      currentFactory: 'Phương án OEM tiêu chuẩn',
    };
  }, [selectedSku, customCogsMap, selectedQuoteIdMap, skuQuotations, sheet3CogsMap]);

  // Giá niêm yết cho từng kênh
  const getPriceForChannel = (channel: ChannelKey): number => {
    if (!selectedSku) return 249000;
    // Kiểm tra override đã sửa tay chưa
    const override = priceOverrides[selectedSku.id]?.[channel];
    if (typeof override === 'number') return override;

    // Giá mặc định từ SKU
    if (channel === 'shopee') return selectedSku.prices?.shopee || selectedSku.prices?.standard || 249000;
    if (channel === 'tiktok') return selectedSku.prices?.tikTokShop || selectedSku.prices?.standard || 249000;
    if (channel === 'b2b') return selectedSku.prices?.b2b || selectedSku.prices?.standard || 249000;
    if (channel === 'retail') return selectedSku.prices?.retail || selectedSku.prices?.standard || 249000;
    return 249000;
  };

  const handlePriceChange = (channel: ChannelKey, newPrice: number) => {
    if (!selectedSku) return;
    setPriceOverrides((prev) => ({
      ...prev,
      [selectedSku.id]: {
        ...(prev[selectedSku.id] || {}),
        [channel]: newPrice,
      },
    }));
  };

  // Lưu giá vào SKU catalog chính
  const handleSavePriceToCatalog = (channel: ChannelKey) => {
    if (!selectedSku || !onUpdateSkuPrice) return;
    const price = getPriceForChannel(channel);
    const skuChannelMap: Record<ChannelKey, 'shopee' | 'tikTokShop' | 'b2b' | 'retail'> = {
      shopee: 'shopee',
      tiktok: 'tikTokShop',
      b2b: 'b2b',
      retail: 'retail',
    };
    onUpdateSkuPrice(selectedSku.id, skuChannelMap[channel], price);
    setSaveSuccessMsg(`Đã lưu ${price.toLocaleString('vi-VN')} đ vào giá kênh ${channel.toUpperCase()} của SKU!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Format Helper
  const formatVnd = (val: number): string => {
    return Math.round(val).toLocaleString('vi-VN');
  };

  const formatPercent = (val: number): string => {
    return `${val >= 0 ? '' : '-'}${Math.abs(val).toFixed(1)}%`;
  };

  // ==========================================
  // TÍNH TOÁN P&L THEO 4 KÊNH BÁN HÀNG
  // ==========================================

  // 1. KÊNH SHOPEE
  const shopeeGrossPrice = getPriceForChannel('shopee');
  const shopeeVatRate = simParams.vatRate;
  // Net Revenue = GrossPrice / (1 + vatRate / 100)
  const shopeeNetRevenue = Math.round(shopeeGrossPrice / (1 + shopeeVatRate / 100));
  const shopeeVatAmount = shopeeGrossPrice - shopeeNetRevenue;

  // Biến phí & Phí sàn Shopee
  const shopeePaymentFee = Math.round(shopeeGrossPrice * (simParams.shopee.paymentFeeRate / 100));
  const shopeeCommissionFee = Math.round(shopeeGrossPrice * (simParams.shopee.commissionRate / 100));
  const shopeeVoucherXtraFee = Math.round(shopeeGrossPrice * (simParams.shopee.voucherXtraRate / 100));
  const shopeeOrderHandlingFee = simParams.shopee.orderHandlingFee;
  const shopeeCompensationFee = simParams.shopee.compensationFee;
  const shopeeTotalPlatformFee = 
    shopeePaymentFee + shopeeCommissionFee + shopeeVoucherXtraFee + shopeeOrderHandlingFee + shopeeCompensationFee;

  // Tiếp thị trực tiếp Shopee
  const shopeeAffiliateFee = Math.round(shopeeGrossPrice * (simParams.shopee.affiliateRate / 100));
  const shopeeInternalAdsFee = Math.round(shopeeGrossPrice * (simParams.shopee.internalAdsRate / 100));
  const shopeeTotalMarketingFee = shopeeAffiliateFee + shopeeInternalAdsFee;

  // Giá vốn & Chi phí đóng gói, hao hụt
  const shopeeCogs = currentCogs;
  const shopeePackagingFee = Math.round(shopeeGrossPrice * (simParams.shopee.packagingRate / 100));
  const shopeeStorageLossFee = Math.round(shopeeGrossPrice * (simParams.shopee.storageLossRate / 100));

  // Lợi nhuận gộp Shopee (CM2)
  const shopeeGrossProfit = 
    shopeeNetRevenue - shopeeTotalPlatformFee - shopeeTotalMarketingFee - shopeeCogs - shopeePackagingFee - shopeeStorageLossFee;
  const shopeeGrossProfitMargin = shopeeNetRevenue > 0 ? (shopeeGrossProfit / shopeeNetRevenue) * 100 : 0;

  // 2. KÊNH TIKTOK SHOP
  const tiktokGrossPrice = getPriceForChannel('tiktok');
  const tiktokVatRate = simParams.vatRate;
  const tiktokNetRevenue = Math.round(tiktokGrossPrice / (1 + tiktokVatRate / 100));
  const tiktokVatAmount = tiktokGrossPrice - tiktokNetRevenue;

  const tiktokPaymentFee = Math.round(tiktokGrossPrice * (simParams.tiktok.paymentFeeRate / 100));
  const tiktokCommissionFee = Math.round(tiktokGrossPrice * (simParams.tiktok.commissionRate / 100));
  const tiktokVoucherXtraFee = Math.round(tiktokGrossPrice * (simParams.tiktok.voucherXtraRate / 100));
  const tiktokOrderHandlingFee = simParams.tiktok.orderHandlingFee;
  const tiktokCompensationFee = simParams.tiktok.compensationFee;
  const tiktokTotalPlatformFee = 
    tiktokPaymentFee + tiktokCommissionFee + tiktokVoucherXtraFee + tiktokOrderHandlingFee + tiktokCompensationFee;

  const tiktokAffiliateFee = Math.round(tiktokGrossPrice * (simParams.tiktok.affiliateRate / 100));
  const tiktokInternalAdsFee = Math.round(tiktokGrossPrice * (simParams.tiktok.internalAdsRate / 100));
  const tiktokTotalMarketingFee = tiktokAffiliateFee + tiktokInternalAdsFee;

  const tiktokCogs = currentCogs;
  const tiktokPackagingFee = Math.round(tiktokGrossPrice * (simParams.tiktok.packagingRate / 100));
  const tiktokStorageLossFee = Math.round(tiktokGrossPrice * (simParams.tiktok.storageLossRate / 100));

  const tiktokGrossProfit = 
    tiktokNetRevenue - tiktokTotalPlatformFee - tiktokTotalMarketingFee - tiktokCogs - tiktokPackagingFee - tiktokStorageLossFee;
  const tiktokGrossProfitMargin = tiktokNetRevenue > 0 ? (tiktokGrossProfit / tiktokNetRevenue) * 100 : 0;

  // 3. KÊNH B2B (GT / MT / SPA)
  const b2bBasePrice = getPriceForChannel('b2b');
  const b2bDiscountAmount = Math.round(b2bBasePrice * (simParams.b2b.discountRate / 100));
  const b2bNetRevenue = b2bBasePrice - b2bDiscountAmount;
  const b2bVatOutputAmount = Math.round(b2bNetRevenue * (simParams.b2b.vatRate / 100));
  const b2bLogisticsFee = Math.round(b2bNetRevenue * (simParams.b2b.logisticsRate / 100));
  const b2bCogs = currentCogs;
  const b2bPackagingFee = Math.round(b2bBasePrice * (simParams.b2b.packagingRate / 100));
  const b2bStorageLossFee = Math.round(b2bBasePrice * (simParams.b2b.storageLossRate / 100));

  const b2bGrossProfit = b2bNetRevenue - b2bLogisticsFee - b2bCogs - b2bPackagingFee - b2bStorageLossFee;
  const b2bGrossProfitMargin = b2bNetRevenue > 0 ? (b2bGrossProfit / b2bNetRevenue) * 100 : 0;

  // 4. KÊNH RETAIL TRỰC TIẾP
  const retailGrossPrice = getPriceForChannel('retail');
  const retailDiscountAmount = Math.round(retailGrossPrice * (simParams.retail.discountRate / 100));
  const retailPriceAfterDiscount = retailGrossPrice - retailDiscountAmount;
  const retailVatRate = simParams.retail.vatRate;
  const retailNetRevenue = Math.round(retailPriceAfterDiscount / (1 + retailVatRate / 100));
  const retailVatAmount = retailPriceAfterDiscount - retailNetRevenue;

  const retailShippingCod = simParams.retail.shippingCod;
  const retailCogs = currentCogs;
  const retailPackagingFee = Math.round(retailGrossPrice * (simParams.retail.packagingRate / 100));
  const retailStorageLossFee = Math.round(retailGrossPrice * (simParams.retail.storageLossRate / 100));

  const retailGrossProfit = 
    retailNetRevenue - retailShippingCod - retailCogs - retailPackagingFee - retailStorageLossFee;
  const retailGrossProfitMargin = retailNetRevenue > 0 ? (retailGrossProfit / retailNetRevenue) * 100 : 0;


  // Khôi phục tất cả thông số mặc định từ Tab 1
  const handleResetSimParams = () => {
    setSimParams({
      vatRate: parameters.taxAndCapital?.vatOutputRate ?? 8.0,
      shopee: {
        paymentFeeRate: parameters.platformFees?.shopee?.paymentFeeRate ?? 6.0,
        commissionRate: parameters.platformFees?.shopee?.platformCommissionRate ?? 17.0,
        voucherXtraRate: parameters.platformFees?.shopee?.voucherXtraRate ?? 5.5,
        orderHandlingFee: parameters.platformFees?.shopee?.orderHandlingFeePerItem ?? 3000,
        compensationFee: parameters.platformFees?.shopee?.compensationFeePerItem ?? 2700,
        affiliateRate: parameters.d2cFees?.shopeeAffiliateRate ?? parameters.d2cFees?.affiliateRate ?? 8.0,
        internalAdsRate: parameters.d2cFees?.shopeeInternalAdsRate ?? parameters.d2cFees?.internalAdsRate ?? 5.0,
        packagingRate: parameters.platformFees?.shopee?.packagingAndWarehousingRate ?? 2.0,
        storageLossRate: parameters.platformFees?.shopee?.shrinkageRate ?? 1.0,
      },
      tiktok: {
        paymentFeeRate: parameters.platformFees?.tikTokShop?.paymentFeeRate ?? 6.0,
        commissionRate: parameters.platformFees?.tikTokShop?.platformCommissionRate ?? 15.5,
        voucherXtraRate: parameters.platformFees?.tikTokShop?.voucherXtraRate ?? 5.0,
        orderHandlingFee: parameters.platformFees?.tikTokShop?.orderHandlingFeePerItem ?? 3000,
        compensationFee: parameters.platformFees?.tikTokShop?.compensationFeePerItem ?? 2008,
        affiliateRate: parameters.d2cFees?.tikTokAffiliateRate ?? parameters.d2cFees?.affiliateRate ?? 8.0,
        internalAdsRate: parameters.d2cFees?.tikTokInternalAdsRate ?? parameters.d2cFees?.internalAdsRate ?? 5.0,
        packagingRate: parameters.platformFees?.tikTokShop?.packagingAndWarehousingRate ?? 2.0,
        storageLossRate: parameters.platformFees?.tikTokShop?.shrinkageRate ?? 1.0,
      },
      b2b: {
        discountRate: 50.0,
        vatRate: parameters.taxAndCapital?.vatOutputRate ?? 8.0,
        logisticsRate: 5.0,
        packagingRate: 2.0,
        storageLossRate: 1.0,
      },
      retail: {
        discountRate: 25.0,
        vatRate: parameters.taxAndCapital?.vatOutputRate ?? 8.0,
        shippingCod: 25000,
        packagingRate: 2.0,
        storageLossRate: 1.0,
      },
    });
    setPriceOverrides({});
    setCustomCogsMap({});
    setSaveSuccessMsg('Đã khôi phục các thông số về mặc định từ Tab 1 (bao gồm Thuế, Phí D2C & Phí Sàn)!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. THANH CHỌN SẢN PHẨM TỪ TAB DANH MỤC SẢN PHẨM */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Chọn Sản Phẩm Phân Tích (Tab Danh Mục Sản Phẩm)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                {selectedSku?.name || 'Chưa chọn sản phẩm'}
                {selectedSku?.type === 'combo' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                    Combo
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Dropdown chọn sản phẩm */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <select
                value={selectedSkuId}
                onChange={(e) => setSelectedSkuId(e.target.value)}
                className="w-full appearance-none pl-3 pr-9 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
              >
                {skus.map((sku, idx) => {
                  const cat = categories.find((c) => c.id === sku.categoryId);
                  return (
                    <option key={sku.id} value={sku.id}>
                      #{idx + 1} • [{sku.skuCode}] {sku.name} {sku.volume ? `(${sku.volume})` : ''} - {cat ? cat.name : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Báo giá xưởng / MOQ */}
            {skuQuotations.length > 1 && (
              <div className="relative">
                <select
                  value={selectedQuoteIdMap[selectedSku?.id || ''] || ''}
                  onChange={(e) => {
                    const qId = e.target.value;
                    setSelectedQuoteIdMap((prev) => ({
                      ...prev,
                      [selectedSku?.id || '']: qId,
                    }));
                  }}
                  className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 focus:outline-none cursor-pointer"
                  title="Chọn báo giá từ các nhà máy ở Tab 3 để mô phỏng"
                >
                  <option value="">Báo giá đang chốt ({currentMoq} {productUnit} - {formatVnd(currentCogs)} đ)</option>
                  {skuQuotations.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.factoryName?.split('(')[0]?.trim()} • MOQ {q.moq} ({formatVnd(q.unitPrice)} đ)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-amber-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Nút cài đặt thông số mô phỏng */}
            <button
              onClick={() => setIsConfigDrawerOpen(!isConfigDrawerOpen)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isConfigDrawerOpen 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Cấu Hình Thông Số</span>
              {isConfigDrawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Quick SKU Chips for Fast Navigation */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">Chuyển nhanh:</span>
          {skus.map((sku, idx) => (
            <button
              key={sku.id}
              onClick={() => setSelectedSkuId(sku.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedSkuId === sku.id
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              #{idx + 1} {sku.skuCode}
            </button>
          ))}
        </div>
      </div>

      {/* THÔNG BÁO LƯU */}
      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg('')} className="text-emerald-700 text-xs hover:underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* DRAWER CẤU HÌNH THÔNG SỐ TRỰC TIẾP (Nếu mở) */}
      {isConfigDrawerOpen && (
        <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2 text-indigo-700">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-bold text-sm text-slate-900">
                Tùy Chỉnh Thông Số Mô Phỏng Giá &amp; Unit Economics
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleResetSimParams}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                title="Đồng bộ lại từ Tab 1. Tham số chung"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Khôi Phục Mặc Định Từ Tab 1</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Nhóm 1: Thông số Shopee */}
            <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-200 space-y-2">
              <div className="font-bold text-orange-900 flex items-center justify-between">
                <span>Thông Số Shopee</span>
                <span className="text-[10px] text-orange-600 font-mono">D2C Sàn</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500">Phí thanh toán %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simParams.shopee.paymentFeeRate}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      shopee: { ...simParams.shopee, paymentFeeRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Hoa hồng sàn %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simParams.shopee.commissionRate}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      shopee: { ...simParams.shopee, commissionRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Voucher Xtra %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simParams.shopee.voucherXtraRate}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      shopee: { ...simParams.shopee, voucherXtraRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-purple-700 font-medium">Affiliate sàn %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simParams.shopee.affiliateRate}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      shopee: { ...simParams.shopee, affiliateRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-purple-50/50 border border-purple-300 rounded text-purple-950 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-purple-700 font-medium">Quảng cáo sàn %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simParams.shopee.internalAdsRate}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      shopee: { ...simParams.shopee, internalAdsRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-purple-50/50 border border-purple-300 rounded text-purple-950 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Phí xử lý đơn (đ)</label>
                  <input
                    type="number"
                    step="500"
                    value={simParams.shopee.orderHandlingFee}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      shopee: { ...simParams.shopee, orderHandlingFee: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Phí bồi hoàn (đ)</label>
                  <input
                    type="number"
                    step="100"
                    value={simParams.shopee.compensationFee}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      shopee: { ...simParams.shopee, compensationFee: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Nhóm 3: Thông số TikTok Shop */}
            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
              <div className="font-bold text-rose-900 flex items-center justify-between">
                <span>Thông Số TikTok Shop</span>
                <span className="text-[10px] text-rose-600 font-mono">D2C Sàn</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500">Phí thanh toán %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simParams.tiktok.paymentFeeRate}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      tiktok: { ...simParams.tiktok, paymentFeeRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Hoa hồng sàn %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simParams.tiktok.commissionRate}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      tiktok: { ...simParams.tiktok, commissionRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Voucher Xtra %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simParams.tiktok.voucherXtraRate}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      tiktok: { ...simParams.tiktok, voucherXtraRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-purple-700 font-medium">Affiliate TikTok %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simParams.tiktok.affiliateRate}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      tiktok: { ...simParams.tiktok, affiliateRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-purple-50/50 border border-purple-300 rounded text-purple-950 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-purple-700 font-medium">Quảng cáo sàn / Live %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simParams.tiktok.internalAdsRate}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      tiktok: { ...simParams.tiktok, internalAdsRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-purple-50/50 border border-purple-300 rounded text-purple-950 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Phí xử lý đơn (đ)</label>
                  <input
                    type="number"
                    step="500"
                    value={simParams.tiktok.orderHandlingFee}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      tiktok: { ...simParams.tiktok, orderHandlingFee: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Phí bồi hoàn (đ)</label>
                  <input
                    type="number"
                    step="100"
                    value={simParams.tiktok.compensationFee}
                    onChange={(e) => setSimParams({
                      ...simParams,
                      tiktok: { ...simParams.tiktok, compensationFee: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Nhóm 3: Thông số B2B */}
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2">
              <div className="font-bold text-indigo-900 flex items-center justify-between">
                <span>Thông Số Kênh B2B</span>
                <span className="text-[10px] text-indigo-600 font-mono">Đại lý / Spa</span>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500">Chiết khấu Đại lý / Spa (%)</label>
                <input
                  type="number"
                  step="1"
                  value={simParams.b2b.discountRate}
                  onChange={(e) => setSimParams({
                    ...simParams,
                    b2b: { ...simParams.b2b, discountRate: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500">Cước vận chuyển / logistics lô sỉ (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={simParams.b2b.logisticsRate}
                  onChange={(e) => setSimParams({
                    ...simParams,
                    b2b: { ...simParams.b2b, logisticsRate: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500">Chi phí bao bì đóng gói / thùng carton sỉ (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={simParams.b2b.packagingRate}
                  onChange={(e) => setSimParams({
                    ...simParams,
                    b2b: { ...simParams.b2b, packagingRate: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500">Chi phí hao hụt / lưu kho (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={simParams.b2b.storageLossRate}
                  onChange={(e) => setSimParams({
                    ...simParams,
                    b2b: { ...simParams.b2b, storageLossRate: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>
            </div>

            {/* Nhóm 4: Thông số Retail Trực Tiếp */}
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <div className="font-bold text-emerald-900 flex items-center justify-between">
                <span>Retail Trực Tiếp</span>
                <span className="text-[10px] text-emerald-600 font-mono">Website / Showroom</span>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500">Chiết khấu khuyến mãi trực tiếp (%)</label>
                <input
                  type="number"
                  step="1"
                  value={simParams.retail.discountRate}
                  onChange={(e) => setSimParams({
                    ...simParams,
                    retail: { ...simParams.retail, discountRate: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500">Cước chuyển phát COD tận nhà (đ/đơn)</label>
                <input
                  type="number"
                  step="1000"
                  value={simParams.retail.shippingCod}
                  onChange={(e) => setSimParams({
                    ...simParams,
                    retail: { ...simParams.retail, shippingCod: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500">Chi phí bao bì đóng gói túi hộp (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={simParams.retail.packagingRate}
                  onChange={(e) => setSimParams({
                    ...simParams,
                    retail: { ...simParams.retail, packagingRate: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HEADER BAR & CHUYỂN KÊNH BÁN HÀNG (THEO CHÍNH XÁC SCREENSHOT 1) */}
      <div className="rounded-2xl bg-white border border-slate-200 px-4 sm:px-6 py-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tiêu đề & Thông tin phân tích */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Mô Phỏng Giá &amp; Unit Economics (Kinh Tế Đơn Vị)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đang phân tích: <strong className="text-slate-800 font-semibold">{selectedSku?.name || 'Sản phẩm'}</strong> • Thuế suất VAT: <strong className="text-slate-800 font-semibold">{simParams.vatRate.toFixed(1)}%</strong>
            </p>
          </div>
        </div>

        {/* 4 Nút Chọn Kênh (Shopee, TikTok Shop, B2B, Retail Trực Tiếp) */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 gap-1 overflow-x-auto no-scrollbar">
          {/* Kênh 1: Shopee */}
          <button
            onClick={() => setActiveChannel('shopee')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeChannel === 'shopee'
                ? 'bg-[#ff5722] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Shopee</span>
          </button>

          {/* Kênh 2: TikTok Shop */}
          <button
            onClick={() => setActiveChannel('tiktok')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeChannel === 'tiktok'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>TikTok Shop</span>
          </button>

          {/* Kênh 3: B2B (GT / MT / Spa) */}
          <button
            onClick={() => setActiveChannel('b2b')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeChannel === 'b2b'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>B2B (GT / MT / Spa)</span>
          </button>

          {/* Kênh 4: Retail Trực Tiếp */}
          <button
            onClick={() => setActiveChannel('retail')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeChannel === 'retail'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Retail Trực Tiếp</span>
          </button>
        </div>
      </div>

      {/* 3. BẢNG CHI TIẾT P&L THEO TỪNG KÊNH (THEO CHÍNH XÁC SCREENSHOT 2, 3, 4) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tiêu đề Bảng P&L & MOQ */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            {activeChannel === 'shopee' && <Layers className="w-5 h-5 text-orange-600" />}
            {activeChannel === 'tiktok' && <Layers className="w-5 h-5 text-slate-800" />}
            {activeChannel === 'b2b' && <Building2 className="w-5 h-5 text-indigo-600" />}
            {activeChannel === 'retail' && <Store className="w-5 h-5 text-emerald-600" />}
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              {activeChannel === 'shopee' && 'P&L Sản phẩm - Kênh Shopee'}
              {activeChannel === 'tiktok' && 'P&L Sản phẩm - Kênh TikTok Shop'}
              {activeChannel === 'b2b' && 'P&L Sản phẩm - Kênh B2B (GT / MT / Spa)'}
              {activeChannel === 'retail' && 'P&L Sản phẩm - Kênh Retail Trực Tiếp'}
            </h4>
          </div>

          <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-600">
            <span className="font-semibold text-slate-700">
              MOQ: <strong className="text-slate-900 font-mono font-bold">{currentMoq} {productUnit}</strong>
            </span>
            <span className="text-slate-400">({formatVnd(currentCogs)} đ/{productUnit})</span>
            {onUpdateSkuPrice && (
              <button
                onClick={() => handleSavePriceToCatalog(activeChannel)}
                className="ml-2 inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
                title="Lưu mức giá mô phỏng này vào danh mục SKU ở Tab 2"
              >
                <Save className="w-3 h-3" />
                <span>Lưu Giá Niêm Yết</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================= BẢNG KÊNH SHOPEE ======================= */}
        {activeChannel === 'shopee' && (
          <div className="p-4 sm:p-6">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3 uppercase tracking-wider text-xs">KHOẢN MỤC P&amp;L</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-xs w-48">SỐ TIỀN (đ)</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-xs w-28">TỶ TRỌNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Giá bán niêm yết (Gross Price) */}
                <tr className="bg-slate-50/40">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span>1. Giá bán niêm yết (Gross Price)</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      step="1000"
                      value={shopeeGrossPrice}
                      onChange={(e) => handlePriceChange('shopee', parseFloat(e.target.value) || 0)}
                      className="w-32 sm:w-36 text-right font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400 font-semibold">—</td>
                </tr>

                {/* Thuế VAT đầu ra phải nộp */}
                <tr>
                  <td className="py-2.5 px-3 text-rose-600 pl-6">
                    - Thuế VAT đầu ra phải nộp ({shopeeVatRate.toFixed(1)}% giá niêm yết)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(shopeeVatAmount)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                    -{shopeeVatRate.toFixed(1)}%
                  </td>
                </tr>

                {/* 2. Doanh thu trước thuế (Net Revenue) */}
                <tr className="bg-slate-50/70 border-t border-b border-slate-200 font-bold">
                  <td className="py-3 px-3 text-indigo-700 text-sm">
                    2. Doanh thu trước thuế (Net Revenue)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700 text-sm font-bold">
                    {formatVnd(shopeeNetRevenue)} đ
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700 font-bold">
                    100.0%
                  </td>
                </tr>

                {/* - Biến phí & Phí sàn TMĐT (Shopee) */}
                <tr className="font-semibold text-slate-800">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <Store className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>- Biến phí &amp; Phí sàn TMĐT (Shopee)</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatVnd(shopeeTotalPlatformFee)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    {formatPercent(shopeeNetRevenue > 0 ? (shopeeTotalPlatformFee / shopeeNetRevenue) * 100 : 0)}
                  </td>
                </tr>

                {/* Sub-items Sàn */}
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Phí thanh toán sàn ({simParams.shopee.paymentFeeRate.toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(shopeePaymentFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{simParams.shopee.paymentFeeRate.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Phí cố định / Hoa hồng sàn ({simParams.shopee.commissionRate.toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(shopeeCommissionFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{simParams.shopee.commissionRate.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Phí dịch vụ Voucher Xtra ({simParams.shopee.voucherXtraRate.toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(shopeeVoucherXtraFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{simParams.shopee.voucherXtraRate.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Phí xử lý đơn hàng ({formatVnd(shopeeOrderHandlingFee)} đ/sản phẩm)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(shopeeOrderHandlingFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{((shopeeOrderHandlingFee / shopeeNetRevenue) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Phí bồi hoàn sàn ({formatVnd(shopeeCompensationFee)} đ/sản phẩm)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(shopeeCompensationFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{((shopeeCompensationFee / shopeeNetRevenue) * 100).toFixed(1)}%
                  </td>
                </tr>

                {/* - Chi phí tiếp thị trực tiếp (Affiliate & Ads sàn) */}
                <tr className="font-semibold text-slate-800">
                  <td className="py-2.5 px-3 pl-6 text-slate-800">
                    - Chi phí tiếp thị trực tiếp (Affiliate &amp; Ads sàn: {(simParams.shopee.affiliateRate + simParams.shopee.internalAdsRate).toFixed(1)}%)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatVnd(shopeeTotalMarketingFee)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    {formatPercent(shopeeNetRevenue > 0 ? (shopeeTotalMarketingFee / shopeeNetRevenue) * 100 : 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Hoa hồng Tiếp thị liên kết Affiliate ({simParams.shopee.affiliateRate.toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(shopeeAffiliateFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{simParams.shopee.affiliateRate.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Chi phí Quảng cáo sàn / Livestream ({simParams.shopee.internalAdsRate.toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(shopeeInternalAdsFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{simParams.shopee.internalAdsRate.toFixed(1)}%
                  </td>
                </tr>

                {/* - Giá vốn hàng bán COGS */}
                <tr>
                  <td className="py-2.5 px-3 pl-6 font-medium text-slate-800">
                    - Giá vốn hàng bán (COGS MOQ {currentMoq} {productUnit})
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatVnd(shopeeCogs)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
                    {formatPercent(shopeeNetRevenue > 0 ? (shopeeCogs / shopeeNetRevenue) * 100 : 0)}
                  </td>
                </tr>

                {/* - Chi phí bao bì đóng gói */}
                <tr>
                  <td className="py-2 px-3 pl-6 text-slate-700">
                    - Chi phí bao bì đóng gói ({simParams.shopee.packagingRate.toFixed(1)}%)
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(shopeePackagingFee)} đ
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-600">
                    -{simParams.shopee.packagingRate.toFixed(1)}%
                  </td>
                </tr>

                {/* - Chi phí hao hụt / lưu kho */}
                <tr>
                  <td className="py-2 px-3 pl-6 text-slate-700">
                    - Chi phí hao hụt / lưu kho ({simParams.shopee.storageLossRate.toFixed(1)}%)
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(shopeeStorageLossFee)} đ
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-600">
                    -{simParams.shopee.storageLossRate.toFixed(1)}%
                  </td>
                </tr>

                {/* 3. Lợi nhuận gộp (Gross Profit) */}
                <tr className="bg-emerald-50/80 border-t-2 border-emerald-400 font-bold text-sm sm:text-base">
                  <td className="py-3.5 px-3 text-emerald-950 font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span>3. Lợi nhuận gộp (Gross Profit)</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-bold text-base sm:text-lg">
                    {formatVnd(shopeeGrossProfit)} đ
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-bold text-base sm:text-lg">
                    {shopeeGrossProfitMargin.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Chú thích kênh Shopee */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600 leading-relaxed">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Mosh&amp;Mode là Công ty TNHH, được miễn áp thuế sàn thu hộ 1.5% (áp dụng với hộ cá thể). Số liệu VAT 8% được hạch toán minh bạch khấu trừ đầu ra.
              </span>
            </div>
          </div>
        )}

        {/* ======================= BẢNG KÊNH TIKTOK SHOP ======================= */}
        {activeChannel === 'tiktok' && (
          <div className="p-4 sm:p-6">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3 uppercase tracking-wider text-xs">KHOẢN MỤC P&amp;L</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-xs w-48">SỐ TIỀN (đ)</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-xs w-28">TỶ TRỌNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Giá bán niêm yết (Gross Price) */}
                <tr className="bg-slate-50/40">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span>1. Giá bán niêm yết (Gross Price)</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      step="1000"
                      value={tiktokGrossPrice}
                      onChange={(e) => handlePriceChange('tiktok', parseFloat(e.target.value) || 0)}
                      className="w-32 sm:w-36 text-right font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400 font-semibold">—</td>
                </tr>

                {/* Thuế VAT đầu ra phải nộp */}
                <tr>
                  <td className="py-2.5 px-3 text-rose-600 pl-6">
                    - Thuế VAT đầu ra phải nộp ({tiktokVatRate.toFixed(1)}% giá niêm yết)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(tiktokVatAmount)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                    -{tiktokVatRate.toFixed(1)}%
                  </td>
                </tr>

                {/* 2. Doanh thu trước thuế (Net Revenue) */}
                <tr className="bg-slate-50/70 border-t border-b border-slate-200 font-bold">
                  <td className="py-3 px-3 text-indigo-700 text-sm">
                    2. Doanh thu trước thuế (Net Revenue)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700 text-sm font-bold">
                    {formatVnd(tiktokNetRevenue)} đ
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700 font-bold">
                    100.0%
                  </td>
                </tr>

                {/* - Biến phí & Phí sàn TMĐT (TikTok Shop) */}
                <tr className="font-semibold text-slate-800">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <Store className="w-4 h-4 text-slate-900 shrink-0" />
                    <span>- Biến phí &amp; Phí sàn TMĐT (TikTok Shop)</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatVnd(tiktokTotalPlatformFee)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    {formatPercent(tiktokNetRevenue > 0 ? (tiktokTotalPlatformFee / tiktokNetRevenue) * 100 : 0)}
                  </td>
                </tr>

                {/* Sub-items Sàn TikTok Shop */}
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Phí thanh toán sàn ({simParams.tiktok.paymentFeeRate.toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(tiktokPaymentFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{simParams.tiktok.paymentFeeRate.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Phí cố định / Hoa hồng sàn ({simParams.tiktok.commissionRate.toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(tiktokCommissionFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{simParams.tiktok.commissionRate.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Phí dịch vụ Voucher Xtra / FreeShip ({simParams.tiktok.voucherXtraRate.toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(tiktokVoucherXtraFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{simParams.tiktok.voucherXtraRate.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Phí xử lý đơn hàng ({formatVnd(tiktokOrderHandlingFee)} đ/sản phẩm)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(tiktokOrderHandlingFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{((tiktokOrderHandlingFee / tiktokNetRevenue) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Phí bồi hoàn sàn ({formatVnd(tiktokCompensationFee)} đ/sản phẩm)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(tiktokCompensationFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{((tiktokCompensationFee / tiktokNetRevenue) * 100).toFixed(1)}%
                  </td>
                </tr>

                {/* Tiếp thị trực tiếp TikTok Shop */}
                <tr className="font-semibold text-slate-800">
                  <td className="py-2.5 px-3 pl-6 text-slate-800">
                    - Chi phí tiếp thị trực tiếp (Affiliate &amp; Ads sàn: {(simParams.tiktok.affiliateRate + simParams.tiktok.internalAdsRate).toFixed(1)}%)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatVnd(tiktokTotalMarketingFee)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    {formatPercent(tiktokNetRevenue > 0 ? (tiktokTotalMarketingFee / tiktokNetRevenue) * 100 : 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Hoa hồng Tiếp thị liên kết Affiliate ({simParams.tiktok.affiliateRate.toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(tiktokAffiliateFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{simParams.tiktok.affiliateRate.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 pl-8 text-slate-600 text-xs">
                    • Chi phí Quảng cáo sàn / Livestream ({simParams.tiktok.internalAdsRate.toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-600 text-xs">
                    -{formatVnd(tiktokInternalAdsFee)} đ
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                    -{simParams.tiktok.internalAdsRate.toFixed(1)}%
                  </td>
                </tr>

                {/* - Giá vốn hàng bán COGS */}
                <tr>
                  <td className="py-2.5 px-3 pl-6 font-medium text-slate-800">
                    - Giá vốn hàng bán (COGS MOQ {currentMoq} {productUnit})
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatVnd(tiktokCogs)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
                    {formatPercent(tiktokNetRevenue > 0 ? (tiktokCogs / tiktokNetRevenue) * 100 : 0)}
                  </td>
                </tr>

                {/* - Chi phí bao bì đóng gói */}
                <tr>
                  <td className="py-2 px-3 pl-6 text-slate-700">
                    - Chi phí bao bì đóng gói ({simParams.tiktok.packagingRate.toFixed(1)}%)
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(tiktokPackagingFee)} đ
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-600">
                    -{simParams.tiktok.packagingRate.toFixed(1)}%
                  </td>
                </tr>

                {/* - Chi phí hao hụt / lưu kho */}
                <tr>
                  <td className="py-2 px-3 pl-6 text-slate-700">
                    - Chi phí hao hụt / lưu kho ({simParams.tiktok.storageLossRate.toFixed(1)}%)
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(tiktokStorageLossFee)} đ
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-600">
                    -{simParams.tiktok.storageLossRate.toFixed(1)}%
                  </td>
                </tr>

                {/* 3. Lợi nhuận gộp (Gross Profit) */}
                <tr className="bg-emerald-50/80 border-t-2 border-emerald-400 font-bold text-sm sm:text-base">
                  <td className="py-3.5 px-3 text-emerald-950 font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span>3. Lợi nhuận gộp (Gross Profit)</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-bold text-base sm:text-lg">
                    {formatVnd(tiktokGrossProfit)} đ
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-bold text-base sm:text-lg">
                    {tiktokGrossProfitMargin.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Chú thích kênh TikTok Shop */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600 leading-relaxed">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                TikTok Shop áp dụng cơ chế thanh toán và hoa hồng sàn theo chính sách doanh nghiệp. Thuế VAT 8% được hạch toán minh bạch khấu trừ đầu ra.
              </span>
            </div>
          </div>
        )}

        {/* ======================= BẢNG KÊNH B2B (GT / MT / SPA) ======================= */}
        {activeChannel === 'b2b' && (
          <div className="p-4 sm:p-6">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3 uppercase tracking-wider text-xs">KHOẢN MỤC P&amp;L</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-xs w-48">SỐ TIỀN (đ)</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-xs w-28">TỶ TRỌNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Giá bán buôn / niêm yết sỉ (Base Price) */}
                <tr className="bg-slate-50/40">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span>1. Giá bán buôn / niêm yết sỉ (Base Price)</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      step="1000"
                      value={b2bBasePrice}
                      onChange={(e) => handlePriceChange('b2b', parseFloat(e.target.value) || 0)}
                      className="w-32 sm:w-36 text-right font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400 font-semibold">—</td>
                </tr>

                {/* - Chiết khấu thương mại Đại lý / Spa */}
                <tr>
                  <td className="py-2.5 px-3 text-rose-600 pl-6">
                    - Chiết khấu thương mại Đại lý / Spa
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(b2bDiscountAmount)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">
                    -{simParams.b2b.discountRate.toFixed(1)}%
                  </td>
                </tr>

                {/* 2. Doanh thu xuất hóa đơn B2B (Net Revenue) */}
                <tr className="bg-slate-50/70 border-t border-b border-slate-200 font-bold">
                  <td className="py-3 px-3 text-emerald-800 text-sm">
                    2. Doanh thu xuất hóa đơn B2B (Net Revenue)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-800 text-sm font-bold">
                    {formatVnd(b2bNetRevenue)} đ
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-800 font-bold">
                    100.0%
                  </td>
                </tr>

                {/* Thuế VAT đầu ra hóa đơn GTGT (8% trên giá B2B) */}
                <tr className="bg-indigo-50/30 text-indigo-800">
                  <td className="py-2 px-3 pl-6 flex items-center gap-1.5 font-medium">
                    <span>Thuế VAT đầu ra hóa đơn GTGT ({simParams.b2b.vatRate.toFixed(0)}% trên giá B2B)</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                    +{formatVnd(b2bVatOutputAmount)} đ
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-indigo-600 text-xs font-semibold">
                    Khấu trừ
                  </td>
                </tr>

                {/* - Chi phí vận chuyển / logistics giao lô sỉ */}
                <tr>
                  <td className="py-2.5 px-3 pl-6 text-slate-800 flex items-center gap-1.5">
                    <span>- Chi phí vận chuyển / logistics giao lô sỉ</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatVnd(b2bLogisticsFee)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">
                    -{simParams.b2b.logisticsRate.toFixed(1)}%
                  </td>
                </tr>

                {/* - Giá vốn hàng bán (COGS MOQ ...) */}
                <tr>
                  <td className="py-2.5 px-3 pl-6 font-medium text-slate-800">
                    - Giá vốn hàng bán (COGS MOQ {currentMoq} {productUnit})
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatVnd(b2bCogs)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
                    {formatPercent(b2bNetRevenue > 0 ? (b2bCogs / b2bNetRevenue) * 100 : 0)}
                  </td>
                </tr>

                {/* - Chi phí bao bì đóng gói */}
                <tr>
                  <td className="py-2 px-3 pl-6 text-slate-700">
                    - Chi phí bao bì đóng gói ({simParams.b2b.packagingRate.toFixed(1)}%)
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(b2bPackagingFee)} đ
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-600">
                    -{simParams.b2b.packagingRate.toFixed(1)}%
                  </td>
                </tr>

                {/* - Chi phí hao hụt / lưu kho */}
                <tr>
                  <td className="py-2 px-3 pl-6 text-slate-700">
                    - Chi phí hao hụt / lưu kho ({simParams.b2b.storageLossRate.toFixed(1)}%)
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(b2bStorageLossFee)} đ
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-600">
                    -{simParams.b2b.storageLossRate.toFixed(1)}%
                  </td>
                </tr>

                {/* 3. Lợi nhuận gộp (Gross Profit) */}
                <tr className="bg-emerald-50/80 border-t-2 border-emerald-400 font-bold text-sm sm:text-base">
                  <td className="py-3.5 px-3 text-emerald-950 font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span>3. Lợi nhuận gộp (Gross Profit)</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-bold text-base sm:text-lg">
                    {formatVnd(b2bGrossProfit)} đ
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-bold text-base sm:text-lg">
                    {b2bGrossProfitMargin.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Chú thích kênh B2B */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600 leading-relaxed">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Kênh B2B không bán qua sàn TMĐT nên hoàn toàn không phát sinh phí sàn hay hoa hồng tiếp thị liên kết TMĐT. Chi phí chủ yếu là cước vận chuyển giao sỉ và xuất VAT.
              </span>
            </div>
          </div>
        )}

        {/* ======================= BẢNG KÊNH RETAIL TRỰC TIẾP ======================= */}
        {activeChannel === 'retail' && (
          <div className="p-4 sm:p-6">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3 uppercase tracking-wider text-xs">KHOẢN MỤC P&amp;L</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-xs w-48">SỐ TIỀN (đ)</th>
                  <th className="py-2.5 px-3 text-right uppercase tracking-wider text-xs w-28">TỶ TRỌNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Giá bán lẻ niêm yết (Gross Price) */}
                <tr className="bg-slate-50/40">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span>1. Giá bán lẻ niêm yết (Gross Price)</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      step="1000"
                      value={retailGrossPrice}
                      onChange={(e) => handlePriceChange('retail', parseFloat(e.target.value) || 0)}
                      className="w-32 sm:w-36 text-right font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400 font-semibold">—</td>
                </tr>

                {/* - Chiết khấu khuyến mãi trực tiếp */}
                <tr>
                  <td className="py-2.5 px-3 text-rose-600 pl-6">
                    - Chiết khấu khuyến mãi trực tiếp
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(retailDiscountAmount)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">
                    -{simParams.retail.discountRate.toFixed(1)}%
                  </td>
                </tr>

                {/* - Thuế VAT đầu ra phải nộp (8%) */}
                <tr>
                  <td className="py-2.5 px-3 text-rose-600 pl-6">
                    - Thuế VAT đầu ra phải nộp ({retailVatRate.toFixed(0)}%)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(retailVatAmount)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">
                    -{retailVatRate.toFixed(1)}%
                  </td>
                </tr>

                {/* 2. Doanh thu trước thuế (Net Revenue) */}
                <tr className="bg-slate-50/70 border-t border-b border-slate-200 font-bold">
                  <td className="py-3 px-3 text-indigo-700 text-sm">
                    2. Doanh thu trước thuế (Net Revenue)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700 text-sm font-bold">
                    {formatVnd(retailNetRevenue)} đ
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700 font-bold">
                    100.0%
                  </td>
                </tr>

                {/* - Chi phí giao hàng tận nhà / ship COD */}
                <tr>
                  <td className="py-2.5 px-3 pl-6 text-slate-800 flex items-center gap-1.5">
                    <span>- Chi phí giao hàng tận nhà / ship COD</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatVnd(retailShippingCod)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">
                    {formatPercent(retailNetRevenue > 0 ? (retailShippingCod / retailNetRevenue) * 100 : 0)}
                  </td>
                </tr>

                {/* - Giá vốn hàng bán COGS */}
                <tr>
                  <td className="py-2.5 px-3 pl-6 font-medium text-slate-800">
                    - Giá vốn hàng bán (COGS MOQ {currentMoq} {productUnit})
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -{formatVnd(retailCogs)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
                    {formatPercent(retailNetRevenue > 0 ? (retailCogs / retailNetRevenue) * 100 : 0)}
                  </td>
                </tr>

                {/* - Chi phí bao bì đóng gói */}
                <tr>
                  <td className="py-2 px-3 pl-6 text-slate-700">
                    - Chi phí bao bì đóng gói ({simParams.retail.packagingRate.toFixed(1)}%)
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(retailPackagingFee)} đ
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-600">
                    -{simParams.retail.packagingRate.toFixed(1)}%
                  </td>
                </tr>

                {/* - Chi phí hao hụt / lưu kho */}
                <tr>
                  <td className="py-2 px-3 pl-6 text-slate-700">
                    - Chi phí hao hụt / lưu kho ({simParams.retail.storageLossRate.toFixed(1)}%)
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">
                    -{formatVnd(retailStorageLossFee)} đ
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-600">
                    -{simParams.retail.storageLossRate.toFixed(1)}%
                  </td>
                </tr>

                {/* 3. Lợi nhuận gộp (Gross Profit) */}
                <tr className="bg-emerald-50/80 border-t-2 border-emerald-400 font-bold text-sm sm:text-base">
                  <td className="py-3.5 px-3 text-emerald-950 font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span>3. Lợi nhuận gộp (Gross Profit)</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-bold text-base sm:text-lg">
                    {formatVnd(retailGrossProfit)} đ
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-bold text-base sm:text-lg">
                    {retailGrossProfitMargin.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Chú thích kênh Retail Trực Tiếp */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600 leading-relaxed">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Kênh Retail bán lẻ trực tiếp (Website/Showroom) không chịu phí hoa hồng sàn TMĐT. Chi phí cấu thành gồm thuế VAT, cước chuyển phát COD tận nhà và bao bì.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. BẢNG SO SÁNH TỔNG HỢP HIỆU QUẢ 4 KÊNH CHO SẢN PHẨM HIỆN TẠI */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-sm text-slate-900">
              So Sánh Biên Lợi Nhuận Gộp Đơn Vị (Unit Economics) Cả 4 Kênh Bán Hàng
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            COGS chốt: <strong>{formatVnd(currentCogs)} đ/{productUnit}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Shopee */}
          <div className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeChannel === 'shopee'
              ? 'bg-orange-50/50 border-orange-300 ring-2 ring-orange-500/20 shadow-xs'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
          }`} onClick={() => setActiveChannel('shopee')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Shopee
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {shopeeGrossProfitMargin.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Giá bán:</span>
                <span className="font-mono font-bold text-slate-900">{formatVnd(shopeeGrossPrice)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Doanh thu thuần:</span>
                <span className="font-mono text-slate-800">{formatVnd(shopeeNetRevenue)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí sàn &amp; Mkt:</span>
                <span className="font-mono text-rose-600">-{formatVnd(shopeeTotalPlatformFee + shopeeTotalMarketingFee)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Giá vốn (COGS):</span>
                <span className="font-mono text-rose-600">-{formatVnd(shopeeCogs)} đ</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Lãi gộp:</span>
                <span className="font-mono text-emerald-700">{formatVnd(shopeeGrossProfit)} đ</span>
              </div>
            </div>
          </div>

          {/* Card TikTok Shop */}
          <div className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeChannel === 'tiktok'
              ? 'bg-slate-100/80 border-slate-400 ring-2 ring-slate-800/20 shadow-xs'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
          }`} onClick={() => setActiveChannel('tiktok')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" /> TikTok Shop
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {tiktokGrossProfitMargin.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Giá bán:</span>
                <span className="font-mono font-bold text-slate-900">{formatVnd(tiktokGrossPrice)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Doanh thu thuần:</span>
                <span className="font-mono text-slate-800">{formatVnd(tiktokNetRevenue)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí sàn &amp; Mkt:</span>
                <span className="font-mono text-rose-600">-{formatVnd(tiktokTotalPlatformFee + tiktokTotalMarketingFee)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Giá vốn (COGS):</span>
                <span className="font-mono text-rose-600">-{formatVnd(tiktokCogs)} đ</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Lãi gộp:</span>
                <span className="font-mono text-emerald-700">{formatVnd(tiktokGrossProfit)} đ</span>
              </div>
            </div>
          </div>

          {/* Card B2B */}
          <div className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeChannel === 'b2b'
              ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
          }`} onClick={() => setActiveChannel('b2b')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> B2B (GT / MT / Spa)
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {b2bGrossProfitMargin.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Giá buôn sỉ:</span>
                <span className="font-mono font-bold text-slate-900">{formatVnd(b2bBasePrice)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Doanh thu B2B:</span>
                <span className="font-mono text-slate-800">{formatVnd(b2bNetRevenue)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Chiết khấu sỉ:</span>
                <span className="font-mono text-rose-600">-{formatVnd(b2bDiscountAmount)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Giá vốn (COGS):</span>
                <span className="font-mono text-rose-600">-{formatVnd(b2bCogs)} đ</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Lãi gộp:</span>
                <span className="font-mono text-emerald-700">{formatVnd(b2bGrossProfit)} đ</span>
              </div>
            </div>
          </div>

          {/* Card Retail */}
          <div className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeChannel === 'retail'
              ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
          }`} onClick={() => setActiveChannel('retail')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" /> Retail Trực Tiếp
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {retailGrossProfitMargin.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Giá niêm yết:</span>
                <span className="font-mono font-bold text-slate-900">{formatVnd(retailGrossPrice)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Doanh thu thuần:</span>
                <span className="font-mono text-slate-800">{formatVnd(retailNetRevenue)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cước ship COD:</span>
                <span className="font-mono text-rose-600">-{formatVnd(retailShippingCod)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Giá vốn (COGS):</span>
                <span className="font-mono text-rose-600">-{formatVnd(retailCogs)} đ</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Lãi gộp:</span>
                <span className="font-mono text-emerald-700">{formatVnd(retailGrossProfit)} đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
