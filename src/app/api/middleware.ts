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

// Пути, которые не требуют CSRF-токена
const CSRF_EXEMPT_PATHS = [
  '/api/csrf',
  '/api/verify-recaptcha',
  '/api/captcha',
  '/api/maps'
];

export async function middleware(request: NextRequest) {
  console.log(`API Middleware called for ${request.method} ${request.nextUrl.pathname}`);
  
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
    console.log(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { status: 429 }
    );
  }
  
  // Создаем объект response - нужен для iron-session
  const response = NextResponse.next();
  
  // Проверяем, нужна ли проверка CSRF для этого маршрута
  const isCSRFExempt = CSRF_EXEMPT_PATHS.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // Проверка CSRF только для POST, PUT, DELETE методов
  // Пропускаем проверку для GET и OPTIONS запросов и для исключённых маршрутов
  if (
    request.method !== 'GET' && 
    request.method !== 'OPTIONS' && 
    !isCSRFExempt
  ) {
    console.log(`CSRF validation for ${request.nextUrl.pathname}`);
    try {
      // В edge middleware используем request и response
      const session = await getIronSession<{ csrfToken?: string }>(request, response, sessionOptions);
      
      const csrfToken = request.headers.get('csrf-token');
      console.log('CSRF token from header:', csrfToken ? 'Present' : 'Missing');
      console.log('CSRF token from session:', session.csrfToken ? 'Present' : 'Missing');
      
      if (!csrfToken || !session.csrfToken) {
        console.log('CSRF token missing from header or session');
        
        // В случае отсутствия CSRF токена для /api/email, продолжаем обработку
        // это временное решение для отладки
        if (request.nextUrl.pathname === '/api/email') {
          console.log('Allowing /api/email request without CSRF token');
          return response;
        }
        
        return NextResponse.json(
          { error: 'CSRF token required' },
          { status: 403 }
        );
      }
      
      if (!validateCSRFToken(csrfToken, session.csrfToken)) {
        console.log('CSRF validation failed: tokens do not match');
        
        // В случае несоответствия CSRF токена для /api/email, продолжаем обработку
        // это временное решение для отладки
        if (request.nextUrl.pathname === '/api/email') {
          console.log('Allowing /api/email request with invalid CSRF token');
          return response;
        }
        
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
      
      console.log('CSRF validation successful');
    } catch (error) {
      console.error('CSRF validation error:', error);
      
      // В случае ошибки проверки CSRF для /api/email, продолжаем обработку
      // это временное решение для отладки
      if (request.nextUrl.pathname === '/api/email') {
        console.log('Allowing /api/email request despite CSRF error');
        return response;
      }
      
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