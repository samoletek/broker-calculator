import { NextResponse } from 'next/server';
import axios from 'axios';

// Маршрут для геокодирования адреса (получение координат по адресу)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = body;
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error with Google Maps API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geolocation data' },
      { status: 500 }
    );
  }
}

// GET метод обязательно должен возвращать объект с apiKey
export async function GET() {
  // Проверяем, есть ли ключ API
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error('GOOGLE_MAPS_API_KEY is not defined');
    return NextResponse.json(
      { error: 'API key is not configured' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  });
}