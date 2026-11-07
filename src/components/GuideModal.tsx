import React from 'react';
import { X, HelpCircle, BookOpen, Compass, Scale, Boxes, Container, Eye } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-slate-100">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Hướng Dẫn Sử Dụng & Quy Chuẩn Đóng Hàng
              </h2>
              <p className="text-xs text-slate-400">
                Tối ưu hóa xếp pallet, tự động tính CBM, tải trọng và an toàn cân bằng container
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Card 1 */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Boxes className="w-4 h-4" />
              <span>1. Kích Thước Pallet & Tự Động Tính CBM, Số Kg</span>
            </div>
            <p>
              • Bạn có thể chọn các loại pallet tiêu chuẩn quốc tế phổ biến (EUR 1: 1200x800mm, EUR 2: 1200x1000mm, US GMA: 1219x1016mm, Asian: 1100x1100mm) hoặc chọn <strong>"Tùy chỉnh"</strong> để tự nhập chiều Dài (L), Rộng (W), Cao (H).
            </p>
            <p>
              • Hệ thống tự động tính thể tích <strong>CBM</strong> theo công thức chuẩn logistics quốc tế:
              <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                CBM = (Dài mm × Rộng mm × Cao mm) ÷ 1,000,000,000
              </code>
            </p>
            <p>
              • Nhập tự trọng pallet gỗ và khối lượng hàng để hệ thống tính tổng khối lượng Gross Weight của từng kiện và toàn bộ container.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Container className="w-4 h-4" />
              <span>2. Tạo & Quản Lý Kích Loại Container Riêng Vào Hệ Thống</span>
            </div>
            <p>
              • Ngoài các mẫu container đường biển chuẩn (20GP, 40GP, 40HC, 45HC, 20RF), bạn có thể bấm <strong>"Tạo Container Mới"</strong> để lưu vào hệ thống kích thước lòng xe tải nội địa (8 tấn, 15 tấn, xe container chuyên dụng...).
            </p>
            <p>
              • Mọi container bạn tạo được lưu trữ vĩnh viễn trên trình duyệt của bạn (LocalStorage) kèm tính năng Xuất / Nhập file JSON để sao lưu hoặc chia sẻ cho đồng nghiệp.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Compass className="w-4 h-4" />
              <span>3. Cân Bằng Trọng Tâm Container (IMO / CTU Code)</span>
            </div>
            <p>
              • <strong>Trọng tâm dọc (Longitudinal CoG):</strong> Vị trí lý tưởng nằm từ <strong>45% đến 55%</strong> chiều dài container. Tránh đầu cont quá nặng (quá tải cầu kéo Kingpin) hoặc đuôi quá nặng (nguy cơ văng đuôi khi phanh).
            </p>
            <p>
              • <strong>Trọng tâm ngang (Lateral CoG):</strong> Phải phân bổ đối xứng trái - phải (chuẩn 48% - 52%) nhằm chống lật xe khi vào cua.
            </p>
            <p>
              • Con quay 3D Gyroscope hiển thị trực tiếp điểm trọng tâm thực tế kèm laser chiếu xuống sàn container để bạn quan sát trực quan.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Eye className="w-4 h-4" />
              <span>4. Thao Tác Với Không Gian Mô Phỏng 3D</span>
            </div>
            <p>• <strong>Xoay góc nhìn:</strong> Nhấp giữ chuột trái và kéo.</p>
            <p>• <strong>Thu phóng:</strong> Cuộn bánh xe chuột.</p>
            <p>• <strong>Di chuyển tâm nhìn:</strong> Nhấp giữ chuột phải và kéo.</p>
            <p>• <strong>Kiểm tra pallet:</strong> Di chuột (Hover) hoặc Click vào bất kỳ pallet nào trong không gian 3D để xem vị trí khoang (Bay), tầng (Tier), kích thước và khối lượng.</p>
            <p>• <strong>Tua tiến trình:</strong> Dùng thanh trượt ở đáy màn hình hoặc nút Play để mô phỏng lần lượt từng pallet được xếp vào container.</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
