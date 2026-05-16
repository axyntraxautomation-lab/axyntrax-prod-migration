import { NextResponse } from 'next/server';
import { THRESHOLDS } from '@/lib/agents/deepseek/limiter';
import { getAtlasMetrics } from '@/lib/atlas/events';

export async function GET() {
  const metrics = getAtlasMetrics();
  
  const stats = {
    status: "Cecilia is online",
    model: "DeepSeek V4 Flash",
    atlas_telemetry: {
      total_interactions: metrics.total_events,
      system_errors: metrics.errors,
      sync_status: "Sincronizado con Neural Memory",
      last_event: metrics.last_update
    },
    neural_core: {
      circuit_breaker: "CLOSED (Healthy)",
      safety_truncation: "2000 chars"
    },
    rate_limits: {
      global: THRESHOLDS.GLOBAL,
      channels: {
        web: THRESHOLDS.WEB,
        whatsapp: THRESHOLDS.WSP,
        meta_omnichannel: THRESHOLDS.FB_IG,
        linkedin: THRESHOLDS.LI
      }
    }
  };

  return NextResponse.json(stats);
}
