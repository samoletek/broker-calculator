import axios from 'axios';
import { format } from 'date-fns';
import type { WeatherResponse } from '@/app/types/api.types';
import type { GeoPoint } from '@/app/types/common.types';
import { PricingConfig } from '../../../../types/pricing-config.types';

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

export const getWeatherMultipliers = (config: PricingConfig): Record<WeatherConditionType | 'extreme', number> => ({
  'clear': config.weatherMultipliers.clear,
  'cloudy': config.weatherMultipliers.cloudy,
  'rain': config.weatherMultipliers.rain,
  'snow': config.weatherMultipliers.snow,
  'storm': config.weatherMultipliers.storm,
  'extreme': config.weatherMultipliers.extreme,
});

// Основная функция получения погодных данных
export const getWeatherData = async (
  point: GeoPoint,
  date?: Date
): Promise<WeatherResponse> => {
  try {
    // Используем наш серверный API вместо прямого вызова Weather API
    const response = await axios.post<WeatherResponse>('/api/weather', {
      lat: point.lat,
      lng: point.lng,
      date: date ? format(date, 'yyyy-MM-dd') : undefined
    });
    
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
export const calculateWeatherMultiplier = (condition: string, config: PricingConfig): number => {
  const weatherCondition = determineWeatherCondition(condition);
  const multipliers = getWeatherMultipliers(config);
  return multipliers[weatherCondition];
};

// Функция для анализа погодных условий по маршруту
export const analyzeRouteWeather = async (
  points: GeoPoint[],
  config: PricingConfig,
  date?: Date
): Promise<WeatherData[]> => {
  try {
    const weatherDataPromises = points.map(async point => {
      const response = await getWeatherData(point, date);
      const condition = response.current.condition.text;
      
      return {
        condition,
        temperature: response.current.temp_f,
        multiplier: calculateWeatherMultiplier(condition, config)
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