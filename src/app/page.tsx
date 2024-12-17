"use client";

import { useState, useEffect, useRef } from 'react';
import { Truck, Loader2, Globe, AlertCircle } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import axios from 'axios';
import {
  TRANSPORT_TYPES,
  VEHICLE_VALUE_TYPES,
  ADDITIONAL_SERVICES,
  WEATHER_MULTIPLIERS,
  ROUTE_FACTORS,
  getBaseRate,
  getSeasonalMultiplier
} from '@/constants/pricing';
import { WeatherAPIResponse, TrafficResponse } from '@/types/api';

const mapLoader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  version: "weekly",
  libraries: ["places"]
});

interface TranslationStrings {
  title: string;
  pickup: string;
  delivery: string;
  calculate: string;
  calculating: string;
  distance: string;
  price: string;
  enterAddress: string;
  error: string;
  pleaseEnter: string;
  miles: string;
  transportType: string;
  vehicleType: string;
  additionalServices: string;
  info: string;
}

const translations: Record<Language, TranslationStrings> = {
  en: {
    title: 'CHD Shipping Cost Estimator',
    pickup: 'Pickup Location',
    delivery: 'Delivery Location',
    calculate: 'Calculate Price',
    calculating: 'Calculating...',
    distance: 'Distance',
    price: 'Estimated Price',
    enterAddress: 'Enter address...',
    error: 'Error calculating. Please check the addresses and try again.',
    pleaseEnter: 'Please enter both pickup and delivery locations',
    miles: 'miles',
    transportType: 'Transport Type',
    vehicleType: 'Vehicle Value/Type',
    additionalServices: 'Additional Services',
    info: 'Premium Service Benefits'
  },
  es: {
    title: 'Calculador de gastos de envío de CHD',
    pickup: 'Lugar de Recogida',
    delivery: 'Lugar de Entrega',
    calculate: 'Calcular Precio',
    calculating: 'Calculando...',
    distance: 'Distancia',
    price: 'Precio Estimado',
    enterAddress: 'Ingrese la dirección...',
    error: 'Error al calcular. Verifique las direcciones e intente nuevamente.',
    pleaseEnter: 'Ingrese ambas ubicaciones',
    miles: 'millas',
    transportType: 'Tipo de Transporte',
    vehicleType: 'Tipo de Vehículo',
    additionalServices: 'Servicios Adicionales',
    info: 'Beneficios del Servicio Premium'
  },
  ru: {
    title: 'Калькулятор стоимости доставки от компании CHD',
    pickup: 'Место Загрузки',
    delivery: 'Место Выгрузки',
    calculate: 'Рассчитать Стоимость',
    calculating: 'Расчёт...',
    distance: 'Расстояние',
    price: 'Примерная Стоимость',
    enterAddress: 'Введите адрес...',
    error: 'Ошибка расчёта. Проверьте адреса и попробуйте снова.',
    pleaseEnter: 'Введите оба адреса',
    miles: 'миль',
    transportType: 'Тип Транспорта',
    vehicleType: 'Тип Автомобиля',
    additionalServices: 'Дополнительные Услуги',
    info: 'Преимущества Премиум Сервиса'
  }
};

type Language = 'en' | 'es' | 'ru';
type TransportType = keyof typeof TRANSPORT_TYPES;
type VehicleValueType = keyof typeof VEHICLE_VALUE_TYPES;

export default function Home() {
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [transportType, setTransportType] = useState<TransportType>('openTransport');
  const [vehicleValue, setVehicleValue] = useState<VehicleValueType>('under100k');
  
  // Новые состояния для дополнительных услуг
  const [premiumEnhancements, setPremiumEnhancements] = useState(false);
  const [specialLoad, setSpecialLoad] = useState(false);
  const [inoperable, setInoperable] = useState(false);

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);
  const googleRef = useRef<any>(null);

  const t = translations[language];

// Добавляем здесь новый useEffect
useEffect(() => {
  const isExpensiveVehicle = vehicleValue === 'under500k' || vehicleValue === 'over500k';
  if (isExpensiveVehicle) {
    setPremiumEnhancements(true);
  }
}, [vehicleValue]);

// Добавляем функцию проверки
const isPremiumRequired = vehicleValue === 'under500k' || vehicleValue === 'over500k';

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

  // API для погоды
  const getWeatherData = async (lat: number, lng: number): Promise<number> => {
    try {
      const response = await axios.get<WeatherAPIResponse>('https://api.weatherapi.com/v1/current.json', {
        params: {
          q: `${lat},${lng}`,
          key: process.env.NEXT_PUBLIC_WEATHER_API_KEY
        }
      });
  
      if (!response.data?.current?.condition) {
        console.warn('No weather data found in response');
        return WEATHER_MULTIPLIERS.clear;
      }
  
      const weather = response.data.current.condition.text.toLowerCase();
      // Преобразуем погодные условия от WeatherAPI.com в наши множители
      let multiplier = WEATHER_MULTIPLIERS.clear;
      
      if (weather.includes('rain') || weather.includes('drizzle')) {
        multiplier = WEATHER_MULTIPLIERS.rain;
      } else if (weather.includes('snow')) {
        multiplier = WEATHER_MULTIPLIERS.snow;
      } else if (weather.includes('storm') || weather.includes('thunder')) {
        multiplier = WEATHER_MULTIPLIERS.storm;
      } else if (weather.includes('blizzard') || weather.includes('hurricane')) {
        multiplier = WEATHER_MULTIPLIERS.extreme;
      }
      
      console.log('Weather calculation:', {
        condition: weather,
        multiplier: multiplier
      });
  
      return multiplier;
    } catch (err) {
      if (err instanceof Error) {
        console.error('Weather API Detailed Error:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          // @ts-ignore
          response: err.response?.data,
          // @ts-ignore
          status: err.response?.status
        });
      } else {
        console.error('Unknown Weather API Error:', err);
      }
      return WEATHER_MULTIPLIERS.clear;
    }
  };

  const getTrafficData = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const response = await axios.get<TrafficResponse>('https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json', {
        params: {
          point: `${startLat},${startLng}`,
          key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY
        }
      });
      
      const trafficFlow = response.data.flowSegmentData.currentSpeed / response.data.flowSegmentData.freeFlowSpeed;
      return trafficFlow < 0.5 ? 1.2 : trafficFlow < 0.8 ? 1.1 : 1.0;
    } catch (error) {
      console.error('Traffic API error:', error);
      return 1.0;
    }
  };

  const getRouteFactor = (pickup: string, delivery: string) => {
    // В будущем здесь может быть логика определения популярных маршрутов
    return ROUTE_FACTORS.regular;
  };

  const calculatePrice = async () => {
    if (!pickup || !delivery) {
      setError(t.pleaseEnter);
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      if (!googleRef.current) {
        googleRef.current = await mapLoader.load();
      }
  
      const service = new googleRef.current.maps.DistanceMatrixService();
      const geocoder = new googleRef.current.maps.Geocoder();
  
      const [pickupGeo, deliveryGeo] = await Promise.all([
        geocoder.geocode({ address: pickup }),
        geocoder.geocode({ address: delivery })
      ]);
  
      const pickupLocation = pickupGeo.results[0].geometry.location;
      const deliveryLocation = deliveryGeo.results[0].geometry.location;
  
      const response = await service.getDistanceMatrix({
        origins: [pickup],
        destinations: [delivery],
        travelMode: googleRef.current.maps.TravelMode.DRIVING,
        unitSystem: googleRef.current.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      });
  
      if (response.rows[0].elements[0].status === 'OK') {
        const distanceInMiles = response.rows[0].elements[0].distance.value / 1609.34;
        setDistance(Math.round(distanceInMiles));
        
        // 1. Получаем базовую цену
        const baseRates = getBaseRate(distanceInMiles, transportType);
        const basePrice = (baseRates.min + baseRates.max) / 2;
        
        // 2. Получаем основные множители
        const weatherMultiplier = await getWeatherData(
          pickupLocation.lat(), 
          pickupLocation.lng()
        ).catch(() => 1.0);
        
        const trafficMultiplier = await getTrafficData(
          pickupLocation.lat(),
          pickupLocation.lng(),
          deliveryLocation.lat(),
          deliveryLocation.lng()
        ).catch(() => 1.0);
  
        const seasonalMultiplier = getSeasonalMultiplier(new Date());
        
        // 3. Рассчитываем основной множитель
        const mainMultiplier = VEHICLE_VALUE_TYPES[vehicleValue].multiplier * 
                             weatherMultiplier * 
                             trafficMultiplier * 
                             seasonalMultiplier;
  
        // 4. Рассчитываем множитель дополнительных услуг
        const additionalServicesMultiplier = 1.0 + 
          (premiumEnhancements ? 0.3 : 0) +
          (specialLoad ? 0.3 : 0) +
          (inoperable ? 0.3 : 0);
  
        // 5. Логируем все компоненты цены для отладки
        console.log('Price Components:', {
          basePrice: basePrice,
          mainMultipliers: {
            vehicle: VEHICLE_VALUE_TYPES[vehicleValue].multiplier,
            weather: weatherMultiplier,
            traffic: trafficMultiplier,
            seasonal: seasonalMultiplier,
            totalMain: mainMultiplier
          },
          additionalServices: {
            premium: premiumEnhancements ? 0.3 : 0,
            special: specialLoad ? 0.3 : 0,
            inoperable: inoperable ? 0.3 : 0,
            totalAdditional: additionalServicesMultiplier - 1.0
          },
          calculation: `${basePrice} * ${mainMultiplier} * ${additionalServicesMultiplier}`
        });
  
        // 6. Рассчитываем финальную цену
        const finalPrice = basePrice * mainMultiplier * additionalServicesMultiplier;
  
        // 7. Округляем и устанавливаем цену
        setPrice(Math.round(finalPrice * 100) / 100);
      } else {
        throw new Error('Unable to calculate distance');
      }
    } catch (err) {
      console.error('Calculation error:', err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Truck className="w-6 h-6 mr-2 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-gray-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="border rounded p-2 text-base text-gray-900"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="ru">Русский</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {/* Transport Type Selection */}
          <div>
            <label className="block text-base font-medium text-gray-900 mb-1">
              {t.transportType}
            </label>
            <select
              value={transportType}
              onChange={(e) => setTransportType(e.target.value as TransportType)}
              className="w-full p-2 border rounded text-gray-900"
            >
              {Object.entries(TRANSPORT_TYPES).map(([type, data]) => (
                <option key={type} value={type}>
                  {data.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Value Type Selection */}
          <div>
            <label className="block text-base font-medium text-gray-900 mb-1">
              {t.vehicleType}
            </label>
            <select
              value={vehicleValue}
              onChange={(e) => setVehicleValue(e.target.value as VehicleValueType)}
              className="w-full p-2 border rounded text-gray-900"
            >
              {Object.entries(VEHICLE_VALUE_TYPES).map(([type, data]) => (
                <option key={type} value={type}>
                  {data.name}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Services */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <p className="text-base font-medium text-gray-900 mb-2">
              {t.additionalServices}
            </p>

            {/* Premium Enhancements */}
            <div className="relative group">
              <div className="flex items-center">
                <input
                type="checkbox"
                id="premiumEnhancements"
                checked={premiumEnhancements}
                onChange={(e) => {
                  if (!isPremiumRequired) {
                    setPremiumEnhancements(e.target.checked);
                  }
                }}
                disabled={isPremiumRequired}
                className={`w-4 h-4 text-blue-600 rounded border-gray-300 
                  ${isPremiumRequired ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                  <label 
                  htmlFor="premiumEnhancements" 
                  className={`ml-2 text-sm text-gray-900 flex items-center
                    ${isPremiumRequired ? 'opacity-60' : ''}`}
                    >
                      {ADDITIONAL_SERVICES.premiumEnhancements.name}
                      <AlertCircle className="ml-1 w-4 h-4 text-gray-400" />
                      {isPremiumRequired && (
                        <span className="ml-2 text-xs text-blue-600">
                          (Required for high-value vehicles)
                          </span>
                        )}
                        </label>
                        </div>
                      <div className="absolute hidden group-hover:block z-10 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl -top-2 left-full ml-2">
                        <div className="font-medium mb-1">{t.info}:</div>
                        <ul className="list-disc pl-4 space-y-1">
                      {ADDITIONAL_SERVICES.premiumEnhancements.tooltip?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
              </ul>
            </div>
          </div>

            {/* Special Load */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="specialLoad"
                checked={specialLoad}
                onChange={(e) => setSpecialLoad(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="specialLoad" className="ml-2 text-sm text-gray-900">
                {ADDITIONAL_SERVICES.specialLoad.name}
              </label>
            </div>

            {/* Inoperable */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inoperable"
                checked={inoperable}
                onChange={(e) => setInoperable(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="inoperable" className="ml-2 text-sm text-gray-900">
                {ADDITIONAL_SERVICES.inoperable.name}
              </label>
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="block text-base font-medium text-gray-900 mb-1">
              {t.pickup}
            </label>
            <input
              ref={pickupInputRef}
              type="text"
              className="w-full p-2 border rounded text-gray-900 placeholder-gray-500"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder={t.enterAddress}
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-900 mb-1">
              {t.delivery}
            </label>
            <input
              ref={deliveryInputRef}
              type="text"
              className="w-full p-2 border rounded text-gray-900 placeholder-gray-500"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              placeholder={t.enterAddress}
            />
          </div>

          <button
            onClick={calculatePrice}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.calculating}
              </>
            ) : (
              t.calculate
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          {distance && price && (
            <div className="mt-4 p-4 bg-green-50 rounded space-y-2">
              <p className="text-center text-gray-900">
                {t.distance}: <span className="font-bold">{distance} {t.miles}</span>
              </p>
              <p className="text-center text-gray-900">
                {t.price}: <span className="font-bold">${price}</span>
              </p>
              <p className="text-xs text-center text-gray-600 mt-2">
                * The final price may vary slightly and will be confirmed by our operator. The quoted price accounts for current weather, traffic conditions, and seasonal factors.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}