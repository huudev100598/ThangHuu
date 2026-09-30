import { getConnection, query } from './db';
import { ProjectParameters } from '../types/financial';
import { ProductCategory, ProductSku, Sheet3CogsData, Supplier, ProductQuotation } from '../types/sku';
import { SalesMonth, SalesVolumeMap, ChannelMixConfig, CreatorPlanMap, CreatorCampaign } from '../types/salesForecast';
import {
  SalaryStructurePosition,
  HeadcountPlanMap,
  InitialCapexItem,
  MonthlyOperatingExpense,
  HrOperationsConfig,
} from '../types/hrOperations';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface ProjectData {
  projectName: string;
  parameters: ProjectParameters;
  categories: ProductCategory[];
  skus: ProductSku[];
  sheet3CogsMap: Record<string, Sheet3CogsData>;
  suppliers: Supplier[];
  quotations: ProductQuotation[];
  salesMonths: SalesMonth[];
  salesVolumes: SalesVolumeMap;
  channelMix: ChannelMixConfig;
  creatorPlan: CreatorPlanMap;
  creatorCampaigns: CreatorCampaign[];
  hrPositions: SalaryStructurePosition[];
  hrHeadcountMap: HeadcountPlanMap;
  initialCapexItems: InitialCapexItem[];
  monthlyOpexItems: MonthlyOperatingExpense[];
  hrConfig: HrOperationsConfig;
}

export interface ProjectSummary {
  id: number;
  userId: number;
  projectName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function safeParse<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === 'object') return raw as T;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}

async function exec(conn: PoolConnection, sql: string, values?: any[]) {
  return conn.execute(sql, values || []);
}

/** Delete all child rows for a project (order respects FKs where present). */
async function clearProjectChildren(conn: PoolConnection, projectId: number) {
  const tables = [
    'sales_volumes',
    'sheet3_cogs',
    'product_quotations',
    'creator_plan',
    'creator_campaigns',
    'hr_headcount',
    'channel_mix_config',
    'sales_months',
    'product_skus',
    'product_categories',
    'suppliers',
    'hr_positions',
    'capex_items',
    'opex_items',
    'hr_config',
    'financial_parameters',
  ];
  for (const table of tables) {
    await exec(conn, `DELETE FROM ${table} WHERE project_id = ?`, [projectId]);
  }
}

/**
 * Save full project into normalized tables (transactional replace).
 */
export async function saveProjectData(data: ProjectData, userId: number): Promise<boolean> {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Upsert project (scoped per user)
    await exec(
      conn,
      `INSERT INTO projects (user_id, project_name, is_active)
       VALUES (?, ?, TRUE)
       ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = NOW()`,
      [userId, data.projectName]
    );

    const [projRows] = await exec(
      conn,
      'SELECT id FROM projects WHERE user_id = ? AND project_name = ?',
      [userId, data.projectName]
    );
    const projectId = (projRows as RowDataPacket[])[0]?.id as number;
    if (!projectId) throw new Error('Failed to resolve project id');

    await clearProjectChildren(conn, projectId);

    // 1. Financial parameters
    if (data.parameters) {
      await exec(
        conn,
        `INSERT INTO financial_parameters (project_id, parameters) VALUES (?, ?)`,
        [projectId, JSON.stringify(data.parameters)]
      );
    }

    // 2. Categories
    for (const cat of data.categories || []) {
      await exec(
        conn,
        `INSERT INTO product_categories (id, project_id, name, code, description, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          cat.id,
          projectId,
          cat.name,
          cat.code || null,
          cat.description || null,
          JSON.stringify(cat),
        ]
      );
    }

    // 3. SKUs (lưu kèm thứ tự hiển thị __sortOrder trong payload để giữ đúng thứ tự sắp xếp SKU)
    let skuOrder = 0;
    for (const sku of data.skus || []) {
      await exec(
        conn,
        `INSERT INTO product_skus
          (id, project_id, category_id, sku_code, name, type, status, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sku.id,
          projectId,
          sku.categoryId || null,
          sku.skuCode || null,
          sku.name,
          sku.type || 'single',
          sku.status || 'active',
          JSON.stringify({ ...sku, __sortOrder: skuOrder++ }),
        ]
      );
    }

    // 4. Sheet3 COGS
    for (const [skuId, cogs] of Object.entries(data.sheet3CogsMap || {})) {
      await exec(
        conn,
        `INSERT INTO sheet3_cogs
          (project_id, sku_id, cogs_per_unit, moq, factory_name, lead_time_days, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          skuId,
          cogs.cogsPerUnit ?? 0,
          cogs.moq ?? 0,
          cogs.factoryName || null,
          cogs.leadTimeDays ?? null,
          JSON.stringify(cogs),
        ]
      );
    }

    // 5. Suppliers
    for (const s of data.suppliers || []) {
      await exec(
        conn,
        `INSERT INTO suppliers
          (id, project_id, factory_name, contact_person, phone, email, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id,
          projectId,
          s.factoryName,
          s.contactPerson || null,
          s.phone || null,
          s.email || null,
          JSON.stringify(s),
        ]
      );
    }

    // 6. Quotations
    for (const q of data.quotations || []) {
      await exec(
        conn,
        `INSERT INTO product_quotations
          (id, project_id, sku_id, supplier_id, factory_name, unit_price, moq, lead_time_days, is_chosen, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          q.id,
          projectId,
          q.skuId,
          q.supplierId,
          q.factoryName || null,
          q.unitPrice ?? 0,
          q.moq ?? 0,
          q.leadTimeDays ?? null,
          q.isChosen ? 1 : 0,
          JSON.stringify(q),
        ]
      );
    }

    // 7. Sales months
    
    let monthOrder = 0;
    for (const m of data.salesMonths || []) {
      await exec(
        conn,
        `INSERT INTO sales_months (id, project_id, date_str, month_label, sort_order, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [m.id, projectId, m.dateStr || m.id, m.label || null, monthOrder++, JSON.stringify(m)]
      );
    }

    // 8. Sales volumes
    for (const [skuId, monthMap] of Object.entries(data.salesVolumes || {})) {
      for (const [monthId, volume] of Object.entries(monthMap || {})) {
        await exec(
          conn,
          `INSERT INTO sales_volumes (project_id, sku_id, month_id, volume)
           VALUES (?, ?, ?, ?)`,
          [projectId, skuId, monthId, Number(volume) || 0]
        );
      }
    }

    // 9. Channel mix
    const mix = data.channelMix || ({} as ChannelMixConfig);
    for (const [channelName, percentage] of Object.entries(mix)) {
      await exec(
        conn,
        `INSERT INTO channel_mix_config (project_id, channel_name, percentage)
         VALUES (?, ?, ?)`,
        [projectId, channelName, Number(percentage) || 0]
      );
    }

    // 10. Creator plan
    for (const [monthId, alloc] of Object.entries(data.creatorPlan || {})) {
      await exec(
        conn,
        `INSERT INTO creator_plan
          (project_id, month_id, ugc_count, koc_count, kol_count, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          monthId,
          alloc?.ugcCount ?? 0,
          alloc?.kocCount ?? 0,
          alloc?.kolCount ?? 0,
          JSON.stringify(alloc),
        ]
      );
    }

    // 11. Creator campaigns
    for (const c of data.creatorCampaigns || []) {
      await exec(
        conn,
        `INSERT INTO creator_campaigns (id, project_id, campaign_name, description, payload)
         VALUES (?, ?, ?, ?, ?)`,
        [c.id, projectId, c.name || null, c.description || null, JSON.stringify(c)]
      );
    }

    // 12. HR positions
    for (const p of data.hrPositions || []) {
      await exec(
        conn,
        `INSERT INTO hr_positions
          (id, project_id, position_title, department, contract_type, base_salary, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          projectId,
          p.title,
          p.department || null,
          p.contractType || null,
          p.baseSalary ?? 0,
          JSON.stringify(p),
        ]
      );
    }

    // 13. HR headcount
    for (const [positionId, monthMap] of Object.entries(data.hrHeadcountMap || {})) {
      for (const [monthId, count] of Object.entries(monthMap || {})) {
        await exec(
          conn,
          `INSERT INTO hr_headcount (project_id, position_id, month_id, headcount)
           VALUES (?, ?, ?, ?)`,
          [projectId, positionId, monthId, Number(count) || 0]
        );
      }
    }

    // 14. Capex
    for (const item of data.initialCapexItems || []) {
      await exec(
        conn,
        `INSERT INTO capex_items
          (id, project_id, item_name, cost, depreciation_months, disbursement_month, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          projectId,
          item.name,
          item.amount ?? 0,
          item.depreciationMonths ?? 0,
          item.disbursementMonth || null,
          JSON.stringify(item),
        ]
      );
    }

    // 15. Opex
    for (const item of data.monthlyOpexItems || []) {
      await exec(
        conn,
        `INSERT INTO opex_items
          (id, project_id, item_name, monthly_cost, category, start_month, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          projectId,
          item.name,
          item.amount ?? 0,
          item.category || null,
          item.startMonth || null,
          JSON.stringify(item),
        ]
      );
    }

    // 16. HR config
    if (data.hrConfig) {
      await exec(conn, `INSERT INTO hr_config (project_id, config_json) VALUES (?, ?)`, [
        projectId,
        JSON.stringify(data.hrConfig),
      ]);
    }

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    console.error('Error saving project data (normalized):', error);
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Load full project from normalized tables.
 */
export async function loadProjectData(
  projectName: string,
  userId: number,
  opts?: { asAdmin?: boolean }
): Promise<ProjectData | null> {
  try {
    const projectRes = (
      opts?.asAdmin
        ? await query('SELECT id, user_id FROM projects WHERE project_name = ? AND is_active = TRUE LIMIT 1', [
            projectName,
          ])
        : await query(
            'SELECT id, user_id FROM projects WHERE project_name = ? AND user_id = ? AND is_active = TRUE LIMIT 1',
            [projectName, userId]
          )
    ) as RowDataPacket[];

    if (!projectRes?.length) return null;
    const projectId = projectRes[0].id as number;

    // Parameters
    const paramRows = (await query(
      'SELECT parameters FROM financial_parameters WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const parameters = safeParse<ProjectParameters>(paramRows[0]?.parameters, {} as ProjectParameters);

    // Categories
    const catRows = (await query(
      'SELECT id, name, code, description, payload FROM product_categories WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const categories: ProductCategory[] = catRows.map((r) => {
      const fromPayload = safeParse<ProductCategory | null>(r.payload, null);
      return (
        fromPayload || {
          id: r.id,
          name: r.name,
          code: r.code || '',
          description: r.description || undefined,
        }
      );
    });

    // SKUs
    const skuRows = (await query(
      'SELECT id, payload FROM product_skus WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const skus: ProductSku[] = skuRows
      .map((r, idx) => {
        const parsed = safeParse<ProductSku & { __sortOrder?: number }>(r.payload, { id: r.id } as ProductSku);
        const order = typeof parsed.__sortOrder === 'number' ? parsed.__sortOrder : Number.MAX_SAFE_INTEGER;
        const { __sortOrder, ...sku } = parsed;
        return { sku: sku as ProductSku, order, idx };
      })
      // Dữ liệu cũ (chưa có __sortOrder) giữ nguyên thứ tự như trước
      .sort((a, b) => a.order - b.order || a.idx - b.idx)
      .map((x) => x.sku);

    // Sheet3 COGS
    const cogsRows = (await query(
      'SELECT sku_id, cogs_per_unit, moq, factory_name, lead_time_days, payload FROM sheet3_cogs WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const sheet3CogsMap: Record<string, Sheet3CogsData> = {};
    for (const r of cogsRows) {
      const fromPayload = safeParse<Sheet3CogsData | null>(r.payload, null);
      sheet3CogsMap[r.sku_id] = fromPayload || {
        skuId: r.sku_id,
        cogsPerUnit: Number(r.cogs_per_unit) || 0,
        moq: Number(r.moq) || 0,
        factoryName: r.factory_name || '',
        leadTimeDays: r.lead_time_days ?? undefined,
      };
    }

    // Suppliers
    const supplierRows = (await query(
      'SELECT id, payload FROM suppliers WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const suppliers: Supplier[] = supplierRows.map((r) =>
      safeParse<Supplier>(r.payload, { id: r.id } as Supplier)
    );

    // Quotations
    const quoteRows = (await query(
      'SELECT id, payload FROM product_quotations WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const quotations: ProductQuotation[] = quoteRows.map((r) =>
      safeParse<ProductQuotation>(r.payload, { id: r.id } as ProductQuotation)
    );

    // Sales months
    const monthRows = (await query(
      'SELECT id, date_str, month_label, payload FROM sales_months WHERE project_id = ? ORDER BY sort_order, id',
      [projectId]
    )) as RowDataPacket[];
    const salesMonths: SalesMonth[] = monthRows.map((r) => {
      const fromPayload = safeParse<SalesMonth | null>(r.payload, null);
      return (
        fromPayload || {
          id: r.id,
          dateStr: r.date_str || r.id,
          label: r.month_label || r.id,
        }
      );
    });

    // Sales volumes
    const volRows = (await query(
      'SELECT sku_id, month_id, volume FROM sales_volumes WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const salesVolumes: SalesVolumeMap = {};
    for (const r of volRows) {
      if (!salesVolumes[r.sku_id]) salesVolumes[r.sku_id] = {};
      salesVolumes[r.sku_id][r.month_id] = Number(r.volume) || 0;
    }

    // Channel mix
    const mixRows = (await query(
      'SELECT channel_name, percentage FROM channel_mix_config WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const channelMix = {
      shopee: 0,
      tikTokShop: 0,
      retail: 0,
      b2b: 0,
    } as ChannelMixConfig;
    for (const r of mixRows) {
      const key = r.channel_name as keyof ChannelMixConfig;
      if (key in channelMix) {
        (channelMix as any)[key] = Number(r.percentage) || 0;
      }
    }

    // Creator plan
    const planRows = (await query(
      'SELECT month_id, ugc_count, koc_count, kol_count, payload FROM creator_plan WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const creatorPlan: CreatorPlanMap = {};
    for (const r of planRows) {
      const fromPayload = safeParse<CreatorPlanMap[string] | null>(r.payload, null);
      creatorPlan[r.month_id] = fromPayload || {
        ugcCount: Number(r.ugc_count) || 0,
        kocCount: Number(r.koc_count) || 0,
        kolCount: Number(r.kol_count) || 0,
      };
    }

    // Creator campaigns
    const campRows = (await query(
      'SELECT id, payload FROM creator_campaigns WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const creatorCampaigns: CreatorCampaign[] = campRows.map((r) =>
      safeParse<CreatorCampaign>(r.payload, { id: r.id } as CreatorCampaign)
    );

    // HR positions
    const posRows = (await query(
      'SELECT id, payload FROM hr_positions WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const hrPositions: SalaryStructurePosition[] = posRows.map((r) =>
      safeParse<SalaryStructurePosition>(r.payload, { id: r.id } as SalaryStructurePosition)
    );

    // HR headcount
    const hcRows = (await query(
      'SELECT position_id, month_id, headcount FROM hr_headcount WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const hrHeadcountMap: HeadcountPlanMap = {};
    for (const r of hcRows) {
      if (!hrHeadcountMap[r.position_id]) hrHeadcountMap[r.position_id] = {};
      hrHeadcountMap[r.position_id][r.month_id] = Number(r.headcount) || 0;
    }

    // Capex
    const capexRows = (await query(
      'SELECT id, payload FROM capex_items WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const initialCapexItems: InitialCapexItem[] = capexRows.map((r) =>
      safeParse<InitialCapexItem>(r.payload, { id: r.id } as InitialCapexItem)
    );

    // Opex
    const opexRows = (await query(
      'SELECT id, payload FROM opex_items WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const monthlyOpexItems: MonthlyOperatingExpense[] = opexRows.map((r) =>
      safeParse<MonthlyOperatingExpense>(r.payload, { id: r.id } as MonthlyOperatingExpense)
    );

    // HR config
    const hrCfgRows = (await query(
      'SELECT config_json FROM hr_config WHERE project_id = ?',
      [projectId]
    )) as RowDataPacket[];
    const hrConfig = safeParse<HrOperationsConfig>(
      hrCfgRows[0]?.config_json,
      {} as HrOperationsConfig
    );

    return {
      projectName,
      parameters,
      categories,
      skus,
      sheet3CogsMap,
      suppliers,
      quotations,
      salesMonths,
      salesVolumes,
      channelMix,
      creatorPlan,
      creatorCampaigns,
      hrPositions,
      hrHeadcountMap,
      initialCapexItems,
      monthlyOpexItems,
      hrConfig,
    };
  } catch (error) {
    console.error('Error loading project data (normalized):', error);
    throw error;
  }
}

/** List all active projects */
export async function listProjects(userId: number, opts?: { asAdmin?: boolean }): Promise<ProjectSummary[]> {
  const rows = (
    opts?.asAdmin
      ? await query(
          `SELECT id, user_id, project_name, is_active, created_at, updated_at
           FROM projects WHERE is_active = TRUE ORDER BY updated_at DESC`
        )
      : await query(
          `SELECT id, user_id, project_name, is_active, created_at, updated_at
           FROM projects WHERE is_active = TRUE AND user_id = ? ORDER BY updated_at DESC`,
          [userId]
        )
  ) as RowDataPacket[];

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    projectName: r.project_name,
    isActive: !!r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/** Soft-delete a project */
export async function deleteProject(
  projectName: string,
  userId: number,
  opts?: { asAdmin?: boolean }
): Promise<boolean> {
  const result = (
    opts?.asAdmin
      ? await query(
          `UPDATE projects SET is_active = FALSE, updated_at = NOW() WHERE project_name = ?`,
          [projectName]
        )
      : await query(
          `UPDATE projects SET is_active = FALSE, updated_at = NOW() WHERE project_name = ? AND user_id = ?`,
          [projectName, userId]
        )
  ) as ResultSetHeader;
  return (result.affectedRows || 0) > 0;
}

/** Hard-delete a project and all children (CASCADE) */
export async function hardDeleteProject(
  projectName: string,
  userId: number,
  opts?: { asAdmin?: boolean }
): Promise<boolean> {
  const result = (
    opts?.asAdmin
      ? await query(`DELETE FROM projects WHERE project_name = ?`, [projectName])
      : await query(`DELETE FROM projects WHERE project_name = ? AND user_id = ?`, [projectName, userId])
  ) as ResultSetHeader;
  return (result.affectedRows || 0) > 0;
}

