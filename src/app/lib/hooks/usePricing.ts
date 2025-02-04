'use client';

import { useState, useCallback } from 'react';
import { PriceComponents } from '@/app/types/pricing.types';
import { getBaseRate } from '@/constants/pricing';

export function usePricing() {
  const [priceComponents, setPriceComponents] = useState<PriceComponents | null>(null);

  const updatePriceComponents = useCallback((
    prevComponents: PriceComponents | null,
    updates: Partial<PriceComponents>
  ): PriceComponents | null => {
    if (!prevComponents) return null;

    const newComponents = {
      ...prevComponents,
      ...updates
    };

    const mainMultiplierTotal = 
      newComponents.mainMultipliers.vehicle * 
      newComponents.mainMultipliers.weather * 
      newComponents.mainMultipliers.traffic *
      newComponents.mainMultipliers.autoShow *
      newComponents.mainMultipliers.fuel;

    newComponents.mainMultipliers.totalMain = mainMultiplierTotal;

    newComponents.finalPrice = 
      newComponents.basePrice * 
      mainMultiplierTotal * 
      (1 + newComponents.additionalServices.totalAdditional) +
      (newComponents.tollCosts?.total || 0);

    return newComponents;
  }, []);

  return { priceComponents, setPriceComponents, updatePriceComponents };
}