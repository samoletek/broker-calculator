import { DirectionsResult } from '@/app/types/maps.types';

// DEPRECATION NOTICE: Эта функция заменена на server-side API /api/fuel/prices
// Сохранена для обратной совместимости, но использует новую архитектуру

export const getFuelPriceMultiplier = async (
  directionsResult: DirectionsResult,
  origin: string,
  destination: string
): Promise<number> => {
  try {
    // Используем новый server-side API для расчета fuel multiplier
    const response = await fetch('/api/fuel/prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination,
        route: directionsResult.routes[0]
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.error || 'Fuel price calculation failed');
    }

    return data.multiplier || 1.0;
  } catch (error) {
    console.error('Error calculating fuel price multiplier:', error);
    return 1.0; // Neutral multiplier on error
  }
};