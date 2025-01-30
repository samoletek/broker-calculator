"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import { Loader } from '@googlemaps/js-api-loader';
import { Truck, Loader2 } from 'lucide-react';
import PriceSummary from '@/app/components/PriceSummary';
import { calculateTollCost, getRouteSegments } from '@/utils/tollUtils';
import { checkAutoShows, getAutoShowMultiplier } from '@/utils/autoShowsUtils';
import { calculateEstimatedTransitTime, getRoutePoints } from '@/utils/transportUtils';
import { DatePickerComponent } from '@/app/components/DatePickerComponent';
import { PriceBreakdown } from '@/app/components/PriceBreakdown';
import { getFuelPriceMultiplier } from '@/utils/fuelUtils';
import RouteInfo from '@/app/components/RouteInfo';
import GoogleMap from '@/app/components/GoogleMap';
import WeatherConditions from '@/app/components/WeatherConditions';
import { isUSAddress } from '@/utils/addressUtils';
import {
  TRANSPORT_TYPES,
  VEHICLE_VALUE_TYPES,
  VEHICLE_TYPES,
  ADDITIONAL_SERVICES,
  type AdditionalService,
  getBaseRate
} from '@/constants/pricing';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

const selectStyles = {
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999
  }),
  control: (base: any) => ({
    ...base,
    marginTop: '0.5rem',
    borderRadius: '24px',
    backgroundColor: 'rgb(249 250 251)',
    borderColor: '#D1D5DB',
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
  ratePerMile: number;
  distance: number;
  total: number;
}

export default function BrokerCalculator() {
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [transportType, setTransportType] = useState<keyof typeof TRANSPORT_TYPES | ''>('');
  const [vehicleValue, setVehicleValue] = useState<keyof typeof VEHICLE_VALUE_TYPES | ''>('');
  const [premiumEnhancements, setPremiumEnhancements] = useState(false);
  const [specialLoad, setSpecialLoad] = useState(false);
  const [inoperable, setInoperable] = useState(false);
  const [vehicleType, setVehicleType] = useState<keyof typeof VEHICLE_TYPES | ''>('');

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
  
  const [priceComponents, setPriceComponents] = useState<PriceComponents | null>(null);

  const updatePriceComponents = (
    prevComponents: PriceComponents | null,
    updates: Partial<PriceComponents>
  ) => {
    if (!prevComponents) return null;
  
    const newComponents = {
      ...prevComponents,
      ...updates
    };
  
    const mainMultiplierTotal = 
      newComponents.mainMultipliers.vehicle * 
      newComponents.mainMultipliers.weather * 
      newComponents.mainMultipliers.traffic *
      newComponents.mainMultipliers.autoShow *
      newComponents.mainMultipliers.fuel;
  
    newComponents.mainMultipliers.totalMain = mainMultiplierTotal;
  
    newComponents.finalPrice = 
      newComponents.basePrice * 
      mainMultiplierTotal * 
      (1 + newComponents.additionalServices.totalAdditional) +
      (newComponents.tollCosts?.total || 0);
  
    return newComponents;
  };

  const mapRef = useRef<HTMLDivElement>(null);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);
  const googleRef = useRef<typeof google | null>(null);

  const clearResults = () => {
    setDistance(null);
    setPriceComponents(null);
    setMapData(null);
    setRouteInfo({
      isPopularRoute: false,
      isRemoteArea: false,
      trafficConditions: {
        status: 'light' as 'light' | 'moderate' | 'heavy',
        delay: 0
      },
      estimatedTime: ''
    });
  };

  useEffect(() => {
    const isExpensiveVehicle = vehicleValue === 'under500k' || vehicleValue === 'over500k';
    if (isExpensiveVehicle) {
      setPremiumEnhancements(true);
    }
  }, [vehicleValue]);
  
  useEffect(() => {
    const initAutocomplete = () => {
      if (!googleRef.current || !pickupInputRef.current || !deliveryInputRef.current) return;
    
      const pickupAutocomplete = new googleRef.current.maps.places.Autocomplete(pickupInputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'us' },
      });
      
      const deliveryAutocomplete = new googleRef.current.maps.places.Autocomplete(deliveryInputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'us' },
      });
    
      pickupAutocomplete.addListener('place_changed', () => {
        const place = pickupAutocomplete.getPlace();
        setPickup(place.formatted_address || '');
        clearResults();
      });
    
      deliveryAutocomplete.addListener('place_changed', () => {
        const place = deliveryAutocomplete.getPlace();
        setDelivery(place.formatted_address || '');
        clearResults();
      });
    };

    initAutocomplete();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
  
    const initGoogleMaps = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: "weekly",
          libraries: ["places"],
          channel: 'broker-calculator'
        });
        
        const google = await loader.load();
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
            clearResults();
          });
      
          deliveryAutocomplete.addListener('place_changed', () => {
            const place = deliveryAutocomplete.getPlace();
            setDelivery(place.formatted_address || '');
            clearResults();
          });
        }
      } catch (err) {
        console.error('Error initializing Google Maps:', err);
      }
    };
  
    initGoogleMaps();
  }, []); 

  const calculatePrice = async () => {
    if (typeof window === 'undefined' || !window.google) return;
    if (!selectedDate) {
      setError('Please select a shipping date');
      return;
    }
   
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
   
      const routePoints = getRoutePoints(response);
      const fuelPriceMultiplier = await getFuelPriceMultiplier(routePoints, window.google);
   
      const basePrice = getBaseRate(distanceInMiles, transportType);
      
      const basePriceBreakdown = {
        ratePerMile: TRANSPORT_TYPES[transportType].baseRatePerMile.max,
        distance: distanceInMiles,
        total: basePrice
      };
   
      const additionalServicesMultiplier = 1.0 + 
        (premiumEnhancements ? 0.3 : 0) +
        (specialLoad ? 0.3 : 0) +
        (inoperable ? 0.3 : 0);
   
      const vehicleMultiplier = VEHICLE_VALUE_TYPES[vehicleValue].multiplier;
   
      const totalTollCost = calculateTollCost(distanceInMiles, response.routes[0]);
      const tollSegments = getRouteSegments(response, totalTollCost);
      const tollCosts = {
        segments: tollSegments,
        total: totalTollCost
      };
   
      const finalPrice = basePrice * 
                        vehicleMultiplier * 
                        1.0 * 
                        autoShowMultiplier * 
                        fuelPriceMultiplier * 
                        additionalServicesMultiplier + 
                        tollCosts.total;
   
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
        tollCosts,
        finalPrice
      });
   
    } catch (err) {
      console.error('Calculation error:', err);
      setError('Error calculating route. Please check the addresses and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-24">
      <div className="max-w-7xl mx-auto space-y-24">
        <div className="bg-white rounded-[32px] p-24 border border-primary/10">
          <div className="flex items-center mb-24">
            <div className="flex items-center space-x-16">
              <Truck className="w-32 h-32 text-primary" />
              <h1 className="font-jost text-[32px] font-bold">Delivery Calculator</h1>
            </div>
          </div>
  
          <div className="space-y-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24">
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Shipping Date
                </label>
                <DatePickerComponent 
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
                  onChange={(newValue: SingleValue<SelectOption>) => {
                    setTransportType((newValue?.value as keyof typeof TRANSPORT_TYPES) || '');
                    clearResults();
                  }}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
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
                  onChange={(newValue: SingleValue<SelectOption>) => {
                    setVehicleType((newValue?.value as keyof typeof VEHICLE_TYPES) || '');
                    clearResults();
                  }}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
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
                  onChange={(newValue: SingleValue<SelectOption>) => {
                    setVehicleValue((newValue?.value as keyof typeof VEHICLE_VALUE_TYPES) || '');
                    clearResults();
                  }}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
              </div>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Pickup Location
                </label>
                <input
                  ref={pickupInputRef}
                  type="text"
                  className={`mt-8 block w-full rounded-[24px]
                    bg-gray-50
                    border-gray-300
                    text-gray-900
                    placeholder-gray-500
                    focus:ring-primary focus:border-primary
                    font-montserrat text-p2
                    ${!pickup && error ? 'border-red-300 ring-red-300' : ''}`}
                  value={pickup}
                  onChange={(e) => {
                    setPickup(e.target.value);
                    clearResults();
                  }}
                  placeholder="Enter pickup address"
                />
              </div>
              <div>
                <label className="block text-p2 font-montserrat font-medium mb-8">
                  Delivery Location
                </label>
                <input
                  ref={deliveryInputRef}
                  type="text"
                  className={`mt-8 block w-full rounded-[24px]
                    bg-gray-50
                    border-gray-300
                    text-gray-900
                    placeholder-gray-500
                    focus:ring-[#1356BE] focus:border-[#1356BE]
                    font-montserrat text-p2
                    ${!delivery && error ? 'border-red-300 ring-red-300' : ''}`}
                  value={delivery}
                  onChange={(e) => {
                    setDelivery(e.target.value);
                    clearResults();
                  }}
                  placeholder="Enter delivery address"
                />
              </div>
            </div>
  
            <div className="space-y-16">
              {Object.entries(ADDITIONAL_SERVICES).map(([key, service]: [string, AdditionalService]) => (
                <div key={key} className="flex items-center space-x-12">
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
                      className={`appearance-none h-24 w-24 rounded
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
                      className={`absolute left-0 top-0 w-24 h-24 pointer-events-none text-white
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
                  <label className="text-p2 font-montserrat relative group" htmlFor={key}>
                    {service.name}
                    <span className="ml-8 inline-block cursor-help">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="currentColor" 
                        className="w-16 h-16 text-gray-500"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" 
                        />
                      </svg>
                      <div className="invisible group-hover:visible absolute z-50 w-[280px] p-16
                        bg-white border border-gray-200 rounded-[24px] shadow-lg -mt-8 ml-24">
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
  
            <button
              onClick={calculatePrice}
              disabled={loading}
              className="mt-24 w-full bg-primary hover:bg-primary/90
                text-white py-12 px-16 rounded-[24px]
                disabled:bg-primary/50
                disabled:cursor-not-allowed
                transition-colors duration-200
                flex items-center justify-center
                font-montserrat text-p2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-20 h-20 mr-8 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate Route and Price'
              )}
            </button>
  
            {error && (
              <div className="mt-16 p-16 bg-red-50 text-red-700 rounded-[24px] font-montserrat text-p2">
                {error}
              </div>
            )}
          </div>
        </div>
  
        {distance && priceComponents && mapData && (
          <div className="space-y-24">
            <PriceSummary 
              finalPrice={priceComponents.finalPrice}
              basePrice={priceComponents.basePrice}
              selectedDate={selectedDate}
              onSavePrice={() => {
                console.log('Price calculation saved');
              }}
            />
  
            <div className="flex gap-24">
              <GoogleMap ref={mapRef} mapData={mapData} />
              {mapData && (
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
                    setPriceComponents((prev) => 
                      updatePriceComponents(prev, {
                        mainMultipliers: {
                          ...prev!.mainMultipliers,
                          weather: weatherMultiplier
                        }
                      })
                    );
                  }}
                />
              )}
            </div>
  
            <div className="lg:col-span-2 space-y-24">
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
                onTollUpdate={(tollCost: number, segments?: Array<{ location: string, cost: number }>) => {
                  setPriceComponents((prev) => 
                    updatePriceComponents(prev, {
                      tollCosts: {
                        segments: segments || [],
                        total: tollCost
                      }
                    })
                  );
                }}
              />
                    
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
        )}
      </div>
    </div>
  );
}