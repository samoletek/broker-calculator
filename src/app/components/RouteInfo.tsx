"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, Navigation, AlertCircle, Clock, Car, MapPin } from 'lucide-react';import { calculateTollCost, getRouteSegments } from '@/utils/tollUtils';
import { Loader } from '@googlemaps/js-api-loader';
import { format } from 'date-fns';
import type { 
  RouteInfoProps, 
  TollInfo,
  TollSegment,
  TrafficData
} from './types';
import { analyzeTrafficConditions } from '@/utils/transportUtils';

export default function RouteInfo({ 
  pickup, 
  delivery, 
  distance,
  finalPrice,
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
  const mapInitializedRef = useRef(false);
  const [tollInfo, setTollInfo] = useState<TollInfo | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<TrafficData | null>(null);
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

        const map = new google.maps.Map(mapElement, {
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

        // Очищаем при размонтировании
        return () => {
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
          }
          mapInstanceRef.current = null;
          directionsRendererRef.current = null;
          mapInitializedRef.current = false;
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
    <div className="w-[1200px] p-40 bg-white rounded-[24px] border border-[#1356BE]/10">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-24">
        <div className="space-y-16">
          {/* Title and Date */}
          <div className="w-[371px] flex items-center gap-16">
            <h2 className="font-jost text-[32px] font-bold">Route Details</h2>
            {selectedDate && (
              <span className="font-montserrat text-p2 text-gray-600">
                ({format(selectedDate, 'MMMM dd\'th\', yyyy')})
              </span>
            )}
          </div>
  
          {/* Price */}
          <div className="w-[270px]">
            <div className="font-jost text-[48px] leading-[57.6px] font-bold text-[#1356BE]">
              ${finalPrice.toFixed(2)}
            </div>
          </div>
  
          {/* Shipping Date */}
          <div className="w-[275px] h-24">
            <span className="font-montserrat text-p2 font-bold">Shipping Date: </span>
            <span className="font-montserrat text-p2">
              {format(selectedDate || new Date(), 'MMMM dd\'th\', yyyy')}
            </span>
          </div>
        </div>
      </div>
  
      {/* Top Divider */}
      <div className="w-[1120px] h-[1px] bg-[#1356BE] opacity-10 mb-24" />
  
      {/* Route Info Details */}
      <div className="grid grid-cols-5 gap-x-24 mb-24">
        {/* Pickup Location */}
        <div>
          <div className="w-[166px] h-24 mb-8">
            <h3 className="font-montserrat text-p2 font-bold flex items-center gap-8">
              <MapPin className="w-16 h-16 text-[#1356BE]" />
              Pickup Location
            </h3>
          </div>
          <p className="font-montserrat text-p2 text-gray-600">
            {pickup}
          </p>
        </div>
  
        {/* Delivery Location */}
        <div>
          <div className="w-[200px] h-24 mb-8">
            <h3 className="font-montserrat text-p2 font-bold flex items-center gap-8">
              <MapPin className="w-16 h-16 text-[#1356BE]" />
              Delivery Location
            </h3>
          </div>
          <p className="font-montserrat text-p2 text-gray-600">
            {delivery}
          </p>
        </div>
  
        {/* Total Distance */}
        <div>
          <div className="w-[166px] h-24 mb-8">
            <h3 className="font-montserrat text-p2 font-bold flex items-center gap-8">
              <Navigation className="w-16 h-16 text-[#1356BE]" />
              Total Distance
            </h3>
          </div>
          <p className="font-montserrat text-p2 text-gray-600">
            {distance} miles
          </p>
        </div>
  
        {/* Estimated Time */}
        <div>
          <div className="w-[166px] h-24 mb-8">
            <h3 className="font-montserrat text-p2 font-bold flex items-center gap-8">
              <Clock className="w-16 h-16 text-[#1356BE]" />
              Estimated Time
            </h3>
          </div>
          <p className="font-montserrat text-p2 text-gray-600">
            {estimatedTime || '2 days'}
          </p>
        </div>
  
        {/* Traffic Conditions */}
        <div>
          <div className="w-[200px] h-24 mb-8">
            <h3 className="font-montserrat text-p2 font-bold flex items-center gap-8">
              <Car className="w-16 h-16 text-[#1356BE]" />
              Traffic Conditions
            </h3>
          </div>
          <p className="font-montserrat text-p2 text-gray-600">
            Traffic flow is normal
          </p>
        </div>
      </div>
  
      {/* Middle Divider */}
      <div className="w-[1120px] h-[1px] bg-[#1356BE] opacity-10 mb-24" />
  
      {/* Toll Roads Section */}
      <div className="mt-24">
        {/* Toll Roads Header */}
        <h3 className="w-[169px] h-24 font-montserrat text-p2 font-bold mb-16">
          Expected Toll Roads
        </h3>
  
        {/* Toll Roads List */}
        <div className="space-y-16">
          {tollInfo && tollInfo.segments.map((segment, index) => (
            <div key={index} className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="w-[250px] h-24 font-montserrat text-p2">
                  {segment.location}
                </div>
                {segment.details && (
                  <div className="font-montserrat text-p3 text-gray-600">
                    {segment.details}
                  </div>
                )}
              </div>
              <div className="w-[67px] h-24 font-montserrat text-p2 font-bold text-[#1356BE]">
                ~${segment.cost.toFixed(2)}
              </div>
            </div>
          ))}
  
          {/* Bottom Divider */}
          <div className="w-[1120px] h-[1px] bg-[#1356BE] opacity-10 my-16" />
  
          {/* Total Cost and Note */}
          <div className="flex justify-between items-start">
            <div className="space-y-8">
              <div className="w-[185px] h-24 font-montserrat text-p2">
                Total Toll Cost Estimate
              </div>
              <div className="w-[577px] h-21 font-montserrat text-p3 text-gray-600">
                * Prices are approximate and may vary based on time of day and payment method
              </div>
            </div>
            {tollInfo && (
              <div className="w-[67px] h-24 font-montserrat text-p2 font-bold text-[#1356BE]">
                ~${tollInfo.totalCost.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}