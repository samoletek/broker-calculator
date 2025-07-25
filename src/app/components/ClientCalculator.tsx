'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle } from 'lucide-react';
import Select from '@/app/components/ui/Select';
import { DatePicker } from '@/app/components/client/DatePicker';
import AddressAutocomplete from '@/app/components/client/AddressAutocomplete';
import { PriceBreakdown }  from '@/app/components/server/PriceBreakdown';
import PriceSummary from '@/app/components/server/PriceSummary';
import RouteInfo from '@/app/components/server/RouteInfo';
import {
  getTransportTypes,
  getVehicleValueTypes,
  VEHICLE_TYPES,
  getAdditionalServices,
  getPaymentMethods, 
  getBaseRate
} from '@/constants/pricing';
import { validateName, validateEmail, validatePhoneNumber } from '@/app/lib/utils/client/validation';
import { usePricing } from '@/app/lib/hooks/usePricing';
import { validateAddress, isSameLocation } from '@/app/lib/utils/client/mapsAPI';
import { calculateEstimatedTransitTime } from '@/app/lib/utils/client/transportUtils';
import { calculateCompleteRoute } from '@/app/lib/utils/client/enhancedMapsAPI';
import type { SelectOption } from '@/app/types/common.types';
import type { DirectionsResult } from '@/app/types/maps.types';
import { submitCalculationLead, prepareCalculatorDataForLead } from '@/app/lib/utils/client/leadSubmissionUtils';
import { LEAD_ACTION_CODES } from '@/app/lib/utils/client/awsLeadMapper';
import { PricingConfig } from '@/types/pricing-config.types';

const GoogleMap = dynamic(() => import('@/app/components/client/GoogleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-[698px] h-[422px] rounded-[24px] bg-gray-100 animate-pulse flex items-center justify-center">
      <Loader2 className="w-32 h-32 text-gray-400 animate-spin" />
    </div>
  )
});

const WeatherConditions = dynamic(() => import('@/app/components/client/WeatherConditions'), {
  ssr: false,
  loading: () => (
    <div className="w-[478px] h-[422px] rounded-[24px] bg-gray-100 animate-pulse" />
  )
});

interface ClientCalculatorProps {
  config: PricingConfig;
}

export default function ClientCalculator({ config }: ClientCalculatorProps) {
  // Получаем динамические константы на основе конфигурации
  const TRANSPORT_TYPES = getTransportTypes(config);
  const VEHICLE_VALUE_TYPES = getVehicleValueTypes(config);
  const ADDITIONAL_SERVICES = getAdditionalServices(config);
  const PAYMENT_METHODS = getPaymentMethods(config);

  // State management
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [transportType, setTransportType] = useState<keyof typeof TRANSPORT_TYPES | ''>('');
  const [vehicleValue, setVehicleValue] = useState<keyof typeof VEHICLE_VALUE_TYPES | ''>('');
  const [vehicleType, setVehicleType] = useState<keyof typeof VEHICLE_TYPES | ''>('');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [countryCode] = useState<string>('US');

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: '',
    pickup: '',
    delivery: '',
    transportType: '',
    vehicleType: '',
    vehicleValue: '',
    selectedDate: '',
    general: ''
  });

  const [premiumEnhancements, setPremiumEnhancements] = useState(false);
  const [specialLoad, setSpecialLoad] = useState(false);
  const [inoperable, setInoperable] = useState(false);
  const [supplementaryInsurance, setSupplementaryInsurance] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof PAYMENT_METHODS | ''>('');

  const [mapData, setMapData] = useState<DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState({
    isPopularRoute: false,
    isRemoteArea: false,
    trafficConditions: {
      status: 'light' as 'light' | 'moderate' | 'heavy',
      delay: 0
    },
    estimatedTime: ''
  });

  // Hooks
  const { priceComponents, setPriceComponents, updatePriceComponents } = usePricing();
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  
// Автозаполнение отключено - используем server-side API
// В будущем можно добавить debounced поиск через /api/maps/geocode

  useEffect(() => {
    const isExpensiveVehicle = vehicleValue === 'under500k' || vehicleValue === 'over500k';
    if (isExpensiveVehicle) {
      setPremiumEnhancements(true);
    }
  }, [vehicleValue]);

  // Utility functions
  const clearResults = useCallback(() => {
    setDistance(null);
    setPriceComponents(null);
    setMapData(null);
    setRouteInfo({
      isPopularRoute: false,
      isRemoteArea: false,
      trafficConditions: {
        status: 'light',
        delay: 0
      },
      estimatedTime: ''
    });
  
    // Очистка ошибок
    setErrors({
      name: '',
      phone: '',
      email: '',
      pickup: '',
      delivery: '',
      transportType: '',
      vehicleType: '',
      vehicleValue: '',
      selectedDate: '',
      general: ''
    });
  }, [setPriceComponents]);

  // Validations
  const validateFields = () => {
    let newErrors: Record<string, string> = {};
    let isValid = true;
  
    if (!name.trim() || name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      isValid = false;
    }
  
    // Проверка телефона с libphonenumber-js
    if (typeof phone !== 'string' || phone.trim() === '') {
      newErrors.phone = 'Enter a valid phone number';
      isValid = false;
    } else {
      const validation = validatePhoneNumber(phone, countryCode);
      if (!validation.isValid) {
        newErrors.phone = validation.error || 'Enter a valid phone number';
        isValid = false;
      } else if (validation.formatted) {
        setPhone(validation.formatted);
      }
    }
  
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
      isValid = false;
    }
  
    if (!pickup.trim()) {
      newErrors.pickup = 'Please enter a pickup location';
      isValid = false;
    }
  
    if (!delivery.trim()) {
      newErrors.delivery = 'Please enter a delivery location';
      isValid = false;
    }
  
    if (!transportType) {
      newErrors.transportType = 'Please select a transport type';
      isValid = false;
    }
  
    if (!vehicleType) {
      newErrors.vehicleType = 'Please select a vehicle type';
      isValid = false;
    }
  
    if (!vehicleValue) {
      newErrors.vehicleValue = 'Please select a vehicle value';
      isValid = false;
    }
  
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };
  
const calculatePrice = async () => {
    if (!validateFields()) return;
    if (typeof window === 'undefined') return;
    
    if (!selectedDate) {
      setErrors((prev) => ({ ...prev, selectedDate: 'Please select a shipping date' }));
      return;
    }
  
    setLoading(true);
    setErrors(prev => ({ ...prev, pickup: '', delivery: '', general: '' }));
  
    try {
      // Проверяем адреса
      const [pickupValidation, deliveryValidation] = await Promise.all([
        validateAddress(pickup),
        validateAddress(delivery)
      ]);
  
      // Проверяем ошибки API лимитов
      if (pickupValidation.error?.includes('API limit') || deliveryValidation.error?.includes('API limit')) {
        setErrors(prev => ({
          ...prev,
          general: 'API limit reached. Try again later.'
        }));
        setLoading(false);
        return;
      }
      
      // Обрабатываем ошибки адресов
      if (!pickupValidation.isValid || !deliveryValidation.isValid) {
        setErrors(prev => ({
          ...prev,
          pickup: pickupValidation.error || '',
          delivery: deliveryValidation.error || ''
        }));
  
        if (pickupValidation.formattedAddress && !pickupValidation.hasZip) {
          setPickup(pickupValidation.formattedAddress);
        }
        if (deliveryValidation.formattedAddress && !deliveryValidation.hasZip) {
          setDelivery(deliveryValidation.formattedAddress);
        }
  
        setLoading(false);
        return;
      }
  
      // Проверяем, не одинаковые ли адреса
      const isSame = await isSameLocation(pickup, delivery);
      if (isSame) {
        setErrors(prev => ({
          ...prev,
          pickup: 'Pickup and delivery locations must be different',
          delivery: 'Pickup and delivery locations must be different'
        }));
        setLoading(false);
        return;
      }
  
      // Обновляем адреса форматированными версиями
      setPickup(pickupValidation.formattedAddress!);
      setDelivery(deliveryValidation.formattedAddress!);
  
      // Используем комплексный расчет маршрута через enterprise API
      try {
        const routeResult = await calculateCompleteRoute(
          pickupValidation.formattedAddress!,
          deliveryValidation.formattedAddress!
        );

        if (!routeResult.success) {
          throw new Error(routeResult.error || 'Route calculation failed');
        }
    
        setMapData({ routes: [routeResult.route!] });
        const distanceInMiles = routeResult.distance!;
        setDistance(Math.round(distanceInMiles));
    
        setRouteInfo((prev) => ({
          ...prev,
          estimatedTime: calculateEstimatedTransitTime(distanceInMiles, config)
        }));
    
        // Определяем базовую цену
        const basePrice = distanceInMiles <= config.validation.shortDistanceLimit ? 
          config.validation.minPriceThreshold : 
          getBaseRate(distanceInMiles, transportType, config);
    
        // Данные для разбивки базовой цены
        const basePriceBreakdown = {
          ratePerMile: distanceInMiles <= config.validation.shortDistanceLimit ? 0 : TRANSPORT_TYPES[transportType].baseRatePerMile.max,
          distance: distanceInMiles,
          total: basePrice
        };
    
        // Получаем множители (все через enterprise API)
        const vehicleMultiplier = VEHICLE_VALUE_TYPES[vehicleValue].multiplier;
        const fuelPriceMultiplier = routeResult.fuelMultiplier || 1.0;
        const weatherMultiplier = 1.0; // Можно добавить weather API позже
        const trafficMultiplier = 1.0; // Можно добавить traffic API позже
    
        // Рассчитываем денежный impact для каждого фактора
        const vehicleImpact = basePrice * (vehicleMultiplier - 1);
        const weatherImpact = basePrice * (weatherMultiplier - 1);
        const trafficImpact = basePrice * (trafficMultiplier - 1);
        const fuelImpact = basePrice * (fuelPriceMultiplier - 1);
    
        // Суммируем все основные impact-ы (БЕЗ комиссии за карту)
        const totalImpact = 
          vehicleImpact + 
          weatherImpact + 
          trafficImpact + 
          fuelImpact;
    
        const additionalServices = {
          premium: premiumEnhancements ? 0.3 : 0,
          special: specialLoad ? 0.3 : 0,
          inoperable: inoperable ? 0.3 : 0,
          supplementaryInsurance: 0,
          hasManagerDefined: supplementaryInsurance
        };
        
        const additionalServicesSum = 
          (additionalServices.premium + 
          additionalServices.special + 
          additionalServices.inoperable);
    
        const additionalServicesImpact = basePrice * additionalServicesSum;
    
        // Используем результаты toll calculation из enterprise API
        const tollCosts = {
          segments: routeResult.tollCosts?.segments || [],
          total: routeResult.tollCosts?.totalCost || 0
        };
        
        // Рассчитываем промежуточную сумму без комиссии за карту
        const subtotalPrice = basePrice + totalImpact + additionalServicesImpact + tollCosts.total;
  
        // Добавляем комиссию за кредитную карту если выбран этот метод оплаты
        const cardFee = paymentMethod === 'CREDIT_CARD' 
        ? subtotalPrice * PAYMENT_METHODS.CREDIT_CARD.fee 
        : 0;
    
        const finalPrice = subtotalPrice + cardFee;

        // Устанавливаем компоненты цены
        setPriceComponents({
          selectedDate,
          basePrice,
          basePriceBreakdown,
          mainMultipliers: {
            // Множители для процентов
            vehicleMultiplier,
            weatherMultiplier,
            trafficMultiplier,
            fuelMultiplier: fuelPriceMultiplier,
            // Импакты в долларах
            vehicleImpact,
            weatherImpact,
            trafficImpact,
            fuelImpact,
            cardFee,
            totalImpact
          },
          additionalServices: {
            ...additionalServices,
            totalAdditional: additionalServicesSum
          },
          tollCosts,
          finalPrice: finalPrice
        });
        
        // Отправка лида после калькуляции
        if (finalPrice > 0) {
          try {
            const leadData = prepareCalculatorDataForLead({
              name,
              email,
              phone,
              pickup: pickupValidation.formattedAddress!,
              delivery: deliveryValidation.formattedAddress!,
              selectedDate,
              transportType,
              vehicleType,
              vehicleValue,
              premiumEnhancements,
              specialLoad,
              inoperable,
              supplementaryInsurance,
              paymentMethod,
              finalPrice,
              distance: distanceInMiles,
              action: LEAD_ACTION_CODES.CALCULATE_BUTTON
            });
            
            // Submit asynchronously without blocking UI
            submitCalculationLead(leadData)
              .then(result => {
                if (result.success) {
                  console.log('Lead submitted successfully:', result);
                  
                  // Optionally show a subtle notification
                  if (!result.cached) {
                    console.log('New lead created with hash:', result.calculationHash);
                  }
                } else {
                  console.warn('Lead submission failed:', result.message);
                  // affect the calculator experience
                }
              })
              .catch(error => {
                console.error('Lead submission error:', error);
                // Silent failure - don't interrupt user experience
              });
              
          } catch (error) {
            console.error('Error preparing lead data:', error);
            // Continue normally even if lead submission fails
          }
        }
        
      } catch (error) {
        // Проверяем, не связана ли ошибка с API лимитом
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('API limit')) {
          setErrors((prev) => ({ 
            ...prev, 
            general: 'API limit reached. Try again later.' 
          }));
        } else {
          setErrors((prev) => ({ 
            ...prev, 
            general: 'Error calculating route. Please check the addresses and try again.' 
          }));
        }
      }
    } catch (err) {
      console.error('Calculation error:', err);
      
      // Проверяем, не связана ли ошибка с API лимитом
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMessage.includes('API limit')) {
        setErrors((prev) => ({ 
          ...prev, 
          general: 'API limit reached. Try again later.' 
        }));
      } else {
        setErrors((prev) => ({ 
          ...prev, 
          general: 'Error calculating route. Please check the addresses and try again.' 
        }));
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 md:p-24">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-24">
        <div className="bg-white rounded-[32px] p-4 sm:p-8 md:p-24 border border-primary/10">
  
          <div className="space-y-12 sm:space-y-24">
            {/* Первая линия: Дата + Pickup + Delivery */}
            <div className="grid grid-cols-12 gap-8 sm:gap-24">
              {/* Дата */}
              <div className="col-span-12 sm:col-span-3">
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Shipping Date
                </label>
                <DatePicker 
                  date={selectedDate} 
                  onDateChange={(date) => {
                    setSelectedDate(date);
                    setErrors(prev => ({ ...prev, selectedDate: '' }));
                    clearResults();
                  }}
                />
              </div>
              
              {/* Pickup адрес */}
              <div className="col-span-12 sm:col-span-4 lg:col-span-4 md:col-span-4">
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Pickup Location
                </label>
                <AddressAutocomplete
                  value={pickup}
                  onChange={(value) => {
                    setPickup(value);
                    setErrors((prev) => ({ ...prev, pickup: '' }));
                    clearResults();
                  }}
                  onClear={clearResults}
                  placeholder="Enter pickup address"
                  className="mt-8 block w-full rounded-[24px] bg-gray-50 border text-gray-900 placeholder-gray-500 
                    focus:ring-primary focus:border-primary font-montserrat text-p2"
                  error={errors.pickup}
                />
              </div>
  
              {/* Delivery адрес */}
              <div className="col-span-12 sm:col-span-5 lg:col-span-5 md:col-span-5">
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Delivery Location
                </label>
                <AddressAutocomplete
                  value={delivery}
                  onChange={(value) => {
                    setDelivery(value);
                    setErrors((prev) => ({ ...prev, delivery: '' }));
                    clearResults();
                  }}
                  onClear={clearResults}
                  placeholder="Enter delivery address"
                  className="mt-8 block w-full rounded-[24px] bg-gray-50 border text-gray-900 placeholder-gray-500 
                    focus:ring-primary focus:border-primary font-montserrat text-p2"
                  error={errors.delivery}
                />
              </div>
            </div>
  
            {/* Вторая линия: Transport Type + Vehicle Type + Vehicle Value + Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-24">
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Transport Type
                </label>
                <Select
                  options={Object.entries(TRANSPORT_TYPES).map(([type, data]): SelectOption => ({
                    value: type,
                    label: data.name
                  }))}
                  placeholder="Select transport type"
                  value={transportType 
                    ? { value: transportType, label: TRANSPORT_TYPES[transportType].name } 
                    : null}
                  onChange={(option) => {
                    const value = (option as SelectOption)?.value;
                    if (value) {
                      setTransportType(value as keyof typeof TRANSPORT_TYPES);
                      clearResults();
                    }
                  }}
                  isSearchable={false}
                />
                {errors.transportType && <p className="text-red-500 text-sm mt-2">{errors.transportType}</p>}
              </div>
  
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Vehicle Type
                </label>
                <Select
                  options={Object.entries(VEHICLE_TYPES).map(([type, data]): SelectOption => ({
                    value: type,
                    label: data.name,
                    description: data.description
                  }))}
                  placeholder="Select vehicle type"
                  value={vehicleType 
                    ? { value: vehicleType, label: VEHICLE_TYPES[vehicleType].name } 
                    : null}
                  onChange={(option) => {
                    const value = (option as SelectOption)?.value;
                    setVehicleType((value as keyof typeof VEHICLE_TYPES) || '');
                    clearResults();
                  }}
                  isSearchable={false}
                />
                {errors.vehicleType && <p className="text-red-500 text-sm mt-2">{errors.vehicleType}</p>}
              </div>
  
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Vehicle Value
                </label>
                <Select
                  options={Object.entries(VEHICLE_VALUE_TYPES).map(([type, data]): SelectOption => ({
                    value: type,
                    label: data.name
                  }))}
                  placeholder="Select vehicle value"
                  value={vehicleValue 
                    ? { value: vehicleValue, label: VEHICLE_VALUE_TYPES[vehicleValue].name } 
                    : null}
                  onChange={(option) => {
                    const value = (option as SelectOption)?.value;
                    setVehicleValue((value as keyof typeof VEHICLE_VALUE_TYPES) || '');
                    clearResults();
                  }}
                  isSearchable={false}
                />
                {errors.vehicleValue && <p className="text-red-500 text-sm mt-2">{errors.vehicleValue}</p>}
              </div>
  
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Payment Method
                </label>
                <Select
                  options={Object.entries(PAYMENT_METHODS).map(([type, data]): SelectOption => ({
                    value: type,
                    label: data.name
                  }))}
                  placeholder="Select payment method"
                  value={paymentMethod 
                    ? { value: paymentMethod, label: PAYMENT_METHODS[paymentMethod].name } 
                    : null}
                  onChange={(option) => {
                    const value = (option as SelectOption)?.value;
                    setPaymentMethod((value as keyof typeof PAYMENT_METHODS) || '');
                    clearResults();
                  }}
                  isSearchable={false}
                />
              </div>
            </div>
  
            {/* Третья линия: Дополнительные услуги */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-24">
              {['premiumEnhancements', 'supplementaryInsurance', 'inoperable', 'specialLoad']
                .filter(key => key in ADDITIONAL_SERVICES)
                .map((key) => {
                  const service = ADDITIONAL_SERVICES[key];
                  return (
                    <div key={key} className="flex items-center space-x-8 sm:space-x-12">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id={key}
                          checked={key === 'premiumEnhancements' ? premiumEnhancements : 
                                  key === 'specialLoad' ? specialLoad : 
                                  key === 'inoperable' ? inoperable :
                                  key === 'supplementaryInsurance' ? supplementaryInsurance : false}
                          disabled={key === 'premiumEnhancements' && (vehicleValue === 'under500k' || vehicleValue === 'over500k')}
                          onChange={(e) => {
                            if (key === 'premiumEnhancements') {
                              setPremiumEnhancements(e.target.checked);
                              clearResults();
                            }
                            else if (key === 'specialLoad') {
                              setSpecialLoad(e.target.checked);
                              clearResults();
                            }
                            else if (key === 'inoperable') {
                              setInoperable(e.target.checked);
                              clearResults();
                            }
                            else if (key === 'supplementaryInsurance') {
                              setSupplementaryInsurance(e.target.checked);
                              clearResults();
                            }
                          }}
                          className={`appearance-none h-20 w-20 sm:h-24 sm:w-24 rounded
                            border-2 border-gray-200
                            checked:bg-primary checked:border-primary
                            relative cursor-pointer transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                            focus:ring-offset-0 focus:ring-0
                            ${key === 'premiumEnhancements' && (vehicleValue === 'under500k' || vehicleValue === 'over500k') 
                              ? 'opacity-50 cursor-not-allowed' 
                              : ''}`}
                        />
                          <svg 
                            className={`absolute left-0 top-0 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none text-white
                              ${key === 'premiumEnhancements' ? premiumEnhancements : 
                                key === 'specialLoad' ? specialLoad : 
                                key === 'inoperable' ? inoperable : 
                                key === 'supplementaryInsurance' ? supplementaryInsurance ? 'block' : 'hidden' : 'hidden'}`}
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                      </div>
                      <label className="text-sm sm:text-p2 font-montserrat relative" htmlFor={key}>
                        {service.name}
                        <span className="ml-4 sm:ml-8 inline-block cursor-help group">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.5} 
                            stroke="currentColor" 
                            className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" 
                            />
                          </svg>
                          <div className="invisible group-hover:visible absolute z-50 w-[280px] p-4 sm:p-16
                            bg-white border border-gray-200 rounded-[24px] shadow-lg
                            left-1/2 -translate-x-1/2 
                            bottom-full mb-2">
                            <div className="text-sm font-montserrat font-semibold text-gray-900 mb-8">
                              {key === 'premiumEnhancements' ? 'Premium Service Benefits:' : 
                              key === 'specialLoad' ? 'Special Load Services:' : 
                              key === 'inoperable' ? 'Inoperable Vehicle Services:' :
                              'Supplementary Insurance Services:'}
                            </div>
                            <ul className="space-y-2">
                              {service.tooltip?.map((tip, index) => (
                                <li key={index} className="flex text-xs font-montserrat text-gray-700 leading-tight">
                                  <span className="mr-4 text-sm">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </span>
                      </label>
                    </div>
                  );
                })}
            </div>
  
            {/* Четвертая линия: Контактная информация */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-24">
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[A-Za-zА-Яа-я\s'-]*$/.test(value)) {
                      setName(value);
                      const validation = validateName(value);
                      setErrors(prev => ({ ...prev, name: validation.error || '' }));
                    }
                  }}
                  className={`mt-8 block w-full rounded-[24px] bg-gray-50 border 
                    text-gray-900 placeholder-gray-500 
                    focus:ring-primary focus:border-primary 
                    font-montserrat text-p2
                    ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-2">{errors.name}</p>
                )}
              </div>
  
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const validation = validatePhoneNumber(e.target.value, countryCode);
                    setPhone(e.target.value);
                    setErrors(prev => ({ 
                      ...prev, 
                      phone: validation.error || '' 
                    }));
                    if (validation.formatted) {
                      setPhone(validation.formatted);
                    }
                  }}
                  className={`mt-8 block w-full rounded-[24px] bg-gray-50 border 
                    text-gray-900 placeholder-gray-500 
                    focus:ring-primary focus:border-primary 
                    font-montserrat text-p2
                    ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="(XXX) XXX-XXXX"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-2">{errors.phone}</p>
                )}
              </div>
  
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase();
                    setEmail(value);
                    const validation = validateEmail(value);
                    setErrors(prev => ({ ...prev, email: validation.error || '' }));
                  }}
                  className={`mt-8 block w-full rounded-[24px] bg-gray-50 border 
                    text-gray-900 placeholder-gray-500 
                    focus:ring-primary focus:border-primary 
                    font-montserrat text-p2
                    ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2">{errors.email}</p>
                )}
              </div>
            </div>
  
            {/* Показываем reCAPTCHA, если нужно */}
            <div className="flex flex-col sm:flex-row gap-4 mt-12 sm:mt-24">
            <button
              onClick={calculatePrice}
              disabled={loading}
              className="w-full sm:flex-1 bg-primary hover:bg-primary/90
                text-white py-8 sm:py-12 px-8 sm:px-16 rounded-[24px]
                disabled:bg-primary/50
                disabled:cursor-not-allowed
                transition-colors duration-200
                flex items-center justify-center
                font-montserrat text-sm sm:text-p2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 mr-4 sm:mr-8 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate Route and Price'
              )}
            </button>
  
              <button
                onClick={() => {
                  // Отправляем сообщение виксу для открытия поп-апа
                  window.parent.postMessage({ action: 'openPopup' }, '*');
                  // TODO: В будущем добавить отправку лида с action: LEAD_ACTION_CODES.REQUEST_CALL
                }}
                className="w-full sm:w-1/3 bg-white border border-primary
                  text-primary py-8 sm:py-12 px-8 sm:px-16 rounded-[24px]
                  hover:bg-primary/10
                  transition-colors duration-200
                  flex items-center justify-center
                  font-montserrat text-sm sm:text-p2 font-medium"
              >
                or just Request a Call
              </button>
            </div>
  
            {errors.general && (
              <div className="mt-8 sm:mt-16 p-8 sm:p-16 bg-red-50 text-red-700 rounded-[24px] font-montserrat text-sm sm:text-p2 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}
          </div>
        </div>
  
        {distance && priceComponents && mapData && (
          <div className="space-y-12 sm:space-y-24 calculation-container">
            <PriceSummary 
              finalPrice={priceComponents.finalPrice}
              basePrice={priceComponents.basePrice}
              selectedDate={selectedDate}
              contactInfo={{
                name,
                phone,
                email
              }}
              pickup={pickup}
              delivery={delivery}
              transportType={transportType}
              vehicleType={vehicleType}
              vehicleValue={vehicleValue}
              paymentMethod={paymentMethod}
              additionalServices={{
                premiumEnhancements,
                specialLoad,
                inoperable,
                supplementaryInsurance
              }}
              distance={distance}
              estimatedTime={routeInfo.estimatedTime}
              onSavePrice={() => {
                console.log('Price calculation saved');
              }}
            />
  
            <div className="flex flex-col lg:flex-row gap-8 sm:gap-24">
              <div className="w-full lg:w-[698px]">
                <GoogleMap ref={mapRef} mapData={mapData} />
              </div>
              {mapData && (
                <div className="w-full lg:w-[478px]">
                  <WeatherConditions
                    routePoints={{
                      pickup: {
                        lat: mapData.routes[0].legs[0].start_location.lat,
                        lng: mapData.routes[0].legs[0].start_location.lng
                      },
                      delivery: {
                        lat: mapData.routes[0].legs[0].end_location.lat,
                        lng: mapData.routes[0].legs[0].end_location.lng
                      },
                      waypoints: []
                    }}
                    selectedDate={selectedDate}
                    config={config}
                    onWeatherUpdate={(weatherMultiplier) => {
                      if (priceComponents) {
                        setPriceComponents((prev) => {
                          if (!prev) return null;
                          return updatePriceComponents(prev, {
                            mainMultipliers: {
                              ...prev.mainMultipliers,
                              weatherMultiplier: weatherMultiplier
                            }
                          });
                        });
                      }
                    }}
                  />
                </div>
              )}
            </div>
  
            <div className="space-y-12 sm:space-y-24">
              <div className="w-full">
                <RouteInfo 
                  pickup={pickup}
                  delivery={delivery}
                  distance={distance}
                  finalPrice={priceComponents.finalPrice}
                  estimatedTime={routeInfo.estimatedTime}
                  isPopularRoute={routeInfo.isPopularRoute}
                  isRemoteArea={routeInfo.isRemoteArea}
                  trafficConditions={routeInfo.trafficConditions}
                  mapData={mapData}
                  selectedDate={selectedDate}
                  tollCosts={priceComponents.tollCosts}
                  config={config}
                  onTollUpdate={(tollCost: number, segments?: Array<{ location: string, cost: number }>) => {
                    if (priceComponents) {
                      setPriceComponents((prev) => {
                        if (!prev) return null;
                        return updatePriceComponents(prev, {
                          tollCosts: {
                            segments: segments || [],
                            total: tollCost
                          }
                        });
                      });
                    }
                  }}
                />
              </div>
              <div className="w-full">
                <PriceBreakdown
                  distance={distance}
                  basePrice={priceComponents.basePrice}
                  basePriceBreakdown={priceComponents.basePriceBreakdown}
                  mainMultipliers={priceComponents.mainMultipliers}
                  additionalServices={priceComponents.additionalServices}
                  tollCosts={priceComponents.tollCosts}
                  finalPrice={priceComponents.finalPrice}
                  routeInfo={{
                    isPopularRoute: routeInfo.isPopularRoute,
                    isRemoteArea: routeInfo.isRemoteArea
                  }}
                  selectedDate={selectedDate}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}