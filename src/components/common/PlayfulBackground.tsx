import { motion } from 'framer-motion';
import { Pencil, Book, Star, Sparkles, Cloud, Sun, Music, Rocket } from 'lucide-react';

const icons = [
  { Icon: Pencil, color: 'text-blue-400' },
  { Icon: Book, color: 'text-orange-400' },
  { Icon: Star, color: 'text-yellow-400' },
  { Icon: Sparkles, color: 'text-purple-400' },
  { Icon: Cloud, color: 'text-blue-200' },
  { Icon: Sun, color: 'text-yellow-500' },
  { Icon: Music, color: 'text-pink-400' },
  { Icon: Rocket, color: 'text-red-400' },
];

export function PlayfulBackground() {
  // Create an array of 15 random icons with random positions
  const decorativeIcons = [...Array(15)].map((_, i) => ({
    id: i,
    IconData: icons[Math.floor(Math.random() * icons.length)],
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    scale: 0.5 + Math.random() * 0.8,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {decorativeIcons.map((item) => (
        <motion.div
          key={item.id}
          className={`absolute ${item.IconData.color} opacity-[0.08] dark:opacity-[0.04]`}
          initial={{ y: 0, x: 0, rotate: 0 }}
          animate={{
            y: [0, -40, 0, 40, 0],
            x: [0, 30, 0, -30, 0],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
          style={{
            top: item.top,
            left: item.left,
            scale: item.scale,
          }}
        >
          <item.IconData.Icon size={48} strokeWidth={1.5} />
        </motion.div>
      ))}
      
      {/* Soft gradient orbs for extra depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-400/10 dark:bg-orange-600/5 rounded-full blur-[120px]" />
    </div>
  );
}
