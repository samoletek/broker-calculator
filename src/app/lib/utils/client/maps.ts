import { Loader } from '@googlemaps/js-api-loader';
import type { GeoPoint } from '@/app/types/common.types';

export const initializeGoogleMaps = async (): Promise<typeof google.maps> => {
  try {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: "weekly",
      libraries: ["places", "geometry", "routes"],
      channel: 'broker-calculator'
    });
    
    await loader.load();
    return window.google.maps;
  } catch (error) {
    console.error('Error initializing Google Maps:', error);
    throw error;
  }
};

// Combined address validation functions
export const isValidUSAddress = async (
  address: string, 
  googleMaps: typeof google.maps
): Promise<boolean> => {
  try {
    const geocoder = new googleMaps.Geocoder();
    const response = await geocoder.geocode({ address });

    if (response.results.length === 0) return false;

    return response.results[0].address_components.some(
      component => component.types.includes('country') && component.short_name === 'US'
    );
  } catch (error) {
    console.error('Error validating address:', error);
    return false;
  }
};

export const calculateDistance = (point1: GeoPoint, point2: GeoPoint): number => {
  if (!window.google) return 0;
  
  const p1 = new google.maps.LatLng(point1.lat, point1.lng);
  const p2 = new google.maps.LatLng(point2.lat, point2.lng);
  
  return google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1609.34;
};

// Новые утилиты для работы с адресами
export const formatAddress = (addressComponents: google.maps.GeocoderAddressComponent[]): string => {
  const componentMap: { [key: string]: string } = {};
  
  addressComponents.forEach(component => {
    const type = component.types[0];
    componentMap[type] = component.long_name;
  });
  
  return `${componentMap['street_number'] || ''} ${componentMap['route'] || ''}, ${
    componentMap['locality'] || componentMap['sublocality'] || ''
  }, ${componentMap['administrative_area_level_1'] || ''} ${
    componentMap['postal_code'] || ''
  }`.trim();
};

export const extractStateFromAddress = (addressComponents: google.maps.GeocoderAddressComponent[]): string | null => {
  const stateComponent = addressComponents.find(
    component => component.types.includes('administrative_area_level_1')
  );
  return stateComponent ? stateComponent.short_name : null;
};

export const isValidZipCode = (zipCode: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test(zipCode);
};