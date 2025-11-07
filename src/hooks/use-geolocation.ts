"use client";

import { useState, useEffect } from 'react';
import type { Coordinates } from '@/lib/types';

export function useGeolocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      if (isMounted) {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      }
    };

    const onError = (error: GeolocationPositionError) => {
      if (isMounted) {
        setError(`Geolocation error: ${error.message}`);
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
    });

    return () => {
      isMounted = false;
    }
  }, []);

  return { location, error };
}
