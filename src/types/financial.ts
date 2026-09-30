export interface TaxAndCapitalConfig {
  startingCash: number; // Vốn tiền mặt đầu kỳ (VND)
  contingencyReserveMonthly?: number; // Chi phí dự phòng cố định hàng tháng (VND)
  vatOutputRate: number; // Thuế suất VAT đầu ra (%)
  corporateIncomeTaxRate: number; // Thuế TNDN CIT (%)
  socialInsuranceRate: number; // BHXH cho NLD (%)
  seasonalPersonalIncomeTaxRate: number; // Thuế TNCN lao động thời vụ (%)
  depreciationMonths: number; // Kỳ hạn khấu hao tài sản (tháng)
}

export interface SettlementCycleConfig {
  ecommerceSettlementDelayDays: number; // Độ trễ đối soát tiền Kênh Sàn TMĐT (T+ ngày, ví dụ 14 ngày sau khi giao thành công)
  b2bSettlementDelayDays: number; // Độ trễ đối soát Kênh B2B (T+ ngày)
}

export interface SupplyChainConfig {
  productionLeadTimeDays: number; // Thời gian sản xuất sau khi nhận PO (ngày)
}

export interface MarketingBaselineConfig {
  marketingBudgetRateGmv: number; // Chi phí Marketing tổng thể dự án theo GMV (%) - không bao gồm phí quảng cáo nội sàn
}

export interface D2CFeesConfig {
  affiliateRate: number; // Phí Affiliate (%) - Mặc định 8%
  internalAdsRate: number; // Phí Quảng cáo nội sàn (%) - Mặc định 5%
  shopeeAffiliateRate?: number; // Tùy chọn riêng cho Shopee (%)
  shopeeInternalAdsRate?: number; // Tùy chọn riêng cho Shopee (%)
  tikTokAffiliateRate?: number; // Tùy chọn riêng cho TikTok Shop (%)
  tikTokInternalAdsRate?: number; // Tùy chọn riêng cho TikTok Shop (%)
}

export interface PlatformFeeDetail {
  paymentFeeRate: number; // Phí thanh toán (%)
  platformCommissionRate: number; // Phí hoa hồng nền tảng (%)
  voucherXtraRate: number; // Phí Voucher Xtra (%)
  orderHandlingFeePerItem: number; // Phí xử lý đơn hàng (VND/sản phẩm)
  compensationFeePerItem: number; // Phí bồi hoàn (VND/sản phẩm)
  packagingAndWarehousingRate: number; // Phí đóng gói, kho bãi (%)
  shrinkageRate: number; // Phí hao hụt (%)
}

export interface PlatformFeesConfig {
  shopee: PlatformFeeDetail;
  tikTokShop: PlatformFeeDetail;
}

export type CreatorTierKey = 'UGC' | 'KOC' | 'KOL';

export interface CreatorTierConfig {
  id: CreatorTierKey;
  name: string;
  description: string;
  freeSamplesPerSku: number; // Số Mẫu Tặng / SKU / Creator
  bookingFeePerCreator: number; // Chi phí booking / Creator (VND)
  targetFollowerRange: string;
  conversionRole: string;
}

export interface ProjectParameters {
  projectName: string;
  brandName: string;
  category: string;
  currency: string;
  lastUpdated: string;
  taxAndCapital: TaxAndCapitalConfig;
  settlementCycle: SettlementCycleConfig;
  supplyChain: SupplyChainConfig;
  marketingBaseline: MarketingBaselineConfig;
  d2cFees: D2CFeesConfig;
  platformFees: PlatformFeesConfig;
  creatorTiers: Record<CreatorTierKey, CreatorTierConfig>;
}

export type TabId = 
  | 'tab-parameters'
  | 'tab-sku-bom'
  | 'tab-cogs-sheet3'
  | 'tab-sales-forecast'
  | 'tab-hr-operations'
  | 'tab-reports'
  | 'tab-pnl'
  | 'tab-cashflow'
  | 'tab-bep-insights';

export interface TabDefinition {
  id: TabId;
  label: string;
  shortDesc: string;
  badge?: string;
  status: 'active' | 'upcoming';
}
