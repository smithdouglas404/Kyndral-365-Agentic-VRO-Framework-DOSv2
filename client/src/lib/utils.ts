import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | undefined): string {
  if (value === undefined || value === null) return "";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^\d.-]/g, "")) : value;
  if (isNaN(num)) return value.toString();

  const absNum = Math.abs(num);
  if (absNum >= 1000000000) return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(num);

  if (absNum >= 1000000) return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(num);

  if (absNum >= 1000) return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0
  }).format(num);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}
