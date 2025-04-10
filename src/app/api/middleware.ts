import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Хранилище для ограничения запросов
const requestStore: {
  [key: string]: {
    count: number;
    lastReset: number;
  };
} = {};

// Лимиты запросов (настройте по вашему усмотрению)
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 минута
  maxRequestsPerWindow: 20, // максимальное количество запросов за окно
};

export function middleware(request: NextRequest) {
    // Используем заголовок для получения IP и берем первый из списка (если их несколько)
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
  
  // Продолжаем обработку запроса
  return NextResponse.next();
}

// Настраиваем, к каким маршрутам применяется middleware
export const config = {
  matcher: '/api/:path*',
};