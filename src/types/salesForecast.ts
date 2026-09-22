export interface SalesMonth {
  id: string; // e.g. '2025-01'
  dateStr: string; // '2025-01' (format YYYY-MM)
  label: string; // 'Tháng 01/2025'
}

// [skuId]: { [monthId]: volumeNumber }
export type SalesVolumeMap = Record<string, Record<string, number>>;

export interface ChannelMixConfig {
  shopee: number; // % (e.g. 45)
  tikTokShop: number; // % (e.g. 35)
  retail: number; // % (e.g. 10)
  b2b: number; // % (e.g. 10)
}

export interface CreatorMonthlyAllocation {
  ugcCount: number;
  kocCount: number;
  kolCount: number;
}

export type CreatorPlanMap = Record<string, CreatorMonthlyAllocation>; // [monthId]: allocation

// Cấu hình Creator và Sampling cho 1 tháng trong chiến dịch
export interface CampaignMonthConfig {
  monthId: string; // e.g. '2025-01'
  ugcCount: number;
  kocCount: number;
  kolCount: number;
  // Số mẫu sampling cho mỗi creator (mặc định lấy từ Tab 1 creatorTiers.freeSamplesPerSku)
  ugcSamplesPerSku: number;
  kocSamplesPerSku: number;
  kolSamplesPerSku: number;
}

// Chiến dịch Creator kết nối với Tab 1 và cấp dữ liệu Sampling cho Bảng Sampling
export interface CreatorCampaign {
  id: string;
  name: string;
  description?: string;
  skuIds: string[]; // Danh sách các SKU áp dụng cho chiến dịch
  monthConfigs: Record<string, CampaignMonthConfig>; // [monthId]: CampaignMonthConfig
  createdAt: string;
}

export type SalesPlanSubTab = 
  | 'volume-matrix'     // Kế Hoạch Sản Lượng Bán & Sampling & Tổng Sản Xuất
  | 'product-pnl'       // P&L Sản Phẩm
  | 'channel-mix'       // Tỷ Trọng Kênh Bán Hàng
  | 'creator-plan';     // Kế Hoạch Creator (Chiến Dịch)
