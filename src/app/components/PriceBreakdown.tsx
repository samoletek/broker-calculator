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
    autoShow: number;
    fuel: number;
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
  
  const formatMultiplierImpact = (multiplier: number, baseAmount: number) => {
    const percentage = (multiplier - 1) * 100;
    const impact = baseAmount * (multiplier - 1);
    return `${formatPrice(impact)} (${percentage.toFixed(1)}%)`;
  };

  const calculateTotalFactorsImpact = (basePrice: number, multipliers: typeof mainMultipliers) => {
    // Считаем общий процент влияния всех факторов
    const totalPercentage = 
      (multipliers.vehicle - 1) + 
      (multipliers.weather - 1) + 
      (multipliers.traffic - 1) +
      (multipliers.fuel - 1) + 
      (multipliers.autoShow - 1);

    // Применяем общий процент к базовой цене
    return basePrice * totalPercentage;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Price Breakdown</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{distance} miles</span>
      </div>

      {/* Базовая цена */}
      <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Base Calculation</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-800 dark:text-gray-200">
              <span>Rate per mile</span>
              <span className="font-medium">${basePriceBreakdown.ratePerMile.toFixed(2)}/mile</span>
            </div>
            <div className="flex justify-between text-gray-800 dark:text-gray-200">
              <span>Distance</span>
              <span className="font-medium">{Math.round(basePriceBreakdown.distance)} miles</span>
            </div>
            <div className="flex justify-between text-gray-800 dark:text-gray-200 border-t pt-2">
              <span>Base Price</span>
              <span className="font-bold">{formatPrice(basePrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Множители */}
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Price Factors</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-800 dark:text-gray-200">
              <span>Vehicle Value Impact</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
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
              <span>Diesel Price Impact</span>
              <span className="font-medium text-blue-600">
                {formatMultiplierImpact(mainMultipliers.fuel, basePrice)}
              </span>
            </div>
            <div className="flex justify-between text-gray-800">
              <span>Auto Show Impact</span>
              <span className="font-medium text-blue-600">
                {formatMultiplierImpact(mainMultipliers.autoShow, basePrice)}
              </span>
            </div>
            <div className="flex justify-between text-gray-800 border-t pt-2">
              <span>Total Factors Impact</span>
              <span className="font-bold text-blue-700">
                {formatPrice(calculateTotalFactorsImpact(basePrice, mainMultipliers))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Дополнительные услуги */}
      {additionalServices.totalAdditional > 0 && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Services</h3>
            <div className="space-y-2">
              {additionalServices.premium > 0 && (
                  <div className="flex justify-between text-gray-800 dark:text-gray-200">
                    <span>Premium Service</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
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
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Toll Charges</h3>
            <div className="space-y-2">
              {tollCosts.segments.map((segment, index) => (
                <div key={index} className="flex justify-between text-gray-800">
                  <span>{segment.location}</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
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