"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, PanInfo, useAnimation } from "motion/react";
import { MobileStorySlide } from "./MobileStorySlide";

import { STORIES_DATA } from "../../constants/about";

const STORY_DURATION = 5000;
const SLIDE_TRANSITION = 0.15;

export function MobileStoryCarousel() {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const activeIndexRef = useRef(0);

    const progressRef = useRef(0);
    const isPausedRef = useRef(false);
    const progressBarsRef = useRef<(HTMLDivElement | null)[]>([]);
    const isAnimatingRef = useRef(false);

    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const requestRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    const controls = useAnimation();

    // Preload all images on mount
    useEffect(() => {
        STORIES_DATA.forEach((story) => {
            if (story.image) {
                const img = new Image();
                img.src = story.image;
            }
        });
    }, []);

    const slidePercent = 100 / STORIES_DATA.length;

    const updateProgressBars = useCallback((currentIndex: number, progress: number) => {
        progressBarsRef.current.forEach((bar, index) => {
            if (!bar) return;
            if (index < currentIndex) {
                bar.style.transform = "scaleX(1)";
            } else if (index > currentIndex) {
                bar.style.transform = "scaleX(0)";
            } else {
                bar.style.transform = `scaleX(${progress / 100})`;
            }
        });
    }, []);

    const goToSlide = useCallback(async (index: number) => {
        const safeIndex = Math.max(0, Math.min(index, STORIES_DATA.length - 1));
        if (safeIndex === activeIndexRef.current && !isAnimatingRef.current) return;

        isPausedRef.current = true;
        isAnimatingRef.current = true;
        activeIndexRef.current = safeIndex;
        setActiveIndex(safeIndex);

        progressRef.current = 0;
        updateProgressBars(safeIndex, 0);

        await controls.start({
            x: `-${safeIndex * slidePercent}%`,
            transition: { type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: SLIDE_TRANSITION },
        });

        isAnimatingRef.current = false;
        lastTimeRef.current = performance.now();
        isPausedRef.current = false;
    }, [controls, slidePercent, updateProgressBars]);

    // Animation loop — uses ref for activeIndex to avoid re-creating
    const animateRef = useCallback((time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = Math.min(time - lastTimeRef.current, 100); // clamp to avoid jumps
        lastTimeRef.current = time;

        if (!isPausedRef.current && !isAnimatingRef.current) {
            const addedProgress = (deltaTime / STORY_DURATION) * 100;
            progressRef.current += addedProgress;

            if (progressRef.current >= 100) {
                progressRef.current = 100;
                const currentIdx = activeIndexRef.current;
                if (currentIdx < STORIES_DATA.length - 1) {
                    goToSlide(currentIdx + 1);
                } else {
                    router.push("/");
                }
            }

            const currentIdx = activeIndexRef.current;
            if (progressBarsRef.current[currentIdx]) {
                progressBarsRef.current[currentIdx]!.style.transform = `scaleX(${progressRef.current / 100})`;
            }
        }

        requestRef.current = requestAnimationFrame(animateRef);
    }, [goToSlide, router]);

    useEffect(() => {
        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(animateRef);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animateRef]);

    // Reset progress bars when activeIndex changes
    useEffect(() => {
        updateProgressBars(activeIndex, progressRef.current);
    }, [activeIndex, updateProgressBars]);

    // Pointer Events for tap navigation
    const handlePointerDown = (e: React.PointerEvent) => {
        isPausedRef.current = true;
        touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        const currentIdx = activeIndexRef.current;
        if (currentIdx < STORIES_DATA.length - 1 || progressRef.current < 100) {
            isPausedRef.current = false;
        }

        if (!touchStartRef.current) return;

        const touchEnd = { x: e.clientX, y: e.clientY, time: Date.now() };
        const dx = touchEnd.x - touchStartRef.current.x;
        const dy = touchEnd.y - touchStartRef.current.y;
        const dt = touchEnd.time - touchStartRef.current.time;
        touchStartRef.current = null;

        // Tap detection: fast tap with minimal movement
        if (dt < 200 && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
            const width = window.innerWidth;
            if (touchEnd.x < width * 0.3) {
                // Left 30%: go back
                if (currentIdx > 0) goToSlide(currentIdx - 1);
                else progressRef.current = 0;
            } else {
                // Right 70%: go forward
                if (currentIdx < STORIES_DATA.length - 1) goToSlide(currentIdx + 1);
                else router.push("/");
            }
        }
    };

    const handlePointerCancel = () => {
        isPausedRef.current = false;
        touchStartRef.current = null;
    };

    // Horizontal swipe navigation
    const handleDragEndHorizontal = (_: any, info: PanInfo) => {
        const { offset, velocity } = info;
        const currentIdx = activeIndexRef.current;

        if (offset.x < -40 || velocity.x < -300) {
            // Swipe left → next
            if (currentIdx < STORIES_DATA.length - 1) goToSlide(currentIdx + 1);
            else router.push("/");
        } else if (offset.x > 40 || velocity.x > 300) {
            // Swipe right → prev
            if (currentIdx > 0) goToSlide(currentIdx - 1);
            else {
                controls.start({
                    x: `-${currentIdx * slidePercent}%`,
                    transition: { type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: SLIDE_TRANSITION },
                });
            }
        } else {
            // Snap back
            controls.start({
                x: `-${currentIdx * slidePercent}%`,
                transition: { type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: SLIDE_TRANSITION },
            });
        }
    };

    // Vertical swipe to dismiss
    const handleDragEndVertical = (_: any, info: PanInfo) => {
        const { offset, velocity } = info;
        if (Math.abs(velocity.y) > 400 || Math.abs(offset.y) > window.innerHeight * 0.2) {
            router.push("/");
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

                {/* Horizontal Swipe Container */}
                <motion.div
                    className="w-full h-full flex flex-row"
                    animate={controls}
                    initial={{ x: "0%" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.15}
                    onDragEnd={handleDragEndHorizontal}
                    style={{ width: `${STORIES_DATA.length * 100}%` }}
                >
                    {STORIES_DATA.map((story, index) => (
                        <div
                            key={story.id}
                            className="h-full relative"
                            style={{ width: `${slidePercent}%` }}
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
