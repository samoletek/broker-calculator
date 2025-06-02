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
    paymentMethod?: string;
  };
}

/**
 * Отправляет электронное письмо с ценовым расчетом через EmailJS (только клиентский)
 */
export const sendPriceEmail = async (data: EmailData): Promise<{success: boolean; message: string}> => {
  console.log('🚀 sendPriceEmail called with:', { email: data.email, finalPrice: data.calculationData.finalPrice });
  
  try {
    // Сохраняем расчет локально
    const calculationId = `QUOTE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    console.log('💾 Generated calculationId:', calculationId);
    
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
      console.log('💾 Saved to localStorage');
    } catch (e) {
      console.error('❌ Error saving calculation to localStorage:', e);
    }
    
    // Получаем EmailJS ключи из переменных окружения
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    
    console.log('🔑 EmailJS env check:', {
      serviceId: serviceId ? `Found: ${serviceId}` : 'Missing',
      templateId: templateId ? `Found: ${templateId}` : 'Missing',
      publicKey: publicKey ? `Found: ${publicKey}` : 'Missing'
    });
    
    if (!serviceId || !templateId || !publicKey) {
      console.error('❌ Missing EmailJS environment variables');
      return {
        success: false,
        message: 'Email service is not properly configured. Please contact support.'
      };
    }
    
    // Подготавливаем данные для EmailJS (точно как в шаблоне)
    const templateParams = {
      to_name: data.name || 'Customer',
      to_email: data.email,
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
    
    // Временная отладка - удалить после исправления
    console.log('EmailJS Debug:', {
      serviceId,
      templateId,
      publicKey: publicKey ? 'Present' : 'Missing',
      templateParams
    });
    
    // Отправляем через EmailJS (клиентский)
    const result = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      {
        publicKey: publicKey,
      }
    );
    
    return { 
      success: true, 
      message: `Price quote has been sent to your email! Quote ID: ${calculationId}`
    };
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    return { 
      success: false, 
      message: 'Failed to send email. Please try again later.' 
    };
  }
};