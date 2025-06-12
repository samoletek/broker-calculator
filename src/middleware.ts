import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Определяем CSP заголовки с разрешением для iframe
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com;
    connect-src 'self' https://api.weatherapi.com https://api.emailjs.com https://api.eia.gov;
    img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    frame-src 'self'
  `.replace(/\s{2,}/g, ' ').trim();

  // Создаем новый ответ клонированием оригинального
  const response = NextResponse.next();
  
  // Добавляем CSP и другие заголовки безопасности
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Content-Security-Policy-Report-Only', "frame-ancestors 'self' https://*.wix.com https://*.editorx.com");
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

// Определяем, к каким маршрутам применять middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};