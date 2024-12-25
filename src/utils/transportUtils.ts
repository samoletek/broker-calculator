import { TrafficData, TrafficPoint } from '@/app/components/types';

export const calculateEstimatedTransitTime = (distance: number): string => {
 const DAILY_DRIVING_MILES = 500; // Активные мили в световой день
 
 // Сколько полных дней потребуется
 const transitDays = Math.ceil(distance / DAILY_DRIVING_MILES);
 
 // Форматирование результата
 if (transitDays === 1) {
   return '1 day';
 } else if (transitDays < 1) {
   return 'Less than 1 day';
 } else {
   return `${transitDays} days`;
 }
};

export const analyzeTrafficConditions = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  date: Date,
  google: typeof window.google
): Promise<TrafficData> => {
  try {
    const service = new google.maps.DirectionsService();
    
    // Проверяем, что выбранная дата не в прошлом
    const now = new Date();
    const departureTime = new Date(date);
    
    // Если дата сегодня, используем текущее время
    if (departureTime.toDateString() === now.toDateString()) {
      departureTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    }
    // Если дата в прошлом, используем текущее время
    else if (departureTime < now) {
      departureTime.setTime(now.getTime());
    }
    
    const request = {
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: departureTime,
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      }
    };

    const result = await service.route(request);
    const leg = result.routes[0].legs[0];
    
    // Вычисляем разницу между обычным временем и временем с учетом трафика
    const normalDuration = leg.duration?.value || 0;
    const durationInTraffic = leg.duration_in_traffic?.value || normalDuration;
    const delay = Math.round((durationInTraffic - normalDuration) / 60); // в минутах
    
    // Вычисляем загруженность
    const congestion = durationInTraffic / normalDuration;
    
    let status: 'light' | 'moderate' | 'heavy';
    let multiplier: number;

    if (congestion < 1.3) {
      status = 'light';
      multiplier = 1.0;
    } else if (congestion < 1.6) {
      status = 'moderate';
      multiplier = 1.1;
    } else {
      status = 'heavy';
      multiplier = 1.2;
    }

    // Собираем точки маршрута
    const path = result.routes[0].overview_path;
    const points: TrafficPoint[] = path.map(point => ({
      lat: point.lat(),
      lng: point.lng(),
      speed: 0, // Google не предоставляет точную скорость
      congestion: congestion
    }));

    return {
      points,
      status,
      delay,
      multiplier
    };
  } catch (error) {
    console.error('Error analyzing traffic:', error);
    return {
      points: [],
      status: 'light',
      delay: 0,
      multiplier: 1.0
    };
  }
};

// Вспомогательная функция для получения точек маршрута
export const getRoutePoints = (route: google.maps.DirectionsResult): Array<{ lat: number; lng: number }> => {
 const points: Array<{ lat: number; lng: number }> = [];
 const path = route.routes[0].overview_path;
 
 // Берем каждую 10-ю точку маршрута для анализа трафика
 for (let i = 0; i < path.length; i += 10) {
   points.push({
     lat: path[i].lat(),
     lng: path[i].lng()
   });
 }
 
 return points;
};