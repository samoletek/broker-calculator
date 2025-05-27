// src/app/lib/utils/client/leadSubmissionUtils.ts
import { generateCalculationHash, cacheCalculationHash, isCalculationCached } from './leadHashUtils';
import { mapCalculatorDataToAWSLead, type CalculatorData } from './awsLeadMapper';

/**
 * Response from lead submission
 */
export interface LeadSubmissionResponse {
  success: boolean;
  message: string;
  leadId?: string;
  calculationHash?: string;
  cached?: boolean;
}

/**
 * Submit calculation data as a lead to AWS
 */
export const submitCalculationLead = async (data: CalculatorData): Promise<LeadSubmissionResponse> => {
  try {
    console.log('Submitting calculation lead');
    
    // Generate hash for this calculation
    const calculationHash = await generateCalculationHash({
      pickup: data.pickup,
      delivery: data.delivery,
      selectedDate: typeof data.selectedDate === 'string' 
        ? data.selectedDate 
        : data.selectedDate.toISOString(),
      transportType: data.transportType,
      vehicleType: data.vehicleType,
      vehicleValue: data.vehicleValue,
      premiumEnhancements: data.premiumEnhancements,
      specialLoad: data.specialLoad,
      inoperable: data.inoperable,
      supplementaryInsurance: data.supplementaryInsurance,
      finalPrice: data.finalPrice
    });
    
    console.log('Generated calculation hash:', calculationHash);
    
    // Check if this calculation was already submitted
    if (isCalculationCached(calculationHash)) {
      console.log('Calculation already cached, skipping AWS submission');
      return {
        success: true,
        message: 'Calculation already submitted',
        calculationHash,
        cached: true
      };
    }
    
    // Map calculator data to AWS format
    const awsLeadData = mapCalculatorDataToAWSLead(data);
    
    // Store hash in VIN field (as suggested by Kostya)
    awsLeadData.Lead.VIN = calculationHash;
    
    console.log('Mapped AWS lead data:', {
      id: awsLeadData.Id,
      hash: calculationHash,
      quote: awsLeadData.Quote
    });
    
    // Send to our API endpoint
    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(awsLeadData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      // Cache the hash to prevent duplicate submissions
      cacheCalculationHash(calculationHash);
      
      console.log('Lead successfully submitted:', result);
      
      return {
        success: true,
        message: 'Lead successfully submitted to AWS',
        leadId: awsLeadData.Id,
        calculationHash,
        cached: false
      };
    } else {
      console.error('Failed to submit lead:', result);
      
      // Even if AWS submission fails, we can cache locally
      // to prevent repeated failed attempts
      if (response.status === 500) {
        cacheCalculationHash(calculationHash);
      }
      
      return {
        success: false,
        message: result.message || 'Failed to submit lead',
        calculationHash
      };
    }
    
  } catch (error) {
    console.error('Error submitting lead:', error);
    
    return {
      success: false,
      message: 'Failed to submit lead due to network error'
    };
  }
};

/**
 * Prepare calculator form data for lead submission
 */
export const prepareCalculatorDataForLead = (formData: {
  name: string;
  email: string;
  phone: string;
  pickup: string;
  delivery: string;
  selectedDate: Date;
  transportType: string;
  vehicleType: string;
  vehicleValue: string;
  premiumEnhancements: boolean;
  specialLoad: boolean;
  inoperable: boolean;
  supplementaryInsurance: boolean;
  finalPrice: number;
  distance?: number;
}): CalculatorData => {
  return {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    pickup: formData.pickup,
    delivery: formData.delivery,
    selectedDate: formData.selectedDate,
    transportType: formData.transportType,
    vehicleType: formData.vehicleType,
    vehicleValue: formData.vehicleValue,
    premiumEnhancements: formData.premiumEnhancements,
    specialLoad: formData.specialLoad,
    inoperable: formData.inoperable,
    supplementaryInsurance: formData.supplementaryInsurance,
    finalPrice: formData.finalPrice,
    distance: formData.distance
  };
};

/**
 * Get calculation hash from cached data
 */
export const getCalculationHashFromCache = (leadId: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cachedData = localStorage.getItem(`lead_${leadId}`);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return parsed.calculationHash || null;
    }
  } catch (error) {
    console.error('Error getting cached lead data:', error);
  }
  
  return null;
};