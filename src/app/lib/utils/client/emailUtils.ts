
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
 * Отправляет электронное письмо с ценовым расчетом через наш серверный API
 */
export const sendPriceEmail = async (data: EmailData): Promise<{success: boolean; message: string}> => {
  try {
    // Сохраняем расчет локально
    const calculationId = `QUOTE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    try {
      const savedCalculations = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
      savedCalculations.push({
        id: calculationId,
        finalPrice: data.calculationData.finalPrice,
        date: data.calculationData.selectedDate,
        savedAt: new Date().toISOString(),
        details: data.calculationData
      });
      localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
    } catch (e) {
      console.error('Error saving calculation:', e);
    }
    
    // Вместо прямого вызова EmailJS отправляем запрос на наш серверный API
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