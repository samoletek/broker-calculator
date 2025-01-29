export interface TollSegment {
  location: string;
  cost: number;
  details?: string;
}

export interface TollInfo {
  segments: TollSegment[];  // Используем TollSegment вместо inline типа
  totalCost: number;
}

export interface RouteInfoProps {
  pickup: string;
  delivery: string;
  distance: number;
  finalPrice: number;  // Добавляем эту строку
  estimatedTime?: string;
  isPopularRoute: boolean;
  isRemoteArea: boolean;
  trafficConditions: {
    status: 'light' | 'moderate' | 'heavy';
    delay?: number;
    multiplier?: number;
  };
  mapData?: google.maps.DirectionsResult & {
    routes: Array<{
      legs: Array<{
        start_location: google.maps.LatLng;
        end_location: google.maps.LatLng;
        duration?: google.maps.Duration;
        duration_in_traffic?: google.maps.Duration;
        steps: Array<{
          instructions: string;
        }>;
      }>;
    }>;
  };
  selectedDate?: Date;
  onTrafficUpdate?: (multiplier: number) => void;
  onTollUpdate?: (tollCost: number, segments?: Array<{ location: string, cost: number }>) => void;
}
export interface PriceBreakdownProps {
  distance: number;
  basePrice: number;
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

export interface FuelPriceData {
  maxPrice: number | null;
  multiplier: number;
}

export interface WeatherMapProps {
  routePoints: {
    pickup: {
      lat: number;
      lng: number;
    };
    delivery: {
      lat: number;
      lng: number;
    };
    waypoints: Array<{
      lat: number;
      lng: number;
    }>;
  };
  selectedDate?: Date;
  onWeatherUpdate: (multiplier: number) => void;
}

export interface MarketInfoProps {
  route: {
    from: string;
    to: string;
    distance: number;
  };
  vehicleType: string;
  selectedDate?: Date;
  onMarketUpdate?: (marketFactor: number) => void;
}

export interface WeatherPoint {
  location: string;
  condition: string;
  temperature: number;
  multiplier: number;
}

export interface WeatherResponse {
  current: {
    condition: {
      text: string;
    };
    temp_f: number;
  };
}

export interface TrafficPoint {
  lat: number;
  lng: number;
  speed: number;
  congestion: number;
}

export interface TrafficData {
  points: TrafficPoint[];
  status: 'light' | 'moderate' | 'heavy';
  delay: number;
  multiplier: number;
}