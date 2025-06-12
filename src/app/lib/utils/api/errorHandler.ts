import { NextResponse } from 'next/server';

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
  statusCode: number;
}

export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    requestId?: string;
  };
  details?: unknown;
}

// Стандартные коды ошибок
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_LIMIT_REACHED: 'API_LIMIT_REACHED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  MISSING_REQUIRED_DATA: 'MISSING_REQUIRED_DATA',
  INVALID_REQUEST_FORMAT: 'INVALID_REQUEST_FORMAT'
} as const;

// Стандартные сообщения ошибок для пользователей
export const ERROR_MESSAGES = {
  [ERROR_CODES.API_LIMIT_REACHED]: 'API limit reached. Please try again later.',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service is temporarily unavailable. Please try again.',
  [ERROR_CODES.CONFIGURATION_ERROR]: 'Service configuration error. Please contact support.',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error occurred. Please check your connection.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ERROR_CODES.INTERNAL_ERROR]: 'An internal error occurred. Please try again.',
  [ERROR_CODES.MISSING_REQUIRED_DATA]: 'Missing required information. Please check your input.',
  [ERROR_CODES.INVALID_REQUEST_FORMAT]: 'Invalid request format. Please check your data.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed. Please check your input.'
} as const;

export class APIErrorHandler {
  private static generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  static createError(
    code: keyof typeof ERROR_CODES,
    statusCode: number = 500,
    customMessage?: string,
    details?: unknown
  ): NextResponse<APIErrorResponse> {
    const apiError: APIError = {
      code,
      message: customMessage || ERROR_MESSAGES[code] || 'Unknown error occurred',
      details,
      statusCode
    };
    
    return this.handleError(apiError);
  }

  static handleError(error: APIError | Error | unknown): NextResponse<APIErrorResponse> {
    let apiError: APIError;

    if (error instanceof Error) {
      // Попытка определить тип ошибки по сообщению
      if (error.message.includes('API limit') || error.message.includes('quota')) {
        apiError = {
          code: 'API_LIMIT_REACHED',
          message: error.message,
          statusCode: 429
        };
      } else if (error.message.includes('timeout')) {
        apiError = {
          code: 'TIMEOUT_ERROR',
          message: error.message,
          statusCode: 408
        };
      } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
        apiError = {
          code: 'NETWORK_ERROR',
          message: error.message,
          statusCode: 503
        };
      } else {
        apiError = {
          code: 'INTERNAL_ERROR',
          message: error.message,
          statusCode: 500
        };
      }
    } else if (this.isAPIError(error)) {
      apiError = error;
    } else {
      apiError = {
        code: 'INTERNAL_ERROR',
        message: 'Unknown error occurred',
        statusCode: 500,
        details: error
      };
    }

    const response: APIErrorResponse = {
      success: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      }
    };

    // Включаем детали только в development
    if (process.env.NODE_ENV === 'development' && apiError.details) {
      response.details = apiError.details;
    }

    // Логируем ошибку
    console.error('API Error:', {
      ...response.error,
      details: apiError.details,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(response, { status: apiError.statusCode });
  }

  static handleValidationError(message: string, details?: unknown): NextResponse<APIErrorResponse> {
    const error = this.createError('VALIDATION_ERROR', 400, message, details);
    return this.handleError(error);
  }

  static handleMissingConfig(service: string): NextResponse<APIErrorResponse> {
    const error = this.createError(
      'CONFIGURATION_ERROR',
      500,
      `${service} is not configured properly`
    );
    return this.handleError(error);
  }

  private static isAPIError(error: unknown): error is APIError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'statusCode' in error
    );
  }
}