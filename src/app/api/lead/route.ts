// src/app/api/lead/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import type { AWSLeadData } from '@/app/lib/utils/client/awsLeadMapper';
import { APIErrorHandler } from '@/app/lib/utils/api/errorHandler';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';

// URL для AWS Lambda из переменных окружения
const AWS_LEAD_ENDPOINT = process.env.AWS_LEAD_ENDPOINT;

const postHandler = async (request: NextRequest) => {
  console.log('Вызван API endpoint для лидов');
  
  // Проверяем, настроен ли endpoint
  if (!AWS_LEAD_ENDPOINT) {
    return APIErrorHandler.handleMissingConfig('AWS Lead Endpoint');
  }
  
  try {
    // Парсим тело запроса
    const body = await request.json() as AWSLeadData;
    
    // Базовая валидация
    if (!body.Id || !body.client?.EMail || !body.Quote) {
      return APIErrorHandler.handleValidationError(
        'Отсутствуют обязательные данные лида: ID, email или информация о котировке'
      );
    }
    
    console.log('Отправляем лид в AWS:', {
      id: body.Id,
      email: body.client.EMail,
      quote: body.Quote,
      calculationHash: body.Hash
    });
    
    try {
      // Отправляем в AWS Lambda
      const response = await axios.post(AWS_LEAD_ENDPOINT, body, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // таймаут 10 секунд
      });
      
      console.log('Ответ от AWS Lambda:', response.status, response.data);
      
      return NextResponse.json({
        success: true,
        message: 'Лид успешно отправлен в AWS',
        leadId: body.Id,
        awsResponse: response.data
      });
      
    } catch (awsError) {
      return APIErrorHandler.handleError(awsError);
    }
    
  } catch (error) {
    return APIErrorHandler.handleError(error);
  }
};

export const POST = withRateLimit(postHandler, 'lead');