import { ProductSku, Sheet3CogsData, SupplierQuotation } from '../types/sku';
import { SalesMonth, SalesVolumeMap, ChannelMixConfig, CreatorCampaign } from '../types/salesForecast';
import { SalaryStructurePosition, HeadcountPlanMap, InitialCapexItem, MonthlyOperatingExpense, HrOperationsConfig } from '../types/hrOperations';
import { ProjectParameters } from '../types/financial';
import { calculateMonthlySalaryMatrix, calculateCapexDepreciationMatrix, calculateMonthlyOpexMatrix } from './hrCalculations';
import { 
  PoOrderItem, 
  calculateSingleSkuProductionMatrix, 
  generateAllPoBatches, 
  calculateMonthlyPoExpenseByOrderDate 
} from './productionPlanCalculations';

export interface MonthlyPnlRecord {
  month: SalesMonth;
  // 1. Doanh thu GMV
  grossRevenue: number;
  vatOutput: number; // Thuế VAT đầu ra phải nộp
  grossRevenueAfterVat: number; // 2. Doanh thu gộp (Gross Revenue)

  revenueByChannel: {
    shopee: number;
    tikTokShop: number;
    retail: number;
    b2b: number;
  };
  unitsByChannel: {
    shopee: number;
    tikTokShop: number;
    retail: number;
    b2b: number;
  };
  totalUnits: number;

  // Chi phí sàn (TMĐT)
  platformFees: {
    paymentFee: number;       // Phí thanh toán sàn
    commissionFee: number;    // Phí hoa hồng nền tảng
    voucherXtraFee: number;   // Phí dịch vụ Voucher Xtra
    handlingFee: number;      // Phí xử lý đơn hàng
    compensationFee: number;  // Phí bồi hoàn sàn
    total: number;
  };

  // Chi phí vận chuyển (B2B/Retail)
  shippingB2bRetail: {
    b2bShipping: number;
    retailShipping: number;
    total: number;
  };

  // 3. Doanh thu thuần (Net Revenue)
  netRevenue: number;

  // Giá vốn hàng bán (COGS)
  cogsSales: number;
  cogsSampling: number; // Mẫu tặng sampling xuất kho tính theo giá vốn
  totalCogs: number;

  // 4. Lợi nhuận gộp
  grossProfit: number;
  grossMargin: number; // %

  // Chi phí MKT Sàn TMĐT
  marketingPlatform: {
    affiliateFee: number;   // Phí Tiếp Thị Liên Kết
    internalAdsFee: number; // Phí Quảng Cáo Nội Sàn
    total: number;
  };

  // Chi Phí MKT Tổng thể
  marketingOverall: {
    creatorBookingFee: number; // Phí Booking Creator
    samplingCogsFee: number;   // Phí Sampling hàng mẫu
    total: number;
  };

  // Chi Phí Fulfillment
  fulfillment: {
    packagingFee: number;          // Chi phí bao bì đóng gói
    shrinkageWarehouseFee: number; // Chi phí hao hụt/lưu kho
    total: number;
  };

  // Chi phí nhân sự
  laborCost: number;

  // Chi phí vận hành
  operatingExpenses: {
    capexDepreciation: number; // Trích khấu hao tài sản ban đầu
    operatingOpex: number;     // Chi phí vận hành
    total: number;
  };

  // 5. Lợi nhuận trước thuế (EBIT)
  ebit: number;

  // Thuế TNDN
  corporateTax: number;

  // 6. Lợi nhuận ròng
  netProfit: number;
  netMargin: number; // %

  // Chi phí bán hàng (Selling Expenses) - Tương thích ngược
  sellingExpenses: {
    affiliateFee: number;      // Tiếp thị liên kết sàn
    internalAdsFee: number;    // Quảng cáo nội sàn Shopee/TikTok
    creatorBookingFee: number; // Phí booking UGC/KOC/KOL
    packagingWarehouseFee: number; // Phí bao bì đóng gói theo % doanh thu sàn
    total: number;
  };

  // Chi phí quản lý doanh nghiệp (G&A) - Tương thích ngược
  gaExpenses: {
    salaryCost: number;        // Lương + BHXH + Thưởng + Thuế cty trả
    operatingOpex: number;     // Chi phí kho bãi, điện nước, internet
    capexDepreciation: number; // Trích khấu hao tài sản ban đầu
    total: number;
  };

  // Tổng chi phí hoạt động (OPEX)
  totalOperatingExpenses: number;

  // EBITDA
  ebitda: number;

  // EBT / EBIT
  ebt: number;
}

export interface MonthlyCashFlowRecord {
  month: SalesMonth;
  startingBalance: number;

  // Dòng tiền vào (Cash Inflow) tính từ Doanh thu thuần (Net Revenue) trừ Phí tiếp thị liên kết (Affiliate Fee)
  cashInflow: {
    netRevenue: number;           // Doanh thu thuần từ P&L
    affiliateFeeDeducted: number; // Phí tiếp thị liên kết sàn cấn trừ
    totalInflow: number;          // Dòng tiền vào thực tế = netRevenue - affiliateFeeDeducted
    shopeeReceived?: number;
    tikTokReceived?: number;
    retailReceived?: number;
    b2bReceived?: number;
  };

  // 4 Nhóm dòng tiền ra chuẩn:
  // 1. Nhóm: Vốn hàng bán (Tiền đặt hàng theo ngày phát lệnh PO và hàng sampling)
  cogsOutflow: {
    tienDatHang: number;          // Tiền đặt hàng (liên kết với DANH SÁCH CÁC LỆNH ĐẶT HÀNG PO ĐỀ XUẤT CHI TIẾT - Tab 4)
    cogsSales: number;            // Tương thích ngược: bằng tienDatHang
    cogsSampling: number;         // Tiền hàng sampling quà tặng
    total: number;                // = tienDatHang + cogsSampling
    poBatches?: PoOrderItem[];    // Chi tiết các lệnh PO ghi nhận chi phí trong tháng này
  };

  // 2. Nhóm: Nhân sự
  laborOutflow: {
    salaryCost: number;           // Quỹ lương thực nhận, BHXH, thưởng, thuế TNCN
    total: number;
  };

  // 3. Nhóm: Vận hành (chi phí đầu tư ban đầu, chi phí vận hành mỗi tháng, nhóm phí fulfillment)
  operationsOutflow: {
    capexDisbursement: number;    // Chi phí đầu tư ban đầu (Capex giải ngân)
    operatingOpex: number;        // Chi phí vận hành mỗi tháng (Fixed Opex)
    packagingFee: number;         // Chi phí bao bì đóng gói
    shrinkageWarehouseFee: number; // Chi phí hao hụt & lưu kho
    fulfillmentTotal: number;     // Nhóm phí fulfillment = packaging + shrinkage
    total: number;                // = capexDisbursement + operatingOpex + fulfillmentTotal
    opexCashPaid?: number;
    platformFeePaid?: number;
    packagingPaid?: number;
  };

  // 4. Nhóm: MKT Bán Hàng (Phí quảng cáo nội sàn, Phí Booking Creator)
  marketingSalesOutflow: {
    internalAdsFee: number;       // Phí quảng cáo nội sàn (Shopee/TikTok Ads)
    creatorBookingFee: number;    // Phí Booking Creator (KOL/KOC/UGC)
    total: number;                // = internalAdsFee + creatorBookingFee
    creatorBookingPaid?: number;
    affiliatePaid?: number;
    internalAdsPaid?: number;
  };

  // Thuế TNDN tạm nộp nếu có
  corporateTaxOutflow: number;
  taxOutflow: number;

  // Tổng chi tiền mặt (Total Outflow)
  totalCashOutflow: number;

  // Dòng tiền ròng trong tháng (Net Cash Flow)
  netCashFlow: number;

  // Số dư tiền mặt cuối kỳ (Ending Balance)
  endingBalance: number;

  // Tình trạng dòng tiền
  isCashDeficit: boolean;
  deficitAmount: number;

  // Tương thích ngược:
  workingCapitalOutflow: {
    poCashPaid: number;
    capexDisbursement: number;
    total: number;
  };
  hrOutflow: {
    salaryCashPaid: number;
    total: number;
  };
  marketingOutflow: {
    creatorBookingPaid: number;
    affiliatePaid: number;
    internalAdsPaid: number;
    total: number;
  };
}

export interface BreakEvenCostItemDetail {
  id: string;
  name: string;
  category: 'fixed' | 'variable';
  subCategory: string;
  amount: number;
  pctOfRevenue: number;
  pctOfCategory: number;
  description: string;
}

export interface BreakEvenPointAnalysis {
  totalFixedCosts: number;        // Tổng định phí toàn kỳ (Lương + Opex + Khấu hao)
  averageMonthlyFixedCost: number;// Định phí trung bình mỗi tháng
  totalRevenue: number;           // Doanh thu gộp toàn kỳ
  totalUnits: number;             // Tổng sản lượng bán toàn kỳ
  totalVariableCosts: number;     // Tổng biến phí toàn kỳ (COGS + Phí sàn + Marketing biến đổi + Bao bì + Hao hụt)
  variableCostRatio: number;      // Tỷ lệ biến phí / Doanh thu (%)
  unitVariableCost: number;       // Biến phí đơn vị bình quân (VND/sp)
  unitContributionMargin: number; // Số dư đảm phí đơn vị bình quân (VND/sp) = Giá bán - Biến phí đơn vị
  totalContributionMargin: number;// Tổng số dư đảm phí (VND) = Doanh thu - Tổng biến phí
  contributionMarginRatio: number;// Tỷ lệ số dư đảm phí (%) = 1 - Tỷ lệ biến phí
  breakEvenRevenue: number;       // Doanh thu hòa vốn (VND) = Định phí / Tỷ lệ số dư đảm phí
  breakEvenUnits: number;         // Sản lượng hòa vốn (Sản phẩm) = Định phí / Số dư đảm phí đơn vị
  averageSellingPrice: number;    // Giá bán bình quân 1 sản phẩm
  marginOfSafetyRevenue: number;  // Biên độ an toàn theo doanh thu (VND) = Doanh thu thực - Doanh thu hòa vốn
  marginOfSafetyUnits: number;    // Biên độ an toàn theo sản lượng (Sản phẩm) = Sản lượng thực - Sản lượng hòa vốn
  marginOfSafetyPercent: number;  // Tỷ lệ biên độ an toàn (%) = (Doanh thu thực - Doanh thu hòa vốn) / Doanh thu thực
  safetyRating: 'safe' | 'moderate' | 'warning' | 'deficit'; // Đánh giá mức độ an toàn quản trị
  breakEvenMonthIndex: number;    // Tháng đạt điểm hòa vốn tích lũy (-1 nếu chưa đạt)
  breakEvenMonthLabel: string;    // Tên tháng hòa vốn

  // Bóc tách Chi phí Cố định (Fixed Costs) và Chi phí Biến đổi (Variable Costs)
  fixedCostsBreakdown: {
    laborCost: number;            // Chi phí lương & phụ cấp nhân sự
    officeOpex: number;           // Chi phí vận hành, văn phòng, điện nước, phần mềm SaaS
    depreciation: number;         // Khấu hao tài sản cố định
    total: number;
  };
  variableCostsBreakdown: {
    totalCogs: number;            // Giá vốn hàng bán (COGS)
    platformFees: number;         // Phí sàn TMĐT (Payment, Commission, Voucher Xtra...)
    internalAdsFee: number;       // Chi phí quảng cáo nội sàn (Shopee/TikTok Ads)
    affiliateFee: number;         // Chi phí tiếp thị liên kết (Affiliate)
    creatorBookingFee: number;    // Chi phí Booking Creator
    packagingFee: number;         // Chi phí bao bì đóng gói
    shrinkageFee: number;         // Chi phí hao hụt lưu kho & hoàn hàng
    total: number;
  };
  costItemList: BreakEvenCostItemDetail[];

  // Các chỉ số nâng cao theo yêu cầu bài toán BEP:
  salesMonthsCount: number;       // Số tháng có doanh thu thực tế
  totalMonthsCount: number;       // Tổng số tháng trong kỳ kế hoạch
  isBreakevenAchievedInPlan: boolean; // Đã đạt hòa vốn trong kỳ kế hoạch hay chưa
  revenueShortfallTotal: number;  // Doanh thu GMV còn thiếu để hòa vốn (0 nếu đã hòa vốn)
  revenueRequiredMonthlyGrowth: number; // GMV cần tăng thêm mỗi tháng bán hàng (VND/tháng)
  unitsShortfallTotal: number;    // Sản lượng còn thiếu để hòa vốn (0 nếu đã đạt)
  unitsRequiredMonthlyGrowth: number; // Sản phẩm cần bán thêm mỗi tháng bán hàng (sp/tháng)
  requiredGmvGrowthPercent: number;   // % GMV cần tăng trưởng so với kế hoạch
  endingCumulativeEbt: number;    // Lợi nhuận tích lũy cuối kỳ
  unrecoveredDeficit: number;     // Lỗ lũy kế chưa bù đắp (0 nếu đã hòa vốn)
  monthlyAverageEbt: number;      // Lợi nhuận ròng EBT trung bình mỗi tháng bán hàng
  extraMonthsNeeded: number;      // Số tháng cần bán thêm để hòa vốn nếu giữ nguyên mức hiện tại
  runRateMonthlyProfit: number;   // Lợi nhuận vận hành ở trạng thái ổn định
  runRateExtraMonthsNeeded: number;// Số tháng bán thêm theo tốc độ ổn định
}

export interface FullFinancialReportData {
  pnlMonthly: MonthlyPnlRecord[];
  pnlSummary: {
    grossRevenue: number;
    vatOutput: number;
    grossRevenueAfterVat: number;
    platformFees: number;
    shippingB2bRetail: number;
    netRevenue: number;
    cogsSales: number;
    cogsSampling: number;
    totalCogs: number;
    grossProfit: number;
    grossMargin: number;
    marketingPlatform: number;
    marketingOverall: number;
    fulfillment: number;
    laborCost: number;
    operatingExpenses: number;
    ebit: number;
    sellingExpenses: number;
    gaExpenses: number;
    ebitda: number;
    ebt: number;
    corporateTax: number;
    netProfit: number;
    netMargin: number;
    totalUnits: number;
  };
  cashFlowMonthly: MonthlyCashFlowRecord[];
  cashFlowSummary: {
    startingCash: number;
    totalInflow: number;
    inflowNetRevenue: number;
    inflowAffiliateFee: number;
    cogsOutflow: number;
    tienDatHang: number;
    cogsSales: number;
    cogsSampling: number;
    laborOutflow: number;
    operationsOutflow: number;
    capexDisbursement: number;
    operatingOpex: number;
    fulfillmentTotal: number;
    packagingFee: number;
    shrinkageWarehouseFee: number;
    marketingSalesOutflow: number;
    internalAdsFee: number;
    creatorBookingFee: number;
    taxOutflow: number;
    totalOutflow: number;
    netCashFlow: number;
    finalCashBalance: number;
    minCashBalance: number;
    minCashMonthLabel: string;
    totalWorkingCapitalDeficit: number;
    workingCapitalOutflow?: number;
    hrOutflow?: number;
    marketingOutflow?: number;
  };
  bep: BreakEvenPointAnalysis;
}

/**
 * Tính toán toàn bộ Báo cáo Tài chính Real-time từ các Tab kế hoạch
 */
export function calculateFullFinancialReport(
  skus: ProductSku[],
  sheet3CogsMap: Record<string, Sheet3CogsData>,
  months: SalesMonth[],
  volumes: SalesVolumeMap,
  channelMix: ChannelMixConfig,
  creatorCampaigns: CreatorCampaign[],
  positions: SalaryStructurePosition[],
  headcountMap: HeadcountPlanMap,
  capexItems: InitialCapexItem[],
  opexItems: MonthlyOperatingExpense[],
  hrConfig: HrOperationsConfig,
  parameters: ProjectParameters,
  quotations: SupplierQuotation[] = []
): FullFinancialReportData {
  // 1. Ma trận lương & HR
  const salaryMatrix = calculateMonthlySalaryMatrix(
    positions,
    headcountMap,
    months,
    parameters.taxAndCapital,
    hrConfig
  );

  // 2. Ma trận khấu hao Capex
  const capexMatrix = calculateCapexDepreciationMatrix(
    capexItems,
    months
  );

  // 3. Ma trận Opex vận hành (tính theo tháng bắt đầu phát sinh của từng hạng mục)
  const opexMatrix = calculateMonthlyOpexMatrix(opexItems, months);

  // 3b. Tính ma trận sản xuất và Danh sách các lệnh PO đề xuất chi tiết (Tab 4: Kế hoạch bán hàng)
  // Liên kết trực tiếp để lấy chi phí Tiền đặt hàng theo Ngày phát lệnh PO
  const singleSkus = skus.filter((s) => s.type !== 'combo');
  const prodMatrixResult = calculateSingleSkuProductionMatrix(
    skus,
    months,
    volumes,
    creatorCampaigns,
    sheet3CogsMap
  );
  const poBatches = generateAllPoBatches(
    singleSkus,
    months,
    prodMatrixResult.matrix,
    sheet3CogsMap,
    quotations,
    parameters,
    'jit-moq'
  );
  const { monthlyMap: poExpensesByMonth } = calculateMonthlyPoExpenseByOrderDate(
    poBatches,
    months
  );

  // 4. Bóc tách phí sàn TMĐT từ tham số Tab 1
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

  const d2cFees = parameters.d2cFees || {
    affiliateRate: 8.0,
    internalAdsRate: 5.0,
  };
  const shopeeAffiliate = d2cFees.shopeeAffiliateRate ?? d2cFees.affiliateRate ?? 8.0;
  const shopeeInternalAds = d2cFees.shopeeInternalAdsRate ?? d2cFees.internalAdsRate ?? 5.0;
  const tikTokAffiliate = d2cFees.tikTokAffiliateRate ?? d2cFees.affiliateRate ?? 8.0;
  const tikTokInternalAds = d2cFees.tikTokInternalAdsRate ?? d2cFees.internalAdsRate ?? 5.0;

  const UGC = parameters.creatorTiers?.UGC;
  const KOC = parameters.creatorTiers?.KOC;
  const KOL = parameters.creatorTiers?.KOL;

  // 5. Tính toán ma trận Sampling và Booking Creator theo tháng
  const monthlyCreatorData: Record<string, { samplingUnitsBySku: Record<string, number>; bookingFee: number }> = {};
  months.forEach((m) => {
    monthlyCreatorData[m.id] = {
      samplingUnitsBySku: {},
      bookingFee: 0,
    };
  });

  creatorCampaigns.forEach((camp) => {
    camp.skuIds?.forEach((skuId) => {
      months.forEach((m) => {
        const cfg = camp.monthConfigs?.[m.id];
        if (cfg) {
          const u = cfg.ugcCount || 0;
          const k = cfg.kocCount || 0;
          const l = cfg.kolCount || 0;
          const perSkuSamples =
            u * (cfg.ugcSamplesPerSku ?? UGC?.freeSamplesPerSku ?? 1) +
            k * (cfg.kocSamplesPerSku ?? KOC?.freeSamplesPerSku ?? 5) +
            l * (cfg.kolSamplesPerSku ?? KOL?.freeSamplesPerSku ?? 10);

          monthlyCreatorData[m.id].samplingUnitsBySku[skuId] =
            (monthlyCreatorData[m.id].samplingUnitsBySku[skuId] || 0) + perSkuSamples;

          // Booking fee tính 1 lần theo chiến dịch / creator
          const booking =
            u * (UGC?.bookingFeePerCreator || 0) +
            k * (KOC?.bookingFeePerCreator || 0) +
            l * (KOL?.bookingFeePerCreator || 0);
          monthlyCreatorData[m.id].bookingFee += booking;
        }
      });
    });
  });

  // 6. Tính toán P&L theo từng tháng
  const pnlMonthly: MonthlyPnlRecord[] = months.map((m) => {
    let mGrossRevenue = 0;
    let mUnitsTotal = 0;
    let mCogsSales = 0;
    let mCogsSampling = 0;

    let mShopeeRev = 0;
    let mTikTokRev = 0;
    let mRetailRev = 0;
    let mB2bRev = 0;

    let mShopeeUnits = 0;
    let mTikTokUnits = 0;
    let mRetailUnits = 0;
    let mB2bUnits = 0;

    let mPaymentFee = 0;
    let mCommissionFee = 0;
    let mVoucherXtraFee = 0;
    let mHandlingFee = 0;
    let mCompensationFee = 0;

    let mShopeeAffiliateFee = 0;
    let mShopeeInternalAdsFee = 0;
    let mTikTokAffiliateFee = 0;
    let mTikTokInternalAdsFee = 0;
    let mPackagingFee = 0;

    skus.forEach((sku) => {
      const vol = volumes[sku.id]?.[m.id] || 0;
      mUnitsTotal += vol;

      // Đơn giá vốn SKU
      let unitCogs = sheet3CogsMap[sku.id]?.cogsPerUnit || 0;
      if (!unitCogs && sku.type === 'combo' && sku.comboItems) {
        unitCogs = sku.comboItems.reduce((acc, ci) => {
          const compCogs = sheet3CogsMap[ci.skuId]?.cogsPerUnit || 0;
          return acc + compCogs * ci.quantity;
        }, 0);
      }
      mCogsSales += vol * unitCogs;

      // Chi phí COGS mẫu tặng sampling
      const sampleVol = monthlyCreatorData[m.id]?.samplingUnitsBySku[sku.id] || 0;
      mCogsSampling += sampleVol * unitCogs;

      // Phân bổ theo 4 kênh bán hàng
      const shopeeUnits = Math.round((vol * (channelMix.shopee || 0)) / 100);
      const tikTokUnits = Math.round((vol * (channelMix.tikTokShop || 0)) / 100);
      const retailUnits = Math.round((vol * (channelMix.retail || 0)) / 100);
      const b2bUnits = Math.round((vol * (channelMix.b2b || 0)) / 100);

      mShopeeUnits += shopeeUnits;
      mTikTokUnits += tikTokUnits;
      mRetailUnits += retailUnits;
      mB2bUnits += b2bUnits;

      const shopeePrice = sku.prices.shopee || sku.prices.standard;
      const tikTokPrice = sku.prices.tikTokShop || sku.prices.standard;
      const retailPrice = sku.prices.retail || sku.prices.standard;
      const b2bPrice = sku.prices.b2b || sku.prices.standard;

      const shopeeRev = shopeeUnits * shopeePrice;
      const tikTokRev = tikTokUnits * tikTokPrice;
      const retailRev = retailUnits * retailPrice;
      const b2bRev = b2bUnits * b2bPrice;

      mShopeeRev += shopeeRev;
      mTikTokRev += tikTokRev;
      mRetailRev += retailRev;
      mB2bRev += b2bRev;

      // Phí sàn Shopee
      if (shopeeUnits > 0) {
        mPaymentFee += (shopeeRev * (shopeeFees.paymentFeeRate || 0)) / 100;
        mCommissionFee += (shopeeRev * (shopeeFees.platformCommissionRate || 0)) / 100;
        mVoucherXtraFee += (shopeeRev * (shopeeFees.voucherXtraRate || 0)) / 100;
        mHandlingFee += shopeeUnits * (shopeeFees.orderHandlingFeePerItem || 0);
        mCompensationFee += shopeeUnits * (shopeeFees.compensationFeePerItem || 0);

        mShopeeAffiliateFee += (shopeeRev * shopeeAffiliate) / 100;
        mShopeeInternalAdsFee += (shopeeRev * shopeeInternalAds) / 100;
        mPackagingFee += (shopeeRev * (shopeeFees.packagingAndWarehousingRate || 0)) / 100;
      }

      // Phí sàn TikTok Shop
      if (tikTokUnits > 0) {
        mPaymentFee += (tikTokRev * (tikTokFees.paymentFeeRate || 0)) / 100;
        mCommissionFee += (tikTokRev * (tikTokFees.platformCommissionRate || 0)) / 100;
        mVoucherXtraFee += (tikTokRev * (tikTokFees.voucherXtraRate || 0)) / 100;
        mHandlingFee += tikTokUnits * (tikTokFees.orderHandlingFeePerItem || 0);
        mCompensationFee += tikTokUnits * (tikTokFees.compensationFeePerItem || 0);

        mTikTokAffiliateFee += (tikTokRev * tikTokAffiliate) / 100;
        mTikTokInternalAdsFee += (tikTokRev * tikTokInternalAds) / 100;
        mPackagingFee += (tikTokRev * (tikTokFees.packagingAndWarehousingRate || 0)) / 100;
      }
    });

    mGrossRevenue = mShopeeRev + mTikTokRev + mRetailRev + mB2bRev;
    const vatRate = parameters.taxAndCapital?.vatOutputRate ?? 8;
    const vatOutput = Math.round((mGrossRevenue * vatRate) / (100 + vatRate));
    // 2. Doanh thu gộp (Gross Revenue) sau VAT
    const grossRevenueAfterVat = mGrossRevenue - vatOutput;

    // Chi phí sàn (TMĐT)
    const totalPlatformFee = Math.round(
      mPaymentFee + mCommissionFee + mVoucherXtraFee + mHandlingFee + mCompensationFee
    );

    // Chi phí vận chuyển (B2B/Retail): B2B logistics 5% + Retail 25k/đơn hoặc 5%
    const b2bShipping = Math.round(mB2bRev * 0.05);
    const retailShipping = Math.round(mRetailUnits * 25000);
    const shippingB2bRetailTotal = b2bShipping + retailShipping;

    // 3. Doanh thu thuần (Net Revenue)
    const netRevenue = grossRevenueAfterVat - totalPlatformFee - shippingB2bRetailTotal;

    // Giá vốn hàng bán (COGS)
    const cogsSales = Math.round(mCogsSales);
    const cogsSampling = Math.round(mCogsSampling);
    const totalCogs = cogsSales + cogsSampling;

    // 4. Lợi nhuận gộp = Doanh thu thuần - COGS hàng bán
    const grossProfit = netRevenue - cogsSales;
    const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    // Chi phí MKT Sàn TMĐT
    const affiliateTotal = Math.round(mShopeeAffiliateFee + mTikTokAffiliateFee);
    const internalAdsTotal = Math.round(mShopeeInternalAdsFee + mTikTokInternalAdsFee);
    const mktPlatformTotal = affiliateTotal + internalAdsTotal;

    // Chi Phí MKT Tổng thể
    const creatorBookingTotal = Math.round(monthlyCreatorData[m.id]?.bookingFee || 0);
    const mktOverallTotal = creatorBookingTotal + cogsSampling;

    // Chi Phí Fulfillment: Bao bì đóng gói + Hao hụt lưu kho
    const packagingTotal = Math.round(mPackagingFee);
    const shrinkageTotal = Math.round(
      ((mShopeeRev * (shopeeFees.shrinkageRate || 1.0)) / 100) +
      ((mTikTokRev * (tikTokFees.shrinkageRate || 1.0)) / 100)
    );
    const fulfillmentTotal = packagingTotal + shrinkageTotal;

    // Chi phí nhân sự (từ Tab 5)
    const salaryCost = salaryMatrix.monthlyTotalSalary[m.id] || 0;

    // Chi phí vận hành (từ Tab 5)
    const capexDepreciation = capexMatrix.monthlyTotalDepreciation[m.id] || 0;
    const opexCost = opexMatrix.monthlyTotalOpex[m.id] || 0;
    const operatingTotal = capexDepreciation + opexCost;

    // 5. Lợi nhuận trước thuế (EBIT)
    const ebit = grossProfit - mktPlatformTotal - mktOverallTotal - fulfillmentTotal - salaryCost - operatingTotal;

    // Thuế TNDN 20% nếu EBIT > 0
    const citRate = parameters.taxAndCapital?.corporateIncomeTaxRate ?? 20;
    const corporateTax = ebit > 0 ? Math.round((ebit * citRate) / 100) : 0;

    // 6. Lợi nhuận ròng
    const netProfit = ebit - corporateTax;
    const netMargin = mGrossRevenue > 0 ? (netProfit / mGrossRevenue) * 100 : 0;

    // Tương thích ngược
    const totalSelling = affiliateTotal + internalAdsTotal + creatorBookingTotal + packagingTotal;
    const totalGa = salaryCost + opexCost + capexDepreciation;
    const totalOperatingExpenses = mktPlatformTotal + mktOverallTotal + fulfillmentTotal + salaryCost + operatingTotal;
    const ebitda = ebit + capexDepreciation;
    const ebt = ebit;

    return {
      month: m,
      grossRevenue: mGrossRevenue,
      vatOutput,
      grossRevenueAfterVat,
      revenueByChannel: {
        shopee: mShopeeRev,
        tikTokShop: mTikTokRev,
        retail: mRetailRev,
        b2b: mB2bRev,
      },
      unitsByChannel: {
        shopee: mShopeeUnits,
        tikTokShop: mTikTokUnits,
        retail: mRetailUnits,
        b2b: mB2bUnits,
      },
      totalUnits: mUnitsTotal,
      platformFees: {
        paymentFee: Math.round(mPaymentFee),
        commissionFee: Math.round(mCommissionFee),
        voucherXtraFee: Math.round(mVoucherXtraFee),
        handlingFee: Math.round(mHandlingFee),
        compensationFee: Math.round(mCompensationFee),
        total: totalPlatformFee,
      },
      shippingB2bRetail: {
        b2bShipping,
        retailShipping,
        total: shippingB2bRetailTotal,
      },
      netRevenue,
      cogsSales,
      cogsSampling,
      totalCogs,
      grossProfit,
      grossMargin,
      marketingPlatform: {
        affiliateFee: affiliateTotal,
        internalAdsFee: internalAdsTotal,
        total: mktPlatformTotal,
      },
      marketingOverall: {
        creatorBookingFee: creatorBookingTotal,
        samplingCogsFee: cogsSampling,
        total: mktOverallTotal,
      },
      fulfillment: {
        packagingFee: packagingTotal,
        shrinkageWarehouseFee: shrinkageTotal,
        total: fulfillmentTotal,
      },
      laborCost: salaryCost,
      operatingExpenses: {
        capexDepreciation,
        operatingOpex: opexCost,
        total: operatingTotal,
      },
      ebit,
      corporateTax,
      netProfit,
      netMargin,
      sellingExpenses: {
        affiliateFee: affiliateTotal,
        internalAdsFee: internalAdsTotal,
        creatorBookingFee: creatorBookingTotal,
        packagingWarehouseFee: packagingTotal,
        total: totalSelling,
      },
      gaExpenses: {
        salaryCost,
        operatingOpex: opexCost,
        capexDepreciation,
        total: totalGa,
      },
      totalOperatingExpenses,
      ebitda,
      ebt,
    };
  });

  // 7. Tổng hợp P&L Toàn Kỳ
  const pnlSummary = pnlMonthly.reduce(
    (acc, m) => {
      acc.grossRevenue += m.grossRevenue;
      acc.vatOutput += m.vatOutput;
      acc.grossRevenueAfterVat += m.grossRevenueAfterVat;
      acc.platformFees += m.platformFees.total;
      acc.shippingB2bRetail += m.shippingB2bRetail.total;
      acc.netRevenue += m.netRevenue;
      acc.cogsSales += m.cogsSales;
      acc.cogsSampling += m.cogsSampling;
      acc.totalCogs += m.totalCogs;
      acc.grossProfit += m.grossProfit;
      acc.marketingPlatform += m.marketingPlatform.total;
      acc.marketingOverall += m.marketingOverall.total;
      acc.fulfillment += m.fulfillment.total;
      acc.laborCost += m.laborCost;
      acc.operatingExpenses += m.operatingExpenses.total;
      acc.ebit += m.ebit;
      acc.sellingExpenses += m.sellingExpenses.total;
      acc.gaExpenses += m.gaExpenses.total;
      acc.ebitda += m.ebitda;
      acc.ebt += m.ebt;
      acc.corporateTax += m.corporateTax;
      acc.netProfit += m.netProfit;
      acc.totalUnits += m.totalUnits;
      return acc;
    },
    {
      grossRevenue: 0,
      vatOutput: 0,
      grossRevenueAfterVat: 0,
      platformFees: 0,
      shippingB2bRetail: 0,
      netRevenue: 0,
      cogsSales: 0,
      cogsSampling: 0,
      totalCogs: 0,
      grossProfit: 0,
      grossMargin: 0,
      marketingPlatform: 0,
      marketingOverall: 0,
      fulfillment: 0,
      laborCost: 0,
      operatingExpenses: 0,
      ebit: 0,
      sellingExpenses: 0,
      gaExpenses: 0,
      ebitda: 0,
      ebt: 0,
      corporateTax: 0,
      netProfit: 0,
      netMargin: 0,
      totalUnits: 0,
    }
  );
  pnlSummary.grossMargin =
    pnlSummary.netRevenue > 0 ? (pnlSummary.grossProfit / pnlSummary.netRevenue) * 100 : 0;
  pnlSummary.netMargin =
    pnlSummary.grossRevenue > 0 ? (pnlSummary.netProfit / pnlSummary.grossRevenue) * 100 : 0;

  // 8. Tính toán Báo cáo Dòng Tiền & Vốn theo thời gian thực (Kế hoạch dòng tiền)
  // Quy định 4 nhóm chi phí ra:
  // - Vốn Vận Hành: Đặt hàng sản xuất PO (Cọc 50% trước 1 tháng, tất toán 50% khi nhận hàng) + Capex đầu tư giải ngân
  // - Nhân Sự: Chi trả lương, BHXH & phúc lợi
  // - Vận Hành: Chi trả kho bãi, điện nước Opex + Phí sàn TMĐT + Bao bì đóng gói
  // - Marketing: Booking Creator + Affiliate + Ads sàn
  let currentBalance = parameters.taxAndCapital?.startingCash ?? 100000000;
  const initialCash = currentBalance;
  let minBalance = currentBalance;
  let minMonthLabel = months[0]?.label || 'Đầu kỳ';
  let totalCapitalDeficit = 0;

  // Bóc tách ngày giải ngân Capex theo tháng
  const capexByMonth: Record<string, number> = {};
  capexItems.forEach((c) => {
    const matchM = months.find(
      (m) =>
        m.id === c.disbursementMonth ||
        m.dateStr === c.disbursementMonth ||
        m.label === c.disbursementLabel ||
        m.label === c.disbursementMonth
    );
    const mId = matchM ? matchM.id : months[0]?.id || '2026-09';
    capexByMonth[mId] = (capexByMonth[mId] || 0) + c.amount;
  });

  const cashFlowMonthly: MonthlyCashFlowRecord[] = months.map((m, idx) => {
    const startBal = currentBalance;
    const pnlRec = pnlMonthly[idx];

    // DÒNG TIỀN VÀO (CASH INFLOW)
    // Tính từ Doanh thu thuần (Net Revenue) theo báo cáo P&L trừ đi phí tiếp thị liên kết (Affiliate Fee)
    // (Vì chi phí này chỉ phát sinh khi có đơn hàng phát sinh doanh số trên sàn, sàn tự động cấn trừ trước khi chuyển tiền)
    const netRevenue = Math.round(pnlRec.netRevenue);
    const affiliateFeeDeducted = Math.round(pnlRec.marketingPlatform.affiliateFee);
    const totalInflow = Math.round(netRevenue - affiliateFeeDeducted);

    // Thu tiền từng kênh để tương thích ngược
    const shopeeCashIn = Math.max(0, Math.round(pnlRec.revenueByChannel.shopee - pnlRec.platformFees.total * (pnlRec.revenueByChannel.shopee / (pnlRec.revenueByChannel.shopee + pnlRec.revenueByChannel.tikTokShop || 1))));
    const tikTokCashIn = Math.max(0, Math.round(pnlRec.revenueByChannel.tikTokShop - pnlRec.platformFees.total * (pnlRec.revenueByChannel.tikTokShop / (pnlRec.revenueByChannel.shopee + pnlRec.revenueByChannel.tikTokShop || 1))));
    const retailCashIn = Math.round(pnlRec.revenueByChannel.retail);
    const b2bCashIn = Math.round(pnlRec.revenueByChannel.b2b);

    // DÒNG TIỀN RA (CASH OUTFLOW) ĐƯỢC PHÂN VÀO 4 NHÓM CHÍNH:
    // Nhóm 1: Vốn hàng bán (Tiền đặt hàng PO theo ngày phát lệnh, đã bao gồm cả hàng bán và sampling)
    // Ngày phát lệnh PO của tháng nào, thì tháng đó sẽ ghi nhận chi phí Tiền đặt hàng trong báo cáo dòng tiền
    const poMonthData = poExpensesByMonth[m.id] || { totalPoExpense: 0, batches: [] };
    const tienDatHang = Math.round(poMonthData.totalPoExpense);
    const cogsTotal = tienDatHang;

    // Nhóm 2: Nhân sự
    const laborSalaryCost = Math.round(pnlRec.laborCost);
    const laborTotal = laborSalaryCost;

    // Nhóm 3: Vận hành (bao gồm chi phí đầu tư ban đầu, chi phí vận hành mỗi tháng, nhóm phí fulfillment)
    const capexDisbursement = Math.round(capexByMonth[m.id] || 0);
    const operatingOpex = Math.round(pnlRec.operatingExpenses.operatingOpex);
    const packagingFee = Math.round(pnlRec.fulfillment.packagingFee);
    const shrinkageWarehouseFee = Math.round(pnlRec.fulfillment.shrinkageWarehouseFee);
    const fulfillmentTotal = packagingFee + shrinkageWarehouseFee;
    const operationsTotal = capexDisbursement + operatingOpex + fulfillmentTotal;

    // Nhóm 4: MKT Bán Hàng (bao gồm: Phí quảng cáo nội sàn, Phí Booking Creator)
    const internalAdsFee = Math.round(pnlRec.marketingPlatform.internalAdsFee);
    const creatorBookingFee = Math.round(pnlRec.marketingOverall.creatorBookingFee);
    const marketingSalesTotal = internalAdsFee + creatorBookingFee;

    // Thuế TNDN tạm nộp (nếu có phát sinh từ P&L)
    const corporateTaxOutflow = Math.round(pnlRec.corporateTax);

    // Tổng chi tiền mặt = Tổng 4 nhóm (+ Thuế TNDN nếu có)
    const totalOutflow = cogsTotal + laborTotal + operationsTotal + marketingSalesTotal + corporateTaxOutflow;
    const netFlow = totalInflow - totalOutflow;
    currentBalance += netFlow;

    if (currentBalance < minBalance) {
      minBalance = currentBalance;
      minMonthLabel = m.label;
    }

    const isDeficit = currentBalance < 0;
    const deficitAmt = isDeficit ? Math.abs(currentBalance) : 0;
    if (deficitAmt > totalCapitalDeficit) {
      totalCapitalDeficit = deficitAmt;
    }

    return {
      month: m,
      startingBalance: startBal,
      cashInflow: {
        netRevenue,
        affiliateFeeDeducted,
        totalInflow,
        shopeeReceived: shopeeCashIn,
        tikTokReceived: tikTokCashIn,
        retailReceived: retailCashIn,
        b2bReceived: b2bCashIn,
      },
      cogsOutflow: {
        tienDatHang,
        cogsSales: tienDatHang, // Để tương thích ngược
        cogsSampling: 0,        // Đã bao gồm trong Tiền đặt hàng PO
        total: cogsTotal,
        poBatches: poMonthData.batches,
      },
      laborOutflow: {
        salaryCost: laborSalaryCost,
        total: laborTotal,
      },
      operationsOutflow: {
        capexDisbursement,
        operatingOpex,
        packagingFee,
        shrinkageWarehouseFee,
        fulfillmentTotal,
        total: operationsTotal,
        opexCashPaid: operatingOpex,
        platformFeePaid: pnlRec.platformFees.total,
        packagingPaid: packagingFee,
      },
      marketingSalesOutflow: {
        internalAdsFee,
        creatorBookingFee,
        total: marketingSalesTotal,
        creatorBookingPaid: creatorBookingFee,
        affiliatePaid: affiliateFeeDeducted,
        internalAdsPaid: internalAdsFee,
      },
      corporateTaxOutflow,
      taxOutflow: corporateTaxOutflow,
      totalCashOutflow: totalOutflow,
      netCashFlow: netFlow,
      endingBalance: currentBalance,
      isCashDeficit: isDeficit,
      deficitAmount: deficitAmt,
      // Tương thích ngược:
      workingCapitalOutflow: {
        poCashPaid: tienDatHang,
        capexDisbursement,
        total: tienDatHang + capexDisbursement,
      },
      hrOutflow: {
        salaryCashPaid: laborSalaryCost,
        total: laborTotal,
      },
      marketingOutflow: {
        creatorBookingPaid: creatorBookingFee,
        affiliatePaid: affiliateFeeDeducted,
        internalAdsPaid: internalAdsFee,
        total: creatorBookingFee + affiliateFeeDeducted + internalAdsFee,
      },
    };
  });

  const cashFlowSummary = {
    startingCash: initialCash,
    totalInflow: cashFlowMonthly.reduce((sum, c) => sum + c.cashInflow.totalInflow, 0),
    inflowNetRevenue: cashFlowMonthly.reduce((sum, c) => sum + c.cashInflow.netRevenue, 0),
    inflowAffiliateFee: cashFlowMonthly.reduce((sum, c) => sum + c.cashInflow.affiliateFeeDeducted, 0),

    // 4 Nhóm dòng tiền ra:
    cogsOutflow: cashFlowMonthly.reduce((sum, c) => sum + c.cogsOutflow.total, 0),
    tienDatHang: cashFlowMonthly.reduce((sum, c) => sum + c.cogsOutflow.tienDatHang, 0),
    cogsSales: cashFlowMonthly.reduce((sum, c) => sum + c.cogsOutflow.tienDatHang, 0),
    cogsSampling: 0,

    laborOutflow: cashFlowMonthly.reduce((sum, c) => sum + c.laborOutflow.total, 0),

    operationsOutflow: cashFlowMonthly.reduce((sum, c) => sum + c.operationsOutflow.total, 0),
    capexDisbursement: cashFlowMonthly.reduce((sum, c) => sum + c.operationsOutflow.capexDisbursement, 0),
    operatingOpex: cashFlowMonthly.reduce((sum, c) => sum + c.operationsOutflow.operatingOpex, 0),
    fulfillmentTotal: cashFlowMonthly.reduce((sum, c) => sum + c.operationsOutflow.fulfillmentTotal, 0),
    packagingFee: cashFlowMonthly.reduce((sum, c) => sum + c.operationsOutflow.packagingFee, 0),
    shrinkageWarehouseFee: cashFlowMonthly.reduce((sum, c) => sum + c.operationsOutflow.shrinkageWarehouseFee, 0),

    marketingSalesOutflow: cashFlowMonthly.reduce((sum, c) => sum + c.marketingSalesOutflow.total, 0),
    internalAdsFee: cashFlowMonthly.reduce((sum, c) => sum + c.marketingSalesOutflow.internalAdsFee, 0),
    creatorBookingFee: cashFlowMonthly.reduce((sum, c) => sum + c.marketingSalesOutflow.creatorBookingFee, 0),

    taxOutflow: cashFlowMonthly.reduce((sum, c) => sum + c.corporateTaxOutflow, 0),
    totalOutflow: cashFlowMonthly.reduce((sum, c) => sum + c.totalCashOutflow, 0),
    netCashFlow: cashFlowMonthly.reduce((sum, c) => sum + c.netCashFlow, 0),
    finalCashBalance: currentBalance,
    minCashBalance: minBalance,
    minCashMonthLabel: minMonthLabel,
    totalWorkingCapitalDeficit: totalCapitalDeficit,

    // Tương thích ngược:
    workingCapitalOutflow: cashFlowMonthly.reduce((sum, c) => sum + c.cogsOutflow.total, 0),
    hrOutflow: cashFlowMonthly.reduce((sum, c) => sum + c.laborOutflow.total, 0),
    marketingOutflow: cashFlowMonthly.reduce((sum, c) => sum + c.marketingSalesOutflow.total, 0),
  };

  // 9. Phân Tích Điểm Hòa Vốn (Break-Even Point - BEP)
  // BÓC TÁCH TOÀN BỘ CHI PHÍ THÀNH 2 NHÓM:
  // Nhóm 1: Chi Phí Cố Định (Fixed Costs - FC)
  const fixedLaborCost = pnlMonthly.reduce((sum, m) => sum + m.laborCost, 0);
  const fixedOfficeOpex = pnlMonthly.reduce((sum, m) => sum + m.operatingExpenses.operatingOpex, 0);
  const fixedDepreciation = pnlMonthly.reduce((sum, m) => sum + m.operatingExpenses.capexDepreciation, 0);
  const totalFixedCosts = fixedLaborCost + fixedOfficeOpex + fixedDepreciation;
  const avgMonthlyFixedCost = months.length > 0 ? Math.round(totalFixedCosts / months.length) : 0;

  // Nhóm 2: Chi Phí Biến Đổi (Variable Costs - VC)
  const varVat = pnlSummary.vatOutput;
  const varPlatformFees = pnlSummary.platformFees;
  const varShipping = pnlSummary.shippingB2bRetail;
  const varCogs = pnlSummary.totalCogs;
  const varInternalAds = pnlMonthly.reduce((sum, m) => sum + m.marketingPlatform.internalAdsFee, 0);
  const varAffiliate = pnlMonthly.reduce((sum, m) => sum + m.marketingPlatform.affiliateFee, 0);
  const varCreatorBooking = pnlMonthly.reduce((sum, m) => sum + m.marketingOverall.creatorBookingFee, 0);
  const varPackaging = pnlMonthly.reduce((sum, m) => sum + m.fulfillment.packagingFee, 0);
  const varShrinkage = pnlMonthly.reduce((sum, m) => sum + m.fulfillment.shrinkageWarehouseFee, 0);
  const totalVariableCosts = varVat + varPlatformFees + varShipping + varCogs + varInternalAds + varAffiliate + varCreatorBooking + varPackaging + varShrinkage;

  const totalRev = pnlSummary.grossRevenue;
  const totalUnits = pnlSummary.totalUnits;

  const variableCostRatio = totalRev > 0 ? (totalVariableCosts / totalRev) * 100 : 0;
  const totalContributionMargin = Math.max(0, totalRev - totalVariableCosts);
  const contributionMarginRatio = totalRev > 0 ? (totalContributionMargin / totalRev) * 100 : 0;

  const avgPrice = totalUnits > 0 ? Math.round(totalRev / totalUnits) : 0;
  const unitVariableCost = totalUnits > 0 ? Math.round(totalVariableCosts / totalUnits) : 0;
  const unitContributionMargin = Math.max(0, avgPrice - unitVariableCost);

  // Doanh thu hòa vốn (Break-Even Revenue) = Tổng định phí / Tỷ lệ số dư đảm phí
  const breakEvenRevenue =
    contributionMarginRatio > 0
      ? Math.round(totalFixedCosts / (contributionMarginRatio / 100))
      : 0;

  // Sản lượng hòa vốn (Break-Even Units) = Tổng định phí / Số dư đảm phí đơn vị
  const breakEvenUnits =
    unitContributionMargin > 0
      ? Math.round(totalFixedCosts / unitContributionMargin)
      : (avgPrice > 0 ? Math.round(breakEvenRevenue / avgPrice) : 0);

  // Biên độ an toàn (Margin of Safety - MoS)
  const marginOfSafetyRevenue = totalRev - breakEvenRevenue;
  const marginOfSafetyUnits = totalUnits - breakEvenUnits;
  const marginOfSafetyPercent =
    totalRev > 0
      ? Math.max(-100, Math.min(100, (marginOfSafetyRevenue / totalRev) * 100))
      : 0;

  // Đánh giá mức độ an toàn quản trị (Safety Rating)
  let safetyRating: 'safe' | 'moderate' | 'warning' | 'deficit' = 'safe';
  if (marginOfSafetyPercent < 0) {
    safetyRating = 'deficit';
  } else if (marginOfSafetyPercent < 15) {
    safetyRating = 'warning';
  } else if (marginOfSafetyPercent < 30) {
    safetyRating = 'moderate';
  } else {
    safetyRating = 'safe';
  }

  // Danh mục chi tiết các khoản mục chi phí bóc tách
  const totalCostCombined = totalFixedCosts + totalVariableCosts;
  const costItemList: BreakEvenCostItemDetail[] = [
    // Định phí
    {
      id: 'fc-labor',
      name: 'Chi phí Lương & Chế độ Nhân sự',
      category: 'fixed',
      subCategory: 'Nhân sự',
      amount: fixedLaborCost,
      pctOfRevenue: totalRev > 0 ? (fixedLaborCost / totalRev) * 100 : 0,
      pctOfCategory: totalFixedCosts > 0 ? (fixedLaborCost / totalFixedCosts) * 100 : 0,
      description: 'Lương cơ bản, phụ cấp, BHXH của toàn bộ bộ máy nhân sự theo sơ đồ tổ chức',
    },
    {
      id: 'fc-opex',
      name: 'Chi phí Thuê Mặt bằng & Vận hành Văn phòng (Opex)',
      category: 'fixed',
      subCategory: 'Vận hành',
      amount: fixedOfficeOpex,
      pctOfRevenue: totalRev > 0 ? (fixedOfficeOpex / totalRev) * 100 : 0,
      pctOfCategory: totalFixedCosts > 0 ? (fixedOfficeOpex / totalFixedCosts) * 100 : 0,
      description: 'Tiền thuê văn phòng, tiện ích điện nước, phần mềm SaaS ERP/CRM, văn phòng phẩm',
    },
    {
      id: 'fc-depr',
      name: 'Khấu hao Tài sản Cố định (Capex Amortization)',
      category: 'fixed',
      subCategory: 'Khấu hao',
      amount: fixedDepreciation,
      pctOfRevenue: totalRev > 0 ? (fixedDepreciation / totalRev) * 100 : 0,
      pctOfCategory: totalFixedCosts > 0 ? (fixedDepreciation / totalFixedCosts) * 100 : 0,
      description: 'Phân bổ khấu hao trang thiết bị, máy móc, sửa chữa cải tạo văn phòng',
    },
    // Biến phí
    {
      id: 'vc-vat',
      name: 'Thuế Giá Trị Gia Tăng Đầu Ra (VAT Output)',
      category: 'variable',
      subCategory: 'Thuế',
      amount: varVat,
      pctOfRevenue: totalRev > 0 ? (varVat / totalRev) * 100 : 0,
      pctOfCategory: totalVariableCosts > 0 ? (varVat / totalVariableCosts) * 100 : 0,
      description: 'Thuế GTGT đầu ra (8% - 10%) tính trực tiếp trên doanh thu bán hàng',
    },
    {
      id: 'vc-shipping',
      name: 'Chi Phí Vận Chuyển Giao Hàng (B2B & Bán Lẻ)',
      category: 'variable',
      subCategory: 'Vận chuyển',
      amount: varShipping,
      pctOfRevenue: totalRev > 0 ? (varShipping / totalRev) * 100 : 0,
      pctOfCategory: totalVariableCosts > 0 ? (varShipping / totalVariableCosts) * 100 : 0,
      description: 'Chi phí vận chuyển đơn sỉ B2B (5%) và bán lẻ (25.000 đ/đơn) tỷ lệ theo doanh số',
    },
    {
      id: 'vc-cogs',
      name: 'Giá vốn Hàng bán (COGS sản xuất/nhập hàng)',
      category: 'variable',
      subCategory: 'Giá vốn',
      amount: varCogs,
      pctOfRevenue: totalRev > 0 ? (varCogs / totalRev) * 100 : 0,
      pctOfCategory: totalVariableCosts > 0 ? (varCogs / totalVariableCosts) * 100 : 0,
      description: 'Đơn giá xuất kho thành phẩm hàng bán và chi phí sản xuất quà tặng sampling',
    },
    {
      id: 'vc-platform',
      name: 'Phí Sàn TMĐT (Shopee / TikTok Shop)',
      category: 'variable',
      subCategory: 'Phí sàn',
      amount: varPlatformFees,
      pctOfRevenue: totalRev > 0 ? (varPlatformFees / totalRev) * 100 : 0,
      pctOfCategory: totalVariableCosts > 0 ? (varPlatformFees / totalVariableCosts) * 100 : 0,
      description: 'Phí thanh toán (4.91%), Phí cố định sàn, Voucher Xtra, Phí dịch vụ theo doanh số',
    },
    {
      id: 'vc-ads',
      name: 'Quảng cáo Trực tiếp Nội sàn (Internal Ads)',
      category: 'variable',
      subCategory: 'Marketing',
      amount: varInternalAds,
      pctOfRevenue: totalRev > 0 ? (varInternalAds / totalRev) * 100 : 0,
      pctOfCategory: totalVariableCosts > 0 ? (varInternalAds / totalVariableCosts) * 100 : 0,
      description: 'Chi phí đấu thầu từ khóa, hiển thị Shopee Ads & TikTok Ads theo doanh thu',
    },
    {
      id: 'vc-affiliate',
      name: 'Hoa hồng Tiếp thị Liên kết (Affiliate Commission)',
      category: 'variable',
      subCategory: 'Marketing',
      amount: varAffiliate,
      pctOfRevenue: totalRev > 0 ? (varAffiliate / totalRev) * 100 : 0,
      pctOfCategory: totalVariableCosts > 0 ? (varAffiliate / totalVariableCosts) * 100 : 0,
      description: 'Hoa hồng chi trả cho Creator/KOC khi phát sinh đơn hàng thành công',
    },
    {
      id: 'vc-creator',
      name: 'Chi phí Booking Creator (KOL/KOC/UGC)',
      category: 'variable',
      subCategory: 'Marketing',
      amount: varCreatorBooking,
      pctOfRevenue: totalRev > 0 ? (varCreatorBooking / totalRev) * 100 : 0,
      pctOfCategory: totalVariableCosts > 0 ? (varCreatorBooking / totalVariableCosts) * 100 : 0,
      description: 'Phí thuê Creator theo chiến dịch từng tháng tương ứng với sản lượng bán',
    },
    {
      id: 'vc-pack',
      name: 'Vật tư Đóng gói & Hộp carton (Packaging)',
      category: 'variable',
      subCategory: 'Đóng gói',
      amount: varPackaging,
      pctOfRevenue: totalRev > 0 ? (varPackaging / totalRev) * 100 : 0,
      pctOfCategory: totalVariableCosts > 0 ? (varPackaging / totalVariableCosts) * 100 : 0,
      description: 'Chi phí hộp carton, băng dính, xốp nổ, tem nhãn phụ tỷ lệ theo số đơn hàng',
    },
    {
      id: 'vc-shrink',
      name: 'Hao hụt Vận hành & Hoàn hàng (Shrinkage & Returns)',
      category: 'variable',
      subCategory: 'Vận hành kho',
      amount: varShrinkage,
      pctOfRevenue: totalRev > 0 ? (varShrinkage / totalRev) * 100 : 0,
      pctOfCategory: totalVariableCosts > 0 ? (varShrinkage / totalVariableCosts) * 100 : 0,
      description: 'Tỷ lệ hao hụt hàng hóa trong kho và tỷ lệ hoàn hủy đơn hàng thương mại điện tử',
    },
  ];

  // Xác định tháng chạm điểm hòa vốn tích lũy
  let accGrossProfit = 0;
  let bepMonthIdx = -1;
  let bepMonthLabel = 'Chưa đạt trong kỳ';

  for (let i = 0; i < pnlMonthly.length; i++) {
    accGrossProfit += pnlMonthly[i].ebt; // Lợi nhuận tích lũy
    if (accGrossProfit >= 0 && bepMonthIdx === -1) {
      bepMonthIdx = i;
      bepMonthLabel = pnlMonthly[i].month.label;
    }
  }

  // Phân tích nâng cao theo các kịch bản kế hoạch:
  const salesMonths = pnlMonthly.filter((m) => m.grossRevenue > 0);
  const salesMonthsCount = salesMonths.length || (months.length || 1);
  const totalMonthsCount = months.length || 1;

  const endingCumulativeEbt = accGrossProfit;
  const isBreakevenAchievedInPlan = bepMonthIdx !== -1 && endingCumulativeEbt >= 0;

  // 1. Nếu chỉ dừng lại ở số tháng như kế hoạch:
  const revenueShortfallTotal = Math.max(0, breakEvenRevenue - pnlSummary.grossRevenue);
  const revenueRequiredMonthlyGrowth = Math.round(revenueShortfallTotal / salesMonthsCount);
  const unitsShortfallTotal = Math.max(0, breakEvenUnits - pnlSummary.totalUnits);
  const unitsRequiredMonthlyGrowth = Math.round(unitsShortfallTotal / salesMonthsCount);
  const requiredGmvGrowthPercent =
    pnlSummary.grossRevenue > 0 ? (revenueShortfallTotal / pnlSummary.grossRevenue) * 100 : 0;

  // 2. Nếu bán với doanh số như hiện tại:
  const unrecoveredDeficit = Math.max(0, -endingCumulativeEbt);
  const totalSalesMonthEbt = salesMonths.reduce((sum, m) => sum + m.ebt, 0);
  const monthlyAverageEbt = salesMonths.length > 0 ? Math.round(totalSalesMonthEbt / salesMonths.length) : 0;

  // Tốc độ sinh lời trạng thái ổn định (3 tháng cuối có bán hàng)
  const lastSalesMonths = salesMonths.slice(-3);
  const runRateMonthlyProfit =
    lastSalesMonths.length > 0
      ? Math.round(lastSalesMonths.reduce((sum, m) => sum + m.ebt, 0) / lastSalesMonths.length)
      : monthlyAverageEbt;

  let extraMonthsNeeded = 0;
  if (!isBreakevenAchievedInPlan && unrecoveredDeficit > 0) {
    if (monthlyAverageEbt > 0) {
      extraMonthsNeeded = Math.ceil(unrecoveredDeficit / monthlyAverageEbt);
    } else if (runRateMonthlyProfit > 0) {
      extraMonthsNeeded = Math.ceil(unrecoveredDeficit / runRateMonthlyProfit);
    } else {
      extraMonthsNeeded = -1; // Âm lợi nhuận trung bình, cần tối ưu chi phí
    }
  }

  let runRateExtraMonthsNeeded = 0;
  if (!isBreakevenAchievedInPlan && unrecoveredDeficit > 0) {
    if (runRateMonthlyProfit > 0) {
      runRateExtraMonthsNeeded = Math.ceil(unrecoveredDeficit / runRateMonthlyProfit);
    } else {
      runRateExtraMonthsNeeded = -1;
    }
  }

  const bep: BreakEvenPointAnalysis = {
    totalFixedCosts,
    averageMonthlyFixedCost: avgMonthlyFixedCost,
    totalRevenue: pnlSummary.grossRevenue,
    totalUnits: pnlSummary.totalUnits,
    totalVariableCosts,
    variableCostRatio,
    unitVariableCost,
    unitContributionMargin,
    totalContributionMargin,
    contributionMarginRatio,
    breakEvenRevenue,
    breakEvenUnits,
    averageSellingPrice: avgPrice,
    marginOfSafetyRevenue,
    marginOfSafetyUnits,
    marginOfSafetyPercent,
    safetyRating,
    fixedCostsBreakdown: {
      laborCost: fixedLaborCost,
      officeOpex: fixedOfficeOpex,
      depreciation: fixedDepreciation,
      total: totalFixedCosts,
    },
    variableCostsBreakdown: {
      totalCogs: varCogs,
      platformFees: varPlatformFees,
      internalAdsFee: varInternalAds,
      affiliateFee: varAffiliate,
      creatorBookingFee: varCreatorBooking,
      packagingFee: varPackaging,
      shrinkageFee: varShrinkage,
      total: totalVariableCosts,
    },
    costItemList,
    breakEvenMonthIndex: bepMonthIdx,
    breakEvenMonthLabel: bepMonthIdx !== -1 ? bepMonthLabel : 'Chưa đạt trong kỳ kế hoạch',
    salesMonthsCount,
    totalMonthsCount,
    isBreakevenAchievedInPlan,
    revenueShortfallTotal,
    revenueRequiredMonthlyGrowth,
    unitsShortfallTotal,
    unitsRequiredMonthlyGrowth,
    requiredGmvGrowthPercent,
    endingCumulativeEbt,
    unrecoveredDeficit,
    monthlyAverageEbt,
    extraMonthsNeeded,
    runRateMonthlyProfit,
    runRateExtraMonthsNeeded,
  };

  return {
    pnlMonthly,
    pnlSummary,
    cashFlowMonthly,
    cashFlowSummary,
    bep,
  };
}
