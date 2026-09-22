// Types for Step 2: SKU Catalog & Categories and Sheet 3: COGS Integration

export type SkuType = 'single' | 'combo';

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface ComboItemReference {
  skuId: string; // references single SKU
  quantity: number;
}

export interface ChannelPrices {
  standard: number; // Giá Tiêu Chuẩn
  shopee: number;   // Giá Shopee
  tikTokShop: number; // Giá TikTok Shop
  retail: number;   // Bán Lẻ Retailer
  b2b: number;      // B2B (GT/MT/Spa)
}

// Sheet 3 (Giá Vốn Hàng Bán / COGS) reference data per SKU
export interface Sheet3CogsData {
  skuId: string;
  cogsPerUnit: number; // Giá vốn hàng bán (VND)
  moq: number; // Tối thiểu đơn đặt hàng nhà máy (sản phẩm)
  factoryName: string; // Tên nhà máy sản xuất
  factoryLocation?: string;
  leadTimeDays?: number;
  notes?: string;
}

// 1. Dữ liệu Nhà Cung Cấp / Nhà máy sản xuất (Sheet 3)
export interface Supplier {
  id: string;
  factoryName: string; // Tên nhà máy
  address: string; // Địa chỉ sản xuất
  contactPerson: string; // Nhân viên phụ trách
  phone: string; // Số điện thoại
  email?: string; // Email liên hệ (tùy chọn)
  notes?: string; // Ghi chú năng lực sản xuất
}

// 2. Dữ liệu Báo giá sản xuất cho từng SKU (Sheet 3)
export interface QuotationCostBreakdown {
  rawMaterialCost: number; // Chi phí nguyên vật liệu (đ/sp)
  packagingContainerCost: number; // Chi phí chai/vỏ (đ/sp)
  labelAndBoxCost: number; // Chi phí tem nhãn + hộp (đ/sp)
  laborCost: number; // Chi phí nhân công (đ/sp)
  otherCost: number; // Chi phí khác không biết đưa vào đâu (đ/sp)

  subtotalBeforeVat: number; // Tổng chi phí theo MOQ (chưa VAT)
  vatRate: number; // Tỷ lệ VAT (mặc định 0.08 = 8%)
  vatAmount: number; // Tiền VAT 8%
  totalWithVat: number; // Chi phí đã có VAT

  testingFeePerBatch: number; // Phí kiểm nghiệm theo lô sản xuất (VNĐ/lô)
  shippingFeeEstimated: number; // Phí vận chuyển (dự kiến) (VNĐ/lô)

  totalCogsBatch: number; // Tổng chi phí hàng bán (cả lô)
  cogsPerUnit: number; // Giá vốn hàng bán trên sản phẩm (đ/sp)
  cogsPerMl: number; // Giá vốn hàng bán trên ml (đ/ml)
}

export interface ProductQuotation {
  id: string;
  skuId: string; // Mã SKU sản phẩm đơn lẻ liên kết
  supplierId: string; // Mã nhà cung cấp
  factoryName: string; // Tên nhà máy sản xuất (cache)
  volumeMl?: number; // Dung tích (ml)
  moq: number; // Mức MOQ (vd: 1000, 3000, 5000, 10000)
  unitPrice: number; // Giá vốn hàng bán trên sản phẩm (VND/sản phẩm)
  unitPricePerMl?: number; // Giá vốn hàng bán trên ml (đ/ml)
  leadTimeDays?: number; // Thời gian sản xuất (ngày)
  packagingDescription?: string; // Quy cách đóng gói/bao bì
  notes?: string; // Ghi chú chi tiết báo giá
  isChosen?: boolean; // Đã chốt làm phương án sản xuất cho SKU này chưa
  costBreakdown?: QuotationCostBreakdown; // Bảng chi tiết định mức chi phí cấu thành COGS
}

export type SupplierQuotation = ProductQuotation;

export interface ProductSku {
  id: string;
  skuCode: string; // Mã SKU, e.g. MM-SERUM-50
  name: string; // Tên Sản Phẩm, e.g. Serum Khử Mùi & Dưỡng Sáng Mosh&Mode
  categoryId: string; // Thuộc danh mục sản phẩm nào
  type: SkuType; // 'single' hoặc 'combo'
  volume?: string; // Dung tích, e.g. "50ml", "100ml" (để trống nếu combo)
  
  // Channels price list
  prices: ChannelPrices;

  // Combo specific composition (if type === 'combo')
  comboItems?: ComboItemReference[];

  // User notes or status
  status?: 'active' | 'draft' | 'discontinued';
}
