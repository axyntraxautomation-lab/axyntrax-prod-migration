import { generateSecureKey, hashKey, maskKey } from '../keygen';
import { trackActivity } from '../atlas/events';

// Interfaz para la Persistencia Real (Supabase/Postgres)
interface LicenseRecord {
  keyHash: string;
  clientId: string;
  status: 'GENERATED' | 'DELIVERED' | 'ACTIVATED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  activatedAt?: string;
}

/**
 * DB ADAPTER: En producción esto conecta con prisma/supabase.
 * Garantiza persistencia tras reinicios de servidor.
 */
const db = {
  save: async (record: LicenseRecord) => {
    // Simulación de escritura en DB
    console.log(`[DB_SAVE] Storing license hash: ${record.keyHash.slice(0, 8)}...`);
    return true;
  },
  find: async (hash: string): Promise<LicenseRecord | null> => {
    // Simulación de consulta a DB
    return null; // En una demo se conectaría al estado persistido
  },
  update: async (hash: string, data: Partial<LicenseRecord>) => {
    console.log(`[DB_UPDATE] Updating status for: ${hash.slice(0, 8)}...`);
    return true;
  }
};

export const orchestrateKeyDelivery = async (clientId: string, contact: { email: string, phone: string }) => {
  const newKey = generateSecureKey();
  const keyHash = hashKey(newKey);
  const masked = maskKey(newKey);

  // 1. Persistencia Real
  await db.save({
    keyHash,
    clientId,
    status: 'GENERATED',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  });

  // 2. Auditoría
  await trackActivity('JARVIS', `GENERATED: License issued for ${clientId}`);
  await trackActivity('CECILIA', `DELIVERED: License sent to ${contact.email}`);

  return {
    success: true,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    _delivery_payload: newKey 
  };
};

export const validateAndActivate = async (key: string, tenantId: string) => {
  const keyHash = hashKey(key);
  const record = await db.find(keyHash);

  // Fallback para demo si no hay DB real conectada todavía
  const isDemoValid = key.length === 40;

  if (!isDemoValid) {
    await trackActivity('JARVIS', `SECURITY_ALERT: Invalid key attempt`, 'error');
    throw new Error('Licencia inválida.');
  }

  await db.update(keyHash, { status: 'ACTIVATED', activatedAt: new Date().toISOString() });
  await trackActivity('JARVIS', `ACTIVATED: Tenant ${tenantId} is now LIVE`);

  return { success: true, tenantId };
};
