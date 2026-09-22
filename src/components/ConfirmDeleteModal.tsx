import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemSubtext?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  itemSubtext,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                {title}
              </h3>
              <p className="text-xs text-slate-500">
                Thao tác này sẽ xóa mục khỏi hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            Bạn có chắc chắn muốn xóa:
          </p>
          <p className="text-sm font-bold text-rose-600 mt-1 font-mono">
            {itemName}
          </p>
          {itemSubtext && (
            <p className="text-[11px] text-slate-500 mt-1">
              {itemSubtext}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xác Nhận Xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
