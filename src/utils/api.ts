import axios from 'axios';
import { 
  WeatherTestResponse,
  TrafficResponse,
  ApiTestResult,
  GoogleGeocodingResponse
} from '@/types/api';

interface WeatherTestResult extends ApiTestResult<WeatherTestResponse> {
  condition?: string;
  temperature?: number;
}

interface TrafficTestResult extends ApiTestResult<TrafficResponse> {
  currentSpeed?: number;
  freeFlowSpeed?: number;
}

interface GoogleMapsTestResult extends ApiTestResult<GoogleGeocodingResponse> {
  location?: {
    lat: number;
    lng: number;
  } | null;
}

export const testWeatherApi = async (lat: number, lng: number): Promise<WeatherTestResult> => {
  try {
    const response = await axios.get<WeatherTestResponse>(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&q=${lat},${lng}`
    );
    console.log('Weather API Response:', response.data);
    return {
      success: true,
      data: response.data,
      condition: response.data.current.condition.text,
      temperature: response.data.current.temp_c
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const testTrafficApi = async (lat: number, lng: number): Promise<TrafficTestResult> => {
  try {
    const response = await axios.get<TrafficResponse>(
      `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${process.env.NEXT_PUBLIC_TOMTOM_API_KEY}&point=${lat},${lng}`
    );
    console.log('Traffic API Response:', response.data);
    return {
      success: true,
      data: response.data,
      currentSpeed: response.data.flowSegmentData.currentSpeed,
      freeFlowSpeed: response.data.flowSegmentData.freeFlowSpeed
    };
  } catch (error) {
    console.error('Traffic API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const testGoogleMapsApi = async (address: string): Promise<GoogleMapsTestResult> => {
  try {
    const response = await axios.get<GoogleGeocodingResponse>(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    console.log('Google Maps API Response:', response.data);
    return {
      success: true,
      data: response.data,
      location: response.data.results[0]?.geometry.location ?? null
    };
  } catch (error) {
    console.error('Google Maps API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};