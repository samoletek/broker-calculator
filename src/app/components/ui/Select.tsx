'use client';

import React, { useEffect, useState } from 'react';
import type { Props as SelectProps } from 'react-select';

// Полные стили для React-Select
const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    marginTop: '0.5rem',
    borderRadius: '24px',
    backgroundColor: 'rgb(249 250 251)',
    borderColor: state.isFocused ? 'var(--primary)' : '#D1D5DB',
    boxShadow: state.isFocused ? '0 0 0 1px var(--primary)' : 'none',
    '&:hover': {
      borderColor: 'var(--primary)'
    },
    minHeight: '42px',
    height: '42px',
    padding: '0 12px'
  }),
  option: (base: any, { isSelected, isFocused }: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: isSelected ? 'var(--primary)' : isFocused ? '#E5E7EB' : 'white',
    color: isSelected ? 'white' : 'black',
    ':active': {
      backgroundColor: 'var(--primary)',
      color: 'white'
    },
    padding: '8px 16px',
  }),
  menu: (base: any) => ({
    ...base,
    margin: '4px 0',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid #D1D5DB',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999999
  }),
  indicatorSeparator: () => ({
    display: 'none'
  }),
  menuList: (base: any) => ({
    ...base,
    padding: 0,
    borderRadius: 0,
    '::-webkit-scrollbar': {
      display: 'none'
    },
    scrollbarWidth: 'none'
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#1f2937'
  }),
  placeholder: (base: any) => ({
    ...base,
    color: '#6B7280'
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '2px 8px',
  }),
  container: (base: any) => ({
    ...base,
    zIndex: 100,
    position: 'relative'
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '0 8px'
  }),
  input: (base: any) => ({
    ...base,
    margin: 0,
    padding: 0
  })
};

// Исправляем типизацию компонента-заглушки
function SelectPlaceholder({ 
  label, 
  value, 
  placeholder 
}: { 
  label?: string, 
  value?: any, 
  placeholder?: React.ReactNode  // Изменено на ReactNode вместо string
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-p2 font-montserrat font-medium mb-8">
          {label}
        </label>
      )}
      <div className="mt-2 h-[42px] bg-gray-50 border border-gray-300 rounded-[24px] px-4 flex items-center text-gray-900">
        {/* Преобразуем placeholder в строку, если он не строка */}
        {value?.label || (placeholder && typeof placeholder === 'string' 
          ? placeholder 
          : 'Select...')}
      </div>
    </div>
  );
}

interface CustomSelectProps extends SelectProps {
  label?: string;
  error?: string;
}

export default function Select({ label, error, value, placeholder, ...props }: CustomSelectProps) {
  const [ReactSelect, setReactSelect] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Немедленно устанавливаем флаг монтирования
    setMounted(true);
    
    // Загружаем React Select асинхронно, но без задержки рендера
    import('react-select').then(module => {
      setReactSelect(() => module.default);
    });
    
    // Предзагрузка стилей для более плавного перехода
    const style = document.createElement('style');
    style.textContent = `
      .react-select__control {
        border-radius: 24px !important;
        background-color: rgb(249 250 251) !important;
        border-color: #D1D5DB !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  
  // Обработчик клика для предотвращения всплытия событий
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Если модуль еще не загружен, показываем заглушку
  if (!ReactSelect) {
    return <SelectPlaceholder label={label} value={value} placeholder={placeholder} />;
  }
  
  return (
    <div className="w-full" onClick={handleContainerClick}>
      {label && (
        <label className="block text-p2 font-montserrat font-medium mb-8">
          {label}
        </label>
      )}
      <ReactSelect
        {...props}
        value={value}
        placeholder={placeholder}
        styles={selectStyles}
        classNamePrefix="react-select"
        menuPortalTarget={mounted ? document.body : undefined}
        menuPosition="fixed"
        components={{
          ...props.components,
        }}
        // Обеспечиваем правильную работу с темой
        theme={(theme: any) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: 'var(--primary)',
            primary75: 'var(--primary-hover)',
            primary50: 'rgba(19, 86, 190, 0.5)',
            primary25: 'rgba(19, 86, 190, 0.2)',
          }
        })}
      />
      {error && (
        <p className="mt-8 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}