"use client";

import { DollarSign } from 'lucide-react';

interface PriceBreakdownProps {
  distance: number;
  basePrice: number;
  basePriceBreakdown: BasePriceBreakdown;
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

interface BasePriceBreakdown {
  ratePerMile: number;
  distance: number;
  total: number;
}

export const PriceBreakdown = ({
  distance,
  basePrice,
  basePriceBreakdown,
  mainMultipliers,
  additionalServices,
  tollCosts,
  finalPrice,
}: PriceBreakdownProps) => {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatPriceWithPercent = (amount: number, total: number) => 
    `${formatPrice(amount)} (${((amount/total) * 100).toFixed(1)}%)`;
  const formatMultiplierImpact = (multiplier: number, baseAmount: number) => {
    const impact = baseAmount * (multiplier - 1);
    return `${formatPrice(impact)} (${((multiplier - 1) * 100).toFixed(1)}%)`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Price Breakdown</h2>
        <span className="text-sm text-gray-500">{distance} miles</span>
      </div>

      {/* Базовая цена */}
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Base Calculation</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-800">
              <span>Rate per mile</span>
              <span className="font-medium">${basePriceBreakdown.ratePerMile.toFixed(2)}/mile</span>
            </div>
            <div className="flex justify-between text-gray-800">
              <span>Distance</span>
              <span className="font-medium">{Math.round(basePriceBreakdown.distance)} miles</span>
            </div>
            <div className="flex justify-between text-gray-800 border-t pt-2">
              <span>Base Price</span>
              <span className="font-bold">{formatPrice(basePrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Множители */}
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Price Factors</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-800">
              <span>Vehicle Value Impact</span>
              <span className="font-medium text-blue-600">
                {formatMultiplierImpact(mainMultipliers.vehicle, basePrice)}
              </span>
            </div>
            <div className="flex justify-between text-gray-800">
              <span>Weather Impact</span>
              <span className="font-medium text-blue-600">
                {formatMultiplierImpact(mainMultipliers.weather, basePrice)}
              </span>
            </div>
            <div className="flex justify-between text-gray-800">
              <span>Traffic Impact</span>
              <span className="font-medium text-blue-600">
                {formatMultiplierImpact(mainMultipliers.traffic, basePrice)}
              </span>
            </div>
            <div className="flex justify-between text-gray-800">
              <span>Seasonal Impact</span>
              <span className="font-medium text-blue-600">
                {formatMultiplierImpact(mainMultipliers.seasonal, basePrice)}
              </span>
            </div>
            <div className="flex justify-between text-gray-800 border-t pt-2">
              <span>Total Factors Impact</span>
              <span className="font-bold text-blue-700">
                {formatPrice(basePrice * (mainMultipliers.totalMain - 1))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Дополнительные услуги */}
      {additionalServices.totalAdditional > 0 && (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Services</h3>
            <div className="space-y-2">
              {additionalServices.premium > 0 && (
                <div className="flex justify-between text-gray-800">
                  <span>Premium Service</span>
                  <span className="font-medium text-green-600">
                    {formatPrice(basePrice * additionalServices.premium)}
                    {' '}({(additionalServices.premium * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
              {additionalServices.special > 0 && (
                <div className="flex justify-between text-gray-800">
                  <span>Special Load Service</span>
                  <span className="font-medium text-green-600">
                    {formatPrice(basePrice * additionalServices.special)}
                    {' '}({(additionalServices.special * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
              {additionalServices.inoperable > 0 && (
                <div className="flex justify-between text-gray-800">
                  <span>Inoperable Vehicle</span>
                  <span className="font-medium text-green-600">
                    {formatPrice(basePrice * additionalServices.inoperable)}
                    {' '}({(additionalServices.inoperable * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-800 border-t pt-2">
                <span>Total Services Cost</span>
                <span className="font-bold text-green-700">
                  {formatPrice(basePrice * additionalServices.totalAdditional)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Платные дороги */}
      {tollCosts && tollCosts.total > 0 && (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Toll Charges</h3>
            <div className="space-y-2">
              {tollCosts.segments.map((segment, index) => (
                <div key={index} className="flex justify-between text-gray-800">
                  <span>{segment.location}</span>
                  <span className="font-medium text-purple-600">
                    {formatPrice(segment.cost)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-gray-800 border-t pt-2">
                <span>Total Toll Charges</span>
                <span className="font-bold text-purple-700">{formatPrice(tollCosts.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Финальная цена */}
      <div className="mt-6 bg-gray-900 p-4 rounded-lg">
        <div className="flex justify-between items-center text-white">
          <span className="flex items-center text-lg">
            <DollarSign className="w-6 h-6 mr-2" />
            Final Price
          </span>
          <span className="text-xl font-bold">{formatPrice(finalPrice)}</span>
        </div>
      </div>
    </div>
  );
};