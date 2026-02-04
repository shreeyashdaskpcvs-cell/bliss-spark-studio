import { useState, useEffect, useCallback } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  address?: string;
  isMocked?: boolean;
}

interface UseLocationResult {
  location: LocationData | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
  checkForSpoofing: () => SpoofingAnalysis;
}

interface SpoofingAnalysis {
  isSuspicious: boolean;
  reasons: string[];
  confidence: 'low' | 'medium' | 'high';
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLocation: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };

        // Try to get address via reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${newLocation.latitude}&lon=${newLocation.longitude}&format=json`
          );
          const data = await response.json();
          if (data.display_name) {
            newLocation.address = data.display_name;
          }
        } catch (e) {
          console.log('Could not fetch address');
        }

        setLocation(newLocation);
        setLocationHistory(prev => [...prev.slice(-9), newLocation]);
        setLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred.');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const checkForSpoofing = useCallback((): SpoofingAnalysis => {
    const reasons: string[] = [];
    
    if (!location) {
      return { isSuspicious: false, reasons: [], confidence: 'low' };
    }

    // Check 1: Unusually high accuracy (spoofed locations often report perfect accuracy)
    if (location.accuracy < 5) {
      reasons.push('Unusually high accuracy reported');
    }

    // Check 2: No altitude data when device should have it
    if (location.altitude === null && navigator.userAgent.includes('Mobile')) {
      reasons.push('Missing altitude data on mobile device');
    }

    // Check 3: Check for impossible speed changes in history
    if (locationHistory.length >= 2) {
      const lastTwo = locationHistory.slice(-2);
      const timeDiff = (lastTwo[1].timestamp - lastTwo[0].timestamp) / 1000; // seconds
      const distance = calculateDistance(
        lastTwo[0].latitude, lastTwo[0].longitude,
        lastTwo[1].latitude, lastTwo[1].longitude
      );
      const speedMps = distance / timeDiff;
      
      // Speed > 1000 m/s (3600 km/h) is impossible
      if (speedMps > 1000) {
        reasons.push('Impossible movement speed detected');
      }
    }

    // Check 4: Round coordinates (spoofed locations often have round numbers)
    const latDecimals = (location.latitude.toString().split('.')[1] || '').length;
    const lonDecimals = (location.longitude.toString().split('.')[1] || '').length;
    if (latDecimals < 4 || lonDecimals < 4) {
      reasons.push('Suspiciously round coordinates');
    }

    // Check 5: Location exactly at 0,0 or other known test coordinates
    if (
      (location.latitude === 0 && location.longitude === 0) ||
      (Math.abs(location.latitude - 37.422) < 0.001 && Math.abs(location.longitude + 122.084) < 0.001) // Google HQ - common test location
    ) {
      reasons.push('Known test location detected');
    }

    const isSuspicious = reasons.length > 0;
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (reasons.length >= 3) confidence = 'high';
    else if (reasons.length >= 1) confidence = 'medium';

    return { isSuspicious, reasons, confidence };
  }, [location, locationHistory]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return {
    location,
    error,
    loading,
    refresh: getLocation,
    checkForSpoofing,
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
