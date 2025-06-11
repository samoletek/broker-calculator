import { NextRequest, NextResponse } from 'next/server';
import { get, getAll } from '@vercel/edge-config';
import { PricingConfig, EdgeConfigResponse } from '../../../types/pricing-config.types';
import { DEFAULT_PRICING_CONFIG } from '../../../constants/default-pricing-config';

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
      
      return NextResponse.json(response);
    }

    const response: EdgeConfigResponse = {
      success: true,
      data: config,
      version: config.version
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching pricing config:', error);
    
    const response: EdgeConfigResponse = {
      success: false,
      error: 'Failed to fetch pricing configuration',
      data: DEFAULT_PRICING_CONFIG // Fallback на дефолтную конфигурацию
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST - обновить конфигурацию (только для внутреннего использования из AWS)
export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию (можно добавить API key из AWS)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.AWS_LAMBDA_API_KEY;
    
    if (!expectedAuth || authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const newConfig: PricingConfig = await request.json();
    
    // Валидация структуры конфигурации
    if (!newConfig.version || !newConfig.baseRates) {
      return NextResponse.json({
        success: false,
        error: 'Invalid configuration structure'
      }, { status: 400 });
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating pricing config:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update pricing configuration'
    }, { status: 500 });
  }
}