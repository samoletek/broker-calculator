import { PricingConfig } from '../../../../types/pricing-config.types';

interface EIAFuelPrice {
  duoarea: string;
  stateDescription: string;
  value: number;
  period: string;
}

interface EIAResponse {
  response: {
    data: EIAFuelPrice[];
  };
}

// Map US states to PADD (Petroleum Administration for Defense District) codes
const STATE_TO_PADD: Record<string, string> = {
  'CT': 'R1X', 'ME': 'R1X', 'MA': 'R1X', 'NH': 'R1X', 'RI': 'R1X', 'VT': 'R1X', // PADD 1A (New England)
  'DE': 'R1Y', 'DC': 'R1Y', 'MD': 'R1Y', 'NJ': 'R1Y', 'NY': 'R1Y', 'PA': 'R1Y', // PADD 1B (Central Atlantic)
  'FL': 'R1Z', 'GA': 'R1Z', 'NC': 'R1Z', 'SC': 'R1Z', 'VA': 'R1Z', 'WV': 'R1Z', // PADD 1C (Lower Atlantic)
  'IL': 'R20', 'IN': 'R20', 'IA': 'R20', 'KS': 'R20', 'KY': 'R20', 'MI': 'R20', // PADD 2 (Midwest)
  'MN': 'R20', 'MO': 'R20', 'NE': 'R20', 'ND': 'R20', 'OH': 'R20', 'OK': 'R20',
  'SD': 'R20', 'TN': 'R20', 'WI': 'R20',
  'AL': 'R30', 'AR': 'R30', 'LA': 'R30', 'MS': 'R30', 'NM': 'R30', 'TX': 'R30', // PADD 3 (Gulf Coast)
  'CO': 'R40', 'ID': 'R40', 'MT': 'R40', 'UT': 'R40', 'WY': 'R40', // PADD 4 (Rocky Mountain)
  'AK': 'R50', 'AZ': 'R50', 'CA': 'R50', 'HI': 'R50', 'NV': 'R50', 'OR': 'R50', 'WA': 'R50' // PADD 5 (West Coast)
};

// Extract states from route using Google Maps geocoding
const getRouteStates = async (
  directionsResult: google.maps.DirectionsResult,
  google: typeof window.google
): Promise<string[]> => {
  const states = new Set<string>();
  const geocoder = new google.maps.Geocoder();
  
  try {
    const route = directionsResult.routes[0];
    const steps = route.legs[0].steps;
    
    // Sample points along the route
    const samplePoints = [
      route.legs[0].start_location,
      ...steps.slice(0, Math.min(steps.length, 10)).map(step => step.start_location),
      route.legs[0].end_location
    ];
    
    const geocodePromises = samplePoints.map(async point => {
      try {
        const response = await geocoder.geocode({ location: point });
        return response.results[0]?.address_components || [];
      } catch (error) {
        console.warn('Geocoding error:', error);
        return [];
      }
    });
    
    const results = await Promise.all(geocodePromises);
    
    results.forEach(addressComponents => {
      const stateComponent = addressComponents.find(component =>
        component.types.includes('administrative_area_level_1')
      );
      if (stateComponent) {
        states.add(stateComponent.short_name);
      }
    });
    
    // Convert states to PADD codes
    const paddCodes = new Set<string>();
    states.forEach(state => {
      const paddCode = STATE_TO_PADD[state];
      if (paddCode) {
        paddCodes.add(paddCode);
      }
    });
    
    return Array.from(paddCodes);
  } catch (error) {
    console.error('Error extracting route states:', error);
    return [];
  }
};

// Get diesel prices from EIA API using PADD codes
const getEIADieselPrices = async (
  paddCodes: string[],
  startDate: string,
  endDate: string
): Promise<EIAFuelPrice[]> => {
  if (paddCodes.length === 0) return [];
  
  try {
    const paddParams = paddCodes.map(padd => `facets[duoarea][]=${padd}`).join('&');
    const url = `https://api.eia.gov/v2/petroleum/pri/gnd/data?api_key=${process.env.EIA_API_KEY}&frequency=weekly&data[]=value&${paddParams}&start=${startDate}&end=${endDate}&sort[0][column]=period&sort[0][direction]=desc`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`EIA API error: ${response.status}`);
    }
    
    const data: EIAResponse = await response.json();
    return data.response.data || [];
  } catch (error) {
    console.error('Error fetching EIA data:', error);
    return [];
  }
};

export const getFuelPriceMultiplier = async (
  directionsResult: google.maps.DirectionsResult,
  google: typeof window.google,
  config: PricingConfig
): Promise<number> => {
  try {
    // Extract real PADD codes from the route
    const routePaddCodes = await getRouteStates(directionsResult, google);
    
    if (routePaddCodes.length === 0) {
      console.warn('No PADD regions found on route, using neutral fuel multiplier');
      return 1.0;
    }
    
    // Get current date and date one month ago
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
    
    // Get current and historical prices
    const [currentPrices, historicalPrices] = await Promise.all([
      getEIADieselPrices(routePaddCodes, currentDateStr, currentDateStr),
      getEIADieselPrices(routePaddCodes, oneMonthAgoStr, oneMonthAgoStr)
    ]);
    
    if (currentPrices.length === 0 || historicalPrices.length === 0) {
      console.warn('Insufficient fuel price data, using neutral multiplier');
      return 1.0;
    }
    
    // Calculate average prices
    const avgCurrentPrice = currentPrices.reduce((sum, p) => sum + p.value, 0) / currentPrices.length;
    const avgHistoricalPrice = historicalPrices.reduce((sum, p) => sum + p.value, 0) / historicalPrices.length;
    
    // If current prices are more than 5% higher than historical, apply multiplier
    const priceIncrease = (avgCurrentPrice - avgHistoricalPrice) / avgHistoricalPrice;
    
    if (priceIncrease > 0.05) {
      console.log(`Fuel prices increased by ${(priceIncrease * 100).toFixed(1)}%, applying multiplier`);
      return config.fuel.highPriceMultiplier;
    }
    
    return 1.0;
  } catch (error) {
    console.error('Error calculating fuel price multiplier:', error);
    return 1.0; // Neutral multiplier on error
  }
};

// Legacy function - keeping for backwards compatibility  
export const checkFuelPrices = async (
  directionsResult: google.maps.DirectionsResult,
  google: typeof window.google,
  config: PricingConfig
): Promise<number | null> => {
  const multiplier = await getFuelPriceMultiplier(directionsResult, google, config);
  return multiplier;
};