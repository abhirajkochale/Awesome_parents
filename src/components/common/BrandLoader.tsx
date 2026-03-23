import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandLoaderProps {
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export function BrandLoader({ text = 'Loading...', fullScreen = false, className }: BrandLoaderProps) {
    const Container = fullScreen ? 'div' : 'div';
    const containerClasses = fullScreen 
        ? 'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm'
        : cn('flex flex-col items-center justify-center p-12 min-h-[300px]', className);

    return (
        <Container className={containerClasses}>
            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="relative flex items-center justify-center mb-6"
            >
                <div className="absolute inset-x-0 -bottom-4 h-4 bg-primary/20 blur-xl rounded-full" />
                <div className="relative bg-white p-2 rounded-2xl shadow-xl shadow-primary/10 border pb-1">
                    <img src="/AwesomeKids_logo.jpeg" alt="AwesomeKids" className="h-16 w-auto object-contain" />
                </div>
                <div className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                </div>
            </motion.div>
            {text && (
                <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-2"
                >
                    <p className="text-sm font-semibold tracking-wide text-foreground uppercase">
                        {text}
                    </p>
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    y: [0, -4, 0],
                                    opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                                className="w-1.5 h-1.5 rounded-full bg-primary/60"
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </Container>
    );
}
