import { useState, useEffect, useCallback } from 'react';
import { get } from '@vercel/edge-config';
import { PricingConfig } from '../../../types/pricing-config.types';
import { DEFAULT_PRICING_CONFIG } from '../../../constants/default-pricing-config';

interface UsePricingConfigResult {
  config: PricingConfig;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  version: string;
}

export function usePricingConfig(): UsePricingConfigResult {
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(DEFAULT_PRICING_CONFIG.version);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Получаем конфигурацию напрямую из Edge Config (клиентская сторона)
      const config = await get<PricingConfig>('pricing-config');
      
      if (config) {
        setConfig(config);
        setVersion(config.version);
      } else {
        // Если конфигурации нет в Edge Config, используем дефолтную
        setConfig(DEFAULT_PRICING_CONFIG);
        setVersion(DEFAULT_PRICING_CONFIG.version);
      }
    } catch (err) {
      console.error('Error fetching pricing config from Edge Config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pricing configuration');
      // В случае ошибки используем дефолтную конфигурацию
      setConfig(DEFAULT_PRICING_CONFIG);
      setVersion(DEFAULT_PRICING_CONFIG.version);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshConfig = useCallback(async () => {
    await fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    refreshConfig,
    version
  };
}

// Хелпер для получения конфигурации на сервере (для SSR)
export async function getPricingConfigServer(): Promise<PricingConfig> {
  try {
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