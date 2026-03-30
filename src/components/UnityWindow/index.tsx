import { useState, useEffect, useRef } from 'react';
import LoadingBar from '../LoadingBar/LoadingBar';

const UnityWindow = () => {
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [totalSize, setTotalSize] = useState<number | undefined>();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // Fetch file sizes of Unity build files
        const fetchFileSizes = async () => {
            const buildFiles = [
                '/src/assets/Web/Build/Web.data',
                '/src/assets/Web/Build/Web.framework.js',
                '/src/assets/Web/Build/Web.loader.js',
                '/src/assets/Web/Build/Web.wasm',
            ];

            try {
                let total = 0;
                for (const file of buildFiles) {
                    const response = await fetch(file, { method: 'HEAD' });
                    const size = response.headers.get('content-length');
                    if (size) {
                        total += parseInt(size, 10);
                    }
                }
                setTotalSize(total);
            } catch (error) {
                console.error('Error fetching file sizes:', error);
            }
        };

        fetchFileSizes();
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from the iframe
            if (event.data.type === 'unity-progress') {
                setProgress(event.data.progress);
            } else if (event.data.type === 'unity-loaded') {
                setIsLoading(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleFullscreen = () => {
        if (iframeRef.current) {
            iframeRef.current.contentWindow?.postMessage({ type: 'unity-fullscreen' }, '*');
        }
    };

    return (
        <>
            <div className="relative w-240 h-150">
                <LoadingBar isVisible={isLoading} progress={progress} totalSize={totalSize} />
                <iframe
                    ref={iframeRef}
                    className="w-full h-full rounded-2xl shadow-2xl shadow-black"
                    src="/src/assets/Web/index.html"
                    title="Unity WebGL Build"
                    allow="autoplay; camera; microphone; clipboard-read; clipboard-write"
                />
            </div>
            <button
                onClick={handleFullscreen}
                className={`mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer transition-all duration-500 ${
                    isLoading ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'
                }`}
            >
                Fullscreen
            </button>
        </>
    )
}

export default UnityWindow;         