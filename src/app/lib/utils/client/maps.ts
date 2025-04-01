import { Loader } from '@googlemaps/js-api-loader';
import type { GeoPoint } from '@/app/types/common.types';
import { trackApiRequest } from '@/app/lib/hooks/useRateLimiter';

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

export const validateZipCode = (addressComponents: google.maps.GeocoderAddressComponent[]): boolean => {
  return addressComponents.some(
    component => component.types.includes('postal_code')
  );
};

export const isSameLocation = async (
  address1: string,
  address2: string,
  googleMaps: typeof google.maps
): Promise<boolean> => {
  try {
    // Проверяем лимит API запросов
    if (!trackApiRequest()) {
      throw new Error('API limit reached. Try again later.');
    }
    
    const geocoder = new googleMaps.Geocoder();
    const [response1, response2] = await Promise.all([
      geocoder.geocode({ address: address1 }),
      geocoder.geocode({ address: address2 })
    ]);

    if (!response1.results[0] || !response2.results[0]) {
      return false;
    }

    const location1 = response1.results[0].geometry.location;
    const location2 = response2.results[0].geometry.location;

    const distance = googleMaps.geometry.spherical.computeDistanceBetween(
      location1,
      location2
    );

    return distance < 1000;
  } catch (error) {
    console.error('Error comparing locations:', error);
    return false;
  }
};

export const validateAddress = async (
  address: string,
  googleMaps: typeof google.maps
): Promise<{ 
  isValid: boolean; 
  hasZip: boolean;
  error?: string;
  formattedAddress?: string;
  location?: google.maps.LatLng;
}> => {
  try {
    // Проверяем лимит API запросов
    if (!trackApiRequest()) {
      return { 
        isValid: false, 
        hasZip: false,
        error: 'API limit reached. Try again later.' 
      };
    }
    
    const geocoder = new googleMaps.Geocoder();
    const response = await geocoder.geocode({ address });

    if (response.results.length === 0) {
      return { 
        isValid: false, 
        hasZip: false,
        error: 'Please enter a valid address' 
      };
    }

    const result = response.results[0];
    const hasZip = validateZipCode(result.address_components);
    const isUS = result.address_components.some(
      component => component.types.includes('country') && component.short_name === 'US'
    );

    if (!isUS) {
      return {
        isValid: false,
        hasZip: hasZip,
        error: 'We only support addresses within the United States'
      };
    }

    if (!hasZip) {
      return {
        isValid: false,
        hasZip: false,
        error: 'Please include ZIP code in the address',
        formattedAddress: result.formatted_address
      };
    }

    return {
      isValid: true,
      hasZip: true,
      formattedAddress: result.formatted_address,
      location: result.geometry.location
    };
  } catch (error) {
    console.error('Error validating address:', error);
    return {
      isValid: false,
      hasZip: false,
      error: 'Error validating address. Please try again.'
    };
  }
};

export const calculateDistance = (point1: GeoPoint, point2: GeoPoint): number => {
  if (!window.google) return 0;
  
  const p1 = new google.maps.LatLng(point1.lat, point1.lng);
  const p2 = new google.maps.LatLng(point2.lat, point2.lng);
  
  return google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1609.34;
};

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