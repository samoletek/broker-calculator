import React from 'react';
import { format } from 'date-fns';

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function DatePickerComponent({ date, onDateChange }: DatePickerProps) {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);
  
  return (
    <input
      type="date"
      className="w-full p-2 border rounded text-gray-900"
      value={date ? format(date, 'yyyy-MM-dd') : ''}
      min={format(today, 'yyyy-MM-dd')}
      max={format(maxDate, 'yyyy-MM-dd')}
      onChange={(e) => {
        const newDate = e.target.value ? new Date(e.target.value) : undefined;
        onDateChange(newDate);
      }}
    />
  );
}