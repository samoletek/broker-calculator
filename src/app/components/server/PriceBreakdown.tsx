'use client';

import { DollarSign } from 'lucide-react';
import type { PriceBreakdownProps } from '@/app/types/components.types';

export function PriceBreakdown({
  distance,
  basePrice,
  basePriceBreakdown,
  mainMultipliers,
  additionalServices,
  tollCosts,
  finalPrice,
  routeInfo,
  selectedDate
}: PriceBreakdownProps) {
  return (
    <div className="w-full p-4 sm:p-40 space-y-20 sm:space-y-40 bg-white rounded-[24px] border border-primary/10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-jost text-[32px] font-bold">Price Breakdown</h2>
      </div>
   
      {/* Base Calculation */}
      <div className="p-24 space-y-16 bg-[#F6F6FA] rounded-[24px]">
        <h3 className="font-montserrat text-p2 font-bold">Base Calculation</h3>
        <div className="space-y-12">
          <div className="flex justify-between text-p2">
            <span className="text-gray-600">Rate per mile</span>
            <span>${basePriceBreakdown.ratePerMile.toFixed(2)}/mile</span>
          </div>
          <div className="flex justify-between text-p2">
            <span className="text-gray-600">Distance</span>
            <span>{Math.round(basePriceBreakdown.distance)} miles</span>
          </div>
          <div className="flex justify-between text-p2 pt-12 border-t border-gray-200">
            <span className="font-bold">Base Price:</span>
            <span className="ml-4 text-gray-600">${basePrice.toFixed(2)}</span>
          </div>
        </div>
        {basePriceBreakdown.distance < 300 && (
          <div className="text-sm text-gray-500">
            * Base price is fixed ($600) because the route is shorter than 300 miles.
          </div>
        )}
      </div>
   
      {/* Supplemental Price Factors */}
      <div className="p-24 space-y-16 bg-primary/10 rounded-[24px]">
        <h3 className="font-montserrat text-p2 font-bold">Supplemental Price Factors</h3>
        <div className="space-y-12">
          <div className="flex justify-between text-p2">
            <span className="text-gray-600">Vehicle Impact</span>
            <div className="flex items-center gap-8">
              <span className="text-primary">
                ${mainMultipliers.vehicleImpact.toFixed(2)}
              </span>
              <span className="text-gray-500">
                ({((mainMultipliers.vehicleMultiplier - 1) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          
          <div className="flex justify-between text-p2">
            <span className="text-gray-600">Weather Impact</span>
            <div className="flex items-center gap-8">
              <span className="text-primary">
                ${mainMultipliers.weatherImpact.toFixed(2)}
              </span>
              <span className="text-gray-500">
                ({((mainMultipliers.weatherMultiplier - 1) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          
          <div className="flex justify-between text-p2">
            <span className="text-gray-600">Traffic Impact</span>
            <div className="flex items-center gap-8">
              <span className="text-primary">
                ${mainMultipliers.trafficImpact.toFixed(2)}
              </span>
              <span className="text-gray-500">
                ({((mainMultipliers.trafficMultiplier - 1) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          
          <div className="flex justify-between text-p2">
            <span className="text-gray-600">Auto Show Impact</span>
            <div className="flex items-center gap-8">
              <span className="text-primary">
                ${mainMultipliers.autoShowImpact.toFixed(2)}
              </span>
              <span className="text-gray-500">
                ({((mainMultipliers.autoShowMultiplier - 1) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
   
          <div className="flex justify-between text-p2">
            <span className="text-gray-600">Fuel Impact</span>
            <div className="flex items-center gap-8">
              <span className="text-primary">
                ${mainMultipliers.fuelImpact.toFixed(2)}
              </span>
              <span className="text-gray-500">
                ({((mainMultipliers.fuelMultiplier - 1) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
   
          <div className="flex justify-between text-p2 pt-12 border-t border-gray-200">
            <span className="font-bold">Total Factors Impact</span>
            <span className="text-[#1356BE] font-bold">
              ${mainMultipliers.totalImpact.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
   
      {/* Toll Charges */}
      {tollCosts && (
        <div className="p-24 space-y-16 bg-primary/20 rounded-[24px]">
          <h3 className="font-montserrat text-p2 font-bold">Toll Charges</h3>
          <div className="space-y-12">
            {tollCosts.segments.map((segment, index) => (
              <div key={index} className="flex justify-between text-p2">
                <span className="text-gray-600">{segment.location}</span>
                <span className="text-[#1356BE]">${segment.cost.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-p2 pt-12 border-t border-gray-200">
              <span className="font-bold">Total Toll Costs</span>
              <span className="text-[#1356BE] font-bold">
                ${tollCosts.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
   
      {/* Final Price */}
      <div className="p-24 flex justify-between items-center bg-primary rounded-[24px] text-white">
        <div className="flex items-center gap-8">
          <DollarSign className="w-20 h-20" />
          <span className="font-montserrat font-bold text-p2">Final Price</span>
        </div>
        <span className="font-montserrat text-p2 font-bold">
          ${finalPrice.toFixed(2)}
        </span>
      </div>
    </div>
   );
  }