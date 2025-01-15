"use client";

import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Truck, Loader2 } from 'lucide-react';
import { checkAutoShows, getAutoShowMultiplier } from '@/utils/autoShowsUtils';
import { calculateEstimatedTransitTime, getRoutePoints } from '@/utils/transportUtils';
import { DatePickerComponent } from '@/app/components/DatePickerComponent';
import { PriceBreakdown } from '@/app/components/PriceBreakdown';
import { getFuelPriceMultiplier } from '@/utils/fuelUtils';
import RouteInfo from '@/app/components/RouteInfo';
import WeatherMap from '@/app/components/WeatherMap';
import { ThemeToggle } from '@/app/components/ThemeToggle'
import { isUSAddress } from '@/utils/addressUtils';
import {
  TRANSPORT_TYPES,
  VEHICLE_VALUE_TYPES,
  VEHICLE_TYPES,
  ADDITIONAL_SERVICES,
  type AdditionalService,
  getBaseRate
} from '@/constants/pricing';

interface PriceComponents {
  selectedDate: Date | undefined;
  basePrice: number;
  mainMultipliers: {
    vehicle: number;
    weather: number;
    traffic: number;
    autoShow: number;
    fuel: number;
    totalMain: number;
  };
  additionalServices: {
    premium: number;
    special: number;
    inoperable: number;
    totalAdditional: number;
  };
  basePriceBreakdown: BasePriceBreakdown;

  tollCosts?: {
    segments: Array<{
      location: string;
      cost: number;
    }>;
    total: number;
  };
  finalPrice: number;
}

interface BasePriceBreakdown {
  ratePerMile: number;    // базовая ставка за милю
  distance: number;       // расстояние
  total: number;         // итоговая базовая цена
}

const mapLoader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  version: "weekly",
  libraries: ["places"],
  channel: 'broker-calculator'
});

export default function BrokerCalculator() {
  // Основные состояния
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Состояния для расчета
  const [transportType, setTransportType] = useState<keyof typeof TRANSPORT_TYPES | ''>('');
  const [vehicleValue, setVehicleValue] = useState<keyof typeof VEHICLE_VALUE_TYPES | ''>('');
  const [premiumEnhancements, setPremiumEnhancements] = useState(false);
  const [specialLoad, setSpecialLoad] = useState(false);
  const [inoperable, setInoperable] = useState(false);
  const [vehicleType, setVehicleType] = useState<keyof typeof VEHICLE_TYPES | ''>('');

  // Состояния для маршрута
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
  
  // Состояния для цены
  const [priceComponents, setPriceComponents] = useState<PriceComponents | null>(null);

  // Рефы для Google Maps
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);
  const googleRef = useRef<typeof google | null>(null);

  // Эффект для автовключения Премиум функции
  useEffect(() => {
    const isExpensiveVehicle = vehicleValue === 'under500k' || vehicleValue === 'over500k';
    if (isExpensiveVehicle) {
      setPremiumEnhancements(true);
    }
  }, [vehicleValue]);
  
  // Инициализация Google Maps
  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        const google = await mapLoader.load();
        googleRef.current = google;
        
        if (pickupInputRef.current && deliveryInputRef.current) {
          const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInputRef.current, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' },
          });
          
          const deliveryAutocomplete = new google.maps.places.Autocomplete(deliveryInputRef.current, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' },
          });

          pickupAutocomplete.addListener('place_changed', () => {
            const place = pickupAutocomplete.getPlace();
            setPickup(place.formatted_address || '');
          });

          deliveryAutocomplete.addListener('place_changed', () => {
            const place = deliveryAutocomplete.getPlace();
            setDelivery(place.formatted_address || '');
          });
        }
      } catch (err) {
        console.error('Error initializing autocomplete:', err);
      }
    };

    initAutocomplete();
  }, []);

  // Функция для расчета цены
  const calculatePrice = async () => {
    if (!selectedDate) {
      setError('Please select a shipping date');
      return;
    }
  
    // Проверка остальных полей
    const errors = [];
    if (!pickup || !delivery) {
      errors.push('pickup and delivery locations');
    }
    if (!transportType) {
      errors.push('transport type');
    }
    if (!vehicleType) {
      errors.push('vehicle type');
    }
    if (!vehicleValue) {
      errors.push('vehicle value');
    }
  
    if (errors.length > 0) {
      setError(`Please enter ${errors.join(', ')}`);
      return;
    }
  
    // Проверка корректности адресов
    const isPickupValid = await isUSAddress(pickup, window.google);
    const isDeliveryValid = await isUSAddress(delivery, window.google);
  
    if (!isPickupValid || !isDeliveryValid) {
      setError('Please enter valid US addresses for pickup and delivery');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const service = new google.maps.DirectionsService();
      
      const response = await service.route({
        origin: pickup,
        destination: delivery,
        travelMode: google.maps.TravelMode.DRIVING
      }) as google.maps.DirectionsResult;
  
      setMapData(response);
      const distanceInMiles = (response.routes[0].legs[0].distance?.value || 0) / 1609.34;
      
      setDistance(Math.round(distanceInMiles));
      setRouteInfo(prev => ({
        ...prev,
        estimatedTime: calculateEstimatedTransitTime(distanceInMiles)
      }));
  
      // Проверяем наличие автовыставок
      const pickupAutoShows = await checkAutoShows({
        lat: response.routes[0].legs[0].start_location.lat(),
        lng: response.routes[0].legs[0].start_location.lng()
      }, selectedDate, window.google);
  
      const deliveryAutoShows = await checkAutoShows({
        lat: response.routes[0].legs[0].end_location.lat(),
        lng: response.routes[0].legs[0].end_location.lng()
      }, selectedDate, window.google);
  
      const autoShowMultiplier = Math.max(
        getAutoShowMultiplier(pickupAutoShows, selectedDate),
        getAutoShowMultiplier(deliveryAutoShows, selectedDate)
      );
  
      // Проверяем цены на топливо
      const routePoints = getRoutePoints(response);
      const fuelPriceMultiplier = await getFuelPriceMultiplier(routePoints, window.google);
  
      // Расчет базовой цены
      const basePrice = getBaseRate(distanceInMiles, transportType);
      
      const basePriceBreakdown = {
        ratePerMile: TRANSPORT_TYPES[transportType].baseRatePerMile.max,
        distance: distanceInMiles,
        total: basePrice
      };
  
      // Расчет множителя дополнительных услуг
      const additionalServicesMultiplier = 1.0 + 
        (premiumEnhancements ? 0.3 : 0) +
        (specialLoad ? 0.3 : 0) +
        (inoperable ? 0.3 : 0);
  
      // Получение множителей
      const vehicleMultiplier = VEHICLE_VALUE_TYPES[vehicleValue].multiplier;
  
      setPriceComponents({
        selectedDate,
        basePrice,
        basePriceBreakdown,
        mainMultipliers: {
          vehicle: vehicleMultiplier,
          weather: 1.0,
          traffic: 1.0,
          autoShow: autoShowMultiplier,
          fuel: fuelPriceMultiplier,
          totalMain: vehicleMultiplier * 
                    1.0 * 
                    autoShowMultiplier * 
                    fuelPriceMultiplier
        },
        additionalServices: {
          premium: premiumEnhancements ? 0.3 : 0,
          special: specialLoad ? 0.3 : 0,
          inoperable: inoperable ? 0.3 : 0,
          totalAdditional: additionalServicesMultiplier - 1.0
        },
        finalPrice: basePrice * 
                   vehicleMultiplier * 
                   1.0 * 
                   autoShowMultiplier * 
                   fuelPriceMultiplier * 
                   additionalServicesMultiplier
      });
  
    } catch (err) {
      console.error('Calculation error:', err);
      setError('Error calculating route. Please check the addresses and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Truck className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Broker Dashboard</h1>
            </div>
            <ThemeToggle />
          </div>

          {/* Main Form */}
          <div className="space-y-6">
            {/* Top Grid - Date, Transport Type, Vehicle Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Shipping Date</label>
                <DatePickerComponent 
                  date={selectedDate} 
                  onDateChange={(date) => {
                    setSelectedDate(date);
                    setError(null);
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Transport Type</label>
                <select
                  value={transportType}
                  onChange={(e) => setTransportType(e.target.value as keyof typeof TRANSPORT_TYPES)}
                  className={`mt-1 block w-full rounded-md 
                    bg-gray-50 dark:bg-gray-700
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-gray-100
                    focus:ring-blue-500 dark:focus:ring-blue-400
                    focus:border-blue-500 dark:focus:border-blue-400
                    ${!transportType && error ? 'border-red-300 dark:border-red-500 ring-red-300 dark:ring-red-500' : ''}`}
                >
                  <option value="" disabled>Select transport type...</option>
                  {Object.entries(TRANSPORT_TYPES).map(([type, data]) => (
                    <option key={type} value={type}>{data.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as keyof typeof VEHICLE_TYPES)}
                  className={`mt-1 block w-full rounded-md
                    bg-gray-50 dark:bg-gray-700
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-gray-100
                    focus:ring-blue-500 dark:focus:ring-blue-400
                    focus:border-blue-500 dark:focus:border-blue-400
                    ${!vehicleType && error ? 'border-red-300 dark:border-red-500 ring-red-300 dark:ring-red-500' : ''}`}
                >
                  <option value="" disabled>Select vehicle type...</option>
                  {Object.entries(VEHICLE_TYPES).map(([type, data]) => (
                    <option key={type} value={type} title={data.description}>
                      {data.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Vehicle Value</label>
                <select
                  value={vehicleValue}
                  onChange={(e) => setVehicleValue(e.target.value as keyof typeof VEHICLE_VALUE_TYPES)}
                  className={`mt-1 block w-full rounded-md
                    bg-gray-50 dark:bg-gray-700
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-gray-100
                    focus:ring-blue-500 dark:focus:ring-blue-400
                    focus:border-blue-500 dark:focus:border-blue-400
                    ${!vehicleValue && error ? 'border-red-300 dark:border-red-500 ring-red-300 dark:ring-red-500' : ''}`}
                >
                  <option value="" disabled>Select vehicle value...</option>
                  {Object.entries(VEHICLE_VALUE_TYPES).map(([type, data]) => (
                    <option key={type} value={type}>{data.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Pickup Location</label>
                <input
                  ref={pickupInputRef}
                  type="text"
                  className={`mt-1 block w-full rounded-md
                    bg-gray-50 dark:bg-gray-700
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-gray-100
                    placeholder-gray-500 dark:placeholder-gray-400
                    focus:ring-blue-500 dark:focus:ring-blue-400
                    focus:border-blue-500 dark:focus:border-blue-400
                    ${!pickup && error ? 'border-red-300 dark:border-red-500 ring-red-300 dark:ring-red-500' : ''}`}
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Enter pickup address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Delivery Location</label>
                <input
                  ref={deliveryInputRef}
                  type="text"
                  className={`mt-1 block w-full rounded-md
                    bg-gray-50 dark:bg-gray-700
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-gray-100
                    placeholder-gray-500 dark:placeholder-gray-400
                    focus:ring-blue-500 dark:focus:ring-blue-400
                    focus:border-blue-500 dark:focus:border-blue-400
                    ${!delivery && error ? 'border-red-300 dark:border-red-500 ring-red-300 dark:ring-red-500' : ''}`}
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  placeholder="Enter delivery address"
                />
              </div>
            </div>

            {/* Additional Services */}
            <div className="space-y-4">
              {Object.entries(ADDITIONAL_SERVICES).map(([key, service]: [string, AdditionalService]) => (
                <div key={key} className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    id={key}
                    checked={key === 'premiumEnhancements' ? premiumEnhancements : 
                            key === 'specialLoad' ? specialLoad : 
                            key === 'inoperable' ? inoperable : false}
                    disabled={key === 'premiumEnhancements' && (vehicleValue === 'under500k' || vehicleValue === 'over500k')}
                    onChange={(e) => {
                      if (key === 'premiumEnhancements') setPremiumEnhancements(e.target.checked);
                      else if (key === 'specialLoad') setSpecialLoad(e.target.checked);
                      else if (key === 'inoperable') setInoperable(e.target.checked);
                    }}
                    className={`rounded
                      text-blue-600 dark:text-blue-400
                      bg-gray-50 dark:bg-gray-700
                      border-gray-300 dark:border-gray-600
                      focus:ring-blue-500 dark:focus:ring-blue-400
                      ${key === 'premiumEnhancements' && (vehicleValue === 'under500k' || vehicleValue === 'over500k') 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''}`}
                  />
                  <label className="text-gray-900 dark:text-gray-100 relative group" htmlFor={key}>
                    {service.name}
                    <span className="ml-2 inline-block cursor-help">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="currentColor" 
                        className="w-4 h-4 text-gray-500 dark:text-gray-400"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" 
                        />
                      </svg>
                      <div className="invisible group-hover:visible absolute z-50 w-80 p-3.5 
                        bg-gray-900 dark:bg-black text-white rounded-lg shadow-lg -mt-2 ml-6">
                        <div className="text-sm font-semibold mb-2">
                          {key === 'premiumEnhancements' ? 'Premium Service Benefits:' : 
                          key === 'specialLoad' ? 'Special Load Services:' : 
                          'Inoperable Vehicle Services:'}
                        </div>
                        <ul className="space-y-1 text-xs">
                          {service.tooltip?.map((tip, index) => (
                            <li key={index} className="flex">
                              <span className="mr-1.5">•</span>
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

            {/* Calculate Button */}
            <button
              onClick={calculatePrice}
              disabled={loading}
              className="mt-6 w-full bg-blue-500 hover:bg-blue-600
                dark:bg-blue-600 dark:hover:bg-blue-700
                text-white py-2 px-4 rounded-md
                disabled:bg-blue-300 dark:disabled:bg-blue-800
                disabled:cursor-not-allowed
                transition-colors duration-200
                flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate Route and Price'
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {distance && priceComponents && mapData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Route Info & Price Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              <RouteInfo 
                pickup={pickup}
                delivery={delivery}
                distance={distance}
                estimatedTime={routeInfo.estimatedTime}
                isPopularRoute={routeInfo.isPopularRoute}
                isRemoteArea={routeInfo.isRemoteArea}
                trafficConditions={routeInfo.trafficConditions}
                mapData={mapData}
                selectedDate={selectedDate}
                onTollUpdate={(tollCost: number, segments?: Array<{ location: string, cost: number }>) => {
                  setPriceComponents((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      tollCosts: {
                        segments: segments || [],
                        total: tollCost
                      },
                      finalPrice: prev.basePrice * 
                                prev.mainMultipliers.totalMain * 
                                (1 + prev.additionalServices.totalAdditional) + 
                                tollCost
                    };
                  });
                }}
              />
                
                <PriceBreakdown
                  distance={distance}
                  basePrice={priceComponents.basePrice}
                  basePriceBreakdown={priceComponents.basePriceBreakdown}  // добавляем это
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

            {/* Right Column - Weather Map */}
            <div className="space-y-6">
              {mapData && (
                <WeatherMap
                  routePoints={{
                    pickup: {
                      lat: mapData.routes[0].legs[0].start_location.lat(),
                      lng: mapData.routes[0].legs[0].start_location.lng()
                    },
                    delivery: {
                      lat: mapData.routes[0].legs[0].end_location.lat(),
                      lng: mapData.routes[0].legs[0].end_location.lng()
                    },
                    waypoints: []
                  }}
                  selectedDate={selectedDate}
                  onWeatherUpdate={(multiplier) => {
                    setPriceComponents((prev) => {
                      if (!prev) return null;
                      
                      const newMainMultipliers = {
                        ...prev.mainMultipliers,
                        weather: multiplier,
                        totalMain: prev.mainMultipliers.vehicle * 
                                multiplier * 
                                prev.mainMultipliers.traffic *
                                prev.mainMultipliers.autoShow *
                                prev.mainMultipliers.fuel
                      };
                      
                      const newFinalPrice = prev.basePrice * 
                                newMainMultipliers.totalMain * 
                                (1 + prev.additionalServices.totalAdditional);
                  
                      return {
                        ...prev,
                        mainMultipliers: newMainMultipliers,
                        finalPrice: newFinalPrice + (prev.tollCosts?.total || 0)
                      };
                    });
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}