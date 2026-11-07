import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Camera,
  Layers,
  Compass,
  ChevronDown,
  ChevronUp,
  Box,
  DoorOpen,
  Info
} from 'lucide-react';
import { CameraPreset, ContainerViewMode } from './ThreeCanvas/ThreeScene';
import { PlacedPallet } from '../types/logistics';

interface ControlDockProps {
  totalPallets: number;
  visiblePalletCount: number;
  onVisiblePalletChange: (count: number) => void;
  cameraPreset: CameraPreset;
  onCameraPresetChange: (preset: CameraPreset) => void;
  viewMode: ContainerViewMode;
  onViewModeChange: (mode: ContainerViewMode) => void;
  showCoG: boolean;
  onToggleCoG: () => void;
  doorsOpen: boolean;
  onToggleDoors: () => void;
  hoveredPallet: PlacedPallet | null;
  selectedPallet: PlacedPallet | null;
  onResetCamera: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  totalPallets,
  visiblePalletCount,
  onVisiblePalletChange,
  cameraPreset,
  onCameraPresetChange,
  viewMode,
  onViewModeChange,
  showCoG,
  onToggleCoG,
  doorsOpen,
  onToggleDoors,
  hoveredPallet,
  selectedPallet,
  onResetCamera
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback loading animation
  useEffect(() => {
    if (!isPlaying) return;
    if (visiblePalletCount >= totalPallets) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      if (visiblePalletCount >= totalPallets) {
        setIsPlaying(false);
      } else {
        onVisiblePalletChange(visiblePalletCount + 1);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [isPlaying, visiblePalletCount, totalPallets, onVisiblePalletChange]);

  const activePallet = selectedPallet || hoveredPallet;

  return (
    <div
      className="fixed z-30 pointer-events-none transition-all duration-300 ease-out"
      style={{
        bottom: isCollapsed ? '-168px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(960px, 94vw)'
      }}
    >
      {/* Collapse / Expand Toggle Tab */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-t-lg border border-b-0 border-slate-700/80 text-xs font-medium shadow-lg transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Mở rộng thanh điều khiển 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Thu gọn điều khiển (Chế độ xem toàn cảnh)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Control Dock */}
      <div className="pointer-events-auto bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl p-3 text-slate-200">
        {/* Active Inspection Tooltip Bar (if user hovers or clicks a pallet) */}
        {activePallet && (
          <div className="mb-2 px-3 py-1.5 bg-blue-950/80 border border-blue-800/70 rounded-xl flex items-center justify-between text-xs text-blue-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="font-semibold text-white">Pallet #{activePallet.index}:</span>
              <span>Khoang (Bay) {activePallet.bayIndex}</span>
              <span className="text-blue-400">•</span>
              <span>Tầng (Tier) {activePallet.tierIndex}</span>
              <span className="text-blue-400">•</span>
              <span>
                {activePallet.lengthMm} x {activePallet.widthMm} x {activePallet.heightMm} mm
              </span>
              {activePallet.rotated && (
                <span className="px-1.5 py-0.5 bg-blue-600/30 text-blue-300 rounded text-[10px] font-mono">
                  Xoay 90°
                </span>
              )}
            </div>
            <div className="font-mono text-emerald-400 font-semibold">
              {activePallet.weightKg.toLocaleString()} kg | Tọa độ X:{activePallet.xMm} Y:{activePallet.yMm} Z:{activePallet.zMm}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Section 1: Step-by-Step Loading Animation Slider (Cols 5) */}
          <div className="md:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Tiến trình xếp pallet vào cont:</span>
              </span>
              <span className="font-mono font-semibold text-blue-400">
                {visiblePalletCount} / {totalPallets} kiện
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (visiblePalletCount >= totalPallets) {
                    onVisiblePalletChange(1);
                  }
                  setIsPlaying(!isPlaying);
                }}
                disabled={totalPallets === 0}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
                title={isPlaying ? 'Tạm dừng mô phỏng' : 'Chạy mô phỏng xếp hàng'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  onVisiblePalletChange(totalPallets);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer text-[11px] px-2 font-medium"
                title="Xếp toàn bộ ngay lập tức"
              >
                Tất cả
              </button>

              <input
                type="range"
                min="0"
                max={Math.max(1, totalPallets)}
                value={visiblePalletCount}
                onChange={e => {
                  setIsPlaying(false);
                  onVisiblePalletChange(Number(e.target.value));
                }}
                className="flex-1 accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />

              <button
                onClick={() => {
                  setIsPlaying(false);
                  onVisiblePalletChange(0);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Đặt lại cont trống"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section 2: Camera Presets (Cols 4) */}
          <div className="md:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Góc nhìn 3D:</span>
              </span>
              <button
                onClick={onResetCamera}
                className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Đặt lại
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'iso', label: '3D Phối cảnh' },
                { id: 'top', label: 'Mặt bằng Top' },
                { id: 'side', label: 'Mặt hông' },
                { id: 'door', label: 'Từ cửa cont' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => onCameraPresetChange(btn.id as CameraPreset)}
                  className={`px-1.5 py-1 text-[11px] rounded-lg font-medium transition-all text-center cursor-pointer ${
                    cameraPreset === btn.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Container Display & CoG Toggles (Cols 3) */}
          <div className="md:col-span-3 bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chế độ hiển thị vỏ cont:</span>
            </div>

            <div className="flex items-center gap-1 justify-between">
              <select
                value={viewMode}
                onChange={e => onViewModeChange(e.target.value as ContainerViewMode)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none cursor-pointer flex-1"
              >
                <option value="translucent">Vách trong suốt</option>
                <option value="solid">Vách thép đặc</option>
                <option value="open_top">Mở nóc (Open-Top)</option>
                <option value="wireframe">Khung dây X-Ray</option>
              </select>

              <button
                onClick={onToggleCoG}
                className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  showCoG
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Bật / Tắt con quay trọng tâm 3D"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>CoG</span>
              </button>

              <button
                onClick={onToggleDoors}
                className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  doorsOpen
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Mở / Đóng cửa sau container"
              >
                <DoorOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
