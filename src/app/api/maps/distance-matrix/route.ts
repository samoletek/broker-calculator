import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';
import { APIErrorHandler } from '@/app/lib/utils/api/errorHandler';

interface DistanceMatrixRequest {
  origins: string[];
  destinations: string[];
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  units?: 'METRIC' | 'IMPERIAL';
}

interface DistanceMatrixElement {
  distance?: {
    text: string;
    value: number;
  };
  duration?: {
    text: string;
    value: number;
  };
  status: string;
}

interface DistanceMatrixRow {
  elements: DistanceMatrixElement[];
}

interface DistanceMatrixResponse {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: DistanceMatrixRow[];
  status: string;
  error_message?: string;
}

// Server-side proxy для Google Distance Matrix API
const postHandler = async (request: NextRequest) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return APIErrorHandler.handleMissingConfig('Google Maps API Key');
    }

    const body: DistanceMatrixRequest = await request.json();
    
    // Валидация обязательных полей
    if (!body.origins || !body.destinations) {
      return APIErrorHandler.handleValidationError('Origins and destinations are required');
    }

    if (!Array.isArray(body.origins) || !Array.isArray(body.destinations)) {
      return APIErrorHandler.handleValidationError('Origins and destinations must be arrays');
    }

    if (body.origins.length === 0 || body.destinations.length === 0) {
      return APIErrorHandler.handleValidationError('Origins and destinations cannot be empty');
    }

    // Google API лимиты
    if (body.origins.length > 25 || body.destinations.length > 25) {
      return APIErrorHandler.handleValidationError('Maximum 25 origins and 25 destinations allowed');
    }

    if (body.origins.length * body.destinations.length > 100) {
      return APIErrorHandler.handleValidationError('Maximum 100 origin-destination pairs allowed');
    }

    // Построение URL параметров
    const params = new URLSearchParams({
      origins: body.origins.join('|'),
      destinations: body.destinations.join('|'),
      mode: body.travelMode || 'DRIVING',
      units: body.units || 'IMPERIAL',
      key: process.env.GOOGLE_MAPS_API_KEY
    });

    // Добавление опциональных параметров
    if (body.avoidTolls) {
      params.append('avoid', 'tolls');
    }

    if (body.avoidHighways) {
      const avoid = params.get('avoid');
      params.set('avoid', avoid ? `${avoid}|highways` : 'highways');
    }

    if (body.avoidFerries) {
      const avoid = params.get('avoid');
      params.set('avoid', avoid ? `${avoid}|ferries` : 'ferries');
    }

    console.log('Distance Matrix request:', { 
      origins: body.origins.length,
      destinations: body.destinations.length,
      mode: body.travelMode || 'DRIVING',
      totalPairs: body.origins.length * body.destinations.length
    });

    // Прямой вызов к Google Distance Matrix API
    const googleResponse = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!googleResponse.ok) {
      throw new Error(`Google API responded with status: ${googleResponse.status}`);
    }

    const data: DistanceMatrixResponse = await googleResponse.json();

    // Проверяем статус ответа от Google
    if (data.status !== 'OK') {
      if (data.status === 'OVER_QUERY_LIMIT') {
        return APIErrorHandler.createError('API_LIMIT_REACHED', 429);
      }

      if (data.status === 'INVALID_REQUEST') {
        return APIErrorHandler.handleValidationError('Invalid request parameters');
      }

      throw new Error(`Google Distance Matrix API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    // Подсчет статистики
    const validElements = data.rows.flatMap(row => 
      row.elements.filter(element => element.status === 'OK')
    );

    const totalDistance = validElements.reduce((sum, element) => 
      sum + (element.distance?.value || 0), 0
    );

    const totalDuration = validElements.reduce((sum, element) => 
      sum + (element.duration?.value || 0), 0
    );

    console.log('Distance Matrix success:', { 
      validResults: validElements.length,
      totalRequests: body.origins.length * body.destinations.length,
      avgDistance: validElements.length > 0 ? `${(totalDistance / validElements.length / 1609.34).toFixed(1)} miles` : 'N/A',
      avgDuration: validElements.length > 0 ? `${Math.round(totalDuration / validElements.length / 60)} minutes` : 'N/A'
    });

    return NextResponse.json({
      success: true,
      destination_addresses: data.destination_addresses,
      origin_addresses: data.origin_addresses,
      rows: data.rows,
      status: data.status,
      summary: {
        validResults: validElements.length,
        totalRequests: body.origins.length * body.destinations.length,
        statistics: validElements.length > 0 ? {
          averageDistance: {
            meters: Math.round(totalDistance / validElements.length),
            miles: Math.round((totalDistance / validElements.length / 1609.34) * 10) / 10
          },
          averageDuration: {
            seconds: Math.round(totalDuration / validElements.length),
            minutes: Math.round(totalDuration / validElements.length / 60)
          }
        } : null
      }
    });

  } catch (error) {
    console.error('Distance Matrix proxy error:', error);
    return APIErrorHandler.handleError(error);
  }
};

export const POST = withRateLimit(postHandler, 'maps');