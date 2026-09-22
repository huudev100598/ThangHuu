import React, { useState } from 'react';
import { ProductCategory, ProductSku, Sheet3CogsData } from '../types/sku';
import { SkuModal } from './SkuModal';
import { CategoryModal } from './CategoryModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  Package, 
  Boxes, 
  Plus, 
  FolderTree, 
  Trash2, 
  Zap, 
  TrendingUp, 
  Factory, 
  Layers, 
  Sparkles,
  Info,
  DollarSign,
  ArrowRight,
  Pencil
} from 'lucide-react';

interface SkuCatalogSectionProps {
  categories: ProductCategory[];
  skus: ProductSku[];
  sheet3CogsMap: Record<string, Sheet3CogsData>;
  onAddSku: (
    sku: Omit<ProductSku, 'id'>, 
    sheet3Data?: { cogsPerUnit: number; moq: number; factoryName: string }
  ) => void;
  onEditSku: (
    skuId: string,
    sku: Omit<ProductSku, 'id'>, 
    sheet3Data?: { cogsPerUnit: number; moq: number; factoryName: string }
  ) => void;
  onDeleteSku: (id: string) => void;
  onUpdateSkuPrice: (skuId: string, channel: 'standard' | 'shopee' | 'tikTokShop' | 'retail' | 'b2b', value: number) => void;
  onApplyStandardToAllChannels: (skuId: string) => void;
  onAddCategory: (cat: ProductCategory) => void;
  onDeleteCategory: (id: string) => void;
  onNavigateToSheet3?: () => void;
}

export const SkuCatalogSection: React.FC<SkuCatalogSectionProps> = ({
  categories,
  skus,
  sheet3CogsMap,
  onAddSku,
  onEditSku,
  onDeleteSku,
  onUpdateSkuPrice,
  onApplyStandardToAllChannels,
  onAddCategory,
  onDeleteCategory,
  onNavigateToSheet3,
}) => {
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<ProductSku | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [skuToDelete, setSkuToDelete] = useState<ProductSku | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'single' | 'combo'>('all');

  // Single skus for combo builder reference
  const singleSkus = skus.filter((s) => s.type === 'single');

  // Filtered skus
  const filteredSkus = skus.filter((sku) => {
    if (filterCategory !== 'all' && sku.categoryId !== filterCategory) return false;
    if (filterType !== 'all' && sku.type !== filterType) return false;
    return true;
  });

  // Calculate COGS for any SKU (single or combo)
  const getCogsForSku = (sku: ProductSku): number => {
    if (sku.type === 'single') {
      return sheet3CogsMap[sku.id]?.cogsPerUnit || 0;
    }
    // Combo: sum of child SKUs
    if (sku.comboItems && sku.comboItems.length > 0) {
      return sku.comboItems.reduce((total, item) => {
        const itemCogs = sheet3CogsMap[item.skuId]?.cogsPerUnit || 0;
        return total + (itemCogs * item.quantity);
      }, 0);
    }
    return 0;
  };

  const getCategoryName = (categoryId: string, skuType?: 'single' | 'combo'): string => {
    if (skuType === 'combo' || categoryId === 'cat-combo' || categoryId === 'COMBO') {
      return 'Combo';
    }
    if (!categoryId) return 'Chung';
    const found = categories.find(
      (c) => c.id === categoryId || c.code?.toUpperCase() === categoryId.toUpperCase()
    );
    return found ? found.name : 'Chung';
  };

  const handleSaveSku = (
    skuData: Omit<ProductSku, 'id'>, 
    sheet3Data?: { cogsPerUnit: number; moq: number; factoryName: string },
    existingId?: string
  ) => {
    if (existingId) {
      onEditSku(existingId, skuData, sheet3Data);
    } else {
      onAddSku(skuData, sheet3Data);
    }
    setIsSkuModalOpen(false);
    setEditingSku(null);
  };

  // KPIs
  const totalSkus = skus.length;
  const totalSingles = singleSkus.length;
  const totalCombos = skus.filter((s) => s.type === 'combo').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner for Tab 2 */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Danh Mục Sản Phẩm (SKU) &amp; Định Mức Giá Vốn</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Space_Grotesk']">
              Danh Mục Sản Phẩm Mosh&amp;Mode (Underarm Care)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Theo dõi danh mục sản phẩm theo hàng ngang: Mã SKU, Tên, Dung tích, Danh mục, Cơ cấu giá niêm yết 4 kênh (Shopee, TikTok Shop, Bán lẻ, B2B), Giá vốn COGS, MOQ và Nhà máy sản xuất kết nối trực tiếp từ Giá Vốn Hàng Bán.
            </p>
          </div>

          <div className="shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:max-w-md">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 lg:text-right">
              Chức năng danh mục (Sub-actions):
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {onNavigateToSheet3 && (
                <button
                  onClick={onNavigateToSheet3}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <Factory className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Bảng Giá Vốn COGS</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              )}

              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <FolderTree className="w-3.5 h-3.5 text-purple-600" />
                <span>Quản Lý Danh Mục ({categories.length})</span>
              </button>

              <button
                onClick={() => {
                  setEditingSku(null);
                  setIsSkuModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm SKU</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Tổng Số SKU Trong Hệ Thống</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{totalSkus} SKUs</div>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Layers className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">SKU Đơn Lẻ (Single Units)</span>
            <div className="text-2xl font-bold text-emerald-800 font-mono mt-1">{totalSingles} SKUs</div>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Package className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">SKU Theo Combo (Bộ giải pháp)</span>
            <div className="text-2xl font-bold text-purple-800 font-mono mt-1">{totalCombos} Combos</div>
          </div>
          <span className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <Boxes className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Lọc theo:</span>
          
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
          >
            <option value="all">Tất cả danh mục ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'all' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({skus.length})
            </button>
            <button
              onClick={() => setFilterType('single')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'single' ? 'bg-emerald-100 text-emerald-800 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đơn lẻ ({totalSingles})
            </button>
            <button
              onClick={() => setFilterType('combo')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'combo' ? 'bg-purple-100 text-purple-800 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Combo ({totalCombos})
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Combo để trống dung tích, MOQ và nhà máy theo nguyên tắc tài chính</span>
        </div>
      </div>

      {/* Main Horizontal SKU Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold select-none">
                <th className="py-3 px-3.5 whitespace-nowrap">Mã SKU</th>
                <th className="py-3 px-3.5 min-w-[220px]">Tên Sản Phẩm &amp; Phân Loại</th>
                <th className="py-3 px-3 whitespace-nowrap text-center">Dung Tích</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Danh Mục</th>
                <th className="py-3 px-3.5 whitespace-nowrap bg-emerald-50 text-emerald-800 font-bold border-x border-slate-200 text-right">
                  Giá Tiêu Chuẩn
                </th>
                <th className="py-3 px-3 whitespace-nowrap text-right text-orange-700">Giá Shopee</th>
                <th className="py-3 px-3 whitespace-nowrap text-right text-cyan-800">Giá TikTok Shop</th>
                <th className="py-3 px-3 whitespace-nowrap text-right text-purple-800">Giá Bán Lẻ</th>
                <th className="py-3 px-3 whitespace-nowrap text-right text-amber-800">Giá B2B</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-right bg-rose-50 text-rose-800 font-bold">
                  Giá Vốn (COGS)
                </th>
                <th className="py-3 px-3 whitespace-nowrap text-right font-bold text-slate-700">Biên LN Gộp (%)</th>
                <th className="py-3 px-3 whitespace-nowrap text-center text-slate-700">MOQ</th>
                <th className="py-3 px-3.5 min-w-[180px] text-slate-700">Nhà Máy Sản Xuất</th>
                <th className="py-3 px-2.5 text-center whitespace-nowrap text-slate-700">Thao Tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredSkus.map((sku) => {
                const cogs = getCogsForSku(sku);
                const sheet3 = sheet3CogsMap[sku.id];
                const grossMarginRate = sku.prices.standard > 0 
                  ? ((sku.prices.standard - cogs) / sku.prices.standard) * 100 
                  : 0;

                return (
                  <tr key={sku.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Ma SKU */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {sku.type === 'combo' ? (
                          <span className="p-1 rounded bg-purple-50 text-purple-700 border border-purple-200" title="Combo">
                            <Boxes className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Đơn lẻ">
                            <Package className="w-3 h-3" />
                          </span>
                        )}
                        <span className="font-mono font-bold text-slate-900 text-xs">{sku.skuCode}</span>
                      </div>
                    </td>

                    {/* Ten San Pham */}
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-900">{sku.name}</div>
                      {sku.type === 'combo' && sku.comboItems && (
                        <div className="text-[11px] text-purple-700 mt-0.5 flex flex-wrap gap-1">
                          <span className="text-slate-500">Gồm:</span>
                          {sku.comboItems.map((ci, i) => {
                            const childSku = singleSkus.find((s) => s.id === ci.skuId);
                            return (
                              <span key={i} className="px-1.5 py-0.2 rounded bg-purple-50 border border-purple-200 text-[10px] text-purple-800">
                                {ci.quantity}x {childSku?.skuCode || ci.skuId}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Dung tich */}
                    <td className="py-3 px-3 whitespace-nowrap text-center font-mono text-slate-700">
                      {sku.type === 'combo' ? (
                        <span className="text-slate-400 font-sans italic">—</span>
                      ) : (
                        sku.volume || '—'
                      )}
                    </td>

                    {/* Danh muc */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {sku.type === 'combo' ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-medium">
                          Combo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px]">
                          {getCategoryName(sku.categoryId, sku.type)}
                        </span>
                      )}
                    </td>

                    {/* Gia Tieu Chuan (Co chuc nang ap nhanh) */}
                    <td className="py-3 px-3.5 whitespace-nowrap bg-emerald-50/40 border-x border-slate-200 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <input
                          type="number"
                          step="1000"
                          value={sku.prices.standard || ''}
                          onChange={(e) => onUpdateSkuPrice(sku.id, 'standard', Number(e.target.value))}
                          className="w-24 text-right bg-white border border-emerald-300 rounded px-1.5 py-1 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => onApplyStandardToAllChannels(sku.id)}
                          title="Áp nhanh giá này cho 4 kênh bán"
                          className="p-1 rounded hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Gia Shopee */}
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <input
                        type="number"
                        step="1000"
                        value={sku.prices.shopee || ''}
                        onChange={(e) => onUpdateSkuPrice(sku.id, 'shopee', Number(e.target.value))}
                        className="w-20 text-right bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono text-orange-800 focus:outline-none focus:border-orange-500"
                      />
                    </td>

                    {/* Gia TikTok Shop */}
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <input
                        type="number"
                        step="1000"
                        value={sku.prices.tikTokShop || ''}
                        onChange={(e) => onUpdateSkuPrice(sku.id, 'tikTokShop', Number(e.target.value))}
                        className="w-20 text-right bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono text-cyan-800 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Gia Retail */}
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <input
                        type="number"
                        step="1000"
                        value={sku.prices.retail || ''}
                        onChange={(e) => onUpdateSkuPrice(sku.id, 'retail', Number(e.target.value))}
                        className="w-20 text-right bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono text-purple-800 focus:outline-none focus:border-purple-500"
                      />
                    </td>

                    {/* Gia B2B */}
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <input
                        type="number"
                        step="1000"
                        value={sku.prices.b2b || ''}
                        onChange={(e) => onUpdateSkuPrice(sku.id, 'b2b', Number(e.target.value))}
                        className="w-20 text-right bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono text-amber-800 focus:outline-none focus:border-amber-500"
                      />
                    </td>

                    {/* Gia Von (COGS tu Sheet 3) */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-right bg-rose-50/30">
                      <div className="font-mono font-semibold text-rose-800">
                        {cogs > 0 ? `${cogs.toLocaleString('vi-VN')} đ` : '—'}
                      </div>
                      {sku.type === 'combo' ? (
                        <span className="text-[10px] text-slate-500 block">Tổng COGS linh kiện</span>
                      ) : (
                        cogs > 0 && !sheet3?.factoryName && (
                          <span className="text-[10px] text-amber-700 font-medium block">Giá vốn kỳ vọng</span>
                        )
                      )}
                    </td>

                    {/* Bien loi nhuan gop */}
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      {grossMarginRate > 0 ? (
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          grossMarginRate >= 70 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : grossMarginRate >= 50 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {grossMarginRate.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* MOQ (Tu Sheet 3, Combo bo trong) */}
                    <td className="py-3 px-3 whitespace-nowrap text-center font-mono text-slate-700">
                      {sku.type === 'combo' ? (
                        <span className="text-slate-400 font-sans italic">—</span>
                      ) : (
                        sheet3?.factoryName && sheet3?.moq ? `${sheet3.moq.toLocaleString('vi-VN')} sp` : '—'
                      )}
                    </td>

                    {/* Nha may san xuat (Tu Sheet 3, Combo bo trong) */}
                    <td className="py-3 px-3.5">
                      {sku.type === 'combo' ? (
                        <span className="text-slate-500 italic text-[11px]">— (Tổ hợp đa nhà máy)</span>
                      ) : sheet3?.factoryName ? (
                        <div className="text-slate-800 text-xs flex items-center gap-1.5">
                          <Factory className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate max-w-[200px]" title={sheet3.factoryName}>
                            {sheet3.factoryName}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-800 font-medium px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Chưa chốt nhà máy
                        </span>
                      )}
                    </td>

                    {/* Thao tac: Sua & Xoa */}
                    <td className="py-3 px-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSku(sku);
                            setIsSkuModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title={`Chỉnh sửa sản phẩm ${sku.skuCode}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSkuToDelete(sku)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={`Xóa SKU ${sku.skuCode}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSkus.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-500">
                    Không tìm thấy sản phẩm nào trong bộ lọc hiện tại. Bấm nút "+ Thêm Sản Phẩm / SKU" để tạo mới.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary & Quick Tool */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Quy tắc định mức tài chính:</span>
            <span>Giá vốn, MOQ &amp; Nhà máy kế thừa từ Giá Vốn Hàng Bán. Combo tính theo tổng linh kiện đơn lẻ.</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-emerald-700 font-medium">Đang hiển thị: {filteredSkus.length} / {skus.length} SKUs</span>
          </div>
        </div>
      </div>

      {/* Sku Modal */}
      <SkuModal
        isOpen={isSkuModalOpen}
        onClose={() => {
          setIsSkuModalOpen(false);
          setEditingSku(null);
        }}
        categories={categories}
        singleSkus={singleSkus}
        sheet3CogsMap={sheet3CogsMap}
        initialSku={editingSku}
        onSaveSku={handleSaveSku}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        skus={skus}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
      />

      {/* Custom Confirm Delete Modal for SKU */}
      <ConfirmDeleteModal
        isOpen={!!skuToDelete}
        title="Xác Nhận Xóa Sản Phẩm (SKU)"
        itemName={skuToDelete ? `${skuToDelete.name} (${skuToDelete.skuCode})` : ''}
        itemSubtext="Sản phẩm này sẽ được gỡ bỏ khỏi danh mục bán lẻ và cập nhật lại bảng tính giá vốn."
        onConfirm={() => {
          if (skuToDelete) {
            onDeleteSku(skuToDelete.id);
            setSkuToDelete(null);
          }
        }}
        onClose={() => setSkuToDelete(null)}
      />
    </div>
  );
};
