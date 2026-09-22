import { ProductCategory, ProductSku, Sheet3CogsData, Supplier, ProductQuotation } from '../types/sku';

// Danh sách Nhà Cung Cấp / Nhà máy sản xuất (Sheet 3)
export const DEFAULT_SUPPLIERS: Supplier[] = [];

// Danh sách Báo Giá Sản Xuất khởi tạo (Sheet 3)
export const DEFAULT_PRODUCT_QUOTATIONS: ProductQuotation[] = [];

// Danh mục sản phẩm (Product Categories) chuẩn cho Mosh&Mode
export const DEFAULT_PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-serum',
    name: 'Serum Khử Mùi & Giảm Tiết Mồ Hôi',
    code: 'SERUM',
    description: 'Tinh chất đặc trị vùng da dưới cánh tay công thức chuyên sâu',
  },
  {
    id: 'cat-spray',
    name: 'Xịt Khử Mùi & Làm Sáng Nách',
    code: 'SPRAY',
    description: 'Xịt khoáng thảo dược làm dịu, kiểm soát mồ hôi và dưỡng sáng',
  },
  {
    id: 'cat-scrub',
    name: 'Tẩy Tế Bào Chết & Mịn Da Vùng Kín/Nách',
    code: 'SCRUB',
    description: 'Tẩy da chết hóa học AHA/BHA kết hợp hạt cafe mịn màng',
  },
  {
    id: 'cat-combo',
    name: 'Combo Chăm Sóc Toàn Diện (Sets)',
    code: 'COMBO',
    description: 'Các bộ giải pháp kết hợp chuyên sâu cho vùng nách',
  },
];

// Dữ liệu từ Sheet 3: Giá Vốn Hàng Bán (COGS), MOQ, Nhà máy sản xuất
export const DEFAULT_SHEET3_COGS_DATA: Record<string, Sheet3CogsData> = {};

// Danh sách SKU sản phẩm mặc định (để trống sẵn sàng nhập liệu thực tế)
export const DEFAULT_PRODUCT_SKUS: ProductSku[] = [];

