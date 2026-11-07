import { ContainerDef, PalletConfig, PalletStandard } from '../types/logistics';

export const STANDARD_CONTAINERS: ContainerDef[] = [
  {
    id: 'cont-20gp',
    name: "20' Standard Dry (20' GP)",
    code: '20GP',
    type: 'standard',
    innerLengthMm: 5898,
    innerWidthMm: 2352,
    innerHeightMm: 2393,
    doorWidthMm: 2340,
    doorHeightMm: 2280,
    maxPayloadKg: 21800,
    tareWeightKg: 2200,
    volumeCbm: 33.2,
    description: 'Container 20 feet thông dụng đường biển, sức chứa tối đa ~11 pallet tiêu chuẩn EUR',
    isDefault: true,
  },
  {
    id: 'cont-40gp',
    name: "40' Standard Dry (40' GP)",
    code: '40GP',
    type: 'standard',
    innerLengthMm: 12032,
    innerWidthMm: 2352,
    innerHeightMm: 2393,
    doorWidthMm: 2340,
    doorHeightMm: 2280,
    maxPayloadKg: 26600,
    tareWeightKg: 3800,
    volumeCbm: 67.7,
    description: 'Container 40 feet thường, sức chứa ~23-25 pallet EUR hoặc 20-21 pallet GMA',
    isDefault: false,
  },
  {
    id: 'cont-40hc',
    name: "40' High Cube (40' HC)",
    code: '40HC',
    type: 'standard',
    innerLengthMm: 12032,
    innerWidthMm: 2352,
    innerHeightMm: 2698,
    doorWidthMm: 2340,
    doorHeightMm: 2585,
    maxPayloadKg: 26500,
    tareWeightKg: 3900,
    volumeCbm: 76.4,
    description: 'Container 40 feet cao (High Cube), lý tưởng cho hàng nhẹ, cồng kềnh hoặc xếp chồng 2 tầng pallet',
    isDefault: false,
  },
  {
    id: 'cont-45hc',
    name: "45' High Cube (45' HC)",
    code: '45HC',
    type: 'standard',
    innerLengthMm: 13556,
    innerWidthMm: 2352,
    innerHeightMm: 2698,
    doorWidthMm: 2340,
    doorHeightMm: 2585,
    maxPayloadKg: 27800,
    tareWeightKg: 4800,
    volumeCbm: 86.0,
    description: 'Container 45 feet cao, dung tích lớn tối đa ~30-33 pallet',
    isDefault: false,
  },
  {
    id: 'cont-20rf',
    name: "20' Reefer (Lạnh)",
    code: '20RF',
    type: 'standard',
    innerLengthMm: 5444,
    innerWidthMm: 2294,
    innerHeightMm: 2273,
    doorWidthMm: 2290,
    doorHeightMm: 2260,
    maxPayloadKg: 27400,
    tareWeightKg: 3080,
    volumeCbm: 28.3,
    description: 'Container bảo ôn lạnh 20ft (vách cách nhiệt dày hơn cont thường)',
    isDefault: false,
  },
  {
    id: 'truck-15t',
    name: 'Xe Tải Thùng Kín 15 Tấn (3 Chân)',
    code: 'TRUCK-15T',
    type: 'standard',
    innerLengthMm: 9500,
    innerWidthMm: 2380,
    innerHeightMm: 2500,
    doorWidthMm: 2360,
    doorHeightMm: 2450,
    maxPayloadKg: 15000,
    tareWeightKg: 9000,
    volumeCbm: 56.5,
    description: 'Thùng xe tải đường bộ 3 chân nội địa, chở tối đa ~18-20 pallet',
    isDefault: false,
  },
  {
    id: 'truck-8t',
    name: 'Xe Tải Thùng Kín 8 Tấn (2 Chân)',
    code: 'TRUCK-8T',
    type: 'standard',
    innerLengthMm: 7800,
    innerWidthMm: 2350,
    innerHeightMm: 2350,
    doorWidthMm: 2330,
    doorHeightMm: 2300,
    maxPayloadKg: 8000,
    tareWeightKg: 5800,
    volumeCbm: 43.0,
    description: 'Thùng xe tải trung tải 8 tấn giao hàng công nghiệp, nội địa',
    isDefault: false,
  }
];

export const STANDARD_PALLET_PRESETS: Record<PalletStandard, { name: string; lengthMm: number; widthMm: number; heightMm: number; tareKg: number; desc: string }> = {
  eur1: {
    name: 'EUR 1 / ISO 1 (1200 x 800 mm)',
    lengthMm: 1200,
    widthMm: 800,
    heightMm: 1450,
    tareKg: 25,
    desc: 'Pallet tiêu chuẩn Châu Âu phổ biến nhất thế giới'
  },
  eur2: {
    name: 'EUR 2 / UK (1200 x 1000 mm)',
    lengthMm: 1200,
    widthMm: 1000,
    heightMm: 1500,
    tareKg: 30,
    desc: 'Pallet tiêu chuẩn Anh và công nghiệp chế biến'
  },
  eur3: {
    name: 'EUR 3 (1000 x 1200 mm)',
    lengthMm: 1000,
    widthMm: 1200,
    heightMm: 1450,
    tareKg: 28,
    desc: 'Pallet tiêu chuẩn EUR 3 hướng nâng cạnh 1000mm'
  },
  iso_gma: {
    name: 'US GMA / ISO (1219 x 1016 mm - 48"x40")',
    lengthMm: 1219,
    widthMm: 1016,
    heightMm: 1500,
    tareKg: 23,
    desc: 'Pallet tiêu chuẩn Bắc Mỹ (Mỹ, Canada, Mexico) Grocery Manufacturers Assoc'
  },
  asia: {
    name: 'Asian Standard / JIS (1100 x 1100 mm)',
    lengthMm: 1100,
    widthMm: 1100,
    heightMm: 1400,
    tareKg: 20,
    desc: 'Pallet tiêu chuẩn Châu Á (Nhật Bản, Hàn Quốc, Việt Nam, Trung Quốc)'
  },
  custom: {
    name: 'Pallet Tùy Chỉnh Kích Thước',
    lengthMm: 1200,
    widthMm: 1000,
    heightMm: 1500,
    tareKg: 25,
    desc: 'Người dùng tự do nhập kích thước theo đơn hàng'
  }
};

const STORAGE_KEY_CONTAINERS = 'optiload_user_containers_v1';
const STORAGE_KEY_PALLET = 'optiload_current_pallet_v1';

export function calculateCbm(lengthMm: number, widthMm: number, heightMm: number): number {
  if (lengthMm <= 0 || widthMm <= 0 || heightMm <= 0) return 0;
  const cbm = (lengthMm * widthMm * heightMm) / 1000000000;
  return Math.round(cbm * 1000) / 1000; // Round to 3 decimal places
}

export function loadAllContainers(): ContainerDef[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONTAINERS);
    if (!saved) {
      return [...STANDARD_CONTAINERS];
    }
    const customList: ContainerDef[] = JSON.parse(saved);
    // Combine standard with user's custom containers (ensure no duplicate IDs)
    const combined = [...STANDARD_CONTAINERS];
    customList.forEach(custom => {
      if (!combined.some(c => c.id === custom.id)) {
        combined.push(custom);
      }
    });
    return combined;
  } catch (err) {
    console.error('Error loading containers from localStorage', err);
    return [...STANDARD_CONTAINERS];
  }
}

export function saveCustomContainer(container: Omit<ContainerDef, 'id' | 'type'> & { id?: string }): ContainerDef {
  const allContainers = loadAllContainers();
  const id = container.id || `custom-cont-${Date.now()}`;
  const volumeCbm = calculateCbm(container.innerLengthMm, container.innerWidthMm, container.innerHeightMm);

  const newContainer: ContainerDef = {
    ...container,
    id,
    type: 'custom',
    volumeCbm,
    createdAt: Date.now()
  };

  const existingCustom = getOnlyCustomContainers();
  const existingIndex = existingCustom.findIndex(c => c.id === id);
  if (existingIndex >= 0) {
    existingCustom[existingIndex] = newContainer;
  } else {
    existingCustom.unshift(newContainer);
  }

  localStorage.setItem(STORAGE_KEY_CONTAINERS, JSON.stringify(existingCustom));
  return newContainer;
}

export function deleteCustomContainer(id: string): void {
  const existingCustom = getOnlyCustomContainers();
  const filtered = existingCustom.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY_CONTAINERS, JSON.stringify(filtered));
}

export function getOnlyCustomContainers(): ContainerDef[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONTAINERS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function resetContainersToDefault(): void {
  localStorage.removeItem(STORAGE_KEY_CONTAINERS);
}

export function loadSavedPalletConfig(): PalletConfig {
  const defaultPreset = STANDARD_PALLET_PRESETS.eur1;
  const initial: PalletConfig = {
    id: 'pallet-config-default',
    name: defaultPreset.name,
    standardType: 'eur1',
    lengthMm: defaultPreset.lengthMm,
    widthMm: defaultPreset.widthMm,
    heightMm: defaultPreset.heightMm,
    palletTareKg: defaultPreset.tareKg,
    cargoWeightKg: 650,
    totalWeightKg: 650 + defaultPreset.tareKg,
    cbmPerPallet: calculateCbm(defaultPreset.lengthMm, defaultPreset.widthMm, defaultPreset.heightMm),
    allowRotate: true,
    maxTiers: 1,
    color: '#3b82f6',
    boxDetail: {
      enabled: false,
      boxLengthMm: 400,
      boxWidthMm: 300,
      boxHeightMm: 250,
      boxesPerLayer: 8,
      layers: 5,
      totalBoxes: 40
    }
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY_PALLET);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...initial,
        ...parsed,
        totalWeightKg: (parsed.palletTareKg || 25) + (parsed.cargoWeightKg || 650),
        cbmPerPallet: calculateCbm(parsed.lengthMm, parsed.widthMm, parsed.heightMm)
      };
    }
  } catch (err) {
    console.error('Failed to load pallet config', err);
  }
  return initial;
}

export function savePalletConfig(config: PalletConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_PALLET, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save pallet config', err);
  }
}
