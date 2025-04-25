import type { TollSegment } from '@/app/types/pricing.types';

/**
 * calculateTollCost
 * Вычисляет примерную стоимость платных дорог по маршруту и дистанции.
 * - Использует базовую ставку baseRate и корректирует её по регионам.
 * - Ограничивает итог в пределах [minCost, maxCost].
 */
export const calculateTollCost = (
  distance: number,
  mainRoute: google.maps.DirectionsRoute
): number => {
  const baseRate = 0.12;
  const minCost = Math.max(20, distance * 0.05);
  const maxCost = distance * 0.15;

  // Собираем все инструкции маршрута в единый текст
  const routeText = mainRoute.legs[0].steps
    .map(step => step.instructions.toLowerCase())
    .join(' ');

  // Определяем, через какие штаты/регионы идёт маршрут
  const states = new Set<string>();
  const stateKeywords = [
    'new jersey','nj','new york','ny','pennsylvania','pa','massachusetts','ma',
    'connecticut','ct','rhode island','ri','new hampshire','nh','vermont','vt','maine','me',
    'california','ca','oregon','or','washington','wa',
    'florida','fl','georgia','ga','south carolina','sc','north carolina','nc',
    'texas','tx','arkansas','ar','oklahoma','ok',
    'ohio','oh','indiana','in','illinois','il','michigan','mi','wisconsin','wi','minnesota','mn',
    'missouri','mo','kansas','ks','nebraska','ne','south dakota','sd','north dakota','nd',
    'colorado','co','utah','ut','arizona','az','new mexico','nm',
    'maryland','md','delaware','de','virginia','va','district of columbia','dc',
    'louisiana','la'
  ];
  stateKeywords.forEach(key => {
    const pattern = new RegExp(`\\b${key}\\b`);
    if (pattern.test(routeText)) states.add(key);
  });

  // Корректируем базовую ставку по регионам
  let adjustedRate = baseRate;
  // Northeast & New England
  if (['new jersey','nj','new york','ny','pennsylvania','pa','massachusetts','ma','connecticut','ct','rhode island','ri','new hampshire','nh','vermont','vt','maine','me']
      .some(k => states.has(k))) {
    adjustedRate *= 1.3;
  }
  // Mid-Atlantic
  if (['maryland','md','delaware','de','virginia','va','district of columbia','dc']
      .some(k => states.has(k))) {
    adjustedRate *= 1.25;
  }
  // Great Lakes / Midwest
  if (['ohio','oh','indiana','in','illinois','il','michigan','mi','wisconsin','wi','minnesota','mn']
      .some(k => states.has(k))) {
    adjustedRate *= 1.2;
  }
  // Southeast
  if (['florida','fl','georgia','ga','south carolina','sc','north carolina','nc']
      .some(k => states.has(k))) {
    adjustedRate *= 1.15;
  }
  // Texas & Southern Plains
  if (['texas','tx','arkansas','ar','oklahoma','ok']
      .some(k => states.has(k))) {
    adjustedRate *= 1.15;
  }
  // Mountain West
  if (['colorado','co','utah','ut','arizona','az','new mexico','nm']
      .some(k => states.has(k))) {
    adjustedRate *= 1.1;
  }
  // Great Plains
  if (['missouri','mo','kansas','ks','nebraska','ne','south dakota','sd','north dakota','nd']
      .some(k => states.has(k))) {
    adjustedRate *= 1.1;
  }
  // Pacific Coast
  if (['california','ca','oregon','or','washington','wa']
      .some(k => states.has(k))) {
    adjustedRate *= 1.2;
  }
  // Louisiana specific
  if (states.has('louisiana') || states.has('la')) {
    adjustedRate *= 1.2;
  }

  // Применяем скидки за большие расстояния
  let estimatedCost = distance * adjustedRate;
  if (distance > 2000) {
    estimatedCost *= 0.85;
  } else if (distance > 1000) {
    estimatedCost *= 0.9;
  }

  // Оканчательное ограничение, округление до 2 знаков
  return Math.round(Math.min(maxCost, Math.max(minCost, estimatedCost)) * 100) / 100;
};

/**
 * getRouteSegments
 * Разбивает общую сумму на региональные сегменты и "прочие".
 */
export const getRouteSegments = (
  routeResult: google.maps.DirectionsResult,
  totalCost: number
): TollSegment[] => {
  const segments: TollSegment[] = [];
  const routeText = routeResult.routes[0].legs[0].steps
    .map(step => step.instructions.toLowerCase())
    .join(' ');
  let remainingCost = totalCost;
  let anyRegionMatched = false;

  const regionSegments = [
    {
      condition: () => /\b(new jersey|nj|new york|ny|pennsylvania|pa)\b/.test(routeText),
      name: 'Northeast Region Tolls',
      details: '(I-95, NJ/NY Turnpikes)',
      multiplier: 0.35
    },
    {
      condition: () => /\b(massachusetts|ma|connecticut|ct|rhode island|ri|new hampshire|nh|vermont|vt|maine|me)\b/.test(routeText),
      name: 'New England Region Tolls',
      details: '(MA Pike, CT Toll Roads)',
      multiplier: 0.3
    },
    {
      condition: () => /\b(maryland|md|delaware|de|virginia|va|district of columbia|dc)\b/.test(routeText),
      name: 'Mid-Atlantic Region Tolls',
      details: '(MD Tolls, DE System)',
      multiplier: 0.25
    },
    {
      condition: () => /\b(ohio|oh|indiana|in|illinois|il|michigan|mi|wisconsin|wi|minnesota|mn)\b/.test(routeText),
      name: 'Great Lakes / Midwest Tolls',
      details: '(OH Turnpike, I-90, etc.)',
      multiplier: 0.4
    },
    {
      condition: () => /\b(florida|fl|georgia|ga|south carolina|sc|north carolina|nc)\b/.test(routeText),
      name: 'Southeast Region Tolls',
      details: '(SunPass, PeachPass, Palmetto)',
      multiplier: 0.2
    },
    {
      condition: () => /\b(texas|tx|arkansas|ar|oklahoma|ok)\b/.test(routeText),
      name: 'Texas & Southern Plains Tolls',
      details: '(TX Toll Roads)',
      multiplier: 0.6
    },
    {
      condition: () => /\b(colorado|co|utah|ut|arizona|az|new mexico|nm)\b/.test(routeText),
      name: 'Mountain West Tolls',
      details: '(CO/UT/AZ/NM Toll Roads)',
      multiplier: 0.5
    },
    {
      condition: () => /\b(missouri|mo|kansas|ks|nebraska|ne|south dakota|sd|north dakota|nd)\b/.test(routeText),
      name: 'Great Plains Tolls',
      details: '(KS/MO Toll Roads)',
      multiplier: 0.2
    },
    {
      condition: () => /\b(california|ca|oregon|or|washington|wa)\b/.test(routeText),
      name: 'Pacific Coast Tolls',
      details: '(CA/OR/WA Bridges & Highways)',
      multiplier: 0.8
    },
    {
      condition: () => /\b(louisiana|la)\b/.test(routeText),
      name: 'Louisiana Region Tolls',
      details: '(LA Toll Roads)',
      multiplier: 0.3
    }
  ];

  regionSegments.forEach(region => {
    if (region.condition()) {
      anyRegionMatched = true;
      const cost = Math.round(remainingCost * region.multiplier * 100) / 100;
      segments.push({ location: region.name, cost, details: region.details });
      remainingCost = Math.round((remainingCost - cost) * 100) / 100;
    }
  });

  if (remainingCost > 0) {
    segments.push({
      location: anyRegionMatched ? 'Other Regional Toll Roads' : 'General Toll Charges',
      cost: remainingCost,
      details: anyRegionMatched ? '(Various Local Tolls)' : '(Route Tolls)'
    });
  }

  return segments;
};
