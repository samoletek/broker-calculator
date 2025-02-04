'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { Map, Navigation, AlertCircle, Clock, Car, MapPin } from 'lucide-react';
import { format } from 'date-fns';
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
  tollCosts
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const hasCalculatedTolls = useRef(false);

  const calculateTolls = useCallback(() => {
    if (!mapData || !distance || hasCalculatedTolls.current) return;
  
    try {
      const totalTollCost = calculateTollCost(distance, mapData.routes[0]);
      const segments = getRouteSegments(mapData, totalTollCost);
  
      // Проверяем, изменились ли данные
      if (!tollCosts || tollCosts.total !== totalTollCost) {
        hasCalculatedTolls.current = true; // Ставим флаг ДО обновления состояния
        onTollUpdate(totalTollCost, segments);
      }
    } catch (error) {
      console.error('Error calculating tolls:', error);
      onTollUpdate(0, []);
    }
  }, [distance, mapData, tollCosts, onTollUpdate]);
  
  useEffect(() => {
    calculateTolls();
  }, [calculateTolls]);

  useEffect(() => {
    calculateTolls();
    return () => {
      hasCalculatedTolls.current = false;
    };
  }, [calculateTolls]);

  return (
    <div className="w-[1200px] p-40 bg-white rounded-[24px] border border-primary/10">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-24">
        <div className="space-y-16">
          <div className="w-[371px] flex items-center gap-16">
            <h2 className="font-jost text-[32px] font-bold">Route Details</h2>
          </div>
          
          <div className="w-[270px]">
            <div className="font-jost text-[48px] leading-[57.6px] font-bold text-primary">
              ${finalPrice.toFixed(2)}
            </div>
          </div>
          
          <div className="w-[300px] h-24">
            <span className="font-montserrat text-p2 font-bold">Shipping Date: </span>
            <span className="font-montserrat text-p2">
              {format(selectedDate || new Date(), 'MMMM dd\'th\', yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-[1120px] h-[1px] bg-primary opacity-10 mb-24" />

      {/* Route Info Grid */}
      <div className="grid grid-cols-5 gap-x-24 mb-24">
        {/* Pickup Location */}
        <div>
          <div className="w-[166px] h-24 mb-8">
            <h3 className="font-montserrat text-p2 font-bold flex items-center gap-8">
              <MapPin className="w-16 h-16 text-primary" />
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
            {estimatedTime}
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
            {trafficConditions.status === 'light' ? 'Traffic flow is normal' :
             trafficConditions.status === 'moderate' ? `Moderate traffic${trafficConditions.delay ? ` (expected delay: +${trafficConditions.delay} mins)` : ''}` :
             `Heavy traffic${trafficConditions.delay ? ` (expected delay: +${trafficConditions.delay} mins)` : ''}`}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-[1120px] h-[1px] bg-primary opacity-10 mb-24" />

      {/* Toll Roads Section */}
      <div className="mt-24">
        <h3 className="w-[169px] h-24 font-montserrat text-p2 font-bold mb-16">
          Expected Toll Roads
        </h3>

        <div className="space-y-16">
          {tollCosts?.segments.map((segment, index) => (
            <div key={index} className="flex justify-between text-p2">
              <div className="flex-1">
                <span className="text-gray-600">{segment.location}</span>
                {segment.details && (
                  <span className="text-gray-400 text-sm ml-8">
                    {segment.details}
                  </span>
                )}
              </div>
              <span className="text-[#1356BE] ml-16">${segment.cost.toFixed(2)}</span>
            </div>
          ))}

          {tollCosts && tollCosts.segments.length > 0 && (
            <>
              <div className="w-[1120px] h-[1px] bg-[#1356BE] opacity-10 my-16" />
              <div className="flex justify-between items-start">
                <div className="space-y-8">
                  <div className="w-[200px] h-24 font-montserrat font-bold text-p2">
                    Total Toll Cost Estimate
                  </div>
                  <div className="w-[577px] h-21 font-montserrat text-p3 text-gray-600">
                    * Prices are approximate and may vary based on time of day and payment method
                  </div>
                </div>
                <span className="text-[#1356BE] font-bold text-p2">
                  ${tollCosts.total.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Route Characteristics */}
      {(isPopularRoute || isRemoteArea) && (
        <div className="mt-24 p-16 bg-gray-50 rounded-[24px]">
          {isPopularRoute && (
            <div className="flex items-center gap-8 text-green-600">
              <AlertCircle className="w-16 h-16" />
              <span className="font-montserrat text-p2">
                This is a popular route - competitive pricing available
              </span>
            </div>
          )}
          {isRemoteArea && (
            <div className="flex items-center gap-8 text-amber-600">
              <AlertCircle className="w-16 h-16" />
              <span className="font-montserrat text-p2">
                Remote area delivery - additional charges may apply
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

RouteInfo.displayName = 'RouteInfo';

export default RouteInfo;