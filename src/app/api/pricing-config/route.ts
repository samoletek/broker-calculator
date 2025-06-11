import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import { PricingConfig, EdgeConfigResponse, PricingConfigHistory } from '../../../types/pricing-config.types';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', 'https://www.brokercalculator.xyz');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// Helper function to save config to history
async function saveConfigToHistory(config: PricingConfig) {
  try {
    const historyEntry: PricingConfigHistory = {
      id: `config_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      version: config.version,
      config: config,
      createdAt: new Date().toISOString(),
      updatedBy: 'system-backup'
    };

    // Получаем текущую историю
    const currentHistory = await get<PricingConfigHistory[]>('pricing-config-history') || [];
    
    // Добавляем новую запись
    const updatedHistory = [historyEntry, ...currentHistory];
    
    // Ограничиваем количество записей (последние 50)
    const limitedHistory = updatedHistory.slice(0, 50);

    // Сохраняем в Edge Config
    if (process.env.VERCEL_ACCESS_TOKEN && process.env.EDGE_CONFIG_ID) {
      const historyResponse = await fetch(`https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: 'pricing-config-history',
              value: limitedHistory
            }
          ]
        })
      });

      if (!historyResponse.ok) {
        throw new Error(`History save failed: ${historyResponse.status}`);
      }

      console.log('Config saved to history:', historyEntry.id);
    }
  } catch (error) {
    console.error('Error saving config to history:', error);
    throw error;
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

// GET - закрыт для публичного доступа
export async function GET() {
  return addCorsHeaders(NextResponse.json({
    success: false,
    error: 'Access denied'
  }, { status: 403 }));
}

// POST - обновить конфигурацию (только для внутреннего использования из AWS)
export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию через API key из AWS
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');
    const expectedAuth = process.env.AWS_LAMBDA_API_KEY;
    
    // Поддерживаем два формата: Bearer token и X-API-Key header
    const isValidBearer = authHeader === `Bearer ${expectedAuth}`;
    const isValidApiKey = apiKey === expectedAuth;
    
    if (!expectedAuth || (!isValidBearer && !isValidApiKey)) {
      console.error('Unauthorized pricing config update attempt:', {
        hasAuthHeader: !!authHeader,
        hasApiKey: !!apiKey,
        expectedAuthLength: expectedAuth?.length
      });
      
      return addCorsHeaders(NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid API key'
      }, { status: 401 }));
    }

    const newConfig: PricingConfig = await request.json();
    
    // Валидация структуры конфигурации
    if (!newConfig.version || !newConfig.baseRates) {
      return addCorsHeaders(NextResponse.json({
        success: false,
        error: 'Invalid configuration structure'
      }, { status: 400 }));
    }

    // Добавляем timestamp последнего обновления
    newConfig.lastUpdated = new Date().toISOString();

    // Сначала сохраняем текущую конфигурацию в историю
    try {
      const currentConfig = await get<PricingConfig>('pricing-config');
      if (currentConfig) {
        await saveConfigToHistory(currentConfig);
      }
    } catch (error) {
      console.warn('Failed to save current config to history:', error);
      // Продолжаем обновление даже если история не сохранилась
    }

    // Обновляем Edge Config через Management API
    if (!process.env.EDGE_CONFIG_ID) {
      return addCorsHeaders(NextResponse.json({
        success: false,
        error: 'Edge Config ID not configured'
      }, { status: 500 }));
    }

    try {
      const edgeConfigResponse = await fetch(`https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: 'pricing-config',
              value: newConfig
            }
          ]
        })
      });

      if (!edgeConfigResponse.ok) {
        const errorData = await edgeConfigResponse.text();
        console.error('Failed to update Edge Config:', errorData);
        return addCorsHeaders(NextResponse.json({
          success: false,
          error: 'Failed to update pricing configuration in Edge Config'
        }, { status: 500 }));
      }

      console.log('Edge Config updated successfully:', {
        version: newConfig.version,
        lastUpdated: newConfig.lastUpdated,
        updatedBy: newConfig.updatedBy
      });
    } catch (error) {
      console.error('Error updating Edge Config:', error);
      return addCorsHeaders(NextResponse.json({
        success: false,
        error: 'Failed to update Edge Config'
      }, { status: 500 }));
    }

    const response: EdgeConfigResponse = {
      success: true,
      data: newConfig,
      version: newConfig.version
    };

    return addCorsHeaders(NextResponse.json(response));
  } catch (error) {
    console.error('Error updating pricing config:', error);
    
    return addCorsHeaders(NextResponse.json({
      success: false,
      error: 'Failed to update pricing configuration'
    }, { status: 500 }));
  }
}