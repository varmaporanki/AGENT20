import { useRef, useEffect } from 'react';

interface UseCardTiltOptions {
  maxTilt?: number; // Maximum rotation in degrees (clamped to max ±1.5)
  lift?: number;    // Vertical lift in pixels on hover (default -6)
  scale?: number;   // Scale on hover (default 1.015)
  disabled?: boolean;
}

export function useCardTilt<T extends HTMLElement = HTMLDivElement>(options: UseCardTiltOptions = {}) {
  const ref = useRef<T | null>(null);
  const { maxTilt = 1.5, lift = -6, scale = 1.015, disabled = false } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    // Check if reduced motion is preferred
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let rafId: number | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;

        // Controlled rotation strictly clamped to maxTilt (±1.5 degrees)
        const tiltX = Math.max(-maxTilt, Math.min(maxTilt, -(relY - 0.5) * maxTilt * 2));
        const tiltY = Math.max(-maxTilt, Math.min(maxTilt, (relX - 0.5) * maxTilt * 2));

        const mouseX = Math.round(e.clientX - rect.left);
        const mouseY = Math.round(e.clientY - rect.top);
        const percentX = (relX * 100).toFixed(1);
        const percentY = (relY * 100).toFixed(1);

        el.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
        el.style.setProperty('--card-lift', `${lift}px`);
        el.style.setProperty('--card-scale', `${scale}`);
        el.style.setProperty('--mouse-x', `${mouseX}px`);
        el.style.setProperty('--mouse-y', `${mouseY}px`);
        el.style.setProperty('--mouse-pct-x', `${percentX}%`);
        el.style.setProperty('--mouse-pct-y', `${percentY}%`);
        el.style.setProperty('--specular-opacity', '1');
      });
    };

    const handlePointerLeave = () => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
        el.style.setProperty('--card-lift', '0px');
        el.style.setProperty('--card-scale', '1');
        el.style.setProperty('--specular-opacity', '0');
      });
    };

    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [maxTilt, lift, scale, disabled]);

  return ref;
}
