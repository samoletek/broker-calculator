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
    }
    
    // Получаем EmailJS ключи из переменных окружения
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    
    console.log('EmailJS configuration check:', { 
      serviceId: serviceId ? 'Found' : 'Missing',
      templateId: templateId ? 'Found' : 'Missing',
      publicKey: publicKey ? 'Found' : 'Missing'
    });
    
    if (!serviceId || !templateId || !publicKey) {
      console.error('Missing EmailJS environment variables');
      return {
        success: false,
        message: 'Email service is not properly configured. Please contact support.'
      };
    }
    
    // Подготавливаем данные для EmailJS
    const templateParams = {
      to_name: data.name || 'Customer',
      to_email: data.email,
      subject: 'Vehicle Transport Price Quote',
      quote_id: calculationId,
      pickup: data.calculationData.pickup || '',
      delivery: data.calculationData.delivery || '',
      final_price: data.calculationData.finalPrice.toFixed(2),
      transport_type: data.calculationData.transportType || '',
      vehicle_type: data.calculationData.vehicleType || '',
      vehicle_value: data.calculationData.vehicleValue || '',
      date: data.calculationData.selectedDate
        ? new Date(data.calculationData.selectedDate).toLocaleDateString()
        : 'Not specified',
      distance: data.calculationData.distance
        ? `${data.calculationData.distance}`
        : 'Not specified',
      phone_number: data.phone || ''
    };
    
    // Импортируем emailjs динамически
    const emailjs = await import('@emailjs/browser');
    
    console.log('Sending email via EmailJS');
    
    try {
      const result = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        {
          publicKey: publicKey,
        }
      );
      
      console.log('Email sent successfully:', result);
      
      return { 
        success: true, 
        message: `Price quote has been sent to your email! Quote ID: ${calculationId}`
      };
    } catch (emailError) {
      console.error('EmailJS error:', emailError);
      
      // Если не сработала клиентская отправка, пробуем через API
      console.log('Falling back to server API endpoint');
      
      try {
        const response = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const responseData = await response.json();
        return { 
          success: true, 
          message: responseData?.message || `Price quote has been sent to your email!` 
        };
      } catch (apiError) {
        console.error('API fallback error:', apiError);
        throw apiError;
      }
    }
  } catch (error) {
    console.error('Error sending email:', error);
    
    return { 
      success: false, 
      message: `Failed to send email. Please try again later.` 
    };
  }
};