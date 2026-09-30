import { ProjectParameters, TabDefinition } from '../types/financial';

export const DEFAULT_PROJECT_PARAMETERS: ProjectParameters = {
  projectName: 'Mosh&Mode Financial Model & Unit Economics',
  brandName: 'Mosh&Mode',
  category: 'Underarm Care & Clinical Deodorant Cosmeceuticals',
  currency: 'VND',
  lastUpdated: '2026-09-16',
  taxAndCapital: {
    startingCash: 100000000, // 100.000.000 đ
    contingencyReserveMonthly: 0, // Chi phí dự phòng cố định hàng tháng (mặc định 0 đ, người dùng tự nhập tại Tab 1)
    vatOutputRate: 8, // 8%
    corporateIncomeTaxRate: 20, // 20%
    socialInsuranceRate: 21.5, // 21.5%
    seasonalPersonalIncomeTaxRate: 10, // 10%
    depreciationMonths: 24, // 24 tháng
  },
  settlementCycle: {
    ecommerceSettlementDelayDays: 14, // Quyết toán 14 ngày sau khi giao hàng thành công
    b2bSettlementDelayDays: 30, // T+ 30 ngày
  },
  supplyChain: {
    productionLeadTimeDays: 45, // 45 ngày sau PO
  },
  marketingBaseline: {
    marketingBudgetRateGmv: 5, // 5% GMV: Ngân sách triển khai Marketing tổng thể dự án (không bao gồm quảng cáo nội sàn)
  },
  d2cFees: {
    affiliateRate: 8, // 8% Phí Affiliate (Hoa hồng tiếp thị liên kết D2C)
    internalAdsRate: 5, // 5% Phí Quảng cáo nội sàn (Shopee Ads / TikTok Shop Ads)
  },
  platformFees: {
    shopee: {
      paymentFeeRate: 6.0,
      platformCommissionRate: 17.0,
      voucherXtraRate: 5.5,
      orderHandlingFeePerItem: 3000,
      compensationFeePerItem: 2700,
      packagingAndWarehousingRate: 2.0,
      shrinkageRate: 1.0,
    },
    tikTokShop: {
      paymentFeeRate: 6.0,
      platformCommissionRate: 15.5,
      voucherXtraRate: 5.0,
      orderHandlingFeePerItem: 3000,
      compensationFeePerItem: 2008,
      packagingAndWarehousingRate: 2.0,
      shrinkageRate: 1.0,
    },
  },
  creatorTiers: {
    UGC: {
      id: 'UGC',
      name: 'UGC (User Generated Content)',
      description: 'Nhà sáng tạo nội dung tự nhiên, review chân thực, seeding đánh giá cộng đồng.',
      freeSamplesPerSku: 1,
      bookingFeePerCreator: 0,
      targetFollowerRange: '1.000 - 10.000 followers',
      conversionRole: 'Xây dựng Social Proof & Trust ban đầu',
    },
    KOC: {
      id: 'KOC',
      name: 'KOC (Key Opinion Consumer)',
      description: 'Khách hàng có sức ảnh hưởng, tập trung vào trải nghiệm sản phẩm và chốt đơn sàn.',
      freeSamplesPerSku: 5,
      bookingFeePerCreator: 500000,
      targetFollowerRange: '10.000 - 100.000 followers',
      conversionRole: 'Thúc đẩy Affiliate, Livestream & Video chuyển đổi',
    },
    KOL: {
      id: 'KOL',
      name: 'KOL (Key Opinion Leader)',
      description: 'Người nổi tiếng / Chuyên gia da liễu / Beauty Blogger có uy tín cao trong ngành.',
      freeSamplesPerSku: 10,
      bookingFeePerCreator: 10000000,
      targetFollowerRange: '100.000+ followers',
      conversionRole: 'Định vị thương hiệu, chứng thực chuyên gia & tăng độ phủ',
    },
  },
};

export const PROJECT_TABS: TabDefinition[] = [
  {
    id: 'tab-parameters',
    label: '1. Tham Số Chung',
    shortDesc: 'Vốn, Thuế, Chu kỳ tiền, Phí Sàn & Creator',
    status: 'active',
  },
  {
    id: 'tab-sku-bom',
    label: '2. Danh Mục Sản Phẩm',
    shortDesc: 'Danh mục SKU, cơ cấu giá 4 kênh & liên kết Giá Vốn Hàng Bán',
    status: 'active',
  },
  {
    id: 'tab-cogs-sheet3',
    label: '3. Giá Vốn Hàng Bán',
    shortDesc: 'Quản lý nhà cung cấp, so sánh báo giá & chốt MOQ',
    status: 'active',
  },
  {
    id: 'tab-sales-forecast',
    label: '4. Kế Hoạch Bán Hàng',
    shortDesc: 'Dự báo doanh số Shopee, TikTok Shop, B2B & P&L Sản Phẩm',
    status: 'active',
  },
  {
    id: 'tab-hr-operations',
    label: '5. Nhân Sự & Vận Hành',
    shortDesc: 'Headcount hàng ngang, cơ cấu lương, vốn đầu tư & chi phí vận hành',
    status: 'active',
  },
  {
    id: 'tab-reports',
    label: '6. Báo Cáo',
    shortDesc: 'P&L, Dòng tiền & Vốn, Điểm hòa vốn BEP (Real-time)',
    status: 'active',
  },
];
