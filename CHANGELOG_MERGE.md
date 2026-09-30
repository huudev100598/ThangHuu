# Gộp chức năng mới từ project2 vào Project_anh_Thang

Giữ nguyên toàn bộ: đăng nhập/phân quyền JWT, lưu MySQL, trang Admin, server.ts, database.sql,
.env, package.json, cấu hình Tailwind v3, dữ liệu mặc định để trống, các nút "Đặt lại mẫu / Khôi phục".
Không cần chạy migration, không đổi cấu trúc bảng.

## File mới
- src/components/PnlTableRows.tsx – bảng P&L tách riêng, hỗ trợ thu gọn / mở rộng
- src/components/StartMonthModal.tsx – chọn tháng bắt đầu kinh doanh (MM-YY)
- src/components/bep/DuPontAnalysisCard.tsx – mô hình DuPont
- src/components/bep/ProjectHealthDiagnosis.tsx – tự động chẩn đoán sức khỏe dự án
- src/components/bep/ChannelPerformanceComparison.tsx – so sánh hiệu quả các kênh

## File lấy bản mới từ project2
- utils/reportCalculations.ts – dòng tiền mới (6 khoản chi, tiền sàn về T-1, cọc kho, tháng giải ngân Capex)
- components/PnlReportSection.tsx, CashFlowReportSection.tsx (thu gọn/mở rộng, xuất CSV)
- components/BreakEvenAnalysisSection.tsx, bep/BreakEvenChart.tsx, bep/BreakEvenTabularReport.tsx
- components/ComprehensiveReportsSection.tsx (mở đúng tab con P&L / Dòng tiền / BEP)
- components/TaxAndCapitalSection.tsx, types/financial.ts, data/defaultFinancialConfig.ts – thêm "Chi phí dự phòng hàng tháng"
- components/Sheet3CogsSection.tsx, ProductionOrderPlanSection.tsx – header bảng cố định khi cuộn
- components/Header.tsx

## File gộp thủ công (giữ chức năng cũ + thêm chức năng mới)
- App.tsx: thêm đổi thứ tự SKU, truyền tab con cho báo cáo; SKU mới thêm vào cuối danh sách;
  khi đổi "Tháng bắt đầu" tự dời định biên nhân sự, kế hoạch creator, tháng giải ngân Capex, tháng bắt đầu Opex
- SkuCatalogSection.tsx: cột STT + nút lên/xuống, cột cố định; vẫn nhập giá trực tiếp 4 kênh
- SalesForecastSection.tsx: thêm nút "Tháng bắt đầu"; giữ cột Mã SKU, dòng DOANH THU, Xóa trắng, Xóa cột cuối, Nạp kế hoạch mẫu
- ChannelMixView.tsx: header cố định; giữ hiển thị phí sàn & số sản phẩm
- ProductPnlView.tsx: công thức mới; giữ nút "Khôi phục mặc định từ Tab 1"; ô nhập bao bì/hao hụt B2B, bao bì bán lẻ
- InitialCapexModal.tsx + HrOperationsSection.tsx: chọn tháng giải ngân theo kế hoạch; giữ "Đặt lại mẫu"
- PositionModal.tsx: thuế TNCN parttime tự tính lại khi đổi lương, vẫn sửa tay được
- TabNavigation.tsx: thanh tab cố định khi cuộn, giữ icon khóa tab sắp ra mắt
- server/dataSync.ts: lưu thứ tự SKU (__sortOrder trong payload) để giữ thứ tự sau khi tải lại

## Sửa lỗi TypeScript có sẵn từ trước
- App.tsx (dữ liệu tải từ API) và server/auth.ts (verifyToken): chỉ bổ sung ép kiểu, không đổi logic.
  `npm run lint` (tsc --noEmit) hiện sạch 0 lỗi.

## Lưu ý
- Chi phí dự phòng mặc định = 0 đ/tháng → số liệu dự án đã lưu không đổi. Nhập tại Tab 1 > Thuế & Vốn.
- Công thức P&L sản phẩm, dòng tiền và điểm hòa vốn theo phiên bản mới của project2 nên số liệu các báo cáo này có thể khác bản cũ.
