'use client';

import { useState, useEffect } from 'react';

type RequestType = 'calculator';

interface RequestLog {
  timestamp: number;
  type: RequestType;
}

// Создаем объект для хранения состояния вне React
const rateLimiterState = {
  showCaptcha: false,
  captchaVerified: false,
  generatedNumber: Math.floor(1000 + Math.random() * 9000),
  initialized: false
};

// Функции для работы с данными
const getRequestsByType = (type: RequestType): RequestLog[] => {
  if (typeof window === 'undefined') return [];
  
  const now = Date.now();
  const timeFrame = 60 * 1000; // 1 минута для калькулятора
  
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
  
  // Генерируем новое число для капчи
  rateLimiterState.generatedNumber = Math.floor(1000 + Math.random() * 9000);
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
  
  // Если это 15-й запрос за минуту, включаем капчу
  if (calculatorRequests.length >= 14) { // 14 предыдущих + текущий = 15
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

// Просто заглушки для совместимости с существующим кодом
export const trackApiRequest = (): boolean => true;
export const trackAutocompleteRequest = (): boolean => true;

export const verifyCaptcha = (userInput: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  if (userInput === rateLimiterState.generatedNumber.toString()) {
    rateLimiterState.captchaVerified = true;
    rateLimiterState.showCaptcha = false;
    localStorage.removeItem('calculator_blocked');
    
    // Очистим журнал запросов при успешной верификации
    localStorage.setItem('request_logs', JSON.stringify([]));
    
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
  const [generatedNumber, setGeneratedNumber] = useState<number>(0);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Инициализируем при первой загрузке
    initializeRateLimiter();
    
    // Синхронизируем состояние React с глобальным состоянием
    setShowCaptcha(rateLimiterState.showCaptcha);
    setCaptchaVerified(rateLimiterState.captchaVerified);
    setGeneratedNumber(rateLimiterState.generatedNumber);
    
    // Периодическая проверка состояния (каждую секунду)
    const intervalId = setInterval(() => {
      if (
        showCaptcha !== rateLimiterState.showCaptcha || 
        captchaVerified !== rateLimiterState.captchaVerified || 
        generatedNumber !== rateLimiterState.generatedNumber
      ) {
        setShowCaptcha(rateLimiterState.showCaptcha);
        setCaptchaVerified(rateLimiterState.captchaVerified);
        setGeneratedNumber(rateLimiterState.generatedNumber);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [showCaptcha, captchaVerified, generatedNumber]);
  
  return {
    showCaptcha,
    captchaVerified,
    apiLimitReached: false, // Всегда false, так как мы удалили эту функциональность
    generatedNumber,
    trackCalculationRequest,
    trackApiRequest,
    verifyCaptcha,
    trackAutocompleteRequest
  };
}

export default useRateLimiter;