"use client";

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin } from 'lucide-react';
import { useLocation } from '@/hooks/use-location';

export default function LocationPrompt() {
  const { location, requestLocation, isPrompted, setAsPrompted } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show the prompt if it hasn't been shown before and we don't have a location
    if (!isPrompted && !location) {
      setIsOpen(true);
    }
  }, [isPrompted, location]);

  const handleAllow = () => {
    requestLocation();
    setIsOpen(false);
    setAsPrompted();
  };

  const handleDeny = () => {
    setIsOpen(false);
    setAsPrompted();
  };
  
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Share Your Location?
          </AlertDialogTitle>
          <AlertDialogDescription>
            To help you find sellers near you, See & Seek would like to use your current location. This allows us to calculate distances and provide you with accurate navigation. Your location data is used only for this purpose.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleDeny} variant="outline">
            Don't Allow
          </AlertDialogAction>
          <AlertDialogAction onClick={handleAllow}>
            Allow
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
