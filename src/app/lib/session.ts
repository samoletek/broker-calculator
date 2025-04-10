// src/app/lib/session.ts
import type { SessionOptions } from 'iron-session';
import crypto from 'crypto';

// Тип для объекта сессии
export interface SessionData {
  csrfToken?: string;
  [key: string]: any;
}

// Переменная для хранения временного ключа в dev режиме
// (создается при каждом запуске сервера)
let devModeSecret: string | null = null;

// Функция для получения SESSION_SECRET с проверкой
export const getSessionSecret = () => {
  // В production режиме требуем наличия переменной окружения
  const secret = process.env.SESSION_SECRET;
  
  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      throw new Error('SESSION_SECRET environment variable is required in production mode!');
    }
    return secret;
  }
  
  // В режиме разработки можем использовать временный ключ
  if (!secret) {
    if (!devModeSecret) {
      // Генерируем случайный ключ для режима разработки
      devModeSecret = crypto.randomBytes(32).toString('hex');
      console.warn(
        '\x1b[33m%s\x1b[0m', // Yellow color for warning
        'WARNING: Using a random SESSION_SECRET. This is only acceptable for development. ' +
        'Please set the SESSION_SECRET environment variable for production.'
      );
    }
    return devModeSecret;
  }
  
  return secret;
};

// Настройки сессии
export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: 'broker-calculator-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax', // Изменено с 'strict' на 'lax' для лучшей совместимости с браузерами
    path: '/',
  },
  ttl: 60 * 60 * 24, // 24 часа
};

// Расширение для Iron Session
declare module 'iron-session' {
  interface IronSessionData {
    csrfToken?: string;
  }
}