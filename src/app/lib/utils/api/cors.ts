import { NextRequest, NextResponse } from 'next/server';

// Разрешенные домены для разных окружений
const getAllowedOrigins = (): string[] => {
  const production = ['https://www.brokercalculator.xyz', 'https://brokercalculator.xyz'];
  const development = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  
  if (process.env.NODE_ENV === 'development') {
    return [...production, ...development];
  }
  
  // В продакшене добавляем дополнительные домены из переменных окружения
  const additionalOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  return [...production, ...additionalOrigins];
};

export function createCorsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // Проверяем, разрешен ли origin
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

export function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const corsHeaders = createCorsHeaders(request);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  const corsHeaders = createCorsHeaders(request);
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

// Middleware для автоматического добавления CORS заголовков
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Обработка preflight запросов
    if (request.method === 'OPTIONS') {
      return handleCorsPreflightRequest(request);
    }
    
    // Выполняем основной обработчик
    const response = await handler(request);
    
    // Добавляем CORS заголовки к ответу
    return addCorsHeaders(response, request);
  };
}