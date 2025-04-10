// src/app/lib/session.ts
import type { SessionOptions } from 'iron-session';

// Тип для объекта сессии
export interface SessionData {
  csrfToken?: string;
  [key: string]: any;
}

// Функция для получения SESSION_SECRET с проверкой
export const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('SESSION_SECRET environment variable is not defined! Using fallback for development only.');
  }
  return secret || 'dev_only_secret_not_for_production';
};

// Настройки сессии
export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: 'broker-calculator-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  },
};

// Расширение для Iron Session
declare module 'iron-session' {
  interface IronSessionData {
    csrfToken?: string;
  }
}