import React, { useState, useMemo, useEffect } from 'react';
import { ProductCategory, ProductSku, SkuType, Sheet3CogsData, ComboItemReference } from '../types/sku';
import { 
  X, 
  Plus, 
  Trash2, 
  Package, 
  Boxes, 
  Zap, 
  Check, 
  Info,
  DollarSign,
  Factory,
  CheckCircle2,
  FileSpreadsheet,
  Pencil,
  HelpCircle,
  Lock
} from 'lucide-react';

interface SkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  singleSkus: ProductSku[];
  sheet3CogsMap: Record<string, Sheet3CogsData>;
  initialSku?: ProductSku | null;
  onSaveSku: (
    skuData: Omit<ProductSku, 'id'>, 
    sheet3Data?: { cogsPerUnit: number; moq: number; factoryName: string; },
    existingId?: string
  ) => void;
}

export const SkuModal: React.FC<SkuModalProps> = ({
  isOpen,
  onClose,
  categories,
  singleSkus,
  sheet3CogsMap,
  initialSku,
  onSaveSku,
}) => {
  const isEditMode = Boolean(initialSku);

  // Danh mục dành riêng cho SKU đơn lẻ (loại trừ danh mục COMBO)
  const singleCategories = useMemo(() => {
    return categories.filter((c) => c.id !== 'cat-combo' && c.code !== 'COMBO');
  }, [categories]);

  const [skuType, setSkuType] = useState<SkuType>('single');
  const [skuCode, setSkuCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(singleCategories[0]?.id || categories[0]?.id || '');
  const [volume, setVolume] = useState('50ml');

  // Channel prices
  const [standardPrice, setStandardPrice] = useState<number>(189000);
  const [shopeePrice, setShopeePrice] = useState<number>(189000);
  const [tikTokPrice, setTikTokPrice] = useState<number>(189000);
  const [retailPrice, setRetailPrice] = useState<number>(199000);
  const [b2bPrice, setB2bPrice] = useState<number>(115000);

  // Single SKU Sheet 3 info: 2 Lựa chọn theo yêu cầu:
  // 'confirmed': Nhà máy và MOQ đã chốt (chỉ kích hoạt khi ở Sheet 3 đã chốt)
  // 'unconfirmed': Chưa chốt nhà máy. Giá vốn kỳ vọng (có thể để trống)
  const [factoryStatus, setFactoryStatus] = useState<'confirmed' | 'unconfirmed'>('unconfirmed');
  const [selectedFactoryName, setSelectedFactoryName] = useState<string>('');
  const [selectedMoq, setSelectedMoq] = useState<number | ''>('');
  const [cogsPerUnit, setCogsPerUnit] = useState<number | ''>('');
  const [customFactoryNotes, setCustomFactoryNotes] = useState<string>('');
  const [expectedCogs, setExpectedCogs] = useState<number | ''>('');

  // Dữ liệu Sheet 3 đã chốt (chỉ hợp lệ khi đã có nhà máy và giá vốn > 0)
  const sheet3ConfirmedData = useMemo(() => {
    if (!initialSku) return undefined;
    const s3 = sheet3CogsMap[initialSku.id];
    if (s3 && s3.factoryName && s3.factoryName.trim() !== '' && s3.cogsPerUnit > 0) {
      return s3;
    }
    return undefined;
  }, [initialSku, sheet3CogsMap]);

  const hasSheet3Confirmed = Boolean(sheet3ConfirmedData);

  // Combo items
  const [comboSelections, setComboSelections] = useState<{ skuId: string; quantity: number }[]>([
    { skuId: singleSkus[0]?.id || '', quantity: 1 },
  ]);
  const [errorMessage, setErrorMessage] = useState('');

  // Đồng bộ hóa form khi mở popup hoặc khi chuyển giữa Thêm Mới / Sửa
  useEffect(() => {
    if (!isOpen) return;

    if (initialSku) {
      setSkuType(initialSku.type);
      setSkuCode(initialSku.skuCode);
      setName(initialSku.name);

      if (initialSku.type === 'combo') {
        setCategoryId('cat-combo');
        setVolume('');
      } else {
        // Tìm đúng id danh mục khớp trong danh sách hiện tại
        const matched = categories.find((c) => c.id === initialSku.categoryId || c.code === initialSku.categoryId);
        setCategoryId(matched ? matched.id : (singleCategories[0]?.id || categories[0]?.id || ''));
        setVolume(initialSku.volume || '50ml');
      }

      setStandardPrice(initialSku.prices.standard);
      setShopeePrice(initialSku.prices.shopee);
      setTikTokPrice(initialSku.prices.tikTokShop);
      setRetailPrice(initialSku.prices.retail);
      setB2bPrice(initialSku.prices.b2b);

      if (initialSku.type === 'combo' && initialSku.comboItems && initialSku.comboItems.length > 0) {
        setComboSelections(initialSku.comboItems);
      } else if (singleSkus.length > 0) {
        setComboSelections([{ skuId: singleSkus[0].id, quantity: 1 }]);
      }

      // Dữ liệu Sheet 3
      const s3 = sheet3CogsMap[initialSku.id];
      if (s3 && initialSku.type === 'single') {
        if (s3.factoryName && s3.factoryName.trim() !== '') {
          setFactoryStatus('confirmed');
          setSelectedFactoryName(s3.factoryName || '');
          setSelectedMoq(s3.moq || '');
          setCogsPerUnit(s3.cogsPerUnit || '');
          setCustomFactoryNotes(s3.notes || '');
          setExpectedCogs('');
        } else {
          setFactoryStatus('unconfirmed');
          setSelectedFactoryName('');
          setSelectedMoq('');
          setCogsPerUnit('');
          setCustomFactoryNotes('');
          setExpectedCogs(s3.cogsPerUnit > 0 ? s3.cogsPerUnit : '');
        }
      } else {
        setFactoryStatus('unconfirmed');
        setSelectedFactoryName('');
        setSelectedMoq('');
        setCogsPerUnit('');
        setCustomFactoryNotes('');
        setExpectedCogs('');
      }
      setErrorMessage('');
    } else {
      // Reset khi thêm mới
      setSkuType('single');
      setSkuCode('');
      setName('');
      setCategoryId(singleCategories[0]?.id || categories[0]?.id || '');
      setVolume('50ml');
      setStandardPrice(189000);
      setShopeePrice(189000);
      setTikTokPrice(189000);
      setRetailPrice(199000);
      setB2bPrice(115000);
      if (singleSkus.length > 0) {
        setComboSelections([{ skuId: singleSkus[0].id, quantity: 1 }]);
      }
      setFactoryStatus('unconfirmed');
      setSelectedFactoryName('');
      setSelectedMoq('');
      setCogsPerUnit('');
      setCustomFactoryNotes('');
      setExpectedCogs('');
      setErrorMessage('');
    }
  }, [isOpen, initialSku, categories]);

  // Helper tính giá bán lẻ của sản phẩm đơn lẻ (ưu tiên prices.retail, fallback prices.standard)
  const getSingleSkuRetailPrice = (sku?: ProductSku): number => {
    if (!sku) return 0;
    if (sku.prices?.retail && sku.prices.retail > 0) {
      return sku.prices.retail;
    }
    return sku.prices?.standard || 0;
  };

  // Helper tính tổng giá bán lẻ các sản phẩm đơn lẻ trong combo
  const calculateComboRetailSum = (items: ComboItemReference[]): number => {
    return items.reduce((sum, item) => {
      const single = singleSkus.find((s) => s.id === item.skuId);
      const retail = getSingleSkuRetailPrice(single);
      return sum + retail * (item.quantity || 1);
    }, 0);
  };

  // Tính tổng giá bán lẻ của combo hiện tại
  const calculatedComboRetailSum = useMemo(() => {
    return calculateComboRetailSum(comboSelections);
  }, [comboSelections, singleSkus]);

  // Khi người dùng chuyển đổi giữa Single và Combo
  const handleSwitchSkuType = (type: SkuType) => {
    setSkuType(type);
    if (type === 'combo') {
      setCategoryId('cat-combo');
      if (!isEditMode) {
        const currentSelections = comboSelections.length > 0 
          ? comboSelections 
          : (singleSkus.length > 0 ? [{ skuId: singleSkus[0].id, quantity: 1 }] : []);
        if (comboSelections.length === 0 && singleSkus.length > 0) {
          setComboSelections(currentSelections);
        }
        const retailSum = calculateComboRetailSum(currentSelections);
        if (retailSum > 0) {
          setStandardPrice(retailSum);
          setRetailPrice(retailSum);
          setShopeePrice(retailSum);
          setTikTokPrice(retailSum);
          setB2bPrice(Math.round(retailSum * 0.6));
        }
      }
    } else {
      if (categoryId === 'cat-combo') {
        setCategoryId(singleCategories[0]?.id || categories[0]?.id || '');
      }
    }
  };

  // Chuyển đổi giữa 2 lựa chọn quản lý giá vốn theo yêu cầu
  const handleSelectFactoryStatus = (status: 'confirmed' | 'unconfirmed') => {
    if (status === 'confirmed') {
      // Chỉ cho phép chọn nếu ở Sheet 3 đã chốt nhà máy và MOQ
      if (!hasSheet3Confirmed || !sheet3ConfirmedData) return;
      setFactoryStatus('confirmed');
      setSelectedFactoryName(sheet3ConfirmedData.factoryName);
      setSelectedMoq(sheet3ConfirmedData.moq);
      setCogsPerUnit(sheet3ConfirmedData.cogsPerUnit);
      setCustomFactoryNotes(sheet3ConfirmedData.notes || '');
    } else {
      setFactoryStatus('unconfirmed');
      if (expectedCogs === '' && cogsPerUnit !== '') {
        setExpectedCogs(cogsPerUnit);
      }
    }
  };

  // Handler to apply standard price quickly to all 4 channels
  const handleApplyStandardToAll = () => {
    setShopeePrice(standardPrice);
    setTikTokPrice(standardPrice);
    setRetailPrice(standardPrice);
    setB2bPrice(Math.round(standardPrice * 0.6)); // Gợi ý giá B2B ~60% giá tiêu chuẩn
  };

  const handleAddComboItem = () => {
    if (singleSkus.length === 0) return;
    const newSelections = [...comboSelections, { skuId: singleSkus[0].id, quantity: 1 }];
    setComboSelections(newSelections);
    if (!isEditMode) {
      const newRetailSum = calculateComboRetailSum(newSelections);
      setStandardPrice(newRetailSum);
    }
  };

  const handleRemoveComboItem = (index: number) => {
    const newSelections = comboSelections.filter((_, i) => i !== index);
    setComboSelections(newSelections);
    if (!isEditMode) {
      const newRetailSum = calculateComboRetailSum(newSelections);
      setStandardPrice(newRetailSum);
    }
  };

  const handleUpdateComboItem = (index: number, field: 'skuId' | 'quantity', val: any) => {
    const updated = [...comboSelections];
    updated[index] = { ...updated[index], [field]: val };
    setComboSelections(updated);
    if (!isEditMode) {
      const newRetailSum = calculateComboRetailSum(updated);
      setStandardPrice(newRetailSum);
    }
  };

  // Tính tổng COGS dự kiến cho combo nếu đang chọn combo
  const calculatedComboCogs = comboSelections.reduce((sum, item) => {
    const cogs = sheet3CogsMap[item.skuId]?.cogsPerUnit || 0;
    return sum + (cogs * (item.quantity || 1));
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuCode.trim() || !name.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ Mã SKU và Tên Sản Phẩm.');
      return;
    }

    if (skuType === 'combo' && comboSelections.length === 0) {
      setErrorMessage('Vui lòng thêm ít nhất 1 sản phẩm đơn lẻ cấu thành cho bộ Combo.');
      return;
    }

    setErrorMessage('');
    const finalCategoryId = skuType === 'combo'
      ? 'cat-combo'
      : (categoryId || singleCategories[0]?.id || categories[0]?.id || 'cat-general');

    const payload: Omit<ProductSku, 'id'> = {
      skuCode: skuCode.trim().toUpperCase(),
      name: name.trim(),
      categoryId: finalCategoryId,
      type: skuType,
      volume: skuType === 'combo' ? '' : volume.trim(),
      prices: {
        standard: Number(standardPrice) || 0,
        shopee: Number(shopeePrice) || 0,
        tikTokShop: Number(tikTokPrice) || 0,
        retail: Number(retailPrice) || 0,
        b2b: Number(b2bPrice) || 0,
      },
      comboItems: skuType === 'combo' ? comboSelections : undefined,
      status: 'active',
    };

    // Xử lý dữ liệu Sheet 3 tương ứng với 2 lựa chọn:
    // 1. Nhà máy và MOQ đã chốt (link Sheet 3)
    // 2. Chưa chốt nhà máy. Giá vốn kỳ vọng (có thể để trống)
    let sheet3Payload: { cogsPerUnit: number; moq: number; factoryName: string } | undefined = undefined;

    if (skuType === 'single') {
      if (factoryStatus === 'confirmed' && hasSheet3Confirmed && sheet3ConfirmedData) {
        sheet3Payload = {
          cogsPerUnit: sheet3ConfirmedData.cogsPerUnit,
          moq: sheet3ConfirmedData.moq,
          factoryName: sheet3ConfirmedData.factoryName.trim(),
        };
      } else {
        // Chưa chốt nhà máy: lưu giá vốn kỳ vọng nếu người dùng có nhập
        const expCogsNum = Number(expectedCogs) || 0;
        if (expCogsNum > 0) {
          sheet3Payload = {
            cogsPerUnit: expCogsNum,
            moq: 0,
            factoryName: '',
          };
        }
      }
    }

    onSaveSku(payload, sheet3Payload, initialSku?.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl border ${
              isEditMode 
                ? 'bg-amber-50 border-amber-200 text-amber-700' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              {isEditMode ? <Pencil className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                {isEditMode ? `Chỉnh Sửa Sản Phẩm: ${initialSku?.skuCode}` : 'Thêm Mới Sản Phẩm / SKU Mosh&Mode'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditMode 
                  ? 'Cập nhật phân loại danh mục, giá niêm yết các kênh và chi phí giá vốn (COGS)' 
                  : 'Thiết lập thông tin sản phẩm, cơ chế giá các kênh và định mức giá vốn (COGS)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}
          
          {/* Loai SKU: Single vs Combo */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Hình Thức Sản Phẩm
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSwitchSkuType('single')}
                className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-sm font-medium transition-all cursor-pointer ${
                  skuType === 'single'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>SKU Đơn Lẻ (Single Unit)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchSkuType('combo')}
                className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-sm font-medium transition-all cursor-pointer ${
                  skuType === 'combo'
                    ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-xs'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>SKU Theo Combo (Bộ giải pháp)</span>
              </button>
            </div>
          </div>

          {/* Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mã SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                placeholder="Ví dụ: MM-SERUM-50ML"
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Danh mục sản phẩm: Đối với COMBO mặc định là Combo không cần chọn */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Danh Mục Sản Phẩm {skuType === 'single' && <span className="text-rose-500">*</span>}
              </label>
              {skuType === 'combo' ? (
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-xs">
                  <Boxes className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="font-bold text-purple-900">Combo</span>
                  <span className="text-[11px] text-purple-600 italic ml-1">
                    (Mặc định cho hình thức Combo, không cần chọn)
                  </span>
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {singleCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tên Sản Phẩm <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Serum Khử Mùi & Giảm Thâm Nách Mosh&Mode 50ml"
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Volume (Only for Single SKU, per instruction) */}
          {skuType === 'single' ? (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Dung Tích (Volume / Size)
              </label>
              <input
                type="text"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="Ví dụ: 50ml, 100ml, 150g"
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Boxes className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold text-purple-950">
                    Cấu Thành Combo (Tạo nên từ các SKU đơn lẻ đã có)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddComboItem}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-800 text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm SKU vào combo</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-600">
                * Quy tắc: Combo sẽ để trống Dung tích, MOQ và Nhà máy sản xuất (do cấu thành từ nhiều SKU khác nhau).
              </p>

              {comboSelections.map((item, idx) => {
                const single = singleSkus.find((s) => s.id === item.skuId);
                const retailPrice = getSingleSkuRetailPrice(single);
                const lineRetailTotal = retailPrice * (item.quantity || 1);

                return (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-lg border border-purple-100">
                    <select
                      value={item.skuId}
                      onChange={(e) => handleUpdateComboItem(idx, 'skuId', e.target.value)}
                      className="flex-1 min-w-[200px] rounded bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none cursor-pointer"
                    >
                      {singleSkus.map((s) => {
                        const sRetail = getSingleSkuRetailPrice(s);
                        return (
                          <option key={s.id} value={s.id}>
                            {s.skuCode} - {s.name} (Giá bán lẻ: {sRetail.toLocaleString('vi-VN')}đ | COGS: {sheet3CogsMap[s.id]?.cogsPerUnit?.toLocaleString('vi-VN') || 0}đ)
                          </option>
                        );
                      })}
                    </select>

                    <div className="flex items-center space-x-1 shrink-0">
                      <span className="text-[11px] text-slate-600">Số lượng:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateComboItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="w-14 rounded bg-white border border-slate-300 px-2 py-1.5 text-xs text-slate-900 font-mono text-center"
                      />
                    </div>

                    <div className="text-[11px] font-mono text-purple-800 bg-purple-50 px-2 py-1.5 rounded border border-purple-200 shrink-0 font-semibold">
                      = {lineRetailTotal.toLocaleString('vi-VN')} đ
                    </div>

                    {comboSelections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveComboItem(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                        title="Xóa sản phẩm này khỏi combo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              <div className="pt-2 border-t border-purple-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center space-x-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tổng Giá Bán Lẻ Các Sản Phẩm Đơn Lẻ:</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-700">
                    {calculatedComboRetailSum.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-purple-900 bg-purple-100/70 px-3 py-2 rounded-lg border border-purple-200">
                  <span>
                    ⚡ <strong>Tự động hiển thị:</strong> Giá Tiêu Chuẩn của combo được tự động đồng bộ bằng tổng giá bán lẻ này ({calculatedComboRetailSum.toLocaleString('vi-VN')} đ).
                  </span>
                  {standardPrice !== calculatedComboRetailSum && (
                    <button
                      type="button"
                      onClick={() => setStandardPrice(calculatedComboRetailSum)}
                      className="ml-2 px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-medium shrink-0 cursor-pointer"
                    >
                      Đồng bộ lại
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 flex justify-between pt-0.5">
                  <span>Tổng giá vốn linh kiện combo ước tính (COGS):</span>
                  <span className="font-mono font-semibold text-slate-800">{calculatedComboCogs.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Setup with Quick Apply */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  Bảng Giá Niêm Yết Đa Kênh Phân Phối
                </span>
                <p className="text-[11px] text-slate-500">
                  Giá Tiêu Chuẩn là mốc tham chiếu cơ sở để áp dụng cho 4 kênh bán
                </p>
              </div>

              <button
                type="button"
                onClick={handleApplyStandardToAll}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold cursor-pointer transition-colors shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Áp Nhanh Giá Tiêu Chuẩn Cho 4 Kênh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Gia tieu chuan */}
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-300 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-emerald-900 block">
                    Giá Tiêu Chuẩn (Standard Base)
                  </label>
                  {skuType === 'combo' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 border border-purple-200 text-purple-800 font-medium">
                      Tự động từ giá lẻ
                    </span>
                  )}
                </div>
                <div className="flex items-center rounded bg-white border border-emerald-400 overflow-hidden">
                  <input
                    type="number"
                    step="1000"
                    value={standardPrice || ''}
                    onChange={(e) => setStandardPrice(Number(e.target.value))}
                    className="w-full bg-transparent px-2.5 py-1.5 text-sm text-slate-900 font-mono font-bold focus:outline-none"
                  />
                  <span className="px-2 py-1.5 bg-slate-100 text-[11px] text-emerald-800 font-mono font-bold">đ</span>
                </div>
                {skuType === 'combo' && (
                  <p className="text-[10px] text-purple-800 mt-1 font-mono">
                    = Tổng giá bán lẻ: {calculatedComboRetailSum.toLocaleString('vi-VN')} đ
                  </p>
                )}
              </div>

              {/* Shopee */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <label className="text-[11px] font-semibold text-orange-700 block mb-1">
                  Giá Bán Shopee
                </label>
                <div className="flex items-center rounded bg-white border border-slate-300 overflow-hidden">
                  <input
                    type="number"
                    step="1000"
                    value={shopeePrice || ''}
                    onChange={(e) => setShopeePrice(Number(e.target.value))}
                    className="w-full bg-transparent px-2.5 py-1.5 text-sm text-slate-900 font-mono focus:outline-none"
                  />
                  <span className="px-2 py-1.5 bg-slate-100 text-[11px] text-slate-600 font-mono">đ</span>
                </div>
              </div>

              {/* TikTok Shop */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <label className="text-[11px] font-semibold text-cyan-800 block mb-1">
                  Giá Bán TikTok Shop
                </label>
                <div className="flex items-center rounded bg-white border border-slate-300 overflow-hidden">
                  <input
                    type="number"
                    step="1000"
                    value={tikTokPrice || ''}
                    onChange={(e) => setTikTokPrice(Number(e.target.value))}
                    className="w-full bg-transparent px-2.5 py-1.5 text-sm text-slate-900 font-mono focus:outline-none"
                  />
                  <span className="px-2 py-1.5 bg-slate-100 text-[11px] text-slate-600 font-mono">đ</span>
                </div>
              </div>

              {/* Retail */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <label className="text-[11px] font-semibold text-purple-800 block mb-1">
                  Giá Bán Lẻ Retailer
                </label>
                <div className="flex items-center rounded bg-white border border-slate-300 overflow-hidden">
                  <input
                    type="number"
                    step="1000"
                    value={retailPrice || ''}
                    onChange={(e) => setRetailPrice(Number(e.target.value))}
                    className="w-full bg-transparent px-2.5 py-1.5 text-sm text-slate-900 font-mono focus:outline-none"
                  />
                  <span className="px-2 py-1.5 bg-slate-100 text-[11px] text-slate-600 font-mono">đ</span>
                </div>
              </div>

              {/* B2B (GT/MT/Spa) */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <label className="text-[11px] font-semibold text-amber-800 block mb-1">
                  Giá B2B (GT/MT/Spa)
                </label>
                <div className="flex items-center rounded bg-white border border-slate-300 overflow-hidden">
                  <input
                    type="number"
                    step="1000"
                    value={b2bPrice || ''}
                    onChange={(e) => setB2bPrice(Number(e.target.value))}
                    className="w-full bg-transparent px-2.5 py-1.5 text-sm text-slate-900 font-mono focus:outline-none"
                  />
                  <span className="px-2 py-1.5 bg-slate-100 text-[11px] text-slate-600 font-mono">đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Single SKU COGS, MOQ & Factory (Linked from Sheet 3) */}
          {skuType === 'single' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Dữ Liệu Giá Vốn &amp; Báo Giá Nhà Máy</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-200 font-semibold">
                        Giá Vốn Hàng Bán
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Chọn hình thức quản lý tương ứng với trạng thái đàm phán cung ứng của sản phẩm
                    </p>
                  </div>
                </div>
              </div>

              {/* 2 Lựa chọn theo yêu cầu của người dùng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Lựa chọn 1: Nhà máy và MOQ đã chốt - Chỉ bấm được khi Giá Vốn Hàng Bán đã chốt */}
                <button
                  type="button"
                  disabled={!hasSheet3Confirmed}
                  onClick={() => handleSelectFactoryStatus('confirmed')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                    !hasSheet3Confirmed
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed select-none'
                      : factoryStatus === 'confirmed'
                      ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400 shadow-xs cursor-pointer'
                      : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50 cursor-pointer'
                  }`}
                  title={
                    !hasSheet3Confirmed
                      ? 'Mục Giá Vốn Hàng Bán chưa chốt nhà máy cho sản phẩm này. Hãy chọn nhà máy và MOQ tại mục Giá Vốn Hàng Bán trước.'
                      : 'Đã chốt tại Giá Vốn Hàng Bán'
                  }
                >
                  <div className="flex items-start space-x-2.5">
                    <div
                      className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                        !hasSheet3Confirmed
                          ? 'bg-slate-200 text-slate-400'
                          : factoryStatus === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {!hasSheet3Confirmed ? (
                        <Lock className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Factory className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span
                          className={`text-xs font-bold block ${
                            !hasSheet3Confirmed
                              ? 'text-slate-400'
                              : factoryStatus === 'confirmed'
                              ? 'text-emerald-900'
                              : 'text-slate-800'
                          }`}
                        >
                          Nhà máy và MOQ đã chốt
                        </span>
                        {!hasSheet3Confirmed && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-200 text-slate-600 border border-slate-300">
                            Chưa chốt ở Giá Vốn Hàng Bán
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        {hasSheet3Confirmed
                          ? `(Đã chốt: ${sheet3ConfirmedData?.factoryName})`
                          : '(Chỉ kích hoạt sau khi chốt nhà máy tại mục Giá Vốn Hàng Bán)'}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      !hasSheet3Confirmed
                        ? 'border-slate-300 bg-slate-100 text-slate-400'
                        : factoryStatus === 'confirmed'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {factoryStatus === 'confirmed' && hasSheet3Confirmed && (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    )}
                  </div>
                </button>

                {/* Lựa chọn 2: Chưa chốt nhà máy */}
                <button
                  type="button"
                  onClick={() => handleSelectFactoryStatus('unconfirmed')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    factoryStatus === 'unconfirmed'
                      ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400 shadow-xs'
                      : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <div
                      className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                        factoryStatus === 'unconfirmed'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-xs font-bold block ${
                            factoryStatus === 'unconfirmed' ? 'text-amber-900' : 'text-slate-800'
                          }`}
                        >
                          Chưa chốt nhà máy
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Giá vốn kỳ vọng (có thể để trống)
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      factoryStatus === 'unconfirmed'
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {factoryStatus === 'unconfirmed' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              </div>

              {/* Chi tiết cho Lựa chọn 1: Nhà máy và MOQ đã chốt (hiển thị thông tin đã chốt từ Sheet 3) */}
              {factoryStatus === 'confirmed' && hasSheet3Confirmed && sheet3ConfirmedData && (
                <div className="p-3.5 rounded-xl bg-white border border-emerald-300 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-slate-900">
                        Thông Tin Đã Chốt Từ Mục Giá Vốn Hàng Bán
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Đã chốt &amp; Đồng bộ Giá Vốn
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Nhà máy đã chốt */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block mb-0.5 flex items-center gap-1">
                        <Factory className="w-3 h-3 text-emerald-700" />
                        Nhà Máy Đã Chốt
                      </span>
                      <div className="text-xs font-bold text-slate-900 truncate" title={sheet3ConfirmedData.factoryName}>
                        {sheet3ConfirmedData.factoryName}
                      </div>
                      {sheet3ConfirmedData.notes && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5" title={sheet3ConfirmedData.notes}>
                          {sheet3ConfirmedData.notes}
                        </p>
                      )}
                    </div>

                    {/* Mức MOQ đã chốt */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block mb-0.5 flex items-center gap-1">
                        <Boxes className="w-3 h-3 text-emerald-700" />
                        Mức MOQ Đã Chốt
                      </span>
                      <div className="text-xs font-bold font-mono text-emerald-800">
                        {Number(sheet3ConfirmedData.moq || 0).toLocaleString('vi-VN')} <span className="text-[10px] font-normal text-slate-500">sản phẩm</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Đơn tối thiểu sản xuất
                      </p>
                    </div>

                    {/* Giá vốn COGS đã chốt */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block mb-0.5 flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-700" />
                        Giá Vốn Đã Chốt (COGS)
                      </span>
                      <div className="text-xs font-bold font-mono text-emerald-800">
                        {Number(sheet3ConfirmedData.cogsPerUnit || 0).toLocaleString('vi-VN')} đ <span className="text-[10px] font-normal text-slate-500">/ sp</span>
                      </div>
                      {standardPrice > 0 && sheet3ConfirmedData.cogsPerUnit > 0 && (
                        <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                          Lãi gộp: {(((standardPrice - sheet3ConfirmedData.cogsPerUnit) / standardPrice) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <Info className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span>Dữ liệu này được liên kết trực tiếp từ Giá Vốn Hàng Bán. Để thay đổi nhà máy hoặc mức MOQ, bạn có thể thực hiện tại giao diện Giá Vốn Hàng Bán.</span>
                  </div>
                </div>
              )}

              {/* Chi tiết cho Lựa chọn 2: Chưa chốt nhà máy */}
              {factoryStatus === 'unconfirmed' && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-lg bg-white border border-amber-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <span>Giá Vốn Kỳ Vọng (Target COGS)</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-amber-100 text-amber-800 border border-amber-200">
                            Có thể để trống
                          </span>
                        </label>
                        <p className="text-[11px] text-slate-500 max-w-md">
                          Nhập mức giá vốn mục tiêu bạn kỳ vọng đàm phán với xưởng, hoặc để trống nếu chưa có ước tính.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="flex items-center rounded-lg bg-white border border-amber-400 overflow-hidden w-44">
                          <input
                            type="number"
                            step="500"
                            placeholder="Để trống nếu chưa có"
                            value={expectedCogs === '' ? '' : expectedCogs}
                            onChange={(e) => setExpectedCogs(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal text-right"
                          />
                          <span className="px-2 py-2 bg-slate-100 text-[11px] text-amber-800 font-mono font-bold">đ</span>
                        </div>
                        {expectedCogs !== '' && (
                          <button
                            type="button"
                            onClick={() => setExpectedCogs('')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Xóa để trống giá vốn"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hiển thị tỷ lệ lãi gộp kỳ vọng nếu có nhập */}
                    {expectedCogs !== '' && Number(expectedCogs) > 0 ? (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center space-x-2 text-slate-700">
                          <span className="text-slate-500">Giá vốn kỳ vọng:</span>
                          <span className="font-mono font-bold text-amber-800">{Number(expectedCogs).toLocaleString('vi-VN')} đ/sp</span>
                          {standardPrice > 0 && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Lãi gộp mục tiêu: {(((standardPrice - Number(expectedCogs)) / standardPrice) * 100).toFixed(1)}%</span>
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 italic text-[10px]">
                          * Nhà máy và MOQ sẽ ghi nhận là "Chưa chốt nhà máy"
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Trạng thái: Đang để trống giá vốn</span>
                        <span className="italic">Sản phẩm sẽ hiển thị giá vốn "—" trên bảng danh mục</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEditMode ? 'Lưu Thay Đổi SKU' : 'Lưu & Thêm SKU Vào Danh Mục'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
