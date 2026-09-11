import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import type { FacultyMember, DepartmentInfo } from '../../services/types';
import { Info, Eye } from 'lucide-react';

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
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Subtle scientific fog
    scene.fog = new THREE.FogExp2(0xf0f7ff, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 48);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 1.5, 120);
    pointLight.position.set(0, 10, 20);
    scene.add(pointLight);

    const backLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    backLight.position.set(0, -20, -10);
    scene.add(backLight);

    // 1. Central Institutional Research Core
    const coreGroup = new THREE.Group();
    const coreGeo = new THREE.IcosahedronGeometry(2.4, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0a192f,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Outer wireframe ring around core
    const wireGeo = new THREE.IcosahedronGeometry(2.9, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    scene.add(coreGroup);

    // 2. Department Clusters & Faculty Nodes (When Real Data Exists)
    // OR Abstract Research Network (When Real Data Is Unavailable)
    const interactiveObjects: THREE.Object3D[] = [];
    const deptMeshMap = new Map<string, THREE.Mesh>();
    const facultyMeshMap = new Map<string, THREE.Mesh>();
    const abstractMeshes: THREE.Object3D[] = [];

    const hasRealData = departments.length > 0 || facultyList.length > 0;

    if (hasRealData) {
      departments.forEach(dept => {
        const pos = deptPositions[dept.code] || new THREE.Vector3(0, 0, 0);
        const color = deptColors[dept.code] || 0x2563eb;

        // Department Hub Sphere
        const deptGeo = new THREE.SphereGeometry(2.0, 32, 32);
        const deptMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.3,
          metalness: 0.4,
          emissive: color,
          emissiveIntensity: 0.2
        });
        const deptMesh = new THREE.Mesh(deptGeo, deptMat);
        deptMesh.position.copy(pos);
        deptMesh.userData = {
          type: 'department',
          code: dept.code,
          name: dept.name,
          score: dept.mean_score,
          facultyCount: dept.faculty_count,
          q1Pct: dept.q1_percentage
        };
        scene.add(deptMesh);
        interactiveObjects.push(deptMesh);
        deptMeshMap.set(dept.code, deptMesh);

        // Line connecting Core to Department
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          pos
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.25
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
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
        const radiusSize = 0.4 + (scoreVal / 100) * 0.65;
        const facGeo = new THREE.SphereGeometry(radiusSize, 24, 24);
        const facMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.35,
          metalness: 0.3,
          emissive: color,
          emissiveIntensity: scoreVal > 70 ? 0.35 : 0.1
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
          citations: fac.raw_metrics?.cits_latest ?? null
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
          opacity: 0.18
        });
        const facLine = new THREE.Line(facLineGeo, facLineMat);
        scene.add(facLine);
      });
    } else {
      // Neutral scientific/institutional WebGL environment (no fake faculty or department claims)
      const neutralRingGeo = new THREE.TorusGeometry(12, 0.05, 16, 120);
      const neutralRingMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.3
      });
      const neutralRing = new THREE.Mesh(neutralRingGeo, neutralRingMat);
      neutralRing.rotation.x = Math.PI / 3;
      scene.add(neutralRing);
      abstractMeshes.push(neutralRing);

      const secondRingGeo = new THREE.TorusGeometry(17, 0.04, 16, 120);
      const secondRingMat = new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.2
      });
      const secondRing = new THREE.Mesh(secondRingGeo, secondRingMat);
      secondRing.rotation.y = Math.PI / 4;
      secondRing.rotation.x = -Math.PI / 5;
      scene.add(secondRing);
      abstractMeshes.push(secondRing);

      // Abstract geometric placeholder nodes (no faculty/department identities)
      const neutralNodePositions = [
        new THREE.Vector3(-14, 6, 0),
        new THREE.Vector3(14, 7, -2),
        new THREE.Vector3(-12, -7, 2),
        new THREE.Vector3(13, -6, 0),
        new THREE.Vector3(0, 12, -4),
        new THREE.Vector3(0, -12, 3)
      ];

      neutralNodePositions.forEach(pos => {
        const nodeGeo = new THREE.OctahedronGeometry(1.2, 0);
        const nodeMat = new THREE.MeshStandardMaterial({
          color: 0x93c5fd,
          roughness: 0.4,
          metalness: 0.6,
          wireframe: true
        });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeMesh.position.copy(pos);
        scene.add(nodeMesh);
        abstractMeshes.push(nodeMesh);

        // Filament connecting to core
        const filamentGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          pos
        ]);
        const filamentMat = new THREE.LineBasicMaterial({
          color: 0x93c5fd,
          transparent: true,
          opacity: 0.15
        });
        const filament = new THREE.Line(filamentGeo, filamentMat);
        scene.add(filament);
        abstractMeshes.push(filament);
      });
    }

    // 3. Ambient Particle Field (Scientific Star Field)
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      // Deterministic particle distribution (pseudo-random trigonometric hash)
      const seedX = Math.sin((i + 1) * 12.9898) * 43758.5453;
      const seedY = Math.sin((i + 2) * 78.233) * 43758.5453;
      const seedZ = Math.sin((i + 3) * 45.164) * 43758.5453;
      particlePos[i] = ((seedX - Math.floor(seedX)) - 0.5) * 80;
      particlePos[i + 1] = ((seedY - Math.floor(seedY)) - 0.5) * 50;
      particlePos[i + 2] = ((seedZ - Math.floor(seedZ)) - 0.5) * 40;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.5,
      transparent: true,
      opacity: 0.45
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Raycasting & Mouse Parallax
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-100, -100);
    const targetCameraPos = new THREE.Vector3(0, 0, 48);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.x = x;
      mouse.y = y;

      // Subtle parallax camera target
      targetCameraPos.x = x * 2.5;
      targetCameraPos.y = y * 1.8;

      // Raycast for hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const data = hit.userData;

        // Position tooltip
        const screenX = e.clientX - rect.left;
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
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera lerp (Parallax)
      camera.position.lerp(targetCameraPos, 0.04);
      camera.lookAt(0, 0, 0);

      // Slow institutional core rotation
      coreGroup.rotation.y = elapsedTime * 0.08;
      coreGroup.rotation.x = Math.sin(elapsedTime * 0.05) * 0.08;

      // Slow orbital breath on particles
      particles.rotation.y = -elapsedTime * 0.015;

      // Rotate neutral abstract geometry if present
      abstractMeshes.forEach((mesh, i) => {
        if (mesh instanceof THREE.Mesh && mesh.geometry instanceof THREE.TorusGeometry) {
          mesh.rotation.z = elapsedTime * (0.02 * (i + 1));
        } else if (mesh instanceof THREE.Mesh) {
          mesh.rotation.y = elapsedTime * 0.2;
        }
      });

      // Very subtle organic floating on department hubs
      departments.forEach(d => {
        const mesh = deptMeshMap.get(d.code);
        if (mesh) {
          const originalPos = deptPositions[d.code] || new THREE.Vector3(0, 0, 0);
          mesh.position.y = originalPos.y + Math.sin(elapsedTime * 0.8 + mesh.position.x) * 0.18;
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
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

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
            <span style={{ fontSize: 11.5, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye size={13} color="#2563eb" />
              {hasRealData
                ? 'Hover nodes to inspect • Click to open dossier'
                : 'Institutional Core Active • Awaiting API connection'}
            </span>
          </div>
        </div>

        {/* Floating Tooltip in WebGL Canvas */}
        {tooltip && (
          <div
            className="webgl-tooltip"
            style={{
              left: Math.min(Math.max(tooltip.x, 120), (mountRef.current?.clientWidth || 800) - 120),
              top: tooltip.y
            }}
          >
            <div className="tooltip-title">{tooltip.title}</div>
            <div style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 4 }}>{tooltip.subtitle}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <span className="tooltip-stat">{tooltip.statA}</span>
              <span style={{ fontWeight: 800, color: '#60a5fa', fontSize: 14 }}>
                {tooltip.score != null ? `${tooltip.score} / 100` : 'Score unavailable'}
              </span>
            </div>
            <div className="tooltip-stat" style={{ marginTop: 2 }}>{tooltip.statB}</div>
          </div>
        )}
      </div>
    </div>
  );
};

