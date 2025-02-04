import type { BasePriceBreakdown, GeoPoint } from './common.types';

export interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export interface GoogleMapProps {
  mapData: google.maps.DirectionsResult;
}

export interface WeatherPoint {
  location: string;
  condition: string;
  temperature: number;
  multiplier: number;
}

export interface WeatherMapProps {
  routePoints: {
    pickup: GeoPoint;
    delivery: GeoPoint;
    waypoints: GeoPoint[];
  };
  selectedDate?: Date;
  onWeatherUpdate: (multiplier: number) => void;
}

export interface RouteInfoProps {
  pickup: string;
  delivery: string;
  distance: number;
  finalPrice: number;
  estimatedTime: string;
  isPopularRoute?: boolean;
  isRemoteArea?: boolean;
  trafficConditions: {
    status: 'light' | 'moderate' | 'heavy';
    delay: number;
  };
  mapData: google.maps.DirectionsResult;
  selectedDate?: Date;
  onTollUpdate: (totalCost: number, segments?: Array<{ 
    location: string; 
    cost: number;
    details?: string;
  }>) => void;
  tollCosts?: {
    segments: Array<{
      location: string;
      cost: number;
      details?: string;
    }>;
    total: number;
  };
}

export interface PriceBreakdownProps {
  distance: number;
  basePrice: number;
  basePriceBreakdown: BasePriceBreakdown;
  mainMultipliers: {
    vehicle: number;
    weather: number;
    traffic: number;
    fuel: number;
    autoShow: number;
    totalMain: number;
  };
  additionalServices: {
    premium: number;
    special: number;
    inoperable: number;
    totalAdditional: number;
  };
  tollCosts?: {
    segments: Array<{
      location: string;
      cost: number;
    }>;
    total: number;
  };
  finalPrice: number;
  routeInfo?: {
    isPopularRoute: boolean;
    isRemoteArea: boolean;
  };
  selectedDate?: Date;
}

export interface PriceSummaryProps {
  finalPrice: number;
  basePrice: number;
  selectedDate?: Date;
  onSavePrice?: () => void;
}

export interface TrafficData {
  points: TrafficPoint[];
  status: 'light' | 'moderate' | 'heavy';
  delay: number;
  multiplier: number;
}

export interface TrafficPoint {
  lat: number;
  lng: number;
  speed: number;
  congestion: number;
}