import React, { useState } from 'react';
import { ProductSku } from '../types/sku';
import { SalesMonth, CreatorCampaign } from '../types/salesForecast';
import { ProjectParameters } from '../types/financial';
import { DEFAULT_PROJECT_PARAMETERS } from '../data/defaultFinancialConfig';
import { CreateCampaignModal } from './CreateCampaignModal';
import { 
  Users, 
  Gift, 
  DollarSign, 
  Sparkles, 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  Package, 
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react';

interface CreatorPlanViewProps {
  skus: ProductSku[];
  months: SalesMonth[];
  campaigns: CreatorCampaign[];
  onChangeCampaigns: (newCampaigns: CreatorCampaign[]) => void;
  parameters: ProjectParameters;
}

export const CreatorPlanView: React.FC<CreatorPlanViewProps> = ({
  skus,
  months,
  campaigns,
  onChangeCampaigns,
  parameters,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<CreatorCampaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<CreatorCampaign | null>(null);

  const creatorTiers = parameters?.creatorTiers || DEFAULT_PROJECT_PARAMETERS.creatorTiers;
  const UGC = creatorTiers?.UGC || DEFAULT_PROJECT_PARAMETERS.creatorTiers.UGC;
  const KOC = creatorTiers?.KOC || DEFAULT_PROJECT_PARAMETERS.creatorTiers.KOC;
  const KOL = creatorTiers?.KOL || DEFAULT_PROJECT_PARAMETERS.creatorTiers.KOL;

  // Handler open create modal
  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setIsModalOpen(true);
  };

  // Handler open edit modal
  const handleOpenEdit = (campaign: CreatorCampaign) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
  };

  // Save campaign (create or edit)
  const handleSaveCampaign = (saved: CreatorCampaign) => {
    if (editingCampaign) {
      onChangeCampaigns(campaigns.map((c) => (c.id === saved.id ? saved : c)));
    } else {
      onChangeCampaigns([...campaigns, saved]);
    }
  };

  // Delete campaign
  const handleConfirmDelete = () => {
    if (!campaignToDelete) return;
    onChangeCampaigns(campaigns.filter((c) => c.id !== campaignToDelete.id));
    setCampaignToDelete(null);
  };

  // Project-wide metrics across all campaigns and active months
  const monthlyAggregates = months.map((m) => {
    let ugcTotal = 0;
    let kocTotal = 0;
    let kolTotal = 0;
    let samplingUnits = 0;
    let bookingFee = 0;
    let activeCampaignsCount = 0;

    campaigns.forEach((camp) => {
      const cfg = camp.monthConfigs[m.id];
      if (cfg) {
        activeCampaignsCount += 1;
        const u = cfg.ugcCount || 0;
        const k = cfg.kocCount || 0;
        const l = cfg.kolCount || 0;
        ugcTotal += u;
        kocTotal += k;
        kolTotal += l;

        const perSkuSamples =
          u * (cfg.ugcSamplesPerSku ?? 1) +
          k * (cfg.kocSamplesPerSku ?? 5) +
          l * (cfg.kolSamplesPerSku ?? 10);
        samplingUnits += perSkuSamples * camp.skuIds.length;

        bookingFee +=
          u * (UGC?.bookingFeePerCreator || 0) +
          k * (KOC?.bookingFeePerCreator || 0) +
          l * (KOL?.bookingFeePerCreator || 0);
      }
    });

    return {
      month: m,
      activeCampaignsCount,
      ugcTotal,
      kocTotal,
      kolTotal,
      totalCreators: ugcTotal + kocTotal + kolTotal,
      samplingUnits,
      bookingFee,
    };
  });

  const totalAllCreators = monthlyAggregates.reduce((sum, item) => sum + item.totalCreators, 0);
  const totalAllSamples = monthlyAggregates.reduce((sum, item) => sum + item.samplingUnits, 0);
  const totalAllBookingFee = monthlyAggregates.reduce((sum, item) => sum + item.bookingFee, 0);

  return (
    <div className="space-y-6">
      {/* Header & Main Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Kế Hoạch Creator &amp; Chiến Dịch Sampling</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-['Space_Grotesk']">
            Quản Lý Chiến Dịch Creator (UGC, KOC &amp; KOL)
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Kết nối trực tiếp định mức từ <strong className="text-slate-800">Tab 1. Tham số chung</strong>. Khi bạn tạo chiến dịch, hệ thống tự động tính số lượng mẫu Sampling và phân bổ đồng bộ xuống bảng <strong className="text-emerald-700">Dự Báo Sản Lượng Hàng Sampling</strong>, đồng thời dự toán ngân sách booking hàng tháng.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Chiến Dịch Mới</span>
          </button>
        </div>
      </div>

      {/* Connection with Tab 1 Creator Parameters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-purple-50/40 to-slate-50 border border-purple-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
            <LinkIcon className="w-4 h-4 text-purple-600" />
            <span>Tham Số Định Mức Creator (Liên kết tự động từ Tab 1. Tham Số Chung)</span>
          </div>
          <span className="text-[11px] text-purple-700 font-medium bg-purple-100/70 border border-purple-200 px-2.5 py-0.5 rounded-md">
            Đã đồng bộ thời gian thực
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* UGC Tier */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">{UGC?.name || 'UGC (User Generated Content)'}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Tier 1
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {UGC?.description}
            </p>
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Chi phí Booking</span>
                <strong className="text-slate-900">
                  {(UGC?.bookingFeePerCreator || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Mẫu tặng / SKU</span>
                <strong className="text-purple-700">
                  {UGC?.freeSamplesPerSku || 1} sp
                </strong>
              </div>
            </div>
          </div>

          {/* KOC Tier */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">{KOC?.name || 'KOC (Key Opinion Consumer)'}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Tier 2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {KOC?.description}
            </p>
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Chi phí Booking</span>
                <strong className="text-slate-900">
                  {(KOC?.bookingFeePerCreator || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Mẫu tặng / SKU</span>
                <strong className="text-purple-700">
                  {KOC?.freeSamplesPerSku || 5} sp
                </strong>
              </div>
            </div>
          </div>

          {/* KOL Tier */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">{KOL?.name || 'KOL (Key Opinion Leader)'}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Tier 3
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {KOL?.description}
            </p>
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Chi phí Booking</span>
                <strong className="text-slate-900">
                  {(KOL?.bookingFeePerCreator || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Mẫu tặng / SKU</span>
                <strong className="text-purple-700">
                  {KOL?.freeSamplesPerSku || 10} sp
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Chiến Dịch Đang Chạy</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {campaigns.length} <span className="text-xs font-normal text-slate-500">chiến dịch</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Tổng Lượng Creator</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {totalAllCreators.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">người</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-purple-700 font-medium">Tổng Mẫu Sampling Xuất Kho</div>
            <div className="text-lg font-bold text-purple-800 font-mono mt-0.5">
              {totalAllSamples.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">sản phẩm</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-emerald-700 font-medium">Tổng Chi Phí Booking Toàn Kỳ</div>
            <div className="text-lg font-bold text-emerald-800 font-mono mt-0.5">
              {totalAllBookingFee.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">VNĐ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary Table */}
      {months.length > 0 && (
        <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span>BẢNG TỔNG HỢP CREATOR &amp; SAMPLING THEO THÁNG</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {months.length} tháng ({months[0]?.dateStr} → {months[months.length - 1]?.dateStr})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3 min-w-[110px]">Tháng</th>
                  <th className="py-2.5 px-3 text-center min-w-[90px]">Chiến Dịch</th>
                  <th className="py-2.5 px-3 text-center min-w-[80px]">UGC</th>
                  <th className="py-2.5 px-3 text-center min-w-[80px]">KOC</th>
                  <th className="py-2.5 px-3 text-center min-w-[80px]">KOL</th>
                  <th className="py-2.5 px-3 text-center min-w-[90px] font-bold">Tổng Creator</th>
                  <th className="py-2.5 px-3 text-right min-w-[130px] font-bold text-purple-800 bg-purple-50/50">
                    Mẫu Sampling (sp)
                  </th>
                  <th className="py-2.5 px-3 text-right min-w-[140px] font-bold text-emerald-800 bg-emerald-50/50">
                    Phí Booking (VNĐ)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {monthlyAggregates.map((row) => (
                  <tr key={row.month.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {row.month.label}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600">
                      {row.activeCampaignsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                          {row.activeCampaignsCount} CD
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-700">{row.ugcTotal}</td>
                    <td className="py-2 px-3 text-center text-slate-700">{row.kocTotal}</td>
                    <td className="py-2 px-3 text-center text-slate-700">{row.kolTotal}</td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900">{row.totalCreators}</td>
                    <td className="py-2 px-3 text-right font-bold text-purple-700 bg-purple-50/30">
                      {row.samplingUnits > 0 ? `${row.samplingUnits.toLocaleString('vi-VN')} sp` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                      {row.bookingFee > 0 ? `${row.bookingFee.toLocaleString('vi-VN')} đ` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-[11px] font-mono">
                  <td className="py-3 px-3">TỔNG TOÀN KỲ</td>
                  <td className="py-3 px-3 text-center">{campaigns.length} CD</td>
                  <td className="py-3 px-3 text-center">
                    {monthlyAggregates.reduce((s, r) => s + r.ugcTotal, 0)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {monthlyAggregates.reduce((s, r) => s + r.kocTotal, 0)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {monthlyAggregates.reduce((s, r) => s + r.kolTotal, 0)}
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-slate-900">
                    {totalAllCreators.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-purple-800 bg-purple-100/50">
                    {totalAllSamples.toLocaleString('vi-VN')} sp
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-emerald-800 bg-emerald-100/50">
                    {totalAllBookingFee.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
            <Package className="w-4 h-4 text-slate-600" />
            <span>DANH SÁCH CHI TIẾT CÁC CHIẾN DỊCH CREATOR ({campaigns.length})</span>
          </h3>
          <button
            onClick={handleOpenCreate}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Chiến Dịch</span>
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-800">Chưa có chiến dịch Creator nào</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tạo chiến dịch mới để liên kết sản phẩm, hoạch định số lượng Creator UGC, KOC, KOL và tự động phân bổ mẫu sampling sang bảng Dự Báo Sản Lượng Hàng Sampling.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Chiến Dịch Đầu Tiên</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((camp) => {
              const activeMonthIds = Object.keys(camp.monthConfigs || {}).filter((mid) =>
                months.some((m) => m.id === mid)
              );

              // Calculate campaign total
              let campTotalSamples = 0;
              let campTotalBooking = 0;
              let campTotalCreators = 0;

              activeMonthIds.forEach((mid) => {
                const cfg = camp.monthConfigs[mid];
                if (cfg) {
                  campTotalCreators += (cfg.ugcCount || 0) + (cfg.kocCount || 0) + (cfg.kolCount || 0);
                  const perSku =
                    (cfg.ugcCount || 0) * (cfg.ugcSamplesPerSku ?? 1) +
                    (cfg.kocCount || 0) * (cfg.kocSamplesPerSku ?? 5) +
                    (cfg.kolCount || 0) * (cfg.kolSamplesPerSku ?? 10);
                  campTotalSamples += perSku * camp.skuIds.length;
                  campTotalBooking +=
                    (cfg.ugcCount || 0) * (UGC?.bookingFeePerCreator || 0) +
                    (cfg.kocCount || 0) * (KOC?.bookingFeePerCreator || 0) +
                    (cfg.kolCount || 0) * (KOL?.bookingFeePerCreator || 0);
                }
              });

              return (
                <div
                  key={camp.id}
                  className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Campaign Card Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/60 to-white">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 font-['Space_Grotesk']">
                          {camp.name}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                          {activeMonthIds.length} tháng triển khai
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                          {camp.skuIds.length} sản phẩm
                        </span>
                      </div>
                      {camp.description && (
                        <p className="text-xs text-slate-500">{camp.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(camp)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => setCampaignToDelete(camp)}
                        className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs transition-colors cursor-pointer"
                        title="Xóa chiến dịch này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Selected SKUs Tags */}
                  <div className="px-4 sm:px-5 py-2.5 bg-slate-50/40 border-b border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-medium text-[11px]">Sản phẩm tham gia:</span>
                    {camp.skuIds.map((skuId) => {
                      const sku = skus.find((s) => s.id === skuId);
                      return (
                        <span
                          key={skuId}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-medium flex items-center space-x-1"
                        >
                          <span className="font-mono text-[10px] text-slate-500">{sku?.skuCode || skuId}</span>
                          <span className="truncate max-w-[140px]">{sku?.name || skuId}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Monthly Breakdown Table for this campaign */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100/60 text-slate-600 text-[11px] border-b border-slate-200">
                          <th className="py-2 px-4 font-sans font-semibold">Tháng</th>
                          <th className="py-2 px-3 text-center">UGC (mẫu/sp)</th>
                          <th className="py-2 px-3 text-center">KOC (mẫu/sp)</th>
                          <th className="py-2 px-3 text-center">KOL (mẫu/sp)</th>
                          <th className="py-2 px-3 text-center font-sans font-semibold">Tổng Creator</th>
                          <th className="py-2 px-4 text-right font-sans font-semibold text-purple-700 bg-purple-50/30">
                            Mẫu Sampling / SKU
                          </th>
                          <th className="py-2 px-4 text-right font-sans font-semibold text-purple-800 bg-purple-50/50">
                            Tổng Mẫu Xuất Kho ({camp.skuIds.length} SKU)
                          </th>
                          <th className="py-2 px-4 text-right font-sans font-semibold text-emerald-800 bg-emerald-50/50">
                            Phí Booking (VNĐ)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {activeMonthIds.map((mid) => {
                          const monthObj = months.find((m) => m.id === mid);
                          const cfg = camp.monthConfigs[mid];
                          if (!cfg) return null;

                          const perSkuSamples =
                            (cfg.ugcCount || 0) * (cfg.ugcSamplesPerSku ?? 1) +
                            (cfg.kocCount || 0) * (cfg.kocSamplesPerSku ?? 5) +
                            (cfg.kolCount || 0) * (cfg.kolSamplesPerSku ?? 10);
                          const totalSamples = perSkuSamples * camp.skuIds.length;

                          const bookingFee =
                            (cfg.ugcCount || 0) * (UGC?.bookingFeePerCreator || 0) +
                            (cfg.kocCount || 0) * (KOC?.bookingFeePerCreator || 0) +
                            (cfg.kolCount || 0) * (KOL?.bookingFeePerCreator || 0);

                          return (
                            <tr key={mid} className="hover:bg-slate-50/50">
                              <td className="py-2 px-4 font-sans font-semibold text-slate-800">
                                {monthObj?.label || mid}
                              </td>
                              <td className="py-2 px-3 text-center text-slate-700">
                                {cfg.ugcCount} <span className="text-[10px] text-slate-400">({cfg.ugcSamplesPerSku ?? 1} sp)</span>
                              </td>
                              <td className="py-2 px-3 text-center text-slate-700">
                                {cfg.kocCount} <span className="text-[10px] text-slate-400">({cfg.kocSamplesPerSku ?? 5} sp)</span>
                              </td>
                              <td className="py-2 px-3 text-center text-slate-700">
                                {cfg.kolCount} <span className="text-[10px] text-slate-400">({cfg.kolSamplesPerSku ?? 10} sp)</span>
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-slate-900">
                                {(cfg.ugcCount || 0) + (cfg.kocCount || 0) + (cfg.kolCount || 0)}
                              </td>
                              <td className="py-2 px-4 text-right font-bold text-purple-700 bg-purple-50/20">
                                {perSkuSamples.toLocaleString('vi-VN')} sp
                              </td>
                              <td className="py-2 px-4 text-right font-extrabold text-purple-800 bg-purple-50/40">
                                {totalSamples.toLocaleString('vi-VN')} sp
                              </td>
                              <td className="py-2 px-4 text-right font-extrabold text-emerald-800 bg-emerald-50/40">
                                {bookingFee.toLocaleString('vi-VN')} đ
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900 text-[11px]">
                          <td className="py-2.5 px-4 font-sans" colSpan={4}>TỔNG CHIẾN DỊCH</td>
                          <td className="py-2.5 px-3 text-center">{campTotalCreators}</td>
                          <td className="py-2.5 px-4 text-right text-slate-500 font-sans">-</td>
                          <td className="py-2.5 px-4 text-right font-extrabold text-purple-800 bg-purple-100/40">
                            {campTotalSamples.toLocaleString('vi-VN')} sp
                          </td>
                          <td className="py-2.5 px-4 text-right font-extrabold text-emerald-800 bg-emerald-100/40">
                            {campTotalBooking.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Create/Edit Campaign */}
      <CreateCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCampaign}
        editingCampaign={editingCampaign}
        skus={skus}
        months={months}
        parameters={parameters}
      />

      {/* Modal Confirm Delete */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 text-rose-600 mb-3">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-900">Xóa Chiến Dịch Creator?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc muốn xóa chiến dịch <strong className="text-slate-900">{campaignToDelete.name}</strong>? Sau khi xóa, các mẫu sampling của chiến dịch này sẽ tự động được gỡ khỏi bảng <strong className="text-emerald-700">Dự Báo Sản Lượng Hàng Sampling</strong>.
            </p>
            <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
