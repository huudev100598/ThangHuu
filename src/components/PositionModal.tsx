import React, { useState, useEffect } from 'react';
import { SalaryStructurePosition } from '../types/hrOperations';
import { TaxAndCapitalConfig } from '../types/financial';
import { calculatePositionSingleCost, formatNumberVi } from '../utils/hrCalculations';
import { X, Save, ShieldCheck, Sparkles, AlertCircle, Info } from 'lucide-react';

interface PositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  positionToEdit?: SalaryStructurePosition | null;
  taxConfig: TaxAndCapitalConfig;
  onSave: (position: SalaryStructurePosition) => void;
}

export const PositionModal: React.FC<PositionModalProps> = ({
  isOpen,
  onClose,
  positionToEdit,
  taxConfig,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Marketing & Media');
  const [contractType, setContractType] = useState<'fulltime' | 'parttime' | 'probation'>('fulltime');
  const [baseSalary, setBaseSalary] = useState<number>(10000000);
  const [insuranceSalary, setInsuranceSalary] = useState<number>(5000000);
  const [kpiBonus, setKpiBonus] = useState<number>(2000000);
  const [customSocialRate, setCustomSocialRate] = useState<number | undefined>(undefined);
  const [overridePit, setOverridePit] = useState<number | undefined>(undefined);
  const [thirteenthMonth, setThirteenthMonth] = useState<number>(10000000);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (positionToEdit) {
      setTitle(positionToEdit.title);
      setDepartment(positionToEdit.department || 'Ban Giám Đốc');
      setContractType(positionToEdit.contractType);
      setBaseSalary(positionToEdit.baseSalary);
      setInsuranceSalary(positionToEdit.insuranceSalary);
      setKpiBonus(positionToEdit.kpiBonus);
      setCustomSocialRate(positionToEdit.customSocialInsuranceRate);
      setOverridePit(positionToEdit.overridePitCompanyPaid);
      setThirteenthMonth(positionToEdit.thirteenthMonthSalary ?? positionToEdit.baseSalary);
      setNotes(positionToEdit.notes || '');
    } else {
      setTitle('');
      setDepartment('Marketing & Media');
      setContractType('fulltime');
      setBaseSalary(8000000);
      setInsuranceSalary(8000000);
      setKpiBonus(3000000);
      setCustomSocialRate(undefined);
      setOverridePit(undefined);
      setThirteenthMonth(8000000);
      setNotes('');
    }
    setError('');
  }, [positionToEdit, isOpen]);

  // Sync thirteenth month when base salary changes if adding new
  const handleBaseSalaryChange = (val: number) => {
    setBaseSalary(val);
    if (!positionToEdit) {
      setThirteenthMonth(val);
      if (contractType === 'fulltime') {
        setInsuranceSalary(val);
      }
    }
  };

  const handleContractTypeChange = (type: 'fulltime' | 'parttime' | 'probation') => {
    setContractType(type);
    if (type === 'parttime') {
      setInsuranceSalary(0);
      setKpiBonus(0);
      // Gợi ý tính thuế TNCN thời vụ 10%
      const suggestedPit = Math.round(baseSalary * (taxConfig.seasonalPersonalIncomeTaxRate / 100));
      setOverridePit(suggestedPit);
    } else {
      if (insuranceSalary === 0) setInsuranceSalary(baseSalary);
      setOverridePit(0);
    }
  };

  if (!isOpen) return null;

  // Live calculation preview
  const previewPos: SalaryStructurePosition = {
    id: positionToEdit?.id || 'temp',
    title: title || 'Vị trí xem trước',
    department,
    contractType,
    baseSalary: Number(baseSalary) || 0,
    insuranceSalary: Number(insuranceSalary) || 0,
    kpiBonus: Number(kpiBonus) || 0,
    customSocialInsuranceRate: customSocialRate,
    overridePitCompanyPaid: overridePit,
    thirteenthMonthSalary: Number(thirteenthMonth) || 0,
    notes,
  };
  const costBreakdown = calculatePositionSingleCost(previewPos, taxConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên vị trí nhân sự');
      return;
    }

    const savedPosition: SalaryStructurePosition = {
      id: positionToEdit?.id || `pos-${Date.now()}`,
      title: title.trim(),
      department: department.trim(),
      contractType,
      baseSalary: Number(baseSalary) || 0,
      insuranceSalary: Number(insuranceSalary) || 0,
      kpiBonus: Number(kpiBonus) || 0,
      customSocialInsuranceRate: customSocialRate !== undefined && customSocialRate > 0 ? customSocialRate : undefined,
      overridePitCompanyPaid: overridePit !== undefined ? overridePit : undefined,
      thirteenthMonthSalary: Number(thirteenthMonth) || 0,
      notes: notes.trim(),
    };

    onSave(savedPosition);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              {positionToEdit ? 'Chỉnh Sửa Vị Trí Nhân Sự' : 'Thêm Vị Trí Nhân Sự Mới'}
            </h3>
            <p className="text-xs text-slate-300">
              Định biên mức lương, KPI và các khoản trích theo lương của doanh nghiệp
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Vị Trí <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Chuyên Viên Livestream, Designer..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng Ban / Bộ Phận</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="VD: Marketing, Vận Hành, Kế Toán..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hình Thức Hợp Đồng</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleContractTypeChange('fulltime')}
                className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-all ${
                  contractType === 'fulltime'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Full-time (Chính thức)
              </button>
              <button
                type="button"
                onClick={() => handleContractTypeChange('parttime')}
                className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-all ${
                  contractType === 'parttime'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Part-time / Thời vụ
              </button>
              <button
                type="button"
                onClick={() => handleContractTypeChange('probation')}
                className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-all ${
                  contractType === 'probation'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Thử Việc (Probation)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lương Thỏa Thuận (VND)</label>
              <input
                type="number"
                step={500000}
                value={baseSalary}
                onChange={(e) => handleBaseSalaryChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">{formatNumberVi(baseSalary)} đ</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lương Đóng BHXH (VND)</label>
              <input
                type="number"
                step={500000}
                value={insuranceSalary}
                onChange={(e) => setInsuranceSalary(Number(e.target.value))}
                disabled={contractType === 'parttime'}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {contractType === 'parttime' ? 'Miễn đóng BHXH' : `${formatNumberVi(insuranceSalary)} đ`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thưởng KPI (VND)</label>
              <input
                type="number"
                step={500000}
                value={kpiBonus}
                onChange={(e) => setKpiBonus(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">{formatNumberVi(kpiBonus)} đ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thuế TNCN Cty Chi Trả (VND)
              </label>
              <input
                type="number"
                step={50000}
                value={overridePit ?? 0}
                onChange={(e) => setOverridePit(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {contractType === 'parttime'
                  ? `Áp dụng thuế thời vụ ${taxConfig.seasonalPersonalIncomeTaxRate}% từ Tab 1`
                  : 'Mặc định 0 đ nếu người lao động tự nộp'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dự Phòng Lương Tháng 13 (VND)
              </label>
              <input
                type="number"
                step={500000}
                value={thirteenthMonth}
                onChange={(e) => setThirteenthMonth(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">{formatNumberVi(thirteenthMonth)} đ</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú Trách Nhiệm</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Quản trị kênh livestream, quay video..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Live Calculation Preview Box */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
              <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Chi Phí Thực Tế Công Ty Chi Trả Cho 1 Nhân Sự / Tháng</span>
              </span>
              <span className="text-base font-bold font-mono text-emerald-950">
                {formatNumberVi(costBreakdown.totalCompanyCost)} đ
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2.5 text-[11px] text-slate-600">
              <div>
                <span className="block text-slate-500">Lương:</span>
                <span className="font-mono font-medium text-slate-800">{formatNumberVi(previewPos.baseSalary)} đ</span>
              </div>
              <div>
                <span className="block text-slate-500">Thưởng KPI:</span>
                <span className="font-mono font-medium text-slate-800">{formatNumberVi(previewPos.kpiBonus)} đ</span>
              </div>
              <div>
                <span className="block text-slate-500">BHXH NSDLĐ ({costBreakdown.socialInsuranceRate}%):</span>
                <span className="font-mono font-medium text-emerald-800">{formatNumberVi(costBreakdown.insuranceEmployerCost)} đ</span>
              </div>
              <div>
                <span className="block text-slate-500">Thuế TNCN Cty trả:</span>
                <span className="font-mono font-medium text-amber-800">{formatNumberVi(costBreakdown.pitCompanyPaid)} đ</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{positionToEdit ? 'Cập Nhật Vị Trí' : 'Lưu Vị Trí'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
