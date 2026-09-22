import React, { useState, useMemo } from 'react';
import { ProductSku, Sheet3CogsData, ProductQuotation } from '../types/sku';
import { SalesMonth } from '../types/salesForecast';
import { ProjectParameters } from '../types/financial';
import { 
  Calendar, 
  Clock, 
  Factory, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Package, 
  Layers, 
  Truck, 
  Info, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  CreditCard,
  Building2,
  CalendarRange
} from 'lucide-react';

export type PoStrategy = 'jit-moq' | 'quarterly' | 'bulk';
export type PoViewMode = 'all' | 'matrix' | 'list';

export interface ProductionOrderPlanProps {
  productionSkus: ProductSku[];
  months: SalesMonth[];
  singleSkuProductionMatrix: Record<
    string,
    {
      totalProduction: number;
      unitCogs: number;
      months: Record<
        string,
        {
          totalProduction: number;
          salesUnits: number;
          samplingUnits: number;
        }
      >;
    }
  >;
  sheet3CogsMap: Record<string, Sheet3CogsData>;
  quotations?: ProductQuotation[];
  parameters: ProjectParameters;
}

export interface PoOrderItem {
  batchCode: string;
  batchNumber: number;
  skuId: string;
  skuCode: string;
  skuName: string;
  factoryName: string;
  moq: number;
  orderUnits: number;
  cogsPerUnit: number;
  totalCost: number;
  deposit50: number;
  final50: number;
  targetMonthId: string;
  targetMonthLabel: string;
  orderDate: string; // dd/mm/yyyy
  deliveryDate: string; // dd/mm/yyyy
  leadTimeDays: number;
  status: 'critical' | 'upcoming' | 'planned';
}

function calculatePoDates(dateStr: string, leadTimeDays: number) {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const month = parseInt(parts[1], 10) || 1;

  const deliveryDate = new Date(year, month - 1, 1);
  const orderDate = new Date(deliveryDate.getTime() - leadTimeDays * 24 * 60 * 60 * 1000);

  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${day}/${m}/${y}`;
  };

  return {
    deliveryDate: formatDate(deliveryDate),
    orderDate: formatDate(orderDate),
    deliveryDateObj: deliveryDate,
    orderDateObj: orderDate,
  };
}

export const ProductionOrderPlanSection: React.FC<ProductionOrderPlanProps> = ({
  productionSkus,
  months,
  singleSkuProductionMatrix,
  sheet3CogsMap,
  quotations = [],
  parameters,
}) => {
  const [strategy, setStrategy] = useState<PoStrategy>('jit-moq');
  const [viewMode, setViewMode] = useState<PoViewMode>('all');

  // Compute PO plan for each single SKU based on chosen quotation, lead-time, and demand
  const skuPoPlans = useMemo(() => {
    return productionSkus.map((sku) => {
      const chosenQuote = quotations.find((q) => q.skuId === sku.id && q.isChosen);
      const cogsData = sheet3CogsMap[sku.id];

      const factoryName = chosenQuote?.factoryName || cogsData?.factoryName || 'Chưa chốt nhà máy';
      const moq = chosenQuote?.moq || cogsData?.moq || 1000;
      const cogsPerUnit = chosenQuote?.unitPrice || cogsData?.cogsPerUnit || 0;
      const leadTimeDays = chosenQuote?.leadTimeDays || cogsData?.leadTimeDays || parameters.supplyChain.productionLeadTimeDays || 45;

      const matrixRow = singleSkuProductionMatrix[sku.id];
      const totalDemand = matrixRow?.totalProduction || 0;

      const batches: PoOrderItem[] = [];
      const monthlyAllocations: Record<
        string,
        {
          poUnits: number;
          poCost: number;
          endingInventory: number;
          batchCode?: string;
          orderDateStr?: string;
          depositAmount?: number;
          finalAmount?: number;
        }
      > = {};

      if (strategy === 'jit-moq') {
        // Strategy 1: JIT with MOQ constraint and rolling inventory
        let inventory = 0;

        months.forEach((m) => {
          const mDemand = matrixRow?.months[m.id]?.totalProduction || 0;
          let poUnits = 0;
          let batchCode: string | undefined;
          let orderDateStr: string | undefined;

          if (inventory < mDemand) {
            const netNeed = mDemand - inventory;
            poUnits = Math.max(moq, Math.ceil(netNeed / moq) * moq);
            inventory += poUnits;

            const dates = calculatePoDates(m.dateStr, leadTimeDays);
            const batchIdx = batches.length + 1;
            batchCode = `PO-${sku.skuCode}-0${batchIdx}`;
            orderDateStr = dates.orderDate;

            batches.push({
              batchCode,
              batchNumber: batchIdx,
              skuId: sku.id,
              skuCode: sku.skuCode,
              skuName: sku.name,
              factoryName,
              moq,
              orderUnits: poUnits,
              cogsPerUnit,
              totalCost: poUnits * cogsPerUnit,
              deposit50: poUnits * cogsPerUnit * 0.5,
              final50: poUnits * cogsPerUnit * 0.5,
              targetMonthId: m.id,
              targetMonthLabel: m.label,
              orderDate: dates.orderDate,
              deliveryDate: dates.deliveryDate,
              leadTimeDays,
              status: batchIdx === 1 ? 'critical' : batchIdx === 2 ? 'upcoming' : 'planned',
            });
          }

          inventory -= mDemand;

          monthlyAllocations[m.id] = {
            poUnits,
            poCost: poUnits * cogsPerUnit,
            endingInventory: inventory,
            batchCode,
            orderDateStr,
            depositAmount: poUnits > 0 ? poUnits * cogsPerUnit * 0.5 : 0,
            finalAmount: poUnits > 0 ? poUnits * cogsPerUnit * 0.5 : 0,
          };
        });
      } else if (strategy === 'quarterly') {
        // Strategy 2: Quarterly batches (grouped every 3 months)
        let inventory = 0;
        const quarterSize = 3;

        for (let i = 0; i < months.length; i += quarterSize) {
          const qMonths = months.slice(i, i + quarterSize);
          const firstM = qMonths[0];
          const qDemand = qMonths.reduce((sum, qm) => sum + (matrixRow?.months[qm.id]?.totalProduction || 0), 0);

          let poUnits = 0;
          let batchCode: string | undefined;
          let orderDateStr: string | undefined;

          if (inventory < qDemand) {
            const netNeed = qDemand - inventory;
            poUnits = Math.max(moq, Math.ceil(netNeed / moq) * moq);
            inventory += poUnits;

            const dates = calculatePoDates(firstM.dateStr, leadTimeDays);
            const batchIdx = batches.length + 1;
            batchCode = `PO-${sku.skuCode}-Q${Math.floor(i / quarterSize) + 1}`;
            orderDateStr = dates.orderDate;

            batches.push({
              batchCode,
              batchNumber: batchIdx,
              skuId: sku.id,
              skuCode: sku.skuCode,
              skuName: sku.name,
              factoryName,
              moq,
              orderUnits: poUnits,
              cogsPerUnit,
              totalCost: poUnits * cogsPerUnit,
              deposit50: poUnits * cogsPerUnit * 0.5,
              final50: poUnits * cogsPerUnit * 0.5,
              targetMonthId: firstM.id,
              targetMonthLabel: firstM.label,
              orderDate: dates.orderDate,
              deliveryDate: dates.deliveryDate,
              leadTimeDays,
              status: batchIdx === 1 ? 'critical' : 'planned',
            });
          }

          qMonths.forEach((qm, qmIdx) => {
            const mDemand = matrixRow?.months[qm.id]?.totalProduction || 0;
            const isFirst = qmIdx === 0;
            const monthPo = isFirst ? poUnits : 0;
            inventory -= mDemand;

            monthlyAllocations[qm.id] = {
              poUnits: monthPo,
              poCost: monthPo * cogsPerUnit,
              endingInventory: inventory,
              batchCode: isFirst ? batchCode : undefined,
              orderDateStr: isFirst ? orderDateStr : undefined,
              depositAmount: monthPo > 0 ? monthPo * cogsPerUnit * 0.5 : 0,
              finalAmount: monthPo > 0 ? monthPo * cogsPerUnit * 0.5 : 0,
            };
          });
        }
      } else {
        // Strategy 3: Bulk Single Order for entire period
        const totalReq = Math.max(moq, Math.ceil(totalDemand / moq) * moq);
        const firstM = months[0];
        const dates = firstM ? calculatePoDates(firstM.dateStr, leadTimeDays) : { deliveryDate: '', orderDate: '' };
        const batchCode = `PO-${sku.skuCode}-BULK`;

        batches.push({
          batchCode,
          batchNumber: 1,
          skuId: sku.id,
          skuCode: sku.skuCode,
          skuName: sku.name,
          factoryName,
          moq,
          orderUnits: totalReq,
          cogsPerUnit,
          totalCost: totalReq * cogsPerUnit,
          deposit50: totalReq * cogsPerUnit * 0.5,
          final50: totalReq * cogsPerUnit * 0.5,
          targetMonthId: firstM?.id || '',
          targetMonthLabel: firstM?.label || '',
          orderDate: dates.orderDate,
          deliveryDate: dates.deliveryDate,
          leadTimeDays,
          status: 'critical',
        });

        let inventory = totalReq;
        months.forEach((m, idx) => {
          const mDemand = matrixRow?.months[m.id]?.totalProduction || 0;
          const monthPo = idx === 0 ? totalReq : 0;
          inventory -= mDemand;

          monthlyAllocations[m.id] = {
            poUnits: monthPo,
            poCost: monthPo * cogsPerUnit,
            endingInventory: inventory,
            batchCode: idx === 0 ? batchCode : undefined,
            orderDateStr: idx === 0 ? dates.orderDate : undefined,
            depositAmount: monthPo > 0 ? monthPo * cogsPerUnit * 0.5 : 0,
            finalAmount: monthPo > 0 ? monthPo * cogsPerUnit * 0.5 : 0,
          };
        });
      }

      const totalPoUnits = batches.reduce((s, b) => s + b.orderUnits, 0);
      const totalPoCost = batches.reduce((s, b) => s + b.totalCost, 0);
      const endingStock = totalPoUnits - totalDemand;

      return {
        sku,
        factoryName,
        moq,
        cogsPerUnit,
        leadTimeDays,
        totalDemand,
        totalPoUnits,
        totalPoCost,
        endingStock,
        batches,
        monthlyAllocations,
      };
    });
  }, [productionSkus, months, singleSkuProductionMatrix, sheet3CogsMap, quotations, parameters.supplyChain.productionLeadTimeDays, strategy]);

  // Overall totals across all SKUs
  const overallSummary = useMemo(() => {
    let totalUnits = 0;
    let totalCost = 0;
    let totalBatchesCount = 0;
    const allBatches: PoOrderItem[] = [];

    const monthlyTotals: Record<string, { poUnits: number; poCost: number; depositAmount: number; finalAmount: number }> = {};
    months.forEach((m) => {
      monthlyTotals[m.id] = { poUnits: 0, poCost: 0, depositAmount: 0, finalAmount: 0 };
    });

    skuPoPlans.forEach((plan) => {
      totalUnits += plan.totalPoUnits;
      totalCost += plan.totalPoCost;
      totalBatchesCount += plan.batches.length;
      allBatches.push(...plan.batches);

      months.forEach((m) => {
        const alloc = plan.monthlyAllocations[m.id];
        if (alloc) {
          monthlyTotals[m.id].poUnits += alloc.poUnits;
          monthlyTotals[m.id].poCost += alloc.poCost;
          monthlyTotals[m.id].depositAmount += alloc.depositAmount || 0;
          monthlyTotals[m.id].finalAmount += alloc.finalAmount || 0;
        }
      });
    });

    // Sort batches by delivery / order date
    allBatches.sort((a, b) => a.batchCode.localeCompare(b.batchCode));

    const minLeadTime = skuPoPlans.length > 0 ? Math.min(...skuPoPlans.map((p) => p.leadTimeDays)) : 45;
    const maxLeadTime = skuPoPlans.length > 0 ? Math.max(...skuPoPlans.map((p) => p.leadTimeDays)) : 45;

    return {
      totalUnits,
      totalCost,
      totalDeposit: totalCost * 0.5,
      totalFinal: totalCost * 0.5,
      totalBatchesCount,
      allBatches,
      monthlyTotals,
      minLeadTime,
      maxLeadTime,
    };
  }, [skuPoPlans, months]);

  return (
    <div className="rounded-xl bg-white border border-indigo-200/80 shadow-xs overflow-hidden mt-6">
      {/* Table Header Banner */}
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-white border-b border-indigo-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
              PO
            </span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-wide font-['Space_Grotesk'] uppercase flex items-center gap-2">
              KẾ HOẠCH PO ĐỀ XUẤT ĐẶT HÀNG (PRODUCTION ORDER PLAN)
            </h3>
            <span className="text-[11px] text-indigo-700 bg-indigo-100/80 border border-indigo-200 px-2 py-0.5 rounded-md font-medium">
              Dựa trên Tổng Lượng SX • Phương Án Báo Giá Chốt • Lead-Time
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Tự động tính toán các đợt phát lệnh PO, số lượng đặt (≥ MOQ), ngày đặt hàng theo Lead-time và dòng tiền thanh toán (50% cọc • 50% nghiệm thu)
          </p>
        </div>

        {/* Strategy and View Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Strategy Selector */}
          <div className="flex items-center rounded-lg bg-slate-100 p-1 text-[11px] font-medium border border-slate-200">
            <span className="text-slate-500 px-2 select-none flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-600" />
              Chiến Lược:
            </span>
            <button
              onClick={() => setStrategy('jit-moq')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                strategy === 'jit-moq'
                  ? 'bg-white text-indigo-900 font-bold shadow-2xs border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tối ưu theo mốc MOQ đã chốt & đặt gối đầu khi kho sắp hết"
            >
              🎯 Theo MOQ &amp; Gối Đầu
            </button>
            <button
              onClick={() => setStrategy('quarterly')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                strategy === 'quarterly'
                  ? 'bg-white text-indigo-900 font-bold shadow-2xs border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Gộp nhu cầu 3 tháng một đợt PO để giảm số lần vận chuyển"
            >
              📦 Theo Quý (3T/Đợt)
            </button>
            <button
              onClick={() => setStrategy('bulk')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                strategy === 'bulk'
                  ? 'bg-white text-indigo-900 font-bold shadow-2xs border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Đặt toàn bộ số lượng cả kỳ làm tròn theo MOQ trong 1 đợt duy nhất"
            >
              ⚡ Trọn Gói Toàn Kỳ
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-slate-100 p-1 text-[11px] font-medium border border-slate-200">
            <button
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đầy Đủ
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ma Trận Tháng
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Danh Sách Lệnh PO
            </button>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Highlight Cards */}
      <div className="p-4 bg-slate-50/60 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Tổng Giá Trị PO</span>
            <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-base font-bold font-mono text-indigo-950">
            {overallSummary.totalCost.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Tổng ngân sách đặt hàng
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Tổng Sản Lượng Đặt</span>
            <Package className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-base font-bold font-mono text-slate-900">
            {overallSummary.totalUnits.toLocaleString('vi-VN')} sp
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Đã làm tròn theo MOQ
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Tiền Cọc 50% Khi Ký PO</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-base font-bold font-mono text-amber-700">
            {overallSummary.totalDeposit.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[10px] text-amber-600/80 font-mono mt-0.5">
            Giải ngân khi duyệt lệnh
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Số Đợt Lệnh PO</span>
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-800">
            {overallSummary.totalBatchesCount} Lệnh PO
          </div>
          <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
            Chia theo các chu kỳ
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Lead-Time Sản Xuất</span>
            <Clock className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-base font-bold font-mono text-slate-800">
            {overallSummary.minLeadTime === overallSummary.maxLeadTime
              ? `${overallSummary.minLeadTime} ngày`
              : `${overallSummary.minLeadTime} - ${overallSummary.maxLeadTime} ngày`}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Thời gian đặt trước ngày bán
          </div>
        </div>
      </div>

      {/* PART 1: MA TRẬN KẾ HOẠCH PO THEO THÁNG (TIMELINE MATRIX) */}
      {(viewMode === 'all' || viewMode === 'matrix') && (
        <div className="border-b border-slate-200">
          <div className="px-4 py-2.5 bg-indigo-50/40 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-indigo-700" />
              <span className="font-bold text-xs text-indigo-950 uppercase tracking-wider">
                1. Ma Trận Đặt Hàng PO &amp; Lịch Hàng Về Theo Tháng
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Hiển thị số lượng đặt (sp) • Ngày phát lệnh PO • Tồn kho gối đầu
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  {/* Cột 1: Mã SKU */}
                  <th className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                    Mã SKU
                  </th>

                  {/* Cột 2: Tên Sản Phẩm & Thông số đã chốt */}
                  <th className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0]">
                    Sản Phẩm &amp; Phương Án Chốt
                  </th>

                  {/* Cột 3: Cột Tổng Lượng Đặt PO Toàn Kỳ */}
                  <th className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-30 bg-indigo-50 text-indigo-900 border-x border-indigo-200 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap text-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">Tổng Đặt PO Toàn Kỳ</span>
                      <span className="text-[10px] text-indigo-700 font-normal">(Sản lượng &amp; Giá vốn)</span>
                    </div>
                  </th>

                  {/* Cột 4+: Các tháng kế hoạch */}
                  {months.map((m) => (
                    <th
                      key={m.id}
                      className="py-3 px-3 min-w-[130px] text-center border-r border-slate-200 whitespace-nowrap bg-slate-50"
                    >
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        {m.label}
                      </span>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5 font-mono">
                        {m.dateStr}
                      </div>
                    </th>
                  ))}

                  {/* Cột Cuối: Trạng Thái */}
                  <th className="py-3 px-4 min-w-[110px] text-center bg-slate-50 whitespace-nowrap">
                    <span className="text-[10px] text-slate-500 font-medium">Tồn Kho Gối Đầu</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {skuPoPlans.map((plan) => {
                  return (
                    <tr key={plan.sku.id} className="hover:bg-indigo-50/20 transition-colors">
                      {/* Cột 1: Mã SKU */}
                      <td className="py-2.5 px-3.5 w-[110px] min-w-[110px] max-w-[110px] font-mono font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900">
                          {plan.sku.skuCode}
                        </span>
                      </td>

                      {/* Cột 2: Tên Sản Phẩm & Xưởng Chốt */}
                      <td className="py-2.5 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                        <div className="font-semibold text-slate-900 truncate" title={plan.sku.name}>
                          {plan.sku.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate" title={plan.factoryName}>
                          <Factory className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="truncate">{plan.factoryName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>MOQ: <strong className="text-slate-800">{plan.moq.toLocaleString('vi-VN')}</strong> sp</span>
                          <span>•</span>
                          <span>Lead-time: <strong className="text-indigo-700">{plan.leadTimeDays}</strong> ngày</span>
                        </div>
                      </td>

                      {/* Cột 3: Tổng Đặt PO Toàn Kỳ */}
                      <td className="py-2.5 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-10 bg-indigo-50/90 border-x border-indigo-200 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] whitespace-nowrap text-center">
                        <div className="font-mono font-bold text-indigo-950 text-xs">
                          {plan.totalPoUnits.toLocaleString('vi-VN')} sp
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                          {plan.totalPoCost.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[9px] text-indigo-700 font-medium mt-0.5">
                          {plan.batches.length} đợt phát lệnh PO
                        </div>
                      </td>

                      {/* Cột 4+: Các tháng */}
                      {months.map((m) => {
                        const alloc = plan.monthlyAllocations[m.id];
                        const poUnits = alloc?.poUnits || 0;
                        const poCost = alloc?.poCost || 0;
                        const endingStock = alloc?.endingInventory || 0;

                        return (
                          <td key={m.id} className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                            {poUnits > 0 ? (
                              <div className="p-1 rounded-lg bg-indigo-50 border border-indigo-200">
                                <div className="font-bold text-indigo-900 font-mono text-xs flex items-center justify-center gap-1">
                                  <span>{poUnits.toLocaleString('vi-VN')}</span>
                                  <span className="text-[9px] text-indigo-600 font-normal">sp</span>
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono">
                                  {poCost.toLocaleString('vi-VN')} đ
                                </div>
                                <div className="text-[9px] text-amber-700 font-medium mt-0.5 flex items-center justify-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>Đặt trước: {alloc.orderDateStr}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="text-slate-300 font-mono text-xs">-</span>
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  Tồn: {endingStock.toLocaleString('vi-VN')}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Cột Cuối: Tồn kho gối đầu cuối kỳ */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                          plan.endingStock >= 0 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          +{plan.endingStock.toLocaleString('vi-VN')} sp
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* FOOTER MA TRẬN: TỔNG HỢP THEO THÁNG */}
              <tfoot>
                {/* DÒNG 1: TỔNG SẢN LƯỢNG PO VỀ KHO */}
                <tr className="bg-indigo-100/70 border-t-2 border-indigo-300 font-bold text-xs text-indigo-950">
                  <td className="py-3 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-indigo-100 z-20 shadow-[1px_0_0_0_#cbd5e1] whitespace-nowrap">
                    TỔNG LƯỢNG ĐẶT PO
                  </td>
                  <td className="py-3 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-indigo-100 z-20 shadow-[1px_0_0_0_#cbd5e1] text-[11px] text-indigo-800 font-mono">
                    Lô hàng nhập kho trong tháng
                  </td>
                  <td className="py-3 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-indigo-200 border-x border-indigo-300 font-mono font-bold text-indigo-950 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs text-center whitespace-nowrap">
                    {overallSummary.totalUnits.toLocaleString('vi-VN')} sp
                  </td>
                  {months.map((m) => {
                    const mUnits = overallSummary.monthlyTotals[m.id]?.poUnits || 0;
                    return (
                      <td key={m.id} className="py-3 px-3 text-center font-mono font-bold text-indigo-900 border-r border-slate-200 whitespace-nowrap bg-indigo-50/70">
                        {mUnits > 0 ? `${mUnits.toLocaleString('vi-VN')} sp` : '-'}
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-center whitespace-nowrap text-[10px] text-indigo-800 font-mono">
                    Toàn bộ PO
                  </td>
                </tr>

                {/* DÒNG 2: TỔNG GIÁ TRỊ PO (COGS) */}
                <tr className="bg-slate-50 border-t border-slate-200 text-xs text-slate-800 font-semibold">
                  <td className="py-2.5 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-slate-100 z-20 shadow-[1px_0_0_0_#cbd5e1] whitespace-nowrap">
                    TỔNG GIÁ TRỊ PO
                  </td>
                  <td className="py-2.5 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-slate-100 z-20 shadow-[1px_0_0_0_#cbd5e1] text-[11px] text-slate-500 font-mono">
                    Giá vốn cam kết hợp đồng
                  </td>
                  <td className="py-2.5 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-slate-200 border-x border-slate-300 font-mono font-bold text-slate-900 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs text-center whitespace-nowrap">
                    {overallSummary.totalCost.toLocaleString('vi-VN')} đ
                  </td>
                  {months.map((m) => {
                    const mCost = overallSummary.monthlyTotals[m.id]?.poCost || 0;
                    return (
                      <td key={m.id} className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                        {mCost > 0 ? `${mCost.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-4 text-center whitespace-nowrap text-[10px] text-slate-500 font-mono">
                    Tổng vốn PO
                  </td>
                </tr>

                {/* DÒNG 3: DÒNG TIỀN CỌC 50% */}
                <tr className="bg-amber-50/50 border-t border-amber-200 text-xs text-amber-900 font-medium">
                  <td className="py-2 px-3.5 w-[110px] min-w-[110px] max-w-[110px] sticky left-0 bg-amber-100/80 z-20 shadow-[1px_0_0_0_#cbd5e1] whitespace-nowrap">
                    CỌC 50% KÝ PO
                  </td>
                  <td className="py-2 px-3.5 w-[250px] min-w-[250px] max-w-[250px] sticky left-[110px] bg-amber-100/80 z-20 shadow-[1px_0_0_0_#cbd5e1] text-[10px] text-amber-800 font-mono">
                    Giải ngân trước Lead-time
                  </td>
                  <td className="py-2 px-3.5 w-[160px] min-w-[160px] max-w-[160px] sticky left-[360px] z-20 bg-amber-100 border-x border-amber-300 font-mono font-bold text-amber-800 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] text-xs text-center whitespace-nowrap">
                    {overallSummary.totalDeposit.toLocaleString('vi-VN')} đ
                  </td>
                  {months.map((m) => {
                    const mDep = overallSummary.monthlyTotals[m.id]?.depositAmount || 0;
                    return (
                      <td key={m.id} className="py-2 px-3 text-center font-mono text-amber-800 border-r border-slate-200 whitespace-nowrap">
                        {mDep > 0 ? `${mDep.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                    );
                  })}
                  <td className="py-2 px-4 text-center whitespace-nowrap text-[10px] text-amber-700 font-mono">
                    50% cọc PO
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* PART 2: DANH SÁCH CHI TIẾT CÁC LỆNH ĐẶT HÀNG PO ĐỀ XUẤT (PO SCHEDULE LOG) */}
      {(viewMode === 'all' || viewMode === 'list') && (
        <div>
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-700" />
              <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                2. Danh Sách Các Lệnh Đặt Hàng PO Đề Xuất Chi Tiết
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Tổng cộng {overallSummary.allBatches.length} lệnh đặt hàng được đề xuất
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Mã Lệnh PO</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Sản Phẩm (SKU)</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Nhà Máy Sản Xuất</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">MOQ</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Số Lượng Đặt</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Đơn Giá Vốn</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Tổng Giá Trị PO</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap bg-amber-50/50 text-amber-900">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>Ngày Phát Lệnh PO</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Lead-time</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap bg-indigo-50/50 text-indigo-900">
                    <div className="flex items-center justify-center gap-1">
                      <Truck className="w-3 h-3 text-indigo-700" />
                      <span>Ngày Hàng Về Kho</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Tháng Bán Hàng</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Cọc 50% Ký PO</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Khuyến Nghị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {overallSummary.allBatches.map((batch) => {
                  return (
                    <tr key={batch.batchCode} className="hover:bg-indigo-50/20 transition-colors">
                      {/* Mã Lệnh PO */}
                      <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-950 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px]">
                          {batch.batchCode}
                        </span>
                      </td>

                      {/* Sản Phẩm */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{batch.skuName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{batch.skuCode}</div>
                      </td>

                      {/* Nhà Máy */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="text-slate-800 font-medium text-[11px] truncate max-w-[220px]" title={batch.factoryName}>
                          {batch.factoryName}
                        </div>
                      </td>

                      {/* MOQ */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                        {batch.moq.toLocaleString('vi-VN')}
                      </td>

                      {/* Số Lượng Đặt */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-900 whitespace-nowrap">
                        {batch.orderUnits.toLocaleString('vi-VN')} <span className="text-[10px] text-slate-400 font-normal">sp</span>
                      </td>

                      {/* Đơn Giá Vốn */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        {batch.cogsPerUnit.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Tổng Giá Trị PO */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {batch.totalCost.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Ngày Phát Lệnh PO */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700 bg-amber-50/40 whitespace-nowrap">
                        {batch.orderDate}
                      </td>

                      {/* Lead-time */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                        {batch.leadTimeDays} ngày
                      </td>

                      {/* Ngày Hàng Về Kho */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-900 bg-indigo-50/40 whitespace-nowrap">
                        {batch.deliveryDate}
                      </td>

                      {/* Phục vụ tháng */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">
                          {batch.targetMonthLabel}
                        </span>
                      </td>

                      {/* Cọc 50% */}
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-semibold whitespace-nowrap">
                        {batch.deposit50.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Trạng Thái & Khuyến Nghị */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {batch.status === 'critical' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-semibold flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Đợt 1 • Đặt Ngay
                          </span>
                        ) : batch.status === 'upcoming' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Đợt 2 • Kế Tiếp
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-slate-500" />
                            Theo Kế Hoạch
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                  <td className="py-3 px-3.5" colSpan={4}>
                    TỔNG CỘNG TOÀN BỘ CÁC LỆNH ĐẶT HÀNG PO
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-900">
                    {overallSummary.totalUnits.toLocaleString('vi-VN')} sp
                  </td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 text-right font-mono text-slate-900 text-sm">
                    {overallSummary.totalCost.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-3" colSpan={4}></td>
                  <td className="py-3 px-3 text-right font-mono text-amber-800 text-sm">
                    {overallSummary.totalDeposit.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-3.5 text-center text-[10px] text-slate-500 font-mono">
                    100% PO Plans
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Practical CFO & Supply Chain Strategy Notes */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-t border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Quy Tắc Quản Trị Chuỗi Cung Ứng &amp; Kế Hoạch Đặt Hàng PO:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
            <strong className="text-slate-900 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              1. Quy tắc Lead-time &amp; Ngày Phát Lệnh PO:
            </strong>
            <p>
              Ngày phát lệnh PO được lùi lại trước ngày cần hàng đúng <strong>{overallSummary.minLeadTime} ngày</strong>. Ví dụ: Để hàng có tại kho sẵn sàng bán từ ngày 01/01/2026, lệnh PO Đợt 1 phải được ký và chuyển cọc trước ngày 17/11/2025.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
            <strong className="text-slate-900 flex items-center gap-1">
              <Package className="w-3 h-3 text-indigo-600" />
              2. Tuân Thủ MOQ &amp; Tồn Kho Gối Đầu:
            </strong>
            <p>
              Mỗi lệnh PO đề xuất luôn đảm bảo đạt tối thiểu mốc <strong>MOQ đã chốt</strong> tại Tab 3 (Sheet 3). Phần sản lượng dôi dư sẽ tự động chuyển thành tồn kho gối đầu phục vụ các tháng bán tiếp theo.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
            <strong className="text-slate-900 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-emerald-600" />
              3. Kế Hoạch Dòng Tiền Thanh Toán:
            </strong>
            <p>
              Mô hình áp dụng tiêu chuẩn thanh toán mỹ phẩm OEM: <strong>50% đặt cọc</strong> ngay khi phát hành PO và <strong>50% tất toán</strong> khi nghiệm thu bàn giao hàng tại kho, giúp tối ưu vốn lưu động.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
