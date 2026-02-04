import { useState, useRef, useCallback, useEffect } from 'react';
import { LocationData } from './useLocation';

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isStreaming: boolean;
  error: string | null;
  facingMode: 'user' | 'environment';
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => void;
  capturePhoto: (location: LocationData | null) => string | null;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    
    try {
      // Stop any existing stream
      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError('Camera permission denied. Please allow camera access.');
      } else if (message.includes('NotFoundError')) {
        setError('No camera found on this device.');
      } else {
        setError(message);
      }
      setIsStreaming(false);
    }
  }, [facingMode, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode]);

  const capturePhoto = useCallback((location: LocationData | null): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0);

    // Add location watermark if available
    if (location) {
      const padding = 24;
      const watermarkHeight = 100;
      
      // Draw watermark background
      const gradient = ctx.createLinearGradient(0, canvas.height - watermarkHeight - padding, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - watermarkHeight - padding, canvas.width, watermarkHeight + padding);

      // Draw coordinates
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      const coordsText = `📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      ctx.fillText(coordsText, padding, canvas.height - 60);

      // Draw timestamp and accuracy
      ctx.font = '20px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const date = new Date(location.timestamp);
      const timeText = `${date.toLocaleDateString()} ${date.toLocaleTimeString()} • ±${Math.round(location.accuracy)}m`;
      ctx.fillText(timeText, padding, canvas.height - 28);

      // Draw address if available
      if (location.address) {
        ctx.font = '18px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const maxWidth = canvas.width - padding * 2;
        const truncatedAddress = truncateText(ctx, location.address, maxWidth);
        ctx.fillText(truncatedAddress, padding, canvas.height - 88);
      }

      // Draw GeoSnap branding
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('GeoSnap', canvas.width - padding, canvas.height - 28);
      ctx.textAlign = 'left';
    }

    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isStreaming,
    error,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
  };
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) return text;
  
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}
