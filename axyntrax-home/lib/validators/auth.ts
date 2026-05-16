/**
 * AXYNTRAX Authentication Logic
 * Validates 40-character keys and manages session types.
 */

export type KeyType = 'DEMO' | 'FULL' | 'INVALID';

export interface UserSession {
  email: string;
  keyType: KeyType;
  expiresAt: string | null;
  activeModules: string[];
}

export const validateKey = (key: string): { type: KeyType; daysRemaining: number } => {
  if (key.length !== 40) return { type: 'INVALID', daysRemaining: 0 };
  
  // Logic: Keys starting with 'AX-DEMO-' are trial keys
  if (key.startsWith('AX-DEMO-')) {
    return { type: 'DEMO', daysRemaining: 30 };
  }
  
  // Logic: Keys starting with 'AX-FULL-' are production keys
  if (key.startsWith('AX-FULL-')) {
    return { type: 'FULL', daysRemaining: 9999 };
  }
  
  return { type: 'INVALID', daysRemaining: 0 };
};

export const checkSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  const session = localStorage.getItem('axyntrax_session');
  return !!session;
};
