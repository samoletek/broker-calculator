'use client';

import React, { useEffect, useState, useRef } from 'react';

interface GoogleReCaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
}

// Исправляем объявление глобальных типов
declare global {
  interface Window {
    onRecaptchaLoad?: () => void;
    grecaptcha?: {
      render: (container: HTMLElement, options: any) => number;
      reset: (id: number) => void;
    };
  }
}

export default function GoogleReCaptcha({ onVerify, onExpired }: GoogleReCaptchaProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const captchaId = useRef<number | null>(null);
  
  useEffect(() => {
    // Проверяем, не загружен ли скрипт reCAPTCHA уже
    if (document.querySelector('script[src*="recaptcha/api.js"]')) {
      setScriptLoaded(true);
      return;
    }
    
    // Определяем функцию обратного вызова для загрузки reCAPTCHA
    window.onRecaptchaLoad = () => {
      setScriptLoaded(true);
    };
    
    // Загружаем скрипт
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Error loading reCAPTCHA script');
      setScriptError(true);
    };
    
    document.head.appendChild(script);
    
    // Функция очистки
    return () => {
      // Если капча была отрисована и существует grecaptcha, сбрасываем ее
      if (captchaId.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(captchaId.current);
        } catch (e) {
          console.error('Error resetting reCAPTCHA:', e);
        }
      }
      
      // Удаляем глобальный callback
      if (window.onRecaptchaLoad) {
        window.onRecaptchaLoad = undefined; // Вместо delete
      }
    };
  }, []);
  
  // Рендерим капчу после загрузки скрипта
  useEffect(() => {
    if (scriptLoaded && containerRef.current && window.grecaptcha) {
      try {
        console.log('Attempting to render reCAPTCHA widget');
        const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
        
        if (!siteKey) {
          console.error('NEXT_PUBLIC_RECAPTCHA_SITE_KEY not defined in environment');
          setScriptError(true);
          return;
        }
        
        // Очищаем контейнер на всякий случай
        if (containerRef.current.innerHTML !== '') {
          containerRef.current.innerHTML = '';
        }
        
        captchaId.current = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            console.log('reCAPTCHA verification callback triggered');
            onVerify(token);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            if (onExpired) onExpired();
          }
        });
        console.log('reCAPTCHA widget rendered successfully');
      } catch (error) {
        console.error('Error rendering reCAPTCHA widget:', error);
        setScriptError(true);
      }
    }
  }, [scriptLoaded, onVerify, onExpired]);
  
  // Упрощаем UI компонента, убираем заголовки и описания
  return (
    <div className="w-full flex justify-center my-4">
      {scriptError ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          Error loading verification component. Please refresh.
        </div>
      ) : (
        <div
          ref={containerRef}
          className="g-recaptcha flex justify-center items-center min-h-[78px]"
        >
          {!scriptLoaded && (
            <div className="text-gray-500 animate-pulse">
              Loading verification...
            </div>
          )}
        </div>
      )}
    </div>
  );
}