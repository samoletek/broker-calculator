interface RateRange {
  min: number;
  max: number;
}

interface TransportTypeData {
  name: string;
  baseRatePerMile: RateRange;
}

interface PopularRoute {
  from: string;
  to: string;
  factor: number;
}

interface VehicleValueType {
  name: string;
  multiplier: number;
}

interface VehicleTypeData {
  name: string;
  description: string;
}

import { PricingConfig } from '../types/pricing-config.types';

interface AdditionalService {
  name: string;
  multiplier: number;
  managerDefined?: boolean; 
  tooltip?: string[];
}

// Конфигурация типов транспорта с динамическими ставками
export const getTransportTypes = (config: PricingConfig): Record<string, TransportTypeData> => ({
  openTransport: {
    name: 'Open Transport',
    baseRatePerMile: {
      min: config.baseRates.openTransport.min,
      max: config.baseRates.openTransport.max
    }
  },
  enclosedTransport: {
    name: 'Enclosed Transport',
    baseRatePerMile: {
      min: config.baseRates.enclosedTransport.min,
      max: config.baseRates.enclosedTransport.max
    }
  }
});

// Типы стоимости автомобилей с динамическими множителями
export const getVehicleValueTypes = (config: PricingConfig): Record<string, VehicleValueType> => ({
  under100k: {
    name: 'Under $100k',
    multiplier: config.vehicleValueMultipliers.under100k
  },
  under300k: {
    name: '$100k - $300k',
    multiplier: config.vehicleValueMultipliers.from100kTo300k
  },
  under500k: {
    name: '$300k - $500k',
    multiplier: config.vehicleValueMultipliers.from300kTo500k
  },
  over500k: {
    name: 'Over $500k',
    multiplier: config.vehicleValueMultipliers.over500k
  }
});

// Типы транспортных средств
export const VEHICLE_TYPES: Record<string, VehicleTypeData> = {
  SEDAN: {
    name: 'Sedan',
    description: 'Standard 4-door passenger car'
  },
  COUPE: {
    name: 'Coupe',
    description: '2-door passenger car'
  },
  HATCHBACK: {
    name: 'Hatchback',
    description: 'Compact car with rear door'
  },
  CONVERTIBLE: {
    name: 'Convertible',
    description: 'Car with retractable roof'
  },
  WAGON: {
    name: 'Station Wagon',
    description: 'Extended roof passenger car'
  },
  SPORTS_CAR: {
    name: 'Sports Car',
    description: 'High-performance vehicle'
  },
  LUXURY: {
    name: 'Luxury Vehicle',
    description: 'Premium class vehicle'
  },
  COMPACT_SUV: {
    name: 'Compact SUV',
    description: 'Small sport utility vehicle'
  },
  MIDSIZE_SUV: {
    name: 'Mid-size SUV',
    description: 'Medium sport utility vehicle'
  },
  FULLSIZE_SUV: {
    name: 'Full-size SUV',
    description: 'Large sport utility vehicle'
  },
  MINIVAN: {
    name: 'Minivan',
    description: 'Passenger van'
  },
  CARGO_VAN: {
    name: 'Cargo Van',
    description: 'Commercial van'
  },
  EV: {
    name: 'Electric Vehicle (EV)',
    description: 'Battery-powered vehicle'
  },
  HYBRID: {
    name: 'Hybrid Vehicle',
    description: 'Combined power source vehicle'
  },
  MOTORCYCLE: {
    name: 'Motorcycle',
    description: 'Two-wheeled vehicle'
  },
  ATV_UTV: {
    name: 'ATV/UTV (Quadbike etc)',
    description: 'All-terrain vehicle'
  },
  CLASSIC: {
    name: 'Classic/Antique Vehicle',
    description: 'Vintage or collector vehicle'
  },
  OVERSIZED: {
    name: 'Oversized Vehicle (Hummer H1 etc)',
    description: 'Extra large vehicle'
  },
  SMALL_CARGO: {
    name: 'Small Cargo',
    description: 'Boxes, small furniture etc'
  }
};

// Дополнительные услуги с динамическими множителями
export const getAdditionalServices = (config: PricingConfig): Record<string, AdditionalService> => ({
  premiumEnhancements: {
    name: 'Premium Enhancements',
    multiplier: config.additionalServices.premiumEnhancements,
    tooltip: [
      'Language Proficiency: Skilled professionals fluent in the required language.',
      'Professional Attire: Staff dressed to represent your business with excellence.',
      'Liftgate Access: Effortless loading and unloading for heavy or oversized items.',
      'Ramps: Reliable solutions for loading vehicles or specialized equipment.',
      'Winch Services: Precision handling for supercars and delicate machinery that demands extra care.'
    ]
  },
  specialLoad: {
    name: 'Special Load',
    multiplier: config.additionalServices.specialLoad,
    tooltip: [
      'Multi-point deliveries or roundtrip transportation',
      'Access to restricted areas (ports, military bases)',
      'Special permits and documentation requirements',
      'Enhanced security clearance and protocols',
      'Flexible scheduling for complex route planning'
    ]
  },
  inoperable: {
    name: 'Inoperable/Zero Mileage',
    multiplier: config.additionalServices.inoperableZeroMileage,
    tooltip: [
      'Transportation of non-running vehicles',
      'Specialized loading equipment for inoperable vehicles',
      'Zero mileage preservation for collector cars',
      'Extra care handling for mechanical issues',
      'Custom securing methods for non-standard loading'
    ]
  },
  supplementaryInsurance: {
    name: 'Supplementary Insurance',
    multiplier: config.additionalServices.supplementaryInsurance,
    managerDefined: true,
    tooltip: [
      'Single-trip insurance for peace of mind when transporting luxury vehicles',
      'Protection against damage from loading/unloading, road hazards, and delays',
      'Swift policy issuance with transparent terms and dedicated claims support',
      'Complete protection from pickup to delivery for your prized automotive treasures',
      'The price of insurance will be quoted by our representative'
    ]
  }
});

export const getPaymentMethods = (config: PricingConfig) => ({
  CREDIT_CARD: {
    id: 'creditCard',
    name: 'Credit Card',
    fee: config.paymentFees.creditCard
  },
  ACH: {
    id: 'ach',
    name: 'ACH',
    fee: config.paymentFees.achCheckCod
  },
  CHECK: {
    id: 'check',
    name: 'Check',
    fee: config.paymentFees.achCheckCod
  },
  COD: {
    id: 'cod',
    name: 'COD (Cash on Delivery)',
    fee: config.paymentFees.achCheckCod
  }
});

// Конфигурация погодных условий
export const getWeatherMultipliers = (config: PricingConfig): Record<string, number> => ({
  clear: config.weatherMultipliers.clear,
  cloudy: config.weatherMultipliers.cloudy,
  rain: config.weatherMultipliers.rain,
  snow: config.weatherMultipliers.snow,
  storm: config.weatherMultipliers.storm,
  extreme: config.weatherMultipliers.extreme
});

// Конфигурация маршрутов
export const getRouteFactors = (config: PricingConfig): Record<string, number> => ({
  popular: config.routeFactors.popular,
  regular: config.routeFactors.regular,
  remote: config.routeFactors.remote
});

// Популярные маршруты с динамическими факторами
export const getPopularRoutes = (config: PricingConfig): PopularRoute[] => [
  { from: "New York", to: "Los Angeles", factor: config.routeFactors.popular },
  { from: "Miami", to: "Chicago", factor: config.routeFactors.popular },
  { from: "New York", to: "Miami", factor: config.routeFactors.popular },
  { from: "Miami", to: "New York", factor: config.routeFactors.popular },
  { from: "Boston", to: "Washington", factor: config.routeFactors.popular },
  { from: "San Francisco", to: "Las Vegas", factor: config.routeFactors.popular },
  { from: "Seattle", to: "Portland", factor: config.routeFactors.popular },
  { from: "Washington", to: "Los Angeles", factor: config.routeFactors.popular },
  { from: "Los Angeles", to: "Washington", factor: config.routeFactors.popular },
  { from: "Los Angeles", to: "New York", factor: config.routeFactors.popular },
  { from: "Los Angeles", to: "Chicago", factor: config.routeFactors.popular },
];

// Вспомогательные функции с динамической конфигурацией
export const getBaseRate = (distance: number, transportType: string, config: PricingConfig) => {
  const transportTypes = getTransportTypes(config);
  const type = transportTypes[transportType as keyof typeof transportTypes];
  const ratePerMile = type.baseRatePerMile.max;
  return distance * ratePerMile;
};

export const getRouteFactorDynamic = (pickup: string, delivery: string, config: PricingConfig): number => {
  const popularRoutes = getPopularRoutes(config);
  const routeFactors = getRouteFactors(config);
  
  const isPopularRoute = popularRoutes.some(
    route => 
      (pickup.toLowerCase().includes(route.from.toLowerCase()) && 
       delivery.toLowerCase().includes(route.to.toLowerCase())) ||
      (pickup.toLowerCase().includes(route.to.toLowerCase()) && 
       delivery.toLowerCase().includes(route.from.toLowerCase()))
  );

  if (isPopularRoute) {
    return routeFactors.popular;
  }

  const remoteAreas = ['hawaii', 'montana', 'wyoming', 'idaho', 'north dakota', 'south dakota'];
  const isRemote = remoteAreas.some(
    area => pickup.toLowerCase().includes(area) || delivery.toLowerCase().includes(area)
  );

  return isRemote ? routeFactors.remote : routeFactors.regular;
};

export const isDistanceValid = (distance: number, config: PricingConfig): boolean => {
  return distance <= config.validation.maxDistance;
};