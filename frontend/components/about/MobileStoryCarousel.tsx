"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, PanInfo, useAnimation } from "motion/react";
import { MobileStorySlide } from "./MobileStorySlide";

import { STORIES_DATA } from "../../constants/about";

const STORY_DURATION = 5500; // Increased to 5.5s to give more time to read longer texts

export function MobileStoryCarousel() {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    
    const progressRef = useRef(0);
    const isPausedRef = useRef(false);
    const progressBarsRef = useRef<(HTMLDivElement | null)[]>([]);
    
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const requestRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    const controls = useAnimation();

    const goToSlide = useCallback(async (index: number) => {
        const safeIndex = Math.max(0, Math.min(index, STORIES_DATA.length - 1));
        
        isPausedRef.current = true;
        setActiveIndex(safeIndex);
        
        // Optimistically reset progress instantly
        progressRef.current = 0;
        if (progressBarsRef.current[safeIndex]) {
             progressBarsRef.current[safeIndex]!.style.transform = `scaleX(1)`;
        }
        
        // Animate horizontal slide
        await controls.start({ x: `-${safeIndex * (100 / STORIES_DATA.length)}%`, transition: { type: "tween", ease: "easeInOut", duration: 0.35 } });
        
        isPausedRef.current = false;
    }, [controls]);

    // 2. Performance Optimized Animation Loop (Zero Re-renders)
    const animate = useCallback((time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        if (!isPausedRef.current) {
            const addedProgress = (deltaTime / STORY_DURATION) * 100;
            progressRef.current += addedProgress;

            if (progressRef.current >= 100) {
                progressRef.current = 100;
                // Move to next slide if possible
                if (activeIndex < STORIES_DATA.length - 1) {
                    goToSlide(activeIndex + 1);
                } else {
                    router.push('/');
                }
            }

            // Update DOM directly via hardware-accelerated transform
            if (progressBarsRef.current[activeIndex]) {
                progressBarsRef.current[activeIndex]!.style.transform = `scaleX(${progressRef.current / 100})`;
            }
        }
        
        requestRef.current = requestAnimationFrame(animate);
    }, [activeIndex, goToSlide, router]);

    // Update side-effects for progress bars
    useEffect(() => {
        lastTimeRef.current = performance.now();
        
        progressBarsRef.current.forEach((bar, index) => {
            if (!bar) return;
            if (index < activeIndex) {
                bar.style.transform = `scaleX(1)`;
            } else if (index > activeIndex) {
                bar.style.transform = `scaleX(0)`;
            } else {
                bar.style.transform = `scaleX(${progressRef.current / 100})`;
            }
        });

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate, activeIndex]);

    // 3. Pointer Events for Tap and Hold
    const handlePointerDown = (e: React.PointerEvent) => {
        isPausedRef.current = true;
        touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (activeIndex < STORIES_DATA.length - 1 || progressRef.current < 100) {
            isPausedRef.current = false;
        }
        
        if (!touchStartRef.current) return;

        const touchEnd = { x: e.clientX, y: e.clientY, time: Date.now() };
        const dx = touchEnd.x - touchStartRef.current.x;
        const dy = touchEnd.y - touchStartRef.current.y;
        const dt = touchEnd.time - touchStartRef.current.time;
        touchStartRef.current = null;

        if (dt < 250 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            const width = window.innerWidth;
            if (touchEnd.x < width * 0.25) {
                if (activeIndex > 0) goToSlide(activeIndex - 1);
                else progressRef.current = 0;
            } else {
                if (activeIndex < STORIES_DATA.length - 1) goToSlide(activeIndex + 1);
                else {
                    router.push('/');
                }
            }
        }
    };

    const handlePointerCancel = () => {
        isPausedRef.current = false;
        touchStartRef.current = null;
    };

    const handleDragEndVertical = (e: any, info: PanInfo) => {
        const { offset, velocity } = info;
        const swipeThreshold = window.innerHeight * 0.25; // 25% of height

        // Close if swiped fast, OR dragged slowly and released past 25% threshold
        if (Math.abs(velocity.y) > 500 || Math.abs(offset.y) > swipeThreshold) {
            router.push('/');
        }
    };

    const handleDragEndHorizontal = (e: any, info: PanInfo) => {
        const { offset, velocity } = info;
        const swipe = offset.x;
        
        if (swipe < -50 || velocity.x < -500) {
            if (activeIndex < STORIES_DATA.length - 1) goToSlide(activeIndex + 1);
            else router.push('/'); // Close if swiped past the last slide
        } else if (swipe > 50 || velocity.x > 500) {
            if (activeIndex > 0) goToSlide(activeIndex - 1);
            else controls.start({ x: `-${activeIndex * (100 / STORIES_DATA.length)}%`, transition: { type: "tween", ease: "easeInOut", duration: 0.35 } }); // Snap back
        } else {
            // Snap back
            controls.start({ x: `-${activeIndex * (100 / STORIES_DATA.length)}%`, transition: { type: "tween", ease: "easeInOut", duration: 0.35 } });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] w-full h-[100dvh] bg-transparent pointer-events-none overflow-hidden">
            <motion.div 
                className="w-full h-full pointer-events-auto bg-black relative"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.8}
                onDragEnd={handleDragEndVertical}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
            >
                {/* Progress Indicator */}
                <div className="absolute top-0 left-0 w-full z-50 pt-4 px-2 flex gap-1.5 pointer-events-none">
                    {STORIES_DATA.map((_, index) => (
                        <div key={index} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden relative">
                            <div 
                                ref={(el) => { progressBarsRef.current[index] = el; }}
                                className="absolute top-0 left-0 w-full h-full bg-white rounded-full origin-left"
                                style={{ transform: "scaleX(0)", willChange: "transform" }}
                            />
                        </div>
                    ))}
                </div>

                {/* Horizontal Swipe Container using Framer Motion */}
                <motion.div 
                    className="w-full h-full flex flex-row"
                    animate={controls}
                    initial={{ x: "0%" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEndHorizontal}
                    style={{ width: `${STORIES_DATA.length * 100}%` }}
                >
                    {STORIES_DATA.map((story, index) => (
                        <div 
                            key={story.id} 
                            className="h-full relative" 
                            style={{ width: `${100 / STORIES_DATA.length}%` }}
                        >
                            <MobileStorySlide 
                                heading={story.heading}
                                body={story.body}
                                image={story.image}
                                isActive={activeIndex === index}
                            />
                        </div>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
}
