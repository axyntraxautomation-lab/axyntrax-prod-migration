import crypto from 'crypto';

/**
 * Generador Criptográfico AXYNTRAX con Salting
 */
export const generateSecureKey = (): string => {
  return crypto.randomBytes(20).toString('hex').toUpperCase();
};

/**
 * Genera un Hash SHA-256 con SALT secreto.
 * El SALT debe estar configurado en el .env (LICENSE_SALT).
 */
export const hashKey = (key: string): string => {
  const salt = process.env.LICENSE_SALT || 'axyntrax_master_salt_2026';
  return crypto.createHash('sha256')
    .update(key + salt)
    .digest('hex');
};

export const maskKey = (key: string): string => {
  return `${key.slice(0, 8)}********************************`;
};
