import { NextResponse } from 'next/server';

// Этот endpoint теперь deprecated - используйте специализированные endpoints:
// POST /api/maps/geocode - для геокодирования
// POST /api/maps/directions - для маршрутов
// POST /api/maps/distance-matrix - для матрицы расстояний

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint is deprecated',
    message: 'Please use specialized endpoints: /api/maps/geocode, /api/maps/directions, /api/maps/distance-matrix'
  }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint is deprecated', 
    message: 'Please use specialized endpoints: /api/maps/geocode, /api/maps/directions, /api/maps/distance-matrix'
  }, { status: 410 });
}