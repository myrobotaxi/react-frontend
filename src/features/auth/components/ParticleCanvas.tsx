'use client';

import { useRef, useEffect, useState } from 'react';

interface ParticleCanvasProps {
  accelerate?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

function createParticles(width: number, height: number): Particle[] {
  const count = Math.min(80, Math.max(40, Math.floor((width * height) / 20000)));
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: 1 + Math.random() * 1.5,
    opacity: 0.15 + Math.random() * 0.45,
  }));
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.max(w, h) * 0.7;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, 'rgba(20, 20, 20, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Full-viewport animated particle canvas (X Chat inspired).
 * Particles drift slowly; when `accelerate` is true they rush toward center.
 * Respects prefers-reduced-motion by showing static dots.
 */
export function ParticleCanvas({ accelerate = false }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    const c = canvas;
    const g = ctx;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const particles = createParticles(w, h);

    if (prefersReducedMotion) {
      g.fillStyle = '#000000';
      g.fillRect(0, 0, w, h);
      drawVignette(g, w, h);
      for (const p of particles) {
        g.beginPath();
        g.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        g.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        g.fill();
      }
      return;
    }

    let frameId: number;

    function animate() {
      g.fillStyle = '#000000';
      g.fillRect(0, 0, w, h);
      drawVignette(g, w, h);

      const cx = w / 2;
      const cy = h / 2;

      for (const p of particles) {
        if (accelerate) {
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          p.vx += (dx / dist) * 0.5;
          p.vy += (dy / dist) * 0.5;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        g.beginPath();
        g.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        g.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        g.fill();
      }

      frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, [prefersReducedMotion, accelerate]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
