import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const TRAIL_COUNT = 5;

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let frameId = 0;

    const draw = time => {
      context.clearRect(0, 0, width, height);

      for (let index = 0; index < TRAIL_COUNT; index += 1) {
        const phase = time * 0.0001 + index * 1.27;
        const centerY = height * (0.05 + index * 0.225);
        const amplitude = Math.min(68, height * 0.085);
        const getY = (progress, offset = 0) => centerY + offset
          + Math.sin(progress * Math.PI * 1.55 + phase) * amplitude
          + Math.sin(progress * Math.PI * 3.05 - phase * 0.68) * amplitude * 0.2;
        const createRibbonPath = offset => {
          const path = new Path2D();
          for (let x = -24; x <= width + 24; x += 12) {
            const progress = x / width;
            const y = getY(progress, offset);
            if (x === -24) path.moveTo(x, y);
            else path.lineTo(x, y);
          }
          return path;
        };
        const path = createRibbonPath(0);
        const echoPath = createRibbonPath(5 + (index % 2) * 3);
        const gradient = context.createLinearGradient(0, 0, width, height * 0.32);
        gradient.addColorStop(0, 'rgba(23, 76, 60, 0)');
        gradient.addColorStop(0.2, 'rgba(23, 76, 60, 0.14)');
        gradient.addColorStop(0.5, 'rgba(23, 76, 60, 0.28)');
        gradient.addColorStop(0.8, 'rgba(23, 76, 60, 0.16)');
        gradient.addColorStop(1, 'rgba(23, 76, 60, 0)');

        context.lineCap = 'round';
        context.strokeStyle = 'rgba(23, 76, 60, 0.045)';
        context.lineWidth = 13 + (index % 2) * 3;
        context.stroke(path);
        context.strokeStyle = gradient;
        context.lineWidth = 1.65;
        context.stroke(path);
        context.strokeStyle = 'rgba(101, 168, 135, 0.17)';
        context.lineWidth = 0.8;
        context.stroke(echoPath);

        const highlightProgress = ((time * 0.000028 + index * 0.23) % 1);
        const highlightX = width * highlightProgress;
        const highlightY = getY(highlightProgress);
        const highlightRadius = 28;
        const highlight = context.createRadialGradient(
          highlightX, highlightY, 0, highlightX, highlightY, highlightRadius
        );
        highlight.addColorStop(0, 'rgba(23, 76, 60, 0.25)');
        highlight.addColorStop(0.18, 'rgba(101, 168, 135, 0.16)');
        highlight.addColorStop(1, 'rgba(101, 168, 135, 0)');
        context.fillStyle = highlight;
        context.beginPath();
        context.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = 'rgba(23, 76, 60, 0.34)';
        context.beginPath();
        context.arc(highlightX, highlightY, 1.6, 0, Math.PI * 2);
        context.fill();
      }
    };

    const animate = time => {
      if (document.hidden || motionPreference.matches) return;
      draw(time);
      frameId = window.requestAnimationFrame(animate);
    };

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      draw(0);
    };

    const stop = () => {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const start = () => {
      stop();
      draw(0);
      if (!document.hidden && !motionPreference.matches) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };

    resize();
    if (!motionPreference.matches && !document.hidden) {
      frameId = window.requestAnimationFrame(animate);
    }
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    motionPreference.addEventListener('change', start);

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionPreference.removeEventListener('change', start);
    };
  }, []);

  if (!document.body) return null;

  return createPortal(
    <canvas ref={canvasRef} className="particle-background" aria-hidden="true" />,
    document.body
  );
}
