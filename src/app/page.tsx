'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Truck, Loader2, AlertCircle } from 'lucide-react';
import Select from '@/app/components/ui/Select';
import { DatePicker } from '@/app/components/client/DatePicker';
import { PriceBreakdown }  from '@/app/components/server/PriceBreakdown';
import PriceSummary from '@/app/components/server/PriceSummary';
import RouteInfo from '@/app/components/server/RouteInfo';
import {
  TRANSPORT_TYPES,
  VEHICLE_VALUE_TYPES,
  VEHICLE_TYPES,
  ADDITIONAL_SERVICES,
  getBaseRate
} from '@/constants/pricing';
import { validateName, validateEmail, validatePhoneNumber } from '@/app/lib/utils/client/validation';
import { useGoogleMaps } from '@/app/lib/hooks/useGoogleMaps';
import { usePricing } from '@/app/lib/hooks/usePricing';
import { useRateLimiter } from '@/app/lib/hooks/useRateLimiter';
import { validateAddress, isSameLocation, formatAddress, calculateDistance } from '@/app/lib/utils/client/maps';
import { calculateTollCost, getRouteSegments } from '@/app/lib/utils/client/tollUtils';
import { checkAutoShows, getAutoShowMultiplier } from '@/app/lib/utils/client/autoShowsUtils';
import { calculateEstimatedTransitTime, getRoutePoints } from '@/app/lib/utils/client/transportUtils';
import { getFuelPriceMultiplier } from '@/app/lib/utils/client/fuelUtils';
import type { SelectOption } from '@/app/types/common.types';

// Динамический импорт компонентов
const SimpleCaptcha = dynamic(() => import('@/app/components/client/SimpleCaptcha'), {
  ssr: false,
});

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

export default function BrokerCalculator() {
  // State management
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const [mapData, setMapData] = useState<google.maps.DirectionsResult | null>(null);
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
  const googleMaps = useGoogleMaps();
  const { 
    showCaptcha, 
    generatedNumber,
    trackCalculationRequest, 
    trackApiRequest,
    trackAutocompleteRequest,
    verifyCaptcha 
  } = useRateLimiter();
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);

  const WIX_CALLBACK_FORM_URL = "https://your-wix-site.com/callback-form";
  
  // Effects
  useEffect(() => {
    const initAutocomplete = () => {
      if (!googleMaps || !pickupInputRef.current || !deliveryInputRef.current) return;
    
      // Проверяем доступность API перед созданием автоподсказок
      trackAutocompleteRequest();
      
      // Инициализация автоподсказки для точки отправления
      const pickupAutocomplete = new googleMaps.places.Autocomplete(pickupInputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'us' },
      });
      
      pickupAutocomplete.addListener('place_changed', () => {
        // При выборе места отслеживаем API использование
        trackApiRequest();
        
        const place = pickupAutocomplete.getPlace();
        setPickup(place.formatted_address || '');
        clearResults();
      });
      
      // Инициализация автоподсказки для точки доставки
      const deliveryAutocomplete = new googleMaps.places.Autocomplete(deliveryInputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'us' },
      });
      
      deliveryAutocomplete.addListener('place_changed', () => {
        trackApiRequest();
        const place = deliveryAutocomplete.getPlace();
        setDelivery(place.formatted_address || '');
        clearResults();
      });
    };
  
    initAutocomplete();
  }, [googleMaps, trackAutocompleteRequest, trackApiRequest]); 

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
    if (typeof window === 'undefined' || !googleMaps) return;
  
    // Проверяем лимит вычислений и капчу
    if (!trackCalculationRequest()) {
      return;
    }
    
    if (!selectedDate) {
      setErrors((prev) => ({ ...prev, selectedDate: 'Please select a shipping date' }));
      return;
    }
  
    setLoading(true);
    setErrors(prev => ({ ...prev, pickup: '', delivery: '', general: '' }));
  
    try {
      // Проверяем адреса
      const [pickupValidation, deliveryValidation] = await Promise.all([
        validateAddress(pickup, googleMaps),
        validateAddress(delivery, googleMaps)
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
      const isSame = await isSameLocation(pickup, delivery, googleMaps);
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
  
      const service = new googleMaps.DirectionsService();
      
      try {
        const response = await service.route({
          origin: pickupValidation.formattedAddress!,
          destination: deliveryValidation.formattedAddress!,
          travelMode: googleMaps.TravelMode.DRIVING
        });
    
        setMapData(response);
        const distanceInMiles = (response.routes[0].legs[0].distance?.value || 0) / 1609.34;
        setDistance(Math.round(distanceInMiles));
    
        setRouteInfo((prev) => ({
          ...prev,
          estimatedTime: calculateEstimatedTransitTime(distanceInMiles)
        }));
    
        // Проверяем наличие автошоу
        const pickupAutoShows = await checkAutoShows(
          { lat: response.routes[0].legs[0].start_location.lat(), lng: response.routes[0].legs[0].start_location.lng() },
          selectedDate,
          window.google
        );
    
        const deliveryAutoShows = await checkAutoShows(
          { lat: response.routes[0].legs[0].end_location.lat(), lng: response.routes[0].legs[0].end_location.lng() },
          selectedDate,
          window.google
        );
    
        // Определяем базовую цену
        const basePrice = distanceInMiles <= 300 ? 
          600 : 
          getBaseRate(distanceInMiles, transportType);
    
        // Данные для разбивки базовой цены
        const basePriceBreakdown = {
          ratePerMile: distanceInMiles <= 300 ? 0 : TRANSPORT_TYPES[transportType].baseRatePerMile.max,
          distance: distanceInMiles,
          total: basePrice
        };
    
        // Получаем множители
        const vehicleMultiplier = VEHICLE_VALUE_TYPES[vehicleValue].multiplier;
        const autoShowMultiplier = Math.max(
          getAutoShowMultiplier(pickupAutoShows, selectedDate),
          getAutoShowMultiplier(deliveryAutoShows, selectedDate)
        );
        const routePoints = getRoutePoints(response);
        const fuelPriceMultiplier = await getFuelPriceMultiplier(routePoints, window.google);
        const weatherMultiplier = 1.0;
        const trafficMultiplier = 1.0;
    
        // Рассчитываем денежный impact для каждого фактора
        const vehicleImpact = basePrice * (vehicleMultiplier - 1);
        const weatherImpact = basePrice * (weatherMultiplier - 1);
        const trafficImpact = basePrice * (trafficMultiplier - 1);
        const autoShowImpact = basePrice * (autoShowMultiplier - 1);
        const fuelImpact = basePrice * (fuelPriceMultiplier - 1);
    
        // Суммируем все impact-ы
        const totalImpact = 
          vehicleImpact + 
          weatherImpact + 
          trafficImpact + 
          autoShowImpact + 
          fuelImpact;
    
        // Дополнительные услуги
        const additionalServices = {
          premium: premiumEnhancements ? 0.3 : 0,
          special: specialLoad ? 0.3 : 0,
          inoperable: inoperable ? 0.3 : 0
        };
    
        const additionalServicesSum = 
          (additionalServices.premium + 
          additionalServices.special + 
          additionalServices.inoperable);
    
        const additionalServicesImpact = basePrice * additionalServicesSum;
    
        // Расчет платных дорог
        const totalTollCost = calculateTollCost(distanceInMiles, response.routes[0]);
        const tollSegments = getRouteSegments(response, totalTollCost);
        const tollCosts = {
          segments: tollSegments,
          total: totalTollCost
        };
    
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
            autoShowMultiplier,
            fuelMultiplier: fuelPriceMultiplier,
            // Импакты в долларах
            vehicleImpact,
            weatherImpact,
            trafficImpact,
            autoShowImpact,
            fuelImpact,
            totalImpact
          },
          additionalServices: {
            ...additionalServices,
            totalAdditional: additionalServicesSum
          },
          tollCosts,
          finalPrice: basePrice + totalImpact + additionalServicesImpact + tollCosts.total
        });
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
          <div className="flex items-center mb-8 sm:mb-24">
            <div className="flex items-center space-x-8 sm:space-x-16">
              <Truck className="w-24 h-24 sm:w-32 sm:h-32 text-primary" />
              <h1 className="font-jost text-2xl sm:text-[32px] font-bold">Delivery Calculator</h1>
            </div>
          </div>

          <div className="space-y-12 sm:space-y-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-24">
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Shipping Date
                </label>
                <DatePicker 
                  date={selectedDate} 
                  onDateChange={(date) => {
                    setSelectedDate(date);
                    setError(null);
                    clearResults();
                  }}
                />
              </div>
              
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Transport Type
                </label>
                <Select
                  options={Object.entries(TRANSPORT_TYPES).map(([type, data]): SelectOption => ({
                    value: type,
                    label: data.name
                  }))}
                  placeholder="Select transport type..."
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
                  placeholder="Select vehicle type..."
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
                  placeholder="Select vehicle value..."
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-24">
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Pickup Location
                </label>
                <input
                  ref={pickupInputRef}
                  type="text"
                  className={`mt-8 block w-full rounded-[24px] bg-gray-50 border text-gray-900 placeholder-gray-500 
                    focus:ring-primary focus:border-primary font-montserrat text-p2
                    ${errors.pickup ? 'border-red-500' : 'border-gray-300'}`}
                  value={pickup}
                  onChange={(e) => {
                    setPickup(e.target.value);
                    setErrors((prev) => ({ ...prev, pickup: '' }));
                    clearResults();
                  }}
                  placeholder="Enter pickup address"
                />
                {errors.pickup && <p className="text-red-500 text-sm mt-2">{errors.pickup}</p>}
              </div>

              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Delivery Location
                </label>
                <input
                  ref={deliveryInputRef}
                  type="text"
                  className={`mt-8 block w-full rounded-[24px] bg-gray-50 border text-gray-900 placeholder-gray-500 
                    focus:ring-primary focus:border-primary font-montserrat text-p2
                    ${errors.delivery ? 'border-red-500' : 'border-gray-300'}`}
                  value={delivery}
                  onChange={(e) => {
                    setDelivery(e.target.value)
                    setErrors((prev) => ({ ...prev, delivery: '' }));
                    clearResults();
                  }}
                  placeholder="Enter delivery address"
                />
                {errors.delivery && <p className="text-red-500 text-sm mt-2">{errors.delivery}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-24">
              {Object.entries(ADDITIONAL_SERVICES).map(([key, service]) => (
                <div key={key} className="flex items-center space-x-8 sm:space-x-12">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id={key}
                      checked={key === 'premiumEnhancements' ? premiumEnhancements : 
                              key === 'specialLoad' ? specialLoad : 
                              key === 'inoperable' ? inoperable : false}
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
                          key === 'inoperable' ? inoperable ? 'block' : 'hidden' : 'hidden'}`}
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <label className="text-sm sm:text-p2 font-montserrat relative group" htmlFor={key}>
                    {service.name}
                    <span className="ml-4 sm:ml-8 inline-block cursor-help">
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
                          'Inoperable Vehicle Services:'}
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
              ))}
            </div>
  
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

            {/* Показываем капчу, если нужно */}
            {showCaptcha && (
              <SimpleCaptcha 
                generatedNumber={generatedNumber} 
                onVerify={verifyCaptcha} 
              />
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-12 sm:mt-24">
              <button
                onClick={calculatePrice}
                disabled={loading || showCaptcha }
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
                ) : showCaptcha ? (
                  'Please complete verification'
                ) : (
                  'Calculate Route and Price'
                )}
              </button>

              <button
                onClick={() => {
                  // Отправляем сообщение виксу для открытия поп-апа
                  window.parent.postMessage({ action: 'openPopup' }, '*');
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
              additionalServices={{
                premiumEnhancements,
                specialLoad,
                inoperable
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
                        lat: Number(mapData.routes[0].legs[0].start_location.lat()),
                        lng: Number(mapData.routes[0].legs[0].start_location.lng())
                      },
                      delivery: {
                        lat: Number(mapData.routes[0].legs[0].end_location.lat()),
                        lng: Number(mapData.routes[0].legs[0].end_location.lng())
                      },
                      waypoints: []
                    }}
                    selectedDate={selectedDate}
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