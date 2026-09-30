import React, { useState, useMemo } from 'react';
import { ProductSku, ProductCategory, Sheet3CogsData, ProductQuotation } from '../types/sku';
import { ProjectParameters } from '../types/financial';
import { 
  SalesMonth, 
  SalesVolumeMap, 
  ChannelMixConfig, 
  CreatorPlanMap,
  CreatorCampaign,
  SalesPlanSubTab 
} from '../types/salesForecast';
import { DEFAULT_CREATOR_CAMPAIGNS } from '../data/defaultSalesForecast';
import { ProductPnlView } from './ProductPnlView';
import { ChannelMixView } from './ChannelMixView';
import { CreatorPlanView } from './CreatorPlanView';
import { CreateCampaignModal } from './CreateCampaignModal';
import { ProductionOrderPlanSection } from './ProductionOrderPlanSection';
import { StartMonthModal } from './StartMonthModal';
import { 
  TrendingUp, 
  PieChart, 
  Sliders, 
  Users, 
  Plus, 
  Trash2, 
  Calendar, 
  Package, 
  DollarSign, 
  Sparkles, 
  RotateCcw, 
  Search, 
  Check, 
  AlertCircle,
  HelpCircle,
  BarChart3,
  Layers,
  ArrowRight,
  Gift,
  Boxes
} from 'lucide-react';

interface SalesForecastSectionProps {
  skus: ProductSku[];
  categories: ProductCategory[];
  sheet3CogsMap: Record<string, Sheet3CogsData>;
  parameters: ProjectParameters;
  months: SalesMonth[];
  volumes: SalesVolumeMap;
  channelMix: ChannelMixConfig;
  creatorPlan: CreatorPlanMap;
  campaigns?: CreatorCampaign[];
  quotations?: ProductQuotation[];
  onUpdateSkuPrice?: (
    skuId: string, 
    channel: 'standard' | 'shopee' | 'tikTokShop' | 'retail' | 'b2b', 
    value: number
  ) => void;
  onUpdateMonths: (months: SalesMonth[]) => void;
  onUpdateVolumes: (volumes: SalesVolumeMap) => void;
  onUpdateChannelMix: (mix: ChannelMixConfig) => void;
  onUpdateCreatorPlan: (plan: CreatorPlanMap) => void;
  onUpdateCampaigns?: (campaigns: CreatorCampaign[]) => void;
  onResetToDefault: () => void;
  onClearVolumes: () => void;
}

export const SalesForecastSection: React.FC<SalesForecastSectionProps> = ({
  skus,
  categories,
  sheet3CogsMap,
  parameters,
  months,
  volumes,
  channelMix,
  creatorPlan,
  campaigns,
  quotations = [],
  onUpdateSkuPrice,
  onUpdateMonths,
  onUpdateVolumes,
  onUpdateChannelMix,
  onUpdateCreatorPlan,
  onUpdateCampaigns,
  onResetToDefault,
  onClearVolumes,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SalesPlanSubTab>('volume-matrix');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [monthToDelete, setMonthToDelete] = useState<SalesMonth | null>(null);
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState<boolean>(false);
  const [isStartMonthModalOpen, setIsStartMonthModalOpen] = useState<boolean>(false);

  // Compute starting month in MM-YY format (e.g. "01-25")
  const firstMonthMmYy = useMemo(() => {
    if (months.length === 0) return '01-25';
    const parts = months[0].dateStr.split('-');
    const y = parts[0] || '2025';
    const m = parts[1] || '01';
    return `${m}-${y.slice(2)}`;
  }, [months]);

  // Handler for setting business starting month (MM-YY)
  const handleApplyStartMonth = (startM: number, startY: number) => {
    if (months.length === 0) return;
    const oldMonths = [...months];
    const count = months.length;
    const newMonths: SalesMonth[] = [];

    for (let i = 0; i < count; i++) {
      const totalM = startM + i;
      const yearAdd = Math.floor((totalM - 1) / 12);
      const m = ((totalM - 1) % 12) + 1;
      const y = startY + yearAdd;
      const mStr = m.toString().padStart(2, '0');
      const dateStr = `${y}-${mStr}`;
      newMonths.push({
        id: dateStr,
        dateStr,
        label: `Tháng ${mStr}/${y}`,
      });
    }

    // Migrate existing sales volumes seamlessly to the new month sequence
    const newVolumes: SalesVolumeMap = {};
    for (const skuId of Object.keys(volumes)) {
      newVolumes[skuId] = {};
      for (let i = 0; i < count; i++) {
        const oldMonthId = oldMonths[i]?.id;
        const newMonthId = newMonths[i].id;
        if (oldMonthId && volumes[skuId]?.[oldMonthId] !== undefined) {
          newVolumes[skuId][newMonthId] = volumes[skuId][oldMonthId];
        }
      }
    }

    // Migrate creator campaigns monthConfigs if present
    if (onUpdateCampaigns && campaigns) {
      const updatedCampaigns = campaigns.map((camp) => {
        const newConfigs: Record<string, any> = {};
        for (let i = 0; i < count; i++) {
          const oldMonthId = oldMonths[i]?.id;
          const newMonthId = newMonths[i].id;
          if (oldMonthId && camp.monthConfigs?.[oldMonthId]) {
            newConfigs[newMonthId] = camp.monthConfigs[oldMonthId];
          }
        }
        return {
          ...camp,
          monthConfigs: newConfigs,
        };
      });
      onUpdateCampaigns(updatedCampaigns);
    }

    onUpdateMonths(newMonths);
    onUpdateVolumes(newVolumes);
  };

  // Filter SKUs based on search query
  const filteredSkus = useMemo(() => {
    if (!searchQuery.trim()) return skus;
    const q = searchQuery.toLowerCase().trim();
    return skus.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.skuCode.toLowerCase().includes(q)
    );
  }, [skus, searchQuery]);

  // Handle single volume change
  const handleVolumeChange = (skuId: string, monthId: string, rawVal: string) => {
    const num = rawVal === '' ? 0 : parseInt(rawVal, 10);
    const validNum = isNaN(num) ? 0 : Math.max(0, num);

    const currentSkuVolumes = volumes[skuId] || {};
    onUpdateVolumes({
      ...volumes,
      [skuId]: {
        ...currentSkuVolumes,
        [monthId]: validNum,
      },
    });
  };

  // Add month handler: Tự động thêm tháng tiếp theo liền kề
  const handleAddNextMonth = () => {
    let nextDateStr = '2025-01';
    if (months.length > 0) {
      const lastMonth = months[months.length - 1];
      const [yStr, mStr] = lastMonth.dateStr.split('-');
      let y = parseInt(yStr, 10);
      let m = parseInt(mStr, 10) + 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      nextDateStr = `${y}-${m.toString().padStart(2, '0')}`;
    }

    const [year, month] = nextDateStr.split('-');
    const newMonth: SalesMonth = {
      id: nextDateStr,
      dateStr: nextDateStr,
      label: `Tháng ${month}/${year}`,
    };

    onUpdateMonths([...months, newMonth]);
  };

  // Delete last month handler: Chỉ xóa được lần lượt từ sau về trước
  const handleConfirmDeleteLastMonth = () => {
    if (months.length <= 1) return;
    const lastMonth = months[months.length - 1];
    const updated = months.slice(0, -1);
    onUpdateMonths(updated);

    // Clean up volume data for that deleted month
    const newVolumes: SalesVolumeMap = {};
    for (const skuId of Object.keys(volumes)) {
      const skuMap = { ...volumes[skuId] };
      delete skuMap[lastMonth.id];
      newVolumes[skuId] = skuMap;
    }
    onUpdateVolumes(newVolumes);
    setMonthToDelete(null);
  };

  // Aggregate Metrics
  const projectSummary = useMemo(() => {
    let totalUnits = 0;
    let totalRevenue = 0;
    let totalCogs = 0;

    skus.forEach((sku) => {
      let skuUnits = 0;
      months.forEach((m) => {
        const v = volumes[sku.id]?.[m.id] || 0;
        skuUnits += v;
      });

      const revenue = skuUnits * sku.prices.standard;
      let unitCogs = sheet3CogsMap[sku.id]?.cogsPerUnit || 0;
      if (!unitCogs && sku.type === 'combo' && sku.comboItems) {
        unitCogs = sku.comboItems.reduce((acc, ci) => {
          const compCogs = sheet3CogsMap[ci.skuId]?.cogsPerUnit || 0;
          return acc + compCogs * ci.quantity;
        }, 0);
      }

      totalUnits += skuUnits;
      totalRevenue += revenue;
      totalCogs += skuUnits * unitCogs;
    });

    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const avgMonthlyUnits = months.length > 0 ? Math.round(totalUnits / months.length) : 0;

    return {
      totalUnits,
      totalRevenue,
      totalCogs,
      grossProfit,
      grossMargin,
      avgMonthlyUnits,
    };
  }, [skus, months, volumes, sheet3CogsMap]);

  // Active creator campaigns
  const activeCampaigns = useMemo(() => campaigns || DEFAULT_CREATOR_CAMPAIGNS, [campaigns]);

  // Ma trận sản lượng Sampling: Tự động link từ Kế hoạch Creator theo từng SKU và từng Tháng
  const samplingVolumes = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    skus.forEach((sku) => {
      matrix[sku.id] = {};
      months.forEach((m) => {
        matrix[sku.id][m.id] = 0;
      });
    });

    activeCampaigns.forEach((camp) => {
      camp.skuIds.forEach((skuId) => {
        if (!matrix[skuId]) matrix[skuId] = {};
        months.forEach((m) => {
          const cfg = camp.monthConfigs[m.id];
          if (cfg) {
            const perSkuSamples =
              (cfg.ugcCount || 0) * (cfg.ugcSamplesPerSku ?? 1) +
              (cfg.kocCount || 0) * (cfg.kocSamplesPerSku ?? 5) +
              (cfg.kolCount || 0) * (cfg.kolSamplesPerSku ?? 10);
            matrix[skuId][m.id] = (matrix[skuId][m.id] || 0) + perSkuSamples;
          }
        });
      });
    });

    return matrix;
  }, [skus, months, activeCampaigns]);

  // 1. Tập hợp các SKU ID có trong các chiến dịch Creator
  const campaignSkuIdSet = useMemo(() => {
    const ids = new Set<string>();
    activeCampaigns.forEach((camp) => {
      camp.skuIds?.forEach((id) => ids.add(id));
    });
    return ids;
  }, [activeCampaigns]);

  // 2. Danh sách SKU hiển thị trong Bảng Sampling: Chỉ hiển thị sản phẩm có trong các chiến dịch Creator
  const samplingSkus = useMemo(() => {
    return filteredSkus.filter((sku) => campaignSkuIdSet.has(sku.id));
  }, [filteredSkus, campaignSkuIdSet]);

  // Tổng hợp dữ liệu Sampling toàn kỳ: Tính giá trị sampling theo GIÁ VỐN HÀNG BÁN (COGS)
  const samplingSummary = useMemo(() => {
    let totalSamplingUnits = 0;
    let totalSamplingValue = 0;

    samplingSkus.forEach((sku) => {
      let unitCogs = sheet3CogsMap[sku.id]?.cogsPerUnit || 0;
      if (!unitCogs && sku.type === 'combo' && sku.comboItems) {
        unitCogs = sku.comboItems.reduce((acc, ci) => {
          const compCogs = sheet3CogsMap[ci.skuId]?.cogsPerUnit || 0;
          return acc + compCogs * ci.quantity;
        }, 0);
      }

      months.forEach((m) => {
        const u = samplingVolumes[sku.id]?.[m.id] || 0;
        totalSamplingUnits += u;
        totalSamplingValue += u * unitCogs;
      });
    });

    return {
      totalSamplingUnits,
      totalSamplingValue,
    };
  }, [samplingSkus, months, samplingVolumes, sheet3CogsMap]);

  // 3. Phân loại SKU Đơn lẻ và SKU Combo
  const singleSkus = useMemo(() => skus.filter((s) => s.type !== 'combo'), [skus]);
  const comboSkus = useMemo(() => skus.filter((s) => s.type === 'combo'), [skus]);

  // 4. Ma trận sản xuất chi tiết cho TỪNG SẢN PHẨM ĐƠN LẺ:
  // Tự động bóc tách và cộng dồn từ Hàng Bán (Bảng 1) và Hàng Sampling (Bảng 2) bao gồm:
  // - Hàng bán trực tiếp + Hàng bán từ các Combo có chứa SKU này
  // - Hàng sampling trực tiếp + Hàng sampling từ các Combo có chứa SKU này
  const singleSkuProductionMatrix = useMemo(() => {
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

        // Hàng bán từ các Combo có chứa SKU này (Số combo * Số lượng thành phần)
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

        // Hàng sampling từ các Combo có chứa SKU này (Số combo sampling * Số lượng thành phần)
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

        totalDirectSales += directSales;
        totalComboSales += comboSales;
        totalDirectSampling += directSampling;
        totalComboSampling += comboSampling;

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

    return matrix;
  }, [singleSkus, comboSkus, months, volumes, samplingVolumes, sheet3CogsMap]);

  // 5. Danh sách SKU đơn lẻ hiển thị trong Bảng Tổng Sản Xuất (loại bỏ combo, kết hợp lọc tìm kiếm)
  const productionSkus = useMemo(() => {
    return filteredSkus.filter((s) => s.type !== 'combo');
  }, [filteredSkus]);

  // 6. Tổng hợp sản lượng sản xuất (Hàng Bán + Sampling) quy về sản phẩm đơn lẻ & Giá vốn COGS
  const productionSummary = useMemo(() => {
    let totalProductionUnits = 0;
    let totalProductionCost = 0;

    const monthlyTotals: Record<string, { units: number; cost: number }> = {};
    months.forEach((m) => {
      monthlyTotals[m.id] = { units: 0, cost: 0 };
    });

    singleSkus.forEach((sku) => {
      const data = singleSkuProductionMatrix[sku.id];
      if (data) {
        totalProductionUnits += data.totalProduction;
        totalProductionCost += data.totalCost;

        months.forEach((m) => {
          const mData = data.months[m.id];
          if (mData) {
            monthlyTotals[m.id].units += mData.totalProduction;
            monthlyTotals[m.id].cost += mData.cost;
          }
        });
      }
    });

    return {
      totalProductionUnits,
      totalProductionCost,
      monthlyTotals,
    };
  }, [singleSkus, singleSkuProductionMatrix, months]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title for Tab 4 */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kế Hoạch Bán Hàng &amp; Dự Báo Sản Lượng</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Space_Grotesk']">
              Kế Hoạch Bán Hàng &amp; Dự Báo Doanh Thu
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Hoạch định sản lượng hàng bán, sản lượng sampling và tổng sản lượng sản xuất theo từng tháng cho toàn bộ danh mục SKU.
            </p>
          </div>

          <div className="shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:max-w-md">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 lg:text-right">
              Thao tác kế hoạch (Sub-actions):
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <button
                onClick={handleAddNextMonth}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Tháng Tiếp Theo</span>
              </button>

              <button
                onClick={onResetToDefault}
                title="Khôi phục kế hoạch bán hàng mặc định 6 tháng"
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Nạp Kế Hoạch Mẫu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-header Buttons Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1">
            {/* Nút 1: Kế Hoạch Sản Lượng Bán (Ma trận cột) */}
            <button
              onClick={() => setActiveSubTab('volume-matrix')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'volume-matrix'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dự Báo Sản Lượng Hàng Bán</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeSubTab === 'volume-matrix' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-slate-700'
              }`}>
                {months.length} tháng
              </span>
            </button>

            {/* Nút 2: P&L Sản Phẩm (Sub-header yêu cầu) */}
            <button
              onClick={() => setActiveSubTab('product-pnl')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'product-pnl'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>P&amp;L Sản Phẩm</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeSubTab === 'product-pnl' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-slate-700'
              }`}>
                Unit Economics
              </span>
            </button>

            {/* Nút 3: Tỷ trọng kênh bán hàng (Sub-header yêu cầu) */}
            <button
              onClick={() => setActiveSubTab('channel-mix')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'channel-mix'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Tỷ Trọng Kênh Bán Hàng</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeSubTab === 'channel-mix' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-slate-700'
              }`}>
                4 kênh
              </span>
            </button>

            {/* Nút 4: Kế hoạch Creator (Sub-header yêu cầu) */}
            <button
              onClick={() => setActiveSubTab('creator-plan')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'creator-plan'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kế Hoạch Creator</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeSubTab === 'creator-plan' ? 'bg-slate-800 text-purple-400' : 'bg-slate-200 text-slate-700'
              }`}>
                {activeCampaigns.length} chiến dịch
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 font-mono">
            <span>Hàng Bán: <strong className="text-slate-900">{projectSummary.totalUnits.toLocaleString('vi-VN')} sp</strong></span>
            <span>•</span>
            <span>Sampling: <strong className="text-purple-700">{samplingSummary.totalSamplingUnits.toLocaleString('vi-VN')} sp</strong></span>
            <span>•</span>
            <span>Tổng SX: <strong className="text-blue-700">{productionSummary.totalProductionUnits.toLocaleString('vi-VN')} sp</strong></span>
            <span>•</span>
            <span>Doanh Thu: <strong className="text-emerald-700">{projectSummary.totalRevenue.toLocaleString('vi-VN')} đ</strong></span>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: KẾ HOẠCH SẢN LƯỢNG BÁN (MA TRẬN HÀNG NGANG) */}
      {activeSubTab === 'volume-matrix' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm mã SKU, tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 text-slate-800"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs">
              {/* Nút thiết lập tháng bắt đầu kinh doanh (định dạng MM-YY) */}
              <button
                onClick={() => setIsStartMonthModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Thiết lập tháng bắt đầu kinh doanh (định dạng MM-YY)"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tháng bắt đầu: <strong className="font-mono text-emerald-700">{firstMonthMmYy}</strong></span>
              </button>
              <button
                onClick={onClearVolumes}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer"
              >
                Xóa Trắng Sản Lượng
              </button>
              {months.length > 1 && (
                <button
                  onClick={() => setMonthToDelete(months[months.length - 1])}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={`Xóa lùi tháng cuối (${months[months.length - 1].label})`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Cột Cuối ({months[months.length - 1].label})</span>
                </button>
              )}
              <button
                onClick={handleAddNextMonth}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Tháng Tiếp Theo</span>
              </button>
            </div>
          </div>

          {/* MAIN TABLE: DỰ BÁO SẢN LƯỢNG HÀNG BÁN */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            {/* Tiêu đề Bảng theo yêu cầu chuẩn của Người dùng */}
            <div className="px-4 py-3 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                <h3 className="font-bold text-slate-900 text-sm tracking-wide font-['Space_Grotesk'] uppercase">
                  DỰ BÁO SẢN LƯỢNG HÀNG BÁN
                </h3>
                <span className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                  {months.length} tháng ({months[0]?.dateStr || ''} → {months[months.length - 1]?.dateStr || ''})
                </span>
              </div>
              <div className="text-[11px] text-slate-500 italic">
                * Thêm cột tự động tính tháng tiếp theo • Chỉ xóa lùi từ sau về trước
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    {/* Cột 1: Mã SKU */}
                    <th className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                      Mã SKU
                    </th>

                    {/* Cột 2: Tên Sản Phẩm */}
                    <th className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                      Tên Sản Phẩm
                    </th>

                    {/* Cột 3: CỘT TỔNG CỘNG (Nằm kế cột tên sản phẩm theo yêu cầu user) */}
                    <th className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] bg-emerald-50 text-emerald-900 border-x border-emerald-200 sticky left-[360px] z-30 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold flex items-center gap-1 text-xs">
                          Tổng Cộng Toàn Kỳ
                        </span>
                        <span className="text-[10px] text-emerald-700 font-normal">
                          (Sản lượng &amp; Doanh thu)
                        </span>
                      </div>
                    </th>

                    {/* Cột 4+: CÁC CỘT THÁNG/NĂM (Có thêm/xoá, tự nhập liệu sản lượng bán) */}
                    {months.map((m, index) => {
                      const isLastMonth = index === months.length - 1;

                      return (
                        <th
                          key={m.id}
                          className="py-3 px-3 min-w-[110px] text-center border-r border-slate-200 whitespace-nowrap group relative bg-slate-50"
                        >
                          <div className="flex items-center justify-between gap-1 px-1">
                            <span className="font-mono font-bold text-slate-800 text-[11px]">
                              {m.label}
                            </span>
                            {/* Nút Xóa Cột Tháng: Chỉ cột cuối cùng mới có nút xóa theo logic từ sau về trước */}
                            {isLastMonth && months.length > 1 && (
                              <button
                                onClick={() => setMonthToDelete(m)}
                                title={`Xóa lùi cột ${m.label}`}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 font-mono">
                            {m.dateStr}
                          </div>
                        </th>
                      );
                    })}

                    {/* Cột Action: Thêm Tháng Tự Động */}
                    <th className="py-3 px-4 min-w-[110px] text-center bg-slate-50 whitespace-nowrap">
                      <button
                        onClick={handleAddNextMonth}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                        title="Tự động thêm tháng tiếp theo trong năm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Thêm Tháng</span>
                      </button>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSkus.map((sku) => {
                    // Compute row total volume
                    const rowTotalVolume = months.reduce((sum, m) => {
                      const v = volumes[sku.id]?.[m.id];
                      return sum + (typeof v === 'number' ? v : 0);
                    }, 0);

                    const rowRevenue = rowTotalVolume * sku.prices.standard;

                    return (
                      <tr key={sku.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Cột 1: Mã SKU */}
                        <td className="py-2.5 px-3.5 w-[110px] min-w-[110px] max-w-[110px] font-mono font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {sku.skuCode}
                          </span>
                        </td>

                        {/* Cột 2: Tên Sản Phẩm: Chỉ cần tên Sản phẩm, bên dưới dòng chữ nhỏ là giá bán niêm yết */}
                        <td className="py-2.5 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                          <div className="font-semibold text-slate-800 line-clamp-1 text-xs" title={sku.name}>
                            {sku.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {sku.prices.standard.toLocaleString('vi-VN')} đ
                          </div>
                        </td>

                        {/* Cột 3: CỘT TỔNG CỘNG (Kế cột tên sản phẩm) */}
                        <td className="py-2.5 px-3.5 w-[160px] min-w-[160px] max-w-[160px] bg-emerald-50/90 border-x border-emerald-200 sticky left-[360px] z-10 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {rowTotalVolume.toLocaleString('vi-VN')} <span className="text-[10px] text-slate-500 font-normal">sp</span>
                          </div>
                          <div className="font-mono text-[11px] text-emerald-800 font-semibold mt-0.5">
                            {rowRevenue.toLocaleString('vi-VN')} đ
                          </div>
                        </td>

                        {/* Cột 4+: Các cột Tháng/Năm nhập liệu sản lượng */}
                        {months.map((m) => {
                          const currentVal = volumes[sku.id]?.[m.id];
                          const displayVal = currentVal !== undefined ? currentVal : '';

                          return (
                            <td
                              key={m.id}
                              className="py-2 px-2.5 border-r border-slate-100 text-center bg-white"
                            >
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={displayVal}
                                  onChange={(e) => handleVolumeChange(sku.id, m.id, e.target.value)}
                                  className="w-22 text-right px-2 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                                />
                              </div>
                            </td>
                          );
                        })}

                        {/* Spacer column */}
                        <td className="py-2.5 px-4 bg-slate-50/30"></td>
                      </tr>
                    );
                  })}
                  {skus.length === 0 && (
                    <tr>
                      <td colSpan={months.length + 4} className="py-10 text-center text-slate-500 bg-white">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <Package className="w-7 h-7 text-slate-300" />
                          <span className="font-medium text-slate-700">Chưa có sản phẩm SKU nào trong kế hoạch bán hàng</span>
                          <span className="text-[11px] text-slate-400">Vui lòng tạo sản phẩm ở Tab "2. Danh Mục Sản Phẩm" để bắt đầu dự báo sản lượng</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* HÀNG TỔNG CỘNG CUỐI BẢNG */}
                <tfoot>
                  {/* Row 1: Tổng Sản Lượng Bán (sp) */}
                  <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                    <td className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-slate-100 z-20 shadow-[1px_0_0_0_#cbd5e1] whitespace-nowrap text-slate-900 font-bold">
                      TỔNG SẢN LƯỢNG
                    </td>
                    <td className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-slate-100 z-20 shadow-[1px_0_0_0_#cbd5e1]"></td>
                    {/* Cột Tổng Cộng Toàn Kỳ */}
                    <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-emerald-100 border-x border-emerald-300 font-mono text-emerald-950 font-bold shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs whitespace-nowrap">
                      {projectSummary.totalUnits.toLocaleString('vi-VN')} sp
                    </td>
                    {/* Tổng từng tháng */}
                    {months.map((m) => {
                      const monthUnits = skus.reduce((sum, sku) => {
                        const v = volumes[sku.id]?.[m.id] || 0;
                        return sum + v;
                      }, 0);
                      return (
                        <td key={m.id} className="py-3 px-3 text-right font-mono text-slate-900 border-r border-slate-200 whitespace-nowrap font-bold bg-slate-50">
                          {monthUnits.toLocaleString('vi-VN')}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 bg-slate-50"></td>
                  </tr>

                  {/* Row 2: Tổng Doanh Thu Kế Hoạch (VNĐ) */}
                  <tr className="bg-emerald-50/50 border-t border-slate-200 text-xs text-slate-900">
                    <td className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-emerald-100/90 z-20 shadow-[1px_0_0_0_#cbd5e1] font-bold text-emerald-950 whitespace-nowrap">
                      DOANH THU
                    </td>
                    <td className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-emerald-100/90 z-20 shadow-[1px_0_0_0_#cbd5e1]"></td>
                    {/* Cột Tổng Cộng Toàn Kỳ */}
                    <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-emerald-200/90 border-x border-emerald-300 font-mono font-extrabold text-emerald-950 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs whitespace-nowrap">
                      {projectSummary.totalRevenue.toLocaleString('vi-VN')} đ
                    </td>
                    {/* Tổng doanh thu từng tháng */}
                    {months.map((m) => {
                      const monthRev = skus.reduce((sum, sku) => {
                        const v = volumes[sku.id]?.[m.id] || 0;
                        return sum + v * sku.prices.standard;
                      }, 0);
                      return (
                        <td key={m.id} className="py-3 px-3 text-right font-mono font-bold text-emerald-800 border-r border-slate-200 whitespace-nowrap bg-emerald-50/50">
                          {monthRev.toLocaleString('vi-VN')}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 bg-emerald-50/50"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* BẢNG 2: DỰ BÁO SẢN LƯỢNG HÀNG SAMPLING */}
          <div className="rounded-xl bg-white border border-purple-200/80 shadow-xs overflow-hidden mt-6">
            {/* Header Banner Bảng Sampling */}
            <div className="px-4 py-3 bg-gradient-to-r from-purple-50/90 via-slate-50 to-white border-b border-purple-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                <h3 className="font-bold text-slate-900 text-sm tracking-wide font-['Space_Grotesk'] uppercase">
                  DỰ BÁO SẢN LƯỢNG HÀNG SAMPLING
                </h3>
                <span className="text-[11px] text-purple-700 bg-purple-100/70 border border-purple-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  {samplingSkus.length} sản phẩm • Giá trị tính theo Giá vốn hàng bán (COGS)
                </span>
                <span className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                  {months.length} tháng ({months[0]?.dateStr || ''} → {months[months.length - 1]?.dateStr || ''})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateCampaignModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  title="Tạo chiến dịch Creator mới cho bảng sampling"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Chiến Dịch Mới</span>
                </button>
                <button
                  onClick={() => setActiveSubTab('creator-plan')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 text-xs font-semibold border border-purple-200 transition-colors cursor-pointer shadow-2xs"
                  title="Mở tab Kế hoạch Creator để xem chi tiết và quản lý chiến dịch"
                >
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Quản Lý Chiến Dịch ({activeCampaigns.length})</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse table-auto">
                <thead>
                  <tr className="bg-purple-50/40 border-b border-slate-200 text-slate-700 font-semibold">
                    {/* Cột 1: Mã SKU */}
                    <th className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                      Mã SKU
                    </th>

                    {/* Cột 2: Tên Sản Phẩm */}
                    <th className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                      Tên Sản Phẩm
                    </th>

                    {/* Cột 3: CỘT TỔNG CỘNG SAMPLING */}
                    <th className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] bg-purple-100/70 text-purple-950 border-x border-purple-200 sticky left-[360px] z-30 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold flex items-center gap-1 text-xs">
                          Tổng Sampling Toàn Kỳ
                        </span>
                        <span className="text-[10px] text-purple-700 font-normal">
                          (Số lượng &amp; Giá trị vốn)
                        </span>
                      </div>
                    </th>

                    {/* Cột 4+: CÁC CỘT THÁNG (Tự động đồng bộ theo Bảng 1) */}
                    {months.map((m) => (
                      <th
                        key={m.id}
                        className="py-3 px-3 min-w-[110px] text-center border-r border-slate-200 whitespace-nowrap bg-purple-50/30"
                      >
                        <div className="font-mono font-bold text-slate-800 text-[11px]">
                          {m.label}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 font-mono">
                          {m.dateStr}
                        </div>
                      </th>
                    ))}

                    <th className="py-3 px-4 min-w-[110px] text-center bg-purple-50/20 whitespace-nowrap">
                      <span className="text-[10px] text-purple-700 font-medium">Nguồn liên kết</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {samplingSkus.length === 0 ? (
                    <tr>
                      <td colSpan={months.length + 4} className="py-8 text-center bg-purple-50/20">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Gift className="w-8 h-8 text-purple-300" />
                          <p className="font-semibold text-slate-700 text-xs">
                            Không có sản phẩm nào trong các chiến dịch Creator
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-md">
                            Chỉ các sản phẩm được chọn khi cấu hình chiến dịch Creator mới được hiển thị tại bảng Sampling này.
                          </p>
                          <button
                            onClick={() => setIsCreateCampaignModalOpen(true)}
                            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tạo Chiến Dịch Mới</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    samplingSkus.map((sku) => {
                      let unitCogs = sheet3CogsMap[sku.id]?.cogsPerUnit || 0;
                      if (!unitCogs && sku.type === 'combo' && sku.comboItems) {
                        unitCogs = sku.comboItems.reduce((acc, ci) => {
                          const compCogs = sheet3CogsMap[ci.skuId]?.cogsPerUnit || 0;
                          return acc + compCogs * ci.quantity;
                        }, 0);
                      }
                      const rowTotalSampling = months.reduce((sum, m) => {
                        return sum + (samplingVolumes[sku.id]?.[m.id] || 0);
                      }, 0);
                      const rowSamplingValue = rowTotalSampling * unitCogs;

                      return (
                        <tr key={sku.id} className="hover:bg-purple-50/30 transition-colors">
                          {/* Cột 1: Mã SKU */}
                          <td className="py-2.5 px-3.5 w-[110px] min-w-[110px] max-w-[110px] font-mono font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-[11px] text-purple-900">
                              {sku.skuCode}
                            </span>
                          </td>

                          {/* Cột 2: Tên Sản Phẩm */}
                          <td className="py-2.5 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                            <div className="font-semibold text-slate-900 truncate" title={sku.name}>
                              {sku.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Giá vốn (COGS): {unitCogs.toLocaleString('vi-VN')} đ
                            </div>
                          </td>

                          {/* Cột 3: Tổng Cộng Sampling */}
                          <td className="py-2.5 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-purple-50/90 border-x border-purple-200 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap">
                            <div className="font-mono font-bold text-purple-950 text-xs">
                              {rowTotalSampling.toLocaleString('vi-VN')} sp
                            </div>
                            <div className="text-[10px] text-purple-700 font-mono" title="Giá trị Sampling tính theo Giá vốn hàng bán (COGS)">
                              {rowSamplingValue.toLocaleString('vi-VN')} đ
                            </div>
                          </td>

                          {/* Cột 4+: Các tháng sampling */}
                          {months.map((m) => {
                            const sUnits = samplingVolumes[sku.id]?.[m.id] || 0;
                            return (
                              <td key={m.id} className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                                {sUnits > 0 ? (
                                  <span className="inline-block px-2 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-800 font-bold font-mono text-xs shadow-2xs">
                                    {sUnits.toLocaleString('vi-VN')}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-mono">-</span>
                                )}
                              </td>
                            );
                          })}

                          <td className="py-2 px-4 text-center whitespace-nowrap">
                            <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                              Creator Campaign
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Footer Bảng 2: TỔNG SẢN LƯỢNG SAMPLING & GIÁ TRỊ */}
                <tfoot className="border-t-2 border-slate-300">
                  <tr className="bg-purple-100/50 text-xs text-purple-950 font-bold">
                    <td className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-purple-100 z-20 shadow-[1px_0_0_0_#cbd5e1] whitespace-nowrap">
                      TỔNG SAMPLING
                    </td>
                    <td className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-purple-100 z-20 shadow-[1px_0_0_0_#cbd5e1]"></td>
                    <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-purple-200/90 border-x border-purple-300 font-mono text-purple-950 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs whitespace-nowrap">
                      {samplingSummary.totalSamplingUnits.toLocaleString('vi-VN')} sp
                    </td>
                    {months.map((m) => {
                      const mUnits = samplingSkus.reduce((sum, s) => sum + (samplingVolumes[s.id]?.[m.id] || 0), 0);
                      return (
                        <td key={m.id} className="py-3 px-3 text-center font-mono font-bold text-purple-900 border-r border-slate-200 whitespace-nowrap bg-purple-50/40">
                          {mUnits > 0 ? mUnits.toLocaleString('vi-VN') : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 bg-purple-50/40"></td>
                  </tr>

                  <tr className="bg-purple-50 border-t border-purple-200 text-xs text-purple-900">
                    <td className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-purple-100/80 z-20 shadow-[1px_0_0_0_#cbd5e1] font-bold whitespace-nowrap">
                      GIÁ TRỊ SAMPLING (GIÁ VỐN)
                    </td>
                    <td className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-purple-100/80 z-20 shadow-[1px_0_0_0_#cbd5e1]"></td>
                    <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-purple-200 border-x border-purple-300 font-mono font-bold text-purple-950 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs whitespace-nowrap">
                      {samplingSummary.totalSamplingValue.toLocaleString('vi-VN')} đ
                    </td>
                    {months.map((m) => {
                      const mVal = samplingSkus.reduce((sum, s) => {
                        let uCogs = sheet3CogsMap[s.id]?.cogsPerUnit || 0;
                        if (!uCogs && s.type === 'combo' && s.comboItems) {
                          uCogs = s.comboItems.reduce((acc, ci) => {
                            const compCogs = sheet3CogsMap[ci.skuId]?.cogsPerUnit || 0;
                            return acc + compCogs * ci.quantity;
                          }, 0);
                        }
                        return sum + (samplingVolumes[s.id]?.[m.id] || 0) * uCogs;
                      }, 0);
                      return (
                        <td key={m.id} className="py-3 px-3 text-right font-mono font-semibold text-purple-900 border-r border-slate-200 whitespace-nowrap bg-purple-50/30">
                          {mVal > 0 ? mVal.toLocaleString('vi-VN') : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 bg-purple-50/30"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* BẢNG 3: DỰ BÁO TỔNG LƯỢNG SẢN XUẤT (Sản phẩm đơn lẻ - Tự động bóc tách Combo) */}
          <div className="rounded-xl bg-white border border-blue-200/80 shadow-xs overflow-hidden mt-6">
            {/* Header Banner Bảng Tổng Sản Xuất */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50/90 via-slate-50 to-white border-b border-blue-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                <h3 className="font-bold text-slate-900 text-sm tracking-wide font-['Space_Grotesk'] uppercase">
                  DỰ BÁO TỔNG LƯỢNG SẢN XUẤT (SẢN PHẨM ĐƠN LẺ)
                </h3>
                <span className="text-[11px] text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-600" />
                  Chỉ {productionSkus.length} SKU đơn lẻ • Quy đổi từ Bán &amp; Sampling • Giá vốn tính theo COGS
                </span>
                <span className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                  {months.length} tháng ({months[0]?.dateStr || ''} → {months[months.length - 1]?.dateStr || ''})
                </span>
              </div>

              <div className="text-[11px] text-slate-500 italic">
                * Quy đổi toàn bộ combo thành sản phẩm đơn lẻ thực tế cho Nhà máy &amp; Đặt hàng PO
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse table-auto">
                <thead>
                  <tr className="bg-blue-50/40 border-b border-slate-200 text-slate-700 font-semibold">
                    {/* Cột 1: Mã SKU */}
                    <th className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                      Mã SKU
                    </th>

                    {/* Cột 2: Tên Sản Phẩm */}
                    <th className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                      Tên Sản Phẩm
                    </th>

                    {/* Cột 3: CỘT TỔNG SẢN XUẤT */}
                    <th className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] bg-blue-100/70 text-blue-950 border-x border-blue-200 sticky left-[360px] z-30 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold flex items-center gap-1 text-xs">
                          Tổng Sản Xuất Toàn Kỳ
                        </span>
                        <span className="text-[10px] text-blue-700 font-normal">
                          (Sản lượng sản xuất)
                        </span>
                      </div>
                    </th>

                    {/* Cột 4+: CÁC CỘT THÁNG */}
                    {months.map((m) => (
                      <th
                        key={m.id}
                        className="py-3 px-3 min-w-[110px] text-center border-r border-slate-200 whitespace-nowrap bg-blue-50/30"
                      >
                        <div className="font-mono font-bold text-slate-800 text-[11px]">
                          {m.label}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 font-mono">
                          {m.dateStr}
                        </div>
                      </th>
                    ))}

                    <th className="py-3 px-4 min-w-[100px] text-center bg-blue-50/20 whitespace-nowrap">
                      <span className="text-[10px] text-blue-700 font-medium">Ghi chú</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {productionSkus.length === 0 ? (
                    <tr>
                      <td colSpan={months.length + 4} className="py-8 text-center bg-blue-50/20">
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <Boxes className="w-8 h-8 text-blue-300" />
                          <p className="font-semibold text-slate-700 text-xs">
                            Không có sản phẩm đơn lẻ nào để hiển thị
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Bảng Tổng Lượng Sản Xuất chỉ hiển thị các sản phẩm đơn chiếc (không bao gồm combo).
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    productionSkus.map((sku) => {
                      const rowData = singleSkuProductionMatrix[sku.id];
                      const unitCogs = rowData?.unitCogs || 0;
                      const rowTotalProd = rowData?.totalProduction || 0;

                      return (
                        <tr key={sku.id} className="hover:bg-blue-50/30 transition-colors">
                          {/* Cột 1: Mã SKU */}
                          <td className="py-2.5 px-3.5 w-[110px] min-w-[110px] max-w-[110px] font-mono font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
                              {sku.skuCode}
                            </span>
                          </td>

                          {/* Cột 2: Tên Sản Phẩm */}
                          <td className="py-2.5 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                            <div className="font-semibold text-slate-900 truncate" title={sku.name}>
                              {sku.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Giá vốn (COGS): <span className="text-blue-700 font-medium">{unitCogs.toLocaleString('vi-VN')} đ</span>
                            </div>
                          </td>

                          {/* Cột 3: Tổng Sản Xuất Toàn Kỳ */}
                          <td className="py-2.5 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-blue-50/90 border-x border-blue-200 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap text-center">
                            <span className="font-mono font-bold text-blue-950 text-xs">
                              {rowTotalProd.toLocaleString('vi-VN')} sp
                            </span>
                          </td>

                          {/* Cột 4+: Các tháng sản xuất */}
                          {months.map((m) => {
                            const total = rowData?.months[m.id]?.totalProduction || 0;

                            return (
                              <td key={m.id} className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                                {total > 0 ? (
                                  <span className="font-bold text-slate-900 font-mono text-xs">
                                    {total.toLocaleString('vi-VN')}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-mono">-</span>
                                )}
                              </td>
                            );
                          })}

                          <td className="py-2 px-4 text-center whitespace-nowrap">
                            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              Lô sản xuất PO
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Footer Bảng 3: TỔNG LƯỢNG SẢN XUẤT & TỔNG GIÁ VỐN */}
                <tfoot className="border-t-2 border-slate-300">
                  <tr className="bg-blue-100/60 text-xs text-blue-950 font-bold">
                    <td className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-blue-100 z-20 shadow-[1px_0_0_0_#cbd5e1] whitespace-nowrap">
                      TỔNG SẢN XUẤT
                    </td>
                    <td className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-blue-100 z-20 shadow-[1px_0_0_0_#cbd5e1]"></td>
                    <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-blue-200/90 border-x border-blue-300 font-mono text-blue-950 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs whitespace-nowrap">
                      {productionSummary.totalProductionUnits.toLocaleString('vi-VN')} sp
                    </td>
                    {months.map((m) => {
                      const mProd = productionSummary.monthlyTotals[m.id]?.units || 0;
                      return (
                        <td key={m.id} className="py-3 px-3 text-center font-mono font-bold text-blue-900 border-r border-slate-200 whitespace-nowrap bg-blue-50/40">
                          {mProd > 0 ? mProd.toLocaleString('vi-VN') : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 bg-blue-50/40"></td>
                  </tr>

                  <tr className="bg-blue-50 border-t border-blue-200 text-xs text-blue-900">
                    <td className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-blue-100/80 z-20 shadow-[1px_0_0_0_#cbd5e1] font-bold whitespace-nowrap">
                      GIÁ VỐN DỰ KIẾN (COGS)
                    </td>
                    <td className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-blue-100/80 z-20 shadow-[1px_0_0_0_#cbd5e1]"></td>
                    <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-blue-200 border-x border-blue-300 font-mono font-bold text-blue-950 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs whitespace-nowrap">
                      {productionSummary.totalProductionCost.toLocaleString('vi-VN')} đ
                    </td>
                    {months.map((m) => {
                      const mCogs = productionSummary.monthlyTotals[m.id]?.cost || 0;
                      return (
                        <td key={m.id} className="py-3 px-3 text-right font-mono font-semibold text-blue-900 border-r border-slate-200 whitespace-nowrap bg-blue-50/30">
                          {mCogs > 0 ? mCogs.toLocaleString('vi-VN') : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 bg-blue-50/30"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* BẢNG 4: KẾ HOẠCH PO ĐỀ XUẤT ĐẶT HÀNG (Căn cứ Tổng lượng SX, Phương án đã chốt & Lead-time) */}
          <ProductionOrderPlanSection
            productionSkus={productionSkus}
            months={months}
            singleSkuProductionMatrix={singleSkuProductionMatrix}
            sheet3CogsMap={sheet3CogsMap}
            quotations={quotations}
            parameters={parameters}
          />

          {/* Practical guide notes */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Cơ chế tích hợp tài chính thời gian thực:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
              <li>
                <strong>Cột Tổng Cộng:</strong> Tự động tính tổng sản lượng bán cho từng SKU theo hàng ngang ngay bên cạnh tên sản phẩm và mã SKU.
              </li>
              <li>
                <strong>Liên kết Giá Vốn COGS:</strong> Dữ liệu giá vốn lấy trực tiếp từ các phương án báo giá đã chốt tại Tab 3 (Sheet 3) để tính tổng giá vốn theo tháng.
              </li>
              <li>
                <strong>Thêm/Xóa Cột Tháng:</strong> Bấm <em>+ Thêm Tháng Tiếp Theo</em> để tự động sinh tháng tiếp theo trong năm. Hệ thống chỉ cho phép xóa lùi từ sau về trước (tại cột tháng cuối cùng) để đảm bảo chuỗi thời gian liên tục.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: P&L SẢN PHẨM */}
      {activeSubTab === 'product-pnl' && (
        <ProductPnlView
          skus={skus}
          categories={categories}
          months={months}
          volumes={volumes}
          sheet3CogsMap={sheet3CogsMap}
          parameters={parameters}
          quotations={quotations}
          onUpdateSkuPrice={onUpdateSkuPrice}
        />
      )}

      {/* SUB-VIEW 3: TỶ TRỌNG KÊNH BÁN HÀNG */}
      {activeSubTab === 'channel-mix' && (
        <ChannelMixView
          skus={skus}
          months={months}
          volumes={volumes}
          channelMix={channelMix}
          onChangeChannelMix={onUpdateChannelMix}
          parameters={parameters}
        />
      )}

      {/* SUB-VIEW 4: KẾ HOẠCH CREATOR */}
      {activeSubTab === 'creator-plan' && (
        <CreatorPlanView
          skus={skus}
          months={months}
          campaigns={activeCampaigns}
          onChangeCampaigns={(newCampaigns) => {
            if (onUpdateCampaigns) {
              onUpdateCampaigns(newCampaigns);
            }
          }}
          parameters={parameters}
        />
      )}

      {/* Confirm Delete Month Modal: Chỉ xóa được lần lượt từ sau về trước */}
      {monthToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 text-rose-600 mb-3">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-900">Xóa Cột Cuối {monthToDelete.label}?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa cột <strong className="text-slate-900">{monthToDelete.label} ({monthToDelete.dateStr})</strong> khỏi kế hoạch bán hàng? (Hệ thống thực hiện xóa lần lượt từ sau về trước để đảm bảo tính liên tục của chuỗi thời gian).
            </p>
            <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setMonthToDelete(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteLastMonth}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal directly accessible from Forecast section */}
      <CreateCampaignModal
        isOpen={isCreateCampaignModalOpen}
        onClose={() => setIsCreateCampaignModalOpen(false)}
        onSave={(newCamp) => {
          if (onUpdateCampaigns) {
            onUpdateCampaigns([...activeCampaigns, newCamp]);
          }
          setIsCreateCampaignModalOpen(false);
        }}
        editingCampaign={null}
        skus={skus}
        months={months}
        parameters={parameters}
      />

      {/* Modal thiết lập tháng bắt đầu kinh doanh (định dạng MM-YY) */}
      <StartMonthModal
        isOpen={isStartMonthModalOpen}
        onClose={() => setIsStartMonthModalOpen(false)}
        currentMonths={months}
        onApplyStartMonth={handleApplyStartMonth}
      />
    </div>
  );
};
