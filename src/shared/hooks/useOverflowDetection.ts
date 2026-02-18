
import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to detect horizontal overflow with optimized performance
 * Uses throttling to avoid excessive DOM queries on resize
 */
export const useOverflowDetection = (
  enabled: boolean = true,
  containerSelectors: string[] = ['main', 'nav', '.overflow-x-auto']
) => {
  const throttledCheckRef = useRef<NodeJS.Timeout | null>(null);

  const checkOverflow = useCallback(() => {
    const docWidth = document.documentElement.clientWidth;
    
    containerSelectors.forEach(selector => {
      const containers = document.querySelectorAll<HTMLElement>(selector);
      
      containers.forEach((container) => {
        const children = container.querySelectorAll<HTMLElement>('*');
        
        children.forEach((el) => {
          const rect = el.getBoundingClientRect();
          
          if (rect.right > docWidth + 1) {
            console.warn('⚠️ Overflow Detected:', el, {
              right: rect.right,
              viewportWidth: docWidth,
              offendingClass: el.className,
              parentSelector: selector
            });
            el.style.outline = '2px solid red';
          }
        });
      });
    });
  }, [containerSelectors]);

  useEffect(() => {
    if (!enabled) return;

    const throttledCheck = () => {
      if (throttledCheckRef.current) {
        clearTimeout(throttledCheckRef.current);
      }
      throttledCheckRef.current = setTimeout(checkOverflow, 100);
    };

    checkOverflow();
    window.addEventListener('resize', throttledCheck);

    return () => {
      window.removeEventListener('resize', throttledCheck);
      if (throttledCheckRef.current) {
        clearTimeout(throttledCheckRef.current);
      }
    };
  }, [enabled, checkOverflow]);
};

export default useOverflowDetection;
