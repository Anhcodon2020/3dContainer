import {
  AxleDistribution,
  BayWeight,
  CenterOfGravity,
  ContainerDef,
  PackingResult,
  PalletConfig,
  PlacedPallet
} from '../types/logistics';
import { calculateCbm } from './containerStorage';

interface CandidateArrangement {
  name: string;
  palletsPerTier: {
    lengthMm: number;
    widthMm: number;
    rotated: boolean;
    rowLength: number;
    rowIndex: number;
    colIndex: number;
    xMm: number;
    zMm: number;
  }[];
  totalFloorCount: number;
}

export function optimizePalletPacking(
  pallet: PalletConfig,
  container: ContainerDef,
  targetPalletCount?: number
): PackingResult {
  const startTime = performance.now();

  const cLength = container.innerLengthMm;
  const cWidth = container.innerWidthMm;
  const cHeight = container.innerHeightMm;
  const pLength = pallet.lengthMm;
  const pWidth = pallet.widthMm;
  const pHeight = pallet.heightMm;
  const singleWeightKg = Math.max(1, pallet.totalWeightKg);

  // Determine vertical tier count
  const maxPossibleTiers = Math.max(1, Math.floor(cHeight / pHeight));
  const effectiveTiers = Math.min(pallet.maxTiers, maxPossibleTiers);

  // Maximum pallets allowed by payload weight
  const maxPalletsByWeight = Math.max(1, Math.floor(container.maxPayloadKg / singleWeightKg));

  // Generate candidate floor layouts
  const candidates: CandidateArrangement[] = [];

  // Layout 1: Pure Longitudinal (Length along X)
  const longCols = Math.floor(cWidth / pWidth);
  const longRows = Math.floor(cLength / pLength);
  if (longCols > 0 && longRows > 0) {
    const list: CandidateArrangement['palletsPerTier'] = [];
    const xGap = (cLength - longRows * pLength) / (longRows + 1);
    const zGap = (cWidth - longCols * pWidth) / (longCols + 1);

    for (let r = 0; r < longRows; r++) {
      const x = (r + 1) * xGap + r * pLength + pLength / 2;
      for (let c = 0; c < longCols; c++) {
        const z = (c + 1) * zGap + c * pWidth + pWidth / 2;
        list.push({
          lengthMm: pLength,
          widthMm: pWidth,
          rotated: false,
          rowLength: pLength,
          rowIndex: r,
          colIndex: c,
          xMm: x,
          zMm: z
        });
      }
    }
    candidates.push({
      name: `Xếp dọc (Straight Longitudinal - ${longRows} hàng x ${longCols} dãy)`,
      palletsPerTier: list,
      totalFloorCount: list.length
    });
  }

  // Layout 2: Pure Transverse (Width along X, 90 deg rotated)
  if (pallet.allowRotate) {
    const transCols = Math.floor(cWidth / pLength);
    const transRows = Math.floor(cLength / pWidth);
    if (transCols > 0 && transRows > 0) {
      const list: CandidateArrangement['palletsPerTier'] = [];
      const xGap = (cLength - transRows * pWidth) / (transRows + 1);
      const zGap = (cWidth - transCols * pLength) / (transCols + 1);

      for (let r = 0; r < transRows; r++) {
        const x = (r + 1) * xGap + r * pWidth + pWidth / 2;
        for (let c = 0; c < transCols; c++) {
          const z = (c + 1) * zGap + c * pLength + pLength / 2;
          list.push({
            lengthMm: pWidth,
            widthMm: pLength,
            rotated: true,
            rowLength: pWidth,
            rowIndex: r,
            colIndex: c,
            xMm: x,
            zMm: z
          });
        }
      }
      candidates.push({
        name: `Xếp xoay ngang (Turned Transverse - ${transRows} hàng x ${transCols} dãy)`,
        palletsPerTier: list,
        totalFloorCount: list.length
      });
    }

    // Layout 3: Hybrid / Combination (Mix of longitudinal and transverse rows)
    // Find optimal (a * pLength + b * pWidth <= cLength)
    let bestHybridCount = 0;
    let bestA = 0;
    let bestB = 0;

    const maxA = Math.floor(cLength / pLength);
    for (let a = 1; a <= maxA; a++) {
      const remLength = cLength - a * pLength;
      if (remLength >= pWidth) {
        const b = Math.floor(remLength / pWidth);
        const count = a * longCols + b * transCols;
        if (count > bestHybridCount) {
          bestHybridCount = count;
          bestA = a;
          bestB = b;
        }
      }
    }

    if (bestHybridCount > 0 && (bestHybridCount > (longCols * longRows) || bestHybridCount > (transCols * transRows))) {
      const list: CandidateArrangement['palletsPerTier'] = [];
      let currentX = 0;
      const totalUsedX = bestA * pLength + bestB * pWidth;
      const xSlack = Math.max(0, cLength - totalUsedX) / 2; // center along length
      currentX += xSlack;

      let rIndex = 0;
      // Section A: Longitudinal rows
      const zGapLong = (cWidth - longCols * pWidth) / (longCols + 1);
      for (let i = 0; i < bestA; i++) {
        const xCenter = currentX + pLength / 2;
        for (let c = 0; c < longCols; c++) {
          const z = (c + 1) * zGapLong + c * pWidth + pWidth / 2;
          list.push({
            lengthMm: pLength,
            widthMm: pWidth,
            rotated: false,
            rowLength: pLength,
            rowIndex: rIndex,
            colIndex: c,
            xMm: xCenter,
            zMm: z
          });
        }
        currentX += pLength;
        rIndex++;
      }

      // Section B: Transverse rows
      const zGapTrans = (cWidth - transCols * pLength) / (transCols + 1);
      for (let j = 0; j < bestB; j++) {
        const xCenter = currentX + pWidth / 2;
        for (let c = 0; c < transCols; c++) {
          const z = (c + 1) * zGapTrans + c * pLength + pLength / 2;
          list.push({
            lengthMm: pWidth,
            widthMm: pLength,
            rotated: true,
            rowLength: pWidth,
            rowIndex: rIndex,
            colIndex: c,
            xMm: xCenter,
            zMm: z
          });
        }
        currentX += pWidth;
        rIndex++;
      }

      candidates.push({
        name: `Xếp kết hợp tối ưu (Hybrid Pinwheel: ${bestA} hàng dọc + ${bestB} hàng ngang)`,
        palletsPerTier: list,
        totalFloorCount: list.length
      });
    }

    // Layout 4: Pinwheel paired interlocking (for standard EUR pallet 1200x800 in 2352 container)
    // If (pLength + pWidth <= cWidth) like 1200 + 800 = 2000 <= 2352 mm
    if (pLength + pWidth <= cWidth) {
      const pinwheelList: CandidateArrangement['palletsPerTier'] = [];
      // In this pinwheel, each block is 1 pallet lengthwise (1200x800) and 1 pallet widthwise (800x1200)
      // occupying width (1200 + 800 = 2000mm) and length max(1200, 800) = 1200mm.
      // But we can pack 2 widthwise alongside 1 lengthwise in pairs!
      // Check standard 11 pallets in 20ft:
      // 4 pairs of 2 widthwise (800mm along length = 3200mm) + 3 pallets lengthwise (1200mm along length)
      const pairRows = Math.floor(cLength / 1200);
      if (pairRows > 0) {
        let curX = 0;
        let rIdx = 0;
        for (let r = 0; r < pairRows; r++) {
          // Pallet 1: Left side (lengthwise)
          pinwheelList.push({
            lengthMm: pLength,
            widthMm: pWidth,
            rotated: false,
            rowLength: pLength,
            rowIndex: rIdx,
            colIndex: 0,
            xMm: curX + pLength / 2,
            zMm: pWidth / 2 + 50
          });
          // Pallet 2: Right side (transverse)
          pinwheelList.push({
            lengthMm: pWidth,
            widthMm: pLength,
            rotated: true,
            rowLength: pWidth,
            rowIndex: rIdx,
            colIndex: 1,
            xMm: curX + pWidth / 2,
            zMm: cWidth - pLength / 2 - 50
          });
          curX += Math.max(pLength, pWidth);
          rIdx++;
        }
        if (pinwheelList.length > 0) {
          candidates.push({
            name: `Xếp đan xen zic-zắc (Interlocking Pallets)`,
            palletsPerTier: pinwheelList,
            totalFloorCount: pinwheelList.length
          });
        }
      }
    }
  }

  // Fallback if no candidate could be placed
  if (candidates.length === 0) {
    candidates.push({
      name: 'Kích thước vượt quá lòng container',
      palletsPerTier: [],
      totalFloorCount: 0
    });
  }

  // Pick candidate with highest total count
  candidates.sort((a, b) => b.totalFloorCount - a.totalFloorCount);
  const bestCandidate = candidates[0];

  // Calculate actual total pallets across tiers
  let theoreticalMaxPallets = bestCandidate.totalFloorCount * effectiveTiers;

  // Enforce container max payload limit
  let actualPalletsCount = Math.min(theoreticalMaxPallets, maxPalletsByWeight);

  // If user requested a custom target count (<= actual max)
  if (targetPalletCount !== undefined && targetPalletCount > 0) {
    actualPalletsCount = Math.min(targetPalletCount, actualPalletsCount);
  }

  // Build 3D placed pallet entities
  const placedPallets: PlacedPallet[] = [];
  const floorList = [...bestCandidate.palletsPerTier];

  // Symmetrical / Balanced placement strategy:
  // If we have fewer pallets than the container floor slots (e.g. payload limit or partial order),
  // place them centered around the container's longitudinal midpoint (cLength / 2)
  // to prevent nose-heavy or tail-heavy issues!
  floorList.sort((a, b) => {
    // Distance from longitudinal center
    const distA = Math.abs(a.xMm - cLength / 2);
    const distB = Math.abs(b.xMm - cLength / 2);
    if (Math.abs(distA - distB) < 1) {
      // Keep lateral symmetry
      return Math.abs(a.zMm - cWidth / 2) - Math.abs(b.zMm - cWidth / 2);
    }
    return distA - distB;
  });

  let remainingToPlace = actualPalletsCount;
  let globalIndex = 0;

  // Place tier by tier (tier 1 on floor, tier 2 on top of tier 1)
  for (let tier = 0; tier < effectiveTiers && remainingToPlace > 0; tier++) {
    const yCenter = tier * pHeight + pHeight / 2;

    for (let i = 0; i < floorList.length && remainingToPlace > 0; i++) {
      const pos = floorList[i];
      const bay = Math.min(8, Math.max(1, Math.floor((pos.xMm / cLength) * 8) + 1));

      placedPallets.push({
        id: `pallet-${globalIndex + 1}`,
        index: globalIndex + 1,
        bayIndex: bay,
        rowIndex: pos.rowIndex,
        tierIndex: tier + 1,
        xMm: Math.round(pos.xMm),
        yMm: Math.round(yCenter),
        zMm: Math.round(pos.zMm),
        lengthMm: pos.lengthMm,
        widthMm: pos.widthMm,
        heightMm: pHeight,
        weightKg: singleWeightKg,
        rotated: pos.rotated,
        color: pallet.color || '#3b82f6'
      });

      globalIndex++;
      remainingToPlace--;
    }
  }

  // Re-sort placed pallets in visual loading sequence (from deepest inside / front wall to door)
  placedPallets.sort((a, b) => {
    if (a.tierIndex !== b.tierIndex) return a.tierIndex - b.tierIndex;
    if (Math.abs(a.xMm - b.xMm) > 20) return a.xMm - b.xMm;
    return a.zMm - b.zMm;
  });

  // Re-index cleanly 1 to N
  placedPallets.forEach((p, idx) => {
    p.index = idx + 1;
  });

  // Aggregate stats
  const totalPallets = placedPallets.length;
  const singleCbm = pallet.cbmPerPallet > 0 ? pallet.cbmPerPallet : calculateCbm(pLength, pWidth, pHeight);
  const totalVolumeCbm = Math.round(totalPallets * singleCbm * 1000) / 1000;
  const totalWeightKg = totalPallets * singleWeightKg;
  const grossCombinedWeightKg = totalWeightKg + container.tareWeightKg;

  const volumeUtilizationPct = container.volumeCbm > 0
    ? Math.min(100, Math.round((totalVolumeCbm / container.volumeCbm) * 1000) / 10)
    : 0;
  const payloadUtilizationPct = container.maxPayloadKg > 0
    ? Math.min(100, Math.round((totalWeightKg / container.maxPayloadKg) * 1000) / 10)
    : 0;

  const remainingPayloadKg = Math.max(0, container.maxPayloadKg - totalWeightKg);
  const remainingVolumeCbm = Math.max(0, Math.round((container.volumeCbm - totalVolumeCbm) * 100) / 100);

  // Compute Center of Gravity (CoG)
  const centerOfGravity = calculateCenterOfGravity(placedPallets, container);

  // Compute Axle Weight Distribution
  const axleDistribution = calculateAxleDistribution(placedPallets, container, centerOfGravity);

  // Compute Bay Weight Distribution (8 bays along length)
  const bayWeights = calculateBayWeights(placedPallets, container);

  // Generate Logistics Dunnage / Bracing Recommendations
  const dunnageRecommendations = generateDunnageAdvice(placedPallets, container, pallet, centerOfGravity);

  const unplacedCount = Math.max(0, theoreticalMaxPallets - totalPallets);

  return {
    placedPallets,
    totalPallets,
    totalVolumeCbm,
    totalWeightKg,
    grossCombinedWeightKg,
    volumeUtilizationPct,
    payloadUtilizationPct,
    remainingPayloadKg,
    remainingVolumeCbm,
    centerOfGravity,
    axleDistribution,
    bayWeights,
    unplacedCount,
    arrangementName: bestCandidate.name,
    dunnageRecommendations
  };
}

function calculateCenterOfGravity(
  pallets: PlacedPallet[],
  container: ContainerDef
): CenterOfGravity {
  const cLength = container.innerLengthMm;
  const cWidth = container.innerWidthMm;
  const cHeight = container.innerHeightMm;

  if (pallets.length === 0) {
    return {
      xMm: cLength / 2,
      yMm: 0,
      zMm: cWidth / 2,
      xPercentage: 50,
      zPercentage: 50,
      status: 'optimal',
      longitudinalBalance: 'optimal',
      lateralBalance: 'balanced',
      message: 'Container trống'
    };
  }

  let totalWeight = 0;
  let sumWeightX = 0;
  let sumWeightY = 0;
  let sumWeightZ = 0;

  for (const p of pallets) {
    totalWeight += p.weightKg;
    sumWeightX += p.weightKg * p.xMm;
    sumWeightY += p.weightKg * p.yMm;
    sumWeightZ += p.weightKg * p.zMm;
  }

  const cogX = sumWeightX / totalWeight;
  const cogY = sumWeightY / totalWeight;
  const cogZ = sumWeightZ / totalWeight;

  const xPercentage = Math.round((cogX / cLength) * 1000) / 10;
  const zPercentage = Math.round((cogZ / cWidth) * 1000) / 10;

  // Longitudinal balance assessment (ideal: 46% - 54%)
  let longitudinalBalance: CenterOfGravity['longitudinalBalance'] = 'optimal';
  if (xPercentage < 44) {
    longitudinalBalance = 'front_heavy';
  } else if (xPercentage > 56) {
    longitudinalBalance = 'rear_heavy';
  }

  // Lateral balance assessment (ideal: 48% - 52%)
  let lateralBalance: CenterOfGravity['lateralBalance'] = 'balanced';
  if (zPercentage < 47) {
    lateralBalance = 'left_heavy';
  } else if (zPercentage > 53) {
    lateralBalance = 'right_heavy';
  }

  let status: CenterOfGravity['status'] = 'optimal';
  let message = 'Trọng tâm container cân bằng lý tưởng theo tiêu chuẩn an toàn IMO/CTU';

  if (longitudinalBalance !== 'optimal' || lateralBalance !== 'balanced') {
    if (Math.abs(xPercentage - 50) > 10 || Math.abs(zPercentage - 50) > 5) {
      status = 'danger';
      message = 'Cảnh báo nguy hiểm: Trọng tâm lệch nghiêm trọng, nguy cơ mất lái hoặc quá tải trục xe!';
    } else {
      status = 'warning';
      message = 'Cảnh báo: Trọng tâm lệch nhẹ so với tâm hình học container, cần chèn lót hoặc cân chỉnh vị trí';
    }
  }

  return {
    xMm: Math.round(cogX),
    yMm: Math.round(cogY),
    zMm: Math.round(cogZ),
    xPercentage,
    zPercentage,
    status,
    longitudinalBalance,
    lateralBalance,
    message
  };
}

function calculateAxleDistribution(
  pallets: PlacedPallet[],
  container: ContainerDef,
  cog: CenterOfGravity
): AxleDistribution {
  const cLength = container.innerLengthMm;
  const totalCargoWeight = pallets.reduce((sum, p) => sum + p.weightKg, 0);

  if (totalCargoWeight === 0) {
    return {
      frontAxleKg: 0,
      rearAxleKg: 0,
      frontPercentage: 50,
      rearPercentage: 50,
      isSafe: true,
      recommendation: 'Trống'
    };
  }

  // Distance ratio from front wall to cog
  const normalizedX = cog.xMm / cLength; // 0 (front) to 1 (rear)

  // Cargo load moments: front kingpin receives weight inversely proportional to X distance
  const cargoFront = totalCargoWeight * (1 - normalizedX);
  const cargoRear = totalCargoWeight * normalizedX;

  // Add container tare weight (evenly distributed 50/50)
  const frontTotal = Math.round(cargoFront + container.tareWeightKg * 0.48);
  const rearTotal = Math.round(cargoRear + container.tareWeightKg * 0.52);
  const combinedTotal = frontTotal + rearTotal;

  const frontPct = Math.round((frontTotal / combinedTotal) * 1000) / 10;
  const rearPct = Math.round((rearTotal / combinedTotal) * 1000) / 10;

  const isSafe = frontPct >= 42 && frontPct <= 58 && rearPct >= 42 && rearPct <= 58;
  const recommendation = isSafe
    ? 'Phân bổ cầu xe an toàn, tuân thủ tải trọng cầu trước và cụm trục sau rơ-moóc'
    : frontPct > 58
      ? 'Cảnh báo tải trọng dồn về đầu kéo (Kingpin), nên chuyển bớt pallet nặng về phía đuôi container'
      : 'Cảnh báo tải trọng dồn về cầu sau (Tandem axle), nguy cơ hẫng đầu kéo khi phanh gấp!';

  return {
    frontAxleKg: frontTotal,
    rearAxleKg: rearTotal,
    frontPercentage: frontPct,
    rearPercentage: rearPct,
    isSafe,
    recommendation
  };
}

function calculateBayWeights(
  pallets: PlacedPallet[],
  container: ContainerDef
): BayWeight[] {
  const bayCount = 6;
  const bayLength = container.innerLengthMm / bayCount;
  const bays: BayWeight[] = [];

  for (let b = 0; b < bayCount; b++) {
    const xStart = b * bayLength;
    const xEnd = (b + 1) * bayLength;

    const palletsInBay = pallets.filter(p => p.xMm >= xStart && p.xMm < xEnd);
    const weight = palletsInBay.reduce((sum, p) => sum + p.weightKg, 0);

    bays.push({
      bay: b + 1,
      xStartMm: Math.round(xStart),
      xEndMm: Math.round(xEnd),
      weightKg: weight,
      palletCount: palletsInBay.length
    });
  }

  return bays;
}

function generateDunnageAdvice(
  pallets: PlacedPallet[],
  container: ContainerDef,
  pallet: PalletConfig,
  cog: CenterOfGravity
): string[] {
  const advice: string[] = [];
  if (pallets.length === 0) return advice;

  const cLength = container.innerLengthMm;
  const cWidth = container.innerWidthMm;

  // Check rear door gap
  const maxPalletX = Math.max(...pallets.map(p => p.xMm + p.lengthMm / 2));
  const rearGap = cLength - maxPalletX;
  if (rearGap > 250) {
    advice.push(
      `Khoảng trống đuôi cont còn ${Math.round(rearGap)}mm: Cần lắp giằng gỗ chịu lực (Chocking/Bracing) hoặc lưới chắn cửa (Cargo Net) chống đổ khi mở cửa cont.`
    );
  }

  // Check lateral void
  const maxPalletZ = Math.max(...pallets.map(p => p.zMm + p.widthMm / 2));
  const minPalletZ = Math.min(...pallets.map(p => p.zMm - p.widthMm / 2));
  const sideGap = (cWidth - (maxPalletZ - minPalletZ)) / 2;
  if (sideGap > 120) {
    advice.push(
      `Khoảng hở hai bên hông vách là ${Math.round(sideGap)}mm: Khuyến nghị chèn túi khí chống xô lệch (Dunnage Air Bags) giữa các pallet để tránh lắc ngang khi tàu di chuyển.`
    );
  }

  // Check 2-tier stability
  const hasTier2 = pallets.some(p => p.tierIndex > 1);
  if (hasTier2) {
    advice.push(
      `Hàng đóng 2 tầng: Cần lót tấm phân bổ lực (Slip sheets / Plywood divider) giữa tầng 1 và tầng 2, đồng thời quấn màng co PE căng chắc.`
    );
  }

  // Balance guidance
  if (cog.status !== 'optimal') {
    advice.push(
      `Cân chỉnh trọng tâm: Hãy dịch chuyển các pallet nặng nhất vào vị trí khoang giữa (Bay 3, Bay 4) để đạt phân bổ tải trọng 50/50 lý tưởng.`
    );
  }

  return advice;
}
