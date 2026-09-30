import React, { useState } from 'react';
import { BreakEvenPointAnalysis, MonthlyPnlRecord } from '../../utils/reportCalculations';
import { formatNumberVi } from '../../utils/formatters';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Target, 
  HeartHandshake, 
  Flame, 
  Zap, 
  BarChart3, 
  ChevronRight,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';

interface ProjectHealthDiagnosisProps {
  bep: BreakEvenPointAnalysis;
  pnlSummary: any;
  cashFlowSummary?: any;
  totalGrossRevenue: number;
}

export const ProjectHealthDiagnosis: React.FC<ProjectHealthDiagnosisProps> = ({
  bep,
  pnlSummary,
  cashFlowSummary,
  totalGrossRevenue,
}) => {
  const [selectedPillar, setSelectedPillar] = useState<'all' | 'bep' | 'profit' | 'cash' | 'cost'>('all');

  // 1. Chỉ số Trụ cột 1: Hòa Vốn & Biên An Toàn (BEP & Margin of Safety)
  const mosPercent = bep.marginOfSafetyPercent;
  let bepScore = 0;
  if (mosPercent >= 35) bepScore = 25;
  else if (mosPercent >= 20) bepScore = 20;
  else if (mosPercent >= 10) bepScore = 15;
  else if (mosPercent >= 0) bepScore = 10;
  else if (mosPercent >= -15) bepScore = 5;
  else bepScore = 0;

  // 2. Chỉ số Trụ cột 2: Năng Lực Sinh Lời (Profitability & Margins)
  const grossMargin = pnlSummary?.grossMargin || 0;
  const netMargin = pnlSummary?.netMargin || 0;
  let profitScore = 0;
  if (netMargin >= 18 && grossMargin >= 45) profitScore = 25;
  else if (netMargin >= 12 && grossMargin >= 35) profitScore = 21;
  else if (netMargin >= 8 && grossMargin >= 25) profitScore = 16;
  else if (netMargin >= 3) profitScore = 11;
  else if (netMargin >= 0) profitScore = 6;
  else profitScore = 2;

  // 3. Chỉ số Trụ cột 3: Dòng Tiền & Đệm Thanh Khoản (Cash Flow & Liquidity)
  const minCashBalance = cashFlowSummary?.minCashBalance ?? cashFlowSummary?.minBalance ?? 0;
  const isCashDeficit = minCashBalance < 0;
  const deficitAmount = isCashDeficit ? Math.abs(minCashBalance) : 0;
  const finalCashBalance = cashFlowSummary?.endingBalance ?? cashFlowSummary?.finalCashBalance ?? 0;
  let cashScore = 0;
  if (!isCashDeficit && minCashBalance >= 50000000 && finalCashBalance > minCashBalance) cashScore = 25;
  else if (!isCashDeficit && minCashBalance >= 20000000) cashScore = 20;
  else if (!isCashDeficit && minCashBalance >= 0) cashScore = 15;
  else if (isCashDeficit && deficitAmount < 100000000) cashScore = 9;
  else if (isCashDeficit && deficitAmount < 300000000) cashScore = 5;
  else cashScore = 1;

  // 4. Chỉ số Trụ cột 4: Cấu Trúc Chi Phí & Đòn Bẩy Hoạt Động (Cost Structure & DOL)
  const cmr = bep.contributionMarginRatio;
  const fixedCostRatio = totalGrossRevenue > 0 ? (bep.totalFixedCosts / totalGrossRevenue) * 100 : 0;
  let costScore = 0;
  if (cmr >= 45 && fixedCostRatio <= 25) costScore = 25;
  else if (cmr >= 35 && fixedCostRatio <= 35) costScore = 21;
  else if (cmr >= 25) costScore = 16;
  else if (cmr >= 18) costScore = 10;
  else costScore = 5;

  // TỔNG ĐIỂM SỨC KHỎE DỰ ÁN (0 - 100)
  const totalHealthScore = Math.min(100, Math.max(0, bepScore + profitScore + cashScore + costScore));

  // Đánh giá xếp loại tổng quan
  let healthGrade: {
    title: string;
    badgeColor: string;
    textColor: string;
    borderColor: string;
    bgGradient: string;
    summary: string;
  };

  if (totalHealthScore >= 85) {
    healthGrade = {
      title: 'SỨC KHỎE VỮNG VÀNG (PRIME HEALTH)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      summary: 'Dự án sở hữu biên độ an toàn cao, dòng tiền thanh khoản dồi dào và biên lợi nhuận ròng vượt chuẩn. Có tiềm lực mở rộng quy mô (Scale-up) mạnh mẽ.',
    };
  } else if (totalHealthScore >= 70) {
    healthGrade = {
      title: 'SỨC KHỎE TỐT & KHẢ QUAN (HEALTHY)',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      bgGradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
      summary: 'Các chỉ số tài chính nằm trong vùng an toàn có lãi. Cần chú trọng tối ưu thêm tỷ lệ chi phí sàn và nâng cao tốc độ luân chuyển dòng tiền.',
    };
  } else if (totalHealthScore >= 50) {
    healthGrade = {
      title: 'CẦN THEO DÕI CẬN CẢNH (WATCHLIST / MODERATE)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      bgGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      summary: 'Dự án tiềm ẩn rủi ro về thâm hụt tiền mặt hoặc biên lợi nhuận mỏng. Cần kiểm soát chặt chi phí cố định (FC) và đàm phán lại giá vốn đầu vào.',
    };
  } else {
    healthGrade = {
      title: 'BÁO ĐỘNG ĐỎ - RỦI RO CAO (HIGH RISK)',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      textColor: 'text-rose-700',
      borderColor: 'border-rose-200',
      bgGradient: 'from-rose-500/10 via-red-500/5 to-transparent',
      summary: 'Dự án đang trong vùng tổn thương tài chính nghiêm trọng. Chưa đạt điểm hòa vốn hoặc dòng tiền cạn kiệt, cần tái cấu trúc chi phí khẩn cấp.',
    };
  }

  // Danh mục chẩn đoán tự động theo thời gian thực
  const strengths: string[] = [];
  const vulnerabilities: string[] = [];
  const actionPrescriptions: { priority: 'P1' | 'P2' | 'P3'; title: string; desc: string; impact: string }[] = [];

  // Phân tích điểm mạnh
  if (mosPercent >= 20) {
    strengths.push(`Biên độ an toàn rất vững (MoS = +${mosPercent.toFixed(1)}%), chịu được cú sốc giảm tới ${mosPercent.toFixed(0)}% doanh thu mà vẫn không lỗ.`);
  }
  if (grossMargin >= 40) {
    strengths.push(`Biên lợi nhuận gộp cao (${grossMargin.toFixed(1)}%), tạo đệm lợi nhuận dày để đầu tư cho quảng cáo và xúc tiến bán hàng.`);
  }
  if (!isCashDeficit && minCashBalance >= 30000000) {
    strengths.push(`Không bị thâm hụt vốn lưu động, số dư tiền mặt luôn duy trì trên ${formatNumberVi(minCashBalance)} đ.`);
  }
  if (cmr >= 35) {
    strengths.push(`Tỷ lệ Lãi trên biến phí đạt ${cmr.toFixed(1)}%, mỗi 100 đ doanh thu tăng thêm sẽ đóng góp ${cmr.toFixed(0)} đ vào bù đắp định phí.`);
  }
  if (strengths.length === 0) {
    strengths.push(`Dự án đã thiết lập được khung kế hoạch chi phí và theo dõi dòng tiền rõ ràng.`);
  }

  // Phân tích điểm nghẽn & rủi ro
  if (mosPercent < 15) {
    vulnerabilities.push(`Biên an toàn mỏng (${mosPercent.toFixed(1)}%), doanh thu chỉ cần sụt giảm nhẹ là dự án rơi vào vùng thua lỗ.`);
  }
  if (isCashDeficit) {
    vulnerabilities.push(`Phát hiện thâm hụt dòng tiền mặt cao nhất lên tới -${formatNumberVi(deficitAmount)} đ. Cần chuẩn bị hạn mức tín dụng hoặc rót thêm vốn chủ.`);
  }
  if (pnlSummary?.platformFees > 0 && totalGrossRevenue > 0 && (pnlSummary.platformFees / totalGrossRevenue) > 0.12) {
    vulnerabilities.push(`Chi phí sàn TMĐT chiếm tới ${((pnlSummary.platformFees / totalGrossRevenue) * 100).toFixed(1)}% doanh thu, đang bào mòn biên lợi nhuận ròng.`);
  }
  if (fixedCostRatio > 35) {
    vulnerabilities.push(`Gánh nặng định phí lớn (${fixedCostRatio.toFixed(1)}% doanh thu), tạo áp lực doanh số bắt buộc hàng tháng.`);
  }
  if (vulnerabilities.length === 0) {
    vulnerabilities.push(`Biến động doanh thu theo mùa vụ hoặc trễ hạn giải ngân từ ví sàn về tài khoản ngân hàng.`);
  }

  // Toa thuốc hành động quản trị (Action Prescriptions)
  if (isCashDeficit) {
    actionPrescriptions.push({
      priority: 'P1',
      title: 'Giải Quyết Thâm Hụt Tiền Mặt Tức Thì',
      desc: `Bổ sung đệm tiền mặt tối thiểu ${formatNumberVi(deficitAmount * 1.2)} đ hoặc đàm phán lùi hạn thanh toán công nợ nhà cung cấp lô PO đầu tiên thêm 15-30 ngày.`,
      impact: 'Tránh nguy cơ đứt gãy thanh toán vận hành kho bãi và lương nhân sự.',
    });
  } else {
    actionPrescriptions.push({
      priority: 'P1',
      title: 'Đẩy Nhanh Tốc Độ Về Điểm Hòa Vốn',
      desc: `Tập trung tối đa ngân sách marketing vào 2 SKU có tỷ suất lãi góp (UCM) cao nhất để sớm đạt mốc sản lượng ${formatNumberVi(bep.breakEvenUnits)} sản phẩm.`,
      impact: 'Rút ngắn thời gian thu hồi vốn và giảm rủi ro định phí lũy kế.',
    });
  }

  actionPrescriptions.push({
    priority: 'P2',
    title: 'Tối Ưu Phí Sàn & Giảm Chi Phí Voucher Ảo',
    desc: 'Rà soát lại các gói Voucher Xtra, Freeship Xtra trên Shopee/TikTok. Chỉ áp dụng cho các đơn hàng có giá trị AOV cao trên mức hòa vốn.',
    impact: 'Tiết kiệm ước tính 2.5% - 4.0% doanh thu thuần, chuyển thẳng thành lợi nhuận ròng.',
  });

  actionPrescriptions.push({
    priority: 'P3',
    title: 'Cơ Cấu Lại Tỷ Trọng Kênh Bán Hàng (Channel Mix)',
    desc: 'Tăng cường khai thác kênh B2B và Bán lẻ trực tiếp D2C (ít chịu phí sàn 10-15%) để cân bằng với các sàn TMĐT.',
    impact: 'Nâng tỷ lệ số dư đảm phí toàn dự án (CMR) lên thêm 3.5% - 5.0%.',
  });

  return (
    <div id="project-health-diagnosis-card" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-2xs">
            <Activity className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Tự Động Chẩn Đoán Sức Khỏe Dự Án (Project Health Diagnosis)
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Thuật Toán CFO
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống tự động chấm điểm 4 trụ cột tài chính theo thời gian thực và lập báo cáo chẩn đoán chuyên sâu
            </p>
          </div>
        </div>

        {/* Health Score Badge lớn */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Điểm Sức Khỏe Tổng Hợp
            </span>
            <span className="text-xs font-semibold text-slate-700">
              Thang điểm 100
            </span>
          </div>
          <div className={`text-3xl font-black font-mono px-3 py-1 rounded-xl bg-white shadow-xs border ${healthGrade.borderColor} ${healthGrade.textColor}`}>
            {totalHealthScore}
            <span className="text-xs text-slate-400 font-normal">/100</span>
          </div>
        </div>
      </div>

      {/* Banner Đánh Giá Tổng Quan */}
      <div className={`p-4 sm:p-5 rounded-2xl border bg-gradient-to-r ${healthGrade.bgGradient} ${healthGrade.borderColor}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${healthGrade.badgeColor}`}>
                {healthGrade.title}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                • Cập nhật tức thì từ số liệu P&L và Dòng tiền
              </span>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {healthGrade.summary}
            </p>
          </div>
        </div>
      </div>

      {/* 4 TRỤ CỘT ĐÁNH GIÁ ĐỊNH LƯỢNG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* TRỤ CỘT 1: HÒA VỐN & BIÊN AN TOÀN */}
        <div className={`p-4 rounded-xl border transition-all ${
          selectedPillar === 'bep' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : 'bg-slate-50/60 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider">1. Điểm Hòa Vốn</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-indigo-700">{bepScore} / 25</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              bepScore >= 20 ? 'bg-emerald-100 text-emerald-800' : bepScore >= 10 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {mosPercent >= 20 ? 'Rất An Toàn' : mosPercent >= 0 ? 'Hòa Vốn' : 'Thâm Hụt'}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${(bepScore / 25) * 100}%` }} />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 space-y-0.5 font-mono">
            <div>MoS: {mosPercent >= 0 ? '+' : ''}{mosPercent.toFixed(1)}%</div>
            <div>BEP: {formatNumberVi(bep.breakEvenRevenue)} đ</div>
          </div>
        </div>

        {/* TRỤ CỘT 2: NĂNG LỰC SINH LỜI */}
        <div className={`p-4 rounded-xl border transition-all ${
          selectedPillar === 'profit' ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : 'bg-slate-50/60 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider">2. Năng Lực Sinh Lời</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-emerald-700">{profitScore} / 25</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              profitScore >= 20 ? 'bg-emerald-100 text-emerald-800' : profitScore >= 10 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
            }`}>
              Net: {netMargin.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${(profitScore / 25) * 100}%` }} />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 space-y-0.5 font-mono">
            <div>Gross Margin: {grossMargin.toFixed(1)}%</div>
            <div>Net Profit: {formatNumberVi(pnlSummary?.netProfit || 0)} đ</div>
          </div>
        </div>

        {/* TRỤ CỘT 3: DÒNG TIỀN & THANH KHOẢN */}
        <div className={`p-4 rounded-xl border transition-all ${
          selectedPillar === 'cash' ? 'ring-2 ring-sky-500 bg-sky-50/20' : 'bg-slate-50/60 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider">3. Dòng Tiền & Vốn</span>
            <DollarSign className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-sky-700">{cashScore} / 25</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              cashScore >= 20 ? 'bg-emerald-100 text-emerald-800' : cashScore >= 10 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {!isCashDeficit ? 'Đủ Vốn' : 'Thiếu Tiền'}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-sky-600 h-full rounded-full transition-all" style={{ width: `${(cashScore / 25) * 100}%` }} />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 space-y-0.5 font-mono">
            <div>Min Tiền Mặt: {formatNumberVi(minCashBalance)} đ</div>
            <div>Số dư cuối kỳ: {formatNumberVi(finalCashBalance)} đ</div>
          </div>
        </div>

        {/* TRỤ CỘT 4: CẤU TRÚC CHI PHÍ & ĐÒN BẨY HOẠT ĐỘNG */}
        <div className={`p-4 rounded-xl border transition-all ${
          selectedPillar === 'cost' ? 'ring-2 ring-purple-500 bg-purple-50/20' : 'bg-slate-50/60 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider">4. Cấu Trúc Chi Phí</span>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-purple-700">{costScore} / 25</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              costScore >= 20 ? 'bg-emerald-100 text-emerald-800' : costScore >= 10 ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
            }`}>
              CMR: {cmr.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${(costScore / 25) * 100}%` }} />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 space-y-0.5 font-mono">
            <div>Tỷ lệ Định Phí: {fixedCostRatio.toFixed(1)}%</div>
            <div>Tỷ lệ Biến Phí: {bep.variableCostRatio.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* CHI TIẾT BỆNH ÁN: ĐIỂM MẠNH & NGUY CƠ TIỀM ẨN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Khối Điểm Mạnh */}
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Điểm Mạnh Tài Chính Cốt Lõi (Core Strengths)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {strengths.map((s, idx) => (
              <li key={`str-${idx}`} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Khối Cảnh Báo Nguy Cơ */}
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Cảnh Báo Rủi Ro & Điểm Nghẽn (Vulnerabilities)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {vulnerabilities.map((v, idx) => (
              <li key={`vul-${idx}`} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold mt-0.5">⚠</span>
                <span className="leading-relaxed">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* TOA THUỐC HÀNH ĐỘNG QUẢN TRỊ (ACTION PRESCRIPTIONS) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Toa Thuốc Hành Động Quản Trị Ưu Tiên (CFO Action Prescriptions)</span>
          </div>
          <span className="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200">
            Tối Ưu Ngay
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {actionPrescriptions.map((action, idx) => (
            <div key={`act-${idx}`} className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    action.priority === 'P1' 
                      ? 'bg-rose-100 text-rose-800' 
                      : action.priority === 'P2' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {action.priority} - {action.priority === 'P1' ? 'Cấp Bách' : action.priority === 'P2' ? 'Cần Tối Ưu' : 'Khả Quan'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-2">
                  {action.title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                  {action.desc}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[10px] text-indigo-700 font-medium">
                <strong>Tác động:</strong> {action.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
