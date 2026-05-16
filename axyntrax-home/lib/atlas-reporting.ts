/**
 * AXYNTRAX - ATLAS REPORTING SYSTEM
 * Connects Cecilia (Vercel) with the local Jarvis/Atlas ecosystem.
 */

export interface AtlasReport {
  origen: 'CECILIA' | 'MARK' | 'NEO';
  tipo: 'MENSAJE' | 'LEAD' | 'ERROR' | 'ACCION';
  mensaje: string;
  prioridad: 1 | 2 | 3; // 1: Low, 2: Med, 3: High
  metadata?: any;
}

export async function reportToAtlas(report: AtlasReport) {
  const API_URL = process.env.AXIA_API_URL || 'https://axyntrax-automation.net/api';
  const AGENT_KEY = process.env.AGENT_SECRET_KEY || 'AX-INTERNAL-2026';

  console.log(`[ATLAS] Reporting ${report.tipo} from ${report.origen}...`);

  try {
    const response = await fetch(`${API_URL}/jarvis/notificar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Key': AGENT_KEY, // Secret key to bypass middleware
      },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      console.warn(`[ATLAS] Failed to report: ${response.status} ${response.statusText}`);
      // Fallback: Store in Firestore if API is down
      await saveReportToFirestore(report);
    } else {
      console.log(`[ATLAS] Report delivered successfully.`);
    }
  } catch (err: any) {
    console.error(`[ATLAS] Error reporting to API: ${err.message}`);
    await saveReportToFirestore(report);
  }
}

async function saveReportToFirestore(report: AtlasReport) {
  try {
    const { db } = await import('./firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    await addDoc(collection(db, 'system_reports'), {
      ...report,
      timestamp: serverTimestamp(),
      delivered: false
    });
    console.log(`[ATLAS] Report saved to Firestore (Fallback).`);
  } catch (fErr) {
    console.error(`[ATLAS] Critical Fallback Error:`, fErr);
  }
}
