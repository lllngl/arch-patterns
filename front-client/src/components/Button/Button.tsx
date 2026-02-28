import React from 'react';
import { getButtonClassNames } from './helpers';
import type { ButtonProps } from './types';

export const Button: React.FC<ButtonProps> = (props) => {
  const { children, type = 'button', onClick, disabled } = props;
  
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const className = getButtonClassNames(props);

  return (
    <button
      type={type}
      className={className}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};