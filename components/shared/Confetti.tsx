'use client';

import { useEffect, useRef } from 'react';

interface Props {
  /** Trigger confetti when this changes to true */
  fire: boolean;
  /** Duration in milliseconds (default 3500ms) */
  duration?: number;
  /** Number of particles (default 1500) */
  particleCount?: number;
  /** Reset callback — called when animation ends */
  onComplete?: () => void;
}

/**
 * Lightweight Canvas-based confetti — no dependencies.
 *
 * Usage:
 *   const [fire, setFire] = useState(false);
 *   <Confetti fire={fire} onComplete={() => setFire(false)} />
 *
 * Call once on celebration moments:
 *   - First ad posted
 *   - Vehicle marked as sold
 *   - First boost purchased
 *   - Account created
 *
 * Respects prefers-reduced-motion (skips animation entirely).
 */
export function Confetti({
  fire,
  duration = 3500,
  particleCount = 1500,
  onComplete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!fire) return;

    // Respect reduced motion preference
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      onComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(dpr, dpr);

    const colors = [
      '#2fa084', // brand green
      '#6fcf97', // brand mint
      '#1f6f5f', // brand deep
      '#fbbf24', // amber
      '#f97316', // orange
      '#ec4899', // pink
      '#8b5cf6', // purple
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      gravity: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
      shape: 'rect' | 'circle';
    }

    // Create particles bursting from the center of the screen
    const particles: Particle[] = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2; // Full 360 degree burst
      const speed = 5 + Math.random() * 15; // Randomize burst speed
      
      return {
        x: window.innerWidth / 2, // Center horizontally
        y: window.innerHeight / 2, // Center vertically
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.4 + Math.random() * 0.2, // Gravity still pulls them down eventually
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      };
    });

    const startTime = Date.now();

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach((p) => {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.99; // air resistance

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fire]);

  if (!fire) return null;

  return (
    <canvas
      ref={canvasRef}
      className="confetti-container"
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}
      aria-hidden
    />
  );
}