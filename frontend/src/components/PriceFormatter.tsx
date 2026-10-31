import React from 'react';

interface PriceFormatterProps {
  paise: number;
  className?: string;
  showDecimals?: boolean;
}

export const PriceFormatter: React.FC<PriceFormatterProps> = ({
  paise,
  className = '',
  showDecimals = true
}) => {
  const rupees = paise / 100;
  const formatted = showDecimals
    ? rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(rupees).toLocaleString('en-IN');

  return (
    <span className={`font-medium ${className}`}>
      ₹{formatted}
    </span>
  );
};
