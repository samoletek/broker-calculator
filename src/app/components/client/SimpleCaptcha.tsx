'use client';

import React, { useState } from 'react';
import { Lock, RefreshCw } from 'lucide-react';

interface SimpleCaptchaProps {
  generatedNumber: number;
  onVerify: (userInput: string) => boolean;
}

export default function SimpleCaptcha({ generatedNumber, onVerify }: SimpleCaptchaProps) {
  const [userInput, setUserInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput) {
      setError('Please enter the code');
      return;
    }
    
    const result = onVerify(userInput);
    if (!result) {
      setError('Incorrect code. Please try again.');
      setUserInput('');
    }
  };

  // Создаем URL для отображения числа как изображения
  const createCaptchaImageUrl = (num: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Фон
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Добавляем шум (точки)
      for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.1)`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }
      
      // Добавляем линии для помех
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.strokeStyle = `rgba(${Math.random() * 200}, ${Math.random() * 200}, ${Math.random() * 200}, 0.3)`;
        ctx.stroke();
      }
      
      // Текст
      ctx.font = '40px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), canvas.width / 2, canvas.height / 2);
    }
    
    return canvas.toDataURL();
  };

  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-[24px] shadow-lg border border-primary/10 my-16">
      <div className="text-center space-y-4">
        <h2 className="font-jost text-xl sm:text-2xl font-bold text-primary flex items-center justify-center gap-2">
          <Lock className="w-6 h-6" />
          Security Verification
        </h2>
        <p className="font-montserrat text-sm sm:text-p2 text-gray-600">
          We noticed multiple requests from your device. Please enter the code below to continue.
        </p>
        
        <div className="my-6 relative">
          <img 
            src={createCaptchaImageUrl(generatedNumber)}
            alt="CAPTCHA" 
            className="mx-auto border border-gray-200 rounded-md"
          />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                setError(null);
              }}
              placeholder="Enter the 4-digit code"
              className="block w-full rounded-[24px] bg-gray-50 border border-gray-300 px-4 py-2 text-center"
              maxLength={4}
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-[24px] hover:bg-primary/90"
            >
              Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}