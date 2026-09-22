import React, { useState } from 'react';
import { Supplier } from '../types/sku';
import { 
  X, 
  Plus, 
  Factory, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Edit3, 
  Trash2, 
  Search,
  Building2,
  CheckCircle2
} from 'lucide-react';

interface SupplierDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onAddSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

export const SupplierDirectoryModal: React.FC<SupplierDirectoryModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.factoryName.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                  Danh Bạ Nhà Cung Cấp &amp; Nhà Máy Gia Công
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {suppliers.length} nhà máy
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Khai báo nhà máy, địa chỉ sản xuất, nhân viên phụ trách và số điện thoại liên hệ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search + Add */}
        <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên nhà máy, nhân viên, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <button
            onClick={onAddSupplier}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center space-x-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm Nhà Máy Mới</span>
          </button>
        </div>

        {/* List of suppliers */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[250px]">
          {filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
              <Factory className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium">Không tìm thấy nhà cung cấp nào phù hợp</p>
              <button
                onClick={onAddSupplier}
                className="mt-3 text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
              >
                + Bấm vào đây để thêm nhà máy mới
              </button>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-emerald-700 mt-0.5 shrink-0">
                      <Factory className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {supplier.factoryName}
                      </h3>
                      <div className="flex items-center text-xs text-slate-500 mt-1 space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="text-slate-600">{supplier.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => onEditSupplier(supplier)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      title="Chỉnh sửa nhà máy"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(supplier.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      title="Xóa nhà máy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">Phụ trách:</span>
                    <span className="font-medium text-slate-800">{supplier.contactPerson}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-slate-500">Hotline:</span>
                    <a
                      href={`tel:${supplier.phone}`}
                      className="font-mono text-emerald-700 font-semibold hover:underline"
                    >
                      {supplier.phone}
                    </a>
                  </div>

                  {supplier.email && (
                    <div className="flex items-center space-x-2 text-slate-600 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">Email:</span>
                      <span className="truncate text-slate-700">{supplier.email}</span>
                    </div>
                  )}
                </div>

                {supplier.notes && (
                  <div className="text-[11px] text-slate-600 bg-white rounded-md px-2.5 py-1.5 border border-slate-200 flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{supplier.notes}</span>
                  </div>
                )}

                {/* Confirm Delete prompt */}
                {deletingId === supplier.id && (
                  <div className="p-3 mt-2 rounded-lg bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span className="text-xs font-medium text-rose-800">
                      Bạn có chắc muốn xóa nhà máy này khỏi danh bạ?
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2.5 py-1 rounded text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => {
                          onDeleteSupplier(supplier.id);
                          setDeletingId(null);
                        }}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                      >
                        Xác Nhận Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0 text-xs text-slate-500">
          <span>
            Dữ liệu nhà cung cấp dùng chung cho tất cả các báo giá sản phẩm tại Sheet 3
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
