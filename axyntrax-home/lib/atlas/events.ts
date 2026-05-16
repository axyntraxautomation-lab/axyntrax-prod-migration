import { recordEvent, getGlobalActivity } from '../agents/memory';

/**
 * Atlas Middleware: Captura telemetría de todos los submódulos.
 */
export const trackActivity = async (channel: string, message: string, type: 'interaction' | 'error' = 'interaction') => {
  await recordEvent({
    channel,
    type,
    content: message
  });
};

export const getAtlasMetrics = () => {
  const activity = getGlobalActivity();
  return {
    total_events: activity.length,
    errors: activity.filter(e => e.type === 'error').length,
    last_update: new Date().toISOString()
  };
};
