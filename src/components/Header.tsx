import React, { useRef } from 'react';
import { 
  Download, 
  Upload, 
  CheckCircle2
} from 'lucide-react';
import { ProjectParameters } from '../types/financial';
import { MoshModeLogo } from './MoshModeLogo';

interface HeaderProps {
  parameters: ProjectParameters;
  onImport: (imported: ProjectParameters) => void;
  isSaved: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  parameters,
  onImport,
  isSaved,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(parameters, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MoshMode_Financial_Parameters_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.taxAndCapital && parsed.platformFees) {
          onImport(parsed);
        } else {
          alert('Tệp JSON không đúng cấu trúc tham số tài chính của Mosh&Mode.');
        }
      } catch (err) {
        alert('Không thể đọc file JSON. Vui lòng kiểm tra lại.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Left: Brand Identity with Mosh & Mode Logo */}
        <div className="flex items-center space-x-3.5">
          <div className="py-0.5">
            <MoshModeLogo className="h-9 sm:h-10 w-auto transition-transform hover:scale-[1.02]" />
          </div>
          <div className="border-l border-slate-200 pl-3">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Underarm Care Cosmeceuticals
              </span>
              <span className="hidden lg:inline-flex items-center text-xs text-slate-500">
                • CFO Financial Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
              <span>Mô hình Quản trị Tài chính &amp; Unit Economics Đa kênh</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-medium">Bản quyền 2026</span>
            </p>
          </div>
        </div>

        {/* Right: Actions & State */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Autosave status */}
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-xs text-slate-700">
            {isSaved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] text-slate-600 font-medium">Đã lưu tự động</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px] text-amber-700 font-medium">Đang cập nhật...</span>
              </>
            )}
          </div>

          {/* Import hidden input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Nạp tệp cấu hình tham số JSON"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Nạp JSON</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Xuất file JSON lưu trữ"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất JSON</span>
          </button>
        </div>

      </div>
    </header>
  );
};
