import React from 'react';
import {
  Boxes,
  Container,
  FileSpreadsheet,
  PlusCircle,
  Scale,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { PackingResult, ContainerDef, PalletConfig } from '../types/logistics';

interface HeaderProps {
  container: ContainerDef;
  pallet: PalletConfig;
  packingResult: PackingResult;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenContainerManager: () => void;
  onOpenReportModal: () => void;
  onOpenGuideModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  container,
  pallet,
  packingResult,
  isSidebarOpen,
  onToggleSidebar,
  onOpenContainerManager,
  onOpenReportModal,
  onOpenGuideModal
}) => {
  const cogStatus = packingResult.centerOfGravity.status;

  return (
    <header className="fixed top-0 left-0 right-0 z-20 h-16 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between text-slate-100 shadow-lg select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-blue-400 transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold"
          title="Bật / Tắt bảng cấu hình Pallet & Container"
        >
          <Sliders className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isSidebarOpen ? 'Thu gọn cài đặt' : 'Cấu hình đóng hàng'}
          </span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>OptiLoad 3D</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  PRO
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Tối Ưu Xếp Pallet Vào Container & Cân Bằng Tải Trọng
            </p>
          </div>
        </div>
      </div>

      {/* Real-time KPI summary bar */}
      <div className="hidden lg:flex items-center gap-3 bg-slate-900/90 border border-slate-800/90 rounded-xl px-3 py-1.5 text-xs">
        {/* Pallet Count */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <div className="text-slate-400">Số Pallet:</div>
          <div className="font-mono font-bold text-white text-sm">
            {packingResult.totalPallets}
            <span className="text-slate-400 text-xs font-normal"> kiện</span>
          </div>
        </div>

        {/* Total CBM */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <div className="text-slate-400">Tổng CBM:</div>
          <div className="font-mono font-bold text-cyan-400 text-sm">
            {packingResult.totalVolumeCbm}
            <span className="text-slate-400 text-xs font-normal"> m³</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            ({packingResult.volumeUtilizationPct}%)
          </span>
        </div>

        {/* Total Weight */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <div className="text-slate-400">Khối Lượng:</div>
          <div className="font-mono font-bold text-amber-300 text-sm">
            {packingResult.totalWeightKg.toLocaleString()}
            <span className="text-slate-400 text-xs font-normal"> kg</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            ({packingResult.payloadUtilizationPct}%)
          </span>
        </div>

        {/* CoG Balance Indicator */}
        <div className="flex items-center gap-1.5 pl-1">
          {cogStatus === 'optimal' ? (
            <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-lg">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Cân Bằng Chuẩn IMO</span>
            </span>
          ) : (
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                cogStatus === 'warning'
                  ? 'text-amber-400 bg-amber-950/70 border border-amber-800/80'
                  : 'text-rose-400 bg-rose-950/70 border border-rose-800/80'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{cogStatus === 'warning' ? 'Lệch Nhẹ' : 'Lệch Nguy Hiểm'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenContainerManager}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          title="Quản lý hoặc tạo container mới và lưu vào hệ thống"
        >
          <Container className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Tạo & Quản Lý Container</span>
        </button>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-md shadow-blue-900/30 cursor-pointer"
          title="Xem sơ đồ xếp dỡ và in phiếu tải trọng"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">Báo Cáo Đóng Hàng</span>
        </button>

        <button
          onClick={onOpenGuideModal}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Hướng dẫn sử dụng & Quy chuẩn đóng hàng"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
