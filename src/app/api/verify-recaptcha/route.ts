// src/app/api/verify-recaptcha/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

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
    
    const secretKey = process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('NEXT_PUBLIC_RECAPTCHA_SECRET_KEY is not defined');
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA configuration error' },
        { status: 500 }
      );
    }
    
    const response = await axios.post<ReCaptchaResponse>(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    );

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