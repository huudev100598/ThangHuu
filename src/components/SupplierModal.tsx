import React, { useState, useEffect } from 'react';
import { Supplier } from '../types/sku';
import { X, Factory, MapPin, User, Phone, Mail, FileText, Check, AlertCircle } from 'lucide-react';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierData: Omit<Supplier, 'id'>, editId?: string) => void;
  supplierToEdit?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  supplierToEdit,
}) => {
  const [factoryName, setFactoryName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (supplierToEdit) {
      setFactoryName(supplierToEdit.factoryName || '');
      setAddress(supplierToEdit.address || '');
      setContactPerson(supplierToEdit.contactPerson || '');
      setPhone(supplierToEdit.phone || '');
      setEmail(supplierToEdit.email || '');
      setNotes(supplierToEdit.notes || '');
    } else {
      setFactoryName('');
      setAddress('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setNotes('');
    }
    setErrors({});
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!factoryName.trim()) {
      newErrors.factoryName = 'Vui lòng nhập tên nhà máy sản xuất';
    }
    if (!address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ nhà máy';
    }
    if (!contactPerson.trim()) {
      newErrors.contactPerson = 'Vui lòng nhập nhân viên phụ trách';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại liên hệ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(
      {
        factoryName: factoryName.trim(),
        address: address.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      },
      supplierToEdit ? supplierToEdit.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                {supplierToEdit ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp / Nhà Máy Mới'}
              </h2>
              <p className="text-xs text-slate-500">
                Nhập thông tin xưởng sản xuất, địa chỉ và đầu mối liên hệ cho Sheet 3
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

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          {/* Tên nhà máy */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-emerald-700" />
              Tên Nhà Máy Sản Xuất <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Nhà máy Dược Mỹ Phẩm BioCos Tech (KCN Hiệp Phước)"
              value={factoryName}
              onChange={(e) => {
                setFactoryName(e.target.value);
                if (errors.factoryName) setErrors((prev) => ({ ...prev, factoryName: '' }));
              }}
              className={`w-full rounded-lg bg-white border px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                errors.factoryName
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600'
              }`}
            />
            {errors.factoryName && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.factoryName}
              </p>
            )}
          </div>

          {/* Địa chỉ sản xuất */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              Địa Chỉ Sản Xuất <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Lô B2, Đường số 3, KCN Hiệp Phước, Huyện Nhà Bè, TP. HCM"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
              }}
              className={`w-full rounded-lg bg-white border px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                errors.address
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600'
              }`}
            />
            {errors.address && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.address}
              </p>
            )}
          </div>

          {/* Nhân viên phụ trách & Số điện thoại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                Nhân Viên Phụ Trách <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Trần Hoàng Nam (GĐ Kỹ thuật OEM)"
                value={contactPerson}
                onChange={(e) => {
                  setContactPerson(e.target.value);
                  if (errors.contactPerson) setErrors((prev) => ({ ...prev, contactPerson: '' }));
                }}
                className={`w-full rounded-lg bg-white border px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                  errors.contactPerson
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600'
                }`}
              />
              {errors.contactPerson && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.contactPerson}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                Số Điện Thoại <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: 0908 345 678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                className={`w-full rounded-lg bg-white border px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-1 ${
                  errors.phone
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600'
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          {/* Email liên hệ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Liên Hệ (Tùy chọn)
            </label>
            <input
              type="email"
              placeholder="VD: contact@oem-factory.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Ghi chú năng lực sản xuất */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Ghi Chú Năng Lực & Tiêu Chuẩn (cGMP, ISO, FDA...)
            </label>
            <textarea
              rows={2}
              placeholder="VD: Nhà máy đạt cGMP ASEAN, chuyên gia công dòng dung dịch serum vùng nách..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{supplierToEdit ? 'Lưu Thay Đổi' : 'Thêm Nhà Cung Cấp'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
