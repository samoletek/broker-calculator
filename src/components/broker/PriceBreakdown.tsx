"use client";

import { DollarSign } from 'lucide-react';

interface PriceBreakdownProps {
  distance: number;
  basePrice: number;
  mainMultipliers: {
    vehicle: number;
    weather: number;
    traffic: number;
    seasonal: number;
    totalMain: number;
  };
  additionalServices: {
    premium: number;
    special: number;
    inoperable: number;
    totalAdditional: number;
  };
  tollCosts?: {
    segments: Array<{
      location: string;
      cost: number;
    }>;
    total: number;
  };
  finalPrice: number;
  routeInfo?: {
    isPopularRoute: boolean;
    isRemoteArea: boolean;
  };
  selectedDate?: Date;
}

export const PriceBreakdown = ({
  distance,
  basePrice,
  mainMultipliers,
  additionalServices,
  tollCosts,
  finalPrice,
}: PriceBreakdownProps) => {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Price Breakdown</h2>
        <span className="text-sm text-gray-500">{distance} miles</span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-gray-900">
          <span className="font-medium">Base Price</span>
          <span className="font-semibold">{formatPrice(basePrice)}</span>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <h3 className="font-medium text-gray-900">Main Factors</h3>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-900">Vehicle Type</span>
            <span className="text-blue-600">
              {((mainMultipliers.vehicle - 1) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-900">Weather Conditions</span>
            <span className="text-gray-900">
              {((mainMultipliers.weather - 1) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-900">Traffic Impact</span>
            <span className="text-gray-900">
              {((mainMultipliers.traffic - 1) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-900">Seasonal Adjustment</span>
            <span className="text-gray-900">
              {((mainMultipliers.seasonal - 1) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {additionalServices.totalAdditional > 0 && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-medium text-gray-900">Additional Services</h3>
          <div className="space-y-2 pl-4">
            {additionalServices.premium > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-900">Premium Service</span>
                <span className="text-gray-900">+{(additionalServices.premium * 100).toFixed(1)}%</span>
              </div>
            )}
            {additionalServices.special > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-900">Special Load</span>
                <span className="text-gray-900">+{(additionalServices.special * 100).toFixed(1)}%</span>
              </div>
            )}
            {additionalServices.inoperable > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-900">Inoperable Vehicle</span>
                <span className="text-gray-900">+{(additionalServices.inoperable * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {tollCosts && tollCosts.total > 0 && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-medium text-gray-900">Toll Charges</h3>
          <div className="space-y-2 pl-4">
            {tollCosts.segments.map((segment, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-900">{segment.location}</span>
                <span className="text-gray-900">+{formatPrice(segment.cost)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-900">Total Toll Charges</span>
              <span className="text-gray-900">{formatPrice(tollCosts.total)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center border-t pt-4 text-lg font-bold text-gray-900">
        <span className="flex items-center">
          <DollarSign className="w-5 h-5 mr-1" />
          Final Price
        </span>
        <span>{formatPrice(finalPrice)}</span>
      </div>
    </div>
  );
}