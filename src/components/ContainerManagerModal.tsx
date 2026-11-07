import React, { useState } from 'react';
import {
  X,
  Container,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import { ContainerDef } from '../types/logistics';
import { calculateCbm, resetContainersToDefault } from '../utils/containerStorage';

interface ContainerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  containers: ContainerDef[];
  activeContainerId: string;
  onSelectContainer: (container: ContainerDef) => void;
  onSaveContainer: (container: Omit<ContainerDef, 'id' | 'type'> & { id?: string }) => void;
  onDeleteContainer: (id: string) => void;
  onResetDefaults: () => void;
}

export const ContainerManagerModal: React.FC<ContainerManagerModalProps> = ({
  isOpen,
  onClose,
  containers,
  activeContainerId,
  onSelectContainer,
  onSaveContainer,
  onDeleteContainer,
  onResetDefaults
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [innerLengthMm, setInnerLengthMm] = useState(5898);
  const [innerWidthMm, setInnerWidthMm] = useState(2352);
  const [innerHeightMm, setInnerHeightMm] = useState(2393);
  const [doorWidthMm, setDoorWidthMm] = useState(2340);
  const [doorHeightMm, setDoorHeightMm] = useState(2280);
  const [maxPayloadKg, setMaxPayloadKg] = useState(21800);
  const [tareWeightKg, setTareWeightKg] = useState(2200);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  // Auto calculate CBM in real-time
  const computedCbm = calculateCbm(innerLengthMm, innerWidthMm, innerHeightMm);

  const handleStartCreate = () => {
    setIsEditing(true);
    setEditingId(null);
    setName('Container Tùy Chỉnh Mới');
    setCode('CUSTOM-' + Math.floor(100 + Math.random() * 900));
    setInnerLengthMm(5898);
    setInnerWidthMm(2352);
    setInnerHeightMm(2393);
    setDoorWidthMm(2340);
    setDoorHeightMm(2280);
    setMaxPayloadKg(22000);
    setTareWeightKg(2200);
    setDescription('Container do người dùng thiết kế và lưu vào hệ thống');
    setFormError('');
  };

  const handleStartEdit = (cont: ContainerDef) => {
    setIsEditing(true);
    setEditingId(cont.id);
    setName(cont.name);
    setCode(cont.code);
    setInnerLengthMm(cont.innerLengthMm);
    setInnerWidthMm(cont.innerWidthMm);
    setInnerHeightMm(cont.innerHeightMm);
    setDoorWidthMm(cont.doorWidthMm);
    setDoorHeightMm(cont.doorHeightMm);
    setMaxPayloadKg(cont.maxPayloadKg);
    setTareWeightKg(cont.tareWeightKg);
    setDescription(cont.description || '');
    setFormError('');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Vui lòng nhập tên loại container');
      return;
    }
    if (innerLengthMm <= 0 || innerWidthMm <= 0 || innerHeightMm <= 0) {
      setFormError('Kích thước bên trong phải lớn hơn 0');
      return;
    }
    if (maxPayloadKg <= 0) {
      setFormError('Tải trọng tối đa phải lớn hơn 0');
      return;
    }

    onSaveContainer({
      id: editingId || undefined,
      name: name.trim(),
      code: code.trim().toUpperCase() || 'CONT-CUSTOM',
      innerLengthMm,
      innerWidthMm,
      innerHeightMm,
      doorWidthMm: doorWidthMm || innerWidthMm,
      doorHeightMm: doorHeightMm || innerHeightMm,
      maxPayloadKg,
      tareWeightKg: tareWeightKg || 2000,
      volumeCbm: computedCbm,
      description: description.trim()
    });

    setIsEditing(false);
    setEditingId(null);
  };

  // Export containers to JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(containers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `optiload_containers_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON configuration
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          imported.forEach(item => {
            if (item.name && item.innerLengthMm) {
              onSaveContainer({
                ...item,
                id: item.id || `imported-${Date.now()}-${Math.random()}`
              });
            }
          });
        }
      } catch (err) {
        alert('File JSON không hợp lệ!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <Container className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Quản Lý & Tạo Loại Container
              </h2>
              <p className="text-xs text-slate-400">
                Tạo kích loại container riêng biệt hoặc xe tải chuyên dụng và lưu vào hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Container Mới</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* If Editing/Creating Form is Active */}
          {isEditing ? (
            <form onSubmit={handleSaveForm} className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-blue-400">
                  {editingId ? 'Chỉnh Sửa Thông Số Container' : 'Thông Tin Container Mới Cần Lưu'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Hủy quay lại
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Tên Container / Phương Tiện *
                  </label>
                  <input
                    type="text"
                    placeholder="vd: Cont 40HC Hapag-Lloyd, Xe tải 10T Isuzu..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Mã Ký Hiệu
                  </label>
                  <input
                    type="text"
                    placeholder="vd: 40HC-CUSTOM"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Internal Dimensions with live CBM badge */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Kích Thước Lọt Lòng Bên Trong (mm):
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-950 border border-blue-700 text-cyan-300">
                    Dung tích: {computedCbm} CBM
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Chiều Dài Lọt Lòng (mm)
                    </label>
                    <input
                      type="number"
                      value={innerLengthMm}
                      onChange={e => setInnerLengthMm(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Chiều Rộng Lọt Lòng (mm)
                    </label>
                    <input
                      type="number"
                      value={innerWidthMm}
                      onChange={e => setInnerWidthMm(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Chiều Cao Lọt Lòng (mm)
                    </label>
                    <input
                      type="number"
                      value={innerHeightMm}
                      onChange={e => setInnerHeightMm(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Weight Capacities */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-200 block">
                  Giới Hạn Tải Trọng & Trọng Lượng (kg):
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Tải Trọng Tối Đa Max Payload (kg)
                    </label>
                    <input
                      type="number"
                      value={maxPayloadKg}
                      onChange={e => setMaxPayloadKg(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Tự Trọng Vỏ Tare Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={tareWeightKg}
                      onChange={e => setTareWeightKg(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Door dimensions (Optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Chiều Rộng Cửa (mm)
                  </label>
                  <input
                    type="number"
                    value={doorWidthMm}
                    onChange={e => setDoorWidthMm(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Chiều Cao Cửa (mm)
                  </label>
                  <input
                    type="number"
                    value={doorHeightMm}
                    onChange={e => setDoorHeightMm(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Mô Tả / Ghi Chú Đặc Biệt
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về hãng tàu, loại xe tải, quy chuẩn xếp hàng..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-colors cursor-pointer"
                >
                  Lưu Vào Hệ Thống
                </button>
              </div>
            </form>
          ) : (
            /* Container Cards List */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {containers.map(cont => {
                  const isActive = cont.id === activeContainerId;
                  const isCustom = cont.type === 'custom';

                  return (
                    <div
                      key={cont.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-blue-950/50 border-blue-500/80 ring-1 ring-blue-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{cont.name}</span>
                            {isCustom && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                                Người dùng tạo
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono">{cont.code}</span>
                        </div>

                        {isActive ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đang dùng</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelectContainer(cont)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                          >
                            Chọn dùng
                          </button>
                        )}
                      </div>

                      {/* Dimensions Specs */}
                      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono mb-3">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Dài lọt lòng:</span>
                          <span className="text-slate-200">{cont.innerLengthMm} mm</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Rộng lọt lòng:</span>
                          <span className="text-slate-200">{cont.innerWidthMm} mm</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Cao lọt lòng:</span>
                          <span className="text-slate-200">{cont.innerHeightMm} mm</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                        <div className="space-x-3">
                          <span className="text-cyan-400 font-mono">
                            Dung tích: {cont.volumeCbm} CBM
                          </span>
                          <span className="text-amber-400 font-mono">
                            Tải: {cont.maxPayloadKg.toLocaleString()} kg
                          </span>
                        </div>

                        {/* Action buttons for custom containers */}
                        {isCustom && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEdit(cont)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Chỉnh sửa container"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc chắn muốn xóa container "${cont.name}"?`)) {
                                  onDeleteContainer(cont.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition-colors cursor-pointer"
                              title="Xóa container"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Import / Export & Reset Defaults Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất file JSON</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Nhập JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Khôi phục danh sách container về mặc định tiêu chuẩn?')) {
                      onResetDefaults();
                    }
                  }}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục mẫu chuẩn ban đầu</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
