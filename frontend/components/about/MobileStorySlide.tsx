import { motion } from "motion/react";

interface MobileStorySlideProps {
    heading?: string;
    body: string;
    image?: string;
    isActive: boolean;
}

export function MobileStorySlide({ heading, body, image, isActive }: MobileStorySlideProps) {
    
    // Abstract premium background generator based on story index (handled by CSS gradients)
    const renderBackground = () => {
        if (image) {
            return (
                <div className="absolute inset-0 z-0">
                    <img src={image} alt="Background" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/80 to-black/60" />
                </div>
            );
        }
        return (
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 via-black to-verdigris-950/20" />
        );
    };

    const formatText = (text: string) => {
        return text
            .replace(/\n/g, "<br />")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/LiPy/g, '<span class="text-verdigris-400 font-bold">LiPy</span>');
    };

    const renderText = () => (
        <div className="z-10 flex flex-col items-center text-center px-6 gap-6 w-full">
            {heading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} 
                    className="font-display text-3xl font-extrabold tracking-tight text-white/90"
                    dangerouslySetInnerHTML={{ __html: formatText(heading) }}
                />
            )}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: heading ? 0.4 : 0.1 }} 
                className="font-sans text-xl font-medium text-white/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatText(body) }}
            />
        </div>
    );

    return (
        <div className="h-[100dvh] w-full snap-start snap-always flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden">
            {renderBackground()}
            
            <div className="flex-1 flex flex-col justify-center items-center w-full">
                {renderText()}
            </div>
        </div>
    );
}
