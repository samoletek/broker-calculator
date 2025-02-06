'use client';

import { useState, useCallback } from 'react';
import { PriceComponents } from '@/app/types/pricing.types';

export function usePricing() {
  const [priceComponents, setPriceComponents] = useState<PriceComponents | null>(null);

  const updatePriceComponents = useCallback((
    prevComponents: PriceComponents | null,
    updates: Partial<PriceComponents>
  ): PriceComponents | null => {
    if (!prevComponents) {
      console.warn('Attempting to update null priceComponents');
      return null;
    }

    const newComponents = { ...prevComponents };

    if (updates.mainMultipliers && newComponents.mainMultipliers) {
      const basePrice = newComponents.basePrice;
      
      // Обновляем множители и пересчитываем импакты
      newComponents.mainMultipliers = {
        ...newComponents.mainMultipliers,
        ...updates.mainMultipliers
      };

      // Пересчитываем импакты
      newComponents.mainMultipliers.vehicleImpact = 
        basePrice * (newComponents.mainMultipliers.vehicleMultiplier - 1);
      newComponents.mainMultipliers.weatherImpact = 
        basePrice * (newComponents.mainMultipliers.weatherMultiplier - 1);
      newComponents.mainMultipliers.trafficImpact = 
        basePrice * (newComponents.mainMultipliers.trafficMultiplier - 1);
      newComponents.mainMultipliers.autoShowImpact = 
        basePrice * (newComponents.mainMultipliers.autoShowMultiplier - 1);
      newComponents.mainMultipliers.fuelImpact = 
        basePrice * (newComponents.mainMultipliers.fuelMultiplier - 1);

      // Обновляем общий импакт
      newComponents.mainMultipliers.totalImpact = 
        newComponents.mainMultipliers.vehicleImpact +
        newComponents.mainMultipliers.weatherImpact +
        newComponents.mainMultipliers.trafficImpact +
        newComponents.mainMultipliers.autoShowImpact +
        newComponents.mainMultipliers.fuelImpact;
    }

    if (updates.additionalServices) {
      newComponents.additionalServices = {
        ...newComponents.additionalServices,
        ...updates.additionalServices
      };
    }

    if (updates.tollCosts) {
      newComponents.tollCosts = updates.tollCosts;
    }

    // Пересчитываем финальную цену
    const additionalServicesImpact = newComponents.basePrice * 
      newComponents.additionalServices.totalAdditional;

    newComponents.finalPrice = 
      newComponents.basePrice + 
      newComponents.mainMultipliers.totalImpact +
      additionalServicesImpact +
      (newComponents.tollCosts?.total || 0);

    return newComponents;
  }, []);

  return { 
    priceComponents, 
    setPriceComponents, 
    updatePriceComponents 
  };
}