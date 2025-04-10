import crypto from 'crypto';

/**
 * Генерирует CSRF токен с использованием случайных байтов
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Сравнивает токены с защитой от timing-атак
 */
export function verifyToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }
  
  // Проверка, что токены имеют одинаковую длину
  if (token.length !== expectedToken.length) {
    return false;
  }
  
  try {
    // Для безопасного сравнения в браузере просто сравниваем строки
    // (crypto.timingSafeEqual доступен только на сервере)
    if (typeof window !== 'undefined') {
      return token === expectedToken;
    }
    
    // На сервере используем константное время для сравнения
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expectedToken)
    );
  } catch (error) {
    console.error('Error comparing tokens:', error);
    return false;
  }
}

/**
 * Функция для проверки CSRF-токена
 */
export function validateCSRFToken(
  requestToken: string | undefined | null, 
  sessionToken: string | undefined | null
): boolean {
  if (!requestToken || !sessionToken) {
    return false;
  }
  
  try {
    return verifyToken(requestToken, sessionToken);
  } catch (error) {
    console.error('CSRF validation error:', error);
    return false;
  }
}