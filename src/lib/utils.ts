import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUrlOrigin(url: string): string | null {
  if (!url || !url.startsWith('http')) {
    return null;
  }
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch (e) {
    return null;
  }
}
