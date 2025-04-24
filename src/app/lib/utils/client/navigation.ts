// src/app/lib/utils/client/navigation.ts
interface BookingData {
  name: string;
  phone: string;
  email: string;
  pickup: string;
  delivery: string;
  selectedDate: string;
  transportType: string;
  vehicleType: string;
  vehicleValue: string;
  premiumEnhancements: boolean;
  specialLoad: boolean;
  inoperable: boolean;
  supplementaryInsurance: boolean;
}

export const navigateToBooking = (data: BookingData) => {
  const wixBookingPage = "https://www.carhauldirect.com/booking";
  
  // Сохраняем полные данные в sessionStorage для доступа на странице букинга
  // Это работает только при прямом доступе, не в iframe между доменами
  try {
      sessionStorage.setItem('booking_data', JSON.stringify(data));
  } catch (e) {
      console.warn('Failed to save to sessionStorage:', e);
  }
  
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
    supplementaryInsurance: data.supplementaryInsurance.toString(),
    // Добавляем метку, чтобы распознать, что запрос пришел из калькулятора
    fromCalculator: 'true'
  }).toString();

  // Проверяем, находимся ли мы внутри iFrame
  const targetUrl = `${wixBookingPage}?${queryParams}`;
  
  if (window !== window.parent) {
      // Мы в iFrame - выполняем навигацию родительского окна
      window.parent.location.href = targetUrl;
  } else {
      // Мы не в iFrame - стандартная навигация
      window.location.href = targetUrl;
  }
};