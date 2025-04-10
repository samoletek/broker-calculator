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
        // Получаем API ключ с сервера
        const response = await fetch('/api/maps');
        
        if (!response.ok) {
          throw new Error(`Failed to get Google Maps API key: ${response.statusText}`);
        }
        
        const json = await response.json();
        
        if (!json || !json.apiKey) {
          console.error('API key not found in response:', json);
          throw new Error('API key not found in response');
        }
        
        const loader = new Loader({
          apiKey: json.apiKey,
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