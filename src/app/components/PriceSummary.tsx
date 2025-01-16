import React, { useState } from 'react';
import { DollarSign, Save, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface SavedToast {
  show: boolean;
  message: string;
}

interface PriceSummaryProps {
  finalPrice: number;
  basePrice: number;
  selectedDate?: Date;
  onSavePrice?: () => void;
}

const PriceSummary = ({ finalPrice, basePrice, selectedDate, onSavePrice }: PriceSummaryProps) => {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <DollarSign className="w-8 h-8 text-green-500 mr-2" />
            Final Price
          </h2>
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
            ${finalPrice.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Base Price: ${basePrice.toFixed(2)}
          </div>
          {selectedDate && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Shipping Date: {format(selectedDate, 'PPP')}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-4">
          <button
            onClick={handleSavePrice}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Price for Me
          </button>
          
          <button
            onClick={() => alert('Booking feature coming soon!')}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            Continue to Booking
            <span className="text-xs bg-white/20 px-2 py-1 rounded ml-2">
              Coming Soon
            </span>
          </button>
        </div>
      </div>

      {toast.show && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default PriceSummary;