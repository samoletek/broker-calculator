// src/app/lib/utils/client/awsLeadMapper.ts

/**
 * Interface for AWS Lead structure based on the provided JSON format
 */
export interface AWSLeadData {
  Request: string;
  Id: string;
  shipping_date: string;
  client: {
    Type: string;
    EMail: string;
    PhoneNumber: string;
    FirstName: string;
    LastName: string;
    Address_1: string;
    City: string;
    State: string;
    Zip: string;
  };
  Quote: string;
  Lead: {
    Inoperable: string;
    Special: string;
    Premium: string;
    TransportType: string;
    VehicleValue: string;
    VehicleType: string;
    VIN: string;
    Make: string;
    Model: string;
    Year: string;
  };
  cargo: {
    Cargo_type: string;
    Vehicle_value: string;
    Pickup: {
      FirstName: string;
      LastName: string;
      EMail: string;
      Phone: string;
      Address: string;
      City: string;
      State: string;
      Zip: string;
      Date: string;
    };
    Delivery: {
      FirstName: string;
      LastName: string;
      EMail: string;
      Phone: string;
      Address: string;
      City: string;
      State: string;
      Zip: string;
      Date: string;
    };
  };
}

/**
 * Calculator data interface
 */
export interface CalculatorData {
  // Contact info
  name: string;
  email: string;
  phone: string;
  
  // Route info
  pickup: string;
  delivery: string;
  selectedDate: Date | string;
  
  // Vehicle info
  transportType: string;
  vehicleType: string;
  vehicleValue: string;
  
  // Services
  premiumEnhancements: boolean;
  specialLoad: boolean;
  inoperable: boolean;
  supplementaryInsurance: boolean;
  
  // Price
  finalPrice: number;
  
  // Optional fields that might be added later
  distance?: number;
  estimatedDeliveryDate?: Date | string;
  calculationHash?: string;
}

/**
 * Parse address string to extract components
 */
const parseAddress = (addressString: string): {
  street: string;
  city: string;
  state: string;
  zip: string;
} => {
  // Try to parse Google Maps formatted address
  // Format: "Street, City, State ZIP, Country"
  const parts = addressString.split(',').map(part => part.trim());
  
  let street = '';
  let city = '';
  let state = '';
  let zip = '';
  
  if (parts.length >= 3) {
    street = parts[0] || '';
    city = parts[1] || '';
    
    // Extract state and ZIP from the third part
    const stateZipPart = parts[2] || '';
    const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);
    
    if (stateZipMatch) {
      state = stateZipMatch[1];
      zip = stateZipMatch[2];
    } else {
      // Try alternative format
      const words = stateZipPart.split(' ');
      if (words.length >= 2) {
        state = words[0];
        zip = words[1];
      }
    }
  }
  
  return { street, city, state, zip };
};

/**
 * Parse name to extract first and last name
 */
const parseName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  } else if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  } else {
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }
};

/**
 * Map premium enhancements to AWS format
 */
const mapPremiumEnhancements = (premiumEnhancements: boolean): string => {
  // In AWS format, Premium can be "Ramp", "Liftgate", etc.
  // Since we don't have specific details, we'll use a generic value
  return premiumEnhancements ? 'Premium Service' : 'No';
};

/**
 * Format date to YYYY-MM-DD format
 */
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Calculate estimated delivery date based on distance
 */
const calculateEstimatedDeliveryDate = (shippingDate: Date | string, distance?: number): string => {
  const startDate = typeof shippingDate === 'string' ? new Date(shippingDate) : shippingDate;
  
  // Default 3-5 days if no distance provided
  const transitDays = distance ? Math.ceil(distance / 500) : 4;
  
  const deliveryDate = new Date(startDate);
  deliveryDate.setDate(deliveryDate.getDate() + transitDays);
  
  return formatDate(deliveryDate);
};

/**
 * Map calculator data to AWS lead format
 */
export const mapCalculatorDataToAWSLead = (data: CalculatorData): AWSLeadData => {
  const { firstName, lastName } = parseName(data.name);
  const pickupAddress = parseAddress(data.pickup);
  const deliveryAddress = parseAddress(data.delivery);
  
  // Generate or use existing UUID
  const leadId = uuidv4();
  
  return {
    Request: "Add New Lead from Website",
    Id: leadId,
    shipping_date: formatDate(data.selectedDate),
    client: {
      Type: "Private person",
      EMail: data.email,
      PhoneNumber: data.phone,
      FirstName: firstName,
      LastName: lastName,
      Address_1: pickupAddress.street, // Using pickup address as client address
      City: pickupAddress.city,
      State: pickupAddress.state,
      Zip: pickupAddress.zip
    },
    Quote: `$${data.finalPrice.toFixed(0)}`,
    Lead: {
      Inoperable: data.inoperable ? "Yes" : "No",
      Special: data.specialLoad ? "Yes" : "No",
      Premium: mapPremiumEnhancements(data.premiumEnhancements),
      TransportType: data.transportType === 'openTransport' ? "Open" : "Enclosed",
      VehicleValue: data.vehicleValue === 'under100k' ? "Under $100K" :
                    data.vehicleValue === 'under300k' ? "$100k - $300k" :
                    data.vehicleValue === 'under500k' ? "$300k - $500k" : "Over $500k",
      VehicleType: mapVehicleType(data.vehicleType),
      VIN: "", // Not collected in calculator
      Make: "", // Not collected in calculator
      Model: "", // Not collected in calculator
      Year: "" // Not collected in calculator
    },
    cargo: {
      Cargo_type: mapVehicleType(data.vehicleType),
      Vehicle_value: data.vehicleValue === 'under100k' ? "Under $100K" :
                     data.vehicleValue === 'under300k' ? "$100k - $300k" :
                     data.vehicleValue === 'under500k' ? "$300k - $500k" : "Over $500k",
      Pickup: {
        FirstName: firstName, // Using client name for pickup
        LastName: lastName,
        EMail: data.email,
        Phone: data.phone,
        Address: pickupAddress.street,
        City: pickupAddress.city,
        State: pickupAddress.state,
        Zip: pickupAddress.zip,
        Date: formatDate(data.selectedDate)
      },
      Delivery: {
        FirstName: "", // Not collected separately
        LastName: "",
        EMail: "",
        Phone: "",
        Address: deliveryAddress.street,
        City: deliveryAddress.city,
        State: deliveryAddress.state,
        Zip: deliveryAddress.zip,
        Date: calculateEstimatedDeliveryDate(data.selectedDate, data.distance)
      }
    }
  };
};

/**
 * Map vehicle type from calculator format to AWS format
 */
const mapVehicleType = (vehicleType: string): string => {
  const typeMap: Record<string, string> = {
    'SEDAN': 'Sedan',
    'COUPE': 'Coupe',
    'HATCHBACK': 'Hatchback',
    'CONVERTIBLE': 'Convertible',
    'WAGON': 'Station Wagon',
    'SPORTS_CAR': 'Sports Car',
    'LUXURY': 'Luxury Vehicle',
    'COMPACT_SUV': 'Compact SUV',
    'MIDSIZE_SUV': 'Mid-size SUV',
    'FULLSIZE_SUV': 'Full-size SUV',
    'MINIVAN': 'Minivan',
    'CARGO_VAN': 'Cargo Van',
    'EV': 'Electric Vehicle',
    'HYBRID': 'Hybrid Vehicle',
    'MOTORCYCLE': 'Motorcycle',
    'ATV_UTV': 'ATV/UTV',
    'CLASSIC': 'Classic Vehicle',
    'OVERSIZED': 'Oversized Vehicle',
    'SMALL_CARGO': 'Small Cargo'
  };
  
  return typeMap[vehicleType] || vehicleType;
};

/**
 * Generate a simple UUID v4 implementation for browser compatibility
 */
function uuidv4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}