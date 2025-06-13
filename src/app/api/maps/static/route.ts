import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';
import { APIErrorHandler } from '@/app/lib/utils/api/errorHandler';

// Server-side proxy для Google Static Maps API
const getHandler = async (request: NextRequest) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return APIErrorHandler.handleMissingConfig('Google Maps API Key');
    }

    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const path = searchParams.get('path');
    const size = searchParams.get('size') || '698x422';

    if (!origin || !destination) {
      return APIErrorHandler.handleValidationError('Origin and destination are required');
    }

    // Строим URL для Google Static Maps API
    const staticMapParams = new URLSearchParams({
      size,
      maptype: 'roadmap',
      format: 'png',
      markers: `color:green|label:A|${origin}`,
      key: process.env.GOOGLE_MAPS_API_KEY
    });

    // Добавляем маркер назначения
    staticMapParams.append('markers', `color:red|label:B|${destination}`);

    // Добавляем путь если есть
    if (path) {
      staticMapParams.append('path', `enc:${path}`);
    }

    const googleStaticUrl = `https://maps.googleapis.com/maps/api/staticmap?${staticMapParams.toString()}`;

    console.log('Static Map request:', { origin, destination, size });

    // Получаем изображение от Google
    const imageResponse = await fetch(googleStaticUrl);

    if (!imageResponse.ok) {
      throw new Error(`Google Static Maps API responded with status: ${imageResponse.status}`);
    }

    // Получаем binary данные изображения
    const imageBuffer = await imageResponse.arrayBuffer();

    // Возвращаем изображение с правильными заголовками
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Кешируем на 1 час
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Static Maps proxy error:', error);
    
    // В случае ошибки возвращаем placeholder изображение
    const placeholderSvg = `
      <svg width="698" height="422" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <g transform="translate(349,211)">
          <circle r="40" fill="#d1d5db"/>
          <text y="8" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">
            Map unavailable
          </text>
        </g>
      </svg>
    `;

    return new NextResponse(placeholderSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
};

export const GET = withRateLimit(getHandler, 'maps');