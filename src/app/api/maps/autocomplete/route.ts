import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';
import { APIErrorHandler } from '@/app/lib/utils/api/errorHandler';

interface AutocompleteRequest {
  input: string;
  limit?: number;
}

interface PlacePrediction {
  placeId: string;
  text: {
    text: string;
  };
  types: string[];
}

interface AutocompleteSuggestion {
  placePrediction: PlacePrediction;
}

interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
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

    // Параметры для Places API (New) Autocomplete
    const requestBody = {
      input: body.input,
      includedPrimaryTypes: ['street_address'], // Только адреса
      includedRegionCodes: ['US'], // Только США
      languageCode: 'en' // Английский язык
    };

    // Вызов к Google Places API (New) Autocomplete
    const googleResponse = await fetch(
      `https://places.googleapis.com/v1/places:autocomplete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.types'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!googleResponse.ok) {
      throw new Error(`Google API responded with status: ${googleResponse.status}`);
    }

    const data: AutocompleteResponse = await googleResponse.json();

    // Проверяем наличие ошибки в ответе
    if (data.error) {
      if (data.error.status === 'RESOURCE_EXHAUSTED') {
        return APIErrorHandler.createError('API_LIMIT_REACHED', 429);
      }

      if (data.error.status === 'PERMISSION_DENIED') {
        console.error('Google Places API request denied:', data.error.message);
        return APIErrorHandler.createError('CONFIGURATION_ERROR', 403);
      }

      throw new Error(`Google Places API error: ${data.error.status} - ${data.error.message}`);
    }

    // Если нет предложений, возвращаем пустой массив
    if (!data.suggestions || data.suggestions.length === 0) {
      console.log('No autocomplete results found for:', body.input);
      return NextResponse.json({
        success: true,
        results: []
      });
    }

    // Применяем лимит результатов если указан
    const limitedResults = body.limit ? data.suggestions.slice(0, body.limit) : data.suggestions;

    // Преобразуем результаты в формат, совместимый с существующим кодом
    const formattedResults = limitedResults.map(suggestion => ({
      formatted_address: suggestion.placePrediction.text.text,
      place_id: suggestion.placePrediction.placeId,
      types: suggestion.placePrediction.types
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