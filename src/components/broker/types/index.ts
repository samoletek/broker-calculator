export interface PriceBreakdownProps {
    distance: number | null;
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
    routeInfo?: {
      isPopularRoute: boolean;
      isRemoteArea: boolean;
      routeMultiplier: number;
    };
  }
  
  export interface WeatherInfo {
    pickup: {
      condition: string;
      multiplier: number;
    };
    delivery: {
      condition: string;
      multiplier: number;
    };
    route: {
      worstCondition: string;
      averageMultiplier: number;
    };
  }
  
  export interface MarketData {
    averagePrice: number;
    seasonalTrend: {
      direction: 'up' | 'down' | 'stable';
      percentage: number;
    };
    demand: 'high' | 'medium' | 'low';
    competitorPrices?: {
      lowest: number;
      highest: number;
      average: number;
    };
  }