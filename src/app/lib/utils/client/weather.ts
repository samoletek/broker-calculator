import axios from 'axios';
import { format } from 'date-fns';
import type { WeatherResponse } from '@/app/types/api.types';
import type { GeoPoint } from '@/app/types/common.types';

export const getWeatherData = async (
  point: GeoPoint,
  date?: Date
): Promise<WeatherResponse> => {
  try {
    const response = await axios.get<WeatherResponse>(
      'https://api.weatherapi.com/v1/forecast.json',
      {
        params: {
          key: process.env.NEXT_PUBLIC_WEATHER_API_KEY,
          q: `${point.lat},${point.lng}`,
          dt: date ? format(date, 'yyyy-MM-dd') : undefined
        }
      }
    );
    
    return response.data as WeatherResponse;
  } catch (error) {
    console.error('Weather API Error:', error);
    throw error;
  }
};

export const calculateWeatherMultiplier = (condition: string): number => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return 1.05;
  if (conditionLower.includes('snow')) return 1.2;
  if (conditionLower.includes('storm') || conditionLower.includes('thunder')) return 1.15;
  if (conditionLower.includes('blizzard') || conditionLower.includes('hurricane')) return 1.2;
  return 1.0;
};