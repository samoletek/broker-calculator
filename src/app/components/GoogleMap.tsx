"use client";
import React, { forwardRef, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapProps {
    mapData: google.maps.DirectionsResult;
}

const GoogleMap = forwardRef<HTMLDivElement, GoogleMapProps>(({ mapData }, ref) => {
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
    useEffect(() => {
      if (typeof window === 'undefined') return;
  
      const initMap = async () => {
        try {
                if (!window.google) {
                    const loader = new Loader({
                        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
                        version: "weekly",
                        libraries: ["places", "geometry", "routes"],
                        channel: 'broker-calculator'
                    });
                    await loader.load();
                }

                const mapElement = ref as React.RefObject<HTMLDivElement>;
                if (!mapElement.current) return;

                const map = new google.maps.Map(mapElement.current, {
                    zoom: 4,
                    center: { lat: 39.8283, lng: -98.5795 }
                });

                const directionsRenderer = new google.maps.DirectionsRenderer({
                    map,
                    suppressMarkers: false,
                    polylineOptions: {
                        strokeColor: '#4F46E5',
                        strokeWeight: 5
                    }
                });

                mapInstanceRef.current = map;
                directionsRendererRef.current = directionsRenderer;
                
                // Устанавливаем направления
                directionsRenderer.setDirections(mapData);

                // Очистка при размонтировании
                return () => {
                    if (directionsRendererRef.current) {
                        directionsRendererRef.current.setMap(null);
                    }
                    mapInstanceRef.current = null;
                    directionsRendererRef.current = null;
                };
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        };

        if (mapData) {
            initMap();
        }
    }, [mapData, ref]);

    return (
        <div className="w-[698px] h-[422px] rounded-[24px] overflow-hidden bg-white">
            <div ref={ref} className="w-full h-full" />
        </div>
    );
});

GoogleMap.displayName = 'GoogleMap';
export default GoogleMap;