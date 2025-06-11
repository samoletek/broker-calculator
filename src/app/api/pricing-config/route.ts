import { NextRequest, NextResponse } from 'next/server';
import { get, getAll } from '@vercel/edge-config';
import { PricingConfig, EdgeConfigResponse } from '../../../types/pricing-config.types';
import { DEFAULT_PRICING_CONFIG } from '../../../constants/default-pricing-config';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', 'https://www.brokercalculator.xyz');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

// GET - получить текущую конфигурацию ценообразования
export async function GET() {
  try {
    // Пытаемся получить конфигурацию из Edge Config
    const config = await get<PricingConfig>('pricing-config');
    
    if (!config) {
      // Если конфигурации нет, возвращаем дефолтную
      const response: EdgeConfigResponse = {
        success: true,
        data: DEFAULT_PRICING_CONFIG,
        version: DEFAULT_PRICING_CONFIG.version
      };
      
      return addCorsHeaders(NextResponse.json(response));
    }

    const response: EdgeConfigResponse = {
      success: true,
      data: config,
      version: config.version
    };

    return addCorsHeaders(NextResponse.json(response));
  } catch (error) {
    console.error('Error fetching pricing config:', error);
    
    const response: EdgeConfigResponse = {
      success: false,
      error: 'Failed to fetch pricing configuration',
      data: DEFAULT_PRICING_CONFIG // Fallback на дефолтную конфигурацию
    };

    return addCorsHeaders(NextResponse.json(response, { status: 500 }));
  }
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

    // Здесь должно быть обновление Edge Config через Management API
    // Временно возвращаем успех (нужно будет настроить после создания Edge Config)
    console.log('New pricing config received:', {
      version: newConfig.version,
      lastUpdated: newConfig.lastUpdated,
      updatedBy: newConfig.updatedBy
    });

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