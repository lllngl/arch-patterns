import type { ButtonProps } from './types';

export const getButtonClassNames = (props: ButtonProps): string => {
  const { variant = 'primary', size = 'md', disabled, className = '' } = props;
  
  const baseClasses = 'button-base';
  const variantClass = `button-${variant}`;
  const sizeClass = `button-${size}`;
  const disabledClass = disabled ? 'button-disabled' : '';
  
  return [baseClasses, variantClass, sizeClass, disabledClass, className]
    .filter(Boolean)
    .join(' ');
};