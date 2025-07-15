import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  statusCode?: number;
}

interface RequestCounter {
  count: number;
  resetTime: number;
}

// In-memory store (позже лучше использовать Redis)
const requestStore = new Map<string, RequestCounter>();

// Конфигурации rate limiting
export const RATE_LIMIT_CONFIGS = {
  default: { windowMs: 60000, maxRequests: 200 }, // 200 запросов в минуту (общие)
  calculation: { windowMs: 60000, maxRequests: 100 }, // 100 калькуляций в минуту
  lead: { windowMs: 300000, maxRequests: 20 }, // 20 лидов в 5 минут (защита от спама)
  maps: { windowMs: 60000, maxRequests: 150 }, // 150 запросов к картам (много калькуляций)
  weather: { windowMs: 60000, maxRequests: 120 }, // 120 запросов к погоде
  fuel: { windowMs: 60000, maxRequests: 100 }, // 100 запросов к ценам топлива
  geocoding: { windowMs: 60000, maxRequests: 200 }, // 200 геокодирований (много адресов)
} as const;

export class RateLimiter {
  private static getClientIdentifier(request: NextRequest): string {
    // Для production с высокой нагрузкой - используем комбинированный подход
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }
    
    // Fallback для локальной разработки
    return 'localhost';
  }

  private static cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, value] of requestStore.entries()) {
      if (now >= value.resetTime) {
        requestStore.delete(key);
      }
    }
  }

  static checkRateLimit(
    request: NextRequest,
    config: RateLimitConfig
  ): { allowed: boolean; remainingRequests: number; resetTime: number } {
    this.cleanupExpiredEntries();
    
    const clientId = this.getClientIdentifier(request);
    const endpoint = new URL(request.url).pathname;
    const key = `${clientId}:${endpoint}`;
    
    const now = Date.now();
    const windowEnd = now + config.windowMs;
    
    const existing = requestStore.get(key);
    
    if (!existing || now >= existing.resetTime) {
      // Новое окно или первый запрос
      requestStore.set(key, {
        count: 1,
        resetTime: windowEnd
      });
      
      return {
        allowed: true,
        remainingRequests: config.maxRequests - 1,
        resetTime: windowEnd
      };
    }
    
    if (existing.count >= config.maxRequests) {
      // Лимит превышен
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: existing.resetTime
      };
    }
    
    // Увеличиваем счетчик
    existing.count++;
    requestStore.set(key, existing);
    
    return {
      allowed: true,
      remainingRequests: config.maxRequests - existing.count,
      resetTime: existing.resetTime
    };
  }

  static createRateLimitResponse(resetTime: number, message?: string): NextResponse {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || 'Server is busy. Please try again in a few seconds.',
          timestamp: new Date().toISOString(),
          retryAfter
        }
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': '0',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString()
        }
      }
    );
  }

  static addRateLimitHeaders(
    response: NextResponse,
    limit: number,
    remaining: number,
    resetTime: number
  ): NextResponse {
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
    return response;
  }
}

// Middleware для автоматического rate limiting
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  configKey: keyof typeof RATE_LIMIT_CONFIGS = 'default'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const config = RATE_LIMIT_CONFIGS[configKey];
    const rateLimit = RateLimiter.checkRateLimit(request, config);
    
    if (!rateLimit.allowed) {
      return RateLimiter.createRateLimitResponse(rateLimit.resetTime);
    }
    
    // Выполняем основной обработчик
    const response = await handler(request);
    
    // Добавляем rate limit заголовки
    return RateLimiter.addRateLimitHeaders(
      response,
      config.maxRequests,
      rateLimit.remainingRequests,
      rateLimit.resetTime
    );
  };
}