import { SalaryStructurePosition, HeadcountPlanMap, InitialCapexItem, MonthlyOperatingExpense, HrOperationsConfig } from '../types/hrOperations';
import { SalesMonth } from '../types/salesForecast';
import { TaxAndCapitalConfig } from '../types/financial';

export interface PositionCostBreakdown {
  baseSalary: number;
  insuranceSalary: number;
  kpiBonus: number;
  socialInsuranceRate: number;
  insuranceEmployerCost: number;
  seasonalPitRate: number;
  pitCompanyPaid: number;
  totalCompanyCost: number;
  thirteenthMonthSalary: number;
}

/**
 * Tính toán chi tiết chi phí công ty cho 1 nhân sự của 1 vị trí
 */
export function calculatePositionSingleCost(
  pos: SalaryStructurePosition,
  taxConfig: TaxAndCapitalConfig
): PositionCostBreakdown {
  const socialRate = pos.customSocialInsuranceRate ?? taxConfig.socialInsuranceRate; // e.g. 21.5%
  const seasonalPitRate = taxConfig.seasonalPersonalIncomeTaxRate; // e.g. 10%

  // BHXH NSDLĐ = Lương đóng BHXH * Tỷ lệ BHXH (Tab 1)
  const insuranceEmployerCost = pos.insuranceSalary > 0 
    ? Math.round(pos.insuranceSalary * (socialRate / 100)) 
    : 0;

  // Thuế TNCN Cty trả: nếu có override thì lấy override, nếu là parttime thì tính theo % thời vụ Tab 1
  let pitCompanyPaid = 0;
  if (pos.overridePitCompanyPaid !== undefined) {
    pitCompanyPaid = pos.overridePitCompanyPaid;
  } else if (pos.contractType === 'parttime') {
    pitCompanyPaid = Math.round(pos.baseSalary * (seasonalPitRate / 100));
  }

  // Chi phí Công ty = Lương + Thưởng KPI + BHXH (NSDLĐ) + Thuế TNCN CTY trả
  const totalCompanyCost = pos.baseSalary + pos.kpiBonus + insuranceEmployerCost + pitCompanyPaid;

  const thirteenthMonthSalary = pos.thirteenthMonthSalary !== undefined 
    ? pos.thirteenthMonthSalary 
    : pos.baseSalary;

  return {
    baseSalary: pos.baseSalary,
    insuranceSalary: pos.insuranceSalary,
    kpiBonus: pos.kpiBonus,
    socialInsuranceRate: socialRate,
    insuranceEmployerCost,
    seasonalPitRate,
    pitCompanyPaid,
    totalCompanyCost,
    thirteenthMonthSalary,
  };
}

/**
 * Tính toán ma trận chi phí lương theo từng vị trí & từng tháng
 */
export function calculateMonthlySalaryMatrix(
  positions: SalaryStructurePosition[],
  headcountMap: HeadcountPlanMap,
  months: SalesMonth[],
  taxConfig: TaxAndCapitalConfig,
  config?: HrOperationsConfig
) {
  const include13th = config?.include13thMonth ?? false;
  const payment13thMonthId = config?.thirteenthMonthPaymentMonthId ?? '2026-12';

  // [posId]: PositionCostBreakdown
  const breakdownByPos: Record<string, PositionCostBreakdown> = {};
  positions.forEach((pos) => {
    breakdownByPos[pos.id] = calculatePositionSingleCost(pos, taxConfig);
  });

  // [posId]: { [monthId]: cost }
  const positionMonthlyCost: Record<string, Record<string, number>> = {};
  // [monthId]: totalCost
  const monthlyTotalSalary: Record<string, number> = {};
  // [monthId]: totalHeadcount
  const monthlyTotalHeadcount: Record<string, number> = {};

  months.forEach((m) => {
    monthlyTotalSalary[m.id] = 0;
    monthlyTotalHeadcount[m.id] = 0;
  });

  positions.forEach((pos) => {
    positionMonthlyCost[pos.id] = {};
    const single = breakdownByPos[pos.id];

    months.forEach((m) => {
      const count = headcountMap[pos.id]?.[m.id] ?? 0;
      monthlyTotalHeadcount[m.id] = (monthlyTotalHeadcount[m.id] || 0) + count;

      let unitMonthlyCost = single.totalCompanyCost;
      if (include13th && m.id === payment13thMonthId) {
        unitMonthlyCost += single.thirteenthMonthSalary;
      }

      const totalCost = count * unitMonthlyCost;
      positionMonthlyCost[pos.id][m.id] = totalCost;
      monthlyTotalSalary[m.id] = (monthlyTotalSalary[m.id] || 0) + totalCost;
    });
  });

  return {
    breakdownByPos,
    positionMonthlyCost,
    monthlyTotalSalary,
    monthlyTotalHeadcount,
  };
}

/**
 * Tính toán khấu hao tài sản đầu tư ban đầu phân bổ theo từng tháng
 * Logic:
 * - Phân bổ đều từng tháng theo kỳ hạn khấu hao (depreciationMonths).
 * - Giới hạn thời gian là số tháng kinh doanh thực tế được tạo ra theo kế hoạch bán hàng.
 * - Nếu kỳ hạn khấu hao vượt quá độ dài kế hoạch bán hàng, số tiền còn lại sau khi đã trừ
 *   khấu hao đều từng tháng sẽ được cộng dồn để tính vào tháng cuối cùng của kế hoạch.
 */
export function calculateCapexDepreciationMatrix(
  capexItems: InitialCapexItem[],
  months: SalesMonth[]
) {
  // [capexId]: { [monthId]: depreciationAmount }
  const itemMonthlyDepreciation: Record<string, Record<string, number>> = {};
  // [monthId]: totalDepreciation
  const monthlyTotalDepreciation: Record<string, number> = {};

  months.forEach((m) => {
    monthlyTotalDepreciation[m.id] = 0;
  });

  if (months.length === 0) {
    return {
      itemMonthlyDepreciation,
      monthlyTotalDepreciation,
    };
  }

  const lastMonthIdx = months.length - 1;

  capexItems.forEach((item) => {
    itemMonthlyDepreciation[item.id] = {};

    // Khởi tạo 0 cho mọi tháng
    months.forEach((m) => {
      itemMonthlyDepreciation[item.id][m.id] = 0;
    });

    if (item.amount <= 0 || item.depreciationMonths <= 0) {
      return;
    }

    // Tìm index của tháng giải ngân
    let startIdx = months.findIndex(
      (m) =>
        m.id === item.disbursementMonth ||
        m.dateStr === item.disbursementMonth ||
        m.label === item.disbursementLabel ||
        m.label === item.disbursementMonth
    );
    if (startIdx === -1) {
      startIdx = 0; // Mặc định từ tháng đầu tiên nếu không khớp
    }

    // Nếu thời điểm giải ngân sau toàn bộ kế hoạch bán hàng
    if (startIdx > lastMonthIdx) {
      return;
    }

    // Mức trích khấu hao đều hàng tháng theo kỳ hạn khấu hao
    const monthlyRate = Math.round(item.amount / item.depreciationMonths);

    // Kỳ hạn kết thúc khấu hao lý thuyết
    const theoreticalEndIdx = startIdx + item.depreciationMonths - 1;

    // Giới hạn thời gian là số tháng kinh doanh thực tế được tạo ra theo kế hoạch bán hàng:
    if (theoreticalEndIdx >= lastMonthIdx) {
      // Trường hợp kỳ hạn khấu hao vượt quá hoặc bằng tháng kết thúc kế hoạch bán hàng:
      // Các tháng trước tháng cuối cùng trích đều theo monthlyRate.
      // Tháng cuối cùng của kế hoạch sẽ nhận toàn bộ số tiền còn lại sau khi đã trừ khấu hao đều các tháng trước.
      let accumulated = 0;
      for (let idx = startIdx; idx < lastMonthIdx; idx++) {
        const m = months[idx];
        itemMonthlyDepreciation[item.id][m.id] = monthlyRate;
        monthlyTotalDepreciation[m.id] = (monthlyTotalDepreciation[m.id] || 0) + monthlyRate;
        accumulated += monthlyRate;
      }
      const finalMonth = months[lastMonthIdx];
      const remainingAmount = Math.max(0, item.amount - accumulated);
      itemMonthlyDepreciation[item.id][finalMonth.id] = remainingAmount;
      monthlyTotalDepreciation[finalMonth.id] =
        (monthlyTotalDepreciation[finalMonth.id] || 0) + remainingAmount;
    } else {
      // Kỳ hạn khấu hao kết thúc TRƯỚC tháng cuối cùng của kế hoạch:
      // Phân bổ đều cho đến tháng kết thúc khấu hao của tài sản, tháng cuối của kỳ hạn nhận phần còn lại.
      let accumulated = 0;
      for (let idx = startIdx; idx < theoreticalEndIdx; idx++) {
        const m = months[idx];
        itemMonthlyDepreciation[item.id][m.id] = monthlyRate;
        monthlyTotalDepreciation[m.id] = (monthlyTotalDepreciation[m.id] || 0) + monthlyRate;
        accumulated += monthlyRate;
      }
      const endMonth = months[theoreticalEndIdx];
      const remainingAmount = Math.max(0, item.amount - accumulated);
      itemMonthlyDepreciation[item.id][endMonth.id] = remainingAmount;
      monthlyTotalDepreciation[endMonth.id] =
        (monthlyTotalDepreciation[endMonth.id] || 0) + remainingAmount;
    }
  });

  return {
    itemMonthlyDepreciation,
    monthlyTotalDepreciation,
  };
}

/**
 * Tính toán ma trận chi phí vận hành (Opex) phân bổ theo từng tháng
 * Có hỗ trợ tùy chọn tháng bắt đầu phát sinh (startMonth):
 * - Nếu không chọn startMonth hoặc startMonth rỗng -> Mặc định bắt đầu từ tháng đầu tiên.
 * - Các tháng trước startMonth sẽ có giá trị = 0.
 * - Từ tháng startMonth trở đi sẽ phát sinh đầy đủ chi phí hàng tháng.
 */
export function calculateMonthlyOpexMatrix(
  opexItems: MonthlyOperatingExpense[],
  months: SalesMonth[]
) {
  // [opexId]: { [monthId]: amount }
  const itemMonthlyOpex: Record<string, Record<string, number>> = {};
  // [monthId]: totalOpex
  const monthlyTotalOpex: Record<string, number> = {};

  months.forEach((m) => {
    monthlyTotalOpex[m.id] = 0;
  });

  opexItems.forEach((item) => {
    itemMonthlyOpex[item.id] = {};

    let startIdx = 0;
    if (item.startMonth) {
      const idx = months.findIndex(
        (m) =>
          m.id === item.startMonth ||
          m.dateStr === item.startMonth ||
          m.label === item.startMonth
      );
      if (idx !== -1) {
        startIdx = idx;
      }
    }

    months.forEach((m, idx) => {
      const isEffective = idx >= startIdx;
      const amt = isEffective ? (item.amount || 0) : 0;
      itemMonthlyOpex[item.id][m.id] = amt;
      monthlyTotalOpex[m.id] = (monthlyTotalOpex[m.id] || 0) + amt;
    });
  });

  return {
    itemMonthlyOpex,
    monthlyTotalOpex,
  };
}

export function formatVND(value: number): string {
  if (value === 0) return '0 đ';
  return `${value.toLocaleString('vi-VN')} đ`;
}

export function formatNumberVi(value: number): string {
  return value.toLocaleString('vi-VN');
}
