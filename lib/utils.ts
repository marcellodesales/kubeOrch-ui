import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Base64-encode a string (e.g., PEM certificates/keys before sending to the API).
 */
export function toBase64(str: string): string {
  return btoa(str);
}
