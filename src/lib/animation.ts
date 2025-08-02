import { useEffect, useState } from "react";

export const useDelayedRender = (delay: number = 100) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRendered(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isRendered;
};

export const useStaggeredChildren = (
  childCount: number,
  startDelay: number = 100,
  staggerDelay: number = 100
) => {
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i < childCount; i++) {
      const timer = setTimeout(() => {
        setVisibleIndices((prev) => [...prev, i]);
      }, startDelay + i * staggerDelay);
      timers.push(timer);
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [childCount, startDelay, staggerDelay]);

  const isVisible = (index: number) => visibleIndices.includes(index);

  return { isVisible };
};

interface SmoothEntranceStyle {
  opacity: number;
  transform: string;
  transition?: string;
}

export const useSmoothEntrance = (delay: number = 0, duration: number = 500) => {
  const [style, setStyle] = useState<SmoothEntranceStyle>({
    opacity: 0,
    transform: 'translateY(20px)'
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStyle({
        opacity: 1,
        transform: 'translateY(0)',
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration]);

  return style;
};

export const useGlassmorphism = (level: 'light' | 'medium' | 'heavy' = 'medium') => {
  const baseStyle = {
    backdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
  };

  switch (level) {
    case 'light':
      return {
        ...baseStyle,
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.5)'
      };
    case 'heavy':
      return {
        ...baseStyle,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      };
    default:
      return baseStyle;
  }
};