// Собственные типы для maps API (заменяют google.maps типы)

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface RouteLocation {
  lat: number;
  lng: number;
}

export interface RouteLeg {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  start_address: string;
  end_address: string;
  start_location: RouteLocation;
  end_location: RouteLocation;
}

export interface DirectionsRoute {
  legs: RouteLeg[];
  overview_polyline: { points: string };
  summary: string;
}

export interface DirectionsResult {
  routes: DirectionsRoute[];
}

export interface RouteInfo {
  isPopularRoute: boolean;
  isRemoteArea: boolean;
  trafficConditions: {
    status: 'light' | 'moderate' | 'heavy';
    delay: number;
  };
  estimatedTime: string;
}