'use client';

import React, { forwardRef } from 'react';
import Image from 'next/image';
import type { GoogleMapProps } from '@/app/types/components.types';

// Enterprise-grade статический компонент карты 
// Отображает маршрут через Google Static Maps API (server-side)
const GoogleMap = forwardRef<HTMLDivElement, GoogleMapProps>(({ mapData }, ref) => {
  
  if (!mapData || !mapData.routes || mapData.routes.length === 0) {
    return (
      <div 
        ref={ref}
        className="w-full h-[422px] rounded-[24px] bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300"
      >
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="font-montserrat text-p2">Enter addresses to see route</p>
        </div>
      </div>
    );
  }

  const route = mapData.routes[0];
  const leg = route.legs[0];
  
  // Создаем URL для Google Static Maps API (server-side)
  const staticMapUrl = `/api/maps/static?` + new URLSearchParams({
    origin: `${leg.start_location.lat},${leg.start_location.lng}`,
    destination: `${leg.end_location.lat},${leg.end_location.lng}`,
    path: route.overview_polyline.points,
    size: '698x422'
  }).toString();

  return (
    <div 
      ref={ref}
      className="w-full h-[422px] rounded-[24px] overflow-hidden border border-gray-200 shadow-sm"
    >
      <div className="relative w-full h-full">
        <Image
          src={staticMapUrl}
          alt={`Route from ${leg.start_address} to ${leg.end_address}`}
          fill
          className="object-cover"
          priority
          onError={(e) => {
            // Fallback если карта не загрузилась
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* Информация о маршруте поверх карты */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="font-semibold text-gray-900">
                  {leg.distance?.text || 'Distance unknown'}
                </span>
                <span className="text-gray-600 ml-2">
                  • {leg.duration?.text || 'Duration unknown'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {route.summary}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

GoogleMap.displayName = 'GoogleMap';

export default GoogleMap;