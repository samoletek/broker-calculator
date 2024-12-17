"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, Navigation, AlertCircle, Clock, Car } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import type { RouteInfoProps, TollInfo } from './types';
import { format } from 'date-fns';

type GoogleMap = google.maps.Map;
type DirectionsRenderer = google.maps.DirectionsRenderer;

// Функция расчета стоимости платных дорог
const calculateTollCost = (distance: number, mainRoute: google.maps.DirectionsRoute) => {
  // Базовые параметры для расчета
  const baseRate = 0.12; // $0.12 за милю в среднем
  const minCost = Math.max(20, distance * 0.05); // Минимум $20 или $0.05 за милю
  const maxCost = distance * 0.15; // Максимум $0.15 за милю

  // Проверяем штаты на маршруте для корректировки цены
  const states = new Set<string>();
  mainRoute.legs[0].steps.forEach(step => {
    const instructions = step.instructions.toLowerCase();
    if (instructions.includes('entering')) {
      [' ny', ' nj', ' pa', ' fl', ' ca', ' il', ' in', ' oh'].forEach(state => {
        if (instructions.includes(state)) {
          states.add(state.trim());
        }
      });
    }
  });

  // Корректировка базовой ставки в зависимости от штатов
  let adjustedRate = baseRate;
  if (states.has('ny') || states.has('nj') || states.has('pa')) {
    adjustedRate *= 1.3; // +30% для северо-востока
  }
  if (states.has('ca')) {
    adjustedRate *= 1.2; // +20% для Калифорнии
  }
  if (states.has('fl')) {
    adjustedRate *= 1.1; // +10% для Флориды
  }

  let estimatedCost = distance * adjustedRate;

  // Корректировка для длинных маршрутов
  if (distance > 1000) {
    estimatedCost *= 0.9; // 10% скидка для длинных маршрутов
  }
  if (distance > 2000) {
    estimatedCost *= 0.85; // Дополнительная скидка для очень длинных маршрутов
  }

  // Убедимся, что стоимость в разумных пределах
  return Math.round(Math.min(maxCost, Math.max(minCost, estimatedCost)) * 100) / 100;
};

const getRouteSegments = (route: google.maps.DirectionsResult, totalCost: number) => {
  const segments: Array<{ location: string, cost: number }> = [];
  const routeText = route.routes[0].legs[0].steps
    .map(step => step.instructions.toLowerCase())
    .join(' ');
  let remainingCost = totalCost;

  // Проверяем наличие регионов в маршруте
  if (routeText.includes('new jersey') || 
      routeText.includes('new york') || 
      routeText.includes('i-95') ||
      routeText.includes('nj') ||
      routeText.includes('ny')) {
    const northeastCost = Math.round(remainingCost * 0.35 * 100) / 100;
    segments.push({
      location: "Northeast Region Tolls",
      cost: northeastCost
    });
    remainingCost -= northeastCost;
  }

  if (routeText.includes('i-80') || 
      routeText.includes('i-90') || 
      routeText.includes('pennsylvania') ||
      routeText.includes('illinois') ||
      routeText.includes('indiana') ||
      routeText.includes('ohio')) {
    const midwestCost = Math.round(remainingCost * 0.4 * 100) / 100;
    segments.push({
      location: "Midwest Region Tolls",
      cost: midwestCost
    });
    remainingCost -= midwestCost;
  }

  if (routeText.includes('california') || 
      routeText.includes('san francisco') ||
      routeText.includes('los angeles') ||
      routeText.includes('ca')) {
    const westCost = Math.round(remainingCost * 0.8 * 100) / 100;
    segments.push({
      location: "West Coast Tolls",
      cost: westCost
    });
    remainingCost -= westCost;
  }

  if (routeText.includes('florida') || 
      routeText.includes('miami') ||
      routeText.includes('fl')) {
    const southCost = Math.round(remainingCost * 0.7 * 100) / 100;
    segments.push({
      location: "Florida Region Tolls",
      cost: southCost
    });
    remainingCost -= southCost;
  }

  // Если остались неучтённые платные дороги и сумма значительная
  if (remainingCost > 5) {
    segments.push({
      location: "Other Regional Toll Roads",
      cost: Math.round(remainingCost * 100) / 100
    });
  }

  return segments;
};

export default function RouteInfo({ 
  pickup, 
  delivery, 
  distance,
  estimatedTime,
  isPopularRoute,
  isRemoteArea,
  trafficConditions,
  mapData,
  selectedDate,
  onTollUpdate
}: RouteInfoProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const directionsRendererRef = useRef<DirectionsRenderer | null>(null);
  const [tollInfo, setTollInfo] = useState<TollInfo | null>(null);
  const tollInfoRequestedRef = useRef(false);

  const getTollInfo = useCallback(async (directionsResult: google.maps.DirectionsResult) => {
    try {
      // Рассчитываем общую стоимость платных дорог
      const totalTollCost = calculateTollCost(distance, directionsResult.routes[0]);
      
      // Получаем разбивку по сегментам
      const segments = getRouteSegments(directionsResult, totalTollCost);

      // Сохраняем информацию и уведомляем родительский компонент
      setTollInfo({ 
        segments, 
        totalCost: totalTollCost 
      });
      
      if (onTollUpdate) {
        onTollUpdate(totalTollCost, segments);
      }

    } catch (error) {
      console.error('Error getting toll information:', error);
      setTollInfo({ segments: [], totalCost: 0 });
      if (onTollUpdate) {
        onTollUpdate(0);
      }
    }
  }, [distance, onTollUpdate]);

  useEffect(() => {
    let isMounted = true;
    
    const initMap = async () => {
      if (!mapRef.current || !mapData) {
        return;
      }

      try {
        if (!window.google) {
          const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
            version: "weekly",
            libraries: ["places", "geometry"]
          });
          await loader.load();
        }

        if (!isMounted) return;

        const map = new google.maps.Map(mapRef.current, {
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

        if (map) {
          const directionsRenderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#4F46E5',
              strokeWeight: 5
            }
          });

          if (isMounted) {
            mapInstanceRef.current = map;
            directionsRendererRef.current = directionsRenderer;

            if (mapData) {
              directionsRenderer.setDirections(mapData);
              
              if (!tollInfoRequestedRef.current) {
                tollInfoRequestedRef.current = true;
                await getTollInfo(mapData);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      mapInstanceRef.current = null;
      directionsRendererRef.current = null;
      tollInfoRequestedRef.current = false;
    };
  }, [mapData, distance, getTollInfo]);

  const getTrafficStatusColor = (status: string) => {
    switch (status) {
      case 'light': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'heavy': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div ref={mapRef} className="w-full h-[400px]" />

      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Map className="w-5 h-5 mr-2" />
          Route Details {selectedDate && 
            <span className="text-sm text-gray-500 ml-2">
              ({format(selectedDate, 'PPP')})
            </span>
          }
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Pickup Location:</div>
            <div className="font-medium text-gray-900">{pickup}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Delivery Location:</div>
            <div className="font-medium text-gray-900">{delivery}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-600">Total Distance</div>
              <div className="font-medium text-gray-900">{distance} miles</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-600">Estimated Time</div>
              <div className="font-medium text-gray-900">{estimatedTime || 'Calculating...'}</div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-start flex-col">
            <div className="text-sm text-gray-600 mb-2">Traffic Conditions</div>
            <div className="flex items-center">
              <Car className={`w-5 h-5 mr-2 ${getTrafficStatusColor(trafficConditions.status)}`} />
              <span className={`font-medium ${getTrafficStatusColor(trafficConditions.status)}`}>
                {trafficConditions.status === 'light' ? 'Normal Traffic' : 
                 trafficConditions.status === 'moderate' ? 'Moderate Traffic' : 'Heavy Traffic'}
                {trafficConditions.delay ? ` (+${trafficConditions.delay} mins)` : ''}
              </span>
            </div>
          </div>
        </div>

        {tollInfo && tollInfo.totalCost > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-start flex-col">
              <div className="text-sm text-gray-600 mb-2">Expected Toll Roads</div>
              <div className="space-y-2 w-full">
                {tollInfo.segments.map((segment, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-700">{segment.location}</span>
                      <span className="text-xs text-gray-500">
                        {segment.location === "Northeast Region Tolls" && "(I-95, NJ/NY Turnpikes)"}
                        {segment.location === "Midwest Region Tolls" && "(I-80/90, Ohio/Indiana/Illinois Tolls)"}
                        {segment.location === "West Coast Tolls" && "(CA Bridges and Highways)"}
                        {segment.location === "Florida Region Tolls" && "(FL Turnpike and Tolls)"}
                        {segment.location === "Other Regional Toll Roads" && "(Various Local Tolls)"}
                      </span>
                    </div>
                    <span className="font-medium text-blue-600">~${segment.cost.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t text-sm font-medium">
                  <span className="text-gray-900">Total Toll Cost Estimate</span>
                  <span className="text-blue-600">~${tollInfo.totalCost.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 italic">
                  * Prices are approximate and may vary based on time of day and payment method
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          {isPopularRoute && (
            <div className="flex items-center text-green-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>Popular route - discounted rates available</span>
            </div>
          )}
          {isRemoteArea && (
            <div className="flex items-center text-orange-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>Remote area - additional charges may apply</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}