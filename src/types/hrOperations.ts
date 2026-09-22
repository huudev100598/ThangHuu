export interface SalaryStructurePosition {
  id: string;
  title: string; // Vị trí (e.g. 'GĐ Kiêm GĐKD', 'Media (Quay Dựng Chụp)', 'Content (Livestream)', 'Kế toán Partime')
  department: string; // Phòng ban (Ban Giám Đốc, Marketing, Vận Hành, Kế Toán)
  contractType: 'fulltime' | 'parttime' | 'probation';
  baseSalary: number; // Lương cơ bản / thỏa thuận (VND)
  insuranceSalary: number; // Lương đóng BHXH (VND)
  kpiBonus: number; // Thưởng KPI (VND)
  customSocialInsuranceRate?: number; // Tỷ lệ BHXH NSDLĐ riêng (nếu không dùng tỷ lệ 21.5% từ Tab 1)
  overridePitCompanyPaid?: number; // Thuế TNCN CTY trả (nếu nhập tay riêng, ví dụ 200.000 cho Part-time)
  thirteenthMonthSalary?: number; // Lương Tháng 13 (VND) - mặc định bằng baseSalary
  notes?: string;
}

// [positionId]: { [monthId]: count }
export type HeadcountPlanMap = Record<string, Record<string, number>>;

export interface InitialCapexItem {
  id: string;
  stt: number;
  name: string; // Hạng Mục Đầu Tư (e.g. 'Bộ phần mềm Misa (3 năm)', 'Phí thuê văn phòng ảo', 'Chi phí đăng ký thương hiệu Mosh&Mode', 'Chi phí thành lập doanh nghiệp')
  details?: string; // Chi tiết thành phần
  amount: number; // Giá Trị (VND)
  depreciationMonths: number; // Tháng Khấu Hao (0 nếu hạch toán ngay/không khấu hao, > 0 nếu phân bổ hàng tháng)
  disbursementMonth: string; // Thời gian giải ngân (e.g. '2026-09')
  disbursementLabel?: string; // 'Tháng 9.2026'
  category?: 'software' | 'office' | 'branding' | 'legal' | 'equipment' | 'other';
}

export interface MonthlyOperatingExpense {
  id: string;
  stt: number;
  name: string; // Hạng Mục Chi Phí (e.g. 'Tiền thuê kho', 'Chi phí điện nước kho', 'Internet kho')
  amount: number; // Giá Trị (VND) / tháng
  startMonth?: string; // Tháng bắt đầu phát sinh chi phí (ID tháng e.g. '2026-09', '2026-10' hoặc để trống = từ tháng đầu tiên)
  category: 'warehouse' | 'utilities' | 'software' | 'admin' | 'logistics' | 'other';
  notes?: string;
}

export interface HrOperationsConfig {
  include13thMonth: boolean; // Có tính lương tháng 13 vào chi phí hay không
  thirteenthMonthPaymentMonthId: string; // Tháng chi trả lương tháng 13 (mặc định '2027-01' hoặc '2026-12')
  autoCalcParttimePit: boolean; // Tự động tính thuế TNCN part-time 10% từ Tab 1 nếu không override
}
