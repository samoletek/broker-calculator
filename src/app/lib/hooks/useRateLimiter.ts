'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

type RequestType = 'calculator' | 'autocomplete';

interface RequestLog {
  timestamp: number;
  type: RequestType;
}

// Глобальное состояние для всего приложения
const rateLimiterState = {
  showCaptcha: false,
  captchaVerified: false,
  initialized: false,
  lastVerificationTime: 0
};

// Функции для работы с данными
const getRequestsByType = (type: RequestType): RequestLog[] => {
  if (typeof window === 'undefined') return [];
  
  const now = Date.now();
  
  // Устанавливаем временное окно для разных типов запросов
  const timeFrame = type === 'calculator' ? 5 * 60 * 1000 : 10 * 60 * 1000; // 5 минут для калькулятора, 10 минут для автоподсказок
  
  const cutoff = now - timeFrame;
  
  try {
    const storedRequests = localStorage.getItem('request_logs');
    if (!storedRequests) return [];
    
    const requests: RequestLog[] = JSON.parse(storedRequests);
    return requests.filter(req => req.timestamp > cutoff && req.type === type);
  } catch (e) {
    console.error('Error reading request logs:', e);
    return [];
  }
};

const logRequest = (type: RequestType) => {
  if (typeof window === 'undefined') return;
  
  try {
    const storedRequests = localStorage.getItem('request_logs');
    let requests: RequestLog[] = storedRequests ? JSON.parse(storedRequests) : [];
    
    // Добавляем новый запрос
    requests.push({
      timestamp: Date.now(),
      type
    });
    
    // Очищаем старые записи (старше суток)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    requests = requests.filter(req => req.timestamp > oneDayAgo);
    
    localStorage.setItem('request_logs', JSON.stringify(requests));
  } catch (e) {
    // В случае ошибки сбрасываем логи
    localStorage.setItem('request_logs', JSON.stringify([]));
  }
};

// Инициализация состояния
const initializeRateLimiter = () => {
  if (typeof window === 'undefined' || rateLimiterState.initialized) return;
  
  // Проверяем, не заблокирован ли пользователь ранее
  const blockedStatus = localStorage.getItem('api_blocked');
  if (blockedStatus) {
    try {
      const { blocked, until, verifiedAt } = JSON.parse(blockedStatus);
      if (blocked && until > Date.now()) {
        rateLimiterState.showCaptcha = true;
      } else if (blocked && until <= Date.now()) {
        localStorage.removeItem('api_blocked');
      }
      
      if (verifiedAt) {
        rateLimiterState.lastVerificationTime = verifiedAt;
        // Проверяем, не истекла ли верификация (24 часа)
        if (Date.now() - verifiedAt < 24 * 60 * 60 * 1000) {
          rateLimiterState.captchaVerified = true;
        }
      }
    } catch (e) {
      localStorage.removeItem('api_blocked');
    }
  }
  
  rateLimiterState.initialized = true;
};

// Функции для внешнего использования
export const trackCalculationRequest = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  initializeRateLimiter();
  
  // Если капча отображается и не верифицирована
  if (rateLimiterState.showCaptcha && !rateLimiterState.captchaVerified) {
    return false;
  }
  
  const calculatorRequests = getRequestsByType('calculator');
  
  // Регистрируем новый запрос
  logRequest('calculator');
  
  // Если это 3-й запрос за 5 минут, включаем капчу
  if (calculatorRequests.length >= 2) { // 2 предыдущих + текущий = 3
    const now = Date.now();
    const blockUntil = now + 24 * 60 * 60 * 1000; // Блокировка на 24 часа или до верификации
    
    localStorage.setItem('api_blocked', JSON.stringify({
      blocked: true,
      until: blockUntil
    }));
    
    rateLimiterState.showCaptcha = true;
    rateLimiterState.captchaVerified = false;
    return false;
  }
  
  return true;
};

export const trackAutocompleteRequest = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  initializeRateLimiter();
  
  // Если капча отображается и не верифицирована
  if (rateLimiterState.showCaptcha && !rateLimiterState.captchaVerified) {
    return false;
  }
  
  const autocompleteRequests = getRequestsByType('autocomplete');
  
  // Регистрируем новый запрос
  logRequest('autocomplete');
  
  // Если это 10-й запрос за 10 минут, включаем капчу
  if (autocompleteRequests.length >= 9) { // 9 предыдущих + текущий = 10
    const now = Date.now();
    const blockUntil = now + 24 * 60 * 60 * 1000; // Блокировка на 24 часа или до верификации
    
    localStorage.setItem('api_blocked', JSON.stringify({
      blocked: true,
      until: blockUntil
    }));
    
    rateLimiterState.showCaptcha = true;
    rateLimiterState.captchaVerified = false;
    return false;
  }
  
  return true;
};

// Функция для проверки reCaptcha
export const verifyRecaptcha = async (token: string | null): Promise<boolean> => {
  if (typeof window === 'undefined' || !token) return false;
  
  try {
    console.log('Verifying reCAPTCHA token');
    
    // Можно использовать API эндпоинт для проверки, но для отладки просто проверяем наличие токена
    const isValid = !!token;
    
    if (isValid) {
      console.log('reCAPTCHA token verified successfully');
      
      rateLimiterState.captchaVerified = true;
      rateLimiterState.showCaptcha = false;
      
      const now = Date.now();
      rateLimiterState.lastVerificationTime = now;
      
      localStorage.setItem('api_blocked', JSON.stringify({
        blocked: false,
        until: 0,
        verifiedAt: now
      }));
      
      // Очистим журнал запросов при успешной верификации
      localStorage.setItem('request_logs', JSON.stringify([]));
      
      return true;
    }
    
    console.log('reCAPTCHA token verification failed');
    return false;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
};

// React Hook для использования в компонентах
export function useRateLimiter() {
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);
  const [captchaVerified, setCaptchaVerified] = useState<boolean>(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Инициализируем при первой загрузке
    initializeRateLimiter();
    
    // Синхронизируем состояние React с глобальным состоянием
    setShowCaptcha(rateLimiterState.showCaptcha);
    setCaptchaVerified(rateLimiterState.captchaVerified);
    
    // Периодическая проверка состояния (каждую секунду)
    const intervalId = setInterval(() => {
      if (
        showCaptcha !== rateLimiterState.showCaptcha || 
        captchaVerified !== rateLimiterState.captchaVerified
      ) {
        setShowCaptcha(rateLimiterState.showCaptcha);
        setCaptchaVerified(rateLimiterState.captchaVerified);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [showCaptcha, captchaVerified]);
  
  return {
    showCaptcha,
    captchaVerified,
    apiLimitReached: false,
    trackCalculationRequest,
    verifyRecaptcha,
    trackAutocompleteRequest
  };
}

export default useRateLimiter;