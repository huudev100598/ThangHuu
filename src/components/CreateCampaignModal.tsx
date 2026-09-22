import React, { useState, useEffect } from 'react';
import { ProductSku } from '../types/sku';
import { SalesMonth, CreatorCampaign, CampaignMonthConfig } from '../types/salesForecast';
import { ProjectParameters } from '../types/financial';
import { DEFAULT_PROJECT_PARAMETERS } from '../data/defaultFinancialConfig';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Users, 
  Package, 
  DollarSign, 
  AlertCircle, 
  Copy, 
  Check, 
  Layers 
} from 'lucide-react';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: CreatorCampaign) => void;
  editingCampaign: CreatorCampaign | null;
  skus: ProductSku[];
  months: SalesMonth[];
  parameters: ProjectParameters;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCampaign,
  skus,
  months,
  parameters,
}) => {
  const creatorTiers = parameters?.creatorTiers || DEFAULT_PROJECT_PARAMETERS.creatorTiers;
  const UGC = creatorTiers?.UGC || DEFAULT_PROJECT_PARAMETERS.creatorTiers.UGC;
  const KOC = creatorTiers?.KOC || DEFAULT_PROJECT_PARAMETERS.creatorTiers.KOC;
  const KOL = creatorTiers?.KOL || DEFAULT_PROJECT_PARAMETERS.creatorTiers.KOL;

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>([]);
  const [selectedMonthIds, setSelectedMonthIds] = useState<string[]>([]);
  const [monthConfigs, setMonthConfigs] = useState<Record<string, CampaignMonthConfig>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (editingCampaign) {
      setName(editingCampaign.name);
      setDescription(editingCampaign.description || '');
      setSelectedSkuIds(editingCampaign.skuIds || []);
      const monthIds = Object.keys(editingCampaign.monthConfigs || {}).filter((mid) =>
        months.some((m) => m.id === mid)
      );
      setSelectedMonthIds(monthIds);
      setMonthConfigs(editingCampaign.monthConfigs || {});
    } else {
      setName(`Chiến Dịch Creator Mới - ${new Date().toLocaleDateString('vi-VN')}`);
      setDescription('');
      // Default select first 2 single SKUs if available
      const defaultSkus = skus.slice(0, 2).map((s) => s.id);
      setSelectedSkuIds(defaultSkus);

      // Default select first available month if any
      if (months.length > 0) {
        const firstMonthId = months[0].id;
        setSelectedMonthIds([firstMonthId]);
        setMonthConfigs({
          [firstMonthId]: {
            monthId: firstMonthId,
            ugcCount: 20,
            kocCount: 8,
            kolCount: 1,
            ugcSamplesPerSku: UGC?.freeSamplesPerSku || 1,
            kocSamplesPerSku: KOC?.freeSamplesPerSku || 5,
            kolSamplesPerSku: KOL?.freeSamplesPerSku || 10,
          },
        });
      } else {
        setSelectedMonthIds([]);
        setMonthConfigs({});
      }
    }
    setErrorMsg(null);
  }, [isOpen, editingCampaign, months, skus, UGC, KOC, KOL]);

  if (!isOpen) return null;

  // Toggle SKU selection
  const handleToggleSku = (skuId: string) => {
    setSelectedSkuIds((prev) =>
      prev.includes(skuId) ? prev.filter((id) => id !== skuId) : [...prev, skuId]
    );
  };

  const handleSelectAllSkus = () => {
    if (selectedSkuIds.length === skus.length) {
      setSelectedSkuIds([]);
    } else {
      setSelectedSkuIds(skus.map((s) => s.id));
    }
  };

  // Toggle Month selection
  const handleToggleMonth = (monthId: string) => {
    if (selectedMonthIds.includes(monthId)) {
      setSelectedMonthIds((prev) => prev.filter((id) => id !== monthId));
      setMonthConfigs((prev) => {
        const next = { ...prev };
        delete next[monthId];
        return next;
      });
    } else {
      setSelectedMonthIds((prev) => [...prev, monthId]);
      // If no config yet, create default
      if (!monthConfigs[monthId]) {
        setMonthConfigs((prev) => ({
          ...prev,
          [monthId]: {
            monthId,
            ugcCount: 20,
            kocCount: 8,
            kolCount: 1,
            ugcSamplesPerSku: UGC?.freeSamplesPerSku || 1,
            kocSamplesPerSku: KOC?.freeSamplesPerSku || 5,
            kolSamplesPerSku: KOL?.freeSamplesPerSku || 10,
          },
        }));
      }
    }
  };

  // Update specific month configuration
  const handleUpdateMonthField = (
    monthId: string,
    field: keyof CampaignMonthConfig,
    value: number
  ) => {
    setMonthConfigs((prev) => {
      const current = prev[monthId] || {
        monthId,
        ugcCount: 0,
        kocCount: 0,
        kolCount: 0,
        ugcSamplesPerSku: UGC?.freeSamplesPerSku || 1,
        kocSamplesPerSku: KOC?.freeSamplesPerSku || 5,
        kolSamplesPerSku: KOL?.freeSamplesPerSku || 10,
      };

      return {
        ...prev,
        [monthId]: {
          ...current,
          [field]: isNaN(value) ? 0 : Math.max(0, value),
        },
      };
    });
  };

  // Copy config of one month to all selected months
  const handleCopyConfigToAll = (sourceMonthId: string) => {
    const sourceCfg = monthConfigs[sourceMonthId];
    if (!sourceCfg) return;

    setMonthConfigs((prev) => {
      const updated = { ...prev };
      selectedMonthIds.forEach((mid) => {
        updated[mid] = {
          ...sourceCfg,
          monthId: mid,
        };
      });
      return updated;
    });
  };

  // Calculations for preview
  const skuCount = selectedSkuIds.length;

  let grandTotalCreators = 0;
  let grandTotalSamples = 0;
  let grandTotalBookingFee = 0;

  selectedMonthIds.forEach((mid) => {
    const cfg = monthConfigs[mid];
    if (!cfg) return;
    const creators = (cfg.ugcCount || 0) + (cfg.kocCount || 0) + (cfg.kolCount || 0);
    grandTotalCreators += creators;

    const samplesPerSku =
      (cfg.ugcCount || 0) * (cfg.ugcSamplesPerSku ?? 1) +
      (cfg.kocCount || 0) * (cfg.kocSamplesPerSku ?? 5) +
      (cfg.kolCount || 0) * (cfg.kolSamplesPerSku ?? 10);

    const monthSamples = samplesPerSku * skuCount;
    grandTotalSamples += monthSamples;

    const monthBooking =
      (cfg.ugcCount || 0) * (UGC?.bookingFeePerCreator || 0) +
      (cfg.kocCount || 0) * (KOC?.bookingFeePerCreator || 0) +
      (cfg.kolCount || 0) * (KOL?.bookingFeePerCreator || 0);
    grandTotalBookingFee += monthBooking;
  });

  // Handle Save
  const handleSave = () => {
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên chiến dịch.');
      return;
    }
    if (selectedSkuIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 sản phẩm tham gia chiến dịch.');
      return;
    }
    if (months.length === 0) {
      setErrorMsg('Chưa có tháng bán hàng nào được tạo ở Bảng Dự Báo Sản Lượng Hàng Bán.');
      return;
    }
    if (selectedMonthIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 tháng triển khai chiến dịch.');
      return;
    }

    const campaignToSave: CreatorCampaign = {
      id: editingCampaign?.id || `camp-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      skuIds: selectedSkuIds,
      monthConfigs,
      createdAt: editingCampaign?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(campaignToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                {editingCampaign ? 'Chỉnh Sửa Chiến Dịch Creator' : 'Tạo Chiến Dịch Creator Mới'}
              </h3>
              <p className="text-xs text-slate-500">
                Liên kết định mức từ Tab 1 • Tự động tính số lượng mẫu Sampling &amp; Chi phí Booking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Thông tin cơ bản */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
              1. Tên &amp; Mục Tiêu Chiến Dịch <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Chiến dịch Seeding & Livestream Ra Mắt Dưỡng Trắng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs bg-white text-slate-900 font-medium placeholder:text-slate-400"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục tiêu (Social proof, Flash sale...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Chọn Sản Phẩm Cho Chiến Dịch */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                2. Chọn Sản Phẩm Cho Chiến Dịch <span className="text-rose-500">*</span>
                <span className="ml-2 font-normal text-slate-500 lowercase">
                  (Đã chọn {selectedSkuIds.length}/{skus.length} sản phẩm)
                </span>
              </label>
              <button
                type="button"
                onClick={handleSelectAllSkus}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                {selectedSkuIds.length === skus.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả SKU'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto p-2 rounded-xl bg-slate-50/70 border border-slate-200">
              {skus.map((sku) => {
                const isSelected = selectedSkuIds.includes(sku.id);
                return (
                  <label
                    key={sku.id}
                    className={`flex items-start space-x-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSku(sku.id)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-[11px]">{sku.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between mt-0.5">
                        <span>{sku.skuCode}</span>
                        <span className="text-emerald-700 font-medium">
                          {(sku.prices?.standard || 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 3: Chọn Tháng Triển Khai Chiến Dịch */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                3. Chọn Tháng Triển Khai Chiến Dịch <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 italic">
                * Căn cứ theo các tháng bán hàng đã tạo ở Sub Dự Báo Sản Lượng Hàng Bán
              </span>
            </div>

            {months.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    Chưa có tháng bán hàng nào được tạo ở Bảng Dự Báo Sản Lượng Hàng Bán!
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Theo quy tắc logic, tháng triển khai chiến dịch Creator bắt buộc phải căn cứ vào tháng bán hàng đã được tạo. Bạn vui lòng quay lại bảng Dự Báo Sản Lượng Hàng Bán và thêm ít nhất 1 tháng.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {months.map((m) => {
                  const isSelected = selectedMonthIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleToggleMonth(m.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Cấu hình Số Lượng Creator & Sản Phẩm Sampling Từng Tháng */}
          {selectedMonthIds.length > 0 && months.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    4. Số Lượng Creator &amp; Định Mức Sampling Từng Tháng
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Nhập số lượng Creator &amp; số mẫu sampling cho từng tháng. Hệ thống tự tính số lượng mẫu xuất kho và chi phí booking.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {selectedMonthIds.map((mid, idx) => {
                  const monthObj = months.find((m) => m.id === mid);
                  const cfg = monthConfigs[mid] || {
                    monthId: mid,
                    ugcCount: 0,
                    kocCount: 0,
                    kolCount: 0,
                    ugcSamplesPerSku: UGC?.freeSamplesPerSku || 1,
                    kocSamplesPerSku: KOC?.freeSamplesPerSku || 5,
                    kolSamplesPerSku: KOL?.freeSamplesPerSku || 10,
                  };

                  // Month calculation
                  const samplesPerSku =
                    (cfg.ugcCount || 0) * (cfg.ugcSamplesPerSku ?? 1) +
                    (cfg.kocCount || 0) * (cfg.kocSamplesPerSku ?? 5) +
                    (cfg.kolCount || 0) * (cfg.kolSamplesPerSku ?? 10);
                  const totalMonthSamples = samplesPerSku * skuCount;

                  const monthBookingFee =
                    (cfg.ugcCount || 0) * (UGC?.bookingFeePerCreator || 0) +
                    (cfg.kocCount || 0) * (KOC?.bookingFeePerCreator || 0) +
                    (cfg.kolCount || 0) * (KOL?.bookingFeePerCreator || 0);

                  return (
                    <div
                      key={mid}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-xs font-mono">
                            {monthObj?.label || mid}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-[11px]">
                          <span className="text-slate-600">
                            Mẫu Sampling:{' '}
                            <strong className="text-purple-700 font-mono font-bold">
                              {totalMonthSamples.toLocaleString('vi-VN')} sp
                            </strong>{' '}
                            ({samplesPerSku} sp/SKU × {skuCount} SKU)
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-600">
                            Phí Booking:{' '}
                            <strong className="text-emerald-700 font-mono font-bold">
                              {monthBookingFee.toLocaleString('vi-VN')} đ
                            </strong>
                          </span>
                          {selectedMonthIds.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleCopyConfigToAll(mid)}
                              className="inline-flex items-center space-x-1 text-[10px] text-blue-600 hover:text-blue-700 font-medium px-2 py-0.5 rounded bg-blue-50 border border-blue-200 cursor-pointer"
                              title="Sao chép số lượng creator của tháng này cho tất cả các tháng đã chọn"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Áp dụng cho tất cả các tháng</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 3 Tier Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* UGC */}
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">UGC ({UGC?.name || 'Reviewer'})</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Phí: {(UGC?.bookingFeePerCreator || 0).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5">
                                Số Creator
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={cfg.ugcCount}
                                onChange={(e) =>
                                  handleUpdateMonthField(mid, 'ugcCount', parseInt(e.target.value, 10))
                                }
                                className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs font-mono text-center font-bold text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5" title="Số mẫu tặng / SKU / Creator">
                                Mẫu / SKU
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={cfg.ugcSamplesPerSku}
                                onChange={(e) =>
                                  handleUpdateMonthField(
                                    mid,
                                    'ugcSamplesPerSku',
                                    parseInt(e.target.value, 10)
                                  )
                                }
                                className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs font-mono text-center text-slate-800"
                              />
                            </div>
                          </div>
                        </div>

                        {/* KOC */}
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">KOC ({KOC?.name || 'Affiliate'})</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Phí: {(KOC?.bookingFeePerCreator || 0).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5">
                                Số Creator
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={cfg.kocCount}
                                onChange={(e) =>
                                  handleUpdateMonthField(mid, 'kocCount', parseInt(e.target.value, 10))
                                }
                                className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs font-mono text-center font-bold text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5" title="Số mẫu tặng / SKU / Creator">
                                Mẫu / SKU
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={cfg.kocSamplesPerSku}
                                onChange={(e) =>
                                  handleUpdateMonthField(
                                    mid,
                                    'kocSamplesPerSku',
                                    parseInt(e.target.value, 10)
                                  )
                                }
                                className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs font-mono text-center text-slate-800"
                              />
                            </div>
                          </div>
                        </div>

                        {/* KOL */}
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">KOL ({KOL?.name || 'Chuyên gia'})</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Phí: {(KOL?.bookingFeePerCreator || 0).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5">
                                Số Creator
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={cfg.kolCount}
                                onChange={(e) =>
                                  handleUpdateMonthField(mid, 'kolCount', parseInt(e.target.value, 10))
                                }
                                className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs font-mono text-center font-bold text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5" title="Số mẫu tặng / SKU / Creator">
                                Mẫu / SKU
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={cfg.kolSamplesPerSku}
                                onChange={(e) =>
                                  handleUpdateMonthField(
                                    mid,
                                    'kolSamplesPerSku',
                                    parseInt(e.target.value, 10)
                                  )
                                }
                                className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs font-mono text-center text-slate-800"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-time Grand Total Card */}
          {selectedMonthIds.length > 0 && selectedSkuIds.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-purple-50 border border-emerald-200">
              <div className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>TỔNG HỢP CHIẾN DỊCH TỰ ĐỘNG TÍNH TOÁN</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">Tổng Số Creator</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {grandTotalCreators.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">người</span>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-lg border border-purple-200">
                  <div className="text-[11px] text-purple-700">Tổng Mẫu Sampling Xuất Kho</div>
                  <div className="text-base font-bold font-mono text-purple-800 mt-0.5">
                    {grandTotalSamples.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">sản phẩm</span>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-lg border border-emerald-200">
                  <div className="text-[11px] text-emerald-700">Tổng Chi Phí Booking Creator</div>
                  <div className="text-base font-bold font-mono text-emerald-800 mt-0.5">
                    {grandTotalBookingFee.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">VNĐ</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 rounded-b-2xl flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={months.length === 0}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Lưu Chiến Dịch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
