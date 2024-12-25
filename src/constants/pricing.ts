// src/constants/pricing.ts

// Interfaces
interface RateRange {
  min: number;
  max: number;
}

interface TransportTypeData {
  name: string;
  baseRatePerMile: RateRange;
}

interface SeasonData {
  multiplier: number;
  months?: number[];
  dates?: { month: number; day: number }[];
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

interface AdditionalService {
  name: string;
  multiplier: number;
  tooltip?: string[];
}

// Убираем дублирующий интерфейс AutoShowData и переименовываем AutoShowInfo в AutoShowData
export interface AutoShowData {
  pickup: AutoShowEvent[];
  delivery: AutoShowEvent[];
  multiplier: number;
}

interface AutoShowEvent {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  dates: {
    start: Date;
    end: Date;
  };
  distance: number;
}

// Transport Types Configuration
export const TRANSPORT_TYPES: Record<string, TransportTypeData> = {
  openTransport: {
    name: 'Open Transport',
    baseRatePerMile: {
      min: 0.62,
      max: 0.93
    }
  },
  enclosedTransport: {
    name: 'Enclosed Transport',
    baseRatePerMile: {
      min: 0.88,
      max: 1.33
    }
  }
};

// Vehicle Value Types
export const VEHICLE_VALUE_TYPES: Record<string, VehicleValueType> = {
  under100k: {
    name: 'Under $100k',
    multiplier: 1.0
  },
  under300k: {
    name: '$100k - $300k',
    multiplier: 1.15
  },
  under500k: {
    name: '$300k - $500k',
    multiplier: 1.25
  },
  over500k: {
    name: 'Over $500k',
    multiplier: 1.4
  }
};

// Vehicle Types without multipliers
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

// Additional Services
export const ADDITIONAL_SERVICES: Record<string, AdditionalService> = {
  premiumEnhancements: {
    name: 'Premium Enhancements',
    multiplier: 1.3,
    tooltip: [
      'Language Proficiency: Skilled professionals fluent in the required language.',
      'Professional Attire: Staff dressed to represent your business with excellence.',
      'Liftgate Access: Effortless loading and unloading for heavy or oversized items.',
      'Ramps: Reliable solutions for loading vehicles or specialized equipment.',
      'Winch Services: Precision handling for supercars and delicate machinery that demands extra care.'
    ]
  },
  specialLoad: {
    name: 'Special Load (Roundtrip, port/military base)',
    multiplier: 1.3
  },
  inoperable: {
    name: 'Inoperable/Zero Mileage',
    multiplier: 1.3
  }
};

// Seasonal Configuration
export const SEASONAL_MULTIPLIERS: Record<string, SeasonData> = {
  summer: {
    multiplier: 1.3,
    months: [5, 6, 7]
  },
  january: {
    multiplier: 1.2,
    months: [0]
  },
  holidays: {
    multiplier: 1.15,
    dates: [
      { month: 11, day: 25 },
      { month: 11, day: 24 },
      { month: 11, day: 23 },
      { month: 12, day: 24 },
      { month: 12, day: 25 },
      { month: 12, day: 26 }
    ]
  },
  spring: {
    multiplier: 0.9,
    months: [2, 3, 4]
  },
  fall: {
    multiplier: 0.85,
    months: [8, 9, 10]
  },
  normal: {
    multiplier: 1.0,
    months: [1, 11]
  }
};

// Weather Configuration
export const WEATHER_MULTIPLIERS: Record<string, number> = {
  clear: 1.0,
  cloudy: 1.0,
  rain: 1.05,
  snow: 1.20,
  storm: 1.15,
  extreme: 1.2
};

// Route Configuration
export const ROUTE_FACTORS: Record<string, number> = {
  popular: 0.9,
  regular: 1.0,
  remote: 1.2
};

// Popular Routes
export const POPULAR_ROUTES: PopularRoute[] = [
  { from: "New York", to: "Los Angeles", factor: 0.9 },
  { from: "Miami", to: "Chicago", factor: 0.9 },
  { from: "Boston", to: "Washington", factor: 0.9 },
  { from: "San Francisco", to: "Las Vegas", factor: 0.9 },
  { from: "Seattle", to: "Portland", factor: 0.9 }
];

// Utility Functions
export const getBaseRate = (distance: number, transportType: keyof typeof TRANSPORT_TYPES) => {
  const type = TRANSPORT_TYPES[transportType];
  const ratePerMile = type.baseRatePerMile.max;
  return distance * ratePerMile;
};

export const getSeasonalMultiplier = (date: Date): number => {
  const month = date.getMonth();
  const day = date.getDate();

  const isHoliday = SEASONAL_MULTIPLIERS.holidays.dates?.some(
    holiday => holiday.month === month && holiday.day === day
  );
  
  if (isHoliday) {
    return SEASONAL_MULTIPLIERS.holidays.multiplier;
  }

  for (const [season, data] of Object.entries(SEASONAL_MULTIPLIERS)) {
    if (season !== 'holidays' && data.months?.includes(month)) {
      return data.multiplier;
    }
  }

  return SEASONAL_MULTIPLIERS.normal.multiplier;
};

export const getRouteFactor = (pickup: string, delivery: string): number => {
  const isPopularRoute = POPULAR_ROUTES.some(
    route => 
      (pickup.toLowerCase().includes(route.from.toLowerCase()) && 
       delivery.toLowerCase().includes(route.to.toLowerCase())) ||
      (pickup.toLowerCase().includes(route.to.toLowerCase()) && 
       delivery.toLowerCase().includes(route.from.toLowerCase()))
  );

  if (isPopularRoute) {
    return ROUTE_FACTORS.popular;
  }

  const remoteAreas = ['alaska', 'hawaii', 'montana', 'wyoming', 'idaho', 'north dakota', 'south dakota'];
  const isRemote = remoteAreas.some(
    area => pickup.toLowerCase().includes(area) || delivery.toLowerCase().includes(area)
  );

  return isRemote ? ROUTE_FACTORS.remote : ROUTE_FACTORS.regular;
};

export const isDistanceValid = (distance: number): boolean => {
  const MAX_DISTANCE = 3500;
  return distance <= MAX_DISTANCE;
};