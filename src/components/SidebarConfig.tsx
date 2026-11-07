import React, { useState } from 'react';
import {
  Boxes,
  Container,
  Scale,
  Sparkles,
  RotateCw,
  Layers,
  Palette,
  Package,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  ContainerDef,
  PackingResult,
  PalletConfig,
  PalletStandard
} from '../types/logistics';
import { STANDARD_PALLET_PRESETS, calculateCbm } from '../utils/containerStorage';

interface SidebarConfigProps {
  isOpen: boolean;
  onClose: () => void;
  containers: ContainerDef[];
  activeContainer: ContainerDef;
  onSelectContainer: (container: ContainerDef) => void;
  pallet: PalletConfig;
  onUpdatePallet: (updated: PalletConfig) => void;
  packingResult: PackingResult;
  onOpenContainerManager: () => void;
  targetCount: number | undefined;
  onTargetCountChange: (count: number | undefined) => void;
}

export const SidebarConfig: React.FC<SidebarConfigProps> = ({
  isOpen,
  onClose,
  containers,
  activeContainer,
  onSelectContainer,
  pallet,
  onUpdatePallet,
  packingResult,
  onOpenContainerManager,
  targetCount,
  onTargetCountChange
}) => {
  const [activeTab, setActiveTab] = useState<'pallet' | 'container' | 'balance'>('pallet');
  const [showBoxDetails, setShowBoxDetails] = useState(pallet.boxDetail?.enabled || false);

  // Handle standard preset selection
  const handlePresetChange = (presetKey: PalletStandard) => {
    const preset = STANDARD_PALLET_PRESETS[presetKey];
    const newL = preset.lengthMm;
    const newW = preset.widthMm;
    const newH = preset.heightMm;
    const newTare = preset.tareKg;
    const newCbm = calculateCbm(newL, newW, newH);

    onUpdatePallet({
      ...pallet,
      standardType: presetKey,
      name: preset.name,
      lengthMm: newL,
      widthMm: newW,
      heightMm: newH,
      palletTareKg: newTare,
      totalWeightKg: newTare + pallet.cargoWeightKg,
      cbmPerPallet: newCbm
    });
  };

  // Update specific dimension
  const handleDimensionChange = (key: 'lengthMm' | 'widthMm' | 'heightMm' | 'palletTareKg' | 'cargoWeightKg', value: number) => {
    const nextVal = Math.max(0, value);
    const updated = { ...pallet, [key]: nextVal };

    if (key === 'lengthMm' || key === 'widthMm' || key === 'heightMm') {
      updated.cbmPerPallet = calculateCbm(updated.lengthMm, updated.widthMm, updated.heightMm);
    }
    if (key === 'palletTareKg' || key === 'cargoWeightKg') {
      updated.totalWeightKg = updated.palletTareKg + updated.cargoWeightKg;
    }
    onUpdatePallet(updated);
  };

  const cog = packingResult.centerOfGravity;
  const axle = packingResult.axleDistribution;

  if (!isOpen) return null;

  return (
    <aside className="fixed top-16 left-0 bottom-0 z-20 w-full sm:w-[420px] bg-slate-950/95 border-r border-slate-800/80 shadow-2xl flex flex-col text-slate-200 select-none overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('pallet')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'pallet'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Kích Thước Pallet</span>
        </button>

        <button
          onClick={() => setActiveTab('container')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'container'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Container className="w-3.5 h-3.5" />
          <span>Container & Vỏ</span>
        </button>

        <button
          onClick={() => setActiveTab('balance')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'balance'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Cân Bằng CoG</span>
        </button>
      </div>

      {/* Tab Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= TAB 1: PALLET CONFIGURATION ================= */}
        {activeTab === 'pallet' && (
          <div className="space-y-4">
            {/* Standard preset selector */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Loại Pallet Tiêu Chuẩn:</span>
                <span className="text-[10px] text-blue-400 font-mono">
                  {pallet.standardType.toUpperCase()}
                </span>
              </label>

              <select
                value={pallet.standardType}
                onChange={e => handlePresetChange(e.target.value as PalletStandard)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {Object.entries(STANDARD_PALLET_PRESETS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pallet Dimensions (L, W, H) with Auto CBM */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Kích Thước Pallet Sau Đóng Gói (mm):
                </span>
                <div className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-mono text-xs font-bold">
                  {pallet.cbmPerPallet} CBM / kiện
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Dài L (mm)</label>
                  <input
                    type="number"
                    value={pallet.lengthMm}
                    onChange={e => handleDimensionChange('lengthMm', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Rộng W (mm)</label>
                  <input
                    type="number"
                    value={pallet.widthMm}
                    onChange={e => handleDimensionChange('widthMm', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Cao H (mm)</label>
                  <input
                    type="number"
                    value={pallet.heightMm}
                    onChange={e => handleDimensionChange('heightMm', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * Chiều cao H đã bao gồm đế pallet gỗ (chuẩn 144mm) và kiện hàng đóng bên trên.
              </p>
            </div>

            {/* Pallet Weight (Tare, Cargo, Total kg) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Khối Lượng Mỗi Pallet (kg):
                </span>
                <div className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/80 text-amber-300 font-mono text-xs font-bold">
                  {pallet.totalWeightKg.toLocaleString()} kg / kiện
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Khối lượng hàng (kg)
                  </label>
                  <input
                    type="number"
                    value={pallet.cargoWeightKg}
                    onChange={e => handleDimensionChange('cargoWeightKg', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Tự trọng pallet rỗng (kg)
                  </label>
                  <input
                    type="number"
                    value={pallet.palletTareKg}
                    onChange={e => handleDimensionChange('palletTareKg', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Stacking & Rotation Settings */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Quy Cách Xếp & Giới Hạn:
              </span>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-blue-400" />
                  <span className="text-xs">Cho phép xoay 90°:</span>
                </div>
                <button
                  onClick={() => onUpdatePallet({ ...pallet, allowRotate: !pallet.allowRotate })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    pallet.allowRotate ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      pallet.allowRotate ? 'transform translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs">Số tầng xếp chồng tối đa:</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2].map(tier => (
                    <button
                      key={tier}
                      onClick={() => onUpdatePallet({ ...pallet, maxTiers: tier })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pallet.maxTiers === tier
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tier} Tầng
                    </button>
                  ))}
                </div>
              </div>

              {/* Target count (for partial load testing) */}
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Số lượng cần đóng (Tùy chọn):</span>
                <input
                  type="number"
                  placeholder="Tối đa"
                  value={targetCount ?? ''}
                  onChange={e => {
                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                    onTargetCountChange(val);
                  }}
                  className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-right font-mono outline-none"
                />
              </div>
            </div>

            {/* Pallet Color Swatch */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Màu nhận diện hàng trên 3D:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map(c => (
                  <button
                    key={c}
                    onClick={() => onUpdatePallet({ ...pallet, color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      pallet.color === c ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CONTAINER SELECTION ================= */}
        {activeTab === 'container' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Container / Phương tiện:</span>
              <button
                onClick={onOpenContainerManager}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo cont mới</span>
              </button>
            </div>

            {/* List of Containers */}
            <div className="space-y-2">
              {containers.map(cont => {
                const isSelected = cont.id === activeContainer.id;
                return (
                  <div
                    key={cont.id}
                    onClick={() => onSelectContainer(cont)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Container
                          className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}
                        />
                        <span className="font-semibold text-xs text-white">{cont.name}</span>
                      </div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {cont.code}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400 font-mono">
                      <div>
                        Dài:{' '}
                        <span className="text-slate-200">
                          {(cont.innerLengthMm / 1000).toFixed(2)}m
                        </span>
                      </div>
                      <div>
                        Rộng:{' '}
                        <span className="text-slate-200">
                          {(cont.innerWidthMm / 1000).toFixed(2)}m
                        </span>
                      </div>
                      <div>
                        Cao:{' '}
                        <span className="text-slate-200">
                          {(cont.innerHeightMm / 1000).toFixed(2)}m
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-cyan-400 font-mono">
                        Dung tích: {cont.volumeCbm} CBM
                      </span>
                      <span className="text-amber-400 font-mono">
                        Tải trọng: {cont.maxPayloadKg.toLocaleString()} kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CONTAINER BALANCE & COG ================= */}
        {activeTab === 'balance' && (
          <div className="space-y-4">
            {/* Status card */}
            <div
              className={`p-4 rounded-2xl border ${
                cog.status === 'optimal'
                  ? 'bg-emerald-950/50 border-emerald-800/70 text-emerald-200'
                  : cog.status === 'warning'
                    ? 'bg-amber-950/50 border-amber-800/70 text-amber-200'
                    : 'bg-rose-950/50 border-rose-800/70 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {cog.status === 'optimal' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <span className="font-bold text-xs uppercase tracking-wider">
                  {cog.status === 'optimal'
                    ? 'Độ Cân Bằng Chuẩn IMO / CTU Code'
                    : 'Cảnh Báo Phân Bổ Trọng Lượng'}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{cog.message}</p>
            </div>

            {/* Longitudinal Balance Bar (Trục Dọc X) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Trọng Tâm Dọc (Longitudinal CoG):</span>
                <span className="font-mono font-bold text-cyan-400">{cog.xPercentage}%</span>
              </div>

              {/* Progress bar with safe target 45% - 55% */}
              <div className="relative h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                {/* Safe zone highlight 45% - 55% */}
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/60"
                  style={{ left: '44%', width: '12%' }}
                />
                {/* Center needle 50% */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
                  style={{ left: '50%' }}
                />
                {/* Current CoG marker */}
                <div
                  className={`absolute top-0.5 bottom-0.5 w-3 rounded-full transition-all -ml-1.5 shadow ${
                    cog.status === 'optimal'
                      ? 'bg-emerald-400'
                      : cog.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                  }`}
                  style={{ left: `${Math.min(98, Math.max(2, cog.xPercentage))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% (Đầu Cont)</span>
                <span className="text-emerald-400">Vùng An Toàn [45% - 55%]</span>
                <span>100% (Cửa Sau)</span>
              </div>
            </div>

            {/* Lateral Balance Bar (Trục Ngang Z) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Trọng Tâm Ngang (Lateral CoG):</span>
                <span className="font-mono font-bold text-cyan-400">{cog.zPercentage}%</span>
              </div>

              <div className="relative h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/60"
                  style={{ left: '47%', width: '6%' }}
                />
                <div
                  className="absolute top-0.5 bottom-0.5 w-3 rounded-full transition-all -ml-1.5 bg-emerald-400"
                  style={{ left: `${Math.min(98, Math.max(2, cog.zPercentage))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Trái ({cog.zPercentage}%)</span>
                <span className="text-emerald-400">Tâm Đối Xứng 50%</span>
                <span>Phải ({Math.round((100 - cog.zPercentage) * 10) / 10}%)</span>
              </div>
            </div>

            {/* Axle Load Distribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Phân Bổ Tải Trọng Lên Cầu Xe (Axle Moments):
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1">Cầu Trước / Chốt Kéo</div>
                  <div className="font-mono font-bold text-amber-300 text-sm">
                    {axle.frontAxleKg.toLocaleString()} kg
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Tỉ lệ: {axle.frontPercentage}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1">Cụm Trục Sau (Tandem)</div>
                  <div className="font-mono font-bold text-amber-300 text-sm">
                    {axle.rearAxleKg.toLocaleString()} kg
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Tỉ lệ: {axle.rearPercentage}%
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic leading-relaxed">
                {axle.recommendation}
              </p>
            </div>

            {/* Dunnage Advice List */}
            {packingResult.dunnageRecommendations.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span>Khuyến Nghị Chằng Buộc & Chèn Lót (Dunnage):</span>
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {packingResult.dunnageRecommendations.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Optimization Summary */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs flex items-center justify-between">
        <div>
          <div className="text-slate-400 text-[11px]">Sơ đồ bố trí tối ưu:</div>
          <div className="font-semibold text-white truncate max-w-[240px]">
            {packingResult.arrangementName}
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-[11px]">Tổng sức chứa:</div>
          <div className="font-mono font-bold text-emerald-400 text-sm">
            {packingResult.totalPallets} pallet
          </div>
        </div>
      </div>
    </aside>
  );
};
