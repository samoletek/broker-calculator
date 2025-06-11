import { TrafficData, TrafficPoint } from '@/app/types/components.types';
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

export const analyzeTrafficConditions = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  date: Date,
  google: typeof window.google,
  config: PricingConfig
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

    const lightThreshold = config.transport.trafficThresholds.lightThreshold;
    const heavyThreshold = config.transport.trafficThresholds.heavyThreshold;

    if (congestion < lightThreshold) {
      status = 'light';
      multiplier = config.transport.trafficMultipliers.light;
    } else if (congestion < heavyThreshold) {
      status = 'moderate';
      multiplier = config.transport.trafficMultipliers.moderate;
    } else {
      status = 'heavy';
      multiplier = config.transport.trafficMultipliers.heavy;
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