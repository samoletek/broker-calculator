// utils/client/validation.ts
export const validateName = (name: string): { isValid: boolean; error?: string } => {
    const nameRegex = /^[A-Za-zА-Яа-я\s'-]+$/;  // Разрешаем буквы, пробелы, дефис и апостроф
    
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
  
  export const formatPhoneNumber = (phone: string): string => {
    // Удаляем все нецифровые символы
    const cleaned = phone.replace(/\D/g, '');
    
    // Форматируем номер как (XXX) XXX-XXXX
    if (cleaned.length >= 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    
    return cleaned;
  };
  
  export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (!cleaned) {
      return { isValid: false, error: 'Phone number is required' };
    }
    
    if (cleaned.length !== 10) {
      return { isValid: false, error: 'Phone number must be 10 digits' };
    }
    
    return { isValid: true };
  };
  
  export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    // Разрешаем только английские буквы, цифры и специальные символы
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email (English characters only)' };
    }
    
    return { isValid: true };
  };