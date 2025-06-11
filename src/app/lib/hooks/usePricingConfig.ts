import { useState, useEffect, useCallback } from 'react';
import { PricingConfig, EdgeConfigResponse } from '../../../types/pricing-config.types';
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

      const response = await fetch('/api/pricing-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Добавляем cache busting для получения актуальных данных
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: EdgeConfigResponse = await response.json();

      if (result.success && result.data) {
        setConfig(result.data);
        setVersion(result.version || result.data.version);
      } else {
        throw new Error(result.error || 'Failed to fetch pricing configuration');
      }
    } catch (err) {
      console.error('Error fetching pricing config:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
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
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : '';

    if (!baseUrl) {
      console.warn('No base URL available for server-side config fetch, using default');
      return DEFAULT_PRICING_CONFIG;
    }

    const response = await fetch(`${baseUrl}/api/pricing-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: EdgeConfigResponse = await response.json();

    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to fetch pricing configuration');
    }
  } catch (error) {
    console.error('Error fetching server-side pricing config:', error);
    return DEFAULT_PRICING_CONFIG;
  }
}