import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';
import { APIErrorHandler } from '@/app/lib/utils/api/errorHandler';

interface TollCalculationRequest {
  origin: string;
  destination: string;
  distance: number; // в милях
  route?: {
    legs: Array<{
      start_location: { lat: number; lng: number };
      end_location: { lat: number; lng: number };
    }>;
    overview_polyline: {
      points: string;
    };
  };
}

interface TollSegment {
  location: string;
  cost: number;
  details?: string;
}

// Основные платные дороги в США с примерными тарифами
const MAJOR_TOLL_ROADS = [
  // I-95 Corridor (East Coast)
  { name: 'I-95 Delaware Turnpike', state: 'DE', costPerMile: 0.15, lat: 39.5, lng: -75.5 },
  { name: 'I-95 Maryland House', state: 'MD', costPerMile: 0.08, lat: 39.3, lng: -76.0 },
  { name: 'I-95 North Carolina', state: 'NC', costPerMile: 0.05, lat: 35.5, lng: -78.5 },
  
  // Florida
  { name: 'Florida Turnpike', state: 'FL', costPerMile: 0.12, lat: 27.5, lng: -80.5 },
  { name: 'Alligator Alley (I-75)', state: 'FL', costPerMile: 0.25, lat: 26.1, lng: -80.8 },
  
  // Texas
  { name: 'Sam Houston Tollway', state: 'TX', costPerMile: 0.18, lat: 29.7, lng: -95.4 },
  { name: 'Dallas North Tollway', state: 'TX', costPerMile: 0.20, lat: 32.8, lng: -96.8 },
  
  // Illinois
  { name: 'Illinois Tollway (I-90)', state: 'IL', costPerMile: 0.15, lat: 41.9, lng: -87.9 },
  { name: 'Illinois Tollway (I-294)', state: 'IL', costPerMile: 0.12, lat: 41.8, lng: -87.8 },
  
  // New York/New Jersey
  { name: 'New Jersey Turnpike', state: 'NJ', costPerMile: 0.13, lat: 40.3, lng: -74.5 },
  { name: 'Garden State Parkway', state: 'NJ', costPerMile: 0.10, lat: 40.1, lng: -74.2 },
  { name: 'New York Thruway (I-87)', state: 'NY', costPerMile: 0.09, lat: 42.5, lng: -73.8 },
  
  // Pennsylvania
  { name: 'Pennsylvania Turnpike (I-76)', state: 'PA', costPerMile: 0.16, lat: 40.3, lng: -76.8 },
  { name: 'Pennsylvania Turnpike (I-276)', state: 'PA', costPerMile: 0.14, lat: 40.1, lng: -75.2 },
  
  // Ohio
  { name: 'Ohio Turnpike (I-80)', state: 'OH', costPerMile: 0.07, lat: 41.3, lng: -82.5 },
  
  // Indiana
  { name: 'Indiana Toll Road (I-90)', state: 'IN', costPerMile: 0.08, lat: 41.6, lng: -87.0 },
  
  // Massachusetts
  { name: 'Massachusetts Turnpike (I-90)', state: 'MA', costPerMile: 0.12, lat: 42.3, lng: -71.8 },
  
  // California
  { name: 'SR-91 Express Lanes', state: 'CA', costPerMile: 0.35, lat: 33.9, lng: -117.9 },
  { name: 'I-15 Express Lanes', state: 'CA', costPerMile: 0.30, lat: 33.1, lng: -117.1 },
];

// Расчет расстояния между точками
function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 3959; // Радиус Земли в милях
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Получение штатов из адресов
async function getStatesFromRoute(origin: string, destination: string): Promise<string[]> {
  try {
    const [originResponse, destResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/maps/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: origin })
      }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/maps/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: destination })
      })
    ]);

    const [originData, destData] = await Promise.all([
      originResponse.json(),
      destResponse.json()
    ]);

    const states = new Set<string>();

    if (originData.success && originData.results.length > 0) {
      const stateComponent = originData.results[0].address_components.find((c: any) => 
        c.types.includes('administrative_area_level_1')
      );
      if (stateComponent) states.add(stateComponent.short_name);
    }

    if (destData.success && destData.results.length > 0) {
      const stateComponent = destData.results[0].address_components.find((c: any) => 
        c.types.includes('administrative_area_level_1')
      );
      if (stateComponent) states.add(stateComponent.short_name);
    }

    return Array.from(states);
  } catch (error) {
    console.error('Error getting states from route:', error);
    return [];
  }
}

// Server-side proxy для расчета стоимости платных дорог
const postHandler = async (request: NextRequest) => {
  try {
    const body: TollCalculationRequest = await request.json();
    
    if (!body.origin || !body.destination || !body.distance) {
      return APIErrorHandler.handleValidationError('Origin, destination, and distance are required');
    }

    if (body.distance <= 0 || body.distance > 3000) {
      return APIErrorHandler.handleValidationError('Distance must be between 0 and 3000 miles');
    }

    console.log('Toll calculation request:', { 
      origin: body.origin, 
      destination: body.destination, 
      distance: body.distance 
    });

    // Получаем штаты маршрута
    const routeStates = await getStatesFromRoute(body.origin, body.destination);
    
    // Находим потенциальные платные дороги на маршруте
    const potentialTolls = MAJOR_TOLL_ROADS.filter(toll => 
      routeStates.includes(toll.state)
    );

    const tollSegments: TollSegment[] = [];
    let totalCost = 0;

    // Для межштатных перевозок добавляем основные платные участки
    if (routeStates.length > 1) {
      // I-95 Corridor (если маршрут проходит по восточному побережью)
      const eastCoastStates = ['FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'PA', 'NJ', 'NY', 'CT', 'RI', 'MA', 'NH', 'ME'];
      const routeOnEastCoast = routeStates.some(state => eastCoastStates.includes(state));
      
      if (routeOnEastCoast && body.distance > 200) {
        tollSegments.push({
          location: 'I-95 Corridor Tolls',
          cost: Math.min(body.distance * 0.08, 45), // Максимум $45
          details: 'Major interstate toll roads'
        });
        totalCost += tollSegments[tollSegments.length - 1].cost;
      }

      // Флорида - высокие тарифы
      if (routeStates.includes('FL')) {
        const floridaCost = Math.min(body.distance * 0.15, 35);
        tollSegments.push({
          location: 'Florida Toll Roads',
          cost: floridaCost,
          details: 'Florida Turnpike and related toll roads'
        });
        totalCost += floridaCost;
      }

      // Техас - обширная сеть платных дорог
      if (routeStates.includes('TX')) {
        const texasCost = Math.min(body.distance * 0.12, 40);
        tollSegments.push({
          location: 'Texas Toll Roads',
          cost: texasCost,
          details: 'Dallas and Houston area toll roads'
        });
        totalCost += texasCost;
      }

      // Илинойс - Chicago area
      if (routeStates.includes('IL')) {
        const illinoisCost = Math.min(body.distance * 0.10, 25);
        tollSegments.push({
          location: 'Illinois Tollway',
          cost: illinoisCost,
          details: 'Chicago area tollways'
        });
        totalCost += illinoisCost;
      }

      // Нью-Йорк/Нью-Джерси
      if (routeStates.includes('NY') || routeStates.includes('NJ')) {
        const nynyCost = Math.min(body.distance * 0.11, 30);
        tollSegments.push({
          location: 'NY/NJ Toll Roads',
          cost: nynyCost,
          details: 'New York Thruway and NJ Turnpike'
        });
        totalCost += nynyCost;
      }

      // Пенсильвания
      if (routeStates.includes('PA')) {
        const paCost = Math.min(body.distance * 0.14, 35);
        tollSegments.push({
          location: 'Pennsylvania Turnpike',
          cost: paCost,
          details: 'PA Turnpike system'
        });
        totalCost += paCost;
      }
    }

    // Базовая стоимость для коротких маршрутов в зонах с платными дорогами
    if (totalCost === 0 && potentialTolls.length > 0 && body.distance > 50) {
      const baseCost = body.distance * 0.05; // $0.05 за милю
      tollSegments.push({
        location: 'Local Toll Roads',
        cost: Math.min(baseCost, 15),
        details: 'Regional toll roads and bridges'
      });
      totalCost += tollSegments[tollSegments.length - 1].cost;
    }

    // Округляем до ближайшего доллара
    totalCost = Math.round(totalCost);
    tollSegments.forEach(segment => {
      segment.cost = Math.round(segment.cost);
    });

    console.log('Toll calculation result:', {
      routeStates,
      totalCost,
      segmentCount: tollSegments.length
    });

    return NextResponse.json({
      success: true,
      totalCost,
      segments: tollSegments,
      details: {
        routeStates,
        distance: body.distance,
        calculation: 'Based on major interstate toll roads and regional pricing'
      }
    });

  } catch (error) {
    console.error('Toll calculation proxy error:', error);
    return APIErrorHandler.handleError(error);
  }
};

export const POST = withRateLimit(postHandler, 'maps');