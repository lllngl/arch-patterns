export const getInputValidationClass = (error?: string, success?: boolean): string => {
  if (error) return 'error';
  if (success) return 'success';
  return '';
};

export const sanitizeInputValue = (value: string): string => {
  // Basic sanitization - remove potentially harmful characters
  return value.trim();
};