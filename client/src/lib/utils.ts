import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Base API URL - can be configured for different environments
export const API_BASE_URL = typeof window !== 'undefined' 
  ? process.env.REACT_APP_API_URL || process.env.VITE_API_URL || window.location.origin
  : process.env.API_URL || 'http://localhost:5000';

// Function to build API URLs
export function buildApiUrl(path: string): string {
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
}
