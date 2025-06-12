import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';
import { APIErrorHandler } from '@/app/lib/utils/api/errorHandler';

interface FuelPricesRequest {
  origin: string;
  destination: string;
  route?: {
    legs: Array<{
      start_location: { lat: number; lng: number };
      end_location: { lat: number; lng: number };
    }>;
  };
}

// Map US states to PADD codes
const STATE_TO_PADD: Record<string, string> = {
  'CT': 'R1X', 'ME': 'R1X', 'MA': 'R1X', 'NH': 'R1X', 'RI': 'R1X', 'VT': 'R1X',
  'DE': 'R1Y', 'DC': 'R1Y', 'MD': 'R1Y', 'NJ': 'R1Y', 'NY': 'R1Y', 'PA': 'R1Y',
  'FL': 'R1Z', 'GA': 'R1Z', 'NC': 'R1Z', 'SC': 'R1Z', 'VA': 'R1Z', 'WV': 'R1Z',
  'IL': 'R20', 'IN': 'R20', 'IA': 'R20', 'KS': 'R20', 'KY': 'R20', 'MI': 'R20',
  'MN': 'R20', 'MO': 'R20', 'NE': 'R20', 'ND': 'R20', 'OH': 'R20', 'OK': 'R20',
  'SD': 'R20', 'TN': 'R20', 'WI': 'R20',
  'AL': 'R30', 'AR': 'R30', 'LA': 'R30', 'MS': 'R30', 'NM': 'R30', 'TX': 'R30',
  'CO': 'R40', 'ID': 'R40', 'MT': 'R40', 'UT': 'R40', 'WY': 'R40',
  'AK': 'R50', 'AZ': 'R50', 'CA': 'R50', 'HI': 'R50', 'NV': 'R50', 'OR': 'R50', 'WA': 'R50'
};

// Получение штатов из адресов через наш Geocoding API
async function getStatesFromAddresses(origin: string, destination: string): Promise<string[]> {
  const states = new Set<string>();
  
  try {
    // Используем наш собственный geocoding API
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

    // Извлекаем штаты из результатов
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
    console.error('Error getting states from addresses:', error);
    return ['TX']; // Fallback to Texas
  }
}

// Server-side proxy для расчета множителя цен на топливо
const postHandler = async (request: NextRequest) => {
  try {
    const body: FuelPricesRequest = await request.json();
    
    if (!body.origin || !body.destination) {
      return APIErrorHandler.handleValidationError('Origin and destination are required');
    }

    if (!process.env.EIA_API_KEY) {
      return APIErrorHandler.handleMissingConfig('EIA API Key');
    }

    console.log('Fuel prices request:', { origin: body.origin, destination: body.destination });

    // Получаем штаты маршрута
    const routeStates = await getStatesFromAddresses(body.origin, body.destination);
    
    // Конвертируем штаты в PADD коды
    const paddCodes = [...new Set(routeStates.map(state => STATE_TO_PADD[state]).filter(Boolean))];
    
    if (paddCodes.length === 0) {
      return NextResponse.json({
        success: true,
        multiplier: 1.0,
        details: {
          message: 'No PADD regions found for route',
          states: routeStates
        }
      });
    }

    // Получаем текущие и исторические цены
    const currentDate = new Date().toISOString().split('T')[0];
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const historicalDate = oneMonthAgo.toISOString().split('T')[0];

    const [currentPrices, historicalPrices] = await Promise.all([
      fetchEIAPrices(paddCodes, currentDate, currentDate),
      fetchEIAPrices(paddCodes, historicalDate, historicalDate)
    ]);

    // Вычисляем средние цены
    const currentAvg = calculateAveragePrice(currentPrices);
    const historicalAvg = calculateAveragePrice(historicalPrices);
    
    // Рассчитываем множитель на основе изменения цен
    let multiplier = 1.0;
    if (historicalAvg > 0) {
      const priceChange = (currentAvg - historicalAvg) / historicalAvg;
      
      // Применяем прогрессивную шкалу
      if (priceChange > 0.15) multiplier = 1.25; // +25% если цены выросли на 15%+
      else if (priceChange > 0.10) multiplier = 1.15; // +15% если цены выросли на 10-15%
      else if (priceChange > 0.05) multiplier = 1.10; // +10% если цены выросли на 5-10%
      else if (priceChange < -0.10) multiplier = 0.90; // -10% если цены упали на 10%+
      else if (priceChange < -0.05) multiplier = 0.95; // -5% если цены упали на 5-10%
    }

    console.log('Fuel prices calculated:', {
      paddCodes,
      currentAvg,
      historicalAvg,
      priceChange: historicalAvg > 0 ? ((currentAvg - historicalAvg) / historicalAvg * 100).toFixed(1) + '%' : 'N/A',
      multiplier
    });

    return NextResponse.json({
      success: true,
      multiplier,
      details: {
        routeStates,
        paddCodes,
        currentPrice: currentAvg,
        historicalPrice: historicalAvg,
        priceChange: historicalAvg > 0 ? (currentAvg - historicalAvg) / historicalAvg : 0
      }
    });

  } catch (error) {
    console.error('Fuel prices proxy error:', error);
    return APIErrorHandler.handleError(error);
  }
};

// Получение цен от EIA API
async function fetchEIAPrices(paddCodes: string[], startDate: string, endDate: string) {
  const eiaResponse = await fetch(
    `https://api.eia.gov/v2/petroleum/pri/gnd/data/?frequency=daily&data[0]=value&facets[duoarea][]=${paddCodes.join('&facets[duoarea][]=')}` +
    `&start=${startDate}&end=${endDate}&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=5000&api_key=${process.env.EIA_API_KEY}`
  );

  if (!eiaResponse.ok) {
    throw new Error(`EIA API responded with status: ${eiaResponse.status}`);
  }

  const data = await eiaResponse.json();
  return data.response?.data || [];
}

// Расчет средней цены
function calculateAveragePrice(prices: any[]): number {
  if (prices.length === 0) return 0;
  
  const validPrices = prices.filter(p => p.value && !isNaN(parseFloat(p.value)));
  if (validPrices.length === 0) return 0;
  
  const sum = validPrices.reduce((total, price) => total + parseFloat(price.value), 0);
  return sum / validPrices.length;
}

export const POST = withRateLimit(postHandler, 'fuel');