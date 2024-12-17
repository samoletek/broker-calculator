"use client";

import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Truck, Loader2 } from 'lucide-react';
import { addDays } from 'date-fns';
import { DatePickerComponent } from '@/components/broker/DatePickerComponent';
import { PriceBreakdown } from '@/components/broker/PriceBreakdown';
import RouteInfo from '@/components/broker/RouteInfo';
import WeatherMap from '@/components/broker/WeatherMap';
import MarketInfo from '@/components/broker/MarketInfo';
import {
  TRANSPORT_TYPES,
  VEHICLE_VALUE_TYPES,
  getBaseRate,
  getSeasonalMultiplier
} from '@/constants/pricing';

interface PriceComponents {
  selectedDate: Date | undefined;
  basePrice: number;
  mainMultipliers: {
    vehicle: number;
    weather: number;
    traffic: number;
    seasonal: number;
    totalMain: number;
  };
  additionalServices: {
    premium: number;
    special: number;
    inoperable: number;
    totalAdditional: number;
  };
  tollCosts?: {
    segments: Array<{
      location: string;
      cost: number;
    }>;
    total: number;
  };
  finalPrice: number;
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
            types: ['address'],
          });
          
          const deliveryAutocomplete = new google.maps.places.Autocomplete(deliveryInputRef.current, {
            types: ['address'],
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
    if (!vehicleValue) {
      errors.push('vehicle value');
    }
  
    if (errors.length > 0) {
      setError(`Please enter ${errors.join(', ')}`);
      return;
    }
  
    setLoading(true);
    setError(null);

    try {
      if (!googleRef.current) {
        googleRef.current = await mapLoader.load();
      }

      const service = new googleRef.current.maps.DirectionsService();
      const response = await service.route({
        origin: pickup,
        destination: delivery,
        travelMode: google.maps.TravelMode.DRIVING
      }) as google.maps.DirectionsResult;
      
      setMapData(response as google.maps.DirectionsResult);
      const distanceInMiles = (response.routes[0].legs[0].distance?.value || 0) / 1609.34;
      const duration = response.routes[0].legs[0].duration?.text || '';

      setDistance(Math.round(distanceInMiles));
      setRouteInfo(prev => ({
        ...prev,
        estimatedTime: duration
      }));

      // Расчет базовой цены
      const baseRates = getBaseRate(distanceInMiles, transportType);
      const basePrice = (baseRates.min + baseRates.max) / 2;

      // Получение множителей
      const vehicleMultiplier = VEHICLE_VALUE_TYPES[vehicleValue].multiplier;
      const seasonalMultiplier = getSeasonalMultiplier(selectedDate);

      // Множитель погоды и траффика будет обновлен через WeatherMap и RouteInfo компоненты
      const mainMultiplier = vehicleMultiplier * seasonalMultiplier;

      // Расчет множителя дополнительных услуг
      const additionalServicesMultiplier = 1.0 + 
        (premiumEnhancements ? 0.3 : 0) +
        (specialLoad ? 0.3 : 0) +
        (inoperable ? 0.3 : 0);

      setPriceComponents({
        selectedDate,
        basePrice,
        mainMultipliers: {
          vehicle: vehicleMultiplier,
          weather: 1.0,  // Будет обновлено из WeatherMap
          traffic: 1.0,  // Будет обновлено из RouteInfo
          seasonal: seasonalMultiplier,
          totalMain: vehicleMultiplier * seasonalMultiplier  // Начальное значение
        },
        additionalServices: {
          premium: premiumEnhancements ? 0.3 : 0,
          special: specialLoad ? 0.3 : 0,
          inoperable: inoperable ? 0.3 : 0,
          totalAdditional: additionalServicesMultiplier - 1.0
        },
        finalPrice: basePrice * vehicleMultiplier * seasonalMultiplier * additionalServicesMultiplier
      });

    } catch (err) {
      console.error('Calculation error:', err);
      setError('Error calculating route. Please check the addresses and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Truck className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900">Broker Dashboard</h1>
          </div>

          {/* Main Form */}
          <div className="space-y-6">
            {/* Top Grid - Date, Transport Type, Vehicle Value */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900">Shipping Date</label>
                <DatePickerComponent 
                  date={selectedDate} 
                  onDateChange={(date) => {
                    setSelectedDate(date);
                    if (date && date > addDays(new Date(), 30)) {
                      setError("We can only provide accurate estimates for dates within the next 30 days");
                      return;
                    }
                    setError(null);
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900">Transport Type</label>
                <select
                  value={transportType}
                  onChange={(e) => setTransportType(e.target.value as keyof typeof TRANSPORT_TYPES)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${!transportType && error ? 'border-red-300 ring-red-300' : ''}`}
                >
                  <option value="" disabled>Select transport type...</option>
                  {Object.entries(TRANSPORT_TYPES).map(([type, data]) => (
                    <option key={type} value={type}>{data.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">Vehicle Value</label>
                <select
                  value={vehicleValue}
                  onChange={(e) => setVehicleValue(e.target.value as keyof typeof VEHICLE_VALUE_TYPES)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${!vehicleValue && error ? 'border-red-300 ring-red-300' : ''}`}
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
                <label className="block text-sm font-medium text-gray-900">Pickup Location</label>
                <input
                  ref={pickupInputRef}
                  type="text"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${!pickup && error ? 'border-red-300 ring-red-300' : ''}`}
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Enter pickup address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Delivery Location</label>
                <input
                  ref={deliveryInputRef}
                  type="text"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${!delivery && error ? 'border-red-300 ring-red-300' : ''}`}
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  placeholder="Enter delivery address"
                />
              </div>
            </div>

            {/* Additional Services */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id="premiumEnhancements"
                  checked={premiumEnhancements}
                  disabled={vehicleValue === 'under500k' || vehicleValue === 'over500k'}
                  onChange={(e) => setPremiumEnhancements(e.target.checked)}
                  className={`rounded text-blue-600 focus:ring-blue-500 ${
                    (vehicleValue === 'under500k' || vehicleValue === 'over500k') ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <label className="text-gray-900" htmlFor="premiumEnhancements">Premium Enhancements</label>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id="specialLoad"
                  checked={specialLoad}
                  onChange={(e) => setSpecialLoad(e.target.checked)}
                  className="rounded text-grey-900 focus:ring-blue-500"
                />
                <label className="text-gray-900" htmlFor="specialLoad">Special Load</label>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id="inoperable"
                  checked={inoperable}
                  onChange={(e) => setInoperable(e.target.checked)}
                  className="rounded text-gray-900 focus:ring-blue-500"
                />
                <label className="text-gray-900" htmlFor="inoperable">Inoperable Vehicle</label>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculatePrice}
              disabled={loading}
              className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
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
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
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
                setPriceComponents((prev: PriceComponents | null) => {
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
                mainMultipliers={priceComponents.mainMultipliers}
                additionalServices={priceComponents.additionalServices}
                finalPrice={priceComponents.finalPrice}
                routeInfo={{
                  isPopularRoute: routeInfo.isPopularRoute,
                  isRemoteArea: routeInfo.isRemoteArea
                }}
                selectedDate={selectedDate}
              />
            </div>

            {/* Right Column - Weather & Market Info */}
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
                    console.log('Weather update received:', multiplier);
                    setPriceComponents((prev: PriceComponents | null) => {
                      if (!prev) return null;
                      
                      const newMainMultipliers = {
                        ...prev.mainMultipliers,
                        weather: multiplier,
                        totalMain: prev.mainMultipliers.vehicle * 
                                 multiplier * 
                                 prev.mainMultipliers.traffic * 
                                 prev.mainMultipliers.seasonal
                      };
                      
                      const newFinalPrice = prev.basePrice * 
                                newMainMultipliers.totalMain * 
                                (1 + prev.additionalServices.totalAdditional);

                      return {
                        ...prev,
                        mainMultipliers: newMainMultipliers,
                        finalPrice: newFinalPrice
                      };
                    });
                  }}
                />
              )}
              
              <MarketInfo
                route={{
                  from: pickup,
                  to: delivery,
                  distance: distance
                }}
                selectedDate={selectedDate}
                vehicleType={vehicleValue}
                onMarketUpdate={(marketFactor) => {
                  console.log('Market update received:', marketFactor);
                  setPriceComponents((prev: PriceComponents | null) => {
                    if (!prev) return null;

                    const newFinalPrice = prev.basePrice * 
                                        prev.mainMultipliers.totalMain * 
                                        (1 + prev.additionalServices.totalAdditional) * 
                                        marketFactor;

                    return {
                      ...prev,
                      finalPrice: newFinalPrice
                    };
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}