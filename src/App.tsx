import React, { useState, useEffect } from 'react';
import { getDefaultProject, saveProject } from './api/projectApi';
import { ProjectParameters, TabId, TabDefinition } from './types/financial';
import { ProductCategory, ProductSku, Sheet3CogsData, Supplier, ProductQuotation } from './types/sku';
import { DEFAULT_PROJECT_PARAMETERS, PROJECT_TABS } from './data/defaultFinancialConfig';
import { 
  DEFAULT_PRODUCT_CATEGORIES, 
  DEFAULT_PRODUCT_SKUS, 
  DEFAULT_SHEET3_COGS_DATA,
  DEFAULT_SUPPLIERS
} from './data/defaultSkuCatalog';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { KPIHighlights } from './components/KPIHighlights';
import { TaxAndCapitalSection } from './components/TaxAndCapitalSection';
import { SettlementCycleSection } from './components/SettlementCycleSection';
import { LeadTimeMarketingSection } from './components/LeadTimeMarketingSection';
import { D2CFeesSection } from './components/D2CFeesSection';
import { PlatformFeesSection } from './components/PlatformFeesSection';
import { CreatorMatrixSection } from './components/CreatorMatrixSection';
import { CFOSimulatorWidget } from './components/CFOSimulatorWidget';
import { SkuCatalogSection } from './components/SkuCatalogSection';
import { Sheet3CogsSection } from './components/Sheet3CogsSection';
import { SalesForecastSection } from './components/SalesForecastSection';
import { UpcomingTabModal } from './components/UpcomingTabModal';
import { SalesMonth, SalesVolumeMap, ChannelMixConfig, CreatorPlanMap, CreatorCampaign } from './types/salesForecast';
import { 
  DEFAULT_SALES_MONTHS, 
  DEFAULT_SALES_VOLUMES, 
  DEFAULT_CHANNEL_MIX, 
  DEFAULT_CREATOR_PLAN,
  DEFAULT_CREATOR_CAMPAIGNS
} from './data/defaultSalesForecast';
import { 
  SalaryStructurePosition, 
  HeadcountPlanMap, 
  InitialCapexItem, 
  MonthlyOperatingExpense, 
  HrOperationsConfig 
} from './types/hrOperations';
import { 
  DEFAULT_SALARY_POSITIONS, 
  DEFAULT_HEADCOUNT_PLAN, 
  DEFAULT_INITIAL_CAPEX_ITEMS, 
  DEFAULT_MONTHLY_OPEX_ITEMS, 
  DEFAULT_HR_OPERATIONS_CONFIG 
} from './data/defaultHrOperations';
import { HrOperationsSection } from './components/HrOperationsSection';
import { ComprehensiveReportsSection } from './components/ComprehensiveReportsSection';
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  FileSpreadsheet,
  Cpu,
  BookOpen
} from 'lucide-react';

const DEFAULT_PROJECT_NAME = 'mosh_mode_project';

export interface AppShellProps {
  currentUser?: { id: number; email: string; fullName: string; role: string };
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
  onLogout?: () => void;
}

export default function App({
  currentUser,
  isAdmin,
  onOpenAdmin,
  onLogout,
}: AppShellProps = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [parameters, setParameters] = useState<ProjectParameters>(DEFAULT_PROJECT_PARAMETERS);
  const [categories, setCategories] = useState<ProductCategory[]>(DEFAULT_PRODUCT_CATEGORIES);
  const [skus, setSkus] = useState<ProductSku[]>(DEFAULT_PRODUCT_SKUS);
  const [sheet3CogsMap, setSheet3CogsMap] = useState<Record<string, Sheet3CogsData>>(DEFAULT_SHEET3_COGS_DATA);
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEFAULT_SUPPLIERS);
  const [quotations, setQuotations] = useState<ProductQuotation[]>([]);
  const [salesMonths, setSalesMonths] = useState<SalesMonth[]>(DEFAULT_SALES_MONTHS);
  const [salesVolumes, setSalesVolumes] = useState<SalesVolumeMap>(DEFAULT_SALES_VOLUMES);
  const [channelMix, setChannelMix] = useState<ChannelMixConfig>(DEFAULT_CHANNEL_MIX);
  const [creatorPlan, setCreatorPlan] = useState<CreatorPlanMap>(DEFAULT_CREATOR_PLAN);
  const [creatorCampaigns, setCreatorCampaigns] = useState<CreatorCampaign[]>(DEFAULT_CREATOR_CAMPAIGNS);
  const [hrPositions, setHrPositions] = useState<SalaryStructurePosition[]>(DEFAULT_SALARY_POSITIONS);
  const [hrHeadcountMap, setHrHeadcountMap] = useState<HeadcountPlanMap>(DEFAULT_HEADCOUNT_PLAN);
  const [initialCapexItems, setInitialCapexItems] = useState<InitialCapexItem[]>(DEFAULT_INITIAL_CAPEX_ITEMS);
  const [monthlyOpexItems, setMonthlyOpexItems] = useState<MonthlyOperatingExpense[]>(DEFAULT_MONTHLY_OPEX_ITEMS);
  const [hrConfig, setHrConfig] = useState<HrOperationsConfig>(DEFAULT_HR_OPERATIONS_CONFIG);

  const [activeTab, setActiveTab] = useState<TabId>('tab-parameters');
  const [upcomingTabModal, setUpcomingTabModal] = useState<TabDefinition | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(true);

  const ensureComboCategory = (cats: ProductCategory[]): ProductCategory[] => {
    const hasCombo = cats.some((c) => c.id === 'cat-combo' || c.code === 'COMBO');
    if (!hasCombo) {
      return [
        ...cats,
        {
          id: 'cat-combo',
          name: 'Combo Chăm Sóc Toàn Diện (Sets)',
          code: 'COMBO',
          description: 'Các bộ giải pháp kết hợp chuyên sâu cho vùng nách',
        },
      ];
    }
    return cats;
  };

  // Load project data from database on mount
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const result = await getDefaultProject();

        if (result.success && result.data) {
          const data = result.data;
          // Merge with defaults so partial/empty DB rows do not wipe UI defaults
          setParameters(
            data.parameters && Object.keys(data.parameters).length > 0
              ? { ...DEFAULT_PROJECT_PARAMETERS, ...data.parameters }
              : DEFAULT_PROJECT_PARAMETERS
          );
          setCategories(
            ensureComboCategory(
              Array.isArray(data.categories) && data.categories.length > 0
                ? data.categories
                : DEFAULT_PRODUCT_CATEGORIES
            )
          );
          setSkus(Array.isArray(data.skus) && data.skus.length > 0 ? data.skus : DEFAULT_PRODUCT_SKUS);
          setSheet3CogsMap(
            data.sheet3CogsMap && Object.keys(data.sheet3CogsMap).length > 0
              ? data.sheet3CogsMap
              : DEFAULT_SHEET3_COGS_DATA
          );
          setSuppliers(
            Array.isArray(data.suppliers) && data.suppliers.length > 0
              ? data.suppliers
              : DEFAULT_SUPPLIERS
          );
          setQuotations(Array.isArray(data.quotations) ? data.quotations : []);
          setSalesMonths(
            Array.isArray(data.salesMonths) && data.salesMonths.length > 0
              ? data.salesMonths
              : DEFAULT_SALES_MONTHS
          );
          setSalesVolumes(data.salesVolumes || DEFAULT_SALES_VOLUMES);
          setChannelMix(
            data.channelMix && Object.keys(data.channelMix).length > 0
              ? data.channelMix
              : DEFAULT_CHANNEL_MIX
          );
          setCreatorPlan(data.creatorPlan || DEFAULT_CREATOR_PLAN);
          setCreatorCampaigns(
            Array.isArray(data.creatorCampaigns) ? data.creatorCampaigns : DEFAULT_CREATOR_CAMPAIGNS
          );
          setHrPositions(
            Array.isArray(data.hrPositions) && data.hrPositions.length > 0
              ? data.hrPositions
              : DEFAULT_SALARY_POSITIONS
          );
          setHrHeadcountMap(data.hrHeadcountMap || DEFAULT_HEADCOUNT_PLAN);
          setInitialCapexItems(
            Array.isArray(data.initialCapexItems) && data.initialCapexItems.length > 0
              ? data.initialCapexItems
              : DEFAULT_INITIAL_CAPEX_ITEMS
          );
          setMonthlyOpexItems(
            Array.isArray(data.monthlyOpexItems) && data.monthlyOpexItems.length > 0
              ? data.monthlyOpexItems
              : DEFAULT_MONTHLY_OPEX_ITEMS
          );
          setHrConfig(
            data.hrConfig && Object.keys(data.hrConfig).length > 0
              ? data.hrConfig
              : DEFAULT_HR_OPERATIONS_CONFIG
          );
          console.log('✅ Project data loaded from MySQL (normalized)');
        } else {
          console.log('No saved project found, using default values');
          setCategories(ensureComboCategory(DEFAULT_PRODUCT_CATEGORIES));
        }
      } catch (error) {
        console.warn('Failed to load project from database, using defaults:', error);
        setCategories(ensureComboCategory(DEFAULT_PRODUCT_CATEGORIES));
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, []);

  // Auto-save project data to database
  useEffect(() => {
    if (isLoading) return;

    setIsSaved(false);
    const timer = setTimeout(() => {
      saveProjectToDatabase();
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    parameters,
    categories,
    skus,
    sheet3CogsMap,
    suppliers,
    quotations,
    salesMonths,
    salesVolumes,
    channelMix,
    creatorPlan,
    creatorCampaigns,
    hrPositions,
    hrHeadcountMap,
    initialCapexItems,
    monthlyOpexItems,
    hrConfig,
    isLoading,
  ]);

  const handleImport = (imported: ProjectParameters) => {
    setParameters(imported);
  };

  const saveProjectToDatabase = async (projectName: string = 'mosh_mode_project') => {
    try {
      const projectData = {
        projectName,
        parameters,
        categories,
        skus,
        sheet3CogsMap,
        suppliers,
        quotations,
        salesMonths,
        salesVolumes,
        channelMix,
        creatorPlan,
        creatorCampaigns,
        hrPositions,
        hrHeadcountMap,
        initialCapexItems,
        monthlyOpexItems,
        hrConfig,
      };

      const result = await saveProject(projectData as any);

      if (result.success) {
        setIsSaved(true);
        console.log('✅ Project saved to database:', result.message);
        return true;
      } else {
        console.error('❌ Failed to save project:', result.message);
        setIsSaved(false);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error saving project to database:', error.message);
      setIsSaved(false);
      return false;
    }
  };

  const handleSelectTab = (tabId: TabId) => {
    if (
      tabId === 'tab-parameters' || 
      tabId === 'tab-sku-bom' || 
      tabId === 'tab-cogs-sheet3' ||
      tabId === 'tab-sales-forecast' ||
      tabId === 'tab-hr-operations' ||
      tabId === 'tab-reports' ||
      tabId === 'tab-pnl' ||
      tabId === 'tab-cashflow' ||
      tabId === 'tab-bep-insights'
    ) {
      setActiveTab(tabId);
    } else {
      const found = PROJECT_TABS.find((t) => t.id === tabId);
      if (found) {
        setUpcomingTabModal(found);
      }
    }
  };

  // Supplier Handlers (Sheet 3)
  const handleAddSupplier = (newSupData: Omit<Supplier, 'id'>) => {
    const newId = `sup-${Date.now()}`;
    const newSupplier: Supplier = {
      ...newSupData,
      id: newId,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
  };

  const handleEditSupplier = (updatedData: Omit<Supplier, 'id'>, id: string) => {
    setSuppliers((prev) =>
      prev.map((sup) => (sup.id === id ? { ...updatedData, id } : sup))
    );
    // Cập nhật tên nhà máy trong các báo giá liên quan nếu có
    setQuotations((prev) =>
      prev.map((q) =>
        q.supplierId === id ? { ...q, factoryName: updatedData.factoryName } : q
      )
    );
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    // Dọn sạch các báo giá thuộc nhà cung cấp đã bị xóa
    setQuotations((prev) => prev.filter((q) => q.supplierId !== id));
  };

  // Quotation Handlers (Sheet 3)
  const handleSaveQuotation = (
    quoteData: Omit<ProductQuotation, 'id'>,
    editId?: string,
    setAsChosen?: boolean
  ) => {
    const shouldBeChosen = Boolean(setAsChosen || quoteData.isChosen);

    if (editId) {
      setQuotations((prev) =>
        prev.map((q) => {
          if (q.id === editId) {
            return {
              ...quoteData,
              id: editId,
              isChosen: shouldBeChosen,
            };
          }
          // Nếu phương án này được chốt, bỏ chọn các phương án khác của SKU này
          if (shouldBeChosen && q.skuId === quoteData.skuId) {
            return { ...q, isChosen: false };
          }
          return q;
        })
      );
    } else {
      const newId = `quote-${Date.now()}`;
      const newQuote: ProductQuotation = {
        ...quoteData,
        id: newId,
        isChosen: shouldBeChosen,
      };

      setQuotations((prev) => {
        const list = shouldBeChosen
          ? prev.map((q) => (q.skuId === quoteData.skuId ? { ...q, isChosen: false } : q))
          : prev;
        return [...list, newQuote];
      });
    }

    // Nếu phương án được chốt, tự động đồng bộ sang Sheet 2 (sheet3CogsMap)
    if (shouldBeChosen) {
      setSheet3CogsMap((prev) => ({
        ...prev,
        [quoteData.skuId]: {
          skuId: quoteData.skuId,
          cogsPerUnit: quoteData.unitPrice,
          moq: quoteData.moq,
          factoryName: quoteData.factoryName,
          leadTimeDays: quoteData.leadTimeDays || parameters.supplyChain.productionLeadTimeDays,
        },
      }));
    }
  };

  const handleDeleteQuotation = (id: string) => {
    const targetQuote = quotations.find((q) => q.id === id);
    setQuotations((prev) => prev.filter((q) => q.id !== id));

    // Nếu xóa báo giá đang chốt, xóa khỏi sheet3CogsMap
    if (targetQuote && targetQuote.isChosen) {
      setSheet3CogsMap((prev) => {
        const copy = { ...prev };
        delete copy[targetQuote.skuId];
        return copy;
      });
    }
  };

  const handleChooseQuotation = (quotation: ProductQuotation) => {
    // 1. Đánh dấu báo giá này là isChosen và các báo giá khác của SKU này thành false
    setQuotations((prev) =>
      prev.map((q) => {
        if (q.skuId === quotation.skuId) {
          return {
            ...q,
            isChosen: q.id === quotation.id,
          };
        }
        return q;
      })
    );

    // 2. Tự động đồng bộ ngay sang Sheet 2 (sheet3CogsMap)
    setSheet3CogsMap((prev) => ({
      ...prev,
      [quotation.skuId]: {
        skuId: quotation.skuId,
        cogsPerUnit: quotation.unitPrice,
        moq: quotation.moq,
        factoryName: quotation.factoryName,
        leadTimeDays: quotation.leadTimeDays || parameters.supplyChain.productionLeadTimeDays,
      },
    }));
  };

  // SKU Management Handlers
  const handleAddSku = async (
    newSkuData: Omit<ProductSku, 'id'>,
    sheet3Data?: { cogsPerUnit: number; moq: number; factoryName: string }
  ) => {
    const newId = `sku-${Date.now()}`;
    const newSku: ProductSku = {
      ...newSkuData,
      id: newId,
    };

    setSkus((prev) => [newSku, ...prev]);

    if (sheet3Data && newSkuData.type === 'single') {
      setSheet3CogsMap((prev) => ({
        ...prev,
        [newId]: {
          skuId: newId,
          cogsPerUnit: sheet3Data.cogsPerUnit,
          moq: sheet3Data.moq,
          factoryName: sheet3Data.factoryName,
          leadTimeDays: parameters.supplyChain.productionLeadTimeDays,
        },
      }));
    }
  };

  const handleEditSku = async (
    skuId: string,
    updatedSkuData: Omit<ProductSku, 'id'>,
    sheet3Data?: { cogsPerUnit: number; moq: number; factoryName: string }
  ) => {
    setSkus((prev) =>
      prev.map((s) => (s.id === skuId ? { ...updatedSkuData, id: skuId } : s))
    );

    if (updatedSkuData.type === 'single') {
      if (sheet3Data && (sheet3Data.cogsPerUnit > 0 || sheet3Data.factoryName)) {
        setSheet3CogsMap((prev) => ({
          ...prev,
          [skuId]: {
            skuId: skuId,
            cogsPerUnit: sheet3Data.cogsPerUnit,
            moq: sheet3Data.moq,
            factoryName: sheet3Data.factoryName,
            leadTimeDays: parameters.supplyChain.productionLeadTimeDays,
          },
        }));
      } else {
        // Clear sheet3 data if emptied
        setSheet3CogsMap((prev) => {
          const copy = { ...prev };
          delete copy[skuId];
          return copy;
        });
      }
    } else {
      // Combo has no sheet3 cogs entry (calculated dynamically)
      setSheet3CogsMap((prev) => {
        const copy = { ...prev };
        delete copy[skuId];
        return copy;
      });
    }
  };

  const handleDeleteSku = async (id: string) => {
    setSkus((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      return remaining.map((sku) => {
        if (sku.type === 'combo' && sku.comboItems) {
          return {
            ...sku,
            comboItems: sku.comboItems.filter((ci) => ci.skuId !== id),
          };
        }
        return sku;
      });
    });
    setSheet3CogsMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    // Dọn sạch toàn bộ báo giá của SKU đã bị xóa
    setQuotations((prev) => prev.filter((q) => q.skuId !== id));
  };

  const handleUpdateSkuPrice = (
    skuId: string, 
    channel: 'standard' | 'shopee' | 'tikTokShop' | 'retail' | 'b2b', 
    value: number
  ) => {
    setSkus((prev) =>
      prev.map((sku) => {
        if (sku.id === skuId) {
          return {
            ...sku,
            prices: {
              ...sku.prices,
              [channel]: Math.max(0, value),
            },
          };
        }
        return sku;
      })
    );
  };

  // Fast apply standard price to all 4 channels
  const handleApplyStandardToAllChannels = (skuId: string) => {
    setSkus((prev) =>
      prev.map((sku) => {
        if (sku.id === skuId) {
          const std = sku.prices.standard;
          return {
            ...sku,
            prices: {
              standard: std,
              shopee: std,
              tikTokShop: std,
              retail: std,
              b2b: Math.round(std * 0.6), // Giảm 40% cho đại lý B2B
            },
          };
        }
        return sku;
      })
    );
  };

  // Category Management Handlers
  const handleAddCategory = (cat: ProductCategory) => {
    setCategories((prev) => [...prev, cat]);
  };

  const handleDeleteCategory = (id: string) => {
    // Không thể xóa nếu danh mục vẫn đang có sản phẩm gắn vào
    const hasLinkedSkus = skus.some((s) => s.categoryId === id);
    if (hasLinkedSkus) {
      return;
    }
    if (categories.length <= 1) {
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="animate-spin">
            <Sparkles className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Loading project data...</h2>
          <p className="text-sm text-slate-600">Connecting to database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Auth bar */}
      <div className="bg-slate-900 text-slate-100 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
          <div className="truncate">
            <span className="text-slate-400">Đăng nhập:</span>{' '}
            <span className="font-semibold text-white">{currentUser?.fullName || 'User'}</span>
            <span className="text-slate-500 mx-1.5">·</span>
            <span className="text-slate-300">{currentUser?.email}</span>
            {isAdmin && (
              <span className="ml-2 inline-flex px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-200 border border-violet-400/30 text-[10px] font-semibold uppercase">
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && onOpenAdmin && (
              <button type="button" onClick={onOpenAdmin} className="text-violet-200 hover:text-white font-semibold">
                Quản lý user
              </button>
            )}
            {onLogout && (
              <button type="button" onClick={onLogout} className="text-slate-300 hover:text-white font-semibold">
                Đăng xuất
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Application Header */}
      <Header
        parameters={parameters}
        onImport={handleImport}
        isSaved={isSaved}
      />

      {/* Step Pipeline Navigation */}
      <TabNavigation
        tabs={PROJECT_TABS}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TAB 1: THAM SỐ CHUNG */}
        {activeTab === 'tab-parameters' && (
          <>
            {/* Step 1 Introduction & Sub-sections Navigation Banner */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nền Móng Kiến Trúc Dữ Liệu &amp; Tham Số Gốc</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Space_Grotesk']">
                    Bảng Thiết Lập Tham Số Chung Tổng Thể Cho Mosh&amp;Mode
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Mô hình hóa toàn diện các hằng số kinh doanh, thuế suất Việt Nam, chu kỳ công nợ, chiết khấu nền tảng Shopee / TikTok Shop và chính sách Creator cho dải sản phẩm chăm sóc vùng da dưới cánh tay (Underarm Care). Tất cả dữ liệu này là lõi đầu vào (Single Source of Truth) kết nối trực tiếp đến các bước COGS, Kế hoạch doanh số, Báo cáo P&amp;L và Dòng tiền.
                  </p>
                </div>

                {/* Sub-sections Navigation within Tab 1 */}
                <div className="shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:max-w-md">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 lg:text-right">
                    Phân mục tham số (Sub-sections):
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                    <button
                      onClick={() => document.getElementById('sec-kpi-highlights')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                    >
                      Chỉ Số KPI
                    </button>
                    <button
                      onClick={() => document.getElementById('sec-tax-capital')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                    >
                      Thuế &amp; Vốn
                    </button>
                    <button
                      onClick={() => document.getElementById('sec-settlement-cycle')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                    >
                      Chu Kỳ Công Nợ
                    </button>
                    <button
                      onClick={() => document.getElementById('sec-leadtime-marketing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                    >
                      Sản Xuất &amp; MKT
                    </button>
                    <button
                      onClick={() => document.getElementById('sec-d2c-fees')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                    >
                      Phí D2C &amp; Ads
                    </button>
                    <button
                      onClick={() => document.getElementById('sec-platform-fees')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                    >
                      Phí Sàn TMĐT
                    </button>
                    <button
                      onClick={() => document.getElementById('sec-creator-matrix')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                    >
                      Creator &amp; KOC
                    </button>
                    <button
                      onClick={() => document.getElementById('sec-cfo-simulator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
                    >
                      CFO Simulator
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive KPI Overview Cards */}
            <div id="sec-kpi-highlights" className="scroll-mt-24">
              <KPIHighlights
                parameters={parameters}
                onUpdateStartingCash={(startingCash) =>
                  setParameters({
                    ...parameters,
                    taxAndCapital: {
                      ...parameters.taxAndCapital,
                      startingCash,
                    },
                  })
                }
              />
            </div>

            {/* Section 1: Tax and Capital */}
            <div id="sec-tax-capital" className="scroll-mt-24">
              <TaxAndCapitalSection
                config={parameters.taxAndCapital}
                onChange={(taxAndCapital) => setParameters({ ...parameters, taxAndCapital })}
              />
            </div>

            {/* Section 2: Settlement Cycle & Cash Conversion */}
            <div id="sec-settlement-cycle" className="scroll-mt-24">
              <SettlementCycleSection
                config={parameters.settlementCycle}
                onChange={(settlementCycle) => setParameters({ ...parameters, settlementCycle })}
              />
            </div>

            {/* Section 3 & 4: Production Lead-time & Marketing Baseline */}
            <div id="sec-leadtime-marketing" className="scroll-mt-24">
              <LeadTimeMarketingSection
                supplyChain={parameters.supplyChain}
                marketing={parameters.marketingBaseline}
                onUpdateSupplyChain={(supplyChain) => setParameters({ ...parameters, supplyChain })}
                onUpdateMarketing={(marketingBaseline) => setParameters({ ...parameters, marketingBaseline })}
              />
            </div>

            {/* Section 5: Phí D2C (Affiliate & Quảng cáo nội sàn) */}
            <div id="sec-d2c-fees" className="scroll-mt-24">
              <D2CFeesSection
                d2cFees={parameters.d2cFees}
                marketingBudgetRateGmv={parameters.marketingBaseline.marketingBudgetRateGmv}
                onChange={(d2cFees) => setParameters({ ...parameters, d2cFees })}
              />
            </div>

            {/* Section 6: Platform Fee Matrix (Shopee vs TikTok Shop) */}
            <div id="sec-platform-fees" className="scroll-mt-24">
              <PlatformFeesSection
                platformFees={parameters.platformFees}
                onChange={(platformFees) => setParameters({ ...parameters, platformFees })}
              />
            </div>

            {/* Section 7: Creator Matrix (UGC, KOC, KOL) */}
            <div id="sec-creator-matrix" className="scroll-mt-24">
              <CreatorMatrixSection
                creatorTiers={parameters.creatorTiers}
                onChange={(creatorTiers) => setParameters({ ...parameters, creatorTiers })}
              />
            </div>

            {/* Real-time CFO Stress-Test Simulator Widget */}
            <div id="sec-cfo-simulator" className="scroll-mt-24">
              <CFOSimulatorWidget parameters={parameters} />
            </div>
          </>
        )}

        {/* TAB 2: DANH MỤC SẢN PHẨM & COGS */}
        {activeTab === 'tab-sku-bom' && (
          <SkuCatalogSection
            categories={categories}
            skus={skus}
            sheet3CogsMap={sheet3CogsMap}
            onAddSku={handleAddSku}
            onEditSku={handleEditSku}
            onDeleteSku={handleDeleteSku}
            onUpdateSkuPrice={handleUpdateSkuPrice}
            onApplyStandardToAllChannels={handleApplyStandardToAllChannels}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onNavigateToSheet3={() => setActiveTab('tab-cogs-sheet3')}
          />
        )}

        {/* TAB 3: GIÁ VỐN HÀNG BÁN & BÁO GIÁ NHÀ MÁY (SHEET 3) */}
        {activeTab === 'tab-cogs-sheet3' && (
          <Sheet3CogsSection
            skus={skus}
            categories={categories}
            suppliers={suppliers}
            quotations={quotations}
            sheet3CogsMap={sheet3CogsMap}
            onAddSupplier={handleAddSupplier}
            onEditSupplier={handleEditSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onSaveQuotation={handleSaveQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            onChooseQuotation={handleChooseQuotation}
          />
        )}

        {/* TAB 4: KẾ HOẠCH BÁN HÀNG & DỰ BÁO SẢN LƯỢNG */}
        {activeTab === 'tab-sales-forecast' && (
          <SalesForecastSection
            skus={skus}
            categories={categories}
            sheet3CogsMap={sheet3CogsMap}
            parameters={parameters}
            months={salesMonths}
            volumes={salesVolumes}
            channelMix={channelMix}
            creatorPlan={creatorPlan}
            campaigns={creatorCampaigns}
            quotations={quotations}
            onUpdateSkuPrice={handleUpdateSkuPrice}
            onUpdateMonths={setSalesMonths}
            onUpdateVolumes={setSalesVolumes}
            onUpdateChannelMix={setChannelMix}
            onUpdateCreatorPlan={setCreatorPlan}
            onUpdateCampaigns={setCreatorCampaigns}
            onResetToDefault={() => {
              setSalesMonths(DEFAULT_SALES_MONTHS);
              setSalesVolumes(DEFAULT_SALES_VOLUMES);
              setChannelMix(DEFAULT_CHANNEL_MIX);
              setCreatorPlan(DEFAULT_CREATOR_PLAN);
              setCreatorCampaigns(DEFAULT_CREATOR_CAMPAIGNS);
            }}
            onClearVolumes={() => {
              const cleared: SalesVolumeMap = {};
              skus.forEach((s) => {
                cleared[s.id] = {};
                salesMonths.forEach((m) => {
                  cleared[s.id][m.id] = 0;
                });
              });
              setSalesVolumes(cleared);
            }}
          />
        )}

        {/* TAB 5: NHÂN SỰ & VẬN HÀNH (HR & OPERATIONS) */}
        {activeTab === 'tab-hr-operations' && (
          <HrOperationsSection
            parameters={parameters}
            months={salesMonths}
            positions={hrPositions}
            headcountMap={hrHeadcountMap}
            capexItems={initialCapexItems}
            opexItems={monthlyOpexItems}
            hrConfig={hrConfig}
            onUpdatePositions={setHrPositions}
            onUpdateHeadcountMap={setHrHeadcountMap}
            onUpdateCapexItems={setInitialCapexItems}
            onUpdateOpexItems={setMonthlyOpexItems}
            onUpdateHrConfig={setHrConfig}
            onResetToDefault={() => {
              setHrPositions(DEFAULT_SALARY_POSITIONS);
              setHrHeadcountMap(DEFAULT_HEADCOUNT_PLAN);
              setInitialCapexItems(DEFAULT_INITIAL_CAPEX_ITEMS);
              setMonthlyOpexItems(DEFAULT_MONTHLY_OPEX_ITEMS);
              setHrConfig(DEFAULT_HR_OPERATIONS_CONFIG);
            }}
          />
        )}

        {/* Tab 6: Báo Cáo Tài Chính Real-time (P&L, Dòng Tiền & Vốn, BEP) */}
        {(activeTab === 'tab-reports' || activeTab === 'tab-pnl' || activeTab === 'tab-cashflow' || activeTab === 'tab-bep-insights') && (
          <ComprehensiveReportsSection
            skus={skus}
            sheet3CogsMap={sheet3CogsMap}
            months={salesMonths}
            volumes={salesVolumes}
            channelMix={channelMix}
            creatorCampaigns={creatorCampaigns}
            positions={hrPositions}
            headcountMap={hrHeadcountMap}
            capexItems={initialCapexItems}
            opexItems={monthlyOpexItems}
            hrConfig={hrConfig}
            parameters={parameters}
            quotations={quotations}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 font-['Space_Grotesk']">MOSH &amp; MODE</span>
            <span>•</span>
            <span>Chăm Sóc Vùng Da Dưới Cánh Tay (Underarm Care)</span>
            <span>•</span>
            <span>Hệ Thống Quản Trị Tài Chính Doanh Nghiệp</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500">
            <span>CFO &amp; Principal Software Architecture Engine</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Hệ Thống 6 Tab Tài Chính Đã Hoàn Thiện &amp; Vận Hành Real-time</span>
          </div>
        </div>
      </footer>

      {/* Upcoming Tab Roadmap Modal */}
      {upcomingTabModal && (
        <UpcomingTabModal
          tab={upcomingTabModal}
          parameters={parameters}
          onClose={() => setUpcomingTabModal(null)}
        />
      )}
    </div>
  );
}
