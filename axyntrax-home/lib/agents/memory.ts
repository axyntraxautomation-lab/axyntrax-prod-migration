/**
 * Neural Memory: Almacén compartido para la suite AXYNTRAX.
 * Permite que Cecilia Master tenga visibilidad sobre todos los canales.
 */
export interface NeuralEvent {
  id: string;
  timestamp: string;
  channel: string;
  type: 'interaction' | 'error' | 'sale' | 'lead';
  content: string;
  metadata?: any;
}

// Simulación de persistencia (En producción se conectaría a Firebase/Supabase)
const memory: NeuralEvent[] = [];

export const recordEvent = async (event: Omit<NeuralEvent, 'id' | 'timestamp'>) => {
  const newEvent: NeuralEvent = {
    ...event,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString()
  };
  
  // Log para Atlas
  console.log(`[ATLAS_EVENT] [${newEvent.channel.toUpperCase()}] ${newEvent.content}`);
  
  memory.push(newEvent);
  return newEvent;
};

export const getGlobalActivity = () => memory;

export const getSummaryForMaster = () => {
  return memory.slice(-20).map(e => `[${e.channel}] ${e.content}`).join('\n');
};
