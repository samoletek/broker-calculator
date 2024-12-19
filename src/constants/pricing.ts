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

interface AdditionalService {
  name: string;
  multiplier: number;
  tooltip?: string[];
}

interface VehicleTypeData {
  name: string;
  description: string;
  sizeMultiplier: number;
}

// Transport Types Configuration
export const TRANSPORT_TYPES: Record<string, TransportTypeData> = {
  openTransport: {
    name: 'Open Transport',
    baseRatePerMile: {
      min: 0.62,
      max: 0.93
    },
  },
  enclosedTransport: {
    name: 'Enclosed Transport',
    baseRatePerMile: {
      min: 0.88,
      max: 1.33
    },
  }
};

// Добавить в pricing.ts после VEHICLE_VALUE_TYPES:

export const VEHICLE_TYPES = {
  SEDAN: {
    name: 'Sedan',
    description: 'Standard 4-door passenger car',
    sizeMultiplier: 1.0
  },
  COUPE: {
    name: 'Coupe',
    description: '2-door passenger car',
    sizeMultiplier: 0.95
  },
  HATCHBACK: {
    name: 'Hatchback',
    description: 'Compact car with rear door',
    sizeMultiplier: 0.95
  },
  CONVERTIBLE: {
    name: 'Convertible',
    description: 'Car with retractable roof',
    sizeMultiplier: 1.1
  },
  WAGON: {
    name: 'Station Wagon',
    description: 'Extended roof passenger car',
    sizeMultiplier: 1.15
  },
  SPORTS_CAR: {
    name: 'Sports Car',
    description: 'High-performance vehicle',
    sizeMultiplier: 1.2
  },
  LUXURY: {
    name: 'Luxury Vehicle',
    description: 'Premium class vehicle',
    sizeMultiplier: 1.3
  },
  COMPACT_SUV: {
    name: 'Compact SUV',
    description: 'Small sport utility vehicle',
    sizeMultiplier: 1.15
  },
  MIDSIZE_SUV: {
    name: 'Mid-size SUV',
    description: 'Medium sport utility vehicle',
    sizeMultiplier: 1.25
  },
  FULLSIZE_SUV: {
    name: 'Full-size SUV',
    description: 'Large sport utility vehicle',
    sizeMultiplier: 1.35
  },
  MINIVAN: {
    name: 'Minivan',
    description: 'Passenger van',
    sizeMultiplier: 1.3
  },
  CARGO_VAN: {
    name: 'Cargo Van',
    description: 'Commercial van',
    sizeMultiplier: 1.35
  },
  EV: {
    name: 'Electric Vehicle (EV)',
    description: 'Battery-powered vehicle',
    sizeMultiplier: 1.1
  },
  HYBRID: {
    name: 'Hybrid Vehicle',
    description: 'Combined power source vehicle',
    sizeMultiplier: 1.1
  },
  MOTORCYCLE: {
    name: 'Motorcycle',
    description: 'Two-wheeled vehicle',
    sizeMultiplier: 0.7
  },
  ATV_UTV: {
    name: 'ATV/UTV (Quadbike etc)',
    description: 'All-terrain vehicle',
    sizeMultiplier: 0.8
  },
  CLASSIC: {
    name: 'Classic/Antique Vehicle',
    description: 'Vintage or collector vehicle',
    sizeMultiplier: 1.4
  },
  OVERSIZED: {
    name: 'Oversized Vehicle (Hummer H1 etc)',
    description: 'Extra large vehicle',
    sizeMultiplier: 1.5
  }
} as const;

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
  },
  largeEquipment: {
    name: 'Large equipment (Cybertruck, Chevrolet Tahoe etc)',
    multiplier: 1.3
  },
  smallEquipment: {
    name: 'Small equipment (Moto, Hydrocycle etc)',
    multiplier: 0.8
  },
  smallCargo: {
    name: 'Small cargo (Boxes, small furniture etc)',
    multiplier: 0.5
  }
};

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

export const SEASONAL_MULTIPLIERS: Record<string, SeasonData> = {
  // Высокий сезон
  summer: { // июнь-август
    multiplier: 1.3, // +30%
    months: [5, 6, 7]
  },
  january: {
    multiplier: 1.2, // +20%
    months: [0]
  },
  holidays: {
    multiplier: 1.15, // +15%
    dates: [
      { month: 11, day: 25 }, // День благодарения (примерно)
      { month: 11, day: 24 },
      { month: 11, day: 23 },
      { month: 12, day: 24 }, // Рождество
      { month: 12, day: 25 },
      { month: 12, day: 26 }
    ]
  },
  // Низкий сезон
  spring: { // март-май
    multiplier: 0.9, // -10%
    months: [2, 3, 4]
  },
  fall: { // сентябрь-ноябрь
    multiplier: 0.85, // -15%
    months: [8, 9, 10]
  },
  // Нормальный сезон
  normal: {
    multiplier: 1.0,
    months: [1, 11] // февраль и декабрь (кроме праздников)
  }
};

export const WEATHER_MULTIPLIERS: Record<string, number> = {
  clear: 1.0,    // чистая погода
  cloudy: 1.0,   // облачно
  rain: 1.05,    // дождь: +5%
  snow: 1.20,     // снег: +20%
  storm: 1.15,   // гроза: +15%
  extreme: 1.2   // экстремальные условия: +20%
};

export const ROUTE_FACTORS: Record<string, number> = {
  popular: 0.9,  // -10% для популярных маршрутов
  regular: 1.0,  // обычная цена
  remote: 1.2    // +20% для отдаленных районов
};

export const POPULAR_ROUTES: PopularRoute[] = [
  {
    from: "New York",
    to: "Los Angeles",
    factor: 0.9
  },
  {
    from: "Miami",
    to: "Chicago",
    factor: 0.9
  },
  {
    from: "Boston",
    to: "Washington",
    factor: 0.9
  },
  {
    from: "San Francisco",
    to: "Las Vegas",
    factor: 0.9
  },
  {
    from: "Seattle",
    to: "Portland",
    factor: 0.9
  }
];

// Функция для определения базовой ставки на основе расстояния
export const getBaseRate = (distance: number, transportType: keyof typeof TRANSPORT_TYPES) => {
  const type = TRANSPORT_TYPES[transportType];
  
  const ratePerMile = transportType === 'openTransport' 
    ? type.baseRatePerMile.max * 1.2  // Для Open Transport увеличен на 20%
    : type.baseRatePerMile.max;        // Для Enclosed как есть
 
  const basePrice = distance * ratePerMile;
 
  return {
    min: Math.round(basePrice * 0.9),
    max: Math.round(basePrice * 1.1)
  };
};

// Функция для определения сезонного множителя
export const getSeasonalMultiplier = (date: Date): number => {
  const month = date.getMonth();
  const day = date.getDate();

  // Проверка на праздничные дни
  const isHoliday = SEASONAL_MULTIPLIERS.holidays.dates?.some(
    holiday => holiday.month === month && holiday.day === day
  );
  
  if (isHoliday) {
    return SEASONAL_MULTIPLIERS.holidays.multiplier;
  }

  // Проверка на сезон
  for (const [season, data] of Object.entries(SEASONAL_MULTIPLIERS)) {
    if (season !== 'holidays' && data.months?.includes(month)) {
      return data.multiplier;
    }
  }

  return SEASONAL_MULTIPLIERS.normal.multiplier;
};

// Функция для определения фактора маршрута
export const getRouteFactor = (pickup: string, delivery: string): number => {
  // Проверка на популярные маршруты
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

  // Проверка на отдаленные районы
  const remoteAreas = ['alaska', 'hawaii', 'montana', 'wyoming', 'idaho', 'north dakota', 'south dakota'];
  const isRemote = remoteAreas.some(
    area => 
      pickup.toLowerCase().includes(area) || 
      delivery.toLowerCase().includes(area)
  );

  return isRemote ? ROUTE_FACTORS.remote : ROUTE_FACTORS.regular;
};

// Функция проверки максимального расстояния
export const isDistanceValid = (distance: number): boolean => {
  const MAX_DISTANCE = 3500; // максимальное расстояние в милях
  return distance <= MAX_DISTANCE;
};