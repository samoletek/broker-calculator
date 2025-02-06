export interface WeatherResponse {
  current: {
    condition: {
      text: string;
      code: number;
    };
    temp_c: number;
    temp_f: number;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        condition: {
          text: string;
          code: number;
        };
      };
    }>;
  };
}

export interface WeatherTestResponse {
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
    address_components: Array<{
      short_name: string;
      types: string[];
    }>;
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
      duration?: {
        value: number;
        text: string;
      };
    }>;
  }>;
}

export interface ApiTestResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}