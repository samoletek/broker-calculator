'use client';

import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';

// Используем динамический импорт с обработкой ошибок
const ReCAPTCHA = dynamic(
  () => import('react-google-recaptcha').catch(err => {
    console.error('Failed to load ReCAPTCHA:', err);
    // Возвращаем заглушку компонента в случае ошибки импорта
    return function DummyComponent() {
      return (
        <div className="p-4 text-red-500 border border-red-300 rounded">
          ReCAPTCHA could not be loaded. Please refresh the page.
        </div>
      );
    };
  }),
  { ssr: false, loading: () => <div className="p-4 text-gray-500">Loading verification...</div> }
);

interface GoogleReCaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
}

export default function GoogleReCaptcha({ onVerify, onExpired }: GoogleReCaptchaProps) {
  const handleChange = useCallback((token: string | null) => {
    onVerify(token);
  }, [onVerify]);

  const handleExpired = useCallback(() => {
    if (onExpired) {
      onExpired();
    }
  }, [onExpired]);

  // Здесь мы используем публичный ключ, который всё еще доступен в браузере
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-[24px] shadow-lg border border-primary/10 my-16">
      <div className="text-center space-y-4">
        <h2 className="font-jost text-xl sm:text-2xl font-bold text-primary flex items-center justify-center gap-2">
          Security Verification
        </h2>
        <p className="font-montserrat text-sm sm:text-p2 text-gray-600">
          We noticed multiple requests from your device. Please complete the verification to continue.
        </p>
        
        <div className="my-6 flex justify-center">
          {siteKey ? (
            <ReCAPTCHA
              sitekey={siteKey}
              onChange={handleChange}
              onExpired={handleExpired}
            />
          ) : (
            <div className="p-4 text-red-500 border border-red-300 rounded">
              ReCAPTCHA site key not found. Please check your configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}