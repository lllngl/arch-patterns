export const getInputValidationClass = (error?: string, success?: boolean): string => {
  if (error) return 'error';
  if (success) return 'success';
  return '';
};

export const sanitizeInputValue = (value: string): string => {
  return value.trim();
};