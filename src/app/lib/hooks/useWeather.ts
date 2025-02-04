'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { WeatherResponse } from '@/app/types/api.types';

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
        const response = await axios.get<WeatherResponse>(
          'https://api.weatherapi.com/v1/forecast.json',
          {
            params: {
              key: process.env.NEXT_PUBLIC_WEATHER_API_KEY,
              q: `${lat},${lng}`,
              dt: date?.toISOString().split('T')[0]
            }
          }
        );
        setWeather(response.data);
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