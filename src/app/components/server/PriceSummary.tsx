// src/app/components/server/PriceSummary.tsx
'use client';

import React, { useState } from 'react';
import { Save, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/app/components/ui/Button';
import type { SavedToast } from '@/app/types/common.types';
import { navigateToBooking } from '@/app/lib/utils/client/navigation';
import { sendPriceEmail } from '@/app/lib/utils/client/emailUtils';
import type { BookingFormData } from '@/app/types/booking.types';

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

export interface PriceSummaryProps {
  finalPrice: number;
  basePrice: number;
  selectedDate?: Date;
  onSavePrice?: () => void;
  contactInfo?: ContactInfo;
  pickup?: string;
  delivery?: string;
  transportType?: string;
  vehicleType?: string;
  vehicleValue?: string;
  paymentMethod?: string;
  additionalServices?: {
    premiumEnhancements: boolean;
    specialLoad: boolean;
    inoperable: boolean;
    supplementaryInsurance: boolean;
  };
  distance?: number;
  estimatedTime?: string;
}

export function PriceSummary({ 
  finalPrice, 
  basePrice, 
  selectedDate,
  contactInfo,
  pickup,
  delivery,
  transportType,
  vehicleType,
  vehicleValue,
  paymentMethod,
  additionalServices,
  distance,
  estimatedTime,
  onSavePrice 
}: PriceSummaryProps) {
  const [toast, setToast] = useState<SavedToast>({ show: false, message: '', type: 'success' });
  const [isSending, setIsSending] = useState(false);

  const handleSavePrice = async () => {
    console.log('🔴 КНОПКА НАЖАТА - handleSavePrice запущена');
    console.log('🔴 contactInfo:', contactInfo);
    
    // Проверяем, есть ли email
    if (!contactInfo?.email) {
      console.log('🔴 НЕТ EMAIL - показываем ошибку');
      setToast({
        show: true,
        message: 'Email address is required to send the price quote',
        type: 'error'
      });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }

    console.log('🔴 EMAIL ЕСТЬ - продолжаем');
    setIsSending(true);
    
    try {
      // Отправляем email с расчетом (localStorage будет сохранен в emailUtils)
      const emailData = {
        name: contactInfo.name || 'Customer',
        email: contactInfo.email,
        phone: contactInfo.phone || '',
        calculationData: {
          pickup: pickup || '',
          delivery: delivery || '',
          finalPrice: finalPrice,
          transportType: transportType || '',
          vehicleType: vehicleType || '',
          vehicleValue: vehicleValue || '',
          paymentMethod: paymentMethod || '',
          selectedDate: selectedDate?.toISOString(),
          distance: distance
        }
      };

      console.log('🚀 PriceSummary отправляет данные:', emailData);

      const emailResult = await sendPriceEmail(emailData);
      
      // Показываем результат отправки
      setToast({ 
        show: true, 
        message: emailResult.success 
          ? 'Price calculation saved and sent to your email!'
          : emailResult.message,
        type: emailResult.success ? 'success' : 'error'
      });
      
      if (onSavePrice) {
        onSavePrice();
      }
    } catch (error) {
      console.error('Error saving calculation or sending email:', error);
      setToast({ 
        show: true, 
        message: 'Failed to process your request', 
        type: 'error' 
      });
    } finally {
      setIsSending(false);
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
    }
  };

  const handleContinueToBooking = () => {
    if (!contactInfo?.name || !contactInfo?.phone || !contactInfo?.email) {
      setToast({ 
        show: true, 
        message: 'Please fill in all contact information',
        type: 'error'
      });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }

    if (!pickup || !delivery || !transportType || !vehicleType || !vehicleValue || !selectedDate) {
      setToast({ 
        show: true, 
        message: 'Please complete all required fields',
        type: 'error'
      });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }

    const bookingData: BookingFormData = {
      name: contactInfo.name,
      phone: contactInfo.phone,
      email: contactInfo.email,
      pickup,
      delivery,
      transportType,
      vehicleType,
      vehicleValue,
      premiumEnhancements: additionalServices?.premiumEnhancements || false,
      specialLoad: additionalServices?.specialLoad || false,
      inoperable: additionalServices?.inoperable || false,
      supplementaryInsurance: additionalServices?.supplementaryInsurance || false,
      selectedDate: selectedDate.toISOString()
    };

    navigateToBooking(bookingData);
  };

  return (
    <div className="w-full p-4 sm:p-24 bg-white rounded-[24px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 sm:gap-0">
        {/* Left side - Price block */}
        <div className="space-y-7 sm:space-y-17 w-full sm:w-auto">
          <h2 className="font-jost text-2xl sm:text-[32px] font-bold">Final Price</h2>
          <div className="text-3xl sm:text-[48px] font-jost font-bold text-primary">
            ${finalPrice.toFixed(2)}
          </div>
          <div className="space-y-2 sm:space-y-5">
            {selectedDate && (
              <div className="font-montserrat text-sm sm:text-p2">
                <span className="font-bold">Shipping Date:</span>
                <span className="ml-4 text-gray-600">
                  {format(selectedDate, "MMMM dd'th', yyyy")}
                </span>
              </div>
            )}
          </div>
        </div>
  
        {/* Right side - Buttons */}
        <div className="flex flex-col gap-4 sm:gap-12 w-full sm:w-auto">
          <Button
            onClick={handleSavePrice}
            variant="primary"
            loading={isSending}
            disabled={isSending}
            className="w-full sm:w-auto whitespace-nowrap flex items-center justify-center 
              px-12 sm:px-24 py-8 sm:py-12 
              bg-primary text-white rounded-[24px] 
              font-montserrat text-sm sm:text-p2 font-medium
              hover:bg-primary/90 transition-colors duration-200"
          >
            <Save className="w-12 h-12 sm:w-16 sm:h-16 mr-4 sm:mr-8" />
            Send me the price!
          </Button>
          
          <Button
            onClick={handleContinueToBooking}
            variant="secondary"
            className="w-full sm:w-auto whitespace-nowrap flex items-center justify-center 
              px-12 sm:px-24 py-8 sm:py-12 
              border border-primary text-primary rounded-[24px] 
              font-montserrat text-sm sm:text-p2 font-medium
              hover:bg-primary hover:text-white 
              transition-all duration-200"
          >
            <ArrowRight className="w-12 h-12 sm:w-16 sm:h-16 mr-4 sm:mr-8" />
            Continue to booking
          </Button>
        </div>
      </div>
  
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed bottom-8 sm:bottom-24 right-8 sm:right-24 
          ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}
          text-white px-12 sm:px-24 py-8 sm:py-12 
          rounded-[24px] shadow-lg 
          font-montserrat text-sm sm:text-p2 
          animate-fade-in-up
          z-50`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default PriceSummary;