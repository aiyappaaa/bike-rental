import { BUSINESS_CONFIG } from '../constants';

/**
 * Format currency amount for display
 */
export const formatCurrency = (
  amount: number,
  currency: string = BUSINESS_CONFIG.DEFAULT_CURRENCY,
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format currency amount with symbol only (no currency code)
 */
export const formatCurrencySymbol = (amount: number): string => {
  return `${BUSINESS_CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Round currency amount to 2 decimal places
 */
export const roundCurrency = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

/**
 * Calculate GST amount
 */
export const calculateGST = (amount: number, gstPercent: number = BUSINESS_CONFIG.GST_PERCENT): number => {
  return roundCurrency((amount * gstPercent) / 100);
};

/**
 * Calculate amount including GST
 */
export const addGST = (amount: number, gstPercent: number = BUSINESS_CONFIG.GST_PERCENT): number => {
  return roundCurrency(amount + calculateGST(amount, gstPercent));
};

/**
 * Calculate amount excluding GST
 */
export const removeGST = (amountWithGST: number, gstPercent: number = BUSINESS_CONFIG.GST_PERCENT): number => {
  return roundCurrency(amountWithGST / (1 + gstPercent / 100));
};

/**
 * Calculate percentage discount
 */
export const calculatePercentageDiscount = (amount: number, percentage: number): number => {
  return roundCurrency((amount * percentage) / 100);
};

/**
 * Apply discount to amount
 */
export const applyDiscount = (amount: number, discount: number, isPercentage: boolean = false): number => {
  if (isPercentage) {
    return roundCurrency(amount - calculatePercentageDiscount(amount, discount));
  }
  return roundCurrency(amount - discount);
};

/**
 * Calculate surge pricing
 */
export const applySurgeMultiplier = (amount: number, multiplier: number): number => {
  return roundCurrency(amount * multiplier);
};

/**
 * Calculate late fee
 */
export const calculateLateFee = (hoursLate: number, feePerHour: number = BUSINESS_CONFIG.LATE_FEE_PER_HOUR): number => {
  return roundCurrency(Math.ceil(hoursLate) * feePerHour);
};

/**
 * Calculate damage deposit
 */
export const calculateDamageDeposit = (
  dailyRate: number,
  depositPercent: number = BUSINESS_CONFIG.DAMAGE_DEPOSIT_PERCENT
): number => {
  return roundCurrency((dailyRate * depositPercent) / 100);
};

/**
 * Convert amount between currencies (placeholder for future implementation)
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number = 1
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  return roundCurrency(amount * exchangeRate);
};

/**
 * Validate currency amount
 */
export const isValidCurrencyAmount = (amount: number): boolean => {
  return Number.isFinite(amount) && amount >= 0;
};

/**
 * Parse currency string to number
 */
export const parseCurrencyString = (currencyString: string): number => {
  // Remove currency symbols and spaces, then parse
  const cleanString = currencyString.replace(/[₹$€£,\s]/g, '');
  const amount = parseFloat(cleanString);
  return isNaN(amount) ? 0 : amount;
};

/**
 * Format amount for payment gateway (usually in smallest currency unit)
 */
export const formatForPaymentGateway = (amount: number, currency: string = BUSINESS_CONFIG.DEFAULT_CURRENCY): number => {
  // For INR, convert to paise (multiply by 100)
  // For USD, convert to cents (multiply by 100)
  // For currencies without subunits, return as is
  const multipliers: Record<string, number> = {
    INR: 100,
    USD: 100,
    EUR: 100,
    GBP: 100,
  };
  
  const multiplier = multipliers[currency] || 1;
  return Math.round(amount * multiplier);
};

/**
 * Format amount from payment gateway (convert from smallest currency unit)
 */
export const formatFromPaymentGateway = (amount: number, currency: string = BUSINESS_CONFIG.DEFAULT_CURRENCY): number => {
  const divisors: Record<string, number> = {
    INR: 100,
    USD: 100,
    EUR: 100,
    GBP: 100,
  };
  
  const divisor = divisors[currency] || 1;
  return roundCurrency(amount / divisor);
};

/**
 * Calculate total amount breakdown
 */
export interface AmountBreakdown {
  subtotal: number;
  gstAmount: number;
  discount: number;
  surgeAmount: number;
  deposit: number;
  lateFee: number;
  total: number;
}

export const calculateAmountBreakdown = (
  baseAmount: number,
  options: {
    gstPercent?: number;
    discount?: number;
    isDiscountPercentage?: boolean;
    surgeMultiplier?: number;
    deposit?: number;
    lateFee?: number;
  } = {}
): AmountBreakdown => {
  const {
    gstPercent = BUSINESS_CONFIG.GST_PERCENT,
    discount = 0,
    isDiscountPercentage = false,
    surgeMultiplier = 1,
    deposit = 0,
    lateFee = 0,
  } = options;

  // Apply surge pricing to base amount
  const surgedAmount = applySurgeMultiplier(baseAmount, surgeMultiplier);
  const surgeAmount = surgedAmount - baseAmount;

  // Apply discount
  const discountAmount = isDiscountPercentage 
    ? calculatePercentageDiscount(surgedAmount, discount)
    : discount;
  
  const subtotal = roundCurrency(surgedAmount - discountAmount);

  // Calculate GST on subtotal
  const gstAmount = calculateGST(subtotal, gstPercent);

  // Calculate total
  const total = roundCurrency(subtotal + gstAmount + deposit + lateFee);

  return {
    subtotal,
    gstAmount,
    discount: discountAmount,
    surgeAmount,
    deposit,
    lateFee,
    total,
  };
};
