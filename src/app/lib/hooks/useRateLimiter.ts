'use client';

import { useState, useEffect } from 'react';

type RequestType = 'calculator' | 'api';

interface RequestLog {
  timestamp: number;
  type: RequestType;
}

// Создаем объект для хранения состояния вне React
const rateLimiterState = {
  showCaptcha: false,
  captchaVerified: false,
  apiLimitReached: false,
  generatedNumber: Math.floor(1000 + Math.random() * 9000),
  initialized: false
};

// Функции для работы с данными
const getRequestsByType = (type: RequestType): RequestLog[] => {
  if (typeof window === 'undefined') return [];
  
  const now = Date.now();
  let timeFrame = 0;
  
  if (type === 'calculator') {
    timeFrame = 60 * 1000; // 1 минута для калькулятора
  } else if (type === 'api') {
    timeFrame = 60 * 60 * 1000; // 1 час для API
  }
  
  const cutoff = now - timeFrame;
  
  try {
    const storedRequests = localStorage.getItem('request_logs');
    if (!storedRequests) return [];
    
    const requests: RequestLog[] = JSON.parse(storedRequests);
    return requests.filter(req => req.timestamp > cutoff && req.type === type);
  } catch (e) {
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

const checkApiLimit = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  try {
    const apiRequests = getRequestsByType('api');
    
    // Если больше 50 запросов за последний час
    if (apiRequests.length >= 50) {
      rateLimiterState.apiLimitReached = true;
      return false;
    }
    
    rateLimiterState.apiLimitReached = false;
    return true;
  } catch (e) {
    return true;
  }
};

// Инициализация состояния
const initializeRateLimiter = () => {
  if (typeof window === 'undefined' || rateLimiterState.initialized) return;
  
  // Проверяем, не заблокирован ли пользователь ранее
  const calcBlockStatus = localStorage.getItem('calculator_blocked');
  if (calcBlockStatus) {
    try {
      const { blocked, until } = JSON.parse(calcBlockStatus);
      if (blocked && until > Date.now()) {
        rateLimiterState.showCaptcha = true;
      } else if (blocked && until <= Date.now()) {
        localStorage.removeItem('calculator_blocked');
      }
    } catch (e) {
      localStorage.removeItem('calculator_blocked');
    }
  }
  
  // Проверяем API лимит
  checkApiLimit();
  
  // Генерируем новое число для капчи
  rateLimiterState.generatedNumber = Math.floor(1000 + Math.random() * 9000);
  rateLimiterState.initialized = true;
};

// Функции-утилиты для внешнего использования
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
  
  // Если это 5-й запрос за минуту, включаем капчу
  if (calculatorRequests.length >= 4) { // 4 предыдущих + текущий = 5
    const now = Date.now();
    const blockUntil = now + 5 * 60 * 1000; // Блокировка на 5 минут
    
    localStorage.setItem('calculator_blocked', JSON.stringify({
      blocked: true,
      until: blockUntil
    }));
    
    rateLimiterState.showCaptcha = true;
    rateLimiterState.captchaVerified = false;
    // Генерируем новое число
    rateLimiterState.generatedNumber = Math.floor(1000 + Math.random() * 9000);
    return false;
  }
  
  return true;
};

export const trackApiRequest = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  initializeRateLimiter();
  
  // Проверяем текущий лимит API
  if (!checkApiLimit()) {
    return false;
  }
  
  // Регистрируем новый API запрос
  logRequest('api');
  
  // После регистрации перепроверяем лимит
  return checkApiLimit();
};

export const verifyCaptcha = (userInput: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  if (userInput === rateLimiterState.generatedNumber.toString()) {
    rateLimiterState.captchaVerified = true;
    rateLimiterState.showCaptcha = false;
    localStorage.removeItem('calculator_blocked');
    return true;
  }
  // Генерируем новое число при неудачной попытке
  rateLimiterState.generatedNumber = Math.floor(1000 + Math.random() * 9000);
  return false;
};

// React Hook для использования в компонентах
export function useRateLimiter() {
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);
  const [captchaVerified, setCaptchaVerified] = useState<boolean>(false);
  const [apiLimitReached, setApiLimitReached] = useState<boolean>(false);
  const [generatedNumber, setGeneratedNumber] = useState<number>(0);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Инициализируем при первой загрузке
    initializeRateLimiter();
    
    // Синхронизируем состояние React с глобальным состоянием
    setShowCaptcha(rateLimiterState.showCaptcha);
    setCaptchaVerified(rateLimiterState.captchaVerified);
    setApiLimitReached(rateLimiterState.apiLimitReached);
    setGeneratedNumber(rateLimiterState.generatedNumber);
    
    // Переодическая проверка состояния (каждую секунду)
    const intervalId = setInterval(() => {
      if (
        showCaptcha !== rateLimiterState.showCaptcha || 
        captchaVerified !== rateLimiterState.captchaVerified || 
        apiLimitReached !== rateLimiterState.apiLimitReached || 
        generatedNumber !== rateLimiterState.generatedNumber
      ) {
        setShowCaptcha(rateLimiterState.showCaptcha);
        setCaptchaVerified(rateLimiterState.captchaVerified);
        setApiLimitReached(rateLimiterState.apiLimitReached);
        setGeneratedNumber(rateLimiterState.generatedNumber);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [showCaptcha, captchaVerified, apiLimitReached, generatedNumber]);
  
  return {
    showCaptcha,
    captchaVerified,
    apiLimitReached,
    generatedNumber,
    trackCalculationRequest,
    trackApiRequest,
    verifyCaptcha
  };
}

export default useRateLimiter;