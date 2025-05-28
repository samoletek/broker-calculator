// src/app/lib/utils/client/navigation.ts
// ЗАМЕНИ ВЕСЬ ФАЙЛ navigation.ts В КАЛЬКУЛЯТОРЕ НА ЭТОТ КОД

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
  
  // Логируем для отладки
  console.log('Navigating to booking with data:', data);
  
  // Подготавливаем полные параметры для URL
  const queryParams = new URLSearchParams({
    name: data.name,
    email: data.email,
    phone: data.phone,
    pickup: data.pickup,
    delivery: data.delivery,
    date: data.selectedDate,
    transport: data.transportType,
    vehicle: data.vehicleType,
    value: data.vehicleValue,
    premium: data.premiumEnhancements.toString(),
    special: data.specialLoad.toString(),
    inoperable: data.inoperable.toString(),
    supplementaryInsurance: data.supplementaryInsurance.toString(),
    fromCalculator: 'true'
  }).toString();

  const targetUrl = `${wixBookingPage}?${queryParams}`;
  
  // Проверяем, находимся ли мы внутри iFrame
  if (window !== window.parent) {
    console.log('Detected iframe, navigating parent window');
    
    // Сначала отправляем данные через postMessage для сохранения
    window.parent.postMessage({
      action: 'saveBookingData',
      data: data
    }, '*');
    
    // Небольшая задержка, затем переходим
    setTimeout(() => {
      window.parent.location.href = targetUrl;
    }, 100);
  } else {
    // Мы не в iFrame - стандартная навигация
    console.log('Direct navigation');
    window.location.href = targetUrl;
  }
};