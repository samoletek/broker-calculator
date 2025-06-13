import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';
import { APIErrorHandler } from '@/app/lib/utils/api/errorHandler';

interface AutocompleteRequest {
  input: string;
  limit?: number;
}

interface AutocompletePrediction {
  description: string;
  place_id: string;
  types: string[];
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AutocompleteResponse {
  predictions: AutocompletePrediction[];
  status: string;
  error_message?: string;
}

// Server-side proxy для Google Places API Autocomplete
const postHandler = async (request: NextRequest) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return APIErrorHandler.handleMissingConfig('Google Maps API Key');
    }

    const body: AutocompleteRequest = await request.json();
    
    if (!body.input || body.input.trim().length === 0) {
      return APIErrorHandler.handleValidationError('Input is required');
    }

    // Валидация длины ввода
    if (body.input.length > 1000) {
      return APIErrorHandler.handleValidationError('Input is too long (max 1000 characters)');
    }

    console.log('Autocomplete request:', { input: body.input });

    // Параметры для Places API Autocomplete (legacy)
    const params = new URLSearchParams({
      input: body.input,
      key: process.env.GOOGLE_MAPS_API_KEY!,
      types: 'address', // Только адреса
      components: 'country:us', // Только США
      language: 'en', // Английский язык
    });

    // Вызов к Google Places API Autocomplete
    const googleResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
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

    const data: AutocompleteResponse = await googleResponse.json();

    // Проверяем статус ответа от Google
    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        return NextResponse.json({
          success: true,
          results: []
        });
      }
      
      if (data.status === 'OVER_QUERY_LIMIT') {
        return APIErrorHandler.createError('API_LIMIT_REACHED', 429);
      }

      if (data.status === 'REQUEST_DENIED') {
        console.error('Google Places API request denied:', data.error_message);
        return APIErrorHandler.createError('CONFIGURATION_ERROR', 403);
      }

      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    // Применяем лимит результатов если указан
    const limitedResults = body.limit ? data.predictions.slice(0, body.limit) : data.predictions;

    // Преобразуем результаты в формат, совместимый с существующим кодом
    const formattedResults = limitedResults.map(prediction => ({
      formatted_address: prediction.description,
      place_id: prediction.place_id,
      types: prediction.types
    }));

    console.log('Autocomplete success:', { 
      input: body.input, 
      resultCount: formattedResults.length,
      limit: body.limit,
      firstResult: formattedResults[0]?.formatted_address 
    });

    return NextResponse.json({
      success: true,
      results: formattedResults
    });

  } catch (error) {
    console.error('Autocomplete proxy error:', error);
    return APIErrorHandler.handleError(error);
  }
};

export const POST = withRateLimit(postHandler, 'maps');