import axios from 'axios';
import { format } from 'date-fns';
import type { WeatherResponse } from '@/app/types/api.types';
import type { GeoPoint } from '@/app/types/common.types';
import { trackApiRequest } from '@/app/lib/hooks/useRateLimiter';

// Общие типы для погодных условий
export interface WeatherData {
  condition: string;
  temperature: number;
  multiplier: number;
  location?: string;
  details?: string;
}

// Константы для погодных условий
export const WEATHER_CONDITIONS = {
  CLEAR: 'clear',
  RAIN: 'rain',
  SNOW: 'snow',
  STORM: 'storm',
  CLOUDY: 'cloudy'
} as const;

type WeatherConditionType = typeof WEATHER_CONDITIONS[keyof typeof WEATHER_CONDITIONS];

export const WEATHER_MULTIPLIERS: Record<WeatherConditionType, number> = {
  'clear': 1.0,
  'cloudy': 1.0,
  'rain': 1.05,
  'snow': 1.2,
  'storm': 1.15,
};

// Основная функция получения погодных данных
export const getWeatherData = async (
  point: GeoPoint,
  date?: Date
): Promise<WeatherResponse> => {
  try {
    // Проверяем лимит API запросов
    if (!trackApiRequest()) {
      throw new Error('API limit reached. Try again later.');
    }
    
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
    
    return response.data;
  } catch (error) {
    console.error('Weather API Error:', error);
    throw error;
  }
};

// Функция определения погодных условий
export const determineWeatherCondition = (condition: string): WeatherConditionType => {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return 'rain';
  }
  if (conditionLower.includes('snow')) {
    return 'snow';
  }
  if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
    return 'storm';
  }
  if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
    return 'cloudy';
  }
  return 'clear';
};

// Функция расчета погодного множителя
export const calculateWeatherMultiplier = (condition: string): number => {
  const weatherCondition = determineWeatherCondition(condition);
  return WEATHER_MULTIPLIERS[weatherCondition];
};

// Функция для анализа погодных условий по маршруту
export const analyzeRouteWeather = async (
  points: GeoPoint[],
  date?: Date
): Promise<WeatherData[]> => {
  try {
    const weatherDataPromises = points.map(async point => {
      const response = await getWeatherData(point, date);
      const condition = response.current.condition.text;
      
      return {
        condition,
        temperature: response.current.temp_f,
        multiplier: calculateWeatherMultiplier(condition)
      };
    });

    return await Promise.all(weatherDataPromises);
  } catch (error) {
    console.error('Route weather analysis error:', error);
    throw error;
  }
};

// Функция получения наихудшего погодного множителя на маршруте
export const getWorstWeatherMultiplier = (weatherData: WeatherData[]): number => {
  return Math.max(...weatherData.map(data => data.multiplier));
};