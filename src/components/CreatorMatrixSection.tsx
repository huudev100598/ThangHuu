import React, { useState } from 'react';
import { 
  Users, 
  Gift, 
  Coins, 
  Sparkles, 
  Flame, 
  Award, 
  Target, 
  Calculator,
  Layers,
  HelpCircle
} from 'lucide-react';
import { CreatorTierConfig, CreatorTierKey } from '../types/financial';
import { formatVND, formatNumber } from '../utils/formatters';

interface CreatorMatrixSectionProps {
  creatorTiers: Record<CreatorTierKey, CreatorTierConfig>;
  onChange: (updated: Record<CreatorTierKey, CreatorTierConfig>) => void;
}

export const CreatorMatrixSection: React.FC<CreatorMatrixSectionProps> = ({
  creatorTiers,
  onChange,
}) => {
  // Campaign Seeding Simulation State
  const [skuCount, setSkuCount] = useState<number>(3); // 3 SKU chủ lực: Serum, Lăn khử mùi, Tẩy tế bào chết nách
  const [estimatedCogsPerSample, setEstimatedCogsPerSample] = useState<number>(35000); // 35.000đ/mẫu
  const [planner, setPlanner] = useState<Record<CreatorTierKey, number>>({
    UGC: 20, // 20 UGC creators
    KOC: 8,  // 8 KOC creators
    KOL: 1,  // 1 KOL beauty guru
  });

  const updateTier = (tier: CreatorTierKey, field: keyof CreatorTierConfig, value: any) => {
    onChange({
      ...creatorTiers,
      [tier]: {
        ...creatorTiers[tier],
        [field]: value,
      },
    });
  };

  const updatePlannerCount = (tier: CreatorTierKey, count: number) => {
    setPlanner((prev) => ({
      ...prev,
      [tier]: Math.max(0, count),
    }));
  };

  // Calculations for campaign simulation
  const totalSamplesGiven = (['UGC', 'KOC', 'KOL'] as CreatorTierKey[]).reduce((sum, tier) => {
    return sum + (planner[tier] * creatorTiers[tier].freeSamplesPerSku * skuCount);
  }, 0);

  const totalBookingFee = (['UGC', 'KOC', 'KOL'] as CreatorTierKey[]).reduce((sum, tier) => {
    return sum + (planner[tier] * creatorTiers[tier].bookingFeePerCreator);
  }, 0);

  const totalSampleCogsCost = totalSamplesGiven * estimatedCogsPerSample;
  const grandTotalSeedingBudget = totalBookingFee + totalSampleCogsCost;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xs font-bold font-mono">
              7
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Tham Số Chung Cho Creator (UGC, KOC &amp; KOL)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Định mức phân bổ sản phẩm mẫu tặng (Sample Seeding) và chi phí booking theo từng phân cấp Creator.
          </p>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono font-medium">
          Affiliate &amp; Seeding Matrix
        </span>
      </div>

      {/* Main Creator Tier Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 uppercase font-mono text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold w-56">Phân Cấp Creator</th>
              <th className="py-3 px-4 font-semibold text-center w-48">
                Số Mẫu Tặng / SKU / Creator
              </th>
              <th className="py-3 px-4 font-semibold text-right w-52">
                Chi Phí Booking / Creator (VND)
              </th>
              <th className="py-3 px-4 font-semibold hidden md:table-cell">
                Đặc Điểm &amp; Mục Tiêu Chuyển Đổi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            
            {/* UGC Tier */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold font-mono text-xs">
                    U
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">UGC</span>
                    <span className="block text-[11px] text-slate-500">User Generated Content</span>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <div className="inline-flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={creatorTiers.UGC.freeSamplesPerSku}
                    onChange={(e) => updateTier('UGC', 'freeSamplesPerSku', Math.max(1, Number(e.target.value)))}
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                  <span className="text-slate-500 font-mono">mẫu</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="inline-flex items-center space-x-1.5 justify-end">
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={creatorTiers.UGC.bookingFeePerCreator}
                    onChange={(e) => updateTier('UGC', 'bookingFeePerCreator', Math.max(0, Number(e.target.value)))}
                    className="w-28 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                  <span className="text-slate-500 font-mono">đ</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">Miễn phí booking (0 đ)</div>
              </td>
              <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                <p className="line-clamp-2">
                  {creatorTiers.UGC.description} Nhận hàng mẫu để quay video review chân thực, chia sẻ lên TikTok/Reels.
                </p>
              </td>
            </tr>

            {/* KOC Tier */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold font-mono text-xs">
                    K
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">KOC</span>
                    <span className="block text-[11px] text-slate-500">Key Opinion Consumer</span>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <div className="inline-flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={creatorTiers.KOC.freeSamplesPerSku}
                    onChange={(e) => updateTier('KOC', 'freeSamplesPerSku', Math.max(1, Number(e.target.value)))}
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono font-bold text-teal-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                  <span className="text-slate-500 font-mono">mẫu</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="inline-flex items-center space-x-1.5 justify-end">
                  <input
                    type="number"
                    step="100000"
                    min="0"
                    value={creatorTiers.KOC.bookingFeePerCreator}
                    onChange={(e) => updateTier('KOC', 'bookingFeePerCreator', Math.max(0, Number(e.target.value)))}
                    className="w-28 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-teal-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                  />
                  <span className="text-slate-500 font-mono">đ</span>
                </div>
                <div className="text-[11px] text-teal-700 mt-0.5 font-medium">{formatVND(creatorTiers.KOC.bookingFeePerCreator)}/bài</div>
              </td>
              <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                <p className="line-clamp-2">
                  {creatorTiers.KOC.description} Livestream gắn giỏ hàng TikTok Shop, review so sánh mờ thâm nách.
                </p>
              </td>
            </tr>

            {/* KOL Tier */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold font-mono text-xs">
                    L
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">KOL</span>
                    <span className="block text-[11px] text-slate-500">Key Opinion Leader</span>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <div className="inline-flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={creatorTiers.KOL.freeSamplesPerSku}
                    onChange={(e) => updateTier('KOL', 'freeSamplesPerSku', Math.max(1, Number(e.target.value)))}
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono font-bold text-purple-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                  />
                  <span className="text-slate-500 font-mono">mẫu</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="inline-flex items-center space-x-1.5 justify-end">
                  <input
                    type="number"
                    step="1000000"
                    min="0"
                    value={creatorTiers.KOL.bookingFeePerCreator}
                    onChange={(e) => updateTier('KOL', 'bookingFeePerCreator', Math.max(0, Number(e.target.value)))}
                    className="w-28 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-bold text-purple-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                  />
                  <span className="text-slate-500 font-mono">đ</span>
                </div>
                <div className="text-[11px] text-purple-700 mt-0.5 font-medium">{formatVND(creatorTiers.KOL.bookingFeePerCreator)}/chiến dịch</div>
              </td>
              <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                <p className="line-clamp-2">
                  {creatorTiers.KOL.description} Bác sĩ da liễu / Beauty Blogger uy tín bảo chứng hiệu quả khoa học của công thức Underarm Care.
                </p>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* Interactive Seeding Budget Calculator */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2 text-xs">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-900 uppercase font-mono">
              Bảng Dự Toán Ngân Sách Seeding Mẫu &amp; Booking Mosh&amp;Mode Launch
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-600 font-medium">Số lượng SKU:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={skuCount}
                onChange={(e) => setSkuCount(Math.max(1, Number(e.target.value)))}
                className="w-12 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-600 font-medium">COGS/Mẫu:</span>
              <input
                type="number"
                step="5000"
                min="5000"
                value={estimatedCogsPerSample}
                onChange={(e) => setEstimatedCogsPerSample(Math.max(0, Number(e.target.value)))}
                className="w-20 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20"
              />
              <span className="text-slate-500 font-mono font-semibold">đ</span>
            </div>
          </div>
        </div>

        {/* Sliders / Inputs for planned creator count */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* UGC Plan */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-blue-700">Quy mô UGC Seeding:</span>
              <span className="font-mono font-bold text-slate-900">{planner.UGC} creator</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={planner.UGC}
              onChange={(e) => updatePlannerCount('UGC', Number(e.target.value))}
              className="w-full mt-2 accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Mẫu: {planner.UGC * creatorTiers.UGC.freeSamplesPerSku * skuCount} sp</span>
              <span>Booking: 0 đ</span>
            </div>
          </div>

          {/* KOC Plan */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-teal-700">Quy mô KOC Booking:</span>
              <span className="font-mono font-bold text-slate-900">{planner.KOC} creator</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={planner.KOC}
              onChange={(e) => updatePlannerCount('KOC', Number(e.target.value))}
              className="w-full mt-2 accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Mẫu: {planner.KOC * creatorTiers.KOC.freeSamplesPerSku * skuCount} sp</span>
              <span>Booking: {formatVND(planner.KOC * creatorTiers.KOC.bookingFeePerCreator)}</span>
            </div>
          </div>

          {/* KOL Plan */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-purple-700">Quy mô KOL Guru:</span>
              <span className="font-mono font-bold text-slate-900">{planner.KOL} creator</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={planner.KOL}
              onChange={(e) => updatePlannerCount('KOL', Number(e.target.value))}
              className="w-full mt-2 accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Mẫu: {planner.KOL * creatorTiers.KOL.freeSamplesPerSku * skuCount} sp</span>
              <span>Booking: {formatVND(planner.KOL * creatorTiers.KOL.bookingFeePerCreator)}</span>
            </div>
          </div>
        </div>

        {/* Summary result bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-white border border-slate-200 text-center shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">Tổng Số Mẫu Tặng Tiêu Hao</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">
              {formatNumber(totalSamplesGiven)} sản phẩm
            </span>
            <span className="text-[10px] text-slate-500 block">Chi phí vốn mẫu: {formatVND(totalSampleCogsCost)}</span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200 text-center shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">Tổng Chi Phí Tiền Mặt Booking</span>
            <span className="text-lg font-bold text-purple-700 font-mono">
              {formatVND(totalBookingFee)}
            </span>
            <span className="text-[10px] text-slate-500 block">Chi trả trực tiếp Creator</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-center shadow-2xs">
            <span className="text-[11px] text-emerald-800 block font-semibold">TỔNG NGÂN SÁCH SEEDING &amp; MẪU</span>
            <span className="text-xl font-bold text-emerald-900 font-mono">
              {formatVND(grandTotalSeedingBudget)}
            </span>
            <span className="text-[10px] text-emerald-700 block font-medium">
              Chiếm {((grandTotalSeedingBudget / 100000000) * 100).toFixed(1)}% Vốn khởi điểm 100M
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
