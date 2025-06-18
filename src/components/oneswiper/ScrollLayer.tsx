import { useEffect, useRef } from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';

interface ScrollLayerProps {
  scrollProgress: MotionValue<number>;
  onScrollProgressChange?: (progress: number) => void;
}

export const ScrollLayer = ({ scrollProgress, onScrollProgressChange }: ScrollLayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // スクロールの進捗を監視
  useEffect(() => {
    const unsubscribe = scrollProgress.on('change', (latest) => {
      onScrollProgressChange?.(latest);
    });

    return () => unsubscribe();
  }, [scrollProgress, onScrollProgressChange]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <motion.div
        className="w-full h-full"
        style={{
          y: useTransform(scrollProgress, [0, 1], [0, -100])
        }}
      />
    </div>
  );
}; 