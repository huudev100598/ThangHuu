import { ProductSku, Sheet3CogsData, SupplierQuotation } from '../types/sku';
import { SalesMonth, SalesVolumeMap, CreatorCampaign } from '../types/salesForecast';
import { ProjectParameters } from '../types/financial';

export interface PoOrderItem {
  batchCode: string;
  batchNumber: number;
  skuId: string;
  skuCode: string;
  skuName: string;
  factoryName: string;
  moq: number;
  orderUnits: number;
  cogsPerUnit: number;
  totalCost: number;
  deposit50: number;
  final50: number;
  targetMonthId: string;
  targetMonthLabel: string;
  orderDate: string; // dd/mm/yyyy
  deliveryDate: string; // dd/mm/yyyy
  leadTimeDays: number;
  status: 'critical' | 'upcoming' | 'planned';
  isPreHorizon?: boolean; // Lệnh phát trước tháng bắt đầu kỳ kế hoạch
}

export type PoStrategy = 'jit-moq' | 'quarterly' | 'bulk-all' | 'custom';

/**
 * Chuyển đổi định dạng ngày sang Month ID (YYYY-MM)
 * Hỗ trợ DD/MM/YYYY, YYYY-MM-DD, YYYY-MM
 */
export function getMonthIdFromDateStr(dateStr: string): string {
  if (!dateStr) return '';
  // Format DD/MM/YYYY
  const slashParts = dateStr.split('/');
  if (slashParts.length === 3) {
    const year = slashParts[2].trim();
    const month = slashParts[1].trim().padStart(2, '0');
    return `${year}-${month}`;
  }
  // Format YYYY-MM or YYYY-MM-DD
  const dashParts = dateStr.split('-');
  if (dashParts.length >= 2) {
    const year = dashParts[0].trim();
    const month = dashParts[1].trim().padStart(2, '0');
    return `${year}-${month}`;
  }
  return '';
}

/**
 * Tính ngày phát lệnh PO và ngày hàng về kho theo Lead-time (ngày)
 */
export function calculatePoDates(dateStr: string, leadTimeDays: number) {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const month = parseInt(parts[1], 10) || 1;

  // Ngày hàng về kho = ngày 01 của tháng bán hàng
  const deliveryDate = new Date(year, month - 1, 1);
  // Ngày phát lệnh PO = ngày giao hàng trừ số ngày lead time
  const orderDate = new Date(deliveryDate.getTime() - leadTimeDays * 24 * 60 * 60 * 1000);

  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${day}/${m}/${y}`;
  };

  return {
    deliveryDate: formatDate(deliveryDate),
    orderDate: formatDate(orderDate),
    deliveryDateObj: deliveryDate,
    orderDateObj: orderDate,
  };
}

/**
 * Tính ma trận sản xuất cho từng SKU đơn lẻ (bao gồm hàng bán trực tiếp, hàng bán combo, hàng sampling)
 */
export function calculateSingleSkuProductionMatrix(
  skus: ProductSku[],
  months: SalesMonth[],
  volumes: SalesVolumeMap,
  creatorCampaigns: CreatorCampaign[] = [],
  sheet3CogsMap: Record<string, Sheet3CogsData> = {}
) {
  // 1. Tính sản lượng Sampling theo từng SKU và từng Tháng từ Creator Campaign
  const samplingVolumes: Record<string, Record<string, number>> = {};
  skus.forEach((sku) => {
    samplingVolumes[sku.id] = {};
    months.forEach((m) => {
      samplingVolumes[sku.id][m.id] = 0;
    });
  });

  creatorCampaigns.forEach((camp) => {
    camp.skuIds?.forEach((skuId) => {
      if (!samplingVolumes[skuId]) samplingVolumes[skuId] = {};
      months.forEach((m) => {
        const cfg = camp.monthConfigs?.[m.id];
        if (cfg) {
          const perSkuSamples =
            (cfg.ugcCount || 0) * (cfg.ugcSamplesPerSku ?? 1) +
            (cfg.kocCount || 0) * (cfg.kocSamplesPerSku ?? 5) +
            (cfg.kolCount || 0) * (cfg.kolSamplesPerSku ?? 10);
          samplingVolumes[skuId][m.id] = (samplingVolumes[skuId][m.id] || 0) + perSkuSamples;
        }
      });
    });
  });

  const singleSkus = skus.filter((s) => s.type !== 'combo');
  const comboSkus = skus.filter((s) => s.type === 'combo');

  const matrix: Record<string, {
    unitCogs: number;
    months: Record<string, {
      directSales: number;
      comboSales: number;
      totalSales: number;
      directSampling: number;
      comboSampling: number;
      totalSampling: number;
      totalProduction: number;
      cost: number;
    }>;
    totalDirectSales: number;
    totalComboSales: number;
    totalSales: number;
    totalDirectSampling: number;
    totalComboSampling: number;
    totalSampling: number;
    totalProduction: number;
    totalCost: number;
  }> = {};

  singleSkus.forEach((sku) => {
    const unitCogs = sheet3CogsMap[sku.id]?.cogsPerUnit || 0;
    let totalDirectSales = 0;
    let totalComboSales = 0;
    let totalDirectSampling = 0;
    let totalComboSampling = 0;

    const monthMap: Record<string, {
      directSales: number;
      comboSales: number;
      totalSales: number;
      directSampling: number;
      comboSampling: number;
      totalSampling: number;
      totalProduction: number;
      cost: number;
    }> = {};

    months.forEach((m) => {
      // Hàng bán trực tiếp
      const directSales = volumes[sku.id]?.[m.id] || 0;

      // Hàng bán từ các Combo có chứa SKU này
      let comboSales = 0;
      comboSkus.forEach((combo) => {
        const item = combo.comboItems?.find((ci) => ci.skuId === sku.id);
        if (item && item.quantity > 0) {
          const comboVol = volumes[combo.id]?.[m.id] || 0;
          comboSales += comboVol * item.quantity;
        }
      });

      // Hàng sampling trực tiếp
      const directSampling = samplingVolumes[sku.id]?.[m.id] || 0;

      // Hàng sampling từ các Combo
      let comboSampling = 0;
      comboSkus.forEach((combo) => {
        const item = combo.comboItems?.find((ci) => ci.skuId === sku.id);
        if (item && item.quantity > 0) {
          const comboSampVol = samplingVolumes[combo.id]?.[m.id] || 0;
          comboSampling += comboSampVol * item.quantity;
        }
      });

      const totalSales = directSales + comboSales;
      const totalSampling = directSampling + comboSampling;
      const totalProduction = totalSales + totalSampling;
      const cost = totalProduction * unitCogs;

      monthMap[m.id] = {
        directSales,
        comboSales,
        totalSales,
        directSampling,
        comboSampling,
        totalSampling,
        totalProduction,
        cost,
      };

      totalDirectSales += directSales;
      totalComboSales += comboSales;
      totalDirectSampling += directSampling;
      totalComboSampling += comboSampling;
    });

    const totalSales = totalDirectSales + totalComboSales;
    const totalSampling = totalDirectSampling + totalComboSampling;
    const totalProduction = totalSales + totalSampling;
    const totalCost = totalProduction * unitCogs;

    matrix[sku.id] = {
      unitCogs,
      months: monthMap,
      totalDirectSales,
      totalComboSales,
      totalSales,
      totalDirectSampling,
      totalComboSampling,
      totalSampling,
      totalProduction,
      totalCost,
    };
  });

  return { matrix, singleSkus, comboSkus };
}

/**
 * Sinh danh sách các lệnh đặt hàng PO chi tiết (DANH SÁCH CÁC LỆNH ĐẶT HÀNG PO ĐỀ XUẤT CHI TIẾT)
 */
export function generateAllPoBatches(
  productionSkus: ProductSku[],
  months: SalesMonth[],
  singleSkuProductionMatrix: ReturnType<typeof calculateSingleSkuProductionMatrix>['matrix'],
  sheet3CogsMap: Record<string, Sheet3CogsData> = {},
  quotations: SupplierQuotation[] = [],
  parameters: ProjectParameters,
  strategy: PoStrategy = 'jit-moq'
): PoOrderItem[] {
  const allBatches: PoOrderItem[] = [];

  productionSkus.forEach((sku) => {
    const chosenQuote = quotations.find((q) => q.skuId === sku.id && q.isChosen);
    const cogsData = sheet3CogsMap[sku.id];

    const factoryName = chosenQuote?.factoryName || cogsData?.factoryName || 'Chưa chốt nhà máy';
    const moq = chosenQuote?.moq || cogsData?.moq || 1000;
    const cogsPerUnit = chosenQuote?.unitPrice || cogsData?.cogsPerUnit || 0;
    const leadTimeDays =
      chosenQuote?.leadTimeDays ||
      cogsData?.leadTimeDays ||
      parameters.supplyChain?.productionLeadTimeDays ||
      45;

    const matrixRow = singleSkuProductionMatrix[sku.id];
    const batches: PoOrderItem[] = [];

    if (strategy === 'jit-moq') {
      let inventory = 0;

      months.forEach((m) => {
        const mDemand = matrixRow?.months[m.id]?.totalProduction || 0;
        let poUnits = 0;

        if (inventory < mDemand) {
          const netNeed = mDemand - inventory;
          poUnits = Math.max(moq, Math.ceil(netNeed / moq) * moq);
          inventory += poUnits;

          const dates = calculatePoDates(m.dateStr, leadTimeDays);
          const batchIdx = batches.length + 1;
          const batchCode = `PO-${sku.skuCode}-0${batchIdx}`;

          batches.push({
            batchCode,
            batchNumber: batchIdx,
            skuId: sku.id,
            skuCode: sku.skuCode,
            skuName: sku.name,
            factoryName,
            moq,
            orderUnits: poUnits,
            cogsPerUnit,
            totalCost: poUnits * cogsPerUnit,
            deposit50: poUnits * cogsPerUnit * 0.5,
            final50: poUnits * cogsPerUnit * 0.5,
            targetMonthId: m.id,
            targetMonthLabel: m.label,
            orderDate: dates.orderDate,
            deliveryDate: dates.deliveryDate,
            leadTimeDays,
            status: batchIdx === 1 ? 'critical' : batchIdx === 2 ? 'upcoming' : 'planned',
          });
        }

        inventory -= mDemand;
      });
    } else if (strategy === 'quarterly') {
      let inventory = 0;
      const quarterSize = 3;

      for (let i = 0; i < months.length; i += quarterSize) {
        const qMonths = months.slice(i, i + quarterSize);
        const firstM = qMonths[0];
        const qDemand = qMonths.reduce((sum, qm) => sum + (matrixRow?.months[qm.id]?.totalProduction || 0), 0);

        let poUnits = 0;
        if (inventory < qDemand) {
          const netNeed = qDemand - inventory;
          poUnits = Math.max(moq, Math.ceil(netNeed / moq) * moq);
          inventory += poUnits;

          const dates = calculatePoDates(firstM.dateStr, leadTimeDays);
          const batchIdx = batches.length + 1;
          const batchCode = `PO-${sku.skuCode}-Q${Math.floor(i / quarterSize) + 1}`;

          batches.push({
            batchCode,
            batchNumber: batchIdx,
            skuId: sku.id,
            skuCode: sku.skuCode,
            skuName: sku.name,
            factoryName,
            moq,
            orderUnits: poUnits,
            cogsPerUnit,
            totalCost: poUnits * cogsPerUnit,
            deposit50: poUnits * cogsPerUnit * 0.5,
            final50: poUnits * cogsPerUnit * 0.5,
            targetMonthId: firstM.id,
            targetMonthLabel: firstM.label,
            orderDate: dates.orderDate,
            deliveryDate: dates.deliveryDate,
            leadTimeDays,
            status: batchIdx === 1 ? 'critical' : 'planned',
          });
        }
        inventory -= qDemand;
      }
    } else if (strategy === 'bulk-all') {
      const totalDemand = matrixRow?.totalProduction || 0;
      if (totalDemand > 0) {
        const poUnits = Math.max(moq, Math.ceil(totalDemand / moq) * moq);
        const firstM = months[0];
        const dates = calculatePoDates(firstM?.dateStr || '2026-09', leadTimeDays);
        const batchCode = `PO-${sku.skuCode}-BULK`;

        batches.push({
          batchCode,
          batchNumber: 1,
          skuId: sku.id,
          skuCode: sku.skuCode,
          skuName: sku.name,
          factoryName,
          moq,
          orderUnits: poUnits,
          cogsPerUnit,
          totalCost: poUnits * cogsPerUnit,
          deposit50: poUnits * cogsPerUnit * 0.5,
          final50: poUnits * cogsPerUnit * 0.5,
          targetMonthId: firstM?.id || '2026-09',
          targetMonthLabel: firstM?.label || 'Đầu kỳ',
          orderDate: dates.orderDate,
          deliveryDate: dates.deliveryDate,
          leadTimeDays,
          status: 'critical',
        });
      }
    }

    allBatches.push(...batches);
  });

  return allBatches;
}

/**
 * Tính chi phí Tiền đặt hàng theo tháng dựa trên Ngày phát lệnh PO (orderDate):
 * "Ngày phát lệnh PO của tháng nào, thì tháng đó sẽ ghi nhận chi phí Tiền đặt hàng trong báo cáo dòng tiền."
 *
 * Đối với các lệnh PO có ngày phát lệnh trước tháng đầu tiên của kỳ kế hoạch (để hàng về kịp đầu kỳ),
 * các lệnh này sẽ được cộng vào tháng đầu kỳ (months[0]) để phản ánh toàn bộ dòng tiền chuẩn bị hàng ban đầu,
 * đồng thời gắn cờ `isPreHorizon = true` để minh bạch thông tin.
 */
export function calculateMonthlyPoExpenseByOrderDate(
  batches: PoOrderItem[],
  months: SalesMonth[]
): {
  monthlyMap: Record<string, { totalPoExpense: number; batches: PoOrderItem[] }>;
  totalPoExpense: number;
} {
  const monthlyMap: Record<string, { totalPoExpense: number; batches: PoOrderItem[] }> = {};

  months.forEach((m) => {
    monthlyMap[m.id] = { totalPoExpense: 0, batches: [] };
  });

  if (months.length === 0) {
    return { monthlyMap, totalPoExpense: 0 };
  }

  const firstMonthId = months[0].id;
  let totalPoExpense = 0;

  batches.forEach((batch) => {
    const orderMonthId = getMonthIdFromDateStr(batch.orderDate);
    totalPoExpense += batch.totalCost;

    if (orderMonthId && monthlyMap[orderMonthId]) {
      // Ngày phát lệnh PO trùng khớp với một tháng trong bảng kế hoạch
      monthlyMap[orderMonthId].totalPoExpense += batch.totalCost;
      monthlyMap[orderMonthId].batches.push({
        ...batch,
        isPreHorizon: false,
      });
    } else if (orderMonthId && orderMonthId < firstMonthId) {
      // Ngày phát lệnh PO diễn ra trước tháng bắt đầu kỳ (do lead time dài)
      // Ghi nhận vào tháng đầu kỳ để đảm bảo dòng tiền ban đầu không bị sót
      monthlyMap[firstMonthId].totalPoExpense += batch.totalCost;
      monthlyMap[firstMonthId].batches.push({
        ...batch,
        isPreHorizon: true,
      });
    } else {
      // Nếu orderMonthId lớn hơn tháng cuối, ghi nhận vào tháng cuối hoặc tháng gần nhất
      const lastMonthId = months[months.length - 1].id;
      if (monthlyMap[lastMonthId]) {
        monthlyMap[lastMonthId].totalPoExpense += batch.totalCost;
        monthlyMap[lastMonthId].batches.push({
          ...batch,
          isPreHorizon: false,
        });
      }
    }
  });

  return { monthlyMap, totalPoExpense };
}
