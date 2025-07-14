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

export function getDomainFromUrl(url: string): string | null {
  if (!url) {
    return null;
  }
  try {
    // URL constructor is the most reliable way to parse URLs
    const urlObject = new URL(url);
    // The hostname property gives us the domain (e.g., 'www.example.com')
    return urlObject.hostname;
  } catch (e) {
    // If the URL is invalid, the constructor will throw an error
    // For simple cases or relative paths, we can try a regex fallback
    const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im);
    return match ? match[1] : null;
  }
}
