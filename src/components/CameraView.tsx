import { RefObject } from 'react';
import { Camera, RotateCcw, MapPin, AlertTriangle, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationData } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';

interface SpoofingAnalysis {
  isSuspicious: boolean;
  reasons: string[];
  confidence: 'low' | 'medium' | 'high';
}

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isStreaming: boolean;
  cameraError: string | null;
  location: LocationData | null;
  locationError: string | null;
  locationLoading: boolean;
  facingMode: 'user' | 'environment';
  spoofingAnalysis: SpoofingAnalysis;
  onCapture: () => void;
  onSwitchCamera: () => void;
  onRefreshLocation: () => void;
}

export default function CameraView({
  videoRef,
  canvasRef,
  isStreaming,
  cameraError,
  location,
  locationError,
  locationLoading,
  spoofingAnalysis,
  onCapture,
  onSwitchCamera,
  onRefreshLocation,
}: CameraViewProps) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card/50 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">GeoSnap</span>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Location Status */}
      <div className="px-4 py-3 bg-card/30">
        {locationLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Getting location...</span>
          </div>
        ) : locationError ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{locationError}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onRefreshLocation}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        ) : location ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className={`location-badge ${spoofingAnalysis.isSuspicious ? 'location-badge-warning' : 'location-badge-verified'}`}>
                {spoofingAnalysis.isSuspicious ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Location may be spoofed</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>Location verified</span>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onRefreshLocation} className="text-muted-foreground">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} • ±{Math.round(location.accuracy)}m
            </p>
            {location.address && (
              <p className="text-xs text-muted-foreground truncate">{location.address}</p>
            )}
            {spoofingAnalysis.isSuspicious && spoofingAnalysis.reasons.length > 0 && (
              <p className="text-xs text-location-warning mt-1">
                ⚠️ {spoofingAnalysis.reasons[0]}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Camera Viewfinder */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 camera-viewfinder m-4">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-destructive font-medium mb-2">Camera Error</p>
              <p className="text-muted-foreground text-sm">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                playsInline
                muted
                autoPlay
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              )}
              {/* Corner guides */}
              <div className="absolute inset-4 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-foreground/50 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-foreground/50 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-foreground/50 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-foreground/50 rounded-br-lg" />
              </div>
            </>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="px-4 py-6 bg-card/50 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-center gap-8">
          {/* Switch Camera */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSwitchCamera}
            className="w-12 h-12 rounded-full bg-secondary"
          >
            <RotateCcw className="w-6 h-6" />
          </Button>

          {/* Capture Button */}
          <button
            onClick={onCapture}
            disabled={!isStreaming || !location}
            className="capture-button-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="capture-button" />
          </button>

          {/* Placeholder for symmetry */}
          <div className="w-12 h-12" />
        </div>
        
        {!location && !locationLoading && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Enable location to capture photos
          </p>
        )}
      </div>
    </div>
  );
}
