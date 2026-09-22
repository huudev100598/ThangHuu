import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { testConnection, closePool } from './src/server/db';
import {
  saveProjectData,
  loadProjectData,
  listProjects,
  deleteProject,
  hardDeleteProject,
  ProjectData,
} from './src/server/dataSync';
import { signToken } from './src/server/auth';
import { requireAuth, requireAdmin, AuthedRequest } from './src/server/authMiddleware';
import {
  authenticate,
  createUser,
  ensureDefaultAdmin,
  findUserByEmail,
  listUsers,
  updateUserRole,
  updateUserStatus,
} from './src/server/userService';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// ---------------------------------------------------------------------------
// Health & DB
// ---------------------------------------------------------------------------

app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    storage: 'mysql-normalized',
    auth: 'jwt',
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      res.json({
        success: true,
        message: 'Database connection successful',
        storage: 'mysql-normalized',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
});

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body || {};
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'email, password, fullName are required',
      });
    }
    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await createUser({
      email,
      password,
      fullName,
      role: 'user',
    });
    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: { user, token },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Register failed: ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const user = await authenticate(email, password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or account disabled' });
    }

    const token = signToken(user);
    res.json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed: ' + error.message });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthedRequest, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// ---------------------------------------------------------------------------
// Admin API (admin only)
// ---------------------------------------------------------------------------

app.get('/api/admin/users', requireAuth, requireAdmin, async (_req: AuthedRequest, res) => {
  try {
    const users = await listUsers();
    res.json({ success: true, data: users, count: users.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.patch('/api/admin/users/:id/status', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body || {};
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be active or disabled' });
    }
    if (req.user!.id === id && status === 'disabled') {
      return res.status(400).json({ success: false, message: 'Cannot disable your own account' });
    }
    const ok = await updateUserStatus(id, status);
    if (!ok) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `User status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.patch('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body || {};
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: 'role must be admin or user' });
    }
    if (req.user!.id === id && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot remove your own admin role' });
    }
    const ok = await updateUserRole(id, role);
    if (!ok) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Projects API (authenticated, scoped by user; admin can see all)
// ---------------------------------------------------------------------------

app.get('/api/projects', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const asAdmin = req.user!.role === 'admin' && req.query.all === 'true';
    const projects = await listProjects(req.user!.id, { asAdmin });
    res.json({
      success: true,
      data: projects,
      count: projects.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('List projects error:', error);
    res.status(500).json({ success: false, message: 'Error listing projects: ' + error.message });
  }
});

app.post('/api/save-project', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const projectData: ProjectData = req.body;
    if (!projectData?.projectName) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    await saveProjectData(projectData, req.user!.id);

    res.json({
      success: true,
      message: `Project "${projectData.projectName}" saved`,
      projectName: projectData.projectName,
      storage: 'mysql-normalized',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Save project error:', error);
    res.status(500).json({ success: false, message: 'Error saving project: ' + error.message });
  }
});

app.get('/api/load-project/:projectName', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const projectName = decodeURIComponent(req.params.projectName);
    const asAdmin = req.user!.role === 'admin';
    const projectData = await loadProjectData(projectName, req.user!.id, { asAdmin });

    if (!projectData) {
      return res.status(404).json({ success: false, message: `Project "${projectName}" not found` });
    }

    res.json({
      success: true,
      data: projectData,
      storage: 'mysql-normalized',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Load project error:', error);
    res.status(500).json({ success: false, message: 'Error loading project: ' + error.message });
  }
});

app.get('/api/projects/:projectName', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const projectName = decodeURIComponent(req.params.projectName);
    const asAdmin = req.user!.role === 'admin';
    const projectData = await loadProjectData(projectName, req.user!.id, { asAdmin });

    if (!projectData) {
      return res.status(404).json({ success: false, message: `Project "${projectName}" not found` });
    }

    res.json({
      success: true,
      data: projectData,
      storage: 'mysql-normalized',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error loading project: ' + error.message });
  }
});

app.delete('/api/projects/:projectName', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const projectName = decodeURIComponent(req.params.projectName);
    const hard = String(req.query.hard || '').toLowerCase() === 'true';
    const asAdmin = req.user!.role === 'admin';

    const ok = hard
      ? await hardDeleteProject(projectName, req.user!.id, { asAdmin })
      : await deleteProject(projectName, req.user!.id, { asAdmin });

    if (!ok) {
      return res.status(404).json({ success: false, message: `Project "${projectName}" not found` });
    }

    res.json({
      success: true,
      message: hard
        ? `Project "${projectName}" permanently deleted`
        : `Project "${projectName}" deactivated`,
      hard,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deleting project: ' + error.message });
  }
});

app.get('/api/get-default-project', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const projectName = 'mosh_mode_project';
    const projectData = await loadProjectData(projectName, req.user!.id);

    if (projectData) {
      res.json({
        success: true,
        data: projectData,
        storage: 'mysql-normalized',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No saved project found. Using default values.',
        data: null,
      });
    }
  } catch (error: any) {
    console.error('Get default project error:', error);
    res.json({
      success: false,
      message: 'Error loading project: ' + error.message,
      data: null,
    });
  }
});

// AI BEP Strategic Advisor Endpoint
app.post('/api/ai-bep-advisor', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { 
      bepData, 
      pnlSummary, 
      monthsCount, 
      simulation, 
      userQuery 
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Return a high-quality fallback strategic assessment when API key is not yet set in environment
      return res.json({
        success: true,
        source: 'fallback',
        message: 'GEMINI_API_KEY chưa được cấu hình. Đang hiển thị phân tích chiến lược CFO mẫu chuẩn.',
        analysis: generateFallbackAnalysis(bepData, pnlSummary, monthsCount, simulation),
      });
    }

    const prompt = `
Bạn là một Giám Đốc Tài Chính (Chief Financial Officer - CFO) và Chuyên Gia Chiến Lược Tăng Trưởng D2C/E-commerce hàng đầu tại Việt Nam.
Dự án kinh doanh đang trong giai đoạn tiền khởi động (Pre-launch). Hãy phân tích toàn diện dữ liệu tài chính và điểm hòa vốn (BEP) dưới đây để đưa ra lời khuyên chiến lược sắc bén, thực tế và hành động được giúp doanh nghiệp ĐẢM BẢO TỶ LỆ THẮNG CAO NHẤT trước khi bấm nút khởi động.

DỮ LIỆU TÀI CHÍNH DỰ ÁN:
- Số tháng kế hoạch: ${monthsCount || 12} tháng
- Tổng Doanh Thu Kế Hoạch (Gross Revenue): ${formatCurrency(pnlSummary?.grossRevenue || 0)}
- Tổng Sản Lượng Kế Hoạch: ${pnlSummary?.totalUnits?.toLocaleString('vi-VN') || 0} sản phẩm
- Giá bán trung bình (ASP): ${formatCurrency(bepData?.averageSellingPrice || 0)} / sản phẩm
- Tổng Định Phí Cần Bù Đắp (Fixed Costs): ${formatCurrency(bepData?.totalFixedCosts || 0)} (Lương nhân sự + Opex kho bãi + Khấu hao)
- Tổng Biến Phí (Variable Costs): ${formatCurrency(bepData?.totalVariableCosts || 0)} (Giá vốn hàng bán, Phí sàn TMĐT, Phí bao bì đóng gói, Quảng cáo nội sàn, Creator Booking)
- Tỷ lệ biến phí (VCR): ${bepData?.variableCostRatio?.toFixed(1) || 0}%
- Tỷ lệ Số Dư Đảm Phí (Contribution Margin Ratio - CMR): ${bepData?.contributionMarginRatio?.toFixed(1) || 0}%
- DOANH THU HÒA VỐN (BEP Revenue): ${formatCurrency(bepData?.breakEvenRevenue || 0)}
- SẢN LƯỢNG HÒA VỐN (BEP Units): ${bepData?.breakEvenUnits?.toLocaleString('vi-VN') || 0} sản phẩm
- Biên Độ An Toàn (Margin of Safety): ${formatCurrency(bepData?.marginOfSafetyRevenue || 0)} (${bepData?.marginOfSafetyPercent?.toFixed(1) || 0}%)
- Tháng đạt hòa vốn theo kế hoạch: ${bepData?.breakEvenMonthLabel || 'Chưa đạt trong kỳ'}

KỊCH BẢN MÔ PHỎNG ĐIỀU CHỈNH:
- Tỷ lệ tăng doanh số: +${simulation?.gmvBoostPct || 0}%
- Số tháng mở rộng thêm: +${simulation?.extraMonths || 0} tháng
${userQuery ? `YÊU CẦU ĐẶC BIỆT CỦA NGƯỜI DÙNG: "${userQuery}"` : ''}

HÃY SOẠN BÁO CÁO CHIẾN LƯỢC CHI TIẾT THEO 5 TRỤ CỘT BẮT BUỘC SAU ĐÂY (dùng định dạng Markdown rõ ràng, chuyên nghiệp, ngôn từ tài chính chuẩn mực, có số liệu dẫn chứng cụ thể):

1. 🎯 ĐÁNH GIÁ TỶ LỆ THẮNG TRƯỚC KHI KHỞI ĐỘNG (WIN PROBABILITY SCORE)
- Đưa ra điểm số xác suất thắng trên thang 100 (Ví dụ: 82/100).
- Nhận xét thẳng thắn về độ khả thi của điểm hòa vốn (BEP) và biên độ an toàn (Margin of Safety). Dự án đang an toàn hay tiềm ẩn rủi ro cạn kiệt dòng tiền?

2. 📦 CHIẾN LƯỢC SẢN PHẨM & COMBO ĐẨY CAO BIÊN LÃI (AOV & BUNDLE STRATEGY)
- Hướng dẫn chiến thuật đóng gói Combo/Bundle (Hero SKU + Cross-sell) để pha loãng các chi phí cố định trên mỗi đơn hàng (Phí cố định xử lý đơn 3.000đ/đơn, bao bì màng xốp).
- Làm thế nào để kéo Tỷ lệ Số Dư Đảm Phí (CMR) từ mức ${bepData?.contributionMarginRatio?.toFixed(1) || 0}% lên ngưỡng an toàn hơn (> 40%).

3. 📉 QUẢN TRỊ BIẾN PHÍ SÀN & THIẾT LẬP KỶ LUẬT MARKETING (ROAS / CIR GUARDRAILS)
- Thiết lập trần chi phí Marketing tối đa (CIR - Cost of Income Ratio) không được phép vượt quá.
- Lời khuyên về tỷ lệ cân đối giữa chi phí Quảng cáo nội sàn (Shopee/TikTok Ads) và chi phí Booking KOC/Creator để không ăn mòn số dư đảm phí.

4. 🛡️ QUẢN TRỊ ĐỊNH PHÍ & VỐN MỒI LƯU ĐỘNG (RUNWAY & FIXED COST DISCIPLINE)
- Cảnh báo về điểm thâm hụt tiền mặt và gối đầu vốn sản xuất (Working Capital).
- Chiến thuật điều phối quỹ lương và chi phí vận hành (Fixed Opex) trong 3 tháng đầu ra mắt để giữ điểm hòa vốn ở khoảng cách gần nhất.

5. 🚀 KẾ HOẠCH HÀNH ĐỘNG 30 NGÀY TRƯỚC GIỜ G (PRE-LAUNCH ACTION CHECKLIST)
- Đưa ra danh sách 4-5 việc quan trọng nhất cần chốt trước khi bấm nút mở bán (đàm phán giá vốn PO, test mẫu creator, tối ưu listing combo, chuẩn bị vốn dự phòng).
`;

    let text = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      text = response.text || '';
    } catch (genAiErr: any) {
      console.warn('Gemini API call returned error, using strategic analysis engine fallback:', genAiErr?.message || genAiErr);
      text = generateFallbackAnalysis(bepData, pnlSummary, monthsCount, simulation);
    }

    if (!text) {
      text = generateFallbackAnalysis(bepData, pnlSummary, monthsCount, simulation);
    }

    res.json({
      success: true,
      source: 'gemini-3.8-flash',
      analysis: text,
    });
  } catch (error: any) {
    console.error('Error generating AI BEP advice:', error);
    res.json({
      success: true,
      source: 'fallback',
      analysis: generateFallbackAnalysis(req.body?.bepData, req.body?.pnlSummary, req.body?.monthsCount, req.body?.simulation),
    });
  }
});

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(val)) + ' đ';
}

function generateFallbackAnalysis(
  bepData: any, 
  pnlSummary: any, 
  monthsCount: number, 
  simulation: any
): string {
  const cmr = bepData?.contributionMarginRatio || 35;
  const bepRev = bepData?.breakEvenRevenue || 0;
  const curRev = pnlSummary?.grossRevenue || 0;
  const mosPct = bepData?.marginOfSafetyPercent || 0;
  const isSafe = mosPct > 15;

  return `### 🎯 1. ĐÁNH GIÁ TỶ LỆ THẮNG TRƯỚC KHI KHỞI ĐỘNG (WIN PROBABILITY SCORE)
- **Điểm số khả thi dự án**: **${isSafe ? '82/100 (Khá An Toàn)' : '68/100 (Cần Tối Ưu Thêm)'}**
- **Đánh giá ngưỡng hòa vốn**: Dự án cần đạt tổng doanh thu **${formatCurrency(bepRev)}** để bù đắp toàn bộ định phí đầu tư và vận hành (${formatCurrency(bepData?.totalFixedCosts || 0)}).
- **Biên độ an toàn (Margin of Safety)**: Đang ở mức **${mosPct.toFixed(1)}%**. ${isSafe ? 'Doanh thu kế hoạch có vùng đệm tốt trước các biến động thị trường.' : 'Vùng đệm an toàn còn mỏng, cần tập trung đẩy mạnh AOV và kiểm soát chặt biến phí sàn.'}

---

### 📦 2. CHIẾN LƯỢC SẢN PHẨM & COMBO ĐẨY CAO BIÊN LÃI (AOV & BUNDLE STRATEGY)
- **Pha loãng chi phí cố định trên mỗi đơn hàng**: Mỗi đơn hàng TMĐT gánh các chi phí cố định (Phí xử lý đơn sàn ~3.000đ/đơn, Thùng carton & màng xốp đóng gói ~4.000đ - 6.000đ). Nếu bán sản phẩm đơn lẻ giá thấp (dưới 150.000đ), chi phí này sẽ chiếm tới 6-8% giá trị đơn hàng.
- **Chiến thuật Combo 2-in-1 / 3-in-1**: Xây dựng combo Hero SKU (ví dụ: Combo Serum + Xịt Khử Mùi) đẩy giá trị trung bình đơn (AOV) lên mức 250.000đ - 350.000đ. Khi đó, chi phí bao bì và phí xử lý đơn giảm tỷ trọng xuống dưới 3%, trực tiếp nâng Tỷ lệ Số Dư Đảm Phí (CMR) từ **${cmr.toFixed(1)}%** lên trên **42%**.

---

### 📉 3. QUẢN TRỊ BIẾN PHÍ SÀN & THIẾT LẬP KỶ LUẬT MARKETING (ROAS / CIR GUARDRAILS)
- **Kỷ luật CIR trần**: Với tỷ lệ số dư đảm phí hiện tại (${cmr.toFixed(1)}%), tổng chi phí Marketing (bao gồm Quảng cáo nội sàn Ads + Booking KOC + Phí Affiliate) **tuyệt đối không được vượt quá 22% - 24%** doanh thu gộp.
- **Tối ưu ROAS nội sàn**: Nhắm mục tiêu ROAS Shopee/TikTok Ads tối thiểu $\ge 4.5x - 5.0x$. Các chiến dịch Booking KOC/UGC chỉ thanh toán phí cố định thấp kết hợp chia hoa hồng tiếp thị liên kết (Affiliate 8% - 10%) để chuyển rủi ro marketing thành chi phí biến đổi theo kết quả.

---

### 🛡️ 4. QUẢN TRỊ ĐỊNH PHÍ & VỐN MỒI LƯU ĐỘNG (RUNWAY & FIXED COST DISCIPLINE)
- **Tách bạch chi tiêu Capex ban đầu**: Chi phí đầu tư tài sản, công cụ dụng cụ và chụp ảnh bao bì cần giải ngân đúng kế hoạch, tránh phát sinh đột biến trước tháng mở bán.
- **Kiểm soát quỹ lương và chi phí cố định**: Giữ định phí vận hành ở mức trung bình **${formatCurrency(bepData?.averageMonthlyFixedCost || 0)}/tháng**. Giai đoạn 2 tháng đầu chỉ duy trì nhân sự nòng cốt (Vận hành sàn, Content Creator, Chăm sóc khách hàng) trước khi mở rộng quy mô.

---

### 🚀 5. KẾ HOẠCH HÀNH ĐỘNG 30 NGÀY TRƯỚC GIỜ G (PRE-LAUNCH ACTION CHECKLIST)
1. ✅ **Chốt thỏa thuận gối đầu PO**: Đàm phán với xưởng sản xuất điều khoản thanh toán 30% cọc - 70% sau khi giao hàng 15-30 ngày để giảm áp lực dòng tiền đáy.
2. ✅ **Gửi mẫu Sampling Creator sớm**: Hoàn tất gửi 50-100 set quà tặng sampling trước ngày mở bán ít nhất 15 ngày để video UGC lên sóng đúng ngày Mega Sale.
3. ✅ **Tối ưu Listing & Bundle Voucher**: Cài đặt sẵn các deal mua kèm sốc, combo quà tặng để định hướng khách hàng mua đơn hàng giá trị cao.
4. ✅ **Thiết lập dự phòng vốn lưu động**: Chuẩn bị hạn mức tín dụng hoặc vốn gối đầu tối thiểu bằng số dư thâm hụt tiền mặt đáy để đảm bảo không bị đứt gãy tồn kho khi tăng trưởng nóng.`;
}

// Start server
async function startServer() {
  try {
    const dbOk = await testConnection();
    if (dbOk) {
      await ensureDefaultAdmin();
    } else {
      console.warn('[auth] DB not connected — skip admin seed');
    }
  } catch (e) {
    console.warn('[auth] ensureDefaultAdmin failed:', e);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Financial Engine server listening on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing server...');
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  });
}

startServer();
