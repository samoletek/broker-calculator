// src/app/lib/utils/client/navigation.ts
import type { BookingFormData } from '@/app/types/booking.types';

export const navigateToBooking = (data: BookingFormData) => {
    const wixBookingPage = "https://www.carhauldirect.com/booking";
    
    // Сохраняем полные данные в sessionStorage для доступа на странице букинга
    sessionStorage.setItem('booking_data', JSON.stringify(data));
    
    // Сокращаем длинные строки для URL
    const queryParams = new URLSearchParams({
      name: data.name,
      email: data.email,
      phone: data.phone,
      pickup: data.pickup.substring(0, 100), // Ограничиваем длину для URL
      delivery: data.delivery.substring(0, 100),
      date: data.selectedDate,
      transport: data.transportType,
      vehicle: data.vehicleType,
      value: data.vehicleValue,
      premium: data.premiumEnhancements.toString(),
      special: data.specialLoad.toString(),
      inoperable: data.inoperable.toString(),
      // Добавляем метку, чтобы распознать, что запрос пришел из калькулятора
      fromCalculator: 'true'
    }).toString();
  
    // Переход на страницу букинга Wix
    window.location.href = `${wixBookingPage}?${queryParams}`;
};