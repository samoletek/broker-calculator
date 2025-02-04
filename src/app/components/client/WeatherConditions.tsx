'use client';

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow } from 'lucide-react';
import { format } from 'date-fns';
import { useWeather } from '@/app/lib/hooks/useWeather';
import { calculateWeatherMultiplier } from '@/app/lib/utils/client/weather';
import type { WeatherPoint, WeatherMapProps } from '@/app/types/components.types';

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

// Функция для получения средней точки маршрута
function getMidPoint(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
  return {
    lat: (start.lat + end.lat) / 2,
    lng: (start.lng + end.lng) / 2
  };
}

const WeatherConditions: React.FC<WeatherMapProps> = memo(({
  routePoints,
  onWeatherUpdate,
  selectedDate
}) => {
  const [weatherData, setWeatherData] = useState<WeatherPoint[]>([]);
  const lastWeatherRef = useRef<{ multiplier: number } | null>(null);

  const midPoint = useMemo(() => 
    getMidPoint(routePoints.pickup, routePoints.delivery),
    [routePoints.pickup, routePoints.delivery]
  );

  const { weather: pickupWeather } = useWeather(routePoints.pickup.lat, routePoints.pickup.lng, selectedDate);
  const { weather: midPointWeather } = useWeather(midPoint.lat, midPoint.lng, selectedDate);
  const { weather: deliveryWeather } = useWeather(routePoints.delivery.lat, routePoints.delivery.lng, selectedDate);

  useEffect(() => {
    if (!pickupWeather || !midPointWeather || !deliveryWeather) return;

    const weatherPoints = [
      {
        location: 'Pickup',
        condition: pickupWeather.current.condition.text,
        temperature: pickupWeather.current.temp_f,
        multiplier: calculateWeatherMultiplier(pickupWeather.current.condition.text)
      },
      {
        location: 'Mid-Route',
        condition: midPointWeather.current.condition.text,
        temperature: midPointWeather.current.temp_f,
        multiplier: calculateWeatherMultiplier(midPointWeather.current.condition.text)
      },
      {
        location: 'Delivery',
        condition: deliveryWeather.current.condition.text,
        temperature: deliveryWeather.current.temp_f,
        multiplier: calculateWeatherMultiplier(deliveryWeather.current.condition.text)
      }
    ];

    setWeatherData(weatherPoints);

    const worstMultiplier = Math.max(...weatherPoints.map(r => r.multiplier));
    if (!lastWeatherRef.current || lastWeatherRef.current.multiplier !== worstMultiplier) {
      lastWeatherRef.current = { multiplier: worstMultiplier };
      onWeatherUpdate(worstMultiplier);
    }
  }, [pickupWeather, midPointWeather, deliveryWeather, onWeatherUpdate]);

  const memoizedWeatherData = useMemo(() => weatherData, [weatherData]);

  return (
    <div className="w-[478px] h-[422px] p-24 rounded-[24px] bg-white">
      <div className="flex items-center justify-between mb-16">
        <h2 className="font-jost text-[32px] font-bold">
          Weather Conditions
        </h2>
        {selectedDate && (
          <span className="text-gray-600">
            ({format(selectedDate, 'yyyy-MM-dd')})
          </span>
        )}
      </div>

      <div className="space-y-16">
        {memoizedWeatherData.map((point, index) => (
          <div
            key={`${point.location}-${index}`}
            className="flex items-center justify-between bg-[#F6F6FA] rounded-[24px] p-16"
          >
            <div className="flex items-center gap-16">
              {getWeatherIcon(point.condition)}
              <div>
                <div className="font-medium">{point.location}</div>
                <div className="text-gray-600">{point.condition}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{point.temperature}°F</div>
              <div className="text-gray-600">
                {point.multiplier > 1 ? `+${((point.multiplier - 1) * 100).toFixed(0)}% Impact` : 'No Impact'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {memoizedWeatherData.length > 0 && (
        <div className="mt-16">
          <span>Weather Impact Summary: </span>
          <span className="text-primary">
            {lastWeatherRef.current?.multiplier === 1 
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