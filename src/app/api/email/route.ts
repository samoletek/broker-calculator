import { NextResponse } from 'next/server';
import emailjs from '@emailjs/browser';

interface EmailRequestBody {
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

export async function POST(request: Request) {
  try {
    const body = await request.json() as EmailRequestBody;
    
    // Базовая валидация
    if (!body.email || !body.calculationData?.finalPrice) {
      return NextResponse.json(
        { success: false, message: 'Missing required data' },
        { status: 400 }
      );
    }
    
    // Создаем уникальный ID расчета
    const calculationId = generateCalculationId();
    
    // Подготавливаем данные для EmailJS
    const templateParams = {
      to_name: body.name || 'Customer',
      to_email: body.email,
      subject: 'Vehicle Transport Price Quote',
      quote_id: calculationId,
      pickup: body.calculationData.pickup || '',
      delivery: body.calculationData.delivery || '',
      final_price: body.calculationData.finalPrice.toFixed(2),
      transport_type: body.calculationData.transportType || '',
      vehicle_type: body.calculationData.vehicleType || '',
      vehicle_value: body.calculationData.vehicleValue || '',
      date: body.calculationData.selectedDate
        ? new Date(body.calculationData.selectedDate).toLocaleDateString()
        : 'Not specified',
      distance: body.calculationData.distance
        ? `${body.calculationData.distance}`
        : 'Not specified',
      phone_number: body.phone || ''
    };
    
    // Отправляем через EmailJS - важно добавить проверки на наличие переменных окружения
    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PUBLIC_KEY) {
      console.error('Missing EmailJS environment variables');
      return NextResponse.json({
        success: false,
        message: 'Email service is not properly configured.'
      }, { status: 500 });
    }
    
    const result = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      process.env.EMAILJS_PUBLIC_KEY
    );
    
    // Обязательно возвращаем объект с полем message
    return NextResponse.json({
      success: true,
      message: `Price quote has been sent to your email! Quote ID: ${calculationId}`
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send email. Please try again later.'
      },
      { status: 500 }
    );
  }
}