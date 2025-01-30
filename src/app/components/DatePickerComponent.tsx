import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function DatePickerComponent({ date, onDateChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showWarning, setShowWarning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  // Закрытие календаря при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Проверка даты при изменении
  useEffect(() => {
    if (selectedDate) {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      setShowWarning(selectedDate > oneMonthFromNow);
    }
  }, [selectedDate]);

  // Генерация дней для календаря
  const generateCalendarDays = () => {
    const days = [];
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Добавляем пустые места перед первым днем месяца
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
      days.push(null);
    }

    // Добавляем дни месяца
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      days.push(currentDate);
    }

    return days;
  };

  const handleApply = () => {
    onDateChange(selectedDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedDate(date);
    setIsOpen(false);
  };

  const handleDateSelect = (newDate: Date | null) => {
    if (!newDate) return;

    // Проверяем, что дата не раньше сегодня и не позже максимальной даты
    if (
      newDate >= today && 
      newDate <= maxDate
    ) {
      setSelectedDate(newDate);
    }
  };

  return (
    <div className="relative w-full">
      <div 
        className="relative w-full cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : ''}
          placeholder="Select shipping date"
          className="mt-8 block w-full rounded-[24px]
            bg-gray-50
            border-gray-300
            text-gray-900
            placeholder-gray-500
            focus:ring-primary focus:border-primary
            font-montserrat text-p2
            cursor-pointer"
        />
        <Calendar 
          className="absolute right-12 top-1/2 -translate-y-1/2 
            w-16 h-16 text-gray-500" 
        />
      </div>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 mt-8 w-full bg-white 
            rounded-[24px] shadow-lg border border-gray-200 
            font-montserrat text-p2 overflow-hidden"
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-12 border-b">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="hover:bg-gray-100 rounded-full p-4"
            >
              <ChevronLeft className="w-16 h-16" />
            </button>
            <div className="font-bold text-sm">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="hover:bg-gray-100 rounded-full p-4"
            >
              <ChevronRight className="w-16 h-16" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 px-16 pt-4">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-600 py-1">
                {day}
              </div>
            ))}
            {generateCalendarDays().map((day, index) => (
              <button
                key={index}
                disabled={!day}
                onClick={() => handleDateSelect(day)}
                className={`aspect-square rounded-full text-center flex items-center justify-center
                  ${!day ? 'bg-transparent' : ''}
                  ${day && day.toDateString() === today.toDateString() ? 'bg-primary text-white' : ''}
                  ${day && selectedDate && day.toDateString() === selectedDate.toDateString() ? 'bg-primary/20' : ''}
                  ${day && day < today ? 'text-gray-300 cursor-not-allowed' : ''}
                  ${day && day > maxDate ? 'text-gray-300 cursor-not-allowed' : ''}
                  hover:bg-primary/10 transition-colors`}
              >
                {day ? day.getDate() : ''}
              </button>
            ))}
          </div>
          <div className="h-4"></div>

          {/* Actions */}
          <div className="flex justify-center gap-8 p-16 border-t">
            <button
              onClick={handleCancel}
              className="flex items-center gap-8 
                px-12 py-8 
                text-gray-600 
                hover:bg-gray-100 
                rounded-[24px] 
                transition-colors"
            >
              <X className="w-16 h-16" />
              Close
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-8 
                px-12 py-8 
                bg-primary
                text-white 
                rounded-[24px] 
                hover:bg-primary/90 
                transition-colors"
            >
              <Check className="w-16 h-16" />
              Apply
            </button>
          </div>
      
          {showWarning && (
            <div className="px-16 pb-8 text-xs text-amber-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Price estimate for dates beyond 30 days may vary.
            </div>
          )}
        </div>
      )}
    </div>
  );
}