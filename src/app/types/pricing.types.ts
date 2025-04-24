import type { BasePriceBreakdown } from './common.types';

export interface PriceComponents {
  selectedDate: Date | undefined;
  basePrice: number;
  basePriceBreakdown: BasePriceBreakdown;
  // Разделяем множители и импакты
  mainMultipliers: {
    // Множители для отображения процентов
    vehicleMultiplier: number;
    weatherMultiplier: number;
    trafficMultiplier: number;
    autoShowMultiplier: number;
    fuelMultiplier: number;
    // Импакты в долларах
    vehicleImpact: number;
    weatherImpact: number;
    trafficImpact: number;
    autoShowImpact: number;
    fuelImpact: number;
    totalImpact: number;
  };
  additionalServices: {
    premium: number;
    special: number;
    inoperable: number;
    supplementaryInsurance: number;
    totalAdditional: number;
  };
  tollCosts?: {
    segments: Array<{
      location: string;
      cost: number;
      details?: string;
    }>;
    total: number;
  };
  finalPrice: number;
}

export interface TollSegment {
  location: string;
  cost: number;
  details?: string;
}

export interface TollInfo {
  segments: TollSegment[];
  totalCost: number;
}