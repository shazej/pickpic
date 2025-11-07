"use client";

import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import type { Seller, Coordinates } from "@/lib/types";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

type MapViewProps = {
  sellers: Seller[];
  buyerLocation: Coordinates | null;
  selectedSeller: Seller | null;
};

const UserMarker = () => (
    <div className="relative">
        <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2"></div>
    </div>
);


export default function MapView({ sellers, buyerLocation, selectedSeller }: MapViewProps) {
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  
  // Reading env variables needs to be in a useEffect for client components
  useEffect(() => {
    setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  }, []);

  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  const mapCenter = selectedSeller?.location || (sellers.length > 0 ? sellers[0].location : buyerLocation) || { lat: 34.0522, lng: -118.2437 };

  if (apiKey === undefined) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-muted">
            <p className="text-muted-foreground">Loading map...</p>
        </div>
      );
  }

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted p-8">
        <div className="text-center bg-card p-6 rounded-lg shadow-md">
          <p className="font-semibold text-destructive text-lg">Google Maps API Key Missing</p>
          <p className="text-sm text-muted-foreground mt-2">
            To display the map, please add your Google Maps API Key as <br/>
            <code className="bg-muted px-1 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
            <br/> to your <code className="bg-muted px-1 py-0.5 rounded-sm font-mono text-xs">.env.local</code> file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        zoom={11}
        center={mapCenter}
        mapId={mapId}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        className="w-full h-full"
        key={JSON.stringify(mapCenter)}
      >
        {buyerLocation && (
          <AdvancedMarker position={buyerLocation} title={"Your Location"}>
             <UserMarker />
          </AdvancedMarker>
        )}
        {sellers.map((seller) => (
          <AdvancedMarker
            key={seller.id}
            position={seller.location}
            title={seller.name}
          >
            <Pin
              background={selectedSeller?.id === seller.id ? "hsl(var(--accent))" : "hsl(var(--primary))"}
              borderColor={selectedSeller?.id === seller.id ? "hsl(var(--accent))" : "hsl(var(--primary))"}
              glyphColor={selectedSeller?.id === seller.id ? "hsl(var(--accent-foreground))" : "hsl(var(--primary-foreground))"}
            >
                <MapPin className="w-4 h-4" />
            </Pin>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
