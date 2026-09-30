import React, { useState, useMemo } from 'react';
import { ProductSku, Supplier, ProductQuotation, Sheet3CogsData, ProductCategory } from '../types/sku';
import { calculatePricePerMl } from '../utils/cogsCalculator';
import { SupplierModal } from './SupplierModal';
import { SupplierDirectoryModal } from './SupplierDirectoryModal';
import { QuotationModal } from './QuotationModal';
import { 
  Factory, 
  Receipt, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Eye, 
  Edit3, 
  ArrowUpDown, 
  Boxes, 
  DollarSign, 
  TrendingUp, 
  Building2, 
  Check, 
  Info,
  AlertCircle,
  Package,
  Layers,
  Trash2,
  Sparkles
} from 'lucide-react';

interface Sheet3CogsSectionProps {
  skus: ProductSku[];
  categories: ProductCategory[];
  suppliers: Supplier[];
  quotations: ProductQuotation[];
  sheet3CogsMap: Record<string, Sheet3CogsData>;
  onAddSupplier: (supplierData: Omit<Supplier, 'id'>) => void;
  onEditSupplier: (supplierData: Omit<Supplier, 'id'>, id: string) => void;
  onDeleteSupplier: (id: string) => void;
  onSaveQuotation: (quotationData: Omit<ProductQuotation, 'id'>, editId?: string, setAsChosen?: boolean) => void;
  onDeleteQuotation: (id: string) => void;
  onChooseQuotation: (quotation: ProductQuotation) => void;
}

export const Sheet3CogsSection: React.FC<Sheet3CogsSectionProps> = ({
  skus,
  categories,
  suppliers,
  quotations,
  sheet3CogsMap,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onSaveQuotation,
  onDeleteQuotation,
  onChooseQuotation,
}) => {
  // Lọc lấy danh mục sản phẩm đơn lẻ tự động link từ Sheet 2
  const singleSkus = useMemo(() => {
    return skus.filter((s) => s.type === 'single');
  }, [skus]);

  // Modal states
  const [isSupplierDirectoryOpen, setIsSupplierDirectoryOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [quotationToEdit, setQuotationToEdit] = useState<ProductQuotation | null>(null);
  const [targetSkuIdForNewQuote, setTargetSkuIdForNewQuote] = useState<string | undefined>(undefined);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'unconfirmed'>('all');

  // Map category names
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // 1. Tập hợp các SKU đơn lẻ hiện hữu trên bảng so sánh
  const singleSkuIdSet = useMemo(() => new Set(singleSkus.map((s) => s.id)), [singleSkus]);

  // 2. Lọc chỉ giữ lại các báo giá đang thực sự hiện diện trên bảng so sánh:
  // - Thuộc SKU đơn lẻ hợp lệ đang có mặt trên bảng (loại bỏ các báo giá của SKU đã bị xóa)
  const quotesOnTable = useMemo(() => {
    return quotations.filter((q) => singleSkuIdSet.has(q.skuId));
  }, [quotations, singleSkuIdSet]);

  // 3. Group và sắp xếp các báo giá trên bảng so sánh cho từng SKU theo thứ tự đơn giá tăng dần
  const sortedQuotesBySku = useMemo(() => {
    const map: Record<string, ProductQuotation[]> = {};
    singleSkus.forEach((sku) => {
      const skuQuotes = quotesOnTable
        .filter((q) => q.skuId === sku.id)
        .sort((a, b) => a.unitPrice - b.unitPrice); // Sắp xếp tăng dần theo đơn giá!
      map[sku.id] = skuQuotes;
    });
    return map;
  }, [singleSkus, quotesOnTable]);

  // Calculate maximum number of quotations across all single SKUs to determine table columns
  const maxQuoteColumns = useMemo(() => {
    let max = 0;
    (Object.values(sortedQuotesBySku) as ProductQuotation[][]).forEach((quotes) => {
      if (quotes.length > max) max = quotes.length;
    });
    return Math.max(max, 3); // Tối thiểu hiển thị 3 cột báo giá cho bảng cân đối
  }, [sortedQuotesBySku]);

  // Filtered SKUs based on search and status
  const filteredSkus = useMemo(() => {
    return singleSkus.filter((sku) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        sku.skuCode.toLowerCase().includes(q) ||
        sku.name.toLowerCase().includes(q) ||
        (sku.volume && sku.volume.toLowerCase().includes(q));

      const hasConfirmed = Boolean(sheet3CogsMap[sku.id]?.cogsPerUnit);
      if (statusFilter === 'confirmed' && !hasConfirmed) return false;
      if (statusFilter === 'unconfirmed' && hasConfirmed) return false;

      return matchSearch;
    });
  }, [singleSkus, searchTerm, statusFilter, sheet3CogsMap]);

  // Metric summaries
  const totalSingleSkus = singleSkus.length;
  const confirmedCount = singleSkus.filter((s) => Boolean(sheet3CogsMap[s.id]?.cogsPerUnit)).length;

  // "Tổng Phương Án Báo Giá chỉ tính các báo giá đang ở trên bảng so sánh thôi, không tính các báo giá đã xoá"
  const totalQuotesCount = useMemo(() => {
    return singleSkus.reduce((total, sku) => total + (sortedQuotesBySku[sku.id]?.length || 0), 0);
  }, [singleSkus, sortedQuotesBySku]);

  // Đếm chính xác số lượng nhà xưởng của các phương án báo giá đang hiển thị trên bảng so sánh
  const suppliersWithQuotesCount = useMemo(() => {
    const activeFactories = new Set<string>();
    singleSkus.forEach((sku) => {
      (sortedQuotesBySku[sku.id] || []).forEach((q) => {
        if (q.factoryName) activeFactories.add(q.factoryName.trim());
        else if (q.supplierId) activeFactories.add(q.supplierId);
      });
    });
    return activeFactories.size;
  }, [singleSkus, sortedQuotesBySku]);

  const avgConfirmedCogs = useMemo(() => {
    const confirmedValues = (Object.values(sheet3CogsMap) as Sheet3CogsData[])
      .map((c) => c.cogsPerUnit)
      .filter((v) => v > 0);
    if (confirmedValues.length === 0) return 0;
    return Math.round(confirmedValues.reduce((a, b) => a + b, 0) / confirmedValues.length);
  }, [sheet3CogsMap]);

  // Handlers for Supplier
  const handleOpenAddSupplier = () => {
    setSupplierToEdit(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup: Supplier) => {
    setSupplierToEdit(sup);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (data: Omit<Supplier, 'id'>, editId?: string) => {
    if (editId) {
      onEditSupplier(data, editId);
    } else {
      onAddSupplier(data);
    }
  };

  // Handlers for Quotation
  const handleOpenAddQuotation = (skuId?: string) => {
    setQuotationToEdit(null);
    setTargetSkuIdForNewQuote(skuId);
    setIsQuotationModalOpen(true);
  };

  const handleOpenEditQuotation = (quote: ProductQuotation) => {
    setQuotationToEdit(quote);
    setTargetSkuIdForNewQuote(quote.skuId);
    setIsQuotationModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Header for Tab 3 */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Giá Vốn Hàng Bán &amp; Báo Giá Nhà Máy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">
              Giá Vốn Hàng Bán (COGS) &amp; Báo Giá Nhà Máy
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tự động liên kết danh mục sản phẩm đơn lẻ từ Danh Mục Sản Phẩm. So sánh đa chiều các phương án báo giá 
              theo thứ tự đơn giá tăng dần, xem chi tiết và chốt nhà máy &amp; MOQ cho từng sản phẩm.
            </p>
          </div>

          {/* Sub-actions for Tab 3 */}
          <div className="shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:max-w-md">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 lg:text-right">
              Chức năng giá vốn (Sub-actions):
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <button
                onClick={() => setIsSupplierDirectoryOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Danh Bạ Nhà Cung Cấp ({suppliers.length})</span>
              </button>

              <button
                onClick={handleOpenAddSupplier}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Factory className="w-3.5 h-3.5 text-emerald-700" />
                <span>+ Thêm Nhà Máy</span>
              </button>

              <button
                onClick={() => handleOpenAddQuotation()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nhập Báo Giá Mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1">SKU Đơn Lẻ</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-slate-900">{totalSingleSkus}</span>
              <span className="text-xs text-slate-500">sản phẩm</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1">Nhà Máy Đã Chốt</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-emerald-700">{confirmedCount}/{totalSingleSkus}</span>
              <span className="text-xs text-emerald-600 font-medium">đã đồng bộ Giá Vốn</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1">Tổng Phương Án Báo Giá</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-cyan-800">{totalQuotesCount}</span>
              <span className="text-xs text-slate-500">từ {suppliersWithQuotesCount} nhà xưởng</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1">Giá Vốn TB Đã Chốt</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-amber-800">
                {avgConfirmedCogs > 0 ? `${avgConfirmedCogs.toLocaleString('vi-VN')} đ` : 'Chưa chốt'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã SKU, tên sản phẩm, dung tích..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            Lọc:
          </span>
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({singleSkus.length})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-100 text-emerald-800 font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã chốt ({confirmedCount})
            </button>
            <button
              onClick={() => setStatusFilter('unconfirmed')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'unconfirmed'
                  ? 'bg-amber-100 text-amber-800 font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chưa chốt ({singleSkus.length - confirmedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Bảng Danh Mục Sản Phẩm Hàng Ngang */}
      {/* Cột 1: Mã SKU, Tên, Dung tích | Cột 2: Đã Chốt | Các cột tiếp theo: Báo giá sắp xếp đơn giá tăng dần */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
              Bảng So Sánh Báo Giá Sản Xuất Theo Thứ Tự Đơn Giá Tăng Dần
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700" />
            <span>Tự động sắp xếp từ giá thấp nhất đến cao nhất</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-[11px] uppercase tracking-wider text-slate-700 font-semibold">
                <th className="py-3 px-4 w-72 sticky top-0 left-0 z-40 bg-slate-100 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  Sản Phẩm
                </th>
                <th className="py-3 px-4 w-28 text-center border-r border-slate-200 sticky top-0 bg-slate-100 z-30">
                  Dung Tích
                </th>
                <th className="py-3 px-4 w-60 border-r border-slate-200 sticky top-0 bg-slate-100 z-30">
                  Phương Án Đã Chốt (Đồng Bộ Danh Mục)
                </th>
                {Array.from({ length: maxQuoteColumns }).map((_, idx) => (
                  <th key={idx} className="py-3 px-4 min-w-[210px] border-r border-slate-200 last:border-r-0 sticky top-0 bg-slate-100 z-30">
                    <div className="flex items-center justify-between">
                      <span>Báo Giá {idx + 1}</span>
                      {idx === 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          Giá thấp nhất
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 w-28 text-center sticky top-0 bg-slate-100 z-30">Thao Tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSkus.length === 0 ? (
                <tr>
                  <td colSpan={maxQuoteColumns + 4} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Không có sản phẩm nào phù hợp với bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredSkus.map((sku) => {
                  const quotes = sortedQuotesBySku[sku.id] || [];
                  const confirmedData = sheet3CogsMap[sku.id];
                  const hasConfirmed = Boolean(confirmedData && confirmedData.cogsPerUnit > 0);

                  return (
                    <tr
                      key={sku.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Cột 1: Mã SKU & Tên Sản Phẩm (Sticky bên trái) */}
                      <td className="py-3.5 px-4 sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1" title="Mã SKU (Sắp xếp tự động đồng bộ theo Tab 2.Danh Mục Sản Phẩm)">
                              <span className="text-[10px] text-slate-500 font-normal">#{skus.findIndex((s) => s.id === sku.id) + 1}</span>
                              <span>{sku.skuCode}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {categoryMap[sku.categoryId] || 'Mỹ phẩm'}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-900 leading-snug line-clamp-2" title={sku.name}>
                            {sku.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Giá chuẩn: {sku.prices.standard.toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Dung tích */}
                      <td className="py-3.5 px-4 text-center border-r border-slate-200">
                        {sku.volume ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {sku.volume}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Cột 3: Phương án đã chốt (Hiển thị đồng bộ sang Sheet 2) */}
                      <td className="py-3.5 px-4 border-r border-slate-200">
                        {hasConfirmed && confirmedData ? (
                          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                ĐÃ CHỐT
                              </span>
                              <span className="text-[10px] font-mono text-slate-600">
                                MOQ: {confirmedData.moq.toLocaleString('vi-VN')} sp
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900 text-[11px] truncate" title={confirmedData.factoryName}>
                              {confirmedData.factoryName}
                            </div>
                            <div className="flex items-baseline justify-between pt-1 border-t border-emerald-200/80">
                              <span className="text-xs font-bold font-mono text-emerald-800">
                                {confirmedData.cogsPerUnit.toLocaleString('vi-VN')} đ
                              </span>
                              {sku.prices.standard > 0 && (
                                <span className="text-[10px] text-emerald-700 font-mono font-medium">
                                  Lãi: {(((sku.prices.standard - confirmedData.cogsPerUnit) / sku.prices.standard) * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                            <span className="inline-block text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Chưa chốt nhà máy
                            </span>
                            <p className="text-[10px] text-slate-500">
                              Bấm &quot;Chốt&quot; tại một báo giá bên phải
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Các cột báo giá được sắp xếp theo đơn giá tăng dần */}
                      {Array.from({ length: maxQuoteColumns }).map((_, quoteIdx) => {
                        const quote = quotes[quoteIdx];

                        if (!quote) {
                          return (
                            <td key={quoteIdx} className="py-3.5 px-4 border-r border-slate-200 last:border-r-0">
                              <div className="h-full min-h-[110px] rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[11px]">
                                <span>Trống</span>
                              </div>
                            </td>
                          );
                        }

                        // Tính đơn giá / ml ngắn gọn theo yêu cầu
                        const perMlInfo = quote.unitPricePerMl 
                          ? `${quote.unitPricePerMl.toLocaleString('vi-VN')} đ/ml`
                          : (calculatePricePerMl(quote.unitPrice, sku.volume)?.label || '-');

                        const isThisQuoteChosen = Boolean(
                          quote.isChosen || 
                          (hasConfirmed && confirmedData && confirmedData.factoryName === quote.factoryName && confirmedData.moq === quote.moq)
                        );

                        return (
                          <td key={quote.id} className="py-3.5 px-4 border-r border-slate-200 last:border-r-0">
                            {/* Thẻ báo giá ngắn gọn theo mô tả: Nhà máy, MOQ, Đơn giá, Đơn giá/ml */}
                            <div
                              className={`p-3 rounded-xl border transition-all space-y-2 relative group/card ${
                                isThisQuoteChosen
                                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs'
                                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                              }`}
                            >
                              {/* Nhà máy sản xuất & Huy hiệu đã chốt */}
                              <div className="flex items-start justify-between gap-1.5">
                                <span
                                  className="text-[11px] font-bold text-slate-900 truncate block leading-tight flex-1"
                                  title={quote.factoryName}
                                >
                                  {quote.factoryName}
                                </span>

                                {isThisQuoteChosen ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white shrink-0 flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    ĐÃ CHỐT
                                  </span>
                                ) : quoteIdx === 0 ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200 shrink-0">
                                    Top 1 Rẻ
                                  </span>
                                ) : null}
                              </div>

                              {/* MOQ & Đơn giá sản phẩm */}
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
                                  <span>MOQ:</span>
                                  <span className="font-semibold text-slate-800">
                                    {quote.moq.toLocaleString('vi-VN')} sp
                                  </span>
                                </div>

                                <div className="flex items-baseline justify-between pt-0.5">
                                  <span className="text-[10px] text-slate-500">Đơn giá:</span>
                                  <span className="text-sm font-bold font-mono text-emerald-700">
                                    {quote.unitPrice.toLocaleString('vi-VN')} đ
                                  </span>
                                </div>

                                <div className="flex items-baseline justify-between text-[10px] font-mono">
                                  <span className="text-slate-500">Đơn giá/ml:</span>
                                  <span className="text-slate-700 font-semibold">{perMlInfo}</span>
                                </div>
                              </div>

                              {/* Nút Xem Báo Giá, Xóa Báo Giá & Nút Chốt Báo Giá */}
                              {deletingQuoteId === quote.id ? (
                                <div className="pt-2 border-t border-rose-200 flex items-center justify-between gap-1 text-[10px]">
                                  <span className="text-rose-600 font-semibold truncate">Xác nhận xóa?</span>
                                  <div className="flex items-center space-x-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteQuotation(quote.id);
                                        setDeletingQuoteId(null);
                                      }}
                                      className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer"
                                    >
                                      Xóa
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingQuoteId(null)}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors cursor-pointer"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1 pt-2 border-t border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditQuotation(quote)}
                                    className="flex-1 py-1 px-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                                    title="Xem & Chỉnh sửa chi tiết báo giá này"
                                  >
                                    <Eye className="w-3 h-3 text-slate-500" />
                                    <span>Xem</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setDeletingQuoteId(quote.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                    title="Xóa phương án báo giá này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {!isThisQuoteChosen ? (
                                    <button
                                      type="button"
                                      onClick={() => onChooseQuotation(quote)}
                                      className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-[11px] font-bold transition-all cursor-pointer"
                                      title="Chốt phương án nhà máy & MOQ này cho sản phẩm"
                                    >
                                      Chốt
                                    </button>
                                  ) : (
                                    <span className="py-1 px-1.5 rounded-lg text-emerald-700 text-[11px] font-bold flex items-center" title="Phương án đã chốt">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Cột Action: Thêm báo giá nhanh cho SKU này */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenAddQuotation(sku.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer"
                          title={`+ Thêm báo giá mới cho ${sku.skuCode}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bảng chú thích logic */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Quy luật sắp xếp: Cột báo giá tự động sắp xếp theo thứ tự đơn giá tăng dần. Khi sửa giá, hệ thống tự động đổi vị trí cột.
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              Phương án đã chốt (đồng bộ Danh Mục Sản Phẩm)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              Phương án so sánh dự phòng
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* 1. Modal Thêm/Sửa Nhà Cung Cấp */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSave={handleSaveSupplier}
        supplierToEdit={supplierToEdit}
      />

      {/* 2. Modal Danh Bạ Quản Lý Nhà Cung Cấp */}
      <SupplierDirectoryModal
        isOpen={isSupplierDirectoryOpen}
        onClose={() => setIsSupplierDirectoryOpen(false)}
        suppliers={suppliers}
        onAddSupplier={handleOpenAddSupplier}
        onEditSupplier={handleOpenEditSupplier}
        onDeleteSupplier={onDeleteSupplier}
      />

      {/* 3. Modal Xem & Chỉnh Sửa Báo Giá */}
      <QuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => {
          setIsQuotationModalOpen(false);
          setQuotationToEdit(null);
          setTargetSkuIdForNewQuote(undefined);
        }}
        quotationToEdit={quotationToEdit}
        defaultSkuId={targetSkuIdForNewQuote}
        skus={singleSkus}
        suppliers={suppliers}
        onSaveQuotation={onSaveQuotation}
        onDeleteQuotation={(id) => {
          onDeleteQuotation(id);
          setIsQuotationModalOpen(false);
          setQuotationToEdit(null);
        }}
        onOpenAddSupplierModal={handleOpenAddSupplier}
      />
    </div>
  );
};
