import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import { useCamera } from '@/hooks/useCamera';
import CameraView from '@/components/CameraView';
import CapturedPhoto from '@/components/CapturedPhoto';
import { useState } from 'react';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { location, error: locationError, loading: locationLoading, refresh: refreshLocation, checkForSpoofing } = useGeoLocation();
  const { videoRef, canvasRef, isStreaming, error: cameraError, facingMode, startCamera, switchCamera, capturePhoto } = useCamera();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && !capturedImage) {
      startCamera();
    }
  }, [user, capturedImage, startCamera]);

  const handleCapture = () => {
    const image = capturePhoto(location);
    if (image) {
      setCapturedImage(image);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
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
