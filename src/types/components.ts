export interface RouteInfoProps {
    pickup: string;
    delivery: string;
    distance: number;
    estimatedTime: string;
    isPopularRoute: boolean;
    isRemoteArea: boolean;
    onTrafficUpdate?: (multiplier: number) => void;
    trafficConditions: {
      status: 'light' | 'moderate' | 'heavy';
      delay: number;
    };
    mapData?: google.maps.DirectionsResult;
    selectedDate?: Date;
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
    finalPrice: number;
    selectedDate?: Date;
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
    selectedDate?: Date;
    vehicleType: string;
    onMarketUpdate: (marketFactor: number) => void;
  }