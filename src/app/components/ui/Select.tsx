'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { Props as SelectProps } from 'react-select';

const ReactSelect = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => <div className="h-10 bg-gray-50 rounded-[24px] animate-pulse" />
});

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
    }
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
    zIndex: 9999
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
  })
};

interface CustomSelectProps extends SelectProps {
  label?: string;
  error?: string;
}

export default function Select({ label, error, ...props }: CustomSelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-p2 font-montserrat font-medium mb-8">
          {label}
        </label>
      )}
      <ReactSelect
        {...props}
        styles={selectStyles}
        classNamePrefix="react-select"
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      />
      {error && (
        <p className="mt-8 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}