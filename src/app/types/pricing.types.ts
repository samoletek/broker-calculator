import type { BasePriceBreakdown } from './common.types';

export interface PriceComponents {
  selectedDate: Date | undefined;
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
  basePriceBreakdown: BasePriceBreakdown;
  tollCosts?: {
    segments: Array<{
      location: string;
      cost: number;
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