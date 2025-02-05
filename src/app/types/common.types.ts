export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SavedCalculation {
  finalPrice: number;
  basePrice: number;
  date: string;
  savedAt: string;
}

export interface SavedToast {
  show: boolean;
  message: string;
  type?: 'success' | 'error';
}

export interface BasePriceBreakdown {
  ratePerMile: number;
  distance: number;
  total: number;
}

export interface RoutePoint {
  location: string;
  coordinates: GeoPoint;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface AutoShowEvent {
  name: string;
  location: GeoPoint;
  dates: DateRange;
  distance: number;
}
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}