interface LoadingBarProps {
  isVisible: boolean;
  progress: number;
  totalSize?: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const LoadingBar = ({ isVisible, progress, totalSize }: LoadingBarProps) => {
  const loadedSize = totalSize ? totalSize * progress : 0;

  return (
    <div className={`absolute inset-0 flex items-center justify-center z-9999 bg-linear-to-br from-gray-500 to-gray-600 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} rounded-2xl`}>
      <div className="text-center text-white">
        <div className="mb-10">
          <div className="w-12 h-12 mx-auto border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
        <div className="text-2xl font-bold mb-5 tracking-widest">Loading...</div>
        <div className="w-80 h-2 bg-white/30 rounded-full mx-auto my-5 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          ></div>
        </div>
        <div className="text-sm opacity-90">{Math.round(progress * 100)}%</div>
        {totalSize && (
          <div className="text-xs opacity-80 mt-2">
            {formatBytes(loadedSize)} / {formatBytes(totalSize)}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingBar;
