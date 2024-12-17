// src/types/api.ts

// Базовые типы ответов API
export interface WeatherResponse {
    current: {
      condition: {
        text: string;
        code: number;
      };
      temp_c: number;
      temp_f: number;
    };
  }

  export interface WeatherAPIResponse {
    current: {
      condition: {
        text: string;
        code: number;
      };
      temp_c: number;
    };
  }

  export interface TrafficResponse {
  flowSegmentData: {
    currentSpeed: number;
    freeFlowSpeed: number;
  };
}
  
  export interface GoogleGeocodingResponse {
    results: Array<{
      geometry: {
        location: {
          lat: number;
          lng: number;
        };
      };
    }>;
    status: string;
  }
  
  export interface GoogleDistanceResponse {
    rows: Array<{
      elements: Array<{
        status: string;
        distance?: {
          value: number;
          text: string;
        };
      }>;
    }>;
  }
  
  // Типы для тестовых ответов
  export interface WeatherTestResponse {
    current: {
      condition: {
        text: string;
      };
      temp_c: number;
    };
  }
  
  export interface ApiTestResult<T> {
    success: boolean;
    data?: T;
    error?: string;
  }