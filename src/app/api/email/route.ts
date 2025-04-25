import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { validateCSRFToken } from '@/app/lib/csrf';
import { sessionOptions } from '@/app/lib/session';
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
    paymentMethod?: string;
    selectedDate?: string;
    distance?: number;
  };
}

// Генерируем уникальный ID для расчета
const generateCalculationId = () => {
  return `QUOTE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
};

export async function POST(request: Request) {
  console.log('Email API endpoint called');
  
  try {
    // Сначала убедимся, что все нужные переменные окружения доступны
    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PUBLIC_KEY) {
      console.error('Missing EmailJS environment variables');
      return NextResponse.json({
        success: false,
        message: 'Email service is not properly configured.'
      }, { status: 500 });
    }
    
    // Создаем объект response для сессии
    const response = NextResponse.json({ success: false, message: 'Initializing' });
    
    // Проверка CSRF не нужна для этого маршрута, так как проверка уже выполнена в middleware
    // Но мы все равно логируем заголовок для отладки
    const csrfToken = request.headers.get('csrf-token');
    console.log('CSRF Token received:', csrfToken ? 'Present' : 'Missing');
    
    const body = await request.json() as EmailRequestBody;
    console.log('Received email request for:', body.email);
    
    // Базовая валидация
    if (!body.email || !body.calculationData?.finalPrice) {
      console.error('Missing required email data');
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
      payment_method: body.calculationData.paymentMethod || 'Not specified',
      date: body.calculationData.selectedDate
        ? new Date(body.calculationData.selectedDate).toLocaleDateString()
        : 'Not specified',
      distance: body.calculationData.distance
        ? `${body.calculationData.distance}`
        : 'Not specified',
      phone_number: body.phone || ''
    };
    
    console.log('Sending email via EmailJS with service ID:', process.env.EMAILJS_SERVICE_ID);
    
    try {
      const result = await emailjs.send(
        process.env.EMAILJS_SERVICE_ID,
        process.env.EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: process.env.EMAILJS_PUBLIC_KEY,
        }
      );
      
      console.log('Email sent successfully:', result);
      
      // Обязательно возвращаем объект с полем message
      return NextResponse.json({
        success: true,
        message: `Price quote has been sent to your email! Quote ID: ${calculationId}`
      });
    } catch (emailError) {
      console.error('EmailJS send error:', emailError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send email. Please check your email address and try again.'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in email route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send email. Please try again later.'
      },
      { status: 500 }
    );
  }
}