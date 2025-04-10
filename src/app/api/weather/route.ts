import { NextResponse } from 'next/server';
import axios from 'axios';
import type { WeatherResponse } from '@/app/types/api.types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng, date } = body;
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }
    
    // Проверяем наличие API-ключа
    if (!process.env.WEATHER_API_KEY) {
      console.error('WEATHER_API_KEY is not defined');
      return NextResponse.json(
        { error: 'Weather API not configured properly' },
        { status: 500 }
      );
    }
    
    const response = await axios.get<WeatherResponse>(
      'https://api.weatherapi.com/v1/forecast.json',
      {
        params: {
          key: process.env.WEATHER_API_KEY,
          q: `${lat},${lng}`,
          dt: date
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}