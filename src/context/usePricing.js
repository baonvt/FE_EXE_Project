import { useContext } from 'react';
import { PricingContext } from './PricingContext';

export const usePricing = () => {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing must be used within PricingProvider');
  }
  return context;
};
