"use client";

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import type { MarketInfoProps } from '@/app/components/types';

interface MarketData {
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  demandLevel: 'high' | 'medium' | 'low';
  seasonalTrend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  recentOrders: number;
  competitorPrices: {
    lowest: number;
    highest: number;
    average: number;
  };
}

function getMockMarketData(distance: number, vehicleType: string, selectedDate: Date | undefined): MarketData {
  const basePricePerMile = 
    distance < 500 ? 1.2 :
    distance < 1000 ? 1.1 :
    1.0;

  const basePrice = distance * basePricePerMile;
  
  // Используем выбранную дату или текущую
  const date = selectedDate || new Date();
  const month = date.getMonth();
  const isHighSeason = month >= 5 && month <= 7; // Июнь-Август
  const seasonalMultiplier = isHighSeason ? 1.15 : 1.0;

  const vehicleMultiplier = 
    vehicleType.includes('500k') ? 1.4 :
    vehicleType.includes('300k') ? 1.25 :
    vehicleType.includes('100k') ? 1.15 :
    1.0;

  const adjustedPrice = basePrice * seasonalMultiplier * vehicleMultiplier;

  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  let demandLevel: 'high' | 'medium' | 'low';
  
  if (isHighSeason && isWeekend) {
    demandLevel = 'high';
  } else if (isHighSeason || isWeekend) {
    demandLevel = 'medium';
  } else {
    demandLevel = 'low';
  }

  return {
    averagePrice: Math.round(adjustedPrice),
    priceRange: {
      min: Math.round(adjustedPrice * 0.9),
      max: Math.round(adjustedPrice * 1.1)
    },
    demandLevel,
    seasonalTrend: {
      direction: isHighSeason ? 'up' : 'down',
      percentage: isHighSeason ? 15 : 5
    },
    recentOrders: Math.round(distance / 50),
    competitorPrices: {
      lowest: Math.round(adjustedPrice * 0.85),
      highest: Math.round(adjustedPrice * 1.15),
      average: Math.round(adjustedPrice)
    }
  };
}

export default function MarketInfo({ route, vehicleType, onMarketUpdate, selectedDate }: MarketInfoProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const memoizedMarketData = useMemo(() => marketData, [marketData]);

  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoading(true);
      try {
        const mockData = getMockMarketData(route.distance, vehicleType, selectedDate);
        setMarketData(mockData);
        
        if (onMarketUpdate) {
          onMarketUpdate(mockData.seasonalTrend.direction === 'up' ? 1.1 : 0.9);
        }
      } catch (error) {
        console.error('Error generating market data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchMarketData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [route, vehicleType, onMarketUpdate, selectedDate]);

  if (isLoading || !memoizedMarketData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Market Analysis</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <Activity className="w-6 h-6 mr-2 text-blue-500" />
        Market Analysis
        {selectedDate && 
          <span className="text-sm text-gray-500 ml-2">
            ({selectedDate.toLocaleDateString()})
          </span>
        }
      </h2>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-900">Average Market Price</div>
            <div className="text-xl font-bold text-blue-600">
              ${memoizedMarketData.averagePrice}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-900">Recent Orders</div>
            <div className="text-xl font-bold text-green-600">
              {memoizedMarketData.recentOrders}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Market Trends</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {memoizedMarketData.seasonalTrend.direction === 'up' ? (
                  <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-2 text-red-500" />
                )}
                <span className="text-sm text-gray-900">Seasonal Trend</span>
              </div>
              <span className={`text-sm font-medium ${
                memoizedMarketData.seasonalTrend.direction === 'up' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {memoizedMarketData.seasonalTrend.direction === 'up' ? '+' : '-'}
                {memoizedMarketData.seasonalTrend.percentage}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                <span className="text-sm text-gray-900">Demand Level</span>
              </div>
              <span className={`text-sm font-medium ${
                memoizedMarketData.demandLevel === 'high' 
                  ? 'text-green-600' 
                  : memoizedMarketData.demandLevel === 'medium'
                    ? 'text-orange-600'
                    : 'text-red-600'
              }`}>
                {memoizedMarketData.demandLevel.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Competitor Prices</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-900">Lowest</span>
              <span className="font-medium text-gray-900">${memoizedMarketData.competitorPrices.lowest}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-900">Average</span>
              <span className="font-medium text-gray-900">${memoizedMarketData.competitorPrices.average}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-900">Highest</span>
              <span className="font-medium text-gray-900">${memoizedMarketData.competitorPrices.highest}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm text-gray-900">
            {memoizedMarketData.demandLevel === 'high' ? (
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-2" />
                High demand suggests potential for premium pricing
              </div>
            ) : (
              <div className="flex items-center text-orange-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                Consider competitive pricing to attract orders
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}