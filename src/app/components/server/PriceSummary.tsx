'use client';

import React, { useState } from 'react';
import { DollarSign, Save, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/app/components/ui/Button';
import type { SavedToast } from '@/app/types/common.types';
import { navigateToBooking } from '@/app/lib/utils/client/navigation';
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
  additionalServices?: {
    premiumEnhancements: boolean;
    specialLoad: boolean;
    inoperable: boolean;
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
  additionalServices,
  distance,
  estimatedTime,
  onSavePrice 
}: PriceSummaryProps) {
  const [toast, setToast] = useState<SavedToast>({ show: false, message: '', type: 'success' });

  const handleSavePrice = () => {
    const savedCalculation = {
      finalPrice,
      basePrice,
      date: selectedDate?.toISOString(),
      savedAt: new Date().toISOString()
    };
    
    try {
      const savedCalculations = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
      savedCalculations.push(savedCalculation);
      localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
      
      setToast({ show: true, message: 'Price calculation saved!', type: 'success' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      
      if (onSavePrice) {
        onSavePrice();
      }
    } catch (error) {
      console.error('Error saving calculation:', error);
      setToast({ show: true, message: 'Failed to save calculation', type: 'error' });
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
      selectedDate: selectedDate.toISOString()
    };

    navigateToBooking(bookingData);
  };

  return (
    <div className="w-full bg-white rounded-[24px] p-24">
      <div className="flex justify-between items-center">
        {/* Left side - Price block */}
        <div className="space-y-12">
          <h2 className="font-jost text-[32px] font-bold">Final Price</h2>
          <div className="text-[48px] font-jost font-bold text-primary">
            ${finalPrice.toFixed(2)}
          </div>
          <div className="space-y-4">
            <div className="font-montserrat text-p2">
              <span className="font-bold">Base Price:</span>
              <span className="ml-4 text-gray-600">${basePrice.toFixed(2)}</span>
            </div>
            {selectedDate && (
              <div className="font-montserrat text-p2">
                <span className="font-bold">Shipping Date:</span>
                <span className="ml-4 text-gray-600">
                  {format(selectedDate, "MMMM dd'th', yyyy")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Buttons stacked vertically */}
        <div className="flex flex-col justify-center gap-12 self-center">
          <Button
            onClick={handleSavePrice}
            variant="primary"
            className="whitespace-nowrap flex items-center justify-center px-24 py-12 
              bg-primary text-white rounded-[24px] 
              font-montserrat text-p2 font-medium
              hover:bg-primary/90 transition-colors duration-200"
          >
            <Save className="w-16 h-16 mr-8" />
            Save price for me!
          </Button>
          
          <Button
            onClick={handleContinueToBooking}
            variant="secondary"
            className="whitespace-nowrap flex items-center justify-center px-24 py-12 
              border border-primary text-primary rounded-[24px] 
              font-montserrat text-p2 font-medium
              hover:bg-primary hover:text-white 
              transition-all duration-200"
          >
            <ArrowRight className="w-16 h-16 mr-8" />
            Continue to booking
          </Button>
        </div>
      </div>

      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed bottom-24 right-24 
          ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}
          text-white px-24 py-12 
          rounded-[24px] shadow-lg 
          font-montserrat text-p2 
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