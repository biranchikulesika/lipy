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

    const ODIA_CHARS = [
      // Consonants
      'କ', 'ଖ', 'ଗ', 'ଘ', 'ଙ', 'ଚ', 'ଛ', 'ଜ', 'ଝ', 'ଞ', 'ଟ', 'ଠ', 'ଡ', 'ଢ', 'ଣ', 'ତ', 'ଥ', 'ଦ', 'ଧ', 'ନ', 'ପ', 'ଫ', 'ବ', 'ଭ', 'ମ', 'ଯ', 'ର', 'ଳ', 'ଶ', 'ଷ', 'ସ', 'ହ', 'ୟ',
      // Vowels
      'ଅ', 'ଆ', 'ଇ', 'ଈ', 'ଉ', 'ଊ', 'ଋ', 'ଏ', 'ଐ', 'ଓ', 'ଔ',
      // Diacritics / Matras attached to consonants
      'କା', 'କି', 'କୀ', 'କୁ', 'କୂ', 'କୃ', 'କେ', 'କୈ', 'କୋ', 'କୌ', 'କଂ', 'କଃ', 'କଁ',
      'ଖା', 'ଗୁ', 'ଚେ', 'ଜି', 'ତୁ', 'ଦୀ', 'ଧୁ', 'ନୀ', 'ପୁ', 'ଫୁ', 'ବା', 'ଭେ', 'ମା', 'ଯି', 'ରୁ', 'ଳି', 'ଶୀ', 'ଷୁ', 'ସୁ', 'ହେ',
      // Juktakyaras (Conjuncts)
      'କ୍ଷ', 'ଜ୍ଞ', 'ଦ୍ଧ', 'ସ୍ତ', 'ନ୍ଦ', 'ନ୍ତ', 'ଙ୍ଗ', 'ଞ୍ଚ', 'ଳ୍ଳ', 'ଷ୍ଠ', 'ବ୍ଦ', 'ମ୍ପ', 'ଶ୍ର', 'ପ୍ର', 'ତ୍ର', 'କ୍ର', 'ଜ୍ଜ', 'ହ୍ନ', 'ଦ୍ଯ', 'ଳ୍ପ', 'ଦ୍ଵ', 'ଣ୍ଡ', 'ଣ୍ଟ', 'ଷ୍ଣ', 'ସ୍ନ', 'ସ୍ପ'
    ];

    class Boid {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      maxSpeed: number;
      steerStrength: number;
      stuckFrames: number;
      char: string;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        
        // Layered sizes: 50% small (10px-14px), 35% medium (14px-18px), 15% big (18px-24px)
        const r = Math.random();
        if (r < 0.50) {
          this.size = Math.random() * 2 + 5.0; // Small: 5.0 to 7.0
        } else if (r < 0.85) {
          this.size = Math.random() * 2 + 7.0; // Medium: 7.0 to 9.0
        } else {
          this.size = Math.random() * 3 + 9.0; // Big: 9.0 to 12.0
        }
        
        this.maxSpeed = Math.random() * 1.5 + 1.0;
        this.steerStrength = Math.random() * 0.05 + 0.02;
        this.stuckFrames = 0;
        this.char = ODIA_CHARS[Math.floor(Math.random() * ODIA_CHARS.length)];
      }

      update(time: number, mouseX: number, mouseY: number) {
        // 1. Noise Flow Field (Global wind current)
        const scale1 = 0.002;
        const scale2 = 0.001;
        
        const noise1 = Math.sin(this.x * scale1 + time * 0.0003) * Math.cos(this.y * scale1 - time * 0.0002);
        const noise2 = Math.sin(this.y * scale2 - time * 0.0001) * Math.cos(this.x * scale2 + time * 0.0002);
        
        const flowAngle = (noise1 + noise2) * Math.PI * 2;
        
        let targetVx = Math.cos(flowAngle) * this.maxSpeed;
        let targetVy = Math.sin(flowAngle) * this.maxSpeed;
        
        // 2. Obstacle Map Avoidance (if rendering text obstacle shape)
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

        // 3. Flocking forces (Alignment and Strong Separation, No Cohesion)
        let separationX = 0;
        let separationY = 0;
        let alignmentX = 0;
        let alignmentY = 0;
        let neighborsCount = 0;
        
        for (let j = 0; j < boids.length; j++) {
          const other = boids[j];
          if (other === this) continue;
          
          const pdx = this.x - other.x;
          const pdy = this.y - other.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          
          // Dynamic radius to prevent typographic overlapping (with extra safety padding)
          const sepRadius = this.size * 2 + other.size * 2 + 8;
          const flockRadius = 80;
          
          if (pdist < flockRadius && pdist > 0.01) {
            // Strong quadratic separation force (non-linear repulsion increases as distance drops)
            if (pdist < sepRadius) {
              const force = (sepRadius - pdist) / sepRadius;
              const strongForce = force * force * 6.0;
              separationX += (pdx / pdist) * strongForce * this.maxSpeed;
              separationY += (pdy / pdist) * strongForce * this.maxSpeed;
            }
            
            // Alignment
            alignmentX += other.vx;
            alignmentY += other.vy;
            
            neighborsCount++;
          }
        }
        
        if (neighborsCount > 0) {
          alignmentX = (alignmentX / neighborsCount) - this.vx;
          alignmentY = (alignmentY / neighborsCount) - this.vy;
          
          // Apply moderate alignment
          targetVx += alignmentX * 0.4;
          targetVy += alignmentY * 0.4;
        }

        // Add separation directly (no division by neighborsCount to avoid diluting repulsion)
        targetVx += separationX;
        targetVy += separationY;

        // 4. Mouse interaction (Slipstream and repulsion)
        if (mouseX !== -1000) {
          const dx = mouseX - this.x;
          const dy = mouseY - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 180) {
            const force = (180 - dist) / 180;
            // Repel away from cursor
            targetVx -= (dx / dist) * force * this.maxSpeed * 5;
            targetVy -= (dy / dist) * force * this.maxSpeed * 5;
            
            // Swirl slipstream (aerodynamic vortex around mouse)
            const swirlX = -dy / dist;
            const swirlY = dx / dist;
            targetVx += swirlX * force * this.maxSpeed * 2.0;
            targetVy += swirlY * force * this.maxSpeed * 2.0;
          }
        }
        
        // 5. Apply physics integration
        this.vx += (targetVx - this.vx) * this.steerStrength;
        this.vy += (targetVy - this.vy) * this.steerStrength;
        
        // Limit speed to prevent chaotic teleportation
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxAllowed = this.maxSpeed * 2.0;
        if (speed > maxAllowed) {
          this.vx = (this.vx / speed) * maxAllowed;
          this.vy = (this.vy / speed) * maxAllowed;
        }
        
        // Aerodynamic damping (moving through air resistance)
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Wrapping screen borders smoothly
        if (this.x < -20) this.x = width + 20;
        else if (this.x > width + 20) this.x = -20;
        
        if (this.y < -20) this.y = height + 20;
        else if (this.y > height + 20) this.y = -20;
      }

      draw(ctx: CanvasRenderingContext2D, isDark: boolean) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = `500 ${this.size * 2}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.char, this.x, this.y);
      }
    }

    const initBoids = () => {
      boids = [];
      const count = Math.min(Math.floor((width * height) / 16000), 160);
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
      
      const isDark = true;

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
      className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
