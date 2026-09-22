import React from 'react';
import { formatNumberVi } from '../../utils/formatters';
import { 
  ShieldCheck, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  SlidersHorizontal, 
  CheckCircle2, 
  Info,
  Flame,
  ArrowRight,
  Target,
  Zap,
  DollarSign,
  Layers
} from 'lucide-react';

interface MarginOfSafetyCardProps {
  marginOfSafetyRevenue: number;
  marginOfSafetyUnits: number;
  marginOfSafetyPercent: number;
  safetyRating: 'safe' | 'moderate' | 'warning' | 'deficit';
  totalRevenue: number;
  totalUnits: number;
  breakEvenRevenue: number;
  breakEvenUnits: number;
  fixedCosts: number;
  unitContributionMargin: number;
  averageSellingPrice: number;
  contributionMarginRatio: number;
}

export const MarginOfSafetyCard: React.FC<MarginOfSafetyCardProps> = ({
  marginOfSafetyRevenue,
  marginOfSafetyUnits,
  marginOfSafetyPercent,
  safetyRating,
  totalRevenue,
  totalUnits,
  breakEvenRevenue,
  breakEvenUnits,
  fixedCosts,
  unitContributionMargin,
  averageSellingPrice,
  contributionMarginRatio,
}) => {
  const isHealthy = marginOfSafetyPercent > 0;

  // Tính toán các kịch bản Stress-test (Độ nhạy)
  // Kịch bản 1: Doanh thu giảm -10%
  const revDown10 = totalRevenue * 0.9;
  const mosDown10 = revDown10 - breakEvenRevenue;
  const mosPctDown10 = revDown10 > 0 ? (mosDown10 / revDown10) * 100 : 0;
  const profitDown10 = Math.round((revDown10 * (contributionMarginRatio / 100)) - fixedCosts);

  // Kịch bản 2: Doanh thu giảm -20%
  const revDown20 = totalRevenue * 0.8;
  const mosDown20 = revDown20 - breakEvenRevenue;
  const mosPctDown20 = revDown20 > 0 ? (mosDown20 / revDown20) * 100 : 0;
  const profitDown20 = Math.round((revDown20 * (contributionMarginRatio / 100)) - fixedCosts);

  // Kịch bản 3: Định phí tăng +15%
  const fcUp15 = fixedCosts * 1.15;
  const bepRevFcUp = contributionMarginRatio > 0 ? Math.round(fcUp15 / (contributionMarginRatio / 100)) : 0;
  const mosFcUp = totalRevenue - bepRevFcUp;
  const mosPctFcUp = totalRevenue > 0 ? (mosFcUp / totalRevenue) * 100 : 0;

  // Kịch bản 4: Biến phí tăng làm CMR giảm 5%
  const cmrDown5 = Math.max(1, contributionMarginRatio - 5);
  const bepRevCmrDown = Math.round(fixedCosts / (cmrDown5 / 100));
  const mosCmrDown = totalRevenue - bepRevCmrDown;
  const mosPctCmrDown = totalRevenue > 0 ? (mosCmrDown / totalRevenue) * 100 : 0;

  return (
    <div id="margin-of-safety-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className={`p-2.5 rounded-xl ${
            safetyRating === 'safe'
              ? 'bg-emerald-50 text-emerald-700'
              : safetyRating === 'moderate'
              ? 'bg-blue-50 text-blue-700'
              : safetyRating === 'warning'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-rose-50 text-rose-700'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Báo Cáo Quản Trị: Chỉ Số Biên Độ An Toàn (Margin of Safety - MoS)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đo lường mức độ phòng vệ rủi ro và khả năng hấp thụ biến động thị trường của dự án
            </p>
          </div>
        </div>

        {/* Safety Badge */}
        <div className="flex items-center gap-2">
          {safetyRating === 'safe' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              RẤT AN TOÀN ({marginOfSafetyPercent.toFixed(1)}%)
            </span>
          )}
          {safetyRating === 'moderate' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              AN TOÀN TIÊU CHUẨN ({marginOfSafetyPercent.toFixed(1)}%)
            </span>
          )}
          {safetyRating === 'warning' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              CẢNH BÁO: BIÊN ĐỆM MỎNG ({marginOfSafetyPercent.toFixed(1)}%)
            </span>
          )}
          {safetyRating === 'deficit' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-700" />
              BÁO ĐỘNG: CHƯA ĐẠT HÒA VỐN ({marginOfSafetyPercent.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* 3 Thẻ chỉ số cốt lõi của Biên độ an toàn */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Doanh thu an toàn */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Doanh Thu An Toàn (MoS Revenue)</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className={`text-2xl font-extrabold mt-1 tracking-tight ${
            marginOfSafetyRevenue >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {marginOfSafetyRevenue >= 0 ? `+${formatNumberVi(marginOfSafetyRevenue)} đ` : `-${formatNumberVi(Math.abs(marginOfSafetyRevenue))} đ`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            = Doanh thu kế hoạch ({formatNumberVi(totalRevenue)}) - Hòa vốn ({formatNumberVi(breakEvenRevenue)})
          </div>
        </div>

        {/* Card 2: Sản lượng an toàn */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Sản Lượng An Toàn (MoS Units)</span>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className={`text-2xl font-extrabold mt-1 tracking-tight ${
            marginOfSafetyUnits >= 0 ? 'text-indigo-700' : 'text-rose-700'
          }`}>
            {marginOfSafetyUnits >= 0 ? `+${formatNumberVi(marginOfSafetyUnits)} sp` : `-${formatNumberVi(Math.abs(marginOfSafetyUnits))} sp`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            = Sản lượng kế hoạch ({formatNumberVi(totalUnits)}) - Hòa vốn ({formatNumberVi(breakEvenUnits)})
          </div>
        </div>

        {/* Card 3: Tỷ lệ an toàn */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tỷ Lệ Biên Độ An Toàn (MoS %)</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className={`text-2xl font-extrabold mt-1 tracking-tight ${
            marginOfSafetyPercent >= 20
              ? 'text-emerald-700'
              : marginOfSafetyPercent > 0
              ? 'text-amber-700'
              : 'text-rose-700'
          }`}>
            {marginOfSafetyPercent >= 0 ? `+${marginOfSafetyPercent.toFixed(1)}%` : `${marginOfSafetyPercent.toFixed(1)}%`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Mức độ doanh thu có thể giảm tối đa mà không gây lỗ
          </div>
        </div>
      </div>

      {/* Thước đo trực quan cấp độ an toàn (Safety Gauge Meter Bar) */}
      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
          <span>Thước Đo Mức Độ An Toàn CVP (Safety Health Index)</span>
          <span className="text-slate-500 font-medium">Hiện tại: {marginOfSafetyPercent.toFixed(1)}%</span>
        </div>

        {/* Meter progress bar */}
        <div className="relative w-full h-4 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
          <div className="w-[20%] bg-rose-500 h-full" title="Thâm hụt / Dưới hòa vốn (<0%)" />
          <div className="w-[20%] bg-amber-400 h-full" title="Vùng đệm mỏng (0% - 15%)" />
          <div className="w-[30%] bg-blue-500 h-full" title="Vùng an toàn tiêu chuẩn (15% - 30%)" />
          <div className="w-[30%] bg-emerald-500 h-full" title="Vùng rất an toàn & vững vàng (>30%)" />

          {/* Indicator pin */}
          {marginOfSafetyPercent >= -20 && (
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-slate-950 shadow-md transform -translate-x-1/2"
              style={{
                left: `${Math.max(2, Math.min(98, ((marginOfSafetyPercent + 20) / 70) * 100))}%`,
              }}
            />
          )}
        </div>

        {/* Meter labels */}
        <div className="grid grid-cols-4 text-[10px] text-slate-500 mt-1.5 font-medium text-center">
          <span className="text-rose-600">Thâm hụt (&lt;0%)</span>
          <span className="text-amber-600">Đệm mỏng (0-15%)</span>
          <span className="text-blue-600">An toàn (15-30%)</span>
          <span className="text-emerald-600">Rất an toàn (&gt;30%)</span>
        </div>
      </div>

      {/* Nhận định quản trị điều hành (Executive Management Takeaway) */}
      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
          <div className="font-bold text-indigo-950 text-sm">
            Khuyến Nghị &amp; Nhận Định Điều Hành Cấp CFO:
          </div>
          {marginOfSafetyPercent > 0 ? (
            <p>
              Doanh số dự phóng của dự án có khả năng chịu đựng mức sụt giảm tối đa{' '}
              <strong className="text-indigo-900 font-bold">{marginOfSafetyPercent.toFixed(1)}%</strong>{' '}
              (tương đương giảm tối đa{' '}
              <strong className="text-indigo-900 font-bold">{formatNumberVi(marginOfSafetyRevenue)} đ</strong>{' '}
              hoặc <strong className="text-indigo-900 font-bold">{formatNumberVi(marginOfSafetyUnits)} sản phẩm</strong>)
              trước khi doanh nghiệp bắt đầu phát sinh thua lỗ. Mỗi sản phẩm bán vượt qua mốc{' '}
              {formatNumberVi(breakEvenUnits)} sp sẽ đóng góp trọn vẹn{' '}
              <strong className="text-emerald-700 font-bold">{formatNumberVi(unitContributionMargin)} đ</strong>{' '}
              vào lợi nhuận ròng EBT của công ty.
            </p>
          ) : (
            <p className="text-rose-900">
              Kế hoạch hiện tại đang thiếu hụt{' '}
              <strong className="font-bold">{formatNumberVi(Math.abs(marginOfSafetyRevenue))} đ</strong>{' '}
              doanh thu (tương đương{' '}
              <strong className="font-bold">{formatNumberVi(Math.abs(marginOfSafetyUnits))} sản phẩm</strong>)
              để đạt điểm hòa vốn tích lũy. Cần kích hoạt các đòn bẩy quản trị: tăng trưởng doanh số,
              nâng giá bán bình quân hoặc cắt giảm định phí để đưa dự án về vùng an toàn.
            </p>
          )}
        </div>
      </div>

      {/* Bảng thử nghiệm độ nhạy (Sensitivity Stress-Testing Scenarios) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            Kiểm Tra Độ Nhạy Quản Trị (Stress-Test Scenarios)
          </span>
          <span className="text-[11px] text-slate-500">Mô phỏng 4 cú sốc thị trường thường gặp</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Kịch Bản Cú Sốc</th>
                <th className="px-4 py-2.5 text-right">Doanh Thu Dự Kiến</th>
                <th className="px-4 py-2.5 text-right">Điểm Hòa Vốn Mới</th>
                <th className="px-4 py-2.5 text-right">Biên An Toàn Mới (MoS)</th>
                <th className="px-4 py-2.5 text-right">Lợi Nhuận EBT Còn Lại</th>
                <th className="px-4 py-2.5 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* Kịch bản gốc */}
              <tr className="bg-white">
                <td className="px-4 py-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Kế hoạch gốc (Base Case)
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatNumberVi(totalRevenue)} đ</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{formatNumberVi(breakEvenRevenue)} đ</td>
                <td className="px-4 py-2.5 text-right font-bold text-indigo-700">+{marginOfSafetyPercent.toFixed(1)}%</td>
                <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                  +{formatNumberVi(Math.round(totalRevenue * (contributionMarginRatio / 100) - fixedCosts))} đ
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Chuẩn
                  </span>
                </td>
              </tr>

              {/* Kịch bản 1: Doanh số giảm 10% */}
              <tr className="bg-slate-50/40 hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-800">Doanh số sụt giảm -10% do sức mua suy yếu</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{formatNumberVi(revDown10)} đ</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{formatNumberVi(breakEvenRevenue)} đ</td>
                <td className={`px-4 py-2.5 text-right font-bold ${mosPctDown10 >= 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                  {mosPctDown10.toFixed(1)}%
                </td>
                <td className={`px-4 py-2.5 text-right font-bold ${profitDown10 >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {profitDown10 >= 0 ? `+${formatNumberVi(profitDown10)} đ` : `-${formatNumberVi(Math.abs(profitDown10))} đ`}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    profitDown10 >= 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {profitDown10 >= 0 ? 'Chịu được' : 'Bị lỗ'}
                  </span>
                </td>
              </tr>

              {/* Kịch bản 2: Doanh số giảm 20% */}
              <tr className="bg-white hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-800">Doanh số sụt giảm -20% (Khủng hoảng đối thủ cạnh tranh)</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{formatNumberVi(revDown20)} đ</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{formatNumberVi(breakEvenRevenue)} đ</td>
                <td className={`px-4 py-2.5 text-right font-bold ${mosPctDown20 >= 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                  {mosPctDown20.toFixed(1)}%
                </td>
                <td className={`px-4 py-2.5 text-right font-bold ${profitDown20 >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {profitDown20 >= 0 ? `+${formatNumberVi(profitDown20)} đ` : `-${formatNumberVi(Math.abs(profitDown20))} đ`}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    profitDown20 >= 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {profitDown20 >= 0 ? 'Chịu được' : 'Nguy cấp'}
                  </span>
                </td>
              </tr>

              {/* Kịch bản 3: Định phí tăng 15% */}
              <tr className="bg-slate-50/40 hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-800">Định phí FC tăng +15% (Chi phí thuê văn phòng, nhân sự tăng)</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{formatNumberVi(totalRevenue)} đ</td>
                <td className="px-4 py-2.5 text-right font-semibold text-rose-700">{formatNumberVi(bepRevFcUp)} đ</td>
                <td className={`px-4 py-2.5 text-right font-bold ${mosPctFcUp >= 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                  {mosPctFcUp.toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-800">
                  {formatNumberVi(Math.round(totalRevenue * (contributionMarginRatio / 100) - fcUp15))} đ
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    BEP tăng
                  </span>
                </td>
              </tr>

              {/* Kịch bản 4: Biến phí tăng làm CMR giảm 5% */}
              <tr className="bg-white hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-800">Phí sàn/Ads tăng làm Tỷ lệ Đảm phí CMR giảm -5%</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{formatNumberVi(totalRevenue)} đ</td>
                <td className="px-4 py-2.5 text-right font-semibold text-rose-700">{formatNumberVi(bepRevCmrDown)} đ</td>
                <td className={`px-4 py-2.5 text-right font-bold ${mosPctCmrDown >= 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                  {mosPctCmrDown.toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-800">
                  {formatNumberVi(Math.round(totalRevenue * (cmrDown5 / 100) - fixedCosts))} đ
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Biên mỏng
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 Đòn bẩy hành động quản trị (Strategic Levers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">1</span>
            Đòn Bẩy 1: Cắt Giảm &amp; Tối Ưu Định Phí (Fixed Costs)
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Mỗi 10 triệu đồng cắt giảm định phí hàng tháng sẽ trực tiếp hạ điểm hòa vốn xuống{' '}
            <strong className="text-indigo-800">
              ~{contributionMarginRatio > 0 ? formatNumberVi(Math.round(10000000 / (contributionMarginRatio / 100))) : 0} đ
            </strong>{' '}
            doanh thu, giúp biên độ an toàn nới rộng ngay lập tức.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">2</span>
            Đòn Bẩy 2: Tối Ưu Giá Vốn COGS &amp; Chi Phí Biến Đổi
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Đàm phán số lượng lớn theo các mốc Tier đặt hàng PO với nhà cung ứng để giảm đơn giá COGS và chi phí bao bì,
            trực tiếp gia tăng Tỷ lệ số dư đảm phí (CMR).
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">3</span>
            Đòn Bẩy 3: Đẩy Mạnh Combo Có CMR Cao (Product Mix)
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Đóng gói combo sản phẩm để nâng giá trị đơn hàng trung bình (AOV), tiết kiệm chi phí bao bì và phí sàn cố định
            trên mỗi đơn hàng xuất kho.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-200 transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">4</span>
            Đòn Bẩy 4: Dịch Chuyển Tỷ Trọng Kênh Bán Hàng
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Ưu tiên phân bổ nguồn lực sang kênh có chi phí bán hàng thấp hơn hoặc kênh B2B với tỷ lệ đảm phí bền vững
            để nhanh chóng bù đắp chi phí cố định toàn công ty.
          </p>
        </div>
      </div>
    </div>
  );
};
