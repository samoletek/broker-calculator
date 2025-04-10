import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { validateCSRFToken } from '@/app/lib/csrf';
import { sessionOptions } from '@/app/lib/session';

// Хранилище для ограничения запросов
const requestStore: {
  [key: string]: {
    count: number;
    lastReset: number;
  };
} = {};

// Лимиты запросов
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 минута
  maxRequestsPerWindow: 20, // максимальное количество запросов за окно
};

export async function middleware(request: NextRequest) {
  // Используем заголовок для получения IP
  const ipHeader = request.headers.get('x-forwarded-for');
  const ip = ipHeader ? ipHeader.split(',')[0].trim() : 'unknown';
  const now = Date.now();
  
  // Проверяем, есть ли запись для этого IP
  if (!requestStore[ip]) {
    requestStore[ip] = {
      count: 0,
      lastReset: now,
    };
  }
  
  // Сбрасываем счетчик, если прошло время окна
  if (now - requestStore[ip].lastReset > RATE_LIMIT.windowMs) {
    requestStore[ip].count = 0;
    requestStore[ip].lastReset = now;
  }
  
  // Увеличиваем счетчик запросов
  requestStore[ip].count += 1;
  
  // Проверяем, не превышен ли лимит
  if (requestStore[ip].count > RATE_LIMIT.maxRequestsPerWindow) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { status: 429 }
    );
  }
  
  // Создаем объект response - нужен для iron-session
  const response = NextResponse.next();
  
  // Проверка CSRF только для POST, PUT, DELETE методов
  // Пропускаем проверку для GET и OPTIONS запросов и для маршрута /api/csrf
  if (
    request.method !== 'GET' && 
    request.method !== 'OPTIONS' && 
    !request.nextUrl.pathname.includes('/api/csrf')
  ) {
    try {
      // В edge middleware используем request и response
      const session = await getIronSession<{ csrfToken?: string }>(request, response, sessionOptions);
      
      const csrfToken = request.headers.get('csrf-token');
      
      if (!csrfToken || !session.csrfToken || !validateCSRFToken(csrfToken, session.csrfToken)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('CSRF validation error:', error);
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }
  }
  
  // Продолжаем обработку запроса
  return response;
}

// Настраиваем, к каким маршрутам применяется middleware
export const config = {
  matcher: '/api/:path*',
};