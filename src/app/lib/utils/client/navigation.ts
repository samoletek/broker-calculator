// navigation.ts
import type { BookingFormData } from '@/app/types/booking.types';

export const navigateToBooking = (data: BookingFormData) => {
    const queryParams = new URLSearchParams({
      // Contact Info
      name: data.name,
      phone: data.phone,
      email: data.email,
      
      // Route
      pickup: data.pickup,
      delivery: data.delivery,
      date: data.selectedDate,
      
      // Vehicle Details
      transport: data.transportType,
      vehicle: data.vehicleType,
      value: data.vehicleValue,
      
      // Additional Services
      premium: data.premiumEnhancements.toString(),
      special: data.specialLoad.toString(),
      inoperable: data.inoperable.toString()
    }).toString();
  
    window.location.href = `${window.location.origin}/booking?${queryParams}`;
};