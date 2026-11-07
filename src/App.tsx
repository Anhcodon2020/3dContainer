/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SidebarConfig } from './components/SidebarConfig';
import { ThreeScene, CameraPreset, ContainerViewMode } from './components/ThreeCanvas/ThreeScene';
import { ControlDock } from './components/ControlDock';
import { ContainerManagerModal } from './components/ContainerManagerModal';
import { LoadPlanReportModal } from './components/LoadPlanReportModal';
import { GuideModal } from './components/GuideModal';
import { ContainerDef, PalletConfig, PlacedPallet } from './types/logistics';
import {
  loadAllContainers,
  saveCustomContainer,
  deleteCustomContainer,
  resetContainersToDefault,
  loadSavedPalletConfig,
  savePalletConfig
} from './utils/containerStorage';
import { optimizePalletPacking } from './utils/packingOptimizer';

export default function App() {
  // 1. Container & Pallet State
  const [containers, setContainers] = useState<ContainerDef[]>(() => loadAllContainers());
  const [activeContainerId, setActiveContainerId] = useState<string>(() => {
    const list = loadAllContainers();
    return list[0]?.id || 'cont-20gp';
  });

  const activeContainer = useMemo(() => {
    return containers.find(c => c.id === activeContainerId) || containers[0];
  }, [containers, activeContainerId]);

  const [pallet, setPallet] = useState<PalletConfig>(() => loadSavedPalletConfig());
  const [targetCount, setTargetCount] = useState<number | undefined>(undefined);

  // 2. Compute Packing Optimization & Balance Result
  const packingResult = useMemo(() => {
    if (!activeContainer) {
      return optimizePalletPacking(pallet, containers[0], targetCount);
    }
    return optimizePalletPacking(pallet, activeContainer, targetCount);
  }, [pallet, activeContainer, targetCount]);

  // 3. UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isContainerManagerOpen, setIsContainerManagerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // 4. 3D View Controls
  const [viewMode, setViewMode] = useState<ContainerViewMode>('translucent');
  const [showCoG, setShowCoG] = useState(true);
  const [doorsOpen, setDoorsOpen] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [visiblePalletCount, setVisiblePalletCount] = useState<number>(packingResult.totalPallets);
  const [hoveredPallet, setHoveredPallet] = useState<PlacedPallet | null>(null);
  const [selectedPallet, setSelectedPallet] = useState<PlacedPallet | null>(null);

  // Sync visible pallet count when totalPallets changes
  useEffect(() => {
    setVisiblePalletCount(packingResult.totalPallets);
  }, [packingResult.totalPallets]);

  // Save pallet changes to local storage
  const handleUpdatePallet = useCallback((updated: PalletConfig) => {
    setPallet(updated);
    savePalletConfig(updated);
  }, []);

  // Container management handlers
  const handleSelectContainer = useCallback((container: ContainerDef) => {
    setActiveContainerId(container.id);
  }, []);

  const handleSaveContainer = useCallback((newCont: Omit<ContainerDef, 'id' | 'type'> & { id?: string }) => {
    const saved = saveCustomContainer(newCont);
    const updatedList = loadAllContainers();
    setContainers(updatedList);
    setActiveContainerId(saved.id);
  }, []);

  const handleDeleteContainer = useCallback((id: string) => {
    deleteCustomContainer(id);
    const updatedList = loadAllContainers();
    setContainers(updatedList);
    if (activeContainerId === id) {
      setActiveContainerId(updatedList[0]?.id || 'cont-20gp');
    }
  }, [activeContainerId]);

  const handleResetDefaults = useCallback(() => {
    resetContainersToDefault();
    const defaultList = loadAllContainers();
    setContainers(defaultList);
    setActiveContainerId(defaultList[0]?.id || 'cont-20gp');
  }, []);

  const handleResetCamera = useCallback(() => {
    setCameraPreset('iso');
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0f19] select-none">
      {/* Top Navigation Header */}
      <Header
        container={activeContainer}
        pallet={pallet}
        packingResult={packingResult}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenContainerManager={() => setIsContainerManagerOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
      />

      {/* Main Full-Bleed 3D Viewport */}
      <main className="absolute inset-0 pt-16 z-0">
        <ThreeScene
          container={activeContainer}
          packingResult={packingResult}
          viewMode={viewMode}
          showCoG={showCoG}
          doorsOpen={doorsOpen}
          visiblePalletCount={visiblePalletCount}
          cameraPreset={cameraPreset}
          selectedPallet={selectedPallet}
          onHoverPallet={setHoveredPallet}
          onSelectPallet={setSelectedPallet}
        />
      </main>

      {/* Collapsible Left Configuration Drawer */}
      <SidebarConfig
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        containers={containers}
        activeContainer={activeContainer}
        onSelectContainer={handleSelectContainer}
        pallet={pallet}
        onUpdatePallet={handleUpdatePallet}
        packingResult={packingResult}
        onOpenContainerManager={() => setIsContainerManagerOpen(true)}
        targetCount={targetCount}
        onTargetCountChange={setTargetCount}
      />

      {/* Sleek Collapsible Bottom Control Dock (Three.js skill directive) */}
      <ControlDock
        totalPallets={packingResult.totalPallets}
        visiblePalletCount={visiblePalletCount}
        onVisiblePalletChange={setVisiblePalletCount}
        cameraPreset={cameraPreset}
        onCameraPresetChange={setCameraPreset}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showCoG={showCoG}
        onToggleCoG={() => setShowCoG(!showCoG)}
        doorsOpen={doorsOpen}
        onToggleDoors={() => setDoorsOpen(!doorsOpen)}
        hoveredPallet={hoveredPallet}
        selectedPallet={selectedPallet}
        onResetCamera={handleResetCamera}
      />

      {/* Modal 1: Container Manager & Creator */}
      <ContainerManagerModal
        isOpen={isContainerManagerOpen}
        onClose={() => setIsContainerManagerOpen(false)}
        containers={containers}
        activeContainerId={activeContainerId}
        onSelectContainer={handleSelectContainer}
        onSaveContainer={handleSaveContainer}
        onDeleteContainer={handleDeleteContainer}
        onResetDefaults={handleResetDefaults}
      />

      {/* Modal 2: Packing Plan & Weight Balance Report Manifest */}
      <LoadPlanReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        container={activeContainer}
        pallet={pallet}
        packingResult={packingResult}
      />

      {/* Modal 3: Logistics Guidelines & User Guide */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
