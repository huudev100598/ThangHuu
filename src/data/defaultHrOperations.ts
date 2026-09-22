import { 
  SalaryStructurePosition, 
  HeadcountPlanMap, 
  InitialCapexItem, 
  MonthlyOperatingExpense, 
  HrOperationsConfig 
} from '../types/hrOperations';

// Danh sách các vị trí cơ cấu lương (để trống sẵn sàng thiết lập)
export const DEFAULT_SALARY_POSITIONS: SalaryStructurePosition[] = [];

// Định biên Headcount theo từng tháng (để trống sẵn sàng nhập liệu)
export const DEFAULT_HEADCOUNT_PLAN: HeadcountPlanMap = {};

// Vốn đầu tư ban đầu (Capex) mặc định (để trống sẵn sàng nhập liệu)
export const DEFAULT_INITIAL_CAPEX: InitialCapexItem[] = [];

// Chi phí vận hành hàng tháng (Fixed Opex) mặc định (để trống sẵn sàng nhập liệu)
export const DEFAULT_MONTHLY_OPEX: MonthlyOperatingExpense[] = [];

export const DEFAULT_HR_CONFIG: HrOperationsConfig = {
  include13thMonth: false,
  thirteenthMonthPaymentMonthId: '2026-12',
  autoCalcParttimePit: true,
};

// Aliases for convenience
export const DEFAULT_INITIAL_CAPEX_ITEMS = DEFAULT_INITIAL_CAPEX;
export const DEFAULT_MONTHLY_OPEX_ITEMS = DEFAULT_MONTHLY_OPEX;
export const DEFAULT_HR_OPERATIONS_CONFIG = DEFAULT_HR_CONFIG;

