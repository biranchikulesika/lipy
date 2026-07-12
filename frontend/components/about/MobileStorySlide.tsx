import { motion } from "motion/react";

interface MobileStorySlideProps {
    heading?: string;
    body: string;
    image?: string;
    isActive: boolean;
}

export function MobileStorySlide({ heading, body, image, isActive }: MobileStorySlideProps) {
    
    const formatText = (text: string) => {
        return text
            .replace(/\n/g, "<br />")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>");
    };

    const renderText = () => (
        <div className="z-10 flex flex-col items-center text-center px-6 gap-4 w-full">
            {heading && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1], delay: 0.03 }}
                    className="font-display text-3xl font-extrabold tracking-tight text-white/90"
                    dangerouslySetInnerHTML={{ __html: formatText(heading) }}
                />
            )}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1], delay: heading ? 0.1 : 0.03 }}
                className="font-sans text-xl font-medium text-white/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatText(body) }}
            />
        </div>
    );

    return (
        <div className="h-dvh w-full snap-start snap-always flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden">
            {/* Background image with gradient overlay — loaded eagerly so first story appears instantly */}
            {image && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={image}
                        alt=""
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover opacity-60 mix-blend-overlay blur-sm"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black via-zinc-950/50 to-black/30" />
                </div>
            )}
            {/* Gradient fallback — always visible behind the image, prevents blank flash */}
            <div className={`absolute inset-0 z-[-1] bg-linear-to-br from-zinc-950 via-black to-verdigris-950/20`} />
            
            <div className="flex-1 flex flex-col justify-center items-center w-full">
                {renderText()}
            </div>
        </div>
    );
}
