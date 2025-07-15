'use client';

import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
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
  selectedDate,
  config
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Кэш для предотвращения повторных запросов
  const cacheRef = useRef<{[key: string]: { data: WeatherData[], timestamp: number }}>({});
  const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

  const midPoint = useMemo(() => 
    getMidPoint(routePoints.pickup, routePoints.delivery),
    [routePoints.pickup, routePoints.delivery]
  );

  // Стабильная функция для обновления погоды
  const updateWeatherMultiplier = useCallback((weatherData: WeatherData[]) => {
    const worstMultiplier = getWorstWeatherMultiplier(weatherData);
    if (onWeatherUpdate) {
      onWeatherUpdate(worstMultiplier || 1);
    }
  }, []); // Пустые dependencies - функция стабильная

  useEffect(() => {
    const fetchWeatherData = async () => {
      // Создаем ключ для кэширования
      const cacheKey = `${routePoints.pickup.lat}-${routePoints.pickup.lng}-${routePoints.delivery.lat}-${routePoints.delivery.lng}-${selectedDate?.toDateString()}`;
      
      // Проверяем кэш
      const cachedData = cacheRef.current[cacheKey];
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log('🌦️ Using cached weather data');
        setWeatherData(cachedData.data);
        updateWeatherMultiplier(cachedData.data);
        return;
      }

      if (isLoading) return; // Предотвращаем множественные запросы
      
      setIsLoading(true);
      
      try {
        console.log('🌦️ Fetching fresh weather data');
        
        const points = [
          routePoints.pickup,
          midPoint,
          routePoints.delivery
        ];

        const weatherResults = await analyzeRouteWeather(points, config, selectedDate);
        
        const enrichedWeatherData = weatherResults.map((data, index) => ({
          ...data,
          location: index === 0 ? 'Pickup' : index === 1 ? 'Mid-Route' : 'Delivery'
        }));

        // Сохраняем в кэш
        cacheRef.current[cacheKey] = {
          data: enrichedWeatherData,
          timestamp: Date.now()
        };

        setWeatherData(enrichedWeatherData);
        updateWeatherMultiplier(enrichedWeatherData);
        
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (routePoints && selectedDate) {
      fetchWeatherData();
    }
  }, [
    routePoints.pickup.lat, 
    routePoints.pickup.lng, 
    routePoints.delivery.lat, 
    routePoints.delivery.lng, 
    selectedDate?.toDateString(), 
    midPoint.lat, 
    midPoint.lng,
    updateWeatherMultiplier,
    isLoading
  ]);

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
        {isLoading && weatherData.length === 0 ? (
          <div className="text-center text-gray-500">Loading weather data...</div>
        ) : (
          weatherData.map((point, index) => (
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
          ))
        )}
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