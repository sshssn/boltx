// Performance monitoring utility for boltX

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  startTimer(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  endTimer(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    } else if (metric.duration > 100) {
      console.info(`Operation: ${name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }

    return metric.duration;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    if (!this.isEnabled) return fn();

    this.startTimer(name, metadata);
    return fn().finally(() => {
      this.endTimer(name);
    });
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common performance measurements
export const measureApiCall = <T>(name: string, apiCall: () => Promise<T>): Promise<T> => {
  return performanceMonitor.measureAsync(name, apiCall, { type: 'api_call' });
};

export const measureDatabaseQuery = <T>(name: string, query: () => Promise<T>): Promise<T> => {
  return performanceMonitor.measureAsync(name, query, { type: 'database_query' });
};

export const measureComponentRender = (name: string, renderFn: () => void): void => {
  performanceMonitor.startTimer(name, { type: 'component_render' });
  renderFn();
  performanceMonitor.endTimer(name);
};

// React hook for measuring component performance
export const usePerformanceMeasure = (componentName: string) => {
  const startRender = () => {
    performanceMonitor.startTimer(`${componentName}_render`, { type: 'component_render' });
  };

  const endRender = () => {
    performanceMonitor.endTimer(`${componentName}_render`);
  };

  return { startRender, endRender };
}; 