// src/app/lib/utils/client/leadHashUtils.ts

/**
 * Generates a unique deterministic hash for a calculation based on its parameters
 * This ensures the same calculation always produces the same hash
 */
export const generateCalculationHash = async (params: {
  pickup: string;
  delivery: string;
  selectedDate: string;
  transportType: string;
  vehicleType: string;
  vehicleValue: string;
  premiumEnhancements: boolean;
  specialLoad: boolean;
  inoperable: boolean;
  supplementaryInsurance: boolean;
  finalPrice: number;
}): Promise<string> => {
  // Normalize addresses by removing extra spaces and converting to lowercase
  const normalizedPickup = params.pickup.trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedDelivery = params.delivery.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Create a deterministic string from all parameters
  const dataString = [
    normalizedPickup,
    normalizedDelivery,
    params.selectedDate,
    params.transportType,
    params.vehicleType,
    params.vehicleValue,
    params.premiumEnhancements ? '1' : '0',
    params.specialLoad ? '1' : '0',
    params.inoperable ? '1' : '0',
    params.supplementaryInsurance ? '1' : '0',
    params.finalPrice.toFixed(2)
  ].join('|');
  
  // Use Web Crypto API for browser-compatible hashing
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.substring(0, 16); // Take first 16 characters for shorter hash
    } catch (error) {
      console.warn('Web Crypto API failed, using fallback hash:', error);
      return simpleHash(dataString);
    }
  }
  
  // Fallback for environments without Web Crypto API
  return simpleHash(dataString);
};

/**
 * Simple fallback hash function for environments without crypto support
 * Creates a deterministic hash using basic string operations
 */
const simpleHash = (str: string): string => {
  let hash = 0;
  let i, chr;
  
  if (str.length === 0) return '0000000000000000';
  
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  
  // Convert to positive hex string and pad to 16 characters
  return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
};

/**
 * Check if a calculation with this hash already exists in localStorage
 */
export const isCalculationCached = (hash: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const cachedCalculations = JSON.parse(localStorage.getItem('calculationHashes') || '[]');
    return cachedCalculations.includes(hash);
  } catch (error) {
    console.error('Error checking cached calculations:', error);
    return false;
  }
};

/**
 * Save calculation hash to localStorage
 */
export const cacheCalculationHash = (hash: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const cachedCalculations = JSON.parse(localStorage.getItem('calculationHashes') || '[]');
    if (!cachedCalculations.includes(hash)) {
      cachedCalculations.push(hash);
      // Keep only last 100 hashes to prevent localStorage from growing too large
      if (cachedCalculations.length > 100) {
        cachedCalculations.shift();
      }
      localStorage.setItem('calculationHashes', JSON.stringify(cachedCalculations));
    }
  } catch (error) {
    console.error('Error caching calculation hash:', error);
  }
};

/**
 * Get all cached calculation hashes
 */
export const getCachedCalculationHashes = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('calculationHashes') || '[]');
  } catch (error) {
    console.error('Error getting cached calculation hashes:', error);
    return [];
  }
};

/**
 * Clear all cached calculation hashes
 */
export const clearCachedCalculationHashes = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('calculationHashes');
  } catch (error) {
    console.error('Error clearing cached calculation hashes:', error);
  }
};