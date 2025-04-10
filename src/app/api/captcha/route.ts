import { NextResponse } from 'next/server';
import axios from 'axios';

// Определяем интерфейс для ответа Google reCAPTCHA
interface ReCaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    // Проверка наличия ключа reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not defined');
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA configuration error' },
        { status: 500 }
      );
    }

    // Проверка reCAPTCHA через Google API
    const response = await axios.post<ReCaptchaResponse>(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    );

    // Проверяем результат
    if (response.data && response.data.success === true) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA verification failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}