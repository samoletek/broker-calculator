import { NextResponse, NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { generateToken } from '@/app/lib/csrf';
import { sessionOptions } from '@/app/lib/session';

export async function GET(request: NextRequest) {
  console.log('CSRF token request received');
  
  // Создаем объект response
  const response = NextResponse.json({ csrfToken: '' });
  
  try {
    // Используем request и response объекты
    const session = await getIronSession<{ csrfToken?: string }>(request, response, sessionOptions);
    
    // Генерируем CSRF токен
    const token = generateToken();
    console.log('New CSRF token generated');
    
    // Сохраняем в сессии
    session.csrfToken = token;
    await session.save();
    console.log('CSRF token saved to session');
    
    // Обновляем body ответа с токеном
    return NextResponse.json({ csrfToken: token }, response);
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}