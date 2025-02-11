import { TrafficData, TrafficPoint } from '@/app/types/components.types';

export const calculateEstimatedTransitTime = (distance: number): string => {
 const DAILY_DRIVING_MILES = 500; // Active miles per day
 
 const transitDays = Math.ceil(distance / DAILY_DRIVING_MILES);
 
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
    
    const now = new Date();
    const departureTime = new Date(date);
    
    if (departureTime.toDateString() === now.toDateString()) {
      departureTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    }
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
    
    const normalDuration = leg.duration?.value || 0;
    const durationInTraffic = leg.duration_in_traffic?.value || normalDuration;
    const delay = Math.round((durationInTraffic - normalDuration) / 60); // minutes
    
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

    const path = result.routes[0].overview_path;
    const points: TrafficPoint[] = path.map(point => ({
      lat: point.lat(),
      lng: point.lng(),
      speed: 0,
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

export const getRoutePoints = (route: google.maps.DirectionsResult): Array<{ lat: number; lng: number }> => {
 const points: Array<{ lat: number; lng: number }> = [];
 const path = route.routes[0].overview_path;
 
 // Take every 10th point of the route for traffic analysis
 for (let i = 0; i < path.length; i += 10) {
   points.push({
     lat: path[i].lat(),
     lng: path[i].lng()
   });
 }
 
 return points;
};