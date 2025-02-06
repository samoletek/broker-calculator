import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

export function validatePhoneNumber(phoneNumber: string, countryCode: string = 'US') {
 const normalizedCountryCode = (countryCode || 'US').toUpperCase().trim() as CountryCode;
 const phone = parsePhoneNumberFromString(phoneNumber, normalizedCountryCode);

 if (!phone?.isValid()) {
   return {
     isValid: false,
     formatted: null,
     error: 'Invalid phone number'
   };
 }

 return {
   isValid: true,
   formatted: phone.formatInternational(),
   error: null
 };
}

export const validateName = (name: string): { isValid: boolean; error?: string } => {
 const nameRegex = /^[A-Za-zА-Яа-я\s'-]+$/;
   
 if (!name.trim()) {
   return { isValid: false, error: 'Name is required' };
 }
   
 if (name.length < 2) {
   return { isValid: false, error: 'Name must be at least 2 characters long' };
 }
   
 if (!nameRegex.test(name)) {
   return { isValid: false, error: 'Name can only contain letters' };
 }
   
 return { isValid: true };
};

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
 const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
   
 if (!email) {
   return { isValid: false, error: 'Email is required' };
 }
   
 if (!emailRegex.test(email)) {
   return { isValid: false, error: 'Please enter a valid email (English characters only)' };
 }
   
 return { isValid: true };
};