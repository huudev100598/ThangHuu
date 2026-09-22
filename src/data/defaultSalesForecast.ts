import { SalesMonth, SalesVolumeMap, ChannelMixConfig, CreatorPlanMap, CreatorCampaign } from '../types/salesForecast';

export const DEFAULT_SALES_MONTHS: SalesMonth[] = [
  { id: '2025-01', dateStr: '2025-01', label: 'Tháng 01/2025' },
  { id: '2025-02', dateStr: '2025-02', label: 'Tháng 02/2025' },
  { id: '2025-03', dateStr: '2025-03', label: 'Tháng 03/2025' },
  { id: '2025-04', dateStr: '2025-04', label: 'Tháng 04/2025' },
  { id: '2025-05', dateStr: '2025-05', label: 'Tháng 05/2025' },
  { id: '2025-06', dateStr: '2025-06', label: 'Tháng 06/2025' },
];

export const DEFAULT_SALES_VOLUMES: SalesVolumeMap = {};

export const DEFAULT_CHANNEL_MIX: ChannelMixConfig = {
  shopee: 45,      // 45% Doanh số kênh Shopee
  tikTokShop: 35,  // 35% Doanh số kênh TikTok Shop
  retail: 10,      // 10% Doanh số Bán lẻ Retailer
  b2b: 10,         // 10% Doanh số B2B / Đại lý / Spa
};

export const DEFAULT_CREATOR_PLAN: CreatorPlanMap = {};

export const DEFAULT_CREATOR_CAMPAIGNS: CreatorCampaign[] = [];

