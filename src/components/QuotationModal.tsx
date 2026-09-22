import React, { useState, useEffect, useMemo } from 'react';
import { ProductSku, Supplier, ProductQuotation, QuotationCostBreakdown } from '../types/sku';
import { parseVolume, computeQuotationBreakdown } from '../utils/cogsCalculator';
import { 
  X, 
  Receipt, 
  Factory, 
  Boxes, 
  Check, 
  Trash2, 
  AlertCircle, 
  Plus,
  Clock,
  Package,
  FileText,
  Calculator,
  Layers,
  FlaskConical,
  Truck,
  RotateCcw,
  Sparkles,
  DollarSign
} from 'lucide-react';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: ProductQuotation | null;
  defaultSkuId?: string;
  skus: ProductSku[];
  suppliers: Supplier[];
  onSaveQuotation: (
    quotationData: Omit<ProductQuotation, 'id'>, 
    editId?: string,
    setAsChosen?: boolean
  ) => void;
  onDeleteQuotation?: (id: string) => void;
  onOpenAddSupplierModal?: () => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  quotationToEdit,
  defaultSkuId,
  skus,
  suppliers,
  onSaveQuotation,
  onDeleteQuotation,
  onOpenAddSupplierModal,
}) => {
  const singleSkus = useMemo(() => skus.filter((s) => s.type === 'single'), [skus]);

  // Form Field 1: Chọn sản phẩm
  const [selectedSkuId, setSelectedSkuId] = useState<string>('');

  // Form Field 2: Chọn Nhà máy sản xuất
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  // Form Field 3: Nhập dung tích (ml)
  const [volumeMl, setVolumeMl] = useState<number | ''>(50);

  // Form Field 4: Nhập MOQ
  const [moq, setMoq] = useState<number | ''>(3000);

  // Bảng chi phí 5 khoản mục cấu thành sản phẩm (đ/sp)
  const [rawMaterialCost, setRawMaterialCost] = useState<number | ''>(18000); // Chi phí nguyên vật liệu
  const [packagingContainerCost, setPackagingContainerCost] = useState<number | ''>(8500); // Chi phí chai/vỏ
  const [labelAndBoxCost, setLabelAndBoxCost] = useState<number | ''>(3500); // Chi phí tem nhãn + hộp
  const [laborCost, setLaborCost] = useState<number | ''>(2000); // Chi phí nhân công
  const [otherCost, setOtherCost] = useState<number | ''>(500); // Chi phí khác không biết đưa vào đâu

  // Chi phí phân bổ theo lô sản xuất (VNĐ/lô)
  const [testingFeePerBatch, setTestingFeePerBatch] = useState<number | ''>(2500000); // Phí kiểm nghiệm theo lô
  const [shippingFeeEstimated, setShippingFeeEstimated] = useState<number | ''>(1200000); // Phí vận chuyển dự kiến

  // Thông tin mở rộng
  const [leadTimeDays, setLeadTimeDays] = useState<number | ''>(45);
  const [packagingDescription, setPackagingDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isChosen, setIsChosen] = useState<boolean>(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmDelete, setIsConfirmDelete] = useState<boolean>(false);

  // SKU đang chọn
  const currentSku = useMemo(() => {
    return singleSkus.find((s) => s.id === selectedSkuId);
  }, [singleSkus, selectedSkuId]);

  // Supplier đang chọn
  const currentSupplier = useMemo(() => {
    return suppliers.find((sup) => sup.id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

  // Tự động suy ra dung tích khi đổi SKU
  const handleSelectSku = (skuId: string) => {
    setSelectedSkuId(skuId);
    if (errors.skuId) setErrors((prev) => ({ ...prev, skuId: '' }));

    const found = singleSkus.find((s) => s.id === skuId);
    if (found?.volume) {
      const parsed = parseVolume(found.volume);
      if (parsed && parsed.amount > 0) {
        setVolumeMl(parsed.amount);
      }
    }
  };

  // Khởi tạo state khi mở modal hoặc chọn sửa báo giá
  useEffect(() => {
    if (quotationToEdit) {
      setSelectedSkuId(quotationToEdit.skuId);
      setSelectedSupplierId(quotationToEdit.supplierId);
      setMoq(quotationToEdit.moq);
      setLeadTimeDays(quotationToEdit.leadTimeDays ?? 45);
      setPackagingDescription(quotationToEdit.packagingDescription || '');
      setNotes(quotationToEdit.notes || '');
      setIsChosen(Boolean(quotationToEdit.isChosen));

      // Lấy dung tích
      if (quotationToEdit.volumeMl) {
        setVolumeMl(quotationToEdit.volumeMl);
      } else {
        const found = singleSkus.find((s) => s.id === quotationToEdit.skuId);
        const parsed = parseVolume(found?.volume);
        setVolumeMl(parsed?.amount || 50);
      }

      // Nếu có sẵn costBreakdown chi tiết
      if (quotationToEdit.costBreakdown) {
        const cb = quotationToEdit.costBreakdown;
        setRawMaterialCost(cb.rawMaterialCost);
        setPackagingContainerCost(cb.packagingContainerCost);
        setLabelAndBoxCost(cb.labelAndBoxCost);
        setLaborCost(cb.laborCost);
        setOtherCost(cb.otherCost);
        setTestingFeePerBatch(cb.testingFeePerBatch);
        setShippingFeeEstimated(cb.shippingFeeEstimated);
      } else {
        // Tự động phân bổ ước tính dựa trên unitPrice cũ
        const price = quotationToEdit.unitPrice || 35000;
        const netBase = Math.max(Math.round(price * 0.85), 10000);
        setRawMaterialCost(Math.round(netBase * 0.52));
        setPackagingContainerCost(Math.round(netBase * 0.25));
        setLabelAndBoxCost(Math.round(netBase * 0.12));
        setLaborCost(Math.round(netBase * 0.07));
        setOtherCost(Math.round(netBase * 0.04));
        setTestingFeePerBatch(2500000);
        setShippingFeeEstimated(1200000);
      }
    } else {
      // Mặc định tạo mới
      const defaultSku = defaultSkuId 
        ? singleSkus.find((s) => s.id === defaultSkuId) 
        : (singleSkus.length > 0 ? singleSkus[0] : null);

      setSelectedSkuId(defaultSku ? defaultSku.id : '');
      setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].id : '');

      const parsed = parseVolume(defaultSku?.volume);
      setVolumeMl(parsed?.amount || 50);

      setMoq(3000);
      setRawMaterialCost(18000);
      setPackagingContainerCost(8500);
      setLabelAndBoxCost(3500);
      setLaborCost(2000);
      setOtherCost(500);
      setTestingFeePerBatch(2500000);
      setShippingFeeEstimated(1200000);
      setLeadTimeDays(45);
      setPackagingDescription('');
      setNotes('');
      setIsChosen(false);
    }

    setErrors({});
    setIsConfirmDelete(false);
  }, [quotationToEdit, defaultSkuId, singleSkus, suppliers, isOpen]);

  // TÍNH TOÁN BẢNG ĐỊNH MỨC CHI PHÍ THEO THUẬT TOÁN ĐÃ ĐẶT RA
  const breakdown: QuotationCostBreakdown = useMemo(() => {
    return computeQuotationBreakdown({
      moq: Number(moq) || 1,
      volumeMl: Number(volumeMl) || 1,
      rawMaterialCost: Number(rawMaterialCost) || 0,
      packagingContainerCost: Number(packagingContainerCost) || 0,
      labelAndBoxCost: Number(labelAndBoxCost) || 0,
      laborCost: Number(laborCost) || 0,
      otherCost: Number(otherCost) || 0,
      vatRate: 0.08, // VAT 8%
      testingFeePerBatch: Number(testingFeePerBatch) || 0,
      shippingFeeEstimated: Number(shippingFeeEstimated) || 0,
    });
  }, [
    moq, 
    volumeMl, 
    rawMaterialCost, 
    packagingContainerCost, 
    labelAndBoxCost, 
    laborCost, 
    otherCost, 
    testingFeePerBatch, 
    shippingFeeEstimated
  ]);

  // Đơn giá trực tiếp trước VAT trên 1 sản phẩm
  const unitDirectCostBeforeVat = useMemo(() => {
    return (
      (Number(rawMaterialCost) || 0) +
      (Number(packagingContainerCost) || 0) +
      (Number(labelAndBoxCost) || 0) +
      (Number(laborCost) || 0) +
      (Number(otherCost) || 0)
    );
  }, [rawMaterialCost, packagingContainerCost, labelAndBoxCost, laborCost, otherCost]);

  // Thuế VAT 8% quy đổi trên 1 sản phẩm
  const unitVatAmount = useMemo(() => {
    return Math.round(unitDirectCostBeforeVat * 0.08);
  }, [unitDirectCostBeforeVat]);

  // Đơn giá trực tiếp sau VAT trên 1 sản phẩm
  const unitCostWithVat = useMemo(() => {
    return unitDirectCostBeforeVat + unitVatAmount;
  }, [unitDirectCostBeforeVat, unitVatAmount]);

  // Phí kiểm nghiệm quy đổi trên 1 sản phẩm
  const unitTestingFee = useMemo(() => {
    const moqNum = Number(moq) || 1;
    return Math.round((Number(testingFeePerBatch) || 0) / moqNum);
  }, [testingFeePerBatch, moq]);

  // Phí vận chuyển quy đổi trên 1 sản phẩm
  const unitShippingFee = useMemo(() => {
    const moqNum = Number(moq) || 1;
    return Math.round((Number(shippingFeeEstimated) || 0) / moqNum);
  }, [shippingFeeEstimated, moq]);

  // Biên lãi gộp dự kiến dựa trên giá niêm yết chuẩn
  const grossMarginPercent = useMemo(() => {
    if (!currentSku || !currentSku.prices?.standard || currentSku.prices.standard <= 0) return null;
    const std = currentSku.prices.standard;
    const cogs = breakdown.cogsPerUnit;
    return ((std - cogs) / std) * 100;
  }, [currentSku, breakdown.cogsPerUnit]);

  // Nạp nhanh preset chi phí mẫu chuẩn
  const handleLoadPreset = (tier: 'economy' | 'standard' | 'premium') => {
    if (tier === 'economy') {
      setRawMaterialCost(12000);
      setPackagingContainerCost(5500);
      setLabelAndBoxCost(2500);
      setLaborCost(1500);
      setOtherCost(500);
      setTestingFeePerBatch(2000000);
      setShippingFeeEstimated(1000000);
    } else if (tier === 'standard') {
      setRawMaterialCost(18000);
      setPackagingContainerCost(8500);
      setLabelAndBoxCost(3500);
      setLaborCost(2000);
      setOtherCost(800);
      setTestingFeePerBatch(2500000);
      setShippingFeeEstimated(1200000);
    } else {
      setRawMaterialCost(26000);
      setPackagingContainerCost(13500);
      setLabelAndBoxCost(5500);
      setLaborCost(3000);
      setOtherCost(1200);
      setTestingFeePerBatch(3500000);
      setShippingFeeEstimated(1500000);
    }
  };

  // Reset về 0
  const handleResetCosts = () => {
    setRawMaterialCost(0);
    setPackagingContainerCost(0);
    setLabelAndBoxCost(0);
    setLaborCost(0);
    setOtherCost(0);
    setTestingFeePerBatch(0);
    setShippingFeeEstimated(0);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!selectedSkuId) {
      newErrors.skuId = 'Vui lòng chọn sản phẩm';
    }
    if (!selectedSupplierId) {
      newErrors.supplierId = 'Vui lòng chọn nhà máy sản xuất';
    }
    if (!volumeMl || Number(volumeMl) <= 0) {
      newErrors.volumeMl = 'Dung tích phải lớn hơn 0 ml';
    }
    if (!moq || Number(moq) <= 0) {
      newErrors.moq = 'Mức MOQ phải lớn hơn 0 sp';
    }
    if (breakdown.cogsPerUnit <= 0) {
      newErrors.costs = 'Tổng giá vốn hàng bán phải lớn hơn 0 đ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const matchedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

    onSaveQuotation(
      {
        skuId: selectedSkuId,
        supplierId: selectedSupplierId,
        factoryName: matchedSupplier ? matchedSupplier.factoryName : '',
        volumeMl: Number(volumeMl),
        moq: Number(moq),
        unitPrice: breakdown.cogsPerUnit, // Giá vốn hàng bán trên sản phẩm
        unitPricePerMl: breakdown.cogsPerMl, // Giá vốn hàng bán trên ml
        leadTimeDays: leadTimeDays !== '' ? Number(leadTimeDays) : undefined,
        packagingDescription: packagingDescription.trim(),
        notes: notes.trim(),
        isChosen: isChosen,
        costBreakdown: breakdown,
      },
      quotationToEdit ? quotationToEdit.id : undefined,
      isChosen
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 text-slate-800 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                {quotationToEdit ? 'Xem & Chỉnh Sửa Báo Giá Sản Xuất' : 'Nhập Báo Giá Sản Xuất Mới'}
              </h2>
              <p className="text-xs text-slate-500">
                Định mức chi phí COGS, VAT 8%, phí kiểm nghiệm, vận chuyển &amp; đơn giá/ml
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

        {/* MODAL BODY (SCROLLABLE) */}
        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-5 overflow-y-auto pr-1 flex-1">
          
          {/* ========================================================================= */}
          {/* KHỐI 1: 4 TRƯỜNG ĐẦU VÀO CƠ BẢN THEO ĐÚNG YÊU CẦU:                        */}
          {/* - Chọn sản phẩm                                                          */}
          {/* - Chọn Nhà máy sản xuất                                                   */}
          {/* - Nhập dung tích (ml)                                                     */}
          {/* - Nhập MOQ                                                               */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Thông Tin Cơ Bản Báo Giá Sản Xuất
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Bước 1 / 2</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* 1. Chọn sản phẩm */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-700" />
                    Chọn Sản Phẩm <span className="text-rose-500">*</span>
                  </span>
                  {currentSku?.prices?.standard && (
                    <span className="text-[10px] font-mono text-slate-500">
                      Giá niêm yết: {currentSku.prices.standard.toLocaleString('vi-VN')} đ
                    </span>
                  )}
                </label>
                <select
                  value={selectedSkuId}
                  onChange={(e) => handleSelectSku(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="">-- Chọn sản phẩm đơn lẻ --</option>
                  {singleSkus.map((sku) => (
                    <option key={sku.id} value={sku.id}>
                      {sku.skuCode} - {sku.name} {sku.volume ? `(${sku.volume})` : ''}
                    </option>
                  ))}
                </select>
                {errors.skuId && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.skuId}
                  </p>
                )}
              </div>

              {/* 2. Chọn Nhà máy sản xuất */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-emerald-700" />
                    Chọn Nhà Máy Sản Xuất <span className="text-rose-500">*</span>
                  </label>
                  {onOpenAddSupplierModal && (
                    <button
                      type="button"
                      onClick={onOpenAddSupplierModal}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      + Thêm nhà máy
                    </button>
                  )}
                </div>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(e.target.value);
                    if (errors.supplierId) setErrors((prev) => ({ ...prev, supplierId: '' }));
                  }}
                  className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="">-- Chọn nhà máy gia công --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.factoryName}
                    </option>
                  ))}
                </select>
                {currentSupplier && (
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    📍 {currentSupplier.address} • Liên hệ: {currentSupplier.contactPerson} ({currentSupplier.phone})
                  </p>
                )}
                {errors.supplierId && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.supplierId}
                  </p>
                )}
              </div>

              {/* 3. Nhập dung tích (ml) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                    Nhập Dung Tích (ml) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Dùng tính Giá vốn / ml</span>
                </label>
                <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="VD: 50"
                    value={volumeMl === '' ? '' : volumeMl}
                    onChange={(e) => {
                      setVolumeMl(e.target.value === '' ? '' : Number(e.target.value));
                      if (errors.volumeMl) setErrors((prev) => ({ ...prev, volumeMl: '' }));
                    }}
                    className="w-full bg-transparent px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none"
                  />
                  <span className="px-3 py-2 bg-slate-100 text-xs text-slate-600 font-mono border-l border-slate-200">
                    ml
                  </span>
                </div>
                {errors.volumeMl && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.volumeMl}
                  </p>
                )}
              </div>

              {/* 4. Nhập MOQ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-emerald-700" />
                    Nhập MOQ (Số lượng tối thiểu) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Quy mô lô sản xuất</span>
                </label>
                <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="VD: 3000"
                    value={moq === '' ? '' : moq}
                    onChange={(e) => {
                      setMoq(e.target.value === '' ? '' : Number(e.target.value));
                      if (errors.moq) setErrors((prev) => ({ ...prev, moq: '' }));
                    }}
                    className="w-full bg-transparent px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none"
                  />
                  <span className="px-3 py-2 bg-slate-100 text-xs text-slate-600 font-mono border-l border-slate-200">
                    sản phẩm
                  </span>
                </div>
                {errors.moq && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.moq}
                  </p>
                )}
              </div>
            </div>

            {/* Quick shortcuts for MOQ */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500">Chọn nhanh MOQ:</span>
              {[1000, 2000, 3000, 5000, 10000].map((quickMoq) => (
                <button
                  key={quickMoq}
                  type="button"
                  onClick={() => setMoq(quickMoq)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    moq === quickMoq
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {quickMoq.toLocaleString('vi-VN')}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KHỐI 2: RA BẢNG ĐỂ NHẬP CÁC KHOẢN CHI PHÍ & TỰ ĐỘNG TÍNH TOÁN               */}
          {/* ========================================================================= */}
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            {/* Header của bảng */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Bảng Định Mức Chi Phí Cấu Thành Giá Vốn (COGS)
                </span>
              </div>

              {/* Quick actions: Presets & Reset */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[10px] text-slate-500 mr-1 hidden sm:inline">Mẫu:</span>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('economy')}
                  className="px-2 py-1 rounded text-[10px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer"
                  title="Nạp chi phí tiết kiệm"
                >
                  Tiết kiệm
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('standard')}
                  className="px-2 py-1 rounded text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium cursor-pointer"
                  title="Nạp chi phí chuẩn"
                >
                  Tiêu chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('premium')}
                  className="px-2 py-1 rounded text-[10px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer"
                  title="Nạp chi phí cao cấp"
                >
                  Cao cấp
                </button>
                <button
                  type="button"
                  onClick={handleResetCosts}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 ml-1 cursor-pointer"
                  title="Xóa trắng các mục chi phí"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] text-slate-600 font-semibold">
                    <th className="py-2.5 px-3.5 w-[42%]">Khoản Mục Chi Phí</th>
                    <th className="py-2.5 px-3.5 w-[28%] text-right">Đơn Giá / Sản Phẩm (đ/sp)</th>
                    <th className="py-2.5 px-3.5 w-[30%] text-right font-mono">
                      Thành Tiền Theo MOQ ({Number(moq).toLocaleString('vi-VN')} sp)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  
                  {/* 1. Chi phí nguyên vật liệu */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3.5">
                      <div className="font-semibold text-slate-800">1. Chi phí nguyên vật liệu</div>
                      <div className="text-[10px] text-slate-500">Bulk dung dịch, hoạt chất dưỡng sáng, tá dược, tinh dầu</div>
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="inline-flex items-center rounded-lg bg-white border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 overflow-hidden w-36">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={rawMaterialCost === '' ? '' : rawMaterialCost}
                          onChange={(e) => setRawMaterialCost(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-transparent px-2.5 py-1.5 text-xs text-right text-emerald-700 font-mono font-semibold focus:outline-none"
                        />
                        <span className="px-2 py-1.5 bg-slate-50 text-[10px] text-slate-500 font-mono border-l border-slate-200">
                          đ
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono text-slate-700">
                      {((Number(rawMaterialCost) || 0) * (Number(moq) || 1)).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>

                  {/* 2. Chi phí chai/vỏ */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3.5">
                      <div className="font-semibold text-slate-800">2. Chi phí chai/vỏ</div>
                      <div className="text-[10px] text-slate-500">Chai thủy tinh/nhựa/nhôm, nắp bóp dropper, vòi xịt nano</div>
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="inline-flex items-center rounded-lg bg-white border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 overflow-hidden w-36">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={packagingContainerCost === '' ? '' : packagingContainerCost}
                          onChange={(e) => setPackagingContainerCost(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-transparent px-2.5 py-1.5 text-xs text-right text-emerald-700 font-mono font-semibold focus:outline-none"
                        />
                        <span className="px-2 py-1.5 bg-slate-50 text-[10px] text-slate-500 font-mono border-l border-slate-200">
                          đ
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono text-slate-700">
                      {((Number(packagingContainerCost) || 0) * (Number(moq) || 1)).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>

                  {/* 3. Chi phí tem nhãn + hộp */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3.5">
                      <div className="font-semibold text-slate-800">3. Chi phí tem nhãn + hộp</div>
                      <div className="text-[10px] text-slate-500">Decal in cuộn/lụa, hộp giấy Ivory in UV ép kim, tem cào QR</div>
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="inline-flex items-center rounded-lg bg-white border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 overflow-hidden w-36">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={labelAndBoxCost === '' ? '' : labelAndBoxCost}
                          onChange={(e) => setLabelAndBoxCost(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-transparent px-2.5 py-1.5 text-xs text-right text-emerald-700 font-mono font-semibold focus:outline-none"
                        />
                        <span className="px-2 py-1.5 bg-slate-50 text-[10px] text-slate-500 font-mono border-l border-slate-200">
                          đ
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono text-slate-700">
                      {((Number(labelAndBoxCost) || 0) * (Number(moq) || 1)).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>

                  {/* 4. Chi phí nhân công */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3.5">
                      <div className="font-semibold text-slate-800">4. Chi phí nhân công</div>
                      <div className="text-[10px] text-slate-500">Chiết rót phòng sạch, đóng nắp, dán nhãn, dán seal, đóng màng co</div>
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="inline-flex items-center rounded-lg bg-white border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 overflow-hidden w-36">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={laborCost === '' ? '' : laborCost}
                          onChange={(e) => setLaborCost(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-transparent px-2.5 py-1.5 text-xs text-right text-emerald-700 font-mono font-semibold focus:outline-none"
                        />
                        <span className="px-2 py-1.5 bg-slate-50 text-[10px] text-slate-500 font-mono border-l border-slate-200">
                          đ
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono text-slate-700">
                      {((Number(laborCost) || 0) * (Number(moq) || 1)).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>

                  {/* 5. Chi phí khác không biết đưa vào đâu */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3.5">
                      <div className="font-semibold text-slate-800">5. Chi phí khác không biết đưa vào đâu</div>
                      <div className="text-[10px] text-slate-500">Hao hụt sản xuất, màng bọc chống xước, thùng carton bảo vệ...</div>
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="inline-flex items-center rounded-lg bg-white border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 overflow-hidden w-36">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={otherCost === '' ? '' : otherCost}
                          onChange={(e) => setOtherCost(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-transparent px-2.5 py-1.5 text-xs text-right text-emerald-700 font-mono font-semibold focus:outline-none"
                        />
                        <span className="px-2 py-1.5 bg-slate-50 text-[10px] text-slate-500 font-mono border-l border-slate-200">
                          đ
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono text-slate-700">
                      {((Number(otherCost) || 0) * (Number(moq) || 1)).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>

                  {/* DÒNG TỔNG PHỤ: Tổng chi phí theo MOQ (chưa VAT) */}
                  <tr className="bg-amber-50/70 font-semibold border-t-2 border-amber-200">
                    <td className="py-2.5 px-3.5 text-amber-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Tổng chi phí theo MOQ (chưa VAT)</span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-amber-800 font-bold">
                      {unitDirectCostBeforeVat.toLocaleString('vi-VN')} đ/sp
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-amber-800 font-bold">
                      {breakdown.subtotalBeforeVat.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>

                  {/* DÒNG THUẾ: VAT 8% */}
                  <tr className="bg-slate-50/50 text-slate-700">
                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-800 font-medium">Thuế VAT (8%)</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-100 text-slate-600 border border-slate-200">
                          8% theo quy định
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">Thuế GTGT đầu vào sản xuất</div>
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono text-slate-600 text-xs">
                      +{unitVatAmount.toLocaleString('vi-VN')} đ/sp
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono text-slate-600 text-xs">
                      +{breakdown.vatAmount.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>

                  {/* DÒNG: Chi phí đã có VAT */}
                  <tr className="bg-sky-50/60 font-semibold text-sky-950 border-t border-sky-100">
                    <td className="py-2.5 px-3.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>Chi phí đã có VAT</span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-sky-800">
                      {unitCostWithVat.toLocaleString('vi-VN')} đ/sp
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-sky-800">
                      {breakdown.totalWithVat.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>

                  {/* DÒNG PHÍ KIỂM NGHIỆM THEO LÔ */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3.5">
                      <div className="font-semibold text-slate-800">Phí kiểm nghiệm theo lô sản xuất</div>
                      <div className="text-[10px] text-slate-500">
                        Kiểm nghiệm vi sinh, kim loại nặng, hồ sơ công bố (Nhập VNĐ/lô)
                      </div>
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono text-slate-600 text-xs">
                      +{unitTestingFee.toLocaleString('vi-VN')} đ/sp
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="inline-flex items-center rounded-lg bg-white border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 overflow-hidden w-40">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={testingFeePerBatch === '' ? '' : testingFeePerBatch}
                          onChange={(e) => setTestingFeePerBatch(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-transparent px-2.5 py-1.5 text-xs text-right text-purple-700 font-mono font-semibold focus:outline-none"
                        />
                        <span className="px-2 py-1.5 bg-slate-50 text-[10px] text-slate-500 font-mono border-l border-slate-200">
                          đ/lô
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* DÒNG PHÍ VẬN CHUYỂN DỰ KIẾN */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3.5">
                      <div className="font-semibold text-slate-800">Phí vận chuyển (dự kiến)</div>
                      <div className="text-[10px] text-slate-500">
                        Cước xe tải giao nhận từ nhà máy về kho trung tâm (Nhập VNĐ/lô)
                      </div>
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono text-slate-600 text-xs">
                      +{unitShippingFee.toLocaleString('vi-VN')} đ/sp
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="inline-flex items-center rounded-lg bg-white border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 overflow-hidden w-40">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={shippingFeeEstimated === '' ? '' : shippingFeeEstimated}
                          onChange={(e) => setShippingFeeEstimated(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-transparent px-2.5 py-1.5 text-xs text-right text-purple-700 font-mono font-semibold focus:outline-none"
                        />
                        <span className="px-2 py-1.5 bg-slate-50 text-[10px] text-slate-500 font-mono border-l border-slate-200">
                          đ/lô
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* DÒNG KẾT LUẬN: TỔNG CHI PHÍ HÀNG BÁN */}
                  <tr className="bg-emerald-50/90 border-t-2 border-emerald-300 font-bold">
                    <td className="py-3 px-3.5 text-emerald-900 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>Tổng chi phí hàng bán (COGS Lô)</span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-emerald-800 text-sm font-bold">
                      {breakdown.cogsPerUnit.toLocaleString('vi-VN')} đ/sp
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-emerald-900 text-base font-extrabold">
                      {breakdown.totalCogsBatch.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KHỐI 3: HAI KẾT QUẢ TÀI CHÍNH THEN CHỐT NỔI BẬT:                           */}
          {/* - Giá vốn hàng bán trên sản phẩm                                         */}
          {/* - Giá vốn hàng bán trên ml                                               */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* CARD 1: Giá vốn hàng bán trên sản phẩm */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                Giá Vốn Hàng Bán Trên Sản Phẩm
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                  {breakdown.cogsPerUnit.toLocaleString('vi-VN')}
                </span>
                <span className="text-xs text-emerald-700 font-mono font-semibold">VNĐ / sản phẩm</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between">
                <span>Công thức:</span>
                <span className="font-mono text-slate-700 text-[10px]">
                  {breakdown.totalCogsBatch.toLocaleString('vi-VN')} đ ÷ {Number(moq).toLocaleString('vi-VN')} sp
                </span>
              </div>
              {grossMarginPercent !== null && (
                <div className="text-[11px] text-emerald-700 mt-1 flex items-center justify-between font-mono">
                  <span>Biên lãi gộp chuẩn:</span>
                  <span className="font-bold">{grossMarginPercent.toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* CARD 2: Giá vốn hàng bán trên ml */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-white border border-sky-200 shadow-xs">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block mb-1">
                Giá Vốn Hàng Bán Trên ml
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                  {breakdown.cogsPerMl.toLocaleString('vi-VN')}
                </span>
                <span className="text-xs text-sky-700 font-mono font-semibold">VNĐ / ml</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-sky-200 flex items-center justify-between">
                <span>Công thức:</span>
                <span className="font-mono text-slate-700 text-[10px]">
                  {breakdown.cogsPerUnit.toLocaleString('vi-VN')} đ ÷ {Number(volumeMl)} ml
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 italic">
                Giúp so sánh hiệu quả chi phí thể tích giữa chai 30ml, 50ml và 100ml.
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KHỐI 4: THÔNG TIN VẬN HÀNH BỔ SUNG & TRẠNG THÁI CHỐT PHƯƠNG ÁN              */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Thời Gian Sản Xuất (Lead-time)
              </label>
              <div className="flex items-center rounded-lg bg-white border border-slate-300 overflow-hidden focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
                <input
                  type="number"
                  min="1"
                  placeholder="45"
                  value={leadTimeDays === '' ? '' : leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-transparent px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none"
                />
                <span className="px-2.5 py-2 bg-slate-100 text-xs text-slate-600 font-mono border-l border-slate-200">
                  ngày
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                Quy Cách Đóng Gói / Vỏ Hộp
              </label>
              <input
                type="text"
                placeholder="VD: Chai thủy tinh dropper mờ 50ml, hộp giấy Ivory"
                value={packagingDescription}
                onChange={(e) => setPackagingDescription(e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Ghi chú báo giá */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Ghi Chú Chi Tiết Báo Giá (Điều kiện thanh toán, cam kết cGMP...)
            </label>
            <input
              type="text"
              placeholder="VD: Đặt cọc 50%, thanh toán 50% khi nhận hàng tại kho. Đã có chứng nhận cGMP..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Tùy chọn: Chọn làm phương án sản xuất ĐÃ CHỐT */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <label className="flex items-start space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isChosen}
                onChange={(e) => setIsChosen(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  Đánh dấu đây là Phương Án Sản Xuất ĐÃ CHỐT cho SKU này
                </span>
                <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                  Khi chọn, đơn vị sản xuất, mức MOQ và giá vốn này sẽ tự động liên kết sang Sheet 2 và kích hoạt lựa chọn &quot;Nhà máy và MOQ đã chốt&quot;.
                </p>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0">
            <div>
              {quotationToEdit && onDeleteQuotation && (
                <div>
                  {isConfirmDelete ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-rose-600 font-medium">Xác nhận xóa?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteQuotation(quotationToEdit.id);
                          setIsConfirmDelete(false);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmDelete(false)}
                        className="px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsConfirmDelete(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Báo Giá</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{quotationToEdit ? 'Lưu Báo Giá' : 'Hoàn Tất & Lưu Báo Giá'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
