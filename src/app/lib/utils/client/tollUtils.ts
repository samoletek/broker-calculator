import type { TollSegment } from '@/app/types/pricing.types';
import { PricingConfig } from '../../../../types/pricing-config.types';

/**
 * calculateTollCost
 * Вычисляет примерную стоимость платных дорог по маршруту и дистанции.
 * - Использует базовую ставку baseRate и корректирует её по регионам.
 * - Ограничивает итог в пределах [minCost, maxCost].
 */
// DEPRECATED: Функция использует Google Maps типы
// Заменена на server-side API /api/tolls/calculate
export const calculateTollCost = (
  distance: number,
  mainRoute: import('@/app/types/maps.types').DirectionsRoute,
  config: PricingConfig
): number => {
  const baseRate = config.tolls.baseTollRate;
  const minCost = Math.max(config.tolls.minCostBase, distance * config.tolls.minCostMultiplier);
  const maxCost = distance * config.tolls.maxCostMultiplier;

  // DEPRECATED: Обработка route instructions перенесена на сервер
  console.warn('calculateTollCost deprecated - use /api/tolls/calculate');
  const routeText = mainRoute.summary.toLowerCase();

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

  // Корректируем базовую ставку по регионам используя динамическую конфигурацию
  let adjustedRate = baseRate;
  const multipliers = config.tolls.regionalMultipliers;
  
  // Northeast & New England
  if (['new jersey','nj','new york','ny','pennsylvania','pa','massachusetts','ma','connecticut','ct','rhode island','ri','new hampshire','nh','vermont','vt','maine','me']
      .some(k => states.has(k))) {
    adjustedRate *= multipliers.northeast;
  }
  // Mid-Atlantic
  if (['maryland','md','delaware','de','virginia','va','district of columbia','dc']
      .some(k => states.has(k))) {
    adjustedRate *= multipliers.midAtlantic;
  }
  // Great Lakes / Midwest
  if (['ohio','oh','indiana','in','illinois','il','michigan','mi','wisconsin','wi','minnesota','mn']
      .some(k => states.has(k))) {
    adjustedRate *= multipliers.greatLakesMidwest;
  }
  // Southeast
  if (['florida','fl','georgia','ga','south carolina','sc','north carolina','nc']
      .some(k => states.has(k))) {
    adjustedRate *= multipliers.southeast;
  }
  // Texas & Southern Plains
  if (['texas','tx','arkansas','ar','oklahoma','ok']
      .some(k => states.has(k))) {
    adjustedRate *= multipliers.texasSouthernPlains;
  }
  // Mountain West
  if (['colorado','co','utah','ut','arizona','az','new mexico','nm']
      .some(k => states.has(k))) {
    adjustedRate *= multipliers.mountainWest;
  }
  // Great Plains
  if (['missouri','mo','kansas','ks','nebraska','ne','south dakota','sd','north dakota','nd']
      .some(k => states.has(k))) {
    adjustedRate *= multipliers.greatPlains;
  }
  // Pacific Coast
  if (['california','ca','oregon','or','washington','wa']
      .some(k => states.has(k))) {
    adjustedRate *= multipliers.pacificCoast;
  }
  // Louisiana specific
  if (states.has('louisiana') || states.has('la')) {
    adjustedRate *= multipliers.louisiana;
  }

  // Применяем скидки за большие расстояния используя динамическую конфигурацию
  let estimatedCost = distance * adjustedRate;
  const discounts = config.tolls.distanceDiscounts;
  
  if (distance > 2000) {
    estimatedCost *= discounts.over2000Miles;
  } else if (distance > 1000) {
    estimatedCost *= discounts.over1000Miles;
  }

  // Оканчательное ограничение, округление до 2 знаков
  return Math.round(Math.min(maxCost, Math.max(minCost, estimatedCost)) * 100) / 100;
};

/**
 * getRouteSegments
 * Разбивает общую сумму на региональные сегменты и "прочие".
 */
// DEPRECATED: Функция использует Google Maps типы
// Заменена на server-side API /api/tolls/calculate
export const getRouteSegments = (
  routeResult: import('@/app/types/maps.types').DirectionsResult,
  totalCost: number,
  config: PricingConfig
): TollSegment[] => {
  const segments: TollSegment[] = [];
  // DEPRECATED: Route analysis перенесен на сервер
  console.warn('getRouteSegments deprecated - use /api/tolls/calculate');
  const routeText = routeResult.routes[0].summary.toLowerCase();
  let remainingCost = totalCost;
  let anyRegionMatched = false;

  const portions = config.tolls.regionalPortions;
  
  const regionSegments = [
    {
      condition: () => /\b(new jersey|nj|new york|ny|pennsylvania|pa)\b/.test(routeText),
      name: 'Northeast Region Tolls',
      details: '(I-95, NJ/NY Turnpikes)',
      multiplier: portions.northeast
    },
    {
      condition: () => /\b(massachusetts|ma|connecticut|ct|rhode island|ri|new hampshire|nh|vermont|vt|maine|me)\b/.test(routeText),
      name: 'New England Region Tolls',
      details: '(MA Pike, CT Toll Roads)',
      multiplier: portions.newEngland
    },
    {
      condition: () => /\b(maryland|md|delaware|de|virginia|va|district of columbia|dc)\b/.test(routeText),
      name: 'Mid-Atlantic Region Tolls',
      details: '(MD Tolls, DE System)',
      multiplier: portions.midAtlantic
    },
    {
      condition: () => /\b(ohio|oh|indiana|in|illinois|il|michigan|mi|wisconsin|wi|minnesota|mn)\b/.test(routeText),
      name: 'Great Lakes / Midwest Tolls',
      details: '(OH Turnpike, I-90, etc.)',
      multiplier: portions.greatLakesMidwest
    },
    {
      condition: () => /\b(florida|fl|georgia|ga|south carolina|sc|north carolina|nc)\b/.test(routeText),
      name: 'Southeast Region Tolls',
      details: '(SunPass, PeachPass, Palmetto)',
      multiplier: portions.southeast
    },
    {
      condition: () => /\b(texas|tx|arkansas|ar|oklahoma|ok)\b/.test(routeText),
      name: 'Texas & Southern Plains Tolls',
      details: '(TX Toll Roads)',
      multiplier: portions.texasSouthernPlains
    },
    {
      condition: () => /\b(colorado|co|utah|ut|arizona|az|new mexico|nm)\b/.test(routeText),
      name: 'Mountain West Tolls',
      details: '(CO/UT/AZ/NM Toll Roads)',
      multiplier: portions.mountainWest
    },
    {
      condition: () => /\b(missouri|mo|kansas|ks|nebraska|ne|south dakota|sd|north dakota|nd)\b/.test(routeText),
      name: 'Great Plains Tolls',
      details: '(KS/MO Toll Roads)',
      multiplier: portions.greatPlains
    },
    {
      condition: () => /\b(california|ca|oregon|or|washington|wa)\b/.test(routeText),
      name: 'Pacific Coast Tolls',
      details: '(CA/OR/WA Bridges & Highways)',
      multiplier: portions.pacificCoast
    },
    {
      condition: () => /\b(louisiana|la)\b/.test(routeText),
      name: 'Louisiana Region Tolls',
      details: '(LA Toll Roads)',
      multiplier: portions.louisiana
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
