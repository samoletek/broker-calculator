// PriceSummary.tsx
import React, { useState } from 'react';
import { DollarSign, Save, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface PriceSummaryProps {
  finalPrice: number;
  basePrice: number;
  selectedDate?: Date;
  onSavePrice?: () => void;
}

interface SavedToast {
  show: boolean;
  message: string;
}

export default function PriceSummary({ finalPrice, basePrice, selectedDate, onSavePrice }: PriceSummaryProps) {
  const [toast, setToast] = useState<SavedToast>({ show: false, message: '' });

  const handleSavePrice = () => {
    const savedCalculation = {
      finalPrice,
      basePrice,
      date: selectedDate?.toISOString(),
      savedAt: new Date().toISOString()
    };
    
    const savedCalculations = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    savedCalculations.push(savedCalculation);
    localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
    
    setToast({ show: true, message: 'Price calculation saved!' });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
    
    if (onSavePrice) {
      onSavePrice();
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        {/* Left side - Price block */}
        <div className="space-y-12">
          <h2 className="font-jost text-[32px] font-bold">Final Price</h2>
          <div className="text-[48px] font-jost font-bold text-[#1356BE]">
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
                  {format(selectedDate, 'MMMM dd\'th\', yyyy')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Buttons stacked vertically */}
        <div className="flex flex-col justify-center gap-12 self-center">
          <button
            onClick={handleSavePrice}
            className="whitespace-nowrap flex items-center justify-center px-24 py-12 
              bg-[#1356BE] text-white rounded-[24px] 
              font-montserrat text-p2 font-medium
              hover:bg-[#1356BE]/90 transition-colors duration-200"
          >
            <Save className="w-16 h-16 mr-8" />
            Save price for me!
          </button>
          
          <button
            onClick={() => alert('Booking feature coming soon!')}
            className="whitespace-nowrap flex items-center justify-center px-24 py-12 
              border border-[#1356BE] text-[#1356BE] rounded-[24px] 
              font-montserrat text-p2 font-medium
              hover:bg-[#1356BE] hover:text-white 
              transition-all duration-200"
          >
            <ArrowRight className="w-16 h-16 mr-8" />
            Continue to booking
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast.show && (
        <div className="fixed bottom-24 right-24 
          bg-green-500 text-white px-24 py-12 
          rounded-[24px] shadow-lg 
          font-montserrat text-p2 
          animate-fade-in-up"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}