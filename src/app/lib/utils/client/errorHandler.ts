import type { APIErrorResponse } from '../api/errorHandler';

export interface ClientError {
  type: 'api' | 'validation' | 'network' | 'unknown';
  message: string;
  code?: string;
  field?: string;
}

export class ClientErrorHandler {
  static handleAPIResponse(response: APIErrorResponse): ClientError {
    const { error } = response;
    
    return {
      type: 'api',
      message: error.message,
      code: error.code
    };
  }

  static handleNetworkError(error: Error): ClientError {
    if (error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network connection error. Please check your internet connection.'
      };
    }
    
    return {
      type: 'unknown',
      message: 'An unexpected error occurred. Please try again.'
    };
  }

  static handleValidationError(message: string, field?: string): ClientError {
    return {
      type: 'validation',
      message,
      field
    };
  }

  static isAPILimitError(error: ClientError | string): boolean {
    if (typeof error === 'string') {
      return error.includes('API limit') || error.includes('quota');
    }
    
    return error.code === 'API_LIMIT_REACHED' || 
           error.message.includes('API limit') || 
           error.message.includes('quota');
  }

  static isRetryableError(error: ClientError | string): boolean {
    if (typeof error === 'string') {
      return error.includes('timeout') || 
             error.includes('network') || 
             error.includes('temporarily unavailable');
    }
    
    return error.code === 'TIMEOUT_ERROR' || 
           error.code === 'NETWORK_ERROR' || 
           error.code === 'EXTERNAL_SERVICE_ERROR';
  }

  static getDisplayMessage(error: ClientError | string): string {
    if (typeof error === 'string') {
      return error;
    }
    
    // Кастомизируем сообщения для пользователей
    switch (error.code) {
      case 'API_LIMIT_REACHED':
        return 'Service temporarily busy. Please try again in a few minutes.';
      case 'EXTERNAL_SERVICE_ERROR':
        return 'External service is temporarily unavailable. Please try again.';
      case 'TIMEOUT_ERROR':
        return 'Request timed out. Please try again.';
      case 'NETWORK_ERROR':
        return 'Connection issue. Please check your internet and try again.';
      case 'VALIDATION_ERROR':
        return error.message;
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}