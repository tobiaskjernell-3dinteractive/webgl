import { useEffect, useState } from 'react';
import { getWebGLMemoryTracker } from '../../utils/webglMemoryTracker';
import { getIndexedDBSize } from '../../utils/indexedDBTracker';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercent: number;
  webglCacheSize: number;
  indexedDBSize: number;
  indexedDBPercent: number;
}

// Extend Performance interface to include memory property (Chrome/Chromium only)
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const MemoryMonitor = () => {
  const [memory, setMemory] = useState<MemoryInfo | null>(null);

  // Check if performance.memory is available at component level
  const isSupported = typeof performance !== 'undefined' && 'memory' in performance;

  useEffect(() => {
    // Only run if memory API is supported
    if (!isSupported) {
      return;
    }

    const updateMemory = async () => {
      const mem = performance.memory;
      if (!mem) return;

      const tracker = getWebGLMemoryTracker();
      const indexedDBInfo = await getIndexedDBSize();
      const usagePercent = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;

      setMemory({
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
        usagePercent,
        webglCacheSize: tracker.getTotalMemory(),
        indexedDBSize: indexedDBInfo.totalSize,
        indexedDBPercent: indexedDBInfo.usagePercent,
      });
    };

    updateMemory();
    const interval = setInterval(updateMemory, 2000);
    return () => clearInterval(interval);
  }, [isSupported]);

  if (!isSupported) {
    return (
      <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-gray-400 rounded-lg text-xs">
        Memory monitoring not available in this browser
      </div>
    );
  }

  if (!memory) {
    return null;
  }

  const getColorClass = (percent: number) => {
    if (percent < 50) return 'from-green-500 to-green-600';
    if (percent < 75) return 'from-yellow-500 to-yellow-600';
    if (percent < 90) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getBarColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500';
    if (percent < 75) return 'bg-yellow-500';
    if (percent < 90) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 w-72">
      <div className={`text-lg font-bold mb-3 bg-linear-to-r ${getColorClass(memory.usagePercent)} bg-clip-text text-transparent`}>
        Memory Monitor
      </div>

      {/* Memory Usage Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">Heap Memory</span>
          <span className="text-sm font-semibold text-gray-200">{memory.usagePercent.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getBarColor(memory.usagePercent)} transition-all duration-300`}
            style={{ width: `${memory.usagePercent}%` }}
          ></div>
        </div>
      </div>

      {/* Memory Stats */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-300">
          <span>Used:</span>
          <span className="font-mono font-semibold">{formatBytes(memory.usedJSHeapSize)}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Total:</span>
          <span className="font-mono font-semibold">{formatBytes(memory.totalJSHeapSize)}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Limit:</span>
          <span className="font-mono font-semibold">{formatBytes(memory.jsHeapSizeLimit)}</span>
        </div>
        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="flex justify-between text-gray-300">
            <span>WebGL Cache:</span>
            <span className="font-mono font-semibold text-blue-400">{formatBytes(memory.webglCacheSize)}</span>
          </div>
          <div className="flex justify-between text-gray-300 mt-2">
            <span>IndexedDB:</span>
            <span className="font-mono font-semibold text-purple-400">{formatBytes(memory.indexedDBSize)}</span>
          </div>
          {memory.indexedDBPercent > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              ({memory.indexedDBPercent.toFixed(1)}% of quota)
            </div>
          )}
        </div>
      </div>

      {/* Memory Status Indicator */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <span className={`text-xs font-semibold ${
          memory.usagePercent < 50 ? 'text-green-400' :
          memory.usagePercent < 75 ? 'text-yellow-400' :
          memory.usagePercent < 90 ? 'text-orange-400' :
          'text-red-400'
        }`}>
          {memory.usagePercent < 50 ? '✓ Healthy' :
           memory.usagePercent < 75 ? '⚠ Moderate' :
           memory.usagePercent < 90 ? '⚠ High' :
           '✗ Critical'}
        </span>
      </div>
    </div>
  );
};

export default MemoryMonitor;
