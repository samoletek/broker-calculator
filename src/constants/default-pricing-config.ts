import { PricingConfig } from '../types/pricing-config.types';

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  
  baseRates: {
    openTransport: {
      min: 0.62,
      max: 0.93
    },
    enclosedTransport: {
      min: 0.88,
      max: 1.19
    }
  },

  vehicleValueMultipliers: {
    under100k: 1.0,
    from100kTo300k: 1.05,
    from300kTo500k: 1.1,
    over500k: 1.15
  },

  additionalServices: {
    premiumEnhancements: 1.15,
    specialLoad: 1.1,
    inoperableZeroMileage: 1.1,
    supplementaryInsurance: 0
  },

  paymentFees: {
    creditCard: 0.03,
    achCheckCod: 0
  },

  weatherMultipliers: {
    clear: 1.0,
    cloudy: 1.0,
    rain: 1.05,
    snow: 1.1,
    storm: 1.1,
    extreme: 1.2
  },

  routeFactors: {
    popular: 0.9,
    regular: 1.0,
    remote: 1.2
  },

  validation: {
    maxDistance: 3500,
    minPriceThreshold: 600,
    shortDistanceLimit: 300
  },

  fuel: {
    baseDieselPrice: 3.50,
    priceLevelMultiplier: 0.1,
    priceThreshold: 1.05,
    highPriceMultiplier: 1.05
  },

  transport: {
    dailyDrivingMiles: 500,
    trafficMultipliers: {
      light: 1.0,
      moderate: 1.1,
      heavy: 1.2
    },
    trafficThresholds: {
      lightThreshold: 1.3,
      heavyThreshold: 1.6
    }
  },

  tolls: {
    baseTollRate: 0.12,
    minCostMultiplier: 0.05,
    minCostBase: 20,
    maxCostMultiplier: 0.15,
    
    regionalMultipliers: {
      northeast: 1.3,
      newEngland: 1.3,
      midAtlantic: 1.25,
      greatLakesMidwest: 1.2,
      southeast: 1.15,
      texasSouthernPlains: 1.15,
      mountainWest: 1.1,
      greatPlains: 1.1,
      pacificCoast: 1.2,
      louisiana: 1.2
    },
    
    distanceDiscounts: {
      over2000Miles: 0.85,
      over1000Miles: 0.9
    },
    
    regionalPortions: {
      northeast: 0.35,
      newEngland: 0.3,
      midAtlantic: 0.25,
      greatLakesMidwest: 0.4,
      southeast: 0.2,
      texasSouthernPlains: 0.6,
      mountainWest: 0.5,
      greatPlains: 0.2,
      pacificCoast: 0.8,
      louisiana: 0.3
    }
  },

  autoShows: {
    searchRadius: 32186, // 20 миль в метрах
    dateRange: 3, // ±3 дня
    multiplier: 1.1
  }
};