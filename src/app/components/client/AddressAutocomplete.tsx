'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getDebouncedAddressSuggestions } from '@/app/lib/utils/client/addressAutocomplete';

interface AddressSuggestion {
  formatted_address: string;
  place_id: string;
  types: string[];
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onClear,
  placeholder,
  className,
  error,
  disabled
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Обработка изменения input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Если строка короткая, скрываем подсказки
    if (newValue.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // Создаем новый AbortController
    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    // Запрашиваем подсказки с debounce
    getDebouncedAddressSuggestions(
      newValue,
      (results) => {
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setIsLoading(false);
      },
      abortControllerRef.current.signal
    );
  };

  // Выбор подсказки
  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.formatted_address);
    setSuggestions([]);
    setIsOpen(false);
    setIsLoading(false);
    if (onClear) onClear(); // Очищаем результаты расчета
  };

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${className} ${error ? 'border-red-500' : 'border-gray-300'}`}
        onFocus={() => {
          if (suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
      />
      
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      {/* Dropdown с подсказками */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading && (
            <div className="px-4 py-2 text-gray-500 text-sm">
              Searching addresses...
            </div>
          )}
          
          {!isLoading && suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id || index}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="text-sm font-medium text-gray-900">
                {suggestion.formatted_address}
              </div>
              <div className="text-xs text-gray-500">
                {suggestion.types.includes('street_address') && '📍 '}
                {suggestion.types.includes('locality') && '🏘️ '}
                {suggestion.types.includes('administrative_area_level_1') && '🗺️ '}
                Address
              </div>
            </div>
          ))}
          
          {!isLoading && suggestions.length === 0 && value.length >= 2 && (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No addresses found
            </div>
          )}
        </div>
      )}
    </div>
  );
}