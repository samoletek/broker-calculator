// src/utils/transportUtils.ts

export const calculateEstimatedTransitTime = (distance: number): string => {
    const MAX_DAILY_MILES = 500; 
    const AVERAGE_DRIVING_HOURS = 10;
    
    const fullDays = Math.floor(distance / MAX_DAILY_MILES);
    const remainingMiles = distance % MAX_DAILY_MILES;
    
    const partialDayTime = remainingMiles > 0 
      ? Math.ceil((remainingMiles / MAX_DAILY_MILES) * AVERAGE_DRIVING_HOURS)
      : 0;
    
    const totalTransitTime = fullDays + (partialDayTime > 0 ? 1 : 0);
    
    if (totalTransitTime === 1) {
      return '1 day';
    } else if (totalTransitTime < 1) {
      return 'Less than 1 day';
    } else {
      return `${Math.ceil(totalTransitTime)} days`;
    }
  };