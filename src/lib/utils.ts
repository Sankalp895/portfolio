import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Magic UI components expect this helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
