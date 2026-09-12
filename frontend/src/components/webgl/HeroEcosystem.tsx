import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import type { FacultyMember, DepartmentInfo } from '../../services/types';
import { Info, Eye, Sparkles } from 'lucide-react';

interface HeroEcosystemProps {
  facultyList: FacultyMember[];
  departments: DepartmentInfo[];
  onSelectFaculty: (empNo: string) => void;
  onSelectDepartment: (code: string) => void;
}

interface TooltipData {
  x: number;
  y: number;
  type: 'faculty' | 'department';
  title: string;
  subtitle: string;
  score: number;
  statA: string;
  statB: string;
}

export const HeroEcosystem: React.FC<HeroEcosystemProps> = ({
  facultyList,
  departments,
  onSelectFaculty,
  onSelectDepartment
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  // Department cluster coordinates in 3D space
  const deptPositions = useMemo<Record<string, THREE.Vector3>>(() => ({
    CSE: new THREE.Vector3(-14, 5, 0),
    BIO: new THREE.Vector3(14, 6, -2),
    MECH: new THREE.Vector3(-12, -7, 2),
    HSS: new THREE.Vector3(13, -6, 0)
  }), []);

  const deptColors = useMemo<Record<string, number>>(() => ({
    CSE: 0x2563eb,   // Royal Blue
    BIO: 0x10b981,   // Emerald Green
    MECH: 0x0ea5e9,  // Cyan/Tech Blue
    HSS: 0xf59e0b    // Amber/Gold
  }), []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
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
    // Atmospheric scientific fog (distant objects gently fade into pale blue)
    scene.fog = new THREE.FogExp2(0xf0f7ff, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Camera closer to frame the 3D core prominently
    camera.position.set(0, 0, 42);

    // Multi-Layer Point & Directional Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    // Dynamic primary specular point-light that tracks mouse
    const pointLight = new THREE.PointLight(0x3b82f6, 3.2, 160);
    pointLight.position.set(0, 14, 25);
    scene.add(pointLight);

    // Complementary soft azure fill light
    const fillLight = new THREE.PointLight(0x93c5fd, 2.2, 120);
    fillLight.position.set(-22, -12, 18);
    scene.add(fillLight);

    // Counter rim light for edge definition
    const rimLight = new THREE.PointLight(0x60a5fa, 1.8, 100);
    rimLight.position.set(22, 18, -10);
    scene.add(rimLight);

    // Directional backlight for volumetric sheen
    const backLight = new THREE.DirectionalLight(0xbfdbfe, 0.9);
    backLight.position.set(0, 25, 30);
    scene.add(backLight);

    // 1. Central Institutional Research Core (Visual Centerpiece: 6-tier multilayer 3D structure)
    const coreGroup = new THREE.Group();
    
    // Layer 1A: Inner Concentrated Micro-Core Pulse
    const innerPulseGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const innerPulseMat = new THREE.MeshBasicMaterial({
      color: 0xbfdbfe,
      transparent: true,
      opacity: 0.85
    });
    const innerPulseMesh = new THREE.Mesh(innerPulseGeo, innerPulseMat);
    coreGroup.add(innerPulseMesh);

    // Layer 1B: Inner Glowing Plasma Sphere
    const innerGlowGeo = new THREE.SphereGeometry(2.0, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.52
    });
    const innerGlowMesh = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    coreGroup.add(innerGlowMesh);

    // Layer 2: Faceted Deep Obsidian Icosahedron Core (Responds to light with specular gem reflections)
    const coreGeo = new THREE.IcosahedronGeometry(3.1, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x07152b,
      roughness: 0.16,
      metalness: 0.90,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.40,
      flatShading: true
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Layer 3: Counter-Rotating Geodesic Wireframe Shell
    const wireGeo = new THREE.IcosahedronGeometry(4.15, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.52
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    // Layer 4A: Concentric Equator Ring 1 (Tilted axis)
    const equatorGeo1 = new THREE.TorusGeometry(5.1, 0.042, 16, 120);
    const equatorMat1 = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.65
    });
    const equatorMesh1 = new THREE.Mesh(equatorGeo1, equatorMat1);
    equatorMesh1.rotation.x = Math.PI / 2.35;
    coreGroup.add(equatorMesh1);

    // Layer 4B: Concentric Equator Ring 2 (Opposite tilt)
    const equatorGeo2 = new THREE.TorusGeometry(6.2, 0.032, 16, 120);
    const equatorMat2 = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.50
    });
    const equatorMesh2 = new THREE.Mesh(equatorGeo2, equatorMat2);
    equatorMesh2.rotation.x = -Math.PI / 3.1;
    equatorMesh2.rotation.z = Math.PI / 5.5;
    coreGroup.add(equatorMesh2);

    // Layer 4C: Concentric Equator Ring 3 (Interlocking coordinate orbit)
    const equatorGeo3 = new THREE.TorusGeometry(7.3, 0.024, 16, 120);
    const equatorMat3 = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.38
    });
    const equatorMesh3 = new THREE.Mesh(equatorGeo3, equatorMat3);
    equatorMesh3.rotation.y = Math.PI / 3.8;
    equatorMesh3.rotation.x = Math.PI / 6;
    coreGroup.add(equatorMesh3);

    // Layer 5: Outer Energy Field Halo
    const outerHaloGeo = new THREE.TorusGeometry(8.5, 0.018, 16, 120);
    const outerHaloMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.28
    });
    const outerHaloMesh = new THREE.Mesh(outerHaloGeo, outerHaloMat);
    outerHaloMesh.rotation.y = Math.PI / 4;
    coreGroup.add(outerHaloMesh);

    scene.add(coreGroup);

    // Global Orbital Latitude Rings (Expansive scientific coordinate lines)
    const orbitalRingGeo1 = new THREE.TorusGeometry(22, 0.036, 16, 140);
    const orbitalRingMat1 = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.30
    });
    const orbitalRing1 = new THREE.Mesh(orbitalRingGeo1, orbitalRingMat1);
    orbitalRing1.rotation.x = Math.PI / 3.2;
    orbitalRing1.rotation.y = Math.PI / 8;
    scene.add(orbitalRing1);

    const orbitalRingGeo2 = new THREE.TorusGeometry(30, 0.026, 16, 140);
    const orbitalRingMat2 = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.22
    });
    const orbitalRing2 = new THREE.Mesh(orbitalRingGeo2, orbitalRingMat2);
    orbitalRing2.rotation.x = -Math.PI / 3.8;
    orbitalRing2.rotation.y = -Math.PI / 5.5;
    scene.add(orbitalRing2);

    const orbitalRingGeo3 = new THREE.TorusGeometry(38, 0.018, 16, 140);
    const orbitalRingMat3 = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.16
    });
    const orbitalRing3 = new THREE.Mesh(orbitalRingGeo3, orbitalRingMat3);
    orbitalRing3.rotation.z = Math.PI / 4.2;
    scene.add(orbitalRing3);

    // 2. Department Clusters & Faculty Nodes (When Real Data Exists)
    // OR Abstract Research Network (When Real Data Is Unavailable)
    const interactiveObjects: THREE.Object3D[] = [];
    const deptMeshMap = new Map<string, THREE.Mesh>();
    const facultyMeshMap = new Map<string, THREE.Mesh>();
    const abstractMeshes: THREE.Object3D[] = [];
    const filamentLines: THREE.Line[] = [];

    const hasRealData = departments.length > 0 || facultyList.length > 0;

    if (hasRealData) {
      departments.forEach(dept => {
        const pos = deptPositions[dept.code] || new THREE.Vector3(0, 0, 0);
        const color = deptColors[dept.code] || 0x2563eb;

        // Department Hub Sphere
        const deptGeo = new THREE.SphereGeometry(2.1, 36, 36);
        const deptMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.25,
          metalness: 0.45,
          emissive: color,
          emissiveIntensity: 0.25
        });
        const deptMesh = new THREE.Mesh(deptGeo, deptMat);
        deptMesh.position.copy(pos);
        deptMesh.userData = {
          type: 'department',
          code: dept.code,
          name: dept.name,
          score: dept.mean_score,
          facultyCount: dept.faculty_count,
          q1Pct: dept.q1_percentage,
          baseScale: 1.0,
          targetScale: 1.0
        };
        scene.add(deptMesh);
        interactiveObjects.push(deptMesh);
        deptMeshMap.set(dept.code, deptMesh);

        // Thin Halo Ring around Department Hub
        const hubRingGeo = new THREE.TorusGeometry(2.7, 0.02, 16, 60);
        const hubRingMat = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.35
        });
        const hubRing = new THREE.Mesh(hubRingGeo, hubRingMat);
        hubRing.position.copy(pos);
        hubRing.rotation.x = Math.PI / 2;
        scene.add(hubRing);

        // Line connecting Core to Department
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          pos
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.28
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
        filamentLines.push(line);
      });

      // Add Faculty Nodes surrounding their respective department hub
      facultyList.forEach((fac, idx) => {
        const basePos = deptPositions[fac.department] || new THREE.Vector3(0, 0, 0);
        const color = deptColors[fac.department] || 0x2563eb;

        // Position faculty nodes in an organic cluster around department center
        const angle = (idx * (Math.PI * 2 / 6)) + (idx * 0.4);
        const radius = 3.6 + ((idx % 3) * 1.5);
        const zOffset = ((idx % 4) - 2) * 1.8;

        const fX = basePos.x + Math.cos(angle) * radius;
        const fY = basePos.y + Math.sin(angle) * radius;
        const fZ = basePos.z + zOffset;

        // Node size scaled by actual final score
        const scoreVal = fac.final_score !== null && fac.final_score !== undefined ? fac.final_score : 0;
        const radiusSize = 0.42 + (scoreVal / 100) * 0.68;
        const facGeo = new THREE.SphereGeometry(radiusSize, 28, 28);
        const facMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.3,
          metalness: 0.35,
          emissive: color,
          emissiveIntensity: scoreVal > 70 ? 0.38 : 0.12
        });

        const facMesh = new THREE.Mesh(facGeo, facMat);
        facMesh.position.set(fX, fY, fZ);
        facMesh.userData = {
          type: 'faculty',
          employee_no: fac.employee_no,
          name: fac.name,
          department: fac.department,
          designation: fac.designation,
          score: fac.final_score,
          rank: fac.rank_institution,
          deptRank: fac.rank_within_department,
          pubs: fac.raw_metrics?.total_pubs ?? null,
          citations: fac.raw_metrics?.cits_latest ?? null,
          baseScale: 1.0,
          targetScale: 1.0
        };

        scene.add(facMesh);
        interactiveObjects.push(facMesh);
        facultyMeshMap.set(fac.employee_no, facMesh);

        // Delicate filament from Department Hub to Faculty node
        const facLineGeo = new THREE.BufferGeometry().setFromPoints([
          basePos,
          new THREE.Vector3(fX, fY, fZ)
        ]);
        const facLineMat = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.2
        });
        const facLine = new THREE.Line(facLineGeo, facLineMat);
        scene.add(facLine);
        filamentLines.push(facLine);
      });
    } else {
      // Sophisticated Neutral Academic Gyroscope (No fake faculty or department identities)
      const ringConfig = [
        { radius: 12.5, tube: 0.045, rotX: Math.PI / 3, rotY: 0, color: 0x2563eb, op: 0.35 },
        { radius: 17.5, tube: 0.038, rotX: -Math.PI / 4, rotY: Math.PI / 5, color: 0x3b82f6, op: 0.28 },
        { radius: 22.0, tube: 0.032, rotX: Math.PI / 6, rotY: -Math.PI / 3, color: 0x60a5fa, op: 0.2 }
      ];

      ringConfig.forEach(cfg => {
        const ringGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 120);
        const ringMat = new THREE.MeshBasicMaterial({
          color: cfg.color,
          transparent: true,
          opacity: cfg.op
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = cfg.rotX;
        ring.rotation.y = cfg.rotY;
        scene.add(ring);
        abstractMeshes.push(ring);
      });

      // Abstract geometric coordinate nodes
      const neutralNodePositions = [
        new THREE.Vector3(-14, 6, 0),
        new THREE.Vector3(14, 7, -2),
        new THREE.Vector3(-12, -7, 2),
        new THREE.Vector3(13, -6, 0),
        new THREE.Vector3(0, 12, -4),
        new THREE.Vector3(0, -12, 3)
      ];

      neutralNodePositions.forEach(pos => {
        const nodeGroup = new THREE.Group();
        nodeGroup.position.copy(pos);

        const nodeGeo = new THREE.OctahedronGeometry(1.3, 0);
        const nodeMat = new THREE.MeshStandardMaterial({
          color: 0x93c5fd,
          roughness: 0.3,
          metalness: 0.7,
          wireframe: true
        });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeGroup.add(nodeMesh);

        // Center dot
        const dotGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const dotMat = new THREE.MeshBasicMaterial({
          color: 0x3b82f6,
          transparent: true,
          opacity: 0.8
        });
        const dotMesh = new THREE.Mesh(dotGeo, dotMat);
        nodeGroup.add(dotMesh);

        scene.add(nodeGroup);
        abstractMeshes.push(nodeGroup);

        // Delicate filament connecting to core
        const filamentGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          pos
        ]);
        const filamentMat = new THREE.LineBasicMaterial({
          color: 0x93c5fd,
          transparent: true,
          opacity: 0.2
        });
        const filament = new THREE.Line(filamentGeo, filamentMat);
        scene.add(filament);
        abstractMeshes.push(filament);
      });
    }

    // 3. True 3D Depth Particle Planes (Deterministic trigonometric hash — strictly NO Math.random)
    // Foreground plane: large, close to camera, passing near viewer
    const fgCount = 48;
    const fgGeo = new THREE.BufferGeometry();
    const fgPos = new Float32Array(fgCount * 3);
    for (let i = 0; i < fgCount * 3; i += 3) {
      const sx = Math.sin((i + 1) * 17.182) * 43758.5453;
      const sy = Math.sin((i + 2) * 23.456) * 43758.5453;
      const sz = Math.sin((i + 3) * 31.789) * 43758.5453;
      fgPos[i] = ((sx - Math.floor(sx)) - 0.5) * 65;
      fgPos[i + 1] = ((sy - Math.floor(sy)) - 0.5) * 38;
      fgPos[i + 2] = 14 + (sz - Math.floor(sz)) * 20; // z: 14 to 34 (passes in foreground of camera at z:42)
    }
    fgGeo.setAttribute('position', new THREE.BufferAttribute(fgPos, 3));
    const fgMat = new THREE.PointsMaterial({
      color: 0xdbeafe,
      size: 1.8,
      transparent: true,
      opacity: 0.78
    });
    const fgParticles = new THREE.Points(fgGeo, fgMat);
    scene.add(fgParticles);

    // Midground plane: interactive focus region
    const mgCount = 220;
    const mgGeo = new THREE.BufferGeometry();
    const mgPos = new Float32Array(mgCount * 3);
    for (let i = 0; i < mgCount * 3; i += 3) {
      const sx = Math.sin((i + 1) * 12.9898) * 43758.5453;
      const sy = Math.sin((i + 2) * 78.233) * 43758.5453;
      const sz = Math.sin((i + 3) * 45.164) * 43758.5453;
      mgPos[i] = ((sx - Math.floor(sx)) - 0.5) * 88;
      mgPos[i + 1] = ((sy - Math.floor(sy)) - 0.5) * 54;
      mgPos[i + 2] = -8 + (sz - Math.floor(sz)) * 24; // z: -8 to 16
    }
    mgGeo.setAttribute('position', new THREE.BufferAttribute(mgPos, 3));
    const mgMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.85,
      transparent: true,
      opacity: 0.52
    });
    const mgParticles = new THREE.Points(mgGeo, mgMat);
    scene.add(mgParticles);

    // Background star field: distant deep universe
    const bgCount = 400;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgCount * 3);
    for (let i = 0; i < bgCount * 3; i += 3) {
      const sx = Math.sin((i + 1) * 53.123) * 43758.5453;
      const sy = Math.sin((i + 2) * 91.827) * 43758.5453;
      const sz = Math.sin((i + 3) * 64.391) * 43758.5453;
      bgPos[i] = ((sx - Math.floor(sx)) - 0.5) * 115;
      bgPos[i + 1] = ((sy - Math.floor(sy)) - 0.5) * 75;
      bgPos[i + 2] = -55 + (sz - Math.floor(sz)) * 40; // z: -55 to -15
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    const bgMat = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.42,
      transparent: true,
      opacity: 0.35
    });
    const bgParticles = new THREE.Points(bgGeo, bgMat);
    scene.add(bgParticles);

    // Raycasting & Mouse Parallax
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-100, -100);
    const targetCameraPos = new THREE.Vector3(0, 0, 42);
    let currentlyHoveredObject: THREE.Object3D | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.x = x;
      mouse.y = y;

      // Noticeable and clearly perceptible parallax shift (controlled with smooth damping)
      targetCameraPos.x = x * 7.5;
      targetCameraPos.y = y * 5.0;

      // Dynamic specular light tracking following mouse position across the 3D core
      pointLight.position.x = x * 18;
      pointLight.position.y = 14 + y * 12;
      pointLight.position.z = 25 + Math.abs(x) * 6;

      // Fill light responds counter to create dynamic relief lighting
      fillLight.position.x = -22 - x * 8;
      fillLight.position.y = -12 - y * 6;

      // Raycast for hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const data = hit.userData;

        if (currentlyHoveredObject && currentlyHoveredObject !== hit) {
          currentlyHoveredObject.userData.targetScale = 1.0;
          const prevMat = (currentlyHoveredObject as THREE.Mesh).material;
          if (prevMat && 'emissiveIntensity' in prevMat) {
            (prevMat as any).emissiveIntensity = currentlyHoveredObject.userData.baseEmissive || 0.25;
          }
        }
        currentlyHoveredObject = hit;
        hit.userData.targetScale = 1.32;
        if (!hit.userData.baseEmissive && hit.material && 'emissiveIntensity' in hit.material) {
          hit.userData.baseEmissive = (hit.material as any).emissiveIntensity;
        }
        if (hit.material && 'emissiveIntensity' in hit.material) {
          (hit.material as any).emissiveIntensity = 0.85; // Visibly brighten node on hover!
        }

        // Position tooltip
        const screenX = Math.min(Math.max(e.clientX - rect.left, 130), rect.width - 130);
        const screenY = e.clientY - rect.top;

        if (data.type === 'faculty') {
          setHoveredDept(null);
          setTooltip({
            x: screenX,
            y: screenY,
            type: 'faculty',
            title: data.name,
            subtitle: `${(data.designation || '').replace('_', ' ')} • ${data.department}`,
            score: data.score,
            statA: data.rank != null ? `Inst Rank: #${data.rank} (Dept #${data.deptRank})` : 'Rank pending',
            statB: data.pubs != null ? `${data.pubs} Pubs • ${data.citations ?? 0} Citations` : 'Metrics pending'
          });
          container.style.cursor = 'pointer';
        } else if (data.type === 'department') {
          setHoveredDept(data.code);
          setTooltip({
            x: screenX,
            y: screenY,
            type: 'department',
            title: data.name,
            subtitle: `Department Code: ${data.code}`,
            score: data.score,
            statA: data.facultyCount != null ? `Faculty Count: ${data.facultyCount}` : 'Faculty count pending',
            statB: data.q1Pct != null ? `Q1 Venue Share: ${data.q1Pct}%` : 'Venue share pending'
          });
          container.style.cursor = 'pointer';
        }
      } else {
        if (currentlyHoveredObject) {
          currentlyHoveredObject.userData.targetScale = 1.0;
          const prevMat = (currentlyHoveredObject as THREE.Mesh).material;
          if (prevMat && 'emissiveIntensity' in prevMat) {
            (prevMat as any).emissiveIntensity = currentlyHoveredObject.userData.baseEmissive || 0.25;
          }
          currentlyHoveredObject = null;
        }
        setTooltip(null);
        setHoveredDept(null);
        container.style.cursor = 'default';
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const data = hit.userData;
        if (data.type === 'faculty') {
          onSelectFaculty(data.employee_no);
        } else if (data.type === 'department') {
          onSelectDepartment(data.code);
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera lerp (Controlled Parallax)
      camera.position.lerp(targetCameraPos, 0.048);
      camera.lookAt(targetCameraPos.x * 0.12, targetCameraPos.y * 0.12, 0);

      // Core rotation with subtle oscillation (Multi-frequency movements)
      coreGroup.rotation.y = elapsedTime * 0.08;
      coreGroup.rotation.x = Math.sin(elapsedTime * 0.06) * 0.08;
      wireMesh.rotation.y = -elapsedTime * 0.12;
      wireMesh.rotation.z = Math.cos(elapsedTime * 0.08) * 0.07;
      equatorMesh1.rotation.z = -elapsedTime * 0.15;
      equatorMesh2.rotation.z = elapsedTime * 0.12;
      equatorMesh3.rotation.x = elapsedTime * 0.09;
      outerHaloMesh.rotation.x = elapsedTime * 0.05;

      // Pulse core, micro-core and inner glow
      innerPulseMesh.scale.setScalar(1.0 + Math.sin(elapsedTime * 2.4) * 0.08);
      innerGlowMat.opacity = 0.45 + Math.sin(elapsedTime * 2.0) * 0.16;
      coreMat.emissiveIntensity = 0.36 + Math.sin(elapsedTime * 1.5) * 0.12;
      pointLight.intensity = 3.0 + Math.sin(elapsedTime * 1.6) * 0.6;

      // Rotate Global Orbital Rings at different speeds
      orbitalRing1.rotation.z = elapsedTime * 0.028;
      orbitalRing2.rotation.z = -elapsedTime * 0.020;
      orbitalRing3.rotation.z = elapsedTime * 0.015;

      // Multi-plane parallax particle rotation & slow depth drift
      fgParticles.rotation.y = elapsedTime * 0.024;
      fgParticles.rotation.x = Math.sin(elapsedTime * 0.04) * 0.04;
      mgParticles.rotation.y = -elapsedTime * 0.015;
      bgParticles.rotation.y = elapsedTime * 0.007;

      // Rotate neutral abstract geometry if in unconnected mode
      abstractMeshes.forEach((item, i) => {
        if (item instanceof THREE.Mesh && item.geometry instanceof THREE.TorusGeometry) {
          item.rotation.z = elapsedTime * (0.02 * (i + 1));
        } else if (item instanceof THREE.Group) {
          item.rotation.y = elapsedTime * 0.25;
          item.rotation.x = Math.sin(elapsedTime * 0.4 + i) * 0.18;
        }
      });

      // Smooth interactive scaling interpolation on hover
      interactiveObjects.forEach(obj => {
        const target = obj.userData.targetScale || 1.0;
        obj.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
      });

      // Subtle organic floating on department hubs
      departments.forEach(d => {
        const mesh = deptMeshMap.get(d.code);
        if (mesh) {
          const originalPos = deptPositions[d.code] || new THREE.Vector3(0, 0, 0);
          mesh.position.y = originalPos.y + Math.sin(elapsedTime * 0.75 + mesh.position.x) * 0.18;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', onResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      cancelAnimationFrame(animationFrameId);

      // Dispose Three.js resources
      renderer.dispose();
      innerPulseGeo.dispose();
      innerPulseMat.dispose();
      innerGlowGeo.dispose();
      innerGlowMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      equatorGeo1.dispose();
      equatorMat1.dispose();
      equatorGeo2.dispose();
      equatorMat2.dispose();
      equatorGeo3.dispose();
      equatorMat3.dispose();
      outerHaloGeo.dispose();
      outerHaloMat.dispose();
      orbitalRingGeo1.dispose();
      orbitalRingMat1.dispose();
      orbitalRingGeo2.dispose();
      orbitalRingMat2.dispose();
      orbitalRingGeo3.dispose();
      orbitalRingMat3.dispose();
      fgGeo.dispose();
      fgMat.dispose();
      mgGeo.dispose();
      mgMat.dispose();
      bgGeo.dispose();
      bgMat.dispose();

      [...interactiveObjects, ...abstractMeshes].forEach(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [facultyList, departments, deptPositions, deptColors, onSelectFaculty, onSelectDepartment]);

  const hasRealData = departments.length > 0 || facultyList.length > 0;

  return (
    <div className="hero-webgl-wrapper" ref={mountRef}>
      {/* Graceful 2D Fallback if WebGL fails */}
      {webglError && (
        <div style={{ padding: 40, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Info size={32} color="#2563eb" />
          <h3 style={{ marginTop: 12 }}>Interactive 2D Research Topology</h3>
          <p style={{ color: '#64748b', fontSize: 13, maxWidth: 500, marginTop: 6 }}>
            {hasRealData
              ? 'WebGL hardware acceleration is unavailable in your browser environment. Displaying 2D department cluster topology.'
              : 'Connect the research data service to explore institutional analytics.'}
          </p>
          {hasRealData && (
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              {departments.map(d => (
                <button
                  key={d.code}
                  onClick={() => onSelectDepartment(d.code)}
                  className="chip-btn"
                  style={{ padding: '8px 16px' }}
                >
                  {d.name} ({d.mean_score != null ? d.mean_score : '—'})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating 2D Overlay Elements */}
      <div className="hero-overlay">
        <div className="hero-header-text">
          <div className="hero-badge-live">
            <span className="pulse-dot" />
            <span>
              {hasRealData
                ? (hoveredDept ? `Focus: ${hoveredDept} Department Cluster` : 'Interactive Research Ecosystem')
                : 'Research intelligence ecosystem'}
            </span>
          </div>
          <h1 className="hero-title">
            Research intelligence,<br />explained.
          </h1>
          <p className="hero-subtitle">
            {hasRealData
              ? 'Continuous 0–100 multi-pillar benchmarking with discipline-aware equity, career-stage startup recognition, and instructional workload adjustments.'
              : 'Connect the research data service to explore institutional analytics.'}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: '#475569', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
              {hasRealData ? (
                <>
                  <Eye size={13} color="#2563eb" />
                  <span>Hover nodes to inspect • Click to open dossier</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} color="#2563eb" />
                  <span>Institutional Core Active • Awaiting API connection</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Floating Tooltip in WebGL Canvas - Frosted Glass HUD */}
        {tooltip && (
          <div
            className="webgl-tooltip"
            style={{
              left: tooltip.x,
              top: tooltip.y
            }}
          >
            <div className="tooltip-title">{tooltip.title}</div>
            <div style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 6 }}>{tooltip.subtitle}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span className="tooltip-stat">{tooltip.statA}</span>
              <span style={{ fontWeight: 800, color: '#60a5fa', fontSize: 14, fontFamily: 'var(--font-display)' }}>
                {tooltip.score != null ? `${tooltip.score} / 100` : 'Score unavailable'}
              </span>
            </div>
            <div className="tooltip-stat" style={{ marginTop: 3 }}>{tooltip.statB}</div>
          </div>
        )}
      </div>
    </div>
  );
};
