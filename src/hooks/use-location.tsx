"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Coordinates } from '@/lib/types';

interface LocationContextType {
  location: Coordinates | null;
  error: string | null;
  loading: boolean;
  city: string | null;
  country: string | null;
  isPrompted: boolean;
  requestLocation: () => void;
  setAsPrompted: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [isPrompted, setIsPrompted] = useState(false);


  useEffect(() => {
     const prompted = sessionStorage.getItem('locationPrompted');
     if(prompted) {
        setIsPrompted(true);
     }
  }, []);

  const setAsPrompted = () => {
    sessionStorage.setItem('locationPrompted', 'true');
    setIsPrompted(true);
  }

  const fetchCityAndCountry = async (coords: Coordinates) => {
    try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const addressComponents = data.results[0].address_components;
            const cityComp = addressComponents.find((c: any) => c.types.includes('locality') || c.types.includes('postal_town'));
            const countryComp = addressComponents.find((c: any) => c.types.includes('country'));
            if(cityComp) setCity(cityComp.long_name);
            if(countryComp) setCountry(countryComp.short_name);
        }
    } catch (e) {
        console.error("Failed to fetch city and country", e);
    }
  };

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setLocation(newLocation);
      fetchCityAndCountry(newLocation);
      setLoading(false);
    };

    const onError = (error: GeolocationPositionError) => {
      setError(`Geolocation error: ${error.message}`);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
    });
  };

  return (
    <LocationContext.Provider value={{ location, error, loading, city, country, requestLocation, isPrompted, setAsPrompted }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
