// booking.types.ts
export interface BookingFormData {
    // Contact Info
    name: string;
    phone: string;
    email: string;
    
    // Route
    pickup: string;
    delivery: string;
    selectedDate: string;
    
    // Vehicle Details
    transportType: string;
    vehicleType: string;
    vehicleValue: string;
    
    // Services
    premiumEnhancements: boolean;
    specialLoad: boolean;
    inoperable: boolean;
    supplementaryInsurance: boolean;
  }