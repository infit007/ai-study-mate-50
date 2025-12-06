import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to safely parse JSON responses
export async function parseJSONResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Server error: ${response.status} ${response.statusText}. Please make sure the backend server is running on port 5000.`);
  }
  return response.json();
}