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
    // Используем наш серверный API вместо прямого вызова Weather API с коротким таймаутом
    const response = await axios.post<WeatherResponse>('/api/weather', {
      lat: point.lat,
      lng: point.lng,
      date: date ? format(date, 'yyyy-MM-dd') : undefined
    }, {
      timeout: 2000 // 2 секунды таймаут для каждого запроса
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

// Функция для создания альтернативных точек (сдвиг для погоды)
const getAlternativePoint = (point: GeoPoint, attempt: number = 1): GeoPoint => {
  const offset = 0.01 * attempt; // Увеличиваем сдвиг с каждой попыткой
  const directions = [
    { lat: offset, lng: 0 },      // север
    { lat: -offset, lng: 0 },     // юг  
    { lat: 0, lng: offset },      // восток
    { lat: 0, lng: -offset },     // запад
    { lat: offset, lng: offset }, // северо-восток
  ];
  
  const direction = directions[(attempt - 1) % directions.length];
  return {
    lat: point.lat + direction.lat,
    lng: point.lng + direction.lng
  };
};

// Функция получения погоды с retry для альтернативных точек
const getWeatherWithRetry = async (
  point: GeoPoint,
  config: PricingConfig,
  date?: Date,
  maxAttempts: number = 3
): Promise<WeatherData> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const targetPoint = attempt === 1 ? point : getAlternativePoint(point, attempt - 1);
      const response = await getWeatherData(targetPoint, date);
      
      return {
        condition: response.current.condition.text,
        temperature: response.current.temp_f,
        multiplier: calculateWeatherMultiplier(response.current.condition.text, config)
      };
    } catch (error) {
      console.warn(`Weather attempt ${attempt} failed for point:`, point, error);
      
      // Если это последняя попытка, выбрасываем ошибку
      if (attempt === maxAttempts) {
        throw error;
      }
    }
  }
  
  // Этот код недостижим, но TypeScript требует return
  throw new Error('All weather attempts failed');
};

// Функция для анализа погодных условий по маршруту
export const analyzeRouteWeather = async (
  points: GeoPoint[],
  config: PricingConfig,
  date?: Date
): Promise<WeatherData[]> => {
  try {
    // Параллельные запросы с retry логикой
    const weatherResults = await Promise.allSettled(
      points.map(point => getWeatherWithRetry(point, config, date, 3))
    );

    // Обрабатываем результаты
    const weatherData: WeatherData[] = [];
    
    for (let i = 0; i < weatherResults.length; i++) {
      const result = weatherResults[i];
      
      if (result.status === 'fulfilled') {
        weatherData.push(result.value);
      } else {
        // Если все retry упали - это техническая ошибка API
        console.error(`Weather failed for point ${i}:`, result.reason);
        throw new Error(`Weather API unavailable for route point ${i + 1}`);
      }
    }

    return weatherData;
  } catch (error) {
    console.error('Route weather analysis error:', error);
    throw error;
  }
};

// Функция получения наихудшего погодного множителя на маршруте
export const getWorstWeatherMultiplier = (weatherData: WeatherData[]): number => {
  return Math.max(...weatherData.map(data => data.multiplier));
};