"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import type { WeatherMapProps, WeatherPoint } from './types';

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

function processWeatherData(data: any, point: any): WeatherPoint {
  const condition = data.current.condition.text.toLowerCase();
  let multiplier = 1.0;

  if (condition.includes('rain') || condition.includes('drizzle')) {
    multiplier = 1.05;
  } else if (condition.includes('snow')) {
    multiplier = 1.2;
  } else if (condition.includes('storm') || condition.includes('thunder')) {
    multiplier = 1.15;
  } else if (condition.includes('blizzard') || condition.includes('hurricane')) {
    multiplier = 1.2;
  }

  return {
    location: point.location,
    condition: data.current.condition.text,
    temperature: data.current.temp_f,
    multiplier
  };
}

function getWeatherIcon(condition: string) {
  switch(condition.toLowerCase()) {
    case 'clear':
    case 'sunny':
      return <Sun className="w-5 h-5 text-yellow-500" />;
    case 'rain':
    case 'drizzle':
      return <CloudRain className="w-5 h-5 text-blue-500" />;
    case 'snow':
      return <CloudSnow className="w-5 h-5 text-blue-300" />;
    default:
      return <Cloud className="w-5 h-5 text-gray-500" />;
  }
}

export default function WeatherMap({ routePoints, onWeatherUpdate, selectedDate }: WeatherMapProps) {
  const [weatherData, setWeatherData] = useState<WeatherPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weatherCache = useRef<{[key: string]: WeatherPoint[]}>({});
  const requestInProgress = useRef<boolean>(false);
  const mounted = useRef<boolean>(true);

  const memoizedWeatherData = useMemo(() => weatherData, [weatherData]);

  const fetchWeatherData = useCallback(async () => {
    try {
      const intermediatePoints = calculateRoutePoints(routePoints.pickup, routePoints.delivery);
      const points = [
        { ...routePoints.pickup, location: 'Pickup' },
        ...intermediatePoints.map((point, idx) => ({ ...point, location: `Waypoint ${idx + 1}` })),
        { ...routePoints.delivery, location: 'Delivery' }
      ];

      requestInProgress.current = true;
      setIsLoading(true);
      setError(null);

      const weatherPromises = points.map(async point => {
        try {
          const response = await axios.get(
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
          return processWeatherData({ current: { condition: { text: 'Clear' }, temp_f: 0 } }, point);
        }
      });

      const results = await Promise.all(weatherPromises);
      
      if (mounted.current) {
        setWeatherData(results);
        const worstMultiplier = Math.max(...results.map(r => r.multiplier));
        onWeatherUpdate(worstMultiplier);
        
        // Сохраняем в кэш после успешного получения данных
        const currentFetchKey = `${routePoints.pickup.lat},${routePoints.pickup.lng}-${routePoints.delivery.lat},${routePoints.delivery.lng}-${selectedDate?.toISOString()}`;
        weatherCache.current[currentFetchKey] = results;
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      if (mounted.current) {
        setError('Failed to fetch weather data. Please try again later.');
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
        requestInProgress.current = false;
      }
    }
  }, [routePoints, selectedDate, onWeatherUpdate]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      weatherCache.current = {};
    };
  }, []);

  useEffect(() => {
    if (!routePoints.pickup.lat || !routePoints.delivery.lat) {
      return;
    }

    const currentFetchKey = `${routePoints.pickup.lat},${routePoints.pickup.lng}-${routePoints.delivery.lat},${routePoints.delivery.lng}-${selectedDate?.toISOString()}`;

    // Если данные уже в кэше, используем их
    if (weatherCache.current[currentFetchKey]) {
      setWeatherData(weatherCache.current[currentFetchKey]);
      const worstMultiplier = Math.max(...weatherCache.current[currentFetchKey].map(r => r.multiplier));
      onWeatherUpdate(worstMultiplier);
      return;
    }

    // Если данных нет в кэше, делаем запрос
    if (!requestInProgress.current) {
      fetchWeatherData();
    }
  }, [routePoints.pickup.lat, routePoints.pickup.lng, routePoints.delivery.lat, routePoints.delivery.lng, selectedDate]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Cloud className="w-6 h-6 mr-2 text-blue-500" />
        Weather Conditions
        {selectedDate && 
          <span className="text-sm text-gray-500 ml-2">
            ({format(selectedDate, 'yyyy-MM-dd')})
          </span>
        }
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
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
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                {getWeatherIcon(point.condition)}
                <div>
                  <div className="font-medium text-gray-900">{point.location}</div>
                  <div className="text-sm text-gray-600">{point.condition}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{point.temperature}°F</div>
                <div className={`text-sm ${
                  point.multiplier > 1 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {point.multiplier > 1 ? `+${((point.multiplier - 1) * 100).toFixed(0)}%` : 'No Impact'}
                </div>
              </div>
            </div>
          ))}

          {memoizedWeatherData.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Weather Impact Summary:
                {Math.max(...memoizedWeatherData.map(w => w.multiplier)) > 1 ? (
                  <span className="text-orange-600 ml-2">
                    Route affected by adverse weather conditions
                  </span>
                ) : (
                  <span className="text-green-600 ml-2">
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