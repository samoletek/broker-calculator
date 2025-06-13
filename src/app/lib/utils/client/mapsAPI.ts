// Новые клиентские утилиты для работы с server-side Google Maps API

interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  place_id: string;
  types: string[];
}

interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      start_address: string;
      end_address: string;
      start_location: { lat: number; lng: number };
      end_location: { lat: number; lng: number };
    }>;
    overview_polyline: { points: string };
    summary: string;
  }>;
}

interface DistanceMatrixResult {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: Array<{
    elements: Array<{
      distance?: { text: string; value: number };
      duration?: { text: string; value: number };
      status: string;
    }>;
  }>;
}

// Геокодирование адреса
export async function geocodeAddress(address: string): Promise<{
  success: boolean;
  results: GeocodeResult[];
  error?: string;
}> {
  try {
    const response = await fetch('/api/maps/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.error || 'Geocoding failed');
    }

    return data;
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Получение маршрута между двумя точками
export async function getDirections(
  origin: string,
  destination: string,
  options?: {
    travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
    avoidTolls?: boolean;
    avoidHighways?: boolean;
    avoidFerries?: boolean;
    waypoints?: string[];
  }
): Promise<{
  success: boolean;
  routes: DirectionsResult['routes'];
  summary?: {
    distance: { meters: number; miles: number };
    duration: { seconds: number; minutes: number };
  };
  error?: string;
}> {
  try {
    const response = await fetch('/api/maps/directions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination,
        ...options,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.error || 'Directions failed');
    }

    return data;
  } catch (error) {
    console.error('Directions error:', error);
    return {
      success: false,
      routes: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Матрица расстояний
export async function getDistanceMatrix(
  origins: string[],
  destinations: string[],
  options?: {
    travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
    avoidTolls?: boolean;
    avoidHighways?: boolean;
    avoidFerries?: boolean;
    units?: 'METRIC' | 'IMPERIAL';
  }
): Promise<{
  success: boolean;
  rows: DistanceMatrixResult['rows'];
  origin_addresses: string[];
  destination_addresses: string[];
  summary?: {
    validResults: number;
    totalRequests: number;
    statistics?: {
      averageDistance: { meters: number; miles: number };
      averageDuration: { seconds: number; minutes: number };
    };
  };
  error?: string;
}> {
  try {
    const response = await fetch('/api/maps/distance-matrix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origins,
        destinations,
        ...options,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.error || 'Distance matrix failed');
    }

    return data;
  } catch (error) {
    console.error('Distance matrix error:', error);
    return {
      success: false,
      rows: [],
      origin_addresses: [],
      destination_addresses: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Валидация адреса (улучшенная версия с server-side API)
export async function validateAddress(address: string): Promise<{
  isValid: boolean;
  hasZip: boolean;
  error?: string;
  formattedAddress?: string;
  location?: { lat: number; lng: number };
}> {
  try {
    const result = await geocodeAddress(address);
    
    if (!result.success || result.results.length === 0) {
      return {
        isValid: false,
        hasZip: false,
        error: result.error || 'Please enter a valid address'
      };
    }

    const geocodeResult = result.results[0];
    
    // Проверяем наличие почтового индекса
    const hasZip = geocodeResult.address_components.some(
      component => component.types.includes('postal_code')
    );

    // Проверяем, что это US адрес
    const isUS = geocodeResult.address_components.some(
      component => component.types.includes('country') && component.short_name === 'US'
    );

    if (!isUS) {
      return {
        isValid: false,
        hasZip: hasZip,
        error: 'We only support addresses within the United States'
      };
    }

    if (!hasZip) {
      return {
        isValid: false,
        hasZip: false,
        error: 'Please include ZIP code in the address',
        formattedAddress: geocodeResult.formatted_address
      };
    }

    return {
      isValid: true,
      hasZip: true,
      formattedAddress: geocodeResult.formatted_address,
      location: geocodeResult.geometry.location
    };
  } catch (error) {
    console.error('Address validation error:', error);
    return {
      isValid: false,
      hasZip: false,
      error: 'Error validating address. Please try again.'
    };
  }
}

// Проверка одинаковых локаций
export async function isSameLocation(
  address1: string,
  address2: string
): Promise<boolean> {
  try {
    const [result1, result2] = await Promise.all([
      geocodeAddress(address1),
      geocodeAddress(address2)
    ]);

    if (!result1.success || !result2.success || 
        result1.results.length === 0 || result2.results.length === 0) {
      return false;
    }

    const location1 = result1.results[0].geometry.location;
    const location2 = result2.results[0].geometry.location;

    // Вычисляем расстояние (простая формула)
    const distance = calculateDistance(location1, location2);
    
    // Считаем одинаковыми, если расстояние меньше 1 км
    return distance < 1000;
  } catch (error) {
    console.error('Error comparing locations:', error);
    return false;
  }
}

// Вычисление расстояния между двумя точками (Haversine formula)
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}