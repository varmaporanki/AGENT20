import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import type { FacultyMember, DepartmentInfo } from '../../services/types';
import { ArrowRight, Compass, Users, Building2, LayoutDashboard, BookOpen, BotMessageSquare } from 'lucide-react';

interface HeroEcosystemProps {
  facultyList?: FacultyMember[];
  departments?: DepartmentInfo[];
  onSelectFaculty?: (empNo: string) => void;
  onSelectDepartment?: (code: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'faculty' | 'departments' | 'assistant' | 'methodology') => void;
  onOpenMethodology?: () => void;
  activeTab?: string;
}

export type NavNodeId = 'faculty' | 'departments' | 'dashboard' | 'methodology' | 'assistant' | 'core';

interface NavNodeDef {
  id: NavNodeId;
  destination: 'dashboard' | 'faculty' | 'departments' | 'assistant' | 'methodology';
  title: string;
  subtitle: string;
  actionText: string;
  pos: THREE.Vector3;
  color: number;
  hexColor: string;
  isCore?: boolean;
}

export const HeroEcosystem: React.FC<HeroEcosystemProps> = ({
  onNavigateTab,
  onOpenMethodology,
  activeTab = 'dashboard'
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const [webglError, setWebglError] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<NavNodeDef | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<NavNodeId | null>(null);
  const [nodeScreenCoords, setNodeScreenCoords] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});

  // 5 Distinct Navigation Diamonds + 1 Central Agent 20 Core (Deterministic Coordinates)
  const navNodes = useMemo<NavNodeDef[]>(() => [
    {
      id: 'core',
      destination: 'assistant',
      title: 'AGENT 20 AI',
      subtitle: 'Ask the research intelligence agent',
      actionText: 'Click to open →',
      pos: new THREE.Vector3(0, 0, 0),
      color: 0x3b82f6,
      hexColor: '#3b82f6',
      isCore: true
    },
    {
      id: 'faculty',
      destination: 'faculty',
      title: 'FACULTY ANALYTICS',
      subtitle: 'Performance • Rankings & Roster',
      actionText: 'Explore faculty metrics →',
      pos: new THREE.Vector3(0, 11.8, 1.5),
      color: 0x2563eb,
      hexColor: '#2563eb'
    },
    {
      id: 'departments',
      destination: 'departments',
      title: 'DEPARTMENT BENCHMARKING',
      subtitle: 'Discipline comparison & equity',
      actionText: 'Compare 4 departments →',
      pos: new THREE.Vector3(-16.0, -1.2, 1.0),
      color: 0x0ea5e9,
      hexColor: '#0ea5e9'
    },
    {
      id: 'dashboard',
      destination: 'dashboard',
      title: 'EXECUTIVE DASHBOARD',
      subtitle: 'Institution overview & KPIs',
      actionText: 'View institutional summary →',
      pos: new THREE.Vector3(-11.5, 9.0, -1.5),
      color: 0x10b981,
      hexColor: '#10b981'
    },
    {
      id: 'methodology',
      destination: 'methodology',
      title: 'SCORING METHODOLOGY',
      subtitle: 'Deterministic 0–100 model',
      actionText: 'Inspect formulas & weights →',
      pos: new THREE.Vector3(16.0, 0.5, 1.0),
      color: 0xf59e0b,
      hexColor: '#f59e0b'
    },
    {
      id: 'assistant',
      destination: 'assistant',
      title: 'RESEARCH INTELLIGENCE',
      subtitle: 'Ask Agent 20',
      actionText: 'Ask Agent 20 →',
      pos: new THREE.Vector3(0, -11.8, 1.5),
      color: 0x8b5cf6,
      hexColor: '#8b5cf6'
    }
  ], []);

  const handleTriggerNavigation = useCallback((node: NavNodeDef) => {
    setActiveNodeId(node.id);
    // Short transition under 400ms before triggering navigation
    setTimeout(() => {
      if (node.destination === 'methodology') {
        if (onOpenMethodology) {
          onOpenMethodology();
        } else {
          onNavigateTab('methodology');
        }
      } else {
        onNavigateTab(node.destination);
      }
      setActiveNodeId(null);
    }, 220);
  }, [onNavigateTab, onOpenMethodology]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf0f7ff, 0.010);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 42);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 3.5, 180);
    pointLight.position.set(0, 15, 28);
    scene.add(pointLight);

    const fillLight = new THREE.PointLight(0x93c5fd, 2.4, 140);
    fillLight.position.set(-25, -15, 20);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xdbeafe, 1.0);
    backLight.position.set(0, 25, 30);
    scene.add(backLight);

    // ========================================================================
    // 1. CENTRAL AGENT 20 CORE
    // ========================================================================
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 0, 0);

    // Inner Concentrated Micro-Core Sphere
    const innerCoreGeo = new THREE.SphereGeometry(1.3, 32, 32);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xbfdbfe,
      transparent: true,
      opacity: 0.9
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    coreGroup.add(innerCoreMesh);

    // Plasma Glowing Sphere
    const plasmaGeo = new THREE.SphereGeometry(2.3, 32, 32);
    const plasmaMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.55,
      roughness: 0.18,
      metalness: 0.6,
      transparent: true,
      opacity: 0.82
    });
    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    coreGroup.add(plasmaMesh);

    // Concentric Faceted Wireframe Shell 1
    const shellGeo1 = new THREE.IcosahedronGeometry(3.5, 1);
    const shellMat1 = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const shellMesh1 = new THREE.Mesh(shellGeo1, shellMat1);
    coreGroup.add(shellMesh1);

    // Concentric Wireframe Shell 2
    const shellGeo2 = new THREE.IcosahedronGeometry(4.4, 1);
    const shellMat2 = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const shellMesh2 = new THREE.Mesh(shellGeo2, shellMat2);
    coreGroup.add(shellMesh2);

    // Core Equatorial Ring 1
    const ringGeo1 = new THREE.TorusGeometry(5.0, 0.05, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.65
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 2.3;
    coreGroup.add(ringMesh1);

    // Core Equatorial Ring 2
    const ringGeo2 = new THREE.TorusGeometry(5.8, 0.04, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.4
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.y = Math.PI / 3;
    coreGroup.add(ringMesh2);

    // Raycasting collision hit sphere for Core
    const coreHitGeo = new THREE.SphereGeometry(4.8, 16, 16);
    const coreHitMat = new THREE.MeshBasicMaterial({ visible: false });
    const coreHitMesh = new THREE.Mesh(coreHitGeo, coreHitMat);
    coreHitMesh.userData = { isNode: true, nodeDef: navNodes[0] };
    coreGroup.add(coreHitMesh);

    scene.add(coreGroup);

    // ========================================================================
    // 2. FIVE NAVIGATION DIAMOND NODES
    // ========================================================================
    const interactiveMeshes: THREE.Object3D[] = [coreHitMesh];
    const nodeMeshesMap: Map<string, { group: THREE.Group; mainMesh: THREE.Mesh; wireMesh: THREE.Mesh; haloMesh: THREE.Mesh }> = new Map();

    const diamondGeo = new THREE.OctahedronGeometry(1.35, 0); // Faceted Diamond
    const diamondWireGeo = new THREE.OctahedronGeometry(1.85, 0);
    const nodeHaloGeo = new THREE.TorusGeometry(2.3, 0.035, 12, 48);

    navNodes.forEach(node => {
      if (node.isCore) return;

      const nodeGroup = new THREE.Group();
      nodeGroup.position.copy(node.pos);

      // Solid Faceted Diamond Mesh
      const diamondMat = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.28,
        roughness: 0.2,
        metalness: 0.7,
        flatShading: true
      });
      const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
      nodeGroup.add(diamondMesh);

      // Wireframe Cage around Diamond
      const wireMat = new THREE.MeshBasicMaterial({
        color: node.color,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });
      const wireMesh = new THREE.Mesh(diamondWireGeo, wireMat);
      nodeGroup.add(wireMesh);

      // Orbiting Halo Ring
      const haloMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.35
      });
      const haloMesh = new THREE.Mesh(nodeHaloGeo, haloMat);
      haloMesh.rotation.x = Math.PI / 2.5;
      nodeGroup.add(haloMesh);

      // Raycast Hit Collider for Diamond
      const hitGeo = new THREE.SphereGeometry(2.8, 12, 12);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = { isNode: true, nodeDef: node };
      nodeGroup.add(hitMesh);

      scene.add(nodeGroup);

      interactiveMeshes.push(hitMesh);
      nodeMeshesMap.set(node.id, {
        group: nodeGroup,
        mainMesh: diamondMesh,
        wireMesh,
        haloMesh
      });
    });

    // ========================================================================
    // 3. GLOBAL ORBITAL RINGS & CONSTELLATION BACKDROP
    // ========================================================================
    const globalRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(17.5, 0.05, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.28 })
    );
    globalRing1.rotation.x = Math.PI / 2.4;
    scene.add(globalRing1);

    const globalRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(22.0, 0.04, 16, 140),
      new THREE.MeshBasicMaterial({ color: 0xbfdbfe, transparent: true, opacity: 0.18 })
    );
    globalRing2.rotation.y = Math.PI / 3.5;
    scene.add(globalRing2);

    // Connecting Lines from Center Core to Navigation Nodes
    navNodes.forEach(node => {
      if (node.isCore) return;
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        node.pos
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.3,
        dashSize: 0.6,
        gapSize: 0.4
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      scene.add(line);
    });

    // Ambient background dust particles
    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.sin(i * 1.7) * 45);
      particlePositions[i * 3 + 1] = (Math.cos(i * 2.3) * 35);
      particlePositions[i * 3 + 2] = (Math.sin(i * 3.1) * 20) - 10;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.45,
      transparent: true,
      opacity: 0.35
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ========================================================================
    // 4. INTERACTION, RAYCASTING & PARALLAX
    // ========================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-100, -100);
    const targetCameraPos = new THREE.Vector3(0, 0, 42);
    let activeHoveredNodeDef: NavNodeDef | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.x = x;
      mouse.y = y;

      // Subtle, controlled camera parallax
      targetCameraPos.x = x * 4.5;
      targetCameraPos.y = y * 3.2;

      pointLight.position.x = x * 12;
      pointLight.position.y = 15 + y * 8;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const nodeDef = hit.userData.nodeDef as NavNodeDef;
        if (nodeDef) {
          activeHoveredNodeDef = nodeDef;
          setHoveredNode(nodeDef);
          container.style.cursor = 'pointer';
        }
      } else {
        activeHoveredNodeDef = null;
        setHoveredNode(null);
        container.style.cursor = 'default';
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const nodeDef = hit.userData.nodeDef as NavNodeDef;
        if (nodeDef) {
          handleTriggerNavigation(nodeDef);
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.x = x;
      mouse.y = y;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const nodeDef = hit.userData.nodeDef as NavNodeDef;
        if (nodeDef) {
          handleTriggerNavigation(nodeDef);
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);
    container.addEventListener('touchstart', onTouchStart, { passive: true });

    // ========================================================================
    // 5. ANIMATION LOOP
    // ========================================================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Camera parallax interpolation
      camera.position.lerp(targetCameraPos, 0.045);
      camera.lookAt(0, 0, 0);

      // Core rotation & multi-frequency pulse
      const isCoreHovered = activeHoveredNodeDef?.id === 'core';
      const isCoreActive = activeTabRef.current === 'assistant' || activeNodeId === 'core';
      const coreSpeed = isCoreHovered ? 0.22 : (isCoreActive ? 0.14 : 0.08);
      coreGroup.rotation.y = elapsedTime * coreSpeed;
      coreGroup.rotation.x = Math.sin(elapsedTime * 0.06) * 0.07;
      shellMesh1.rotation.y = -elapsedTime * (coreSpeed * 1.5);
      shellMesh2.rotation.x = elapsedTime * (coreSpeed * 1.2);
      ringMesh1.rotation.z = elapsedTime * 0.18;
      ringMesh2.rotation.z = -elapsedTime * 0.14;

      // Pulse core
      const coreTargetScale = isCoreHovered ? 1.16 : (isCoreActive ? 1.09 : 1.0);
      coreGroup.scale.lerp(new THREE.Vector3(coreTargetScale, coreTargetScale, coreTargetScale), 0.08);
      plasmaMat.emissiveIntensity = isCoreHovered ? 0.95 : (isCoreActive ? 0.78 : (0.55 + Math.sin(elapsedTime * 2.2) * 0.14));

      // Rotate each Diamond navigation node
      nodeMeshesMap.forEach((entry, id) => {
        const isHovered = activeHoveredNodeDef?.id === id;
        const isActive = activeTabRef.current === id || activeNodeId === id;
        const targetScale = isHovered ? 1.30 : (isActive ? 1.14 : 1.0);
        entry.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.09);

        // Rotation
        entry.mainMesh.rotation.y = elapsedTime * (isActive ? 0.8 : 0.6);
        entry.mainMesh.rotation.x = Math.sin(elapsedTime * 0.8) * 0.2;
        entry.wireMesh.rotation.y = -elapsedTime * 0.8;
        entry.haloMesh.rotation.z = elapsedTime * 0.5;

        const mat = entry.mainMesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = isHovered ? 0.95 : (isActive ? 0.65 : (0.28 + Math.sin(elapsedTime * 2.0) * 0.08));
      });

      // Rotate Global Rings
      globalRing1.rotation.z = elapsedTime * 0.022;
      globalRing2.rotation.z = -elapsedTime * 0.016;

      // Screen-space 2D Projector for Floating Labels
      const coords: Record<string, { x: number; y: number; visible: boolean }> = {};
      const tempVec = new THREE.Vector3();

      navNodes.forEach(node => {
        tempVec.copy(node.pos);
        tempVec.project(camera);

        // Check if in front of camera (-1 <= z <= 1)
        const isVisible = tempVec.z < 1.0;
        const screenX = (tempVec.x * 0.5 + 0.5) * width;
        const screenY = (-tempVec.y * 0.5 + 0.5) * height;

        coords[node.id] = {
          x: screenX,
          y: screenY,
          visible: isVisible
        };
      });
      setNodeScreenCoords(coords);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      container.removeEventListener('touchstart', onTouchStart);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [navNodes, handleTriggerNavigation]);

  if (webglError) {
    return (
      <div className="webgl-fallback-card">
        <Compass size={24} color="#2563eb" />
        <p>Interactive 3D navigation is unavailable. Please use the navigation bar above.</p>
      </div>
    );
  }

  return (
    <div className="spatial-ecosystem-wrapper">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        className="spatial-canvas-viewport"
        style={{
          width: '100%',
          height: 480,
          position: 'relative',
          overflow: 'hidden'
        }}
      />

      {/* ================================================================== */}
      {/* SCREEN-PROJECTED FLOATING HTML LABELS (Track 3D Coordinates)       */}
      {/* ================================================================== */}
      <div className="spatial-projected-layer" aria-hidden="true">
        {navNodes.map(node => {
          const coords = nodeScreenCoords[node.id];
          if (!coords || !coords.visible) return null;

          const isHovered = hoveredNode?.id === node.id;
          const isActive = activeTab === node.destination || activeNodeId === node.id;

          return (
            <div
              key={node.id}
              className={`floating-spatial-node ${node.isCore ? 'core-node' : 'diamond-node'} ${isHovered ? 'hovered' : ''} ${isActive ? 'active' : ''}`}
              style={{
                transform: `translate(${coords.x}px, ${coords.y}px) translate(-50%, -50%)`,
                borderColor: isHovered || isActive ? node.hexColor : 'rgba(203, 213, 225, 0.6)'
              }}
              onClick={() => handleTriggerNavigation(node)}
            >
              <div className="floating-node-pill" style={{ color: node.hexColor }}>
                <span className="floating-node-dot" style={{ background: node.hexColor }} />
                <span className="floating-node-title">{node.title}</span>
              </div>
              <div className="floating-node-sub">{node.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* ACTIVE NODE DYNAMIC TOOLTIP HUD                                    */}
      {/* ================================================================== */}
      {hoveredNode && (
        <div
          className="spatial-hud-tooltip glass-panel"
          style={{
            borderColor: hoveredNode.hexColor,
            boxShadow: `0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 0 16px ${hoveredNode.hexColor}22`
          }}
        >
          <div className="hud-badge" style={{ color: hoveredNode.hexColor }}>
            <Compass size={12} />
            <span>3D SPATIAL NAVIGATION NODE</span>
          </div>
          <div className="hud-title">{hoveredNode.title}</div>
          <div className="hud-subtitle">{hoveredNode.subtitle}</div>
          <div className="hud-action" style={{ color: hoveredNode.hexColor }}>
            <span>{hoveredNode.actionText}</span>
            <ArrowRight size={13} />
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* ACCESSIBILITY: DOM Equivalents for Keyboard Focus & Screenreaders */}
      {/* ================================================================== */}
      <nav aria-label="3D Ecosystem Spatial Navigation" className="spatial-accessibility-dock">
        <span className="sr-only">3D Spatial Navigation Shortcuts:</span>
        {navNodes.map(node => (
          <button
            key={node.id}
            onClick={() => handleTriggerNavigation(node)}
            aria-label={`Navigate to ${node.title}: ${node.subtitle}`}
            className={`spatial-access-btn ${hoveredNode?.id === node.id ? 'focused' : ''}`}
            style={{ borderColor: node.hexColor }}
          >
            {node.id === 'faculty' && <Users size={12} />}
            {node.id === 'departments' && <Building2 size={12} />}
            {node.id === 'dashboard' && <LayoutDashboard size={12} />}
            {node.id === 'methodology' && <BookOpen size={12} />}
            {(node.id === 'assistant' || node.id === 'core') && <BotMessageSquare size={12} />}
            <span>{node.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
