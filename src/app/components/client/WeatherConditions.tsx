'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow } from 'lucide-react';
import { format } from 'date-fns';
import type { WeatherMapProps } from '@/app/types/components.types';
import { 
  WeatherData, 
  analyzeRouteWeather, 
  getWorstWeatherMultiplier,
  determineWeatherCondition,
  WEATHER_CONDITIONS 
} from '@/app/lib/utils/client/weather';

function getWeatherIcon(condition: string) {
  const weatherCondition = determineWeatherCondition(condition);
  
  switch(weatherCondition) {
    case WEATHER_CONDITIONS.CLEAR:
      return <Sun className="w-5 h-5 text-yellow-500" />;
    case WEATHER_CONDITIONS.RAIN:
      return <CloudRain className="w-5 h-5 text-blue-500" />;
    case WEATHER_CONDITIONS.SNOW:
      return <CloudSnow className="w-5 h-5 text-blue-300" />;
    default:
      return <Cloud className="w-5 h-5 text-gray-500" />;
  }
}

function getMidPoint(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
  return {
    lat: (start.lat + end.lat) / 2,
    lng: (start.lng + end.lng) / 2
  };
}

const WeatherConditions = memo<WeatherMapProps>(({
  routePoints,
  onWeatherUpdate,
  selectedDate
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);

  const midPoint = useMemo(() => 
    getMidPoint(routePoints.pickup, routePoints.delivery),
    [routePoints.pickup, routePoints.delivery]
  );

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const points = [
          routePoints.pickup,
          midPoint,
          routePoints.delivery
        ];

        const weatherResults = await analyzeRouteWeather(points, selectedDate);
        
        const enrichedWeatherData = weatherResults.map((data, index) => ({
          ...data,
          location: index === 0 ? 'Pickup' : index === 1 ? 'Mid-Route' : 'Delivery'
        }));

        setWeatherData(enrichedWeatherData);

        const worstMultiplier = getWorstWeatherMultiplier(enrichedWeatherData);
        if (onWeatherUpdate) {
          onWeatherUpdate(worstMultiplier || 1);
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    if (routePoints && selectedDate) {
      fetchWeatherData();
    }
  }, [routePoints, selectedDate, midPoint, onWeatherUpdate]);

  return (
    <div className="w-full p-4 sm:p-40 space-y-10 sm:space-y-20 bg-white rounded-[24px] border border-primary/10">
      <div className="flex items-center justify-between">
        <h2 className="font-jost text-[32px] font-bold">Weather Conditions</h2>
        {selectedDate && (
          <span className="text-sm sm:text-base text-gray-600">
            ({format(selectedDate, 'yyyy-MM-dd')})
          </span>
        )}
      </div>
  
      <div className="space-y-8 sm:space-y-16">
        {weatherData.map((point, index) => (
          <div
            key={`${point.location}-${index}`}
            className="flex items-center justify-between bg-[#F6F6FA] rounded-[24px] p-4 sm:p-16"
          >
            <div className="flex items-center gap-8 sm:gap-16">
              {getWeatherIcon(point.condition)}
              <div>
                <div className="font-medium text-sm sm:text-base">{point.location}</div>
                <div className="text-gray-600 text-xs sm:text-sm">{point.condition}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm sm:text-base">{point.temperature}°F</div>
            </div>
          </div>
        ))}
      </div>
  
      {weatherData.length > 0 && (
        <div className="text-sm sm:text-base">
          <span>Weather Summary: </span>
          <span className="text-primary">
            {getWorstWeatherMultiplier(weatherData) === 1 
              ? 'Good weather conditions throughout the route'
              : 'Weather conditions may affect delivery time'}
          </span>
        </div>
      )}
    </div>
  );
});

WeatherConditions.displayName = 'WeatherConditions';

export default WeatherConditions;