export const calculateEstimatedTransitTime = (distance: number): string => {
    const DAILY_DRIVING_MILES = 500; // Активные мили в световой день
    
    // Сколько полных дней потребуется
    const transitDays = Math.ceil(distance / DAILY_DRIVING_MILES);
    
    // Форматирование результата
    if (transitDays === 1) {
      return '1 day';
    } else if (transitDays < 1) {
      return 'Less than 1 day';
    } else {
      return `${transitDays} days`;
    }
  };