import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format a date in IST timezone
 */
export function formatInIST(date: Date | string | null | undefined, formatString: string): string {
  if (!date) return 'Not set';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Handle various date string formats properly
      if (date.includes('Z') || date.includes('+') || date.includes('-')) {
        // Date already has timezone info
        dateObj = new Date(date);
      } else {
        // Date doesn't have timezone, assume UTC
        dateObj = new Date(date + 'Z');
      }
    } else {
      dateObj = date;
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date passed to formatInIST:', date);
      return 'Invalid date';
    }
    
    return formatInTimeZone(dateObj, IST_TIMEZONE, formatString);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Invalid date';
  }
}

/**
 * Convert a date to IST timezone
 */
export function toIST(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  // Convert to IST by creating a new date with IST offset
  const istOffsetMs = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60 * 1000);
  return new Date(utcTime + istOffsetMs);
}

/**
 * Format SLA deadline for display
 */
export function formatSLATime(deadline: Date | string | null | undefined): string {
  return formatInIST(deadline, 'MMM d, yyyy \'at\' h:mm a \'IST\'');
}

/**
 * Format date for ticket listing
 */
export function formatTicketDate(date: Date | string | null | undefined): string {
  return formatInIST(date, 'MMM dd, yyyy');
}

/**
 * Format date and time for ticket details
 */
export function formatTicketDateTime(date: Date | string | null | undefined): string {
  return formatInIST(date, 'MMM d, yyyy h:mm a \'IST\'');
}

/**
 * Format short date time with IST indicator
 */
export function formatShortDateTime(date: Date | string | null | undefined): string {
  return formatInIST(date, 'MMM dd, HH:mm');
}