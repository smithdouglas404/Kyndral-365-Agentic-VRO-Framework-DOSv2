export function formatMoney(valueInMillions: number): string {
  if (valueInMillions >= 1000) {
    return `$${(valueInMillions / 1000).toFixed(1)}B`;
  }
  return `$${valueInMillions}m`;
}

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

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCurrency(value: number, currency: string = '$'): string {
  return `${currency}${value.toLocaleString()}`;
}
