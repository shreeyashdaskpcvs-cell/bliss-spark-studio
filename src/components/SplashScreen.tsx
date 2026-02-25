import { useState, useEffect } from 'react';
import splashImage from '@/assets/splash.png';
import { MapPin } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  /** Duration in milliseconds (default: 2500) */
  duration?: number;
  /** Override the splash image */
  imageSrc?: string;
}

export default function SplashScreen({ onComplete, duration = 2500, imageSrc }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), duration - 500);
    const completeTimer = setTimeout(onComplete, duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img
        src={imageSrc || splashImage}
        alt="GeoSnap"
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      <div className="relative z-10 flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">GeoSnap</h1>
        <p className="text-muted-foreground text-sm">Location-verified photos</p>
      </div>
    </div>
  );
}
