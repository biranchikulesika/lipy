'use client';

import { useEffect, useRef } from 'react';

export function ParticleCanvas({ text = "See everyday moments from your digital garden." }: { text?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = window.devicePixelRatio || 1;

    let boids: Boid[] = [];
    
    let obstacleData: Uint8ClampedArray | null = null;
    let obstacleWidth = 0;
    let obstacleHeight = 0;
    let currentRenderedText = "";

    const createObstacleMap = (textToRender: string) => {
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.fillStyle = 'white';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      
      let fontSize = 48; 
      if (width >= 768) fontSize = 72;
      if (width >= 1024) fontSize = 88;
      
      offCtx.font = `bold ${fontSize}px ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`;
      
      const words = textToRender.split(' ');
      const lines = [];
      let currentLine = words[0];
      const maxWidth = width * 0.8;
      
      for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + " " + words[i];
          const metrics = offCtx.measureText(testLine);
          if (metrics.width > maxWidth) {
              lines.push(currentLine);
              currentLine = words[i];
          } else {
              currentLine = testLine;
          }
      }
      lines.push(currentLine);
      
      const lineHeight = fontSize * 0.9;
      const startY = height / 2 - (lines.length * lineHeight) / 2 + (lineHeight / 2);
      
      lines.forEach((line, index) => {
          (offCtx as any).letterSpacing = '-0.05em';
          offCtx.fillText(line, width / 2, startY + index * lineHeight);
      });
      
      obstacleWidth = width;
      obstacleHeight = height;
      obstacleData = offCtx.getImageData(0, 0, width, height).data;
      currentRenderedText = textToRender;
    };

    const setSize = () => {
      if (!canvas) return;
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      
      initBoids();
      createObstacleMap(textRef.current);
    };

    class Boid {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      maxSpeed: number;
      steerStrength: number;
      stuckFrames: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        
        this.size = Math.random() * 1.5 + 1.5;
        this.maxSpeed = Math.random() * 1.5 + 1.0;
        this.steerStrength = Math.random() * 0.05 + 0.02;
        this.stuckFrames = 0;
      }

      update(time: number, mouseX: number, mouseY: number) {
        const scale1 = 0.003;
        const scale2 = 0.001;
        
        const noise1 = Math.sin(this.x * scale1 + time * 0.0005) * Math.cos(this.y * scale1 - time * 0.0004);
        const noise2 = Math.sin(this.y * scale2 - time * 0.0002) * Math.cos(this.x * scale2 + time * 0.0003);
        
        const flowAngle = (noise1 + noise2) * Math.PI * 4;
        
        let targetVx = Math.cos(flowAngle) * this.maxSpeed;
        let targetVy = Math.sin(flowAngle) * this.maxSpeed;
        
        if (obstacleData) {
          let cx = Math.floor(this.x);
          let cy = Math.floor(this.y);
          if (cx >= 0 && cx < obstacleWidth && cy >= 0 && cy < obstacleHeight) {
            let alpha = obstacleData[(cy * obstacleWidth + cx) * 4 + 3];
            if (alpha > 10) {
              this.stuckFrames++;
              
              if (this.stuckFrames > 45) {
                if (Math.random() > 0.5) {
                  this.x = Math.random() > 0.5 ? -20 : width + 20;
                  this.y = Math.random() * height;
                } else {
                  this.x = Math.random() * width;
                  this.y = Math.random() > 0.5 ? -20 : height + 20;
                }
                this.stuckFrames = 0;
              } else {
                let left = cx > 3 ? obstacleData[(cy * obstacleWidth + (cx - 3)) * 4 + 3] : 0;
                let right = cx < obstacleWidth - 3 ? obstacleData[(cy * obstacleWidth + (cx + 3)) * 4 + 3] : 0;
                let up = cy > 3 ? obstacleData[((cy - 3) * obstacleWidth + cx) * 4 + 3] : 0;
                let down = cy < obstacleHeight - 3 ? obstacleData[((cy + 3) * obstacleWidth + cx) * 4 + 3] : 0;
                
                let gradX = right - left;
                let gradY = down - up;
                
                if (gradX !== 0 || gradY !== 0) {
                  let len = Math.sqrt(gradX*gradX + gradY*gradY);
                  targetVx = -(gradX / len) * this.maxSpeed * 4;
                  targetVy = -(gradY / len) * this.maxSpeed * 4;
                } else {
                  targetVx = -this.vx * 2 + (Math.random() - 0.5);
                  targetVy = -this.vy * 2 + (Math.random() - 0.5);
                }
              }
            } else {
              this.stuckFrames = 0;
            }
          } else {
            this.stuckFrames = 0;
          }
        }

        let dx = mouseX - this.x;
        let dy = mouseY - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200 && mouseX !== -1000) {
          const panic = (200 - dist) / 200;
          targetVx -= (dx / dist) * panic * this.maxSpeed * 8;
          targetVy -= (dy / dist) * panic * this.maxSpeed * 8;
        }
        
        this.vx += (targetVx - this.vx) * this.steerStrength;
        this.vy += (targetVy - this.vy) * this.steerStrength;
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < -20) this.x = width + 20;
        else if (this.x > width + 20) this.x = -20;
        
        if (this.y < -20) this.y = height + 20;
        else if (this.y > height + 20) this.y = -20;
      }

      draw(ctx: CanvasRenderingContext2D, isDark: boolean) {
        const angle = Math.atan2(this.vy, this.vx);
        
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.65)';
        
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.moveTo(this.size * 2, 0);
        ctx.lineTo(-this.size, this.size);
        ctx.lineTo(-this.size * 0.5, 0);
        ctx.lineTo(-this.size, -this.size);
        ctx.closePath();
        ctx.fill();
        
        ctx.rotate(-angle);
        ctx.translate(-this.x, -this.y);
      }
    }

    const initBoids = () => {
      boids = [];
      const count = Math.min(Math.floor((width * height) / 4000), 600);
      for (let i = 0; i < count; i++) {
        boids.push(new Boid());
      }
    };

    setSize();

    let mouse = { x: -1000, y: -1000 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const onMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', setSize);

    let animationFrame: number;
    let time = 0;

    const render = () => {
      ctx.clearRect(-100, -100, width + 200, height + 200);
      time += 16; 
      
      const isDark = document.documentElement.classList.contains('dark');

      if (textRef.current && textRef.current !== currentRenderedText) {
        createObstacleMap(textRef.current);
      }

      for (let i = 0; i < boids.length; i++) {
        boids[i].update(time, mouse.x, mouse.y);
        boids[i].draw(ctx, isDark);
      }
      
      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setSize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-80 dark:opacity-80"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
