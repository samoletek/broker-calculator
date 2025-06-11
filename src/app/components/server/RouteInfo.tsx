'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { Map, Navigation, AlertCircle, Clock, Car, MapPin } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { calculateTollCost, getRouteSegments } from '@/app/lib/utils/client/tollUtils';
import type { RouteInfoProps } from '@/app/types/components.types';

const RouteInfo: React.FC<RouteInfoProps> = memo(({
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
  tollCosts,
  config
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const hasCalculatedTolls = useRef(false);
  
  const calculateEstimatedDeliveryDate = (shippingDate: Date, estimatedTime: string): Date => {
    const daysMatch = estimatedTime.match(/(\d+)/);
    const days = daysMatch ? parseInt(daysMatch[0]) : 1;
    return addDays(shippingDate, days);
  };

  const calculateTolls = useCallback(() => {
    if (!mapData || !distance || hasCalculatedTolls.current || !config) return;
  
    try {
      const totalTollCost = calculateTollCost(distance, mapData.routes[0], config);
      const segments = getRouteSegments(mapData, totalTollCost, config);
  
      // Проверяем, изменились ли данные
      if (!tollCosts || tollCosts.total !== totalTollCost) {
        hasCalculatedTolls.current = true; // Ставим флаг ДО обновления состояния
        onTollUpdate(totalTollCost, segments);
      }
    } catch (error) {
      console.error('Error calculating tolls:', error);
      onTollUpdate(0, []);
    }
  }, [distance, mapData, config]);
  
  useEffect(() => {
    if (mapData && distance) {
      hasCalculatedTolls.current = false; // Сбрасываем флаг при изменении данных
      calculateTolls();
    }
  }, [mapData, distance, calculateTolls]);

  return (
    <div className="w-full p-4 sm:p-40 bg-white rounded-[24px] border border-primary/10">
      {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 sm:mb-24">
          <div className="space-y-8 sm:space-y-16 w-full">
            <div className="flex items-center gap-8 sm:gap-16">
              <h2 className="font-jost text-2xl sm:text-[32px] font-bold">Route Details</h2>
            </div>
          <div>
            <span className="font-montserrat text-sm sm:text-p2 font-bold">Estimated Delivery Date: </span>
            <span className="font-montserrat text-sm sm:text-p2">
              {selectedDate ? format(
                calculateEstimatedDeliveryDate(selectedDate, estimatedTime),
                "MMMM dd'th', yyyy"
              ) : '-'}
            </span>
          </div>
        </div>
      </div>
  
      {/* Divider */}
      <div className="w-full h-[1px] bg-primary opacity-10 my-8 sm:my-24" />
  
      {/* Route Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-x-24">
        {/* Pickup Location */}
        <div>
          <div className="mb-4 sm:mb-8">
            <h3 className="font-montserrat text-sm sm:text-p2 font-bold flex items-center gap-4 sm:gap-8">
              <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
              Pickup Location
            </h3>
          </div>
          <p className="font-montserrat text-sm sm:text-p2 text-gray-600 break-words">
            {pickup}
          </p>
        </div>
  
        {/* Delivery Location */}
        <div>
          <div className="mb-4 sm:mb-8">
            <h3 className="font-montserrat text-sm sm:text-p2 font-bold flex items-center gap-4 sm:gap-8">
              <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-[#1356BE]" />
              Delivery Location
            </h3>
          </div>
          <p className="font-montserrat text-sm sm:text-p2 text-gray-600 break-words">
            {delivery}
          </p>
        </div>
  
        {/* Total Distance */}
        <div>
          <div className="mb-4 sm:mb-8">
            <h3 className="font-montserrat text-sm sm:text-p2 font-bold flex items-center gap-4 sm:gap-8">
              <Navigation className="w-12 h-12 sm:w-16 sm:h-16 text-[#1356BE]" />
              Total Distance
            </h3>
          </div>
          <p className="font-montserrat text-sm sm:text-p2 text-gray-600">
            {distance} miles
          </p>
        </div>
  
        {/* Estimated Time */}
        <div>
          <div className="mb-4 sm:mb-8">
            <h3 className="font-montserrat text-sm sm:text-p2 font-bold flex items-center gap-4 sm:gap-8">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-[#1356BE]" />
              Estimated Time
            </h3>
          </div>
          <p className="font-montserrat text-sm sm:text-p2 text-gray-600">
            {estimatedTime}
          </p>
        </div>
  
        {/* Traffic Conditions */}
        <div>
          <div className="mb-4 sm:mb-8">
            <h3 className="font-montserrat text-sm sm:text-p2 font-bold flex items-center gap-4 sm:gap-8">
              <Car className="w-12 h-12 sm:w-16 sm:h-16 text-[#1356BE]" />
              Traffic Conditions
            </h3>
          </div>
          <p className="font-montserrat text-sm sm:text-p2 text-gray-600">
            {trafficConditions.status === 'light' ? 'Traffic flow is normal' :
             trafficConditions.status === 'moderate' ? `Moderate traffic${trafficConditions.delay ? ` (expected delay: +${trafficConditions.delay} mins)` : ''}` :
             `Heavy traffic${trafficConditions.delay ? ` (expected delay: +${trafficConditions.delay} mins)` : ''}`}
          </p>
        </div>
      </div>
    </div>
  );
});

RouteInfo.displayName = 'RouteInfo';

export default RouteInfo;