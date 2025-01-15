"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, Navigation, AlertCircle, Clock, Car } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import { format } from 'date-fns';
import type { 
  RouteInfoProps, 
  TollInfo,
  TollSegment,
  TrafficData
} from './types';
import { analyzeTrafficConditions } from '@/utils/transportUtils';

// Константа стилей для темной темы
const darkMapStyles = [
  {
    elementType: "geometry",
    stylers: [{ color: "#242f3e" }]
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#242f3e" }]
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }]
  }
];

const calculateTollCost = (distance: number, mainRoute: google.maps.DirectionsRoute) => {
  const baseRate = 0.12;
  const minCost = Math.max(20, distance * 0.05);
  const maxCost = distance * 0.15;

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

  let adjustedRate = baseRate;
  if (states.has('ny') || states.has('nj') || states.has('pa')) {
    adjustedRate *= 1.3;
  }
  if (states.has('ca')) {
    adjustedRate *= 1.2;
  }
  if (states.has('fl')) {
    adjustedRate *= 1.1;
  }

  let estimatedCost = distance * adjustedRate;

  if (distance > 1000) {
    estimatedCost *= 0.9;
  }
  if (distance > 2000) {
    estimatedCost *= 0.85;
  }

  return Math.round(Math.min(maxCost, Math.max(minCost, estimatedCost)) * 100) / 100;
};

const getRouteSegments = (route: google.maps.DirectionsResult, totalCost: number): TollSegment[] => {
  const segments: TollSegment[] = [];
  const routeText = route.routes[0].legs[0].steps
    .map(step => step.instructions.toLowerCase())
    .join(' ');
  let remainingCost = totalCost;

  const regionSegments = [
    {
      condition: () => 
        routeText.includes('new jersey') || 
        routeText.includes('new york') || 
        routeText.includes('i-95') ||
        routeText.includes('nj') ||
        routeText.includes('ny'),
      name: "Northeast Region Tolls",
      description: "(I-95, NJ/NY Turnpikes)",
      multiplier: 0.35
    },
    {
      condition: () => 
        routeText.includes('i-80') || 
        routeText.includes('i-90') || 
        routeText.includes('pennsylvania') ||
        routeText.includes('illinois') ||
        routeText.includes('indiana') ||
        routeText.includes('ohio'),
      name: "Midwest Region Tolls",
      description: "(I-80/90, Ohio/Indiana/Illinois Tolls)",
      multiplier: 0.4
    },
    {
      condition: () => 
        routeText.includes('california') || 
        routeText.includes('san francisco') ||
        routeText.includes('los angeles') ||
        routeText.includes('ca'),
      name: "West Coast Tolls",
      description: "(CA Bridges and Highways)",
      multiplier: 0.8
    },
    {
      condition: () => 
        routeText.includes('florida') || 
        routeText.includes('miami') ||
        routeText.includes('fl') ||
        routeText.includes('orlando') ||
        routeText.includes('tampa'),
      name: "Florida Region Tolls",
      description: "(FL Turnpike and Express Lanes)",
      multiplier: 0.7
    },
    {
      condition: () => 
        routeText.includes('texas') || 
        routeText.includes('tx') ||
        routeText.includes('houston') ||
        routeText.includes('dallas'),
      name: "Texas Region Tolls",
      description: "(TX Tollways and Express Lanes)",
      multiplier: 0.6
    }
  ];

  regionSegments.forEach(region => {
    if (region.condition()) {
      const regionCost = Math.round(remainingCost * region.multiplier * 100) / 100;
      segments.push({
        location: region.name,
        cost: regionCost
      });
      remainingCost -= regionCost;
    }
  });

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
  isPopularRoute = false,
  isRemoteArea = false,
  trafficConditions,
  mapData,
  selectedDate,
  onTollUpdate,
  onTrafficUpdate
}: RouteInfoProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [tollInfo, setTollInfo] = useState<TollInfo | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<TrafficData | null>(null);
  const mapInitializedRef = useRef(false);
  const lastTollRef = useRef<{ cost: number, segments: TollSegment[] } | null>(null);

  const updateTollInfo = useCallback((totalCost: number, segments: TollSegment[]) => {
    if (!lastTollRef.current || 
        lastTollRef.current.cost !== totalCost || 
        JSON.stringify(lastTollRef.current.segments) !== JSON.stringify(segments)) {
      
      lastTollRef.current = { cost: totalCost, segments };
      setTollInfo({ segments, totalCost });
      
      if (onTollUpdate) {
        onTollUpdate(totalCost, segments);
      }
    }
  }, [onTollUpdate]);

  useEffect(() => {
    if (!mapData || !selectedDate || !window.google) return;

    const analyzeTraffic = async () => {
      try {
        const trafficData = await analyzeTrafficConditions(
          {
            lat: mapData.routes[0].legs[0].start_location.lat(),
            lng: mapData.routes[0].legs[0].start_location.lng()
          },
          {
            lat: mapData.routes[0].legs[0].end_location.lat(),
            lng: mapData.routes[0].legs[0].end_location.lng()
          },
          selectedDate,
          window.google
        );

        setTrafficInfo(trafficData);
        
        if (onTrafficUpdate) {
          onTrafficUpdate(trafficData.multiplier);
        }
      } catch (error) {
        console.error('Error analyzing traffic:', error);
        setTrafficInfo({
          points: [],
          status: 'light',
          delay: 0,
          multiplier: 1.0
        });
        
        if (onTrafficUpdate) {
          onTrafficUpdate(1.0);
        }
      }
    };

    analyzeTraffic();
  }, [mapData, selectedDate, onTrafficUpdate]);

  useEffect(() => {
    if (!mapData || !distance) return;

    const calculateTolls = async () => {
      try {
        const totalTollCost = calculateTollCost(distance, mapData.routes[0]);
        const segments = getRouteSegments(mapData, totalTollCost);
        updateTollInfo(totalTollCost, segments);
      } catch (error) {
        console.error('Error calculating tolls:', error);
        updateTollInfo(0, []);
      }
    };

    calculateTolls();
  }, [mapData, distance, updateTollInfo, selectedDate]);

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement || mapInitializedRef.current || !mapData) return;

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

        const isDark = document.documentElement.classList.contains('dark');
        const map = new google.maps.Map(mapElement, {
          zoom: 4,
          center: { lat: 39.8283, lng: -98.5795 },
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            ...(isDark ? darkMapStyles : [])
          ]
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
        mapInitializedRef.current = true;

        directionsRenderer.setDirections(mapData);

        // Добавляем слушатель изменения темы
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mapInstanceRef.current) {
              const isDark = document.documentElement.classList.contains('dark');
              mapInstanceRef.current.setOptions({
                styles: [
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                  },
                  ...(isDark ? darkMapStyles : [])
                ]
              });
            }
          });
        });

        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class']
        });

        // Очищаем observer при размонтировании
        return () => {
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
          }
          mapInstanceRef.current = null;
          directionsRendererRef.current = null;
          mapInitializedRef.current = false;
          observer.disconnect();
        };
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();
  }, [mapData]);

  useEffect(() => {
    if (!mapData || !directionsRendererRef.current) return;
    directionsRendererRef.current.setDirections(mapData);
  }, [mapData]);

  const getTrafficStatusColor = (status: string) => {
    switch (status) {
      case 'light': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'heavy': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getTrafficDescription = (status: string, delay: number) => {
    switch (status) {
      case 'light':
        return 'Traffic flow is normal';
      case 'moderate':
        return `Moderate traffic${delay ? ` (expected delay: +${delay} mins)` : ''}`;
      case 'heavy':
        return `Heavy traffic${delay ? ` (expected delay: +${delay} mins)` : ''}`;
      default:
        return 'Traffic information unavailable';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div ref={mapRef} className="w-full h-[400px]" />
  
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Map className="w-5 h-5 mr-2" />
          Route Details {selectedDate && 
            <span className="text-sm text-gray-500 ml-2">
              ({format(selectedDate, 'PPP')})
            </span>
          }
        </h2>
  
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Pickup Location:</div>
            <div className="font-medium text-gray-900 dark:text-white">{pickup}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Delivery Location:</div>
            <div className="font-medium text-gray-900 dark:text-white">{delivery}</div>
          </div>
        </div>
  
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Distance</div>
              <div className="font-medium text-gray-900 dark:text-white">{distance} miles</div>
            </div>
          </div>
  
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Estimated Time</div>
              <div className="font-medium text-gray-900 dark:text-white">{estimatedTime || 'Calculating...'}</div>
            </div>
          </div>
        </div>
  
        <div className="pt-4 border-t">
          <div className="flex items-start flex-col">
            <div className="text-sm text-gray-600 mb-2">Traffic Conditions</div>
            <div className="flex items-center">
              <Car className={`w-5 h-5 mr-2 ${getTrafficStatusColor(trafficConditions.status)}`} />
              <span className={`font-medium ${getTrafficStatusColor(trafficConditions.status)}`}>
                {getTrafficDescription(trafficConditions.status, trafficConditions.delay || 0)}
              </span>
            </div>
            {trafficInfo && trafficInfo.delay > 0 && (
              <div className="mt-2 text-sm">
                <div className="text-gray-600">Impact on delivery time:</div>
                <div className="flex flex-col mt-1">
                  <span className="text-orange-600">
                    • Added {trafficInfo.delay} minutes to estimated time
                  </span>
                  <span className="text-gray-500 text-xs mt-1">
                    Based on real-time traffic data
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
  
        {tollInfo && tollInfo.totalCost > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-start flex-col">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Expected Toll Roads</div>
              <div className="space-y-2 w-full">
                {tollInfo.segments.map((segment, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300">{segment.location}</span>
                      <span className="text-xs text-gray-500">
                        {segment.location === "Northeast Region Tolls" && "(I-95, NJ/NY Turnpikes)"}
                        {segment.location === "Midwest Region Tolls" && "(I-80/90, Ohio/Indiana/Illinois Tolls)"}
                        {segment.location === "West Coast Tolls" && "(CA Bridges and Highways)"}
                        {segment.location === "Florida Region Tolls" && "(FL Turnpike and Express Lanes)"}
                        {segment.location === "Texas Region Tolls" && "(TX Tollways and Express Lanes)"}
                        {segment.location === "Other Regional Toll Roads" && "(Various Local Tolls)"}
                      </span>
                    </div>
                    <span className="font-medium text-blue-600 dark:text-blue-400">~${segment.cost.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t text-sm font-medium">
                  <span className="text-gray-900 dark:text-white">Total Toll Cost Estimate</span>
                  <span className="text-blue-600 dark:text-blue-400">~${tollInfo.totalCost.toFixed(2)}</span>
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