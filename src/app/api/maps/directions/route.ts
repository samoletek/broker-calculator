import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';
import { APIErrorHandler } from '@/app/lib/utils/api/errorHandler';

interface DirectionsRequest {
  origin: string;
  destination: string;
  waypoints?: string[];
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
}

interface DirectionsLeg {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  start_address: string;
  end_address: string;
  start_location: {
    lat: number;
    lng: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  steps: Array<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    end_location: { lat: number; lng: number };
    start_location: { lat: number; lng: number };
    html_instructions: string;
  }>;
}

interface DirectionsRoute {
  legs: DirectionsLeg[];
  overview_polyline: {
    points: string;
  };
  summary: string;
  warnings: string[];
  waypoint_order: number[];
}

interface DirectionsResponse {
  routes: DirectionsRoute[];
  status: string;
  error_message?: string;
  geocoded_waypoints?: Array<{
    geocoder_status: string;
    place_id: string;
    types: string[];
  }>;
}

// Server-side proxy для Google Directions API
const postHandler = async (request: NextRequest) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return APIErrorHandler.handleMissingConfig('Google Maps API Key');
    }

    const body: DirectionsRequest = await request.json();
    
    // Валидация обязательных полей
    if (!body.origin || !body.destination) {
      return APIErrorHandler.handleValidationError('Origin and destination are required');
    }

    if (body.origin.trim().length === 0 || body.destination.trim().length === 0) {
      return APIErrorHandler.handleValidationError('Origin and destination cannot be empty');
    }

    // Построение URL параметров
    const params = new URLSearchParams({
      origin: body.origin,
      destination: body.destination,
      mode: body.travelMode || 'DRIVING',
      key: process.env.GOOGLE_MAPS_API_KEY
    });

    // Добавление опциональных параметров
    if (body.waypoints && body.waypoints.length > 0) {
      params.append('waypoints', body.waypoints.join('|'));
    }

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

    console.log('Directions request:', { 
      origin: body.origin, 
      destination: body.destination,
      mode: body.travelMode || 'DRIVING'
    });

    // Прямой вызов к Google Directions API
    const googleResponse = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
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

    const data: DirectionsResponse = await googleResponse.json();

    // Проверяем статус ответа от Google
    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        return NextResponse.json({
          success: false,
          error: 'No route found between these locations',
          routes: []
        });
      }
      
      if (data.status === 'OVER_QUERY_LIMIT') {
        return APIErrorHandler.createError('API_LIMIT_REACHED', 429);
      }

      if (data.status === 'NOT_FOUND') {
        return NextResponse.json({
          success: false,
          error: 'One or more locations could not be found',
          routes: []
        });
      }

      throw new Error(`Google Directions API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No routes found',
        routes: []
      });
    }

    // Вычисляем общую дистанцию и время
    const route = data.routes[0];
    const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
    const totalDuration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);

    console.log('Directions success:', { 
      origin: body.origin,
      destination: body.destination,
      distance: `${(totalDistance / 1609.34).toFixed(1)} miles`,
      duration: `${Math.round(totalDuration / 60)} minutes`,
      routeCount: data.routes.length
    });

    return NextResponse.json({
      success: true,
      routes: data.routes,
      status: data.status,
      geocoded_waypoints: data.geocoded_waypoints,
      summary: {
        distance: {
          meters: totalDistance,
          miles: Math.round((totalDistance / 1609.34) * 10) / 10
        },
        duration: {
          seconds: totalDuration,
          minutes: Math.round(totalDuration / 60)
        }
      }
    });

  } catch (error) {
    console.error('Directions proxy error:', error);
    return APIErrorHandler.handleError(error);
  }
};

export const POST = withRateLimit(postHandler, 'maps');