import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import { useCamera } from '@/hooks/useCamera';
import CameraView from '@/components/CameraView';
import CapturedPhoto from '@/components/CapturedPhoto';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { location, error: locationError, loading: locationLoading, refresh: refreshLocation, checkForSpoofing } = useGeoLocation();
  const { videoRef, canvasRef, isStreaming, error: cameraError, facingMode, startCamera, switchCamera, capturePhoto } = useCamera();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Start camera from a user gesture handler
  const handleStartCamera = useCallback(async () => {
    await startCamera();
    setCameraStarted(true);
  }, [startCamera]);

  const handleCapture = () => {
    const image = capturePhoto(location);
    if (image) {
      setCapturedImage(image);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Camera restarts via user clicking the capture area
    startCamera();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (capturedImage) {
    return (
      <CapturedPhoto 
        imageData={capturedImage} 
        location={location}
        onRetake={handleRetake}
      />
    );
  }

  // Show "Start Camera" button if camera hasn't been activated via user gesture
  if (!cameraStarted && !isStreaming) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
        <Camera className="w-20 h-20 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Ready to capture</h2>
          <p className="text-muted-foreground text-sm">Tap below to activate your camera</p>
        </div>
        <Button onClick={handleStartCamera} size="lg" className="h-14 px-8 text-lg">
          <Camera className="w-5 h-5 mr-2" />
          Open Camera
        </Button>
      </div>
    );
  }

  return (
    <CameraView
      videoRef={videoRef}
      canvasRef={canvasRef}
      isStreaming={isStreaming}
      cameraError={cameraError}
      location={location}
      locationError={locationError}
      locationLoading={locationLoading}
      facingMode={facingMode}
      spoofingAnalysis={checkForSpoofing()}
      onCapture={handleCapture}
      onSwitchCamera={switchCamera}
      onRefreshLocation={refreshLocation}
    />
  );
}
