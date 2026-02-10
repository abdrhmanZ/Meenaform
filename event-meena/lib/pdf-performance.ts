/**
 * PDF Performance Utilities
 * 
 * Performance monitoring and optimization utilities for PDF editor.
 * Helps track render times, memory usage, and identify bottlenecks.
 * 
 * @version 1.0.0
 * @date 2025-11-05
 */

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  renderTime: number;
  previewGenerationTime: number;
  settingsUpdateTime: number;
  memoryUsage?: number;
}

/**
 * Performance monitor class
 */
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Start timing an operation
   */
  start(label: string): void {
    if (!this.enabled) return;
    this.metrics.set(label, performance.now());
  }

  /**
   * End timing an operation and log the result
   */
  end(label: string): number {
    if (!this.enabled) return 0;
    
    const startTime = this.metrics.get(label);
    if (!startTime) {
      console.warn(`Performance: No start time found for "${label}"`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(label);



    return duration;
  }

  /**
   * Measure memory usage (if available)
   */
  measureMemory(): number | undefined {
    if (!this.enabled) return undefined;
    
    // @ts-ignore - performance.memory is not in TypeScript types
    if (performance.memory) {
      // @ts-ignore
      const usedJSHeapSize = performance.memory.usedJSHeapSize;
      // @ts-ignore
      const totalJSHeapSize = performance.memory.totalJSHeapSize;
      const percentage = (usedJSHeapSize / totalJSHeapSize) * 100;
      
      return usedJSHeapSize;
    }
    
    return undefined;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize function results for performance
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return result;
  }) as T;
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string) {
  return {
    onRenderStart: () => {
      performanceMonitor.start(`render:${componentName}`);
    },
    onRenderEnd: () => {
      performanceMonitor.end(`render:${componentName}`);
    },
  };
}

/**
 * Check if browser supports required features
 */
export function checkBrowserSupport(): {
  supported: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  // Check for required APIs
  if (typeof window === 'undefined') {
    return { supported: false, missing: ['window'] };
  }

  if (!window.localStorage) {
    missing.push('localStorage');
  }

  if (!window.Blob) {
    missing.push('Blob API');
  }

  if (!window.URL || !window.URL.createObjectURL) {
    missing.push('URL API');
  }

  if (!window.FileReader) {
    missing.push('FileReader API');
  }

  // Check for canvas support
  const canvas = document.createElement('canvas');
  if (!canvas.getContext || !canvas.getContext('2d')) {
    missing.push('Canvas API');
  }

  return {
    supported: missing.length === 0,
    missing,
  };
}

/**
 * Optimize image for better performance
 */
export async function optimizeImage(
  imageUrl: string,
  maxWidth: number = 1920,
  quality: number = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

/**
 * Batch updates for better performance
 */
export class BatchUpdater<T> {
  private updates: T[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private callback: (updates: T[]) => void;
  private delay: number;

  constructor(callback: (updates: T[]) => void, delay: number = 100) {
    this.callback = callback;
    this.delay = delay;
  }

  add(update: T): void {
    this.updates.push(update);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush(): void {
    if (this.updates.length > 0) {
      this.callback([...this.updates]);
      this.updates = [];
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  clear(): void {
    this.updates = [];
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

