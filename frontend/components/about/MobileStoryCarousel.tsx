"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, PanInfo, useAnimation } from "motion/react";
import { MobileStorySlide } from "./MobileStorySlide";

import { STORIES_DATA } from "../../constants/about";

const STORY_DURATION = 5000;
const SLIDE_TRANSITION = 0.45;
const PROGRESS_INTERVAL = 50;

export function MobileStoryCarousel() {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const activeIndexRef = useRef(0);

    const progressRef = useRef(0);
    const isPausedRef = useRef(false);
    const isAnimatingRef = useRef(false);
    const progressBarsRef = useRef<(HTMLDivElement | null)[]>([]);
    const progressTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const isMountedRef = useRef(true);
    // Refs to break circular dependency between callbacks
    const startProgressTimerRef = useRef<() => void>(() => {});
    const controls = useAnimation();

    // Preload all images on mount
    useEffect(() => {
        isMountedRef.current = true;
        STORIES_DATA.forEach((story) => {
            if (story.image) {
                const img = new Image();
                img.src = story.image;
            }
        });

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const slidePercent = 100 / STORIES_DATA.length;

    // --- Timer control ---

    const stopProgressTimer = useCallback(() => {
        if (progressTimerRef.current !== undefined) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = undefined;
        }
    }, []);

    // --- Navigation ---

    const goToSlide = useCallback((index: number) => {
        stopProgressTimer();

        const safeIndex = Math.max(0, Math.min(index, STORIES_DATA.length - 1));
        if (safeIndex === activeIndexRef.current && !isAnimatingRef.current) return;

        isPausedRef.current = true;
        isAnimatingRef.current = true;
        activeIndexRef.current = safeIndex;
        setActiveIndex(safeIndex);

        progressRef.current = 0;

        // Reset all progress bars: completed stories at 100%, the rest at 0
        progressBarsRef.current.forEach((bar, idx) => {
            if (!bar) return;
            if (idx < safeIndex) {
                bar.style.transform = "scaleX(1)";
            } else {
                bar.style.transform = "scaleX(0)";
            }
        });

        // Use animation frame for the slide transition, then resume timer
        controls.start({
            x: `-${safeIndex * slidePercent}%`,
            transition: { type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: SLIDE_TRANSITION },
        }).then(() => {
            if (!isMountedRef.current) return;
            isAnimatingRef.current = false;
            isPausedRef.current = false;
            startProgressTimerRef.current();
        });
    }, [controls, slidePercent, stopProgressTimer]);

    // advanceToNext must be defined AFTER goToSlide to avoid stale closure
    const advanceToNext = useCallback(() => {
        const currentIdx = activeIndexRef.current;
        if (currentIdx < STORIES_DATA.length - 1) {
            goToSlide(currentIdx + 1);
        } else {
            router.push("/");
        }
    }, [goToSlide, router]);

    // Keep ref in sync so startProgressTimer can call advanceToNext without creating a circular dep
    const advanceToNextRef = useRef(advanceToNext);
    advanceToNextRef.current = advanceToNext;

    // startProgressTimer uses ref to call advanceToNext, avoiding circular dependency
    const startProgressTimer = useCallback(() => {
        stopProgressTimer();

        const incrementPerTick = (PROGRESS_INTERVAL / STORY_DURATION) * 100;

        progressTimerRef.current = setInterval(() => {
            if (!isPausedRef.current && !isAnimatingRef.current) {
                progressRef.current = Math.min(progressRef.current + incrementPerTick, 100);

                const bar = progressBarsRef.current[activeIndexRef.current];
                if (bar) {
                    bar.style.transform = `scaleX(${progressRef.current / 100})`;
                }

                if (progressRef.current >= 100) {
                    stopProgressTimer();
                    advanceToNextRef.current();
                }
            }
        }, PROGRESS_INTERVAL);
    }, [stopProgressTimer]);

    // Keep ref in sync so goToSlide can call startProgressTimer without creating a circular dep
    startProgressTimerRef.current = startProgressTimer;

    // Start timer on mount, cleanup on unmount
    useEffect(() => {
        startProgressTimer();
        return stopProgressTimer;
    }, [startProgressTimer, stopProgressTimer]);

    // Pause/resume on visibility change (tab hidden = pause)
    useEffect(() => {
        const onVisibility = () => {
            if (document.hidden) {
                isPausedRef.current = true;
            } else {
                if (!isAnimatingRef.current) {
                    isPausedRef.current = false;
                }
            }
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, []);

    // --- Pointer / touch handling ---

    const handlePointerDown = (e: React.PointerEvent) => {
        isPausedRef.current = true;
        touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!touchStartRef.current) return;

        const touchEnd = { x: e.clientX, y: e.clientY, time: Date.now() };
        const dx = touchEnd.x - touchStartRef.current.x;
        const dy = touchEnd.y - touchStartRef.current.y;
        const dt = touchEnd.time - touchStartRef.current.time;
        touchStartRef.current = null;

        const currentIdx = activeIndexRef.current;

        // Tap detection: fast tap with minimal movement
        if (dt < 200 && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
            const width = window.innerWidth;
            if (touchEnd.x < width * 0.3) {
                if (currentIdx > 0) {
                    goToSlide(currentIdx - 1);
                } else {
                    progressRef.current = 0;
                    const bar = progressBarsRef.current[0];
                    if (bar) bar.style.transform = "scaleX(0)";
                    isPausedRef.current = false;
                }
            } else {
                if (currentIdx < STORIES_DATA.length - 1) {
                    goToSlide(currentIdx + 1);
                } else {
                    router.push("/");
                }
            }
            return;
        }

        // Not a tap — resume timer if not on last slide or progress not complete
        if (currentIdx < STORIES_DATA.length - 1 || progressRef.current < 100) {
            if (!isAnimatingRef.current) {
                isPausedRef.current = false;
            }
        }
    };

    const handlePointerCancel = () => {
        touchStartRef.current = null;
        if (!isAnimatingRef.current) {
            isPausedRef.current = false;
        }
    };

    // Horizontal swipe navigation
    const handleDragEndHorizontal = (_: any, info: PanInfo) => {
        const { offset, velocity } = info;
        const currentIdx = activeIndexRef.current;

        if (offset.x < -40 || velocity.x < -300) {
            if (currentIdx < STORIES_DATA.length - 1) goToSlide(currentIdx + 1);
            else router.push("/");
        } else if (offset.x > 40 || velocity.x > 300) {
            if (currentIdx > 0) goToSlide(currentIdx - 1);
            else {
                controls.start({
                    x: `-${currentIdx * slidePercent}%`,
                    transition: { type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: SLIDE_TRANSITION },
                });
            }
        } else {
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
        <div className="fixed inset-0 z-80 w-full h-dvh bg-transparent pointer-events-none overflow-hidden">
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
                                className="absolute top-0 left-0 w-full h-full bg-white rounded-full origin-left transition-transform duration-75 ease-linear"
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
