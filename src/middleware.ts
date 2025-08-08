import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Получаем origin запроса
  const origin = request.headers.get('origin') || '';
  
  // Список разрешенных доменов для встраивания
  const allowedOrigins = [
    'https://*.wix.com',
    'https://*.editorx.com',
    'https://*.wordpress.com',
    'http://localhost:*',
    'https://localhost:*',
    'http://18.227.107.26',
    'https://18.227.107.26'
  ];
  
  // Проверяем, разрешен ли origin
  const isAllowedOrigin = allowedOrigins.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/:\*/g, ':[0-9]+'));
    return regex.test(origin);
  });
  
  // Определяем CSP заголовки с разрешением для iframe
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://vercel.live https://cdn.jsdelivr.net;
    connect-src 'self' https://api.weatherapi.com https://api.emailjs.com https://api.eia.gov https://maps.googleapis.com;
    img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    frame-src 'self';
    frame-ancestors 'self' https://*.wix.com https://*.editorx.com https://*.wordpress.com http://localhost:* https://localhost:* http://18.227.107.26 https://18.227.107.26
  `.replace(/\s{2,}/g, ' ').trim();

  // Создаем новый ответ клонированием оригинального
  const response = NextResponse.next();
  
  // Добавляем CSP и другие заголовки безопасности
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Добавляем CORS заголовки для разрешенных доменов
  if (isAllowedOrigin || !origin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Разрешаем встраивание в iframe для разрешенных доменов
  if (isAllowedOrigin || !origin) {
    response.headers.delete('X-Frame-Options');
  } else {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  }
  
  return response;
}

// Определяем, к каким маршрутам применять middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};