import type { TollSegment } from '@/app/types/pricing.types';

export const calculateTollCost = (distance: number, mainRoute: google.maps.DirectionsRoute) => {
  const baseRate = 0.12;
  const minCost = Math.max(20, distance * 0.05);
  const maxCost = distance * 0.15;

  const states = new Set<string>();
  mainRoute.legs[0].steps.forEach(step => {
    const instructions = step.instructions.toLowerCase();
    if (instructions.includes('entering')) {
      [' ny', ' nj', ' pa', ' fl', ' ca', ' il', ' in', ' oh'].forEach(state => {
        if (instructions.includes(state)) {
          states.add(state.trim());
        }
      });
    }
  });

  let adjustedRate = baseRate;
  if (states.has('ny') || states.has('nj') || states.has('pa')) {
    adjustedRate *= 1.3;
  }
  if (states.has('ca')) {
    adjustedRate *= 1.2;
  }
  if (states.has('fl')) {
    adjustedRate *= 1.1;
  }

  let estimatedCost = distance * adjustedRate;

  if (distance > 1000) {
    estimatedCost *= 0.9;
  }
  if (distance > 2000) {
    estimatedCost *= 0.85;
  }

  return Math.round(Math.min(maxCost, Math.max(minCost, estimatedCost)) * 100) / 100;
};

export const getRouteSegments = (route: google.maps.DirectionsResult, totalCost: number): TollSegment[] => {
  const segments: TollSegment[] = [];
  const routeText = route.routes[0].legs[0].steps
    .map(step => step.instructions.toLowerCase())
    .join(' ');
  let remainingCost = totalCost;
  let anyRegionMatched = false;

  const regionSegments = [
    {
      condition: () => 
        routeText.includes('new jersey') || 
        routeText.includes('new york') || 
        routeText.includes('i-95') ||
        routeText.includes('nj') ||
        routeText.includes('ny'),
      name: "Northeast Region Tolls",
      details: "(I-95, NJ/NY Turnpikes)",
      multiplier: 0.35
    },
    {
      condition: () => 
        routeText.includes('i-80') || 
        routeText.includes('i-90') || 
        routeText.includes('pennsylvania') ||
        routeText.includes('illinois') ||
        routeText.includes('indiana') ||
        routeText.includes('ohio'),
      name: "Midwest Region Tolls",
      details: "(I-80/90, OH/IN/IL Tolls)",
      multiplier: 0.4
    },
    {
      condition: () => 
        routeText.includes('california') || 
        routeText.includes('san francisco') ||
        routeText.includes('los angeles') ||
        routeText.includes('ca'),
      name: "West Coast Tolls",
      details: "(CA Bridges and Highways)",
      multiplier: 0.8
    },
    {
      condition: () => 
        routeText.includes('florida') || 
        routeText.includes('miami') ||
        routeText.includes('fl') ||
        routeText.includes('orlando') ||
        routeText.includes('tampa'),
      name: "Florida Region Tolls",
      details: "(FL Turnpike and Express Lanes)",
      multiplier: 0.7
    }
  ];

  regionSegments.forEach(region => {
    if (region.condition()) {
      anyRegionMatched = true;
      const regionCost = Math.round(remainingCost * region.multiplier * 100) / 100;
      segments.push({
        location: region.name,
        cost: regionCost,
        details: region.details
      });
      remainingCost -= regionCost;
    }
  });

  if (remainingCost > 0) {
    segments.push({
      location: "Other Regional Toll Roads",
      cost: Math.round(remainingCost * 100) / 100,
      details: "(Various Local Tolls)"
    });
  }
  
  if (!anyRegionMatched && totalCost > 0) {
    segments.push({
      location: "General Toll Charges",
      cost: totalCost,
      details: "(Route Tolls)"
    });
  }

  return segments;
};