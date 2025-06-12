import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';
import { APIErrorHandler } from '@/app/lib/utils/api/errorHandler';

interface GeocodeRequest {
  address: string;
}

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

interface GeocodeResponse {
  results: GeocodeResult[];
  status: string;
  error_message?: string;
}

// Server-side proxy для Google Geocoding API
const postHandler = async (request: NextRequest) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return APIErrorHandler.handleMissingConfig('Google Maps API Key');
    }

    const body: GeocodeRequest = await request.json();
    
    if (!body.address || body.address.trim().length === 0) {
      return APIErrorHandler.handleValidationError('Address is required');
    }

    // Валидация длины адреса (Google имеет лимиты)
    if (body.address.length > 2048) {
      return APIErrorHandler.handleValidationError('Address is too long (max 2048 characters)');
    }

    console.log('Geocoding request:', { address: body.address });

    // Прямой вызов к Google Geocoding API
    const googleResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(body.address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
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

    const data: GeocodeResponse = await googleResponse.json();

    // Проверяем статус ответа от Google
    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        return NextResponse.json({
          success: false,
          error: 'No results found for this address',
          results: []
        });
      }
      
      if (data.status === 'OVER_QUERY_LIMIT') {
        return APIErrorHandler.createError('API_LIMIT_REACHED', 429);
      }

      throw new Error(`Google Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    // Фильтруем только US адреса
    const usResults = data.results.filter(result => 
      result.address_components.some(component => 
        component.types.includes('country') && component.short_name === 'US'
      )
    );

    if (usResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'We only support addresses within the United States',
        results: []
      });
    }

    console.log('Geocoding success:', { 
      address: body.address, 
      resultCount: usResults.length,
      firstResult: usResults[0]?.formatted_address 
    });

    return NextResponse.json({
      success: true,
      results: usResults,
      status: data.status
    });

  } catch (error) {
    console.error('Geocoding proxy error:', error);
    return APIErrorHandler.handleError(error);
  }
};

export const POST = withRateLimit(postHandler, 'geocoding');