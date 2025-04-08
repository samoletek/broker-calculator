import emailjs from '@emailjs/browser';

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

// Генерируем уникальный ID для расчета
const generateCalculationId = () => {
  return `QUOTE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
};

/**
 * Отправляет электронное письмо с ценовым расчетом через EmailJS (без скриншота)
 */
export const sendPriceEmail = async (data: EmailData): Promise<{success: boolean; message: string}> => {
    try {
      // Проверяем наличие необходимых переменных окружения
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
      
      if (!serviceId || !templateId || !publicKey) {
        console.error('Missing EmailJS configuration:', { 
          serviceId: !!serviceId, 
          templateId: !!templateId, 
          publicKey: !!publicKey 
        });
        return { 
          success: false, 
          message: 'Email service not properly configured. Please contact support.' 
        };
      }
      
      // 1. Создаем уникальный ID расчета
      const calculationId = generateCalculationId();
      
      // 2. Сохраняем расчет в локальном хранилище
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
  
      // 3. Подготавливаем данные для EmailJS
      const templateParams = {
        to_name: data.name,
        to_email: data.email,
        subject: 'Vehicle Transport Price Quote',
        quote_id: calculationId,
        pickup: data.calculationData.pickup,
        delivery: data.calculationData.delivery,
        final_price: data.calculationData.finalPrice.toFixed(2),
        transport_type: data.calculationData.transportType,
        vehicle_type: data.calculationData.vehicleType,
        vehicle_value: data.calculationData.vehicleValue,
        date: data.calculationData.selectedDate 
          ? new Date(data.calculationData.selectedDate).toLocaleDateString() 
          : 'Not specified',
        distance: data.calculationData.distance 
          ? `${data.calculationData.distance}` 
          : 'Not specified',
        phone_number: data.phone
      };
  
      console.log('Sending email with params:', {
        serviceId,
        templateId,
        publicKeyPresent: !!publicKey,
        templateParams
      });
  
      // 4. Отправляем через EmailJS
      const result = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );
      
      console.log('Email sent successfully:', result.text);
      
      return { 
        success: true, 
        message: `Price quote has been sent to your email! Quote ID: ${calculationId}` 
      };
    } catch (error) {
      console.error('Error sending email:', error instanceof Error ? error.message : 'Unknown error', error);
      
      return { 
        success: false, 
        message: `Failed to send email: ${error instanceof Error ? error.message : 'Please check your connection and try again'}` 
      };
    }
  };