// Helper utilities for Sheet 3 COGS & Unit Economics calculations
import { QuotationCostBreakdown } from '../types/sku';

export function parseVolume(volumeStr?: string): { amount: number; unit: string } | null {
  if (!volumeStr || typeof volumeStr !== 'string') return null;
  const trimmed = volumeStr.trim();
  const match = trimmed.match(/^([\d.,]+)\s*([a-zA-Z]+)?$/i);
  if (!match) return null;

  const num = parseFloat(match[1].replace(/,/g, '.'));
  if (isNaN(num) || num <= 0) return null;

  const unit = (match[2] || 'ml').toLowerCase();
  return { amount: num, unit };
}

export function calculatePricePerMl(unitPrice: number, volumeStr?: string): { pricePerMl: number; label: string } | null {
  if (!unitPrice || unitPrice <= 0) return null;
  const parsed = parseVolume(volumeStr);
  if (!parsed || parsed.amount <= 0) return null;

  const price = Math.round(unitPrice / parsed.amount);
  return {
    pricePerMl: price,
    label: `${price.toLocaleString('vi-VN')} đ/${parsed.unit}`,
  };
}

export function formatVnd(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')} đ`;
}

export interface CostCalculationInput {
  moq: number;
  volumeMl: number;
  rawMaterialCost: number; // đ/sp
  packagingContainerCost: number; // đ/sp
  labelAndBoxCost: number; // đ/sp
  laborCost: number; // đ/sp
  otherCost: number; // đ/sp
  vatRate?: number; // mặc định 0.08
  testingFeePerBatch: number; // đ/lô
  shippingFeeEstimated: number; // đ/lô
}

export function computeQuotationBreakdown(input: CostCalculationInput): QuotationCostBreakdown {
  const moq = Math.max(input.moq || 1, 1);
  const volumeMl = Math.max(input.volumeMl || 1, 1);
  const vatRate = typeof input.vatRate === 'number' ? input.vatRate : 0.08;

  const rawMaterialCost = Number(input.rawMaterialCost) || 0;
  const packagingContainerCost = Number(input.packagingContainerCost) || 0;
  const labelAndBoxCost = Number(input.labelAndBoxCost) || 0;
  const laborCost = Number(input.laborCost) || 0;
  const otherCost = Number(input.otherCost) || 0;

  const unitDirectCost = rawMaterialCost + packagingContainerCost + labelAndBoxCost + laborCost + otherCost;
  const subtotalBeforeVat = Math.round(unitDirectCost * moq);
  const vatAmount = Math.round(subtotalBeforeVat * vatRate);
  const totalWithVat = subtotalBeforeVat + vatAmount;

  const testingFeePerBatch = Number(input.testingFeePerBatch) || 0;
  const shippingFeeEstimated = Number(input.shippingFeeEstimated) || 0;

  const totalCogsBatch = totalWithVat + testingFeePerBatch + shippingFeeEstimated;
  const cogsPerUnit = Math.round(totalCogsBatch / moq);
  const cogsPerMl = volumeMl > 0 ? Math.round(cogsPerUnit / volumeMl) : 0;

  return {
    rawMaterialCost,
    packagingContainerCost,
    labelAndBoxCost,
    laborCost,
    otherCost,
    subtotalBeforeVat,
    vatRate,
    vatAmount,
    totalWithVat,
    testingFeePerBatch,
    shippingFeeEstimated,
    totalCogsBatch,
    cogsPerUnit,
    cogsPerMl,
  };
}
