interface EmailData {
  name: string;
  email: string;
  phone: string;
  calculationData: {
    pickup: string;
    delivery: string;
    finalPrice: number;
    transportType: string;
    vehicleType: string;
    vehicleValue: string;
    selectedDate?: string;
    distance?: number;
  };
}

/**
 * Получает CSRF токен с сервера
 */
export const getCSRFToken = async (): Promise<string> => {
  try {
    console.log('Fetching CSRF token');
    // При первом запросе выполняем обычный fetch без CSRF токена
    const response = await fetch('/api/csrf');
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CSRF token error (${response.status}):`, errorText);
      throw new Error(`Failed to get CSRF token: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('CSRF token received successfully');
    return data.csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw error;
  }
};

/**
 * Отправляет электронное письмо с ценовым расчетом через наш серверный API
 */
export const sendPriceEmail = async (data: EmailData): Promise<{success: boolean; message: string}> => {
  try {
    console.log('Starting email sending process');
    
    // Сохраняем расчет локально
    const calculationId = `QUOTE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    try {
      console.log('Saving calculation to localStorage');
      const savedCalculations = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
      savedCalculations.push({
        id: calculationId,
        finalPrice: data.calculationData.finalPrice,
        date: data.calculationData.selectedDate,
        savedAt: new Date().toISOString(),
        details: data.calculationData
      });
      localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
      console.log('Calculation saved to localStorage');
    } catch (e) {
      console.error('Error saving calculation to localStorage:', e);
      // Продолжаем выполнение даже при ошибке сохранения локально
    }
    
    // Получаем CSRF токен
    console.log('Getting CSRF token');
    let csrfToken;
    try {
      csrfToken = await getCSRFToken();
      console.log('CSRF token received');
    } catch (csrfError) {
      console.error('Failed to get CSRF token, continuing without it:', csrfError);
      // Продолжаем без CSRF токена, но логируем ошибку
      csrfToken = '';
    }
    
    // Отправляем с CSRF токеном в заголовке
    console.log('Sending email data to API');
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'csrf-token': csrfToken || ''
      },
      body: JSON.stringify(data),
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Email API error (${response.status}):`, errorText);
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Email API response:', responseData);
    
    return { 
      success: true, 
      message: responseData && responseData.message 
        ? responseData.message 
        : `Price quote has been sent to your email!` 
    };
  } catch (error) {
    console.error('Error sending email:', error instanceof Error ? error.message : 'Unknown error', error);
    
    return { 
      success: false, 
      message: `Failed to send email: ${error instanceof Error ? error.message : 'Please check your connection and try again'}` 
    };
  }
};