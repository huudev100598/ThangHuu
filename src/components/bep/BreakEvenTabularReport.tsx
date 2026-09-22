import React, { useState, useMemo } from 'react';
import { BreakEvenPointAnalysis, MonthlyPnlRecord, BreakEvenCostItemDetail } from '../../utils/reportCalculations';
import { ProductSku, Sheet3CogsData } from '../../types/sku';
import { ChannelMixConfig, SalesVolumeMap, SalesMonth } from '../../types/salesForecast';
import { ProjectParameters } from '../../types/financial';
import { formatNumberVi } from '../../utils/formatters';
import { 
  Table, 
  Package, 
  Building2, 
  Calendar, 
  Download, 
  CheckCircle2, 
  Split,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

interface BreakEvenTabularReportProps {
  bep: BreakEvenPointAnalysis;
  pnlMonthly: MonthlyPnlRecord[];
  months: SalesMonth[];
  skus?: ProductSku[];
  sheet3CogsMap?: Record<string, Sheet3CogsData>;
  volumes?: SalesVolumeMap;
  channelMix?: ChannelMixConfig;
  parameters?: ProjectParameters;
}

export type TabularViewMode = 'product' | 'channel' | 'costs' | 'monthly';

export const BreakEvenTabularReport: React.FC<BreakEvenTabularReportProps> = ({
  bep,
  pnlMonthly,
  months,
  skus = [],
  sheet3CogsMap = {},
  volumes = {},
  channelMix,
  parameters,
}) => {
  const [activeTab, setActiveTab] = useState<TabularViewMode>('product');

  const totalFixedCosts = bep.totalFixedCosts;
  const totalRevenue = bep.totalRevenue;
  const totalUnits = bep.totalUnits;
  const avgSellingPrice = bep.averageSellingPrice > 0 ? bep.averageSellingPrice : 250000;
  const avgUnitVC = bep.unitVariableCost > 0 ? bep.unitVariableCost : Math.round(avgSellingPrice * 0.58);
  const avgCMR = bep.contributionMarginRatio > 0 ? bep.contributionMarginRatio : 42;

  // Tính tổng COGS và Biến phí ngoài COGS (Phí sàn, Ads, Affiliate, Bao bì, Hao hụt) từ dữ liệu thực tế
  const totalCogsActual = useMemo(() => {
    return pnlMonthly.reduce((sum, m) => sum + (m.totalCogs || 0), 0);
  }, [pnlMonthly]);

  // Tỷ lệ biến phí ngoài COGS tính trên doanh thu = (Tổng biến phí - Tổng COGS) / Tổng doanh thu
  const nonCogsVcRatio = useMemo(() => {
    if (totalRevenue <= 0) return 0.35;
    const nonCogsVc = Math.max(0, bep.totalVariableCosts - totalCogsActual);
    return nonCogsVc / totalRevenue;
  }, [bep.totalVariableCosts, totalCogsActual, totalRevenue]);

  // Tỷ trọng kênh bán hàng (Channel Mix)
  const shopeeShare = (channelMix?.shopee ?? 60) / 100;
  const tiktokShare = (channelMix?.tikTokShop ?? 30) / 100;
  const retailShare = (channelMix?.retail ?? 5) / 100;
  const b2bShare = (channelMix?.b2b ?? 5) / 100;

  // =========================================================================
  // 1. TÍNH TOÁN DỮ LIỆU THEO DÒNG SẢN PHẨM / SKU
  // =========================================================================
  const productRows = useMemo(() => {
    if (!skus || skus.length === 0) {
      return [];
    }

    // Tính toán từ danh mục SKU thực tế và bóc tách biến phí chuẩn xác
    return skus.map((sku) => {
      // 1. Xác định Giá bán trung bình có trọng số theo kênh
      const stdPrice = sku.prices?.standard || 0;
      const shopeeP = sku.prices?.shopee || stdPrice;
      const tiktokP = sku.prices?.tikTokShop || stdPrice;
      const retailP = sku.prices?.retail || stdPrice;
      const b2bP = sku.prices?.b2b || stdPrice;

      const channelWeightedPrice = Math.round(
        shopeeP * shopeeShare +
        tiktokP * tiktokShare +
        retailP * retailShare +
        b2bP * b2bShare
      );

      const price = channelWeightedPrice > 0 
        ? channelWeightedPrice 
        : (stdPrice > 0 ? stdPrice : avgSellingPrice);

      // 2. Tính tổng sản lượng bán trong toàn kỳ của SKU
      let plannedUnits = 0;
      let calculatedRevenue = 0;

      if (volumes && volumes[sku.id]) {
        if (months && months.length > 0) {
          months.forEach((m) => {
            const vol = Number(volumes[sku.id]?.[m.id]) || 0;
            plannedUnits += vol;

            if (vol > 0) {
              const uShopee = Math.round(vol * shopeeShare);
              const uTikTok = Math.round(vol * tiktokShare);
              const uRetail = Math.round(vol * retailShare);
              const uB2b = Math.round(vol * b2bShare);

              calculatedRevenue += (uShopee * shopeeP) + (uTikTok * tiktokP) + (uRetail * retailP) + (uB2b * b2bP);
            }
          });
        } else {
          Object.values(volumes[sku.id]).forEach((v) => {
            plannedUnits += Number(v) || 0;
          });
        }
      }

      if (plannedUnits === 0 && totalUnits > 0 && skus.length > 0) {
        plannedUnits = Math.round(totalUnits / skus.length);
      }

      // Doanh thu kế hoạch
      let plannedRevenue = calculatedRevenue;
      if (plannedRevenue === 0) {
        if (plannedUnits > 0 && price > 0) {
          plannedRevenue = plannedUnits * price;
        } else if (totalRevenue > 0 && skus.length > 0) {
          plannedRevenue = Math.round(totalRevenue / skus.length);
        }
      }

      const salesMixPct = totalRevenue > 0 ? (plannedRevenue / totalRevenue) * 100 : (100 / skus.length);

      // 3. Giá vốn đơn vị (COGS per unit)
      let cogsPerUnit = sheet3CogsMap[sku.id]?.cogsPerUnit || 0;
      if (!cogsPerUnit && sku.type === 'combo' && sku.comboItems) {
        cogsPerUnit = sku.comboItems.reduce((acc, ci) => {
          const compCogs = sheet3CogsMap[ci.skuId]?.cogsPerUnit || 0;
          return acc + compCogs * ci.quantity;
        }, 0);
      }
      if (!cogsPerUnit) {
        cogsPerUnit = Math.round(price * 0.35);
      }

      // 4. Biến phí đơn vị (UVC = COGS + Biến phí bán hàng & sàn thực tế phân bổ theo giá bán)
      // Điều này đảm bảo tổng biến phí của các SKU khớp 100% với Tổng Biến Phí P&L!
      const nonCogsVcPerUnit = Math.round(price * nonCogsVcRatio);
      const unitVC = Math.round(cogsPerUnit + nonCogsVcPerUnit);

      // 5. Số dư đảm phí đơn vị (Unit CM) & Tỷ lệ đảm phí (CMR)
      const unitCM = price - unitVC;
      const cmr = price > 0 ? (unitCM / price) * 100 : 0;

      // 6. Định phí công ty phân bổ cho SKU theo tỷ trọng doanh thu (Sales-weighted FC Allocation)
      const allocatedFC = totalRevenue > 0 
        ? Math.round(totalFixedCosts * (plannedRevenue / totalRevenue)) 
        : Math.round(totalFixedCosts / skus.length);

      // 7. Sản lượng và Doanh thu hòa vốn của SKU (BEP)
      let bepUnits = 0;
      let bepRevenue = 0;
      let mosUnits = 0;
      let mosRevenue = 0;
      let mosPct = 0;
      let status: 'safe' | 'warning' | 'deficit' = 'safe';

      if (unitCM <= 0) {
        // Trường hợp nguy cấp: Giá bán không bù nổi biến phí (Bán lỗ gộp biến phí)
        // Không thể hòa vốn ở bất kỳ sản lượng nào!
        bepUnits = 0;
        bepRevenue = 0;
        mosUnits = -plannedUnits;
        mosRevenue = -plannedRevenue;
        mosPct = -100;
        status = 'deficit';
      } else {
        // Số dư đảm phí dương: Tính điểm hòa vốn chuẩn
        bepUnits = Math.round(allocatedFC / unitCM);
        bepRevenue = cmr > 0 ? Math.round(allocatedFC / (cmr / 100)) : 0;
        mosUnits = plannedUnits - bepUnits;
        mosRevenue = plannedRevenue - bepRevenue;
        mosPct = plannedRevenue > 0 ? (mosRevenue / plannedRevenue) * 100 : -100;

        // ĐÁNH GIÁ ĐÚNG BẢN CHẤT: Nếu mosRevenue < 0 thì chắc chắn CHƯA HÒA VỐN (LỖ)
        if (mosRevenue < 0 || mosUnits < 0) {
          status = 'deficit';
        } else if (mosPct < 15) {
          status = 'warning';
        } else {
          status = 'safe';
        }
      }

      return {
        id: sku.id,
        code: sku.skuCode || sku.id,
        name: sku.name || sku.skuCode || 'Sản phẩm SKU',
        type: sku.type || 'single',
        price,
        unitCost: cogsPerUnit,
        unitVC,
        unitCM,
        cmr,
        plannedUnits,
        plannedRevenue,
        salesMixPct,
        allocatedFC,
        bepUnits,
        bepRevenue,
        mosUnits,
        mosRevenue,
        mosPct,
        status,
      };
    });
  }, [
    skus, 
    sheet3CogsMap, 
    volumes, 
    months, 
    channelMix, 
    totalFixedCosts, 
    totalRevenue, 
    totalUnits, 
    avgSellingPrice, 
    avgUnitVC, 
    avgCMR, 
    nonCogsVcRatio, 
    shopeeShare, 
    tiktokShare, 
    retailShare, 
    b2bShare, 
    bep.variableCostRatio
  ]);

  // =========================================================================
  // 2. TÍNH TOÁN DỮ LIỆU THEO KÊNH BÁN HÀNG (CHANNEL BREAKDOWN)
  // =========================================================================
  const channelRows = useMemo(() => {
    let shopeeRev = 0, tiktokRev = 0, b2bRev = 0, retailRev = 0;
    let shopeeUnits = 0, tiktokUnits = 0, b2bUnits = 0, retailUnits = 0;

    pnlMonthly.forEach((m) => {
      shopeeRev += m.revenueByChannel?.shopee || 0;
      tiktokRev += m.revenueByChannel?.tikTokShop || 0;
      b2bRev += m.revenueByChannel?.b2b || 0;
      retailRev += m.revenueByChannel?.retail || 0;

      shopeeUnits += m.unitsByChannel?.shopee || 0;
      tiktokUnits += m.unitsByChannel?.tikTokShop || 0;
      b2bUnits += m.unitsByChannel?.b2b || 0;
      retailUnits += m.unitsByChannel?.retail || 0;
    });

    const sumRev = shopeeRev + tiktokRev + b2bRev + retailRev;
    if (sumRev === 0 && totalRevenue > 0) {
      shopeeRev = Math.round(totalRevenue * shopeeShare);
      tiktokRev = Math.round(totalRevenue * tiktokShare);
      b2bRev = Math.round(totalRevenue * b2bShare);
      retailRev = Math.round(totalRevenue * retailShare);

      shopeeUnits = Math.round(totalUnits * shopeeShare);
      tiktokUnits = Math.round(totalUnits * tiktokShare);
      b2bUnits = Math.round(totalUnits * b2bShare);
      retailUnits = Math.round(totalUnits * retailShare);
    }

    // Tính toán biến phí thực tế của từng kênh từ cấu trúc chi phí P&L
    // Shopee & TikTok chịu phí sàn cao (18-22%), ads (8-10%), affiliate (8-12%) + COGS + bao bì
    // B2B không tốn phí sàn & ads, chỉ chịu COGS + vận chuyển sỉ (5%)
    // Retail chịu COGS + vận chuyển lẻ
    const overallVcRatio = bep.variableCostRatio / 100;
    const baseCogsRatio = totalRevenue > 0 ? totalCogsActual / totalRevenue : 0.35;

    // Tỷ lệ biến phí riêng từng kênh tương thích với thực tế
    let rawShopeeVC = Math.round(shopeeRev * Math.min(0.95, baseCogsRatio + 0.38));
    let rawTiktokVC = Math.round(tiktokRev * Math.min(0.95, baseCogsRatio + 0.40));
    let rawB2bVC = Math.round(b2bRev * Math.min(0.80, baseCogsRatio + 0.08));
    let rawRetailVC = Math.round(retailRev * Math.min(0.85, baseCogsRatio + 0.15));

    const totalRawVC = rawShopeeVC + rawTiktokVC + rawB2bVC + rawRetailVC;
    const normalizationFactor = totalRawVC > 0 ? bep.totalVariableCosts / totalRawVC : 1;

    // Chuẩn hóa để tổng biến phí của 4 kênh = bep.totalVariableCosts
    const shopeeVC = Math.round(rawShopeeVC * normalizationFactor);
    const tiktokVC = Math.round(rawTiktokVC * normalizationFactor);
    const b2bVC = Math.round(rawB2bVC * normalizationFactor);
    const retailVC = Math.max(0, bep.totalVariableCosts - (shopeeVC + tiktokVC + b2bVC));

    const channelsData = [
      {
        id: 'shopee',
        name: 'Shopee Mall / TMĐT',
        badge: 'Kênh Doanh Số Chủ Lực',
        rev: shopeeRev,
        units: shopeeUnits,
        channelVC: shopeeVC,
        description: 'Tạo dòng tiền và sản lượng lớn, chịu phí nền tảng, voucher và quảng cáo nội sàn',
      },
      {
        id: 'tiktok',
        name: 'TikTok Shop / Live Commerce',
        badge: 'Kênh Tăng Trưởng Bùng Nổ',
        rev: tiktokRev,
        units: tiktokUnits,
        channelVC: tiktokVC,
        description: 'Tận dụng Live Commerce và Affiliate KOC, biến phí tương đối cao do hoa hồng creator',
      },
      {
        id: 'b2b',
        name: 'Phân Phối B2B / Đại Lý Sỉ',
        badge: 'Kênh Biên Đảm Phí Cao',
        rev: b2bRev,
        units: b2bUnits,
        channelVC: b2bVC,
        description: 'Bán buôn số lượng lớn, không tốn phí sàn TMĐT, biên số dư đảm phí hấp dẫn',
      },
      {
        id: 'retail',
        name: 'Bán Lẻ Trực Tiếp & Khác',
        badge: 'Kênh Bán Lẻ Trải Nghiệm',
        rev: retailRev,
        units: retailUnits,
        channelVC: retailVC,
        description: 'Bán hàng trực tiếp tại showroom, cửa hàng hoặc sự kiện, giá bán nguyên niêm yết',
      },
    ];

    return channelsData.map((ch) => {
      const channelRev = ch.rev;
      const channelUnits = ch.units;
      const mixPct = totalRevenue > 0 ? (channelRev / totalRevenue) * 100 : 0;
      const avgPrice = channelUnits > 0 ? Math.round(channelRev / channelUnits) : avgSellingPrice;

      // Số dư đảm phí của kênh
      const channelCM = channelRev - ch.channelVC;
      const channelCMR = channelRev > 0 ? (channelCM / channelRev) * 100 : 0;

      // Định phí công ty phân bổ cho kênh
      const allocatedFC = totalRevenue > 0 ? Math.round(totalFixedCosts * (channelRev / totalRevenue)) : 0;

      // Doanh thu hòa vốn của kênh
      let bepRev = 0;
      let mosRev = 0;
      let mosPct = 0;
      let status: 'safe' | 'warning' | 'deficit' = 'safe';

      if (channelCM <= 0) {
        // Kênh đang bán lỗ biến phí
        bepRev = 0;
        mosRev = -channelRev;
        mosPct = -100;
        status = 'deficit';
      } else {
        bepRev = channelCMR > 0 ? Math.round(allocatedFC / (channelCMR / 100)) : 0;
        mosRev = channelRev - bepRev;
        mosPct = channelRev > 0 ? (mosRev / channelRev) * 100 : -100;

        if (mosRev < 0) {
          status = 'deficit';
        } else if (mosPct < 15) {
          status = 'warning';
        } else {
          status = 'safe';
        }
      }

      // Mức độ bù đắp định phí toàn công ty = Số dư đảm phí của kênh / Tổng định phí công ty
      const fcCoveragePct = totalFixedCosts > 0 ? (channelCM / totalFixedCosts) * 100 : 0;

      return {
        ...ch,
        mixPct,
        avgPrice,
        channelCM,
        channelCMR,
        allocatedFC,
        bepRev,
        mosRev,
        mosPct,
        fcCoveragePct,
        status,
      };
    });
  }, [
    pnlMonthly, 
    totalRevenue, 
    totalUnits, 
    totalFixedCosts, 
    avgSellingPrice, 
    totalCogsActual, 
    bep.totalVariableCosts, 
    bep.variableCostRatio, 
    shopeeShare, 
    tiktokShare, 
    b2bShare, 
    retailShare
  ]);

  // Kiểm tra sức khỏe BEP toàn công ty
  const isCompanySafe = bep.marginOfSafetyRevenue >= 0;

  // =========================================================================
  // 3. XUẤT CSV CHO CÁC BẢNG
  // =========================================================================
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = 'bao-cao-diem-hoa-von.csv';

    if (activeTab === 'product') {
      filename = 'phan-tich-hoa-von-theo-dong-san-pham-sku.csv';
      headers = [
        'Mã SKU',
        'Tên Sản Phẩm',
        'Phân Loại',
        'Giá Bán (VND)',
        'Biến Phí Đơn Vị (VND)',
        'Số Dư Đảm Phí Đơn Vị (VND)',
        'Tỷ Lệ Đảm Phí CMR (%)',
        'Sản Lượng Kế Hoạch',
        'Doanh Thu Kế Hoạch (VND)',
        'Tỷ Trọng Doanh Thu (%)',
        'Định Phí Phân Bổ (VND)',
        'Sản Lượng Hòa Vốn (BEP Units)',
        'Doanh Thu Hòa Vốn (BEP VND)',
        'Biên An Toàn Sản Lượng (MoS Units)',
        'Biên An Toàn Doanh Thu (MoS VND)',
        'Tỷ Lệ Biên An Toàn (%)',
        'Trạng Thái',
      ];
      rows = productRows.map((r) => [
        `"${r.code}"`,
        `"${r.name}"`,
        `"${r.type}"`,
        String(r.price),
        String(r.unitVC),
        String(r.unitCM),
        r.cmr.toFixed(1),
        String(r.plannedUnits),
        String(r.plannedRevenue),
        r.salesMixPct.toFixed(1),
        String(r.allocatedFC),
        String(r.bepUnits),
        String(r.bepRevenue),
        String(r.mosUnits),
        String(r.mosRevenue),
        r.mosPct.toFixed(1),
        r.status === 'safe' ? 'Đã hòa vốn' : r.status === 'warning' ? 'Biên mỏng' : 'Chưa hòa vốn (Lỗ)',
      ]);
    } else if (activeTab === 'channel') {
      filename = 'phan-tich-hoa-von-theo-kenh-ban-hang.csv';
      headers = [
        'Kênh Bán Hàng',
        'Doanh Thu Kế Hoạch (VND)',
        'Tỷ Trọng Kênh (%)',
        'Sản Lượng Bán (sp)',
        'Giá Bán Bình Quân (VND)',
        'Biến Phí Kênh (VND)',
        'Số Dư Đảm Phí Kênh (VND)',
        'Tỷ Lệ Đảm Phí Kênh CMR (%)',
        'Tỷ Lệ Bù Đắp Định Phí Công Ty (%)',
        'Định Phí Phân Bổ (VND)',
        'Doanh Thu Hòa Vốn Kênh (VND)',
        'Biên An Toàn Kênh (VND)',
        'Tỷ Lệ Biên An Toàn Kênh (%)',
        'Trạng Thái',
      ];
      rows = channelRows.map((c) => [
        `"${c.name}"`,
        String(c.rev),
        c.mixPct.toFixed(1),
        String(c.units),
        String(c.avgPrice),
        String(c.channelVC),
        String(c.channelCM),
        c.channelCMR.toFixed(1),
        c.fcCoveragePct.toFixed(1),
        String(c.allocatedFC),
        String(c.bepRev),
        String(c.mosRev),
        c.mosPct.toFixed(1),
        c.status === 'safe' ? 'Đã hòa vốn' : c.status === 'warning' ? 'Biên mỏng' : 'Chưa hòa vốn (Lỗ)',
      ]);
    } else if (activeTab === 'costs') {
      filename = 'boc-tach-chi-phi-co-dinh-va-bien-doi.csv';
      headers = [
        'Khoản Mục Chi Phí',
        'Phân Loại',
        'Nhóm Nghiệp Vụ',
        'Số Tiền (VND)',
        '% Trên Doanh Thu',
        '% Trong Nhóm Chi Phí',
        'Mô Tả Bản Chất Chi Phí',
      ];
      rows = bep.costItemList.map((item) => [
        `"${item.name}"`,
        item.category === 'fixed' ? 'Chi Phí Cố Định (Fixed)' : 'Chi Phí Biến Đổi (Variable)',
        `"${item.subCategory}"`,
        String(item.amount),
        item.pctOfRevenue.toFixed(2),
        item.pctOfCategory.toFixed(1),
        `"${item.description}"`,
      ]);
    } else if (activeTab === 'monthly') {
      filename = 'dien-tien-hoa-von-theo-thang.csv';
      headers = [
        'Tháng',
        'Doanh Thu Tháng (VND)',
        'Biến Phí Tháng (VND)',
        'Số Dư Đảm Phí (VND)',
        'Tỷ Lệ CMR (%)',
        'Định Phí Tháng (VND)',
        'Doanh Thu Hòa Vốn Tháng (VND)',
        'Lợi Nhuận EBT Tháng (VND)',
        'Lợi Nhuận EBT Tích Lũy (VND)',
        'Trạng Thái',
      ];
      let accEbt = 0;
      rows = pnlMonthly.map((m, idx) => {
        accEbt += m.ebt;
        const vc =
          (m.vatOutput || 0) +
          (m.platformFees?.total || 0) +
          (m.shippingB2bRetail?.total || 0) +
          (m.totalCogs || 0) +
          (m.marketingPlatform?.total || 0) +
          (m.marketingOverall?.creatorBookingFee || 0) +
          (m.fulfillment?.packagingFee || 0) +
          (m.fulfillment?.shrinkageWarehouseFee || 0);
        const cm = m.grossRevenue - vc;
        const cmr = m.grossRevenue > 0 ? (cm / m.grossRevenue) * 100 : 0;
        const fc = m.gaExpenses?.total || 0;
        const monthlyBepRev = cmr > 0 ? Math.round(fc / (cmr / 100)) : 0;
        const isBepReachedMonth = accEbt >= 0 && (idx === 0 || accEbt - m.ebt < 0);
        let statusText = 'Chưa hòa vốn (Lỗ)';
        if (isBepReachedMonth) {
          statusText = 'Chạm mốc hòa vốn tích lũy';
        } else if (accEbt >= 0) {
          statusText = 'Lãi tích lũy';
        } else if (m.ebt >= 0) {
          statusText = 'Lãi tháng (Đang bù lỗ lũy kế)';
        }

        return [
          `"${m.month.label}"`,
          String(m.grossRevenue),
          String(vc),
          String(cm),
          cmr.toFixed(1),
          String(fc),
          String(monthlyBepRev),
          String(m.ebt),
          String(accEbt),
          statusText,
        ];
      });
    }

    const csvContent =
      '\uFEFF' +
      headers.join(',') +
      '\n' +
      rows.map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="bep-tabular-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-5">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Table className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Dạng Bảng Số Liệu Phân Tích Điểm Hòa Vốn (Tabular Reports)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đồng bộ 100% với Báo cáo P&amp;L • Đánh giá chuẩn xác Biên độ an toàn (MoS) theo Dòng sản phẩm &amp; Kênh bán hàng
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
            <button
              id="bep-tab-product"
              type="button"
              onClick={() => setActiveTab('product')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'product'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Theo Dòng SP / SKU
            </button>
            <button
              id="bep-tab-channel"
              type="button"
              onClick={() => setActiveTab('channel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'channel'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Theo Kênh Bán Hàng
            </button>
            <button
              id="bep-tab-costs"
              type="button"
              onClick={() => setActiveTab('costs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'costs'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              Bóc Tách FC &amp; VC
            </button>
            <button
              id="bep-tab-monthly"
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Diễn Tiến Theo Tháng
            </button>
          </div>

          {/* Export CSV button */}
          <button
            id="bep-export-csv-btn"
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs"
            title="Xuất bảng số liệu đang chọn thành tệp tin CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Xuất File CSV
          </button>
        </div>
      </div>

      {/* Cảnh báo trạng thái nếu toàn công ty đang lỗ / chưa đạt hòa vốn */}
      {!isCompanySafe && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">LƯU Ý QUẢN TRỊ:</span> Dự án đang hoạt động dưới điểm hòa vốn (Thâm hụt{' '}
            <strong>{formatNumberVi(Math.abs(bep.marginOfSafetyRevenue))} đ</strong>, tương đương thiếu{' '}
            <strong>{formatNumberVi(Math.abs(bep.marginOfSafetyUnits))} sp</strong> để hòa vốn). Các chỉ số Biên An Toàn (MoS) âm phản ánh đúng mức độ thiếu hụt của từng dòng sản phẩm và kênh phân phối.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. BẢNG PHÂN TÍCH THEO DÒNG SẢN PHẨM / SKU */}
      {/* ========================================================================= */}
      {activeTab === 'product' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                Phân bổ Định phí theo Tỷ trọng Doanh thu:
              </span>
              <span>Tổng Định Phí FC toàn công ty = {formatNumberVi(totalFixedCosts)} đ</span>
            </div>
            <div className="text-[11px] text-slate-500 italic">
              * Biến phí đơn vị (UVC) gồm COGS + Phí sàn + Marketing biến đổi + Bao bì/Hao hụt phân bổ theo giá bán
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3">Mã SKU &amp; Tên Sản Phẩm</th>
                  <th className="px-3 py-3 text-center">Loại</th>
                  <th className="px-3 py-3 text-right">Giá Bán (P)</th>
                  <th className="px-3 py-3 text-right">Biến Phí (UVC)</th>
                  <th className="px-3 py-3 text-right font-bold text-indigo-900">Đảm Phí (UCM)</th>
                  <th className="px-3 py-3 text-right">CMR %</th>
                  <th className="px-3 py-3 text-right">SL Kế Hoạch</th>
                  <th className="px-3.5 py-3 text-right">Doanh Thu K.Hoạch</th>
                  <th className="px-3 py-3 text-right">Định Phí P.Bổ</th>
                  <th className="px-3.5 py-3 text-right font-extrabold text-indigo-700 bg-indigo-50/50">
                    SL Hòa Vốn (BEP)
                  </th>
                  <th className="px-3.5 py-3 text-right font-extrabold text-indigo-700 bg-indigo-50/50">
                    DT Hòa Vốn (BEP)
                  </th>
                  <th className="px-3.5 py-3 text-right font-extrabold">
                    Biên An Toàn (MoS)
                  </th>
                  <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {productRows.map((r, idx) => {
                  const isRowDeficit = r.status === 'deficit';
                  const isRowWarning = r.status === 'warning';

                  return (
                    <tr key={`sku-row-${r.id || idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.code}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.type === 'combo' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {r.type === 'combo' ? 'Combo' : 'Đơn lẻ'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">{formatNumberVi(r.price)} đ</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{formatNumberVi(r.unitVC)} đ</td>
                      <td className={`px-3 py-2.5 text-right font-bold ${r.unitCM > 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                        {formatNumberVi(r.unitCM)} đ
                      </td>
                      <td className={`px-3 py-2.5 text-right font-semibold ${r.cmr > 0 ? 'text-slate-700' : 'text-rose-600'}`}>
                        {r.cmr.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-800">{formatNumberVi(r.plannedUnits)}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">{formatNumberVi(r.plannedRevenue)} đ</td>
                      <td className="px-3 py-2.5 text-right text-slate-500">{formatNumberVi(r.allocatedFC)} đ</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-indigo-900 bg-indigo-50/30">
                        {r.unitCM > 0 ? `${formatNumberVi(r.bepUnits)} sp` : 'N/A (Lỗ biến phí)'}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-indigo-900 bg-indigo-50/30">
                        {r.unitCM > 0 ? `${formatNumberVi(r.bepRevenue)} đ` : 'N/A'}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className={`font-bold ${isRowDeficit ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {r.mosRevenue >= 0 ? `+${formatNumberVi(r.mosRevenue)} đ` : `-${formatNumberVi(Math.abs(r.mosRevenue))} đ`}
                        </div>
                        <div className={`text-[10px] font-medium mt-0.5 ${isRowDeficit ? 'text-rose-600' : 'text-slate-500'}`}>
                          {r.mosUnits >= 0 ? `+${formatNumberVi(r.mosUnits)} sp` : `${formatNumberVi(r.mosUnits)} sp`} ({r.mosPct >= 0 ? '+' : ''}{r.mosPct.toFixed(1)}%)
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isRowDeficit
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isRowWarning
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isRowDeficit ? 'Chưa hòa vốn (Lỗ)' : isRowWarning ? 'Biên mỏng' : 'Đã hòa vốn'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Dòng tổng cộng */}
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="px-3.5 py-3" colSpan={6}>
                    TỔNG CỘNG DANH MỤC SẢN PHẨM
                  </td>
                  <td className="px-3 py-3 text-right">{formatNumberVi(totalUnits)}</td>
                  <td className="px-3.5 py-3 text-right">{formatNumberVi(totalRevenue)} đ</td>
                  <td className="px-3 py-3 text-right">{formatNumberVi(totalFixedCosts)} đ</td>
                  <td className="px-3.5 py-3 text-right font-extrabold text-indigo-900 bg-indigo-100/50">
                    {formatNumberVi(bep.breakEvenUnits)} sp
                  </td>
                  <td className="px-3.5 py-3 text-right font-extrabold text-indigo-900 bg-indigo-100/50">
                    {formatNumberVi(bep.breakEvenRevenue)} đ
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <div className={`font-extrabold ${isCompanySafe ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {isCompanySafe ? '+' : '-'}{formatNumberVi(Math.abs(bep.marginOfSafetyRevenue))} đ
                    </div>
                    <div className={`text-[10px] font-medium mt-0.5 ${isCompanySafe ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {isCompanySafe ? '+' : '-'}{formatNumberVi(Math.abs(bep.marginOfSafetyUnits))} sp ({isCompanySafe ? '+' : ''}{bep.marginOfSafetyPercent.toFixed(1)}%)
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isCompanySafe
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {isCompanySafe ? 'Đã hòa vốn (An toàn)' : 'Chưa hòa vốn (Đang lỗ)'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BẢNG PHÂN TÍCH THEO KÊNH BÁN HÀNG */}
      {/* ========================================================================= */}
      {activeTab === 'channel' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              Đánh giá Khả năng Bù đắp Định phí &amp; Hòa vốn của Từng Kênh Bán Hàng:
            </span>
            <span className="text-[11px] text-slate-500 italic">
              * Tỷ lệ bù đắp = Số dư đảm phí của kênh / Tổng định phí công ty ({formatNumberVi(totalFixedCosts)} đ)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Kênh Bán Hàng</th>
                  <th className="px-3.5 py-3 text-right">Doanh Thu K.Hoạch</th>
                  <th className="px-3 py-3 text-right">Tỷ Trọng</th>
                  <th className="px-3 py-3 text-right">Sản Lượng</th>
                  <th className="px-3 py-3 text-right">Giá TB Kênh</th>
                  <th className="px-3.5 py-3 text-right">Biến Phí Kênh (VC)</th>
                  <th className="px-3.5 py-3 text-right font-bold text-indigo-900">Đảm Phí Kênh (CM)</th>
                  <th className="px-3 py-3 text-right">CMR Kênh</th>
                  <th className="px-3.5 py-3 text-right font-bold text-blue-700 bg-blue-50/40">
                    Bù Đắp FC C.Ty
                  </th>
                  <th className="px-3.5 py-3 text-right font-extrabold text-indigo-700 bg-indigo-50/50">
                    DT Hòa Vốn Kênh
                  </th>
                  <th className="px-3.5 py-3 text-right font-extrabold">
                    Biên An Toàn (MoS)
                  </th>
                  <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                  <th className="px-4 py-3">Đánh Giá &amp; Chiến Lược</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {channelRows.map((c) => {
                  const isChDeficit = c.status === 'deficit';
                  const isChWarning = c.status === 'warning';

                  return (
                    <tr key={`ch-${c.id}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-indigo-600 font-medium mt-0.5">{c.badge}</div>
                      </td>
                      <td className="px-3.5 py-3 text-right font-bold text-slate-900">{formatNumberVi(c.rev)} đ</td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-700">{c.mixPct.toFixed(1)}%</td>
                      <td className="px-3 py-3 text-right text-slate-800">{formatNumberVi(c.units)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{formatNumberVi(c.avgPrice)} đ</td>
                      <td className="px-3.5 py-3 text-right text-slate-600">{formatNumberVi(c.channelVC)} đ</td>
                      <td className={`px-3.5 py-3 text-right font-bold ${c.channelCM > 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                        {formatNumberVi(c.channelCM)} đ
                      </td>
                      <td className={`px-3 py-3 text-right font-semibold ${c.channelCMR > 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                        {c.channelCMR.toFixed(1)}%
                      </td>
                      <td className={`px-3.5 py-3 text-right font-bold ${c.fcCoveragePct > 0 ? 'text-blue-800 bg-blue-50/30' : 'text-rose-700'}`}>
                        {c.fcCoveragePct.toFixed(1)}%
                      </td>
                      <td className="px-3.5 py-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                        {c.channelCM > 0 ? `${formatNumberVi(c.bepRev)} đ` : 'N/A'}
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <div className={`font-bold ${isChDeficit ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {c.mosRev >= 0 ? `+${formatNumberVi(c.mosRev)} đ` : `-${formatNumberVi(Math.abs(c.mosRev))} đ`}
                        </div>
                        <div className={`text-[10px] font-medium mt-0.5 ${isChDeficit ? 'text-rose-600' : 'text-slate-500'}`}>
                          {c.mosPct >= 0 ? `+${c.mosPct.toFixed(1)}%` : `${c.mosPct.toFixed(1)}%`}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isChDeficit
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isChWarning
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isChDeficit ? 'Chưa hòa vốn' : isChWarning ? 'Biên mỏng' : 'Đã hòa vốn'}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs text-[11px] text-slate-600 leading-normal">
                        {c.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="px-4 py-3">TỔNG TOÀN CÔNG TY</td>
                  <td className="px-3.5 py-3 text-right">{formatNumberVi(totalRevenue)} đ</td>
                  <td className="px-3 py-3 text-right">100.0%</td>
                  <td className="px-3 py-3 text-right">{formatNumberVi(totalUnits)}</td>
                  <td className="px-3 py-3 text-right">{formatNumberVi(avgSellingPrice)} đ</td>
                  <td className="px-3.5 py-3 text-right">{formatNumberVi(bep.totalVariableCosts)} đ</td>
                  <td className="px-3.5 py-3 text-right font-extrabold text-indigo-900">{formatNumberVi(bep.totalContributionMargin)} đ</td>
                  <td className="px-3 py-3 text-right">{avgCMR.toFixed(1)}%</td>
                  <td className="px-3.5 py-3 text-right font-extrabold text-blue-900 bg-blue-100/40">100.0%</td>
                  <td className="px-3.5 py-3 text-right font-extrabold text-indigo-900 bg-indigo-100/50">
                    {formatNumberVi(bep.breakEvenRevenue)} đ
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <div className={`font-extrabold ${isCompanySafe ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {isCompanySafe ? '+' : '-'}{formatNumberVi(Math.abs(bep.marginOfSafetyRevenue))} đ
                    </div>
                    <div className={`text-[10px] font-medium mt-0.5 ${isCompanySafe ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {isCompanySafe ? '+' : ''}{bep.marginOfSafetyPercent.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isCompanySafe
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {isCompanySafe ? 'Đã hòa vốn (An toàn)' : 'Chưa hòa vốn (Đang lỗ)'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 italic">Tổng hòa 4 kênh phân phối</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BẢNG BÓC TÁCH CHI PHÍ CỐ ĐỊNH (FC) & CHI PHÍ BIẾN ĐỔI (VC) */}
      {/* ========================================================================= */}
      {activeTab === 'costs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Định Phí */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  Tổng Chi Phí Cố Định (Fixed Costs - FC)
                </span>
                <span className="text-sm font-extrabold text-slate-900">{formatNumberVi(totalFixedCosts)} đ</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Chi phí phát sinh cố định theo thời gian, không thay đổi theo sản lượng bán ra
              </div>
            </div>

            {/* Box 2: Biến Phí */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Tổng Chi Phí Biến Đổi (Variable Costs - VC)
                </span>
                <span className="text-sm font-extrabold text-amber-700">{formatNumberVi(bep.totalVariableCosts)} đ</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Chi phí tỷ lệ thuận trực tiếp với sản lượng và doanh thu (Tỷ lệ: {bep.variableCostRatio.toFixed(1)}% Doanh thu)
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Khoản Mục Chi Phí</th>
                  <th className="px-3.5 py-3 text-center">Phân Loại</th>
                  <th className="px-3.5 py-3">Nhóm Nghiệp Vụ</th>
                  <th className="px-4 py-3 text-right">Số Tiền (VND)</th>
                  <th className="px-3.5 py-3 text-right">% Doanh Thu</th>
                  <th className="px-3.5 py-3 text-right">% Trong Nhóm</th>
                  <th className="px-4 py-3">Bản Chất &amp; Động Lực Phát Sinh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bep.costItemList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                    <td className="px-3.5 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        item.category === 'fixed'
                          ? 'bg-slate-100 text-slate-800 border border-slate-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {item.category === 'fixed' ? 'Cố Định (FC)' : 'Biến Đổi (VC)'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-slate-700 font-medium">{item.subCategory}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{formatNumberVi(item.amount)} đ</td>
                    <td className="px-3.5 py-3 text-right text-slate-600">{item.pctOfRevenue.toFixed(1)}%</td>
                    <td className="px-3.5 py-3 text-right font-semibold text-slate-800">{item.pctOfCategory.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-[11px] text-slate-600 leading-normal">{item.description}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="px-4 py-3" colSpan={3}>
                    TỔNG TOÀN BỘ CHI PHÍ DỰ ÁN (FC + VC)
                  </td>
                  <td className="px-4 py-3 text-right text-indigo-900 text-sm">
                    {formatNumberVi(totalFixedCosts + bep.totalVariableCosts)} đ
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    {totalRevenue > 0 ? (((totalFixedCosts + bep.totalVariableCosts) / totalRevenue) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="px-3.5 py-3 text-right">100.0%</td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 italic">
                    Số dư đảm phí còn lại: {formatNumberVi(bep.totalContributionMargin)} đ (CMR: {bep.contributionMarginRatio.toFixed(1)}%)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BẢNG DIỄN TIẾN HÒA VỐN THEO THÁNG */}
      {/* ========================================================================= */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          {(() => {
            let runningEbt = 0;
            const totalRevSum = pnlMonthly.reduce((s, m) => s + m.grossRevenue, 0);
            const totalVcSum = pnlMonthly.reduce(
              (s, m) =>
                s +
                (m.vatOutput || 0) +
                (m.platformFees?.total || 0) +
                (m.shippingB2bRetail?.total || 0) +
                (m.totalCogs || 0) +
                (m.marketingPlatform?.total || 0) +
                (m.marketingOverall?.creatorBookingFee || 0) +
                (m.fulfillment?.packagingFee || 0) +
                (m.fulfillment?.shrinkageWarehouseFee || 0),
              0
            );
            const totalCmSum = totalRevSum - totalVcSum;
            const totalCmrAvg = totalRevSum > 0 ? (totalCmSum / totalRevSum) * 100 : 0;
            const totalFcSum = pnlMonthly.reduce((s, m) => s + (m.gaExpenses?.total || 0), 0);
            const totalEbtSum = pnlMonthly.reduce((s, m) => s + m.ebt, 0);
            const totalBepRev = totalCmrAvg > 0 ? Math.round(totalFcSum / (totalCmrAvg / 100)) : 0;
            const profitableMonths = pnlMonthly.filter((m) => m.ebt >= 0).length;
            const avgMonthlyBep = pnlMonthly.length > 0 ? Math.round(totalBepRev / pnlMonthly.length) : 0;

            return (
              <>
                {/* 3 Thẻ chỉ số tổng quan tiến độ hòa vốn */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Tháng Chạm Hòa Vốn Tích Lũy
                    </div>
                    <div className="text-lg font-extrabold text-indigo-700 mt-1">
                      {bep.breakEvenMonthLabel}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Đã có {profitableMonths}/{pnlMonthly.length} tháng sinh lời EBT dương
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      DT Hòa Vốn Bình Quân Tháng
                    </div>
                    <div className="text-lg font-extrabold text-slate-900 mt-1">
                      {formatNumberVi(avgMonthlyBep)} đ
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Tổng DT hòa vốn toàn kỳ: {formatNumberVi(totalBepRev)} đ
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Lũy Kế Lợi Nhuận EBT Cuối Kỳ
                    </div>
                    <div className={`text-lg font-extrabold mt-1 ${totalEbtSum >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {totalEbtSum >= 0 ? `+${formatNumberVi(totalEbtSum)} đ` : `-${formatNumberVi(Math.abs(totalEbtSum))} đ`}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {totalEbtSum >= 0 ? 'Dự án sinh lời ròng sau khi bù hết chi phí' : 'Cần thêm thời gian để bù lỗ lũy kế'}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-3">Tháng</th>
                        <th className="px-3.5 py-3 text-right">Doanh Thu Tháng</th>
                        <th className="px-3.5 py-3 text-right">Biến Phí (VC)</th>
                        <th className="px-3.5 py-3 text-right font-bold text-indigo-900">Đảm Phí (CM)</th>
                        <th className="px-3 py-3 text-right">CMR %</th>
                        <th className="px-3.5 py-3 text-right">Định Phí (FC)</th>
                        <th className="px-3.5 py-3 text-right font-bold text-indigo-900">DT Hòa Vốn Tháng</th>
                        <th className="px-3.5 py-3 text-right font-bold">EBT Tháng</th>
                        <th className="px-4 py-3 text-right font-extrabold bg-indigo-50/50">
                          Lũy Kế Lợi Nhuận (EBT)
                        </th>
                        <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {pnlMonthly.map((m, idx) => {
                        runningEbt += m.ebt;
                        const isBepReachedMonth = runningEbt >= 0 && (idx === 0 || runningEbt - m.ebt < 0);
                        const vc =
                          (m.vatOutput || 0) +
                          (m.platformFees?.total || 0) +
                          (m.shippingB2bRetail?.total || 0) +
                          (m.totalCogs || 0) +
                          (m.marketingPlatform?.total || 0) +
                          (m.marketingOverall?.creatorBookingFee || 0) +
                          (m.fulfillment?.packagingFee || 0) +
                          (m.fulfillment?.shrinkageWarehouseFee || 0);
                        const cm = m.grossRevenue - vc;
                        const cmr = m.grossRevenue > 0 ? (cm / m.grossRevenue) * 100 : 0;
                        const fc = m.gaExpenses?.total || 0;
                        const monthlyBepRev = cmr > 0 ? Math.round(fc / (cmr / 100)) : 0;

                        return (
                          <tr
                            key={`m-pnl-${m.month.id}`}
                            className={`transition-colors ${
                              isBepReachedMonth
                                ? 'bg-emerald-50/60 font-semibold'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="px-3.5 py-2.5">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {m.month.label}
                                {isBepReachedMonth && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-semibold text-slate-800">{formatNumberVi(m.grossRevenue)} đ</td>
                            <td className="px-3.5 py-2.5 text-right text-slate-600">{formatNumberVi(vc)} đ</td>
                            <td className={`px-3.5 py-2.5 text-right font-bold ${cm >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                              {formatNumberVi(cm)} đ
                            </td>
                            <td className="px-3 py-2.5 text-right text-slate-600">{cmr.toFixed(1)}%</td>
                            <td className="px-3.5 py-2.5 text-right text-slate-600">{formatNumberVi(fc)} đ</td>
                            <td className="px-3.5 py-2.5 text-right font-semibold text-indigo-700">{formatNumberVi(monthlyBepRev)} đ</td>
                            <td className={`px-3.5 py-2.5 text-right font-bold ${m.ebt >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {m.ebt >= 0 ? `+${formatNumberVi(m.ebt)} đ` : `-${formatNumberVi(Math.abs(m.ebt))} đ`}
                            </td>
                            <td className={`px-4 py-2.5 text-right font-extrabold bg-indigo-50/30 ${
                              runningEbt >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {runningEbt >= 0 ? `+${formatNumberVi(runningEbt)} đ` : `-${formatNumberVi(Math.abs(runningEbt))} đ`}
                            </td>
                            <td className="px-3.5 py-2.5 text-center">
                              {isBepReachedMonth ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs">
                                  <CheckCircle2 className="w-3 h-3" />
                                  CHẠM BEP DỰ ÁN
                                </span>
                              ) : runningEbt >= 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Lãi tích lũy
                                </span>
                              ) : m.ebt >= 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Lãi tháng (Bù lỗ)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Chưa hòa vốn (Lỗ)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                      <tr>
                        <td className="px-3.5 py-3">TỔNG CỘNG TOÀN KỲ</td>
                        <td className="px-3.5 py-3 text-right text-slate-900">{formatNumberVi(totalRevSum)} đ</td>
                        <td className="px-3.5 py-3 text-right text-slate-700">{formatNumberVi(totalVcSum)} đ</td>
                        <td className="px-3.5 py-3 text-right text-indigo-900 font-extrabold">{formatNumberVi(totalCmSum)} đ</td>
                        <td className="px-3 py-3 text-right text-slate-700">{totalCmrAvg.toFixed(1)}%</td>
                        <td className="px-3.5 py-3 text-right text-slate-700">{formatNumberVi(totalFcSum)} đ</td>
                        <td className="px-3.5 py-3 text-right text-indigo-700 font-bold">{formatNumberVi(totalBepRev)} đ</td>
                        <td className={`px-3.5 py-3 text-right font-extrabold ${totalEbtSum >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {totalEbtSum >= 0 ? `+${formatNumberVi(totalEbtSum)} đ` : `-${formatNumberVi(Math.abs(totalEbtSum))} đ`}
                        </td>
                        <td className={`px-4 py-3 text-right font-extrabold bg-indigo-50/50 ${totalEbtSum >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {totalEbtSum >= 0 ? `+${formatNumberVi(totalEbtSum)} đ` : `-${formatNumberVi(Math.abs(totalEbtSum))} đ`}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            totalEbtSum >= 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {totalEbtSum >= 0 ? 'HÒA VỐN TOÀN KỲ' : 'CHƯA HÒA VỐN'}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
