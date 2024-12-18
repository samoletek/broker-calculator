export interface TollInfo {
    segments: Array<{
      location: string;
      cost: number;
    }>;
    totalCost: number;
  }
  
  export interface RouteInfoProps {
    pickup: string;
    delivery: string;
    distance: number;
    estimatedTime?: string;
    isPopularRoute: boolean;
    isRemoteArea: boolean;
    trafficConditions: {
      status: 'light' | 'moderate' | 'heavy';
      delay?: number;
    };
    tollInfo?: TollInfo;
    mapData?: google.maps.DirectionsResult;
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
      seasonal: number;
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
  
  // Остальные интерфейсы остаются без изменений
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