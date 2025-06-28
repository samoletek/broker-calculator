import { get } from '@vercel/edge-config';
import { PricingConfig } from '../../../types/pricing-config.types';
import { DEFAULT_PRICING_CONFIG } from '../../../constants/default-pricing-config';

// Хелпер для получения конфигурации на сервере (для SSR)
export async function getPricingConfigServer(): Promise<PricingConfig> {
  try {
    // Check if Edge Config is properly configured
    if (!process.env.EDGE_CONFIG) {
      console.warn('EDGE_CONFIG environment variable not set, using default pricing config');
      return DEFAULT_PRICING_CONFIG;
    }

    // Получаем конфигурацию напрямую из Edge Config (серверная сторона)
    const config = await get<PricingConfig>('pricing-config');
    
    if (config) {
      return config;
    } else {
      console.warn('No pricing config found in Edge Config, using default');
      return DEFAULT_PRICING_CONFIG;
    }
  } catch (error) {
    console.error('Error fetching server-side pricing config from Edge Config:', error);
    return DEFAULT_PRICING_CONFIG;
  }
}