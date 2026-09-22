import React from 'react';
import { 
  X, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Coins, 
  PackageCheck,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { TabId, TabDefinition, ProjectParameters } from '../types/financial';
import { formatVND } from '../utils/formatters';

interface UpcomingTabModalProps {
  tab: TabDefinition;
  parameters: ProjectParameters;
  onClose: () => void;
}

const TAB_ROADMAP_DETAILS: Record<TabId, {
  headline: string;
  dataIngestedFromTab1: string[];
  keyDeliverables: string[];
  cfoStrategyNote: string;
}> = {
  'tab-parameters': {
    headline: 'Thiết Lập Tham Số Chung Tổng Thể',
    dataIngestedFromTab1: [],
    keyDeliverables: [],
    cfoStrategyNote: '',
  },
  'tab-sku-bom': {
    headline: 'Danh Mục Sản Phẩm & Định Mức BOM / Giá Vốn (COGS)',
    dataIngestedFromTab1: [
      'Áp dụng thuế VAT đầu ra 8% và Thuế NK/VAT đầu vào nguyên liệu',
      'Kỳ hạn khấu hao tài sản 24 tháng phân bổ vào chi phí ép khuôn chai lọ mỹ phẩm',
      'Lead-time 45 ngày của nhà cung cấp dùng để tính mức tồn kho an toàn (Safety Stock)',
    ],
    keyDeliverables: [
      'Bóc tách cấu trúc BOM (Bill of Materials): Chai lọ chân không, nắp, vòi xịt, nhãn decal, hộp giấy seal màng co',
      'Định mức nguyên liệu hoạt chất: Niacinamide, AHA/BHA, Chiết xuất cúc la mã, Tinh chất khử mùi sinh học',
      'Chi phí gia công chiết rót, đóng gói & kiểm nghiệm theo batch (Lô 2.000 / 5.000 / 10.000 sản phẩm)',
      'Giá xuất xưởng (Ex-factory cost) vs Giá bán lẻ đề xuất (MSRP)',
    ],
    cfoStrategyNote: 'Với các sản phẩm chăm sóc vùng da dưới cánh tay (Serum sáng da, xịt khử mùi), Gross Margin mục tiêu cần đạt tối thiểu 70-75% trước phí sàn để bù đắp 31.5% chiết khấu nền tảng và chi phí seeding Creator.',
  },
  'tab-cogs-sheet3': {
    headline: 'Giá Vốn Hàng Bán: Quản Lý Nhà Cung Cấp & So Sánh Báo Giá',
    dataIngestedFromTab1: [
      'Lead-time sản xuất 45 ngày theo tham số chuỗi cung ứng',
      'Chính sách công nợ nhà máy (Đặt cọc 50%, thanh toán 50% khi nhận hàng)',
    ],
    keyDeliverables: [
      'Khai báo nhà máy: Tên xưởng, địa chỉ sản xuất, nhân viên phụ trách và hotline',
      'So sánh báo giá nhiều xưởng theo thứ tự đơn giá tăng dần',
      'Quy đổi đơn giá/ml để đánh giá hiệu quả chi phí thể tích',
      'Chốt nhà máy & MOQ tự động đồng bộ sang Sheet 2',
    ],
    cfoStrategyNote: 'So sánh đa nhà máy theo từng mốc MOQ giúp doanh nghiệp tối ưu giá vốn theo từng giai đoạn quy mô mà không bị phụ thuộc vào một xưởng duy nhất.',
  },
  'tab-sales-forecast': {
    headline: 'Kế Hoạch Bán Hàng: Dự Báo Doanh Số Đa Kênh',
    dataIngestedFromTab1: [
      'Tỷ trọng kênh Shopee vs TikTok Shop và B2B ký gửi',
      'Ngân sách Marketing baseline 5% GMV để chạy Ads nội sàn & ngoại sàn',
      'Sức chứa phân bổ mẫu seeding (UGC, KOC, KOL) kích hoạt đơn hàng ban đầu',
    ],
    keyDeliverables: [
      'Dự báo sản lượng (Volume) theo tháng trong 12 tháng đầu',
      'Kế hoạch bán theo Combo (Ví dụ: Combo Sáng da + Khử mùi 24h) để nâng AOV từ 150k lên 350k',
      'Kế hoạch chuyển đổi từ Creator sang Doanh số Organic & Affiliate',
    ],
    cfoStrategyNote: 'Kênh TikTok Shop tạo đơn nhanh qua Livestream nhưng tỷ lệ hoàn hàng cao hơn; Shopee duy trì tìm kiếm từ khóa ổn định. Cần tối ưu mix kênh cân bằng.',
  },
  'tab-hr-operations': {
    headline: 'Nhân Sự & Vận Hành (HR & Operations)',
    dataIngestedFromTab1: [
      'Tỷ lệ trích nộp BHXH bắt buộc phía NSDLĐ 21.5%',
      'Thuế suất TNCN thời vụ 10% áp dụng cho nhân sự part-time',
      'Khấu hao tài sản ban đầu phân bổ vào định phí hàng tháng',
    ],
    keyDeliverables: [
      'Định biên số lượng nhân sự hàng ngang qua 16 tháng (T9.2026 - T12.2027)',
      'Bóc tách cơ cấu lương thỏa thuận, thưởng KPI, trích đóng BHXH và thuế TNCN cty trả',
      'Khai báo vốn đầu tư ban đầu (Capex) và khấu hao phần mềm, văn phòng ảo, nhãn hiệu',
      'Khai báo chi phí vận hành kho bãi cố định (Opex) và tổng hợp định phí toàn diện',
    ],
    cfoStrategyNote: 'Định phí nhân sự và kho bãi là chi phí cố định tối quan trọng cần duy trì kiểm soát chặt chẽ để đảm bảo điểm hòa vốn an toàn cho doanh nghiệp.',
  },
  'tab-reports': {
    headline: 'Báo Cáo Tài Chính Real-time (P&L, Dòng Tiền & Vốn, Điểm Hòa Vốn BEP)',
    dataIngestedFromTab1: [
      'Toàn bộ ma trận phí sàn Shopee & TikTok Shop',
      'Chu kỳ đối soát tiền sàn và công nợ nhà máy',
      'Định phí lương nhân sự, Opex và khấu hao Capex',
    ],
    keyDeliverables: [
      'Báo cáo Kết quả hoạt động kinh doanh (P&L)',
      'Báo cáo Lưu chuyển tiền tệ và nhu cầu vốn lưu động',
      'Phân tích Điểm hòa vốn BEP và Biên độ an toàn',
    ],
    cfoStrategyNote: 'Hệ thống báo cáo tài chính tích hợp toàn diện theo chuẩn CFO, đồng bộ dữ liệu thời gian thực theo kế hoạch bán hàng.',
  },
  'tab-pnl': {
    headline: 'Báo Cáo P&L: Kết Quả Hoạt Động Kinh Doanh',
    dataIngestedFromTab1: [
      'Toàn bộ ma trận phí sàn Shopee (31.5% + 5.700đ) & TikTok Shop (29.5% + 5.008đ)',
      'Thuế suất TNDN 20% và BHXH bắt buộc 21.5%',
      'Chi phí thời vụ đóng gói khấu trừ 10% TNCN',
    ],
    keyDeliverables: [
      'Doanh thu thuần (Net Revenue), Lợi nhuận gộp (Gross Profit)',
      'Chi phí bán hàng (Selling Expenses) & Chi phí quản lý doanh nghiệp (G&A)',
      'EBITDA, Lợi nhuận trước thuế EBT & Lợi nhuận ròng sau thuế (PAT)',
      'Đóng góp biên lợi nhuận ròng theo từng kênh bán',
    ],
    cfoStrategyNote: 'Báo cáo P&L chuẩn theo Chế độ Kế toán Doanh nghiệp Việt Nam (Thông tư 200/133) và chuẩn quản trị CFO.',
  },
  'tab-cashflow': {
    headline: 'Dòng Tiền & Vốn: Dự Báo Lưu Chuyển Tiền Tệ & Cân Đối Vốn',
    dataIngestedFromTab1: [
      'Vốn khởi điểm 100.000.000 đ',
      'Độ trễ đối soát T+15 ngày sàn TMĐT và 15% gối đầu sàn giữ',
      'Độ trễ công nợ B2B T+30 ngày',
      'Thời gian sản xuất 45 ngày sau PO (đòi hỏi đặt cọc 30-50% tiền mặt)',
    ],
    keyDeliverables: [
      'Báo cáo lưu chuyển tiền tệ trực tiếp (Cash Flow Statement: OCF, ICF, FCF)',
      'Đường cong số dư tiền mặt (Cash Balance Curve) & Xác định điểm chạm đáy tiền mặt (Cash Valley)',
      'Xác định thời điểm cần huy động thêm vốn (Funding Round / Thấu chi ngân hàng)',
    ],
    cfoStrategyNote: 'Đây là mắt xích sống còn nhất: dù P&L có lãi trên giấy tờ, dòng tiền bị nghẽn ở sàn và tiền cọc sản xuất 45 ngày có thể làm cạn kiệt 100M vốn ban đầu trong 60 ngày nếu không kiểm soát.',
  },
  'tab-bep-insights': {
    headline: 'Phân Tích BEP & CFO: Điểm Hòa Vốn & Khuyến Nghị Quản Trị',
    dataIngestedFromTab1: [
      'Chi phí cố định (Định phí) & Chi phí biến đổi (Biến phí theo từng đơn hàng)',
      'Tất cả tham số thuế, phí sàn, creator và chu kỳ thu hồi vốn',
    ],
    keyDeliverables: [
      'Điểm hòa vốn theo doanh thu (BEP in Revenue) & Theo sản lượng (BEP in Units)',
      'Biên độ an toàn tài chính (Margin of Safety)',
      'Bảng phân tích độ nhạy (Sensitivity Matrix: Nếu phí sàn tăng 2% hoặc Giá nguyên liệu tăng 10%)',
      'Executive Summary & Dashboard khuyến nghị chiến lược giá và chiết khấu cho CEO',
    ],
    cfoStrategyNote: 'Cung cấp ma trận quyết định trực quan để ban điều hành Mosh&Mode tự tin ra quyết định kinh doanh.',
  },
};

export const UpcomingTabModal: React.FC<UpcomingTabModalProps> = ({
  tab,
  parameters,
  onClose,
}) => {
  const details = TAB_ROADMAP_DETAILS[tab.id];
  if (!details) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-start space-x-3.5 pr-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-emerald-700 font-semibold uppercase">
              Lộ Trình Xây Dựng Từng Bước Cùng CFO
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5 font-['Space_Grotesk']">
              {details.headline}
            </h3>
          </div>
        </div>

        {/* Ingested data from Tab 1 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <span className="text-xs font-bold text-slate-800 uppercase font-mono flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-700" />
            Dữ Liệu Sẽ Kế Thừa Từ Tab 1 (Tham Số Chung Hiện Tại):
          </span>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {details.dataIngestedFromTab1.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key deliverables */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase font-mono flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-700" />
            Nội Dung Chuyên Môn Sẽ Được Xây Dựng Ở Bước Này:
          </span>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {details.keyDeliverables.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-start space-x-2">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] shrink-0 font-mono font-bold">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CFO Note */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
          <strong className="text-amber-800 block mb-1">Ghi Chú Chiến Lược CFO:</strong>
          {details.cfoStrategyNote}
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
          <span className="text-slate-500">
            Hãy tinh chỉnh kỹ các tham số ở Tab 1 trước khi tiến hành bước tiếp theo.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>Tiếp tục Tab Tham Số</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
