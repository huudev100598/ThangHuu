import React from 'react';
import { TabDefinition, TabId } from '../types/financial';
import { 
  Sliders, 
  PackageSearch, 
  Factory,
  TrendingUp, 
  Users,
  PieChart, 
  Wallet, 
  LineChart, 
  Lock,
  FileSpreadsheet
} from 'lucide-react';

interface TabNavigationProps {
  tabs: TabDefinition[];
  activeTab: TabId;
  onSelectTab: (tabId: TabId) => void;
}

const TAB_ICONS: Record<TabId, React.ElementType> = {
  'tab-parameters': Sliders,
  'tab-sku-bom': PackageSearch,
  'tab-cogs-sheet3': Factory,
  'tab-sales-forecast': TrendingUp,
  'tab-hr-operations': Users,
  'tab-reports': FileSpreadsheet,
  'tab-pnl': PieChart,
  'tab-cashflow': Wallet,
  'tab-bep-insights': LineChart,
};

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav className="bg-white/95 border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-2 sticky top-[57px] z-20 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1 sm:space-x-2 min-w-max">
          {tabs.map((tab, idx) => {
            const Icon = TAB_ICONS[tab.id] || FileSpreadsheet;
            const isActive = tab.id === activeTab;
            const isFirst = idx === 0;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                title={tab.shortDesc}
                className={`group relative flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs font-semibold ring-1 ring-emerald-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.status === 'upcoming' && (
                  <span className="text-[10px] text-slate-400 flex items-center">
                    <Lock className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
