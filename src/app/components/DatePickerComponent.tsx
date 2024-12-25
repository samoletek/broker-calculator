import React, { useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function DatePickerComponent({ date, onDateChange }: DatePickerProps) {
  const [isExtendedDate, setIsExtendedDate] = useState(false);
  const today = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1); // Разрешаем выбор до года вперед
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined;
    if (newDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Сбрасываем время
      
      if (newDate < now) {
        // Если дата в прошлом, используем текущую дату
        onDateChange(now);
      } else {
        onDateChange(newDate);
      }
    } else {
      onDateChange(undefined);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="date"
        className="w-full p-2 border rounded text-gray-900"
        value={date ? format(date, 'yyyy-MM-dd') : ''}
        min={format(today, 'yyyy-MM-dd')}
        max={format(maxDate, 'yyyy-MM-dd')}
        onChange={handleDateChange}
      />
      
      {isExtendedDate && (
        <div className="flex items-center text-amber-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span>
            Price estimate for dates beyond 30 days may vary due to weather conditions
            and market changes.
          </span>
        </div>
      )}
    </div>
  );
}