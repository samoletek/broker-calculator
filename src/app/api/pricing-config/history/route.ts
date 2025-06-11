import { NextRequest, NextResponse } from 'next/server';
import { get, getAll } from '@vercel/edge-config';
import { PricingConfigHistory } from '../../../../types/pricing-config.types';

// GET - получить историю изменений конфигурации (только для авторизованных)
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию через API key
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');
    const expectedAuth = process.env.AWS_LAMBDA_API_KEY;
    
    const isValidBearer = authHeader === `Bearer ${expectedAuth}`;
    const isValidApiKey = apiKey === expectedAuth;
    
    if (!expectedAuth || (!isValidBearer && !isValidApiKey)) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    // Получаем историю из Edge Config
    const history = await get<PricingConfigHistory[]>('pricing-config-history') || [];
    
    // Сортируем по дате создания (новые первыми)
    const sortedHistory = history.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: sortedHistory,
      count: sortedHistory.length
    });
  } catch (error) {
    console.error('Error fetching pricing config history:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pricing configuration history'
    }, { status: 500 });
  }
}

// POST - добавить новую запись в историю (внутренний endpoint)
export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.AWS_LAMBDA_API_KEY;
    
    if (!expectedAuth || authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const newHistoryEntry: PricingConfigHistory = await request.json();
    
    // Валидация
    if (!newHistoryEntry.version || !newHistoryEntry.config) {
      return NextResponse.json({
        success: false,
        error: 'Invalid history entry structure'
      }, { status: 400 });
    }

    // Получаем текущую историю
    const currentHistory = await get<PricingConfigHistory[]>('pricing-config-history') || [];
    
    // Добавляем новую запись
    const updatedHistory = [newHistoryEntry, ...currentHistory];
    
    // Ограничиваем количество записей в истории (например, 50)
    const limitedHistory = updatedHistory.slice(0, 50);

    // Здесь должно быть обновление Edge Config
    // Временно логируем
    console.log('New history entry added:', {
      id: newHistoryEntry.id,
      version: newHistoryEntry.version,
      createdAt: newHistoryEntry.createdAt
    });

    return NextResponse.json({
      success: true,
      data: newHistoryEntry,
      historyCount: limitedHistory.length
    });
  } catch (error) {
    console.error('Error adding pricing config history:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to add pricing configuration history'
    }, { status: 500 });
  }
}