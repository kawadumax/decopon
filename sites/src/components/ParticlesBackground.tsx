import type { FC } from "react";
import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export const ParticlesBackground: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];
    const particleCount = 30;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 45 + 5,
          speed: Math.random() * 2 + 0.5,
        });
      }
    };

    const drawParticles = (scrollY: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particles) {
        ctx.beginPath();
        ctx.roundRect(
          particle.x,
          (particle.y + scrollY * particle.speed) % canvas.height,
          particle.size,
          particle.size,
          particle.size / 5,
        );
        ctx.fillStyle = `rgba(${255} , ${255}, 0, ${particle.speed * 0.1})`;
        ctx.fill();
      }
    };

    const animate = () => {
      const scrollY = window.scrollY;
      drawParticles(scrollY);
      requestAnimationFrame(animate);
    };

    resizeCanvas();
    initParticles();
    animate();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 h-full w-full" />;
};
