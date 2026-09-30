import React, { useState, useMemo } from 'react';
import { 
  SalaryStructurePosition, 
  HeadcountPlanMap, 
  InitialCapexItem, 
  MonthlyOperatingExpense, 
  HrOperationsConfig 
} from '../types/hrOperations';
import { SalesMonth } from '../types/salesForecast';
import { ProjectParameters } from '../types/financial';
import { 
  calculatePositionSingleCost, 
  calculateMonthlySalaryMatrix, 
  calculateCapexDepreciationMatrix, 
  calculateMonthlyOpexMatrix,
  formatNumberVi 
} from '../utils/hrCalculations';
import { SalaryStructureModal } from './SalaryStructureModal';
import { PositionModal } from './PositionModal';
import { InitialCapexModal } from './InitialCapexModal';
import { MonthlyOpexModal } from './MonthlyOpexModal';
import { 
  Users, 
  Coins, 
  Building, 
  Boxes, 
  Plus, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  Copy, 
  Sliders, 
  HelpCircle,
  BarChart3,
  Edit3,
  Trash2,
  Gift,
  Calendar,
  Layers,
  Percent
} from 'lucide-react';

interface HrOperationsSectionProps {
  parameters: ProjectParameters;
  months: SalesMonth[];
  positions: SalaryStructurePosition[];
  headcountMap: HeadcountPlanMap;
  capexItems: InitialCapexItem[];
  opexItems: MonthlyOperatingExpense[];
  hrConfig: HrOperationsConfig;
  onUpdatePositions: (positions: SalaryStructurePosition[]) => void;
  onUpdateHeadcountMap: (map: HeadcountPlanMap) => void;
  onUpdateCapexItems: (items: InitialCapexItem[]) => void;
  onUpdateOpexItems: (items: MonthlyOperatingExpense[]) => void;
  onUpdateHrConfig: (cfg: HrOperationsConfig) => void;
  onResetToDefault: () => void;
}

export const HrOperationsSection: React.FC<HrOperationsSectionProps> = ({
  parameters,
  months,
  positions,
  headcountMap,
  capexItems,
  opexItems,
  hrConfig,
  onUpdatePositions,
  onUpdateHeadcountMap,
  onUpdateCapexItems,
  onUpdateOpexItems,
  onUpdateHrConfig,
  onResetToDefault,
}) => {
  // Sub-header Modals States
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isCapexModalOpen, setIsCapexModalOpen] = useState(false);
  const [isOpexModalOpen, setIsOpexModalOpen] = useState(false);

  // Position Add/Edit Modal
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<SalaryStructurePosition | null>(null);

  // Expanded details toggles
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [showAllInOpexTable, setShowAllInOpexTable] = useState(true);

  // Notification / toast feedback
  const [copiedRowNotice, setCopiedRowNotice] = useState<string | null>(null);

  // 1. Calculate Salary Matrix
  const salaryMatrix = useMemo(() => {
    return calculateMonthlySalaryMatrix(
      positions,
      headcountMap,
      months,
      parameters.taxAndCapital,
      hrConfig
    );
  }, [positions, headcountMap, months, parameters.taxAndCapital, hrConfig]);

  // 2. Calculate Capex Depreciation Matrix
  const capexMatrix = useMemo(() => {
    return calculateCapexDepreciationMatrix(capexItems, months);
  }, [capexItems, months]);

  // 3. Calculate Monthly Opex Matrix (xét tháng bắt đầu phát sinh)
  const opexMatrix = useMemo(() => {
    return calculateMonthlyOpexMatrix(opexItems, months);
  }, [opexItems, months]);

  // 4. Totals
  const totalMonthlyOpex = useMemo(() => {
    return opexItems.reduce((sum, item) => sum + item.amount, 0);
  }, [opexItems]);

  const totalProjectOpexCost = useMemo(() => {
    const vals = Object.values(opexMatrix.monthlyTotalOpex) as number[];
    return vals.reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [opexMatrix.monthlyTotalOpex]);

  const totalCapex = useMemo(() => {
    return capexItems.reduce((sum, item) => sum + item.amount, 0);
  }, [capexItems]);

  const totalMonthlyCapexDepreciation = useMemo(() => {
    return capexItems.reduce((sum, item) => {
      if (item.depreciationMonths > 0) {
        return sum + Math.round(item.amount / item.depreciationMonths);
      }
      return sum;
    }, 0);
  }, [capexItems]);

  const baseFullMonthlySalary = useMemo(() => {
    return positions.reduce((sum, pos) => {
      const single = salaryMatrix.breakdownByPos[pos.id]?.totalCompanyCost || 0;
      return sum + single;
    }, 0);
  }, [positions, salaryMatrix.breakdownByPos]);

  const totalProjectSalaryCost = useMemo(() => {
    const vals = Object.values(salaryMatrix.monthlyTotalSalary) as number[];
    return vals.reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [salaryMatrix.monthlyTotalSalary]);

  const currentHeadcount = useMemo(() => {
    // Lấy tháng cuối hoặc tháng có dữ liệu gần nhất
    if (months.length === 0) return 0;
    const lastMonth = months[months.length - 1].id;
    return salaryMatrix.monthlyTotalHeadcount[lastMonth] || 0;
  }, [months, salaryMatrix.monthlyTotalHeadcount]);

  const peakHeadcount = useMemo(() => {
    const counts = Object.values(salaryMatrix.monthlyTotalHeadcount) as number[];
    return Math.max(0, ...counts);
  }, [salaryMatrix.monthlyTotalHeadcount]);

  // Handle Headcount Input Change
  const handleHeadcountChange = (posId: string, monthId: string, value: number) => {
    const val = Math.max(0, Math.floor(value));
    onUpdateHeadcountMap({
      ...headcountMap,
      [posId]: {
        ...(headcountMap[posId] || {}),
        [monthId]: val,
      },
    });
  };

  // Quick Action: Fill Right (sao chép số lượng của 1 vị trí từ tháng đầu hoặc tháng đang chọn sang toàn bộ các tháng sau)
  const handleFillRight = (posId: string, fromMonthIndex: number = 0) => {
    if (fromMonthIndex >= months.length) return;
    const baseMonthId = months[fromMonthIndex].id;
    const baseCount = headcountMap[posId]?.[baseMonthId] ?? 1;

    const newRow = { ...(headcountMap[posId] || {}) };
    for (let i = fromMonthIndex; i < months.length; i++) {
      newRow[months[i].id] = baseCount;
    }

    onUpdateHeadcountMap({
      ...headcountMap,
      [posId]: newRow,
    });

    const targetPos = positions.find((p) => p.id === posId);
    setCopiedRowNotice(`Đã sao chép số lượng ${baseCount} cho vị trí "${targetPos?.title}" sang các tháng tiếp theo`);
    setTimeout(() => setCopiedRowNotice(null), 3000);
  };

  // Quick Action: Fill All positions across all months with their current value
  const handleFillAllRight = () => {
    const newMap: HeadcountPlanMap = {};
    positions.forEach((pos) => {
      newMap[pos.id] = {};
      // Tìm số lượng gần nhất không bằng 0 hoặc mặc định 1
      let count = 1;
      for (const m of months) {
        if ((headcountMap[pos.id]?.[m.id] ?? 0) > 0) {
          count = headcountMap[pos.id][m.id];
          break;
        }
      }
      months.forEach((m) => {
        newMap[pos.id][m.id] = count;
      });
    });
    onUpdateHeadcountMap(newMap);
    setCopiedRowNotice('Đã đồng bộ định biên nhân sự cho toàn bộ các tháng');
    setTimeout(() => setCopiedRowNotice(null), 3000);
  };

  // Save Position Handler
  const handleSavePosition = (pos: SalaryStructurePosition) => {
    const exists = positions.some((p) => p.id === pos.id);
    if (exists) {
      onUpdatePositions(positions.map((p) => (p.id === pos.id ? pos : p)));
    } else {
      onUpdatePositions([...positions, pos]);
      // Khởi tạo headcount cho vị trí mới = 1 từ tháng đầu
      const newPosHeadcounts: Record<string, number> = {};
      months.forEach((m) => {
        newPosHeadcounts[m.id] = 1;
      });
      onUpdateHeadcountMap({
        ...headcountMap,
        [pos.id]: newPosHeadcounts,
      });
    }
  };

  const openAddPosition = () => {
    setEditingPosition(null);
    setIsPositionModalOpen(true);
  };

  const openEditPosition = (pos: SalaryStructurePosition) => {
    setEditingPosition(pos);
    setIsPositionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP SUB-HEADER CONTROL BAR WITH 3 PRIMARY MODAL BUTTONS */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kế Hoạch Nhân Sự &amp; Chi Phí Vận Hành</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Space_Grotesk']">
              Nhân Sự &amp; Vận Hành (HR &amp; Operations)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Định biên Headcount hàng ngang theo tháng, tính toán chi phí lương thực tế theo cơ cấu bảo hiểm &amp; thuế, 
              quản lý vốn đầu tư ban đầu (Capex) và chi phí vận hành kho bãi cố định (Opex).
            </p>
          </div>

          {/* SUB-HEADER BUTTONS REQUESTED BY USER */}
          <div className="shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:max-w-md">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 lg:text-right">
              Cấu trúc chi phí định phí (Sub-modals):
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {/* Nút 1: Cơ Cấu Lương */}
              <button
                id="btn-sub-salary-structure"
                onClick={() => setIsSalaryModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cơ Cấu Lương ({positions.length})</span>
              </button>

              {/* Nút 2: Vốn Đầu Tư Ban Đầu */}
              <button
                id="btn-sub-initial-capex"
                onClick={() => setIsCapexModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Building className="w-3.5 h-3.5 text-amber-600" />
                <span>Vốn Đầu Tư Capex ({capexItems.length})</span>
              </button>

              {/* Nút 3: Chi Phí Vận Hành Tháng */}
              <button
                id="btn-sub-monthly-opex"
                onClick={() => setIsOpexModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Boxes className="w-3.5 h-3.5 text-blue-600" />
                <span>Chi Phí Vận Hành Opex ({opexItems.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notice feedback if copied */}
        {copiedRowNotice && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{copiedRowNotice}</span>
          </div>
        )}
      </div>

      {/* 2. CFO EXECUTIVE METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Tổng Chi Phí Lương Cả Kỳ */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Tổng Chi Phí Lương ({months.length}T)</span>
            <Users className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 font-bold font-mono text-slate-900 text-base lg:text-lg">
            {formatNumberVi(totalProjectSalaryCost)} đ
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            Lũy kế toàn bộ các vị trí
          </div>
        </div>

        {/* Card 2: Headcount Peak */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Định Biên Nhân Sự</span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-1 font-bold font-mono text-slate-900 text-base lg:text-lg">
            {peakHeadcount} Nhân Sự
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
            Hiện tại: {currentHeadcount} NV đang làm việc
          </div>
        </div>

        {/* Card 3: Chi Phí Lương Ổn Định / Tháng */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Quỹ Lương Đỉnh / Tháng</span>
            <Coins className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="mt-1 font-bold font-mono text-indigo-950 text-base lg:text-lg">
            {formatNumberVi(Math.max(0, ...(Object.values(salaryMatrix.monthlyTotalSalary) as number[])))} đ
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            Full định biên 4 vị trí (65.0M)
          </div>
        </div>

        {/* Card 4: Vốn Đầu Tư Ban Đầu */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Vốn Đầu Tư (Capex)</span>
            <Building className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1 font-bold font-mono text-amber-900 text-base lg:text-lg">
            {formatNumberVi(totalCapex)} đ
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            Khấu hao: ~{formatNumberVi(totalMonthlyCapexDepreciation)} đ/tháng
          </div>
        </div>

        {/* Card 5: Vận Hành Kho Cố Định */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Vận Hành Kho / Tháng</span>
            <Boxes className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-1 font-bold font-mono text-blue-900 text-base lg:text-lg">
            {formatNumberVi(totalMonthlyOpex)} đ
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            Kho 12M + Điện nước &amp; Net 1M
          </div>
        </div>

        {/* Card 6: Tổng Định Phí Doanh Nghiệp / Tháng */}
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-900 flex items-center justify-between">
            <span>Tổng Định Phí / Tháng</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="mt-1 font-bold font-mono text-emerald-950 text-base lg:text-lg">
            {formatNumberVi(baseFullMonthlySalary + totalMonthlyOpex + totalMonthlyCapexDepreciation)} đ
          </div>
          <div className="text-[10px] text-emerald-800 mt-0.5">
            Lương + Kho bãi + Khấu hao
          </div>
        </div>
      </div>

      {/* 3. TABLE 1: MA TRẬN ĐỊNH BIÊN HEADCOUNT (HÀNG NGANG THEO THÁNG) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase font-['Space_Grotesk']">
              TỔNG HEADCOUNT (ĐỊNH BIÊN NHÂN SỰ HÀNG NGANG)
            </h3>
            <span className="text-[11px] bg-slate-200/80 text-slate-700 font-semibold px-2 py-0.5 rounded">
              {positions.length} Vị Trí
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={handleFillAllRight}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center space-x-1 font-medium transition-colors"
              title="Sao chép số lượng nhân sự của tất cả các vị trí sang các tháng sau"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Điền nhanh toàn bộ tháng</span>
            </button>

            <button
              onClick={openAddPosition}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Vị Trí</span>
            </button>
          </div>
        </div>

        {/* Scrollable Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <th className="py-2.5 px-3 w-[50px] text-center sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                  STT
                </th>
                <th className="py-2.5 px-4 min-w-[220px] sticky left-[50px] bg-slate-100 z-10 border-r border-slate-200">
                  Headcount / Vị Trí
                </th>
                <th className="py-2.5 px-3 min-w-[130px] text-right bg-slate-100 border-r border-slate-200">
                  Chi Phí Cty / 1 NV
                </th>

                {/* Columns for Months */}
                {months.map((m) => (
                  <th
                    key={m.id}
                    className="py-2.5 px-2 text-center min-w-[80px] border-r border-slate-200 font-mono text-[11px]"
                  >
                    {m.label}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center w-[80px]">Thao Tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-150">
              {/* Row TỔNG HEADCOUNT (Hàng đầu tiên theo đúng format trong Screenshot 3) */}
              <tr className="bg-blue-50/80 font-bold border-b-2 border-blue-200 text-slate-900">
                <td className="py-2.5 px-3 text-center sticky left-0 bg-blue-50/90 z-10 border-r border-blue-200">
                  —
                </td>
                <td className="py-2.5 px-4 sticky left-[50px] bg-blue-50/90 z-10 border-r border-blue-200 uppercase tracking-wide text-blue-950 font-bold">
                  Tổng Headcount
                </td>
                <td className="py-2.5 px-3 text-right text-blue-900 border-r border-blue-200 font-mono">
                  {positions.length} vị trí
                </td>

                {months.map((m) => {
                  const count = salaryMatrix.monthlyTotalHeadcount[m.id] || 0;
                  return (
                    <td
                      key={m.id}
                      className="py-2.5 px-2 text-center border-r border-blue-200 font-mono text-sm font-bold text-blue-950"
                    >
                      <span
                        className={`inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-full ${
                          count > 0 ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </td>
                  );
                })}
                <td></td>
              </tr>

              {/* Rows for each position */}
              {positions.map((pos, idx) => {
                const singleCost = salaryMatrix.breakdownByPos[pos.id]?.totalCompanyCost || 0;

                return (
                  <tr key={pos.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-4 sticky left-[50px] bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">{pos.title}</div>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                pos.contractType === 'fulltime'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {pos.contractType === 'fulltime' ? 'Fulltime' : 'Parttime'}
                            </span>
                            <span className="text-[10px] text-slate-500">{pos.department}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleFillRight(pos.id, 0)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-all"
                          title="Sao chép số lượng sang các tháng tiếp theo"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold border-r border-slate-200 bg-slate-50/40">
                      {formatNumberVi(singleCost)} đ
                    </td>

                    {/* Monthly inputs */}
                    {months.map((m, mIdx) => {
                      const count = headcountMap[pos.id]?.[m.id] ?? 0;

                      return (
                        <td
                          key={m.id}
                          className="py-1.5 px-1 text-center border-r border-slate-200"
                        >
                          <div className="flex items-center justify-center space-x-0.5">
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={count}
                              onChange={(e) => handleHeadcountChange(pos.id, m.id, Number(e.target.value))}
                              className={`w-11 text-center py-1 text-xs font-mono font-bold rounded-md border transition-all ${
                                count > 0
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 focus:ring-2 focus:ring-emerald-500'
                                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                              }`}
                            />
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => openEditPosition(pos)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa cơ cấu lương vị trí này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (positions.length <= 1) {
                              alert('Cần giữ lại ít nhất 1 vị trí nhân sự.');
                              return;
                            }
                            onUpdatePositions(positions.filter((p) => p.id !== pos.id));
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Xóa vị trí này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={months.length + 3} className="py-8 text-center text-slate-500 bg-white">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Users className="w-6 h-6 text-slate-300" />
                      <span className="font-medium text-slate-700">Chưa có vị trí nhân sự nào trong hệ thống</span>
                      <span className="text-[11px] text-slate-400">Bấm nút "+ Thêm Vị Trí" hoặc "Cơ Cấu Lương" phía trên để tạo vị trí mới</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Nhập trực tiếp số lượng nhân sự vào từng ô tháng hoặc bấm icon sao chép để điền nhanh toàn bộ tháng.
            </span>
          </div>
          <button
            onClick={onResetToDefault}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Khôi phục mẫu Mosh&Mode</span>
          </button>
        </div>
      </div>

      {/* 4. TABLE 2: MA TRẬN CHI PHÍ NHÂN SỰ TỪNG THÁNG (BÊN DƯỚI BẢNG HEADCOUNT) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase font-['Space_Grotesk']">
              CHI PHÍ NHÂN SỰ (LƯƠNG + KPI + BHXH + THUẾ TNCN THEO TỪNG THÁNG)
            </h3>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Toggle Lương tháng 13 */}
            <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1.5 rounded-lg border border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={hrConfig.include13thMonth}
                onChange={(e) => onUpdateHrConfig({ ...hrConfig, include13thMonth: e.target.checked })}
                className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">Dự phòng Lương Tháng 13</span>
            </label>

            {hrConfig.include13thMonth && (
              <select
                value={hrConfig.thirteenthMonthPaymentMonthId}
                onChange={(e) => onUpdateHrConfig({ ...hrConfig, thirteenthMonthPaymentMonthId: e.target.value })}
                className="px-2 py-1 border border-slate-300 rounded-md bg-white text-xs font-medium"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    Chi trả vào: {m.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Scrollable Cost Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <th className="py-2.5 px-3 w-[50px] text-center sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                  STT
                </th>
                <th className="py-2.5 px-4 min-w-[220px] sticky left-[50px] bg-slate-100 z-10 border-r border-slate-200">
                  Chi Phí Nhân Sự / Vị Trí
                </th>
                <th className="py-2.5 px-3 min-w-[130px] text-right bg-slate-100 border-r border-slate-200">
                  Đơn Giá 1 NV
                </th>

                {/* Columns for Months */}
                {months.map((m) => (
                  <th
                    key={m.id}
                    className="py-2.5 px-2 text-right min-w-[100px] border-r border-slate-200 font-mono text-[11px]"
                  >
                    {m.label}
                  </th>
                ))}
                <th className="py-2.5 px-4 text-right min-w-[130px] bg-slate-100 font-bold">
                  Tổng Cả Kỳ
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-150">
              {/* Row TỔNG CHI PHÍ NHÂN SỰ (Hàng đầu tiên chuẩn theo Screenshot 3) */}
              <tr className="bg-emerald-50/90 font-bold border-b-2 border-emerald-300 text-slate-900">
                <td className="py-3 px-3 text-center sticky left-0 bg-emerald-50 z-10 border-r border-emerald-200">
                  —
                </td>
                <td className="py-3 px-4 sticky left-[50px] bg-emerald-50 z-10 border-r border-emerald-200 uppercase tracking-wide text-emerald-950 font-bold text-xs">
                  Tổng Chi Phí Nhân Sự
                </td>
                <td className="py-3 px-3 text-right text-emerald-900 border-r border-emerald-200 font-mono">
                  {/* Tổng chi phí 1 nhân sự của tất cả các vị trí */}
                  {formatNumberVi(
                    positions.reduce(
                      (sum, p) => sum + (salaryMatrix.breakdownByPos[p.id]?.totalCompanyCost || 0),
                      0
                    )
                  )} đ
                </td>

                {months.map((m) => {
                  const monthlyTotal = salaryMatrix.monthlyTotalSalary[m.id] || 0;
                  return (
                    <td
                      key={m.id}
                      className="py-3 px-2 text-right border-r border-emerald-200 font-mono text-xs font-bold text-emerald-950"
                    >
                      {monthlyTotal > 0 ? `${formatNumberVi(monthlyTotal)} đ` : '0 đ'}
                    </td>
                  );
                })}

                <td className="py-3 px-4 text-right font-mono text-sm font-bold text-emerald-950 bg-emerald-100/80">
                  {formatNumberVi(totalProjectSalaryCost)} đ
                </td>
              </tr>

              {/* Detail Rows for each position */}
              {positions.map((pos, idx) => {
                const singleCost = salaryMatrix.breakdownByPos[pos.id]?.totalCompanyCost || 0;
                const posTotalAllMonths = months.reduce((sum, m) => {
                  return sum + (salaryMatrix.positionMonthlyCost[pos.id]?.[m.id] || 0);
                }, 0);

                const isExpanded = expandedPositionId === pos.id;

                return (
                  <React.Fragment key={pos.id}>
                    <tr className="hover:bg-slate-50 transition-colors group">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-4 sticky left-[50px] bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900 text-xs flex items-center space-x-1.5">
                              <span>{pos.title}</span>
                              <button
                                onClick={() => setExpandedPositionId(isExpanded ? null : pos.id)}
                                className="text-[10px] text-slate-400 hover:text-emerald-700 underline font-normal"
                              >
                                {isExpanded ? 'Ẩn cơ cấu' : 'Chi tiết'}
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-500">{pos.department}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 border-r border-slate-200 bg-slate-50/40">
                        {formatNumberVi(singleCost)} đ
                      </td>

                      {/* Monthly Costs */}
                      {months.map((m) => {
                        const cost = salaryMatrix.positionMonthlyCost[pos.id]?.[m.id] || 0;
                        const count = headcountMap[pos.id]?.[m.id] || 0;

                        return (
                          <td
                            key={m.id}
                            className={`py-2.5 px-2 text-right border-r border-slate-200 font-mono text-xs ${
                              cost > 0 ? 'text-slate-900 font-medium' : 'text-slate-400'
                            }`}
                          >
                            {cost > 0 ? (
                              <div>
                                <span>{formatNumberVi(cost)} đ</span>
                                {count > 1 && (
                                  <span className="block text-[9px] text-slate-600 font-sans">
                                    ({count} người)
                                  </span>
                                )}
                              </div>
                            ) : (
                              '0'
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold text-slate-900 bg-slate-50/70">
                        {formatNumberVi(posTotalAllMonths)} đ
                      </td>
                    </tr>

                    {/* Expandable Breakdown sub-row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 text-[11px] text-slate-600 border-b border-slate-200">
                        <td colSpan={3} className="py-2 px-6">
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-800">Cơ cấu cấu thành chi phí 1 nhân sự:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
                              <div>Lương cơ bản: <strong>{formatNumberVi(pos.baseSalary)} đ</strong></div>
                              <div>Thưởng KPI: <strong>{formatNumberVi(pos.kpiBonus)} đ</strong></div>
                              <div>BHXH NSDLĐ ({parameters.taxAndCapital.socialInsuranceRate}%): <strong>{formatNumberVi(salaryMatrix.breakdownByPos[pos.id]?.insuranceEmployerCost || 0)} đ</strong></div>
                              <div>Thuế TNCN Cty trả: <strong>{formatNumberVi(salaryMatrix.breakdownByPos[pos.id]?.pitCompanyPaid || 0)} đ</strong></div>
                            </div>
                          </div>
                        </td>
                        <td colSpan={months.length + 1} className="py-2 px-4 text-right italic text-slate-600">
                          Công thức: Headcount x ({formatNumberVi(singleCost)} đ/người)
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={months.length + 3} className="py-8 text-center text-slate-500 bg-white">
                    Chưa có chi phí nhân sự phát sinh do chưa thiết lập vị trí làm việc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. TABLE 3: BẢNG TỔNG HỢP TOÀN DIỆN ĐỊNH PHÍ DOANH NGHIỆP (ALL-IN OPEX & CAPEX DEPRECIATION) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-indigo-700" />
            <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase font-['Space_Grotesk']">
              TỔNG HỢP ĐỊNH PHÍ HOẠT ĐỘNG TOÀN DOANH NGHIỆP (ALL-IN FIXED OPEX)
            </h3>
          </div>

          <button
            onClick={() => setShowAllInOpexTable(!showAllInOpexTable)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            {showAllInOpexTable ? 'Thu gọn bảng' : 'Mở rộng bảng'}
          </button>
        </div>

        {showAllInOpexTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px]">
                  <th className="py-2.5 px-4 min-w-[260px] sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                    Khoản Mục Chi Phí Cố Định
                  </th>
                  <th className="py-2.5 px-3 min-w-[130px] text-right bg-slate-100 border-r border-slate-200">
                    Quy Mô / Tháng
                  </th>

                  {months.map((m) => (
                    <th
                      key={m.id}
                      className="py-2.5 px-2 text-right min-w-[105px] border-r border-slate-200 font-mono text-[11px]"
                    >
                      {m.label}
                    </th>
                  ))}
                  <th className="py-2.5 px-4 text-right min-w-[130px] bg-slate-100 font-bold">
                    Tổng Cả Kỳ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-150">
                {/* 1. Chi phí nhân sự */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 sticky left-0 bg-white z-10 border-r border-slate-200 font-medium text-slate-900">
                    1. Chi Phí Lương &amp; Nhân Sự
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 border-r border-slate-200">
                    {formatNumberVi(baseFullMonthlySalary)} đ
                  </td>
                  {months.map((m) => {
                    const val = salaryMatrix.monthlyTotalSalary[m.id] || 0;
                    return (
                      <td key={m.id} className="py-2.5 px-2 text-right font-mono text-slate-800 border-r border-slate-200">
                        {formatNumberVi(val)} đ
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 bg-slate-50/70">
                    {formatNumberVi(totalProjectSalaryCost)} đ
                  </td>
                </tr>

                {/* 2. Chi phí vận hành kho bãi (Opex) */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 sticky left-0 bg-white z-10 border-r border-slate-200 font-medium text-slate-900">
                    2. Chi Phí Vận Hành Kho Bãi &amp; Opex (Thuê kho, Điện, Net...)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700 font-medium border-r border-slate-200">
                    {formatNumberVi(totalMonthlyOpex)} đ
                  </td>
                  {months.map((m) => {
                    const val = opexMatrix.monthlyTotalOpex[m.id] || 0;
                    return (
                      <td key={m.id} className="py-2.5 px-2 text-right font-mono text-blue-900 border-r border-slate-200">
                        {formatNumberVi(val)} đ
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-blue-950 bg-slate-50/70">
                    {formatNumberVi(totalProjectOpexCost)} đ
                  </td>
                </tr>

                {/* 3. Khấu hao tài sản ban đầu (Capex Depreciation) */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 sticky left-0 bg-white z-10 border-r border-slate-200 font-medium text-slate-900">
                    3. Trích Khấu Hao Tài Sản Đầu Tư Ban Đầu (Capex)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-medium border-r border-slate-200">
                    {formatNumberVi(totalMonthlyCapexDepreciation)} đ
                  </td>
                  {months.map((m, idx) => {
                    const val = capexMatrix.monthlyTotalDepreciation[m.id] || 0;
                    const isLastMonth = idx === months.length - 1;
                    return (
                      <td
                        key={m.id}
                        className={`py-2.5 px-2 text-right font-mono text-amber-800 border-r border-slate-200 ${
                          isLastMonth ? 'bg-amber-50/70 font-semibold text-amber-950' : ''
                        }`}
                        title={
                          isLastMonth
                            ? 'Tháng cuối cùng của kế hoạch: cộng dồn số tiền còn lại sau khi đã trừ khấu hao đều các tháng trước'
                            : undefined
                        }
                      >
                        {val > 0 ? `${formatNumberVi(val)} đ` : '0 đ'}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-amber-900 bg-slate-50/70">
                    {formatNumberVi(
                      (Object.values(capexMatrix.monthlyTotalDepreciation) as number[]).reduce((sum, v) => sum + (Number(v) || 0), 0)
                    )} đ
                  </td>
                </tr>

                {/* TỔNG ĐỊNH PHÍ DOANH NGHIỆP MỖI THÁNG */}
                <tr className="bg-slate-900 text-white font-bold text-xs">
                  <td className="py-3 px-4 sticky left-0 bg-slate-900 z-10 uppercase tracking-wide border-r border-slate-800">
                    TỔNG ĐỊNH PHÍ DOANH NGHIỆP / THÁNG (ALL-IN)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400 border-r border-slate-800">
                    {formatNumberVi(baseFullMonthlySalary + totalMonthlyOpex + totalMonthlyCapexDepreciation)} đ
                  </td>

                  {months.map((m) => {
                    const salary = salaryMatrix.monthlyTotalSalary[m.id] || 0;
                    const opex = opexMatrix.monthlyTotalOpex[m.id] || 0;
                    const dep = capexMatrix.monthlyTotalDepreciation[m.id] || 0;
                    const sum = salary + opex + dep;

                    return (
                      <td key={m.id} className="py-3 px-2 text-right font-mono text-emerald-300 border-r border-slate-800">
                        {formatNumberVi(sum)} đ
                      </td>
                    );
                  })}

                  <td className="py-3 px-4 text-right font-mono text-sm font-bold text-emerald-300 bg-slate-950">
                    {formatNumberVi(
                      totalProjectSalaryCost +
                        totalProjectOpexCost +
                        (Object.values(capexMatrix.monthlyTotalDepreciation) as number[]).reduce((sum, v) => sum + (Number(v) || 0), 0)
                    )} đ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Modal Cơ Cấu Lương */}
      <SalaryStructureModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        positions={positions}
        taxConfig={parameters.taxAndCapital}
        onUpdatePositions={onUpdatePositions}
        onOpenAddPosition={openAddPosition}
        onOpenEditPosition={openEditPosition}
        onResetPositions={onResetToDefault}
      />

      {/* 2. Modal Vốn Đầu Tư Ban Đầu (Capex) */}
      <InitialCapexModal
        isOpen={isCapexModalOpen}
        onClose={() => setIsCapexModalOpen(false)}
        capexItems={capexItems}
        months={months}
        onUpdateCapexItems={onUpdateCapexItems}
        onResetCapex={onResetToDefault}
        defaultDepreciationMonths={parameters.taxAndCapital.depreciationMonths}
      />

      {/* 3. Modal Chi Phí Vận Hành Hàng Tháng (Opex) */}
      <MonthlyOpexModal
        isOpen={isOpexModalOpen}
        onClose={() => setIsOpexModalOpen(false)}
        opexItems={opexItems}
        months={months}
        onUpdateOpexItems={onUpdateOpexItems}
        onResetOpex={onResetToDefault}
      />

      {/* 4. Modal Thêm / Chỉnh Sửa Vị Trí */}
      <PositionModal
        isOpen={isPositionModalOpen}
        onClose={() => setIsPositionModalOpen(false)}
        positionToEdit={editingPosition}
        taxConfig={parameters.taxAndCapital}
        onSave={handleSavePosition}
      />
    </div>
  );
};
