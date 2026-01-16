/**
 * Format a value in millions to proper USD notation with B/M/K suffixes
 * @param valueInMillions - The value in millions (e.g., 185910 = $185.9B)
 */
export function formatMoney(valueInMillions: number): string {
  if (valueInMillions >= 1000) {
    return `$${(valueInMillions / 1000).toFixed(1)}B`;
  }
  if (valueInMillions >= 1) {
    return `$${valueInMillions.toFixed(1)}M`;
  }
  if (valueInMillions >= 0.001) {
    return `$${(valueInMillions * 1000).toFixed(0)}K`;
  }
  return `$${valueInMillions.toFixed(2)}M`;
}

/**
 * Format a value in millions to display value - handles billions properly
 * @param valueInMillions - The value in millions
 */
export function formatValueInMillions(valueInMillions: number): string {
  if (valueInMillions >= 1000) {
    return `$${(valueInMillions / 1000).toFixed(1)}B`;
  }
  if (valueInMillions >= 100) {
    return `$${valueInMillions.toFixed(0)}M`;
  }
  if (valueInMillions >= 1) {
    return `$${valueInMillions.toFixed(1)}M`;
  }
  if (valueInMillions >= 0.001) {
    return `$${(valueInMillions * 1000).toFixed(0)}K`;
  }
  return `$${valueInMillions.toFixed(2)}M`;
}

/**
 * Format large raw numbers with appropriate suffix (B/M/K)
 */
export function formatLargeNumber(value: number, unit: string = ''): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B${unit}`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M${unit}`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K${unit}`;
  }
  return `${value}${unit}`;
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format raw currency value with locale formatting
 */
export function formatCurrency(value: number, currency: string = '$'): string {
  return `${currency}${value.toLocaleString()}`;
}

/**
 * Format value for display cards - auto-detects and formats appropriately
 * For values that are already in millions, use this to get proper B/M notation
 */
export function formatDisplayValue(value: number, isInMillions: boolean = true): string {
  if (isInMillions) {
    return formatValueInMillions(value);
  }
  return formatLargeNumber(value);
}

/**
 * Format a value with its unit, ensuring proper placement of currency symbols
 * Handles units like "$m", "$M", "$bn", "%", "days", "MW", etc.
 * @param value - The numeric value
 * @param unit - The unit string (e.g., "$m", "%", "days")
 */
export function formatValueWithUnit(value: number, unit: string): string {
  // Handle currency units - put $ before the number
  if (unit === '$m' || unit === '$M') {
    return `$${value}M`;
  }
  if (unit === '$bn' || unit === '$B' || unit === '$b') {
    return `$${value}B`;
  }
  if (unit === '$k' || unit === '$K') {
    return `$${value}K`;
  }
  if (unit.startsWith('$')) {
    // Generic currency - put $ first, unit suffix after
    return `$${value}${unit.slice(1).toUpperCase()}`;
  }
  // For all other units, put value first then unit
  return `${value}${unit}`;
}
