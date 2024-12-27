"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import type { WeatherMapProps, WeatherPoint, WeatherResponse } from './types';

function calculateRoutePoints(start: {lat: number; lng: number}, end: {lat: number; lng: number}) {
  const points = [];
  const numPoints = 1;
  
  for (let i = 1; i <= numPoints; i++) {
    const fraction = i / (numPoints + 1);
    points.push({
      lat: start.lat + (end.lat - start.lat) * fraction,
      lng: start.lng + (end.lng - start.lng) * fraction
    });
  }
  
  return points;
}

function processWeatherData(data: WeatherResponse, point: { lat: number; lng: number; location: string }): WeatherPoint {
  const condition = data.current.condition.text.toLowerCase();
  let multiplier = 1.0;

  const conditionMultipliers: Record<string, number> = {
    'rain': 1.05,
    'drizzle': 1.05,
    'snow': 1.2,
    'storm': 1.15,
    'thunder': 1.15,
    'blizzard': 1.2,
    'hurricane': 1.2
  };

  for (const [key, value] of Object.entries(conditionMultipliers)) {
    if (condition.includes(key)) {
      multiplier = value;
      break;
    }
  }

  return {
    location: point.location,
    condition: data.current.condition.text,
    temperature: data.current.temp_f,
    multiplier
  };
}

function getWeatherIcon(condition: string) {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    return <Sun className="w-5 h-5 text-yellow-500" />;
  }
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return <CloudRain className="w-5 h-5 text-blue-500" />;
  }
  if (conditionLower.includes('snow')) {
    return <CloudSnow className="w-5 h-5 text-blue-300" />;
  }
  return <Cloud className="w-5 h-5 text-gray-500" />;
}

export default function WeatherMap({ 
  routePoints, 
  onWeatherUpdate, 
  selectedDate 
}: WeatherMapProps) {
  const [weatherData, setWeatherData] = useState<WeatherPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weatherCache = useRef<{[key: string]: WeatherPoint[]}>({});
  const requestInProgress = useRef<boolean>(false);
  const lastWeatherRef = useRef<{ multiplier: number } | null>(null);

  const getCacheKey = useCallback(() => {
    return `${routePoints.pickup.lat},${routePoints.pickup.lng}-${routePoints.delivery.lat},${routePoints.delivery.lng}-${selectedDate?.toISOString()}`;
  }, [routePoints.pickup, routePoints.delivery, selectedDate]);

  const updateWeatherState = useCallback((weatherPoints: WeatherPoint[]) => {
    setWeatherData(weatherPoints);
    const worstMultiplier = Math.max(...weatherPoints.map(r => r.multiplier));
    
    if (!lastWeatherRef.current || lastWeatherRef.current.multiplier !== worstMultiplier) {
      lastWeatherRef.current = { multiplier: worstMultiplier };
      onWeatherUpdate(worstMultiplier);
    }
  }, [onWeatherUpdate]);

  const fetchWeatherData = useCallback(async () => {
    const cacheKey = getCacheKey();
    if (requestInProgress.current) return;
    
    try {
      requestInProgress.current = true;
      setIsLoading(true);
      setError(null);

      const intermediatePoints = calculateRoutePoints(routePoints.pickup, routePoints.delivery);
      const points = [
        { ...routePoints.pickup, location: 'Pickup' },
        ...intermediatePoints.map((point, idx) => ({ ...point, location: `Waypoint ${idx + 1}` })),
        { ...routePoints.delivery, location: 'Delivery' }
      ];

      const weatherPromises = points.map(async point => {
        try {
          const response = await axios.get<WeatherResponse>(
            'https://api.weatherapi.com/v1/forecast.json',
            {
              params: {
                key: process.env.NEXT_PUBLIC_WEATHER_API_KEY,
                q: `${point.lat},${point.lng}`,
                dt: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
              }
            }
          );
          
          return processWeatherData(response.data, point);
        } catch (error) {
          console.error('Error fetching weather for point:', point, error);
          return processWeatherData({
            current: { 
              condition: { text: 'Clear' }, 
              temp_f: 0 
            }
          }, point);
        }
      });

      const results = await Promise.all(weatherPromises);
      weatherCache.current[cacheKey] = results;
      updateWeatherState(results);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Failed to fetch weather data. Please try again later.');
    } finally {
      setIsLoading(false);
      requestInProgress.current = false;
    }
  }, [routePoints, selectedDate, getCacheKey, updateWeatherState]);

  useEffect(() => {
    const cacheKey = getCacheKey();
    if (weatherCache.current[cacheKey]) {
      updateWeatherState(weatherCache.current[cacheKey]);
    } else {
      fetchWeatherData();
    }
  }, [getCacheKey, fetchWeatherData, updateWeatherState]);

  const memoizedWeatherData = useMemo(() => weatherData, [weatherData]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Cloud className="w-6 h-6 mr-2 text-blue-500" />
        Weather Conditions
        {selectedDate && 
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            ({format(selectedDate, 'yyyy-MM-dd')})
          </span>
        }
      </h2>
  
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
  
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Wind className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {memoizedWeatherData.map((point, index) => (
            <div
              key={`${point.location}-${index}`}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex items-center space-x-3">
                {getWeatherIcon(point.condition)}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{point.location}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{point.condition}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">{point.temperature}°F</div>
                <div className={`text-sm ${
                  point.multiplier > 1 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {point.multiplier > 1 ? `+${((point.multiplier - 1) * 100).toFixed(0)}%` : 'No Impact'}
                </div>
              </div>
            </div>
          ))}
  
          {memoizedWeatherData.length > 0 && (
            <div className="mt-4 pt-4 border-t dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Weather Impact Summary:
                {Math.max(...memoizedWeatherData.map(w => w.multiplier)) > 1 ? (
                  <span className="text-orange-600 dark:text-orange-400 ml-2">
                    Route affected by adverse weather conditions
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400 ml-2">
                    Good weather conditions throughout the route
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}