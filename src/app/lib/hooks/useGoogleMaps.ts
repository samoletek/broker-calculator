'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const googleMapsRef = { current: null as typeof google.maps | null };

export function useGoogleMaps() {
  const [googleMaps, setGoogleMaps] = useState<typeof google.maps | null>(null);

  useEffect(() => {
    const initGoogleMaps = async () => {
      if (googleMapsRef.current) {
        setGoogleMaps(googleMapsRef.current);
        return;
      }

      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: "weekly",
          libraries: ["places", "geometry", "routes"],
          channel: 'broker-calculator'
        });

        await loader.load();
        googleMapsRef.current = window.google.maps;
        setGoogleMaps(window.google.maps);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    if (!googleMaps) {
      initGoogleMaps();
    }
  }, [googleMaps]);

  return googleMaps;
}
