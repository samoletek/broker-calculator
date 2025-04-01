'use client';

import { useState, useEffect } from 'react';

type RequestType = 'calculator' | 'api';

interface RequestLog {
  timestamp: number;
  type: RequestType;
}

export function useRateLimiter() {
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);
  const [captchaVerified, setCaptchaVerified] = useState<boolean>(false);
  const [apiLimitReached, setApiLimitReached] = useState<boolean>(false);
  const [generatedNumber, setGeneratedNumber] = useState<number>(0);
  
  useEffect(() => {
    // Проверяем, не заблокирован ли пользователь ранее
    const calcBlockStatus = localStorage.getItem('calculator_blocked');
    if (calcBlockStatus) {
      try {
        const { blocked, until } = JSON.parse(calcBlockStatus);
        if (blocked && until > Date.now()) {
          setShowCaptcha(true);
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
    setGeneratedNumber(Math.floor(1000 + Math.random() * 9000));
  }, []);
  
  const checkApiLimit = (): boolean => {
    try {
      const apiRequests = getRequestsByType('api');
      
      // Если больше 50 запросов за последний час
      if (apiRequests.length >= 50) {
        setApiLimitReached(true);
        return false;
      }
      
      setApiLimitReached(false);
      return true;
    } catch (e) {
      return true;
    }
  };
  
  const getRequestsByType = (type: RequestType): RequestLog[] => {
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
  
  const trackCalculationRequest = (): boolean => {
    // Если капча отображается и не верифицирована
    if (showCaptcha && !captchaVerified) {
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
      
      setShowCaptcha(true);
      setCaptchaVerified(false);
      // Генерируем новое число
      setGeneratedNumber(Math.floor(1000 + Math.random() * 9000));
      return false;
    }
    
    return true;
  };
  
  const trackApiRequest = (): boolean => {
    // Проверяем текущий лимит API
    if (!checkApiLimit()) {
      return false;
    }
    
    // Регистрируем новый API запрос
    logRequest('api');
    
    // После регистрации перепроверяем лимит
    return checkApiLimit();
  };
  
  const verifyCaptcha = (userInput: string): boolean => {
    if (userInput === generatedNumber.toString()) {
      setCaptchaVerified(true);
      setShowCaptcha(false);
      localStorage.removeItem('calculator_blocked');
      return true;
    }
    // Генерируем новое число при неудачной попытке
    setGeneratedNumber(Math.floor(1000 + Math.random() * 9000));
    return false;
  };
  
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