import { useState, useEffect } from 'react';
import { WeatherResponse } from '@/app/types/api.types';
import { getWeatherData } from '@/app/lib/utils/client/weather';

export function useWeather(lat: number, lng: number, date?: Date) {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!lat || !lng) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getWeatherData({ lat, lng }, date);
        setWeather(data);
      } catch (err) {
        setError('Failed to fetch weather data');
        console.error('Weather API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lng, date]);

  return { weather, loading, error };
}