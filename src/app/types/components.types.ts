import type { BasePriceBreakdown, GeoPoint } from './common.types';
import type { PricingConfig } from '../../../types/pricing-config.types';

export interface WeatherMapProps {
  routePoints: {
    pickup: GeoPoint;
    delivery: GeoPoint;
    waypoints: GeoPoint[];
  };
  selectedDate?: Date;
  onWeatherUpdate: (multiplier: number) => void;
  config: PricingConfig;
}

export interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export interface GoogleMapProps {
  mapData: google.maps.DirectionsResult;
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
  config: PricingConfig;
}

export interface PriceBreakdownProps {
  distance: number;
  basePrice: number;
  basePriceBreakdown: BasePriceBreakdown;
  additionalServices: {
    premium: number;
    special: number;
    inoperable: number;
    supplementaryInsurance: number;
    hasManagerDefined?: boolean;
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
  mainMultipliers: {
    vehicleMultiplier: number;
    weatherMultiplier: number;
    trafficMultiplier: number;
    autoShowMultiplier: number;
    fuelMultiplier: number;
    vehicleImpact: number;
    weatherImpact: number;
    trafficImpact: number;
    autoShowImpact: number;
    fuelImpact: number;
    cardFee: number;
    totalImpact: number;
  };
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