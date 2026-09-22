import React, { useState } from 'react';
import { SalaryStructurePosition } from '../types/hrOperations';
import { TaxAndCapitalConfig } from '../types/financial';
import { calculatePositionSingleCost, formatNumberVi } from '../utils/hrCalculations';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck, 
  Coins, 
  Users, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface SalaryStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: SalaryStructurePosition[];
  taxConfig: TaxAndCapitalConfig;
  onUpdatePositions: (positions: SalaryStructurePosition[]) => void;
  onOpenAddPosition: () => void;
  onOpenEditPosition: (pos: SalaryStructurePosition) => void;
  onResetPositions: () => void;
}

export const SalaryStructureModal: React.FC<SalaryStructureModalProps> = ({
  isOpen,
  onClose,
  positions,
  taxConfig,
  onUpdatePositions,
  onOpenAddPosition,
  onOpenEditPosition,
  onResetPositions,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    onUpdatePositions(positions.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-wide font-['Space_Grotesk']">
                  CƠ CẤU LƯƠNG VÀ KPI
                </h3>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {positions.length} Vị Trí
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Thiết lập định mức thu nhập, đóng góp BHXH NSDLĐ & thuế TNCN chi trả cho từng nhân sự
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onResetPositions}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 flex items-center space-x-1.5 transition-colors"
              title="Đặt lại cơ cấu mẫu theo hồ sơ Mosh&Mode"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại mẫu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Integration Note with Tab 1 */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Tích hợp trực tiếp với Tab 1 (Tham Số Chung):</strong> Tỷ lệ BHXH NSDLĐ{' '}
              <span className="font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                {taxConfig.socialInsuranceRate}%
              </span>{' '}
              và Thuế TNCN thời vụ / Part-time{' '}
              <span className="font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                {taxConfig.seasonalPersonalIncomeTaxRate}%
              </span>
              . Chi phí Công ty = Lương + Thưởng KPI + BHXH NSDLĐ + Thuế TNCN CTY trả.
            </span>
          </div>

          <button
            onClick={onOpenAddPosition}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors shrink-0 ml-4"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Vị Trí Mới</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 min-w-[180px]">Vị Trí</th>
                  <th className="py-3 px-3 min-w-[100px]">Phân Loại</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Lương Thỏa Thuận</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Lương Đóng BHXH</th>
                  <th className="py-3 px-3 text-right min-w-[100px]">Thưởng KPI</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">
                    <div className="flex items-center justify-end space-x-1">
                      <span>BHXH (NSDLĐ)</span>
                      <span className="text-[10px] font-normal text-emerald-700">({taxConfig.socialInsuranceRate}%)</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Thuế TNCN CTY trả</th>
                  <th className="py-3 px-4 text-right min-w-[130px] bg-emerald-50/80 text-emerald-950 font-bold border-l border-r border-emerald-200/60">
                    Chi Phí Công Ty / 1 NV
                  </th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Lương Tháng 13</th>
                  <th className="py-3 px-3 text-center w-[90px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {positions.map((pos) => {
                  const cost = calculatePositionSingleCost(pos, taxConfig);

                  return (
                    <tr key={pos.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{pos.title}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{pos.department}</div>
                        {pos.notes && (
                          <div className="text-[10px] text-slate-600 italic mt-0.5 line-clamp-1">
                            {pos.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            pos.contractType === 'fulltime'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {pos.contractType === 'fulltime' ? 'Full-time' : 'Part-time'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                        {formatNumberVi(pos.baseSalary)} đ
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {pos.insuranceSalary > 0 ? `${formatNumberVi(pos.insuranceSalary)} đ` : '—'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {pos.kpiBonus > 0 ? `${formatNumberVi(pos.kpiBonus)} đ` : '0 đ'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                        {cost.insuranceEmployerCost > 0 ? `${formatNumberVi(cost.insuranceEmployerCost)} đ` : '0 đ'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-amber-700">
                        {cost.pitCompanyPaid > 0 ? `${formatNumberVi(cost.pitCompanyPaid)} đ` : '0 đ'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm bg-emerald-50/40 border-l border-r border-emerald-200/60">
                        {formatNumberVi(cost.totalCompanyCost)} đ
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatNumberVi(cost.thirteenthMonthSalary)} đ
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onOpenEditPosition(pos)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Chỉnh sửa vị trí này"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(pos.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Xóa vị trí này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const totals = positions.reduce(
                    (acc, pos) => {
                      const c = calculatePositionSingleCost(pos, taxConfig);
                      return {
                        base: acc.base + pos.baseSalary,
                        insurance: acc.insurance + pos.insuranceSalary,
                        kpi: acc.kpi + pos.kpiBonus,
                        bhxh: acc.bhxh + c.insuranceEmployerCost,
                        pit: acc.pit + c.pitCompanyPaid,
                        company: acc.company + c.totalCompanyCost,
                        m13: acc.m13 + c.thirteenthMonthSalary,
                      };
                    },
                    { base: 0, insurance: 0, kpi: 0, bhxh: 0, pit: 0, company: 0, m13: 0 }
                  );

                  return (
                    <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td className="py-3 px-4 uppercase text-slate-700" colSpan={2}>
                        Tổng Cộng Cơ Cấu 1 Nhân Sự / Vị Trí
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{formatNumberVi(totals.base)} đ</td>
                      <td className="py-3 px-3 text-right font-mono">{formatNumberVi(totals.insurance)} đ</td>
                      <td className="py-3 px-3 text-right font-mono">{formatNumberVi(totals.kpi)} đ</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800">{formatNumberVi(totals.bhxh)} đ</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800">{formatNumberVi(totals.pit)} đ</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-900 text-sm bg-emerald-100/80 border-l border-r border-emerald-300">
                        {formatNumberVi(totals.company)} đ
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{formatNumberVi(totals.m13)} đ</td>
                      <td></td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Dữ liệu sẽ tự động đồng bộ sang bảng Ma Trận Chi Phí Nhân Sự Từng Tháng theo số lượng Headcount thực tế.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Đóng &amp; Áp Dụng
          </button>
        </div>
      </div>

      {/* Delete Confirmation mini-modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>Xóa vị trí nhân sự này?</span>
            </h4>
            <p className="text-xs text-slate-600 mt-2">
              Các thông số Headcount và chi phí tương ứng của vị trí này sẽ bị xóa khỏi tất cả các tháng.
            </p>
            <div className="mt-4 flex items-center justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
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
