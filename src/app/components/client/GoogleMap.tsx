'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/app/lib/hooks/useGoogleMaps';
import type { GoogleMapProps } from '@/app/types/components.types';

const GoogleMap = forwardRef<HTMLDivElement, GoogleMapProps>(({ mapData }, ref) => {
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const googleMaps = useGoogleMaps();

  useEffect(() => {
    if (typeof window === 'undefined' || !googleMaps) return;
    
    const mapElement = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!mapElement || mapInstanceRef.current) return;

    mapInstanceRef.current = new googleMaps.Map(mapElement, {
      zoom: 4,
      center: { lat: 39.8283, lng: -98.5795 },
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    directionsRendererRef.current = new googleMaps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#4F46E5',
        strokeWeight: 5
      }
    });

    // Если маршрут уже есть, сразу его рендерим
    if (mapData) {
      directionsRendererRef.current.setDirections(mapData);
    }
  }, [googleMaps, ref]);

  useEffect(() => {
    if (mapData && directionsRendererRef.current) {
      directionsRendererRef.current.setDirections(mapData);
    }
  }, [mapData]);

  return (
    <div className="w-[698px] h-[422px] rounded-[24px] overflow-hidden bg-white">
      <div ref={ref} className="w-full h-full" />
    </div>
  );
});

GoogleMap.displayName = 'GoogleMap';

export default GoogleMap;
