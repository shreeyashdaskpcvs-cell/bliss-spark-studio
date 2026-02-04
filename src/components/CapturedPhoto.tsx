import { ArrowLeft, Download, Share2, MapPin, Clock, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationData } from '@/hooks/useLocation';
import { useToast } from '@/hooks/use-toast';

interface CapturedPhotoProps {
  imageData: string;
  location: LocationData | null;
  onRetake: () => void;
}

export default function CapturedPhoto({ imageData, location, onRetake }: CapturedPhotoProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `geosnap-${Date.now()}.jpg`;
    link.click();
    toast({
      title: 'Photo saved',
      description: 'The photo has been downloaded to your device.',
    });
  };

  const handleShare = async () => {
    if (!navigator.share) {
      toast({
        title: 'Sharing not supported',
        description: 'Your browser does not support sharing.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      const file = new File([blob], `geosnap-${Date.now()}.jpg`, { type: 'image/jpeg' });

      await navigator.share({
        files: [file],
        title: 'GeoSnap Photo',
        text: location ? `📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : undefined,
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast({
          title: 'Share failed',
          description: 'Could not share the photo.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card/50 backdrop-blur-lg border-b border-border">
        <Button variant="ghost" size="icon" onClick={onRetake}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-semibold text-foreground">Preview</span>
        <div className="w-10" />
      </header>

      {/* Photo Preview */}
      <div className="flex-1 p-4">
        <div className="h-full rounded-2xl overflow-hidden bg-card">
          <img
            src={imageData}
            alt="Captured photo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Location Details */}
      {location && (
        <div className="px-4 pb-4">
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
                {location.address && (
                  <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                <span>±{Math.round(location.accuracy)}m accuracy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(location.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-6 bg-card/50 backdrop-blur-lg border-t border-border">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 border-border"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            Save
          </Button>
          <Button
            className="flex-1 h-12 bg-primary hover:bg-primary/90"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
        </div>
        <Button
          variant="ghost"
          className="w-full mt-3 text-muted-foreground"
          onClick={onRetake}
        >
          Take another photo
        </Button>
      </div>
    </div>
  );
}
