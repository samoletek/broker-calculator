// Enterprise-grade клиентские утилиты для всех map-related операций
import { geocodeAddress, getDirections } from './mapsAPI';

// Расчет множителя цен на топливо
export async function getFuelPriceMultiplier(
  origin: string,
  destination: string
): Promise<number> {
  try {
    const response = await fetch('/api/fuel/prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.error || 'Fuel price calculation failed');
    }

    return data.multiplier || 1.0;
  } catch (error) {
    console.error('Fuel price multiplier error:', error);
    return 1.0; // Fallback
  }
}

// Расчет стоимости платных дорог
export async function calculateTollCosts(
  origin: string,
  destination: string,
  distance: number,
  route?: any
): Promise<{
  totalCost: number;
  segments: Array<{
    location: string;
    cost: number;
    details?: string;
  }>;
}> {
  try {
    const response = await fetch('/api/tolls/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination,
        distance,
        route
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.error || 'Toll calculation failed');
    }

    return {
      totalCost: data.totalCost || 0,
      segments: data.segments || []
    };
  } catch (error) {
    console.error('Toll calculation error:', error);
    return {
      totalCost: 0,
      segments: []
    };
  }
}

// Комплексный расчет маршрута с всеми параметрами
export async function calculateCompleteRoute(
  origin: string,
  destination: string
): Promise<{
  success: boolean;
  route?: any;
  distance?: number;
  fuelMultiplier?: number;
  tollCosts?: {
    totalCost: number;
    segments: Array<{
      location: string;
      cost: number;
      details?: string;
    }>;
  };
  error?: string;
}> {
  try {
    // Шаг 1: Валидация адресов
    const [originValidation, destValidation] = await Promise.all([
      geocodeAddress(origin),
      geocodeAddress(destination)
    ]);

    if (!originValidation.success || !destValidation.success) {
      return {
        success: false,
        error: 'Address validation failed'
      };
    }

    // Шаг 2: Получение маршрута
    const directionsResult = await getDirections(
      originValidation.results[0].formatted_address,
      destValidation.results[0].formatted_address
    );

    if (!directionsResult.success) {
      return {
        success: false,
        error: directionsResult.error || 'Failed to get directions'
      };
    }

    const distance = directionsResult.summary?.distance.miles || 0;

    // Шаг 3: Параллельный расчет дополнительных параметров
    const [fuelMultiplier, tollCosts] = await Promise.all([
      getFuelPriceMultiplier(origin, destination),
      calculateTollCosts(origin, destination, distance, directionsResult.routes[0])
    ]);

    return {
      success: true,
      route: directionsResult.routes[0],
      distance,
      fuelMultiplier,
      tollCosts
    };

  } catch (error) {
    console.error('Complete route calculation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}