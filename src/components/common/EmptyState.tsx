import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    children?: ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, children, className }: EmptyStateProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn("flex flex-col items-center justify-center w-full p-8 sm:p-16 text-center rounded-2xl border-2 border-dashed bg-muted/30 hover:bg-muted/50 transition-colors", className)}
        >
            <motion.div 
                initial={{ scale: 0.8, rotate: -5 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-primary/10 text-primary shadow-inner"
            >
                <Icon className="w-10 h-10" strokeWidth={1.5} />
            </motion.div>
            
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-2">
                {title}
            </h3>
            
            <p className="max-w-md text-sm sm:text-base text-muted-foreground mb-8 text-balance">
                {description}
            </p>
            
            {action && (
                <Button onClick={action.onClick} className="shadow-md h-11 px-8 rounded-full">
                    {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                    {action.label}
                </Button>
            )}
            
            {children && (
                <div className="mt-8 w-full max-w-md">
                    {children}
                </div>
            )}
        </motion.div>
    );
}
