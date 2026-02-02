import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Base API URL - can be configured for different environments
export const API_BASE_URL = typeof window !== 'undefined' 
  ? process.env.VITE_API_URL || window.location.origin
  : process.env.API_URL || 'http://localhost:5000';

// Function to build API URLs
export function buildApiUrl(path: string): string {
  // Ensure API_BASE_URL doesn't end with a slash and path starts with a slash
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
}
