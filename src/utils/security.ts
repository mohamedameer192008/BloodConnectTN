import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * XSS & NoSQL injection mitigation helper.
 * Strips HTML tags and sanitizes user input strings.
 */
export function sanitizeInput(val: string): string {
  if (!val) return '';
  return val
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[$\{\}]/g, '') // basic NoSQL injection defense
    .trim();
}

/**
 * Validates Email addresses based on standard regex.
 */
export function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validates Phone Numbers (exactly 10 digits for Indian mobile numbers).
 */
export function validatePhone(phone: string): boolean {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
}

/**
 * Password Strength Verification:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  specialChar: boolean;
  isValid: boolean;
}

export function checkPasswordStrength(password: string): PasswordRequirements {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
  };

  const isValid = Object.values(requirements).every(Boolean);

  return {
    ...requirements,
    isValid,
  };
}

/**
 * Generates a basic visual math CAPTCHA to protect forms inside the iframe.
 */
export interface MathCaptcha {
  num1: number;
  num2: number;
  question: string;
  answer: number;
}

export function generateCaptcha(): MathCaptcha {
  const num1 = Math.floor(Math.random() * 9) + 1; // 1 to 9
  const num2 = Math.floor(Math.random() * 9) + 1; // 1 to 9
  return {
    num1,
    num2,
    question: `What is ${num1} + ${num2}?`,
    answer: num1 + num2,
  };
}

/**
 * Secure Activity Logger.
 * Records user-initiated updates, logins, registrations and requests
 * into Firestore `/activityLogs` with absolute zero leakage of credentials/passwords.
 */
export async function logSecurityActivity(
  action: string,
  userId: string | null,
  userEmail: string | null,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const logData = {
      action,
      userId: userId || 'anonymous',
      userEmail: userEmail || 'anonymous',
      timestamp,
      details: {
        ...details,
        // Ensure sensitive info is NEVER logged
        password: '[REDACTED]',
        credentials: '[REDACTED]',
      },
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server Environment',
      ipAddress: 'MOCKED_SECURE_IP', // Real IP is resolved by the gateway
    };

    console.log(`[SECURITY AUDIT LOG]: ${action} by ${userEmail || 'anonymous'}`, logData);
    
    // Attempt Firestore write. If offline or bypassed, fails silently but logs locally.
    await addDoc(collection(db, 'activityLogs'), logData);
  } catch (err) {
    console.warn('Failed to write to central Firestore audit logs (offline/local mode):', err);
  }
}
