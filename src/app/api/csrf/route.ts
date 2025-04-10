import { NextResponse, NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { generateToken } from '@/app/lib/csrf';
import { sessionOptions } from '@/app/lib/session';

export async function GET(request: NextRequest) {
  // Создаем объект response
  const response = NextResponse.json({ csrfToken: '' });
  
  // Используем request и response объекты
  const session = await getIronSession<{ csrfToken?: string }>(request, response, sessionOptions);
  
  // Генерируем CSRF токен
  const token = generateToken();
  
  // Сохраняем в сессии
  session.csrfToken = token;
  await session.save();
  
  // Обновляем body ответа с токеном
  return NextResponse.json({ csrfToken: token }, response);
}