import { PlatformFeeDetail } from '../types/financial';

export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 đ';
  const rounded = Math.round(amount);
  return `${new Intl.NumberFormat('vi-VN').format(rounded)} đ`;
}

export function formatNumber(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(value);
}

export const formatNumberVi = formatNumber;

export function formatPercent(rate: number, maxDecimals: number = 2): string {
  if (isNaN(rate) || rate === null || rate === undefined) return '0%';
  const formatted = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: rate % 1 === 0 ? 0 : 1,
  }).format(rate);
  return `${formatted}%`;
}

/**
 * Tính tổng tỷ lệ phí biến đổi trên doanh thu (%)
 * (Phí thanh toán + Hoa hồng + Voucher Xtra + Đóng gói kho bãi + Hao hụt)
 */
export function calcTotalPlatformVariableRate(fee: PlatformFeeDetail): number {
  return Number(
    (
      fee.paymentFeeRate +
      fee.platformCommissionRate +
      fee.voucherXtraRate +
      fee.packagingAndWarehousingRate +
      fee.shrinkageRate
    ).toFixed(2)
  );
}

/**
 * Tính tổng phí cố định trên mỗi sản phẩm (VND)
 * (Phí xử lý đơn hàng + Phí bồi hoàn)
 */
export function calcTotalPlatformFixedFeePerItem(fee: PlatformFeeDetail): number {
  return Math.round(fee.orderHandlingFeePerItem + fee.compensationFeePerItem);
}

/**
 * Ước tính số tiền thực nhận sau phí sàn từ 1 sản phẩm bán lẻ
 * Net Revenue = (Retail Price * (1 - Total Variable Rate%)) - Fixed Fee
 */
export function estimatePlatformNetPayout(
  retailPrice: number,
  fee: PlatformFeeDetail
): {
  variableAmount: number;
  fixedAmount: number;
  totalFeeAmount: number;
  netPayout: number;
  takeRatePercent: number;
} {
  const variableRate = calcTotalPlatformVariableRate(fee) / 100;
  const variableAmount = Math.round(retailPrice * variableRate);
  const fixedAmount = calcTotalPlatformFixedFeePerItem(fee);
  const totalFeeAmount = variableAmount + fixedAmount;
  const netPayout = Math.max(0, retailPrice - totalFeeAmount);
  const takeRatePercent = retailPrice > 0 ? (totalFeeAmount / retailPrice) * 100 : 0;

  return {
    variableAmount,
    fixedAmount,
    totalFeeAmount,
    netPayout,
    takeRatePercent,
  };
}
