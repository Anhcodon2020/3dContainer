export type PalletStandard = 
  | 'eur1'        // 1200 x 800 mm (EUR 1 / ISO 1)
  | 'eur2'        // 1200 x 1000 mm (EUR 2 / UK)
  | 'eur3'        // 1000 x 1200 mm (EUR 3)
  | 'iso_gma'     // 1219 x 1016 mm (US GMA Standard 48x40")
  | 'asia'        // 1100 x 1100 mm (Asian Standard / JIS)
  | 'custom';     // Tùy chỉnh người dùng

export interface PalletConfig {
  id: string;
  name: string;
  standardType: PalletStandard;
  lengthMm: number;    // Chiều dài (mm)
  widthMm: number;     // Chiều rộng (mm)
  heightMm: number;    // Chiều cao bao gồm đế pallet (mm)
  palletTareKg: number; // Tự trọng pallet rỗng (kg)
  cargoWeightKg: number; // Khối lượng hàng trên pallet (kg)
  totalWeightKg: number; // Tổng khối lượng 1 pallet = tare + cargo
  cbmPerPallet: number;  // CBM = L * W * H / 1e9 (m3)
  allowRotate: boolean;  // Cho phép xoay 90 độ
  maxTiers: number;      // Số tầng xếp chồng cho phép (1 hoặc 2 hoặc 3)
  color: string;         // Màu nhận diện trên 3D
  boxDetail?: {
    enabled: boolean;
    boxLengthMm: number;
    boxWidthMm: number;
    boxHeightMm: number;
    boxesPerLayer: number;
    layers: number;
    totalBoxes: number;
  };
}

export type ContainerType = 'standard' | 'custom';

export interface ContainerDef {
  id: string;
  name: string;
  code: string;
  type: ContainerType;
  innerLengthMm: number; // Dài trong lòng (mm)
  innerWidthMm: number;  // Rộng trong lòng (mm)
  innerHeightMm: number; // Cao trong lòng (mm)
  doorWidthMm: number;   // Rộng cửa (mm)
  doorHeightMm: number;  // Cao cửa (mm)
  maxPayloadKg: number;  // Tải trọng tối đa cho phép (kg)
  tareWeightKg: number;  // Tự trọng container (kg)
  volumeCbm: number;     // Thể tích bên trong (m3)
  description?: string;
  isDefault?: boolean;
  createdAt?: number;
}

export interface PlacedPallet {
  id: string;
  index: number;
  bayIndex: number;      // Chỉ số khoang theo trục dọc (X)
  rowIndex: number;     // Chỉ số hàng theo trục ngang (Z)
  tierIndex: number;    // Tầng (1, 2...) (Y)
  xMm: number;          // Tọa độ tâm X (mm) tính từ cửa/vách
  yMm: number;          // Tọa độ tâm Y (mm) tính từ sàn
  zMm: number;          // Tọa độ tâm Z (mm) tính từ vách trái
  lengthMm: number;     // Chiều dài thực tế đặt theo X
  widthMm: number;      // Chiều rộng thực tế đặt theo Z
  heightMm: number;     // Chiều cao theo Y
  weightKg: number;     // Trọng lượng pallet
  rotated: boolean;     // Có xoay 90 độ hay không
  color: string;
}

export interface CenterOfGravity {
  xMm: number;           // Vị trí trọng tâm theo chiều dài (mm)
  yMm: number;           // Vị trí trọng tâm theo chiều cao (mm)
  zMm: number;           // Vị trí trọng tâm theo chiều rộng (mm)
  xPercentage: number;   // % so với chiều dài cont (chuẩn 45% - 55%)
  zPercentage: number;   // % so với chiều rộng cont (chuẩn 48% - 52%)
  status: 'optimal' | 'warning' | 'danger';
  longitudinalBalance: 'optimal' | 'front_heavy' | 'rear_heavy';
  lateralBalance: 'balanced' | 'left_heavy' | 'right_heavy';
  message: string;
}

export interface AxleDistribution {
  frontAxleKg: number;   // Tải trọng cầu trước / chốt kéo Kingpin (kg)
  rearAxleKg: number;    // Tải trọng trục sau / cầu rơ moóc Tandem (kg)
  frontPercentage: number;
  rearPercentage: number;
  isSafe: boolean;
  recommendation: string;
}

export interface BayWeight {
  bay: number;
  xStartMm: number;
  xEndMm: number;
  weightKg: number;
  palletCount: number;
}

export interface PackingResult {
  placedPallets: PlacedPallet[];
  totalPallets: number;
  totalVolumeCbm: number;
  totalWeightKg: number;
  grossCombinedWeightKg: number; // Hàng + Tự trọng cont
  volumeUtilizationPct: number;
  payloadUtilizationPct: number;
  remainingPayloadKg: number;
  remainingVolumeCbm: number;
  centerOfGravity: CenterOfGravity;
  axleDistribution: AxleDistribution;
  bayWeights: BayWeight[];
  unplacedCount: number;
  arrangementName: string;
  dunnageRecommendations: string[];
}
