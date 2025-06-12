import { TrafficData } from '@/app/types/components.types';
import { PricingConfig } from '../../../../types/pricing-config.types';

export const calculateEstimatedTransitTime = (distance: number, config: PricingConfig): string => {
 const dailyDrivingMiles = config.transport.dailyDrivingMiles;
 
 const transitDays = Math.ceil(distance / dailyDrivingMiles);
 
 if (transitDays === 1) {
   return '1 day';
 } else if (transitDays < 1) {
   return 'Less than 1 day';
 } else {
   return `${transitDays} days`;
 }
};

// DEPRECATED: Функция использует клиентский Google Maps API
// Traffic analysis теперь выполняется на server-side
export const analyzeTrafficConditions = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  date: Date,
  config: PricingConfig
): Promise<TrafficData> => {
  // Возвращаем дефолтные значения, поскольку traffic analysis перенесен на сервер
  console.warn('analyzeTrafficConditions deprecated - use server-side API');
  return {
    points: [],
    status: 'light',
    delay: 0,
    multiplier: config.transport.trafficMultipliers.light
  };
};

// DEPRECATED: Функция использует Google Maps типы
// Заменена на server-side обработку маршрутов
export const getRoutePoints = (route: import('@/app/types/maps.types').DirectionsResult): Array<{ lat: number; lng: number }> => {
  console.warn('getRoutePoints deprecated - route points now processed server-side');
  return [];
};