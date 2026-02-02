import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Base API URL - can be configured for different environments
export const API_BASE_URL = typeof window !== 'undefined' 
  ? (process.env.VITE_API_URL || window.location.origin).replace(/(^['"]|['"]$)/g, '') // Remove leading/trailing quotes if present
  : (process.env.API_URL || 'http://localhost:5000').replace(/(^['"]|['"]$)/g, ''); // Remove leading/trailing quotes if present

// Function to build API URLs
export function buildApiUrl(path: string): string {
  // Clean the base URL by removing leading/trailing quotes and slashes
  let cleanBaseUrl = API_BASE_URL.replace(/(^['"]|['"]$)/g, '');
  cleanBaseUrl = cleanBaseUrl.endsWith('/') ? cleanBaseUrl.slice(0, -1) : cleanBaseUrl;
  
  // Clean the path by ensuring it starts with a slash
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${cleanBaseUrl}${cleanPath}`;
}
