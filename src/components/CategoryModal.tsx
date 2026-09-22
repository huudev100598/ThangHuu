import React, { useState } from 'react';
import { ProductCategory, ProductSku } from '../types/sku';
import { X, Plus, Trash2, FolderTree, AlertCircle, Package } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  skus: ProductSku[];
  onAddCategory: (cat: ProductCategory) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  skus,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ Mã Nhóm và Tên Danh Mục.');
      return;
    }

    setErrorMessage('');
    const newCat: ProductCategory = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
    };

    onAddCategory(newCat);
    setName('');
    setCode('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                Quản Lý Danh Mục Sản Phẩm Mosh&amp;Mode
              </h3>
              <p className="text-xs text-slate-500">
                Thêm mới hoặc loại bỏ các nhóm dòng sản phẩm
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

        <div className="p-6 space-y-6">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Thêm Danh Mục Mới</span>
            
            {errorMessage && (
              <div className="flex items-center space-x-1.5 p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1">Mã Nhóm (Code)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Ví dụ: LOTION"
                  className="w-full rounded bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 uppercase font-mono focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1">Tên Danh Mục</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Ví dụ: Sữa Dưỡng Sáng Nách"
                  className="w-full rounded bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 block mb-1">Mô tả ngắn</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Đặc điểm dòng sản phẩm..."
                className="w-full rounded bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Danh Mục Này</span>
            </button>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Danh Sách Danh Mục Hiện Có ({categories.length})
            </span>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {categories.map((cat) => {
                const isComboCategory = cat.id === 'cat-combo' || cat.code === 'COMBO';
                const isConfirming = confirmDeleteId === cat.id;
                const linkedSkus = skus.filter((s) => 
                  s.categoryId === cat.id || (isComboCategory && s.type === 'combo')
                );
                const hasLinkedSkus = linkedSkus.length > 0;

                return (
                  <div
                    key={cat.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isConfirming 
                        ? 'bg-rose-50 border-rose-200' 
                        : isComboCategory
                        ? 'bg-purple-50/50 border-purple-200 hover:border-purple-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                      <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-mono text-[11px] font-bold shrink-0">
                        {cat.code}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-slate-900 truncate">{cat.name}</span>
                          {isComboCategory && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-medium border border-purple-200">
                              Hệ thống
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 ${
                              hasLinkedSkus
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                            title={
                              hasLinkedSkus
                                ? `Có ${linkedSkus.length} sản phẩm đang thuộc danh mục này`
                                : 'Chưa có sản phẩm nào thuộc danh mục này'
                            }
                          >
                            <Package className="w-2.5 h-2.5" />
                            <span>{linkedSkus.length} SKU</span>
                          </span>
                        </div>
                        {cat.description && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{cat.description}</div>
                        )}
                      </div>
                    </div>

                    {isComboCategory ? (
                      <span 
                        className="text-[11px] text-purple-700 font-medium px-2 py-1 rounded bg-purple-50 border border-purple-200"
                        title="Danh mục Combo mặc định của hệ thống"
                      >
                        Cố định
                      </span>
                    ) : isConfirming ? (
                      <div className="flex items-center space-x-1.5 shrink-0 animate-in fade-in duration-150">
                        <span className="text-[11px] text-rose-700 font-medium">Xác nhận xóa?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCategory(cat.id);
                            setConfirmDeleteId(null);
                            setErrorMessage('');
                          }}
                          className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] cursor-pointer transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (hasLinkedSkus) {
                            setErrorMessage(
                              `Không thể xóa danh mục "${cat.name}" vì vẫn còn ${linkedSkus.length} sản phẩm đang được gắn vào danh mục này (${linkedSkus.map((s) => s.skuCode).slice(0, 3).join(', ')}${linkedSkus.length > 3 ? '...' : ''}). Bạn cần xóa hoặc chuyển các sản phẩm này sang danh mục khác trước.`
                            );
                            setConfirmDeleteId(null);
                            return;
                          }
                          if (categories.length <= 1) {
                            setErrorMessage('Hệ thống cần duy trì ít nhất 1 danh mục sản phẩm.');
                            return;
                          }
                          setErrorMessage('');
                          setConfirmDeleteId(cat.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          hasLinkedSkus
                            ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            : categories.length <= 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={
                          hasLinkedSkus
                            ? `Đang có ${linkedSkus.length} sản phẩm gắn vào. Không thể xóa.`
                            : categories.length <= 1
                            ? 'Không thể xóa danh mục duy nhất còn lại'
                            : 'Xóa danh mục trống này'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
