import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { askCecilia } from '@/lib/cecilia-logic';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * AGENTE MARK - Marketing Autónomo v1.5
 * Pulling live credentials from Neural Center.
 */

export async function GET(request: Request) {
  try {
    // 1. Obtener Credenciales En Vivo desde Firestore
    const configRef = doc(db, 'system_config', 'mark_credentials');
    const configSnap = await getDoc(configRef);
    const liveConfig = configSnap.exists() ? configSnap.data() : {
        fb_page_id: process.env.FB_PAGE_ID,
        ig_account_id: process.env.IG_ACCOUNT_ID,
        fb_access_token: process.env.META_GRAPH_ACCESS_TOKEN
    };

    const fbPageId = liveConfig.fb_page_id;
    const igAccountId = liveConfig.ig_account_id;
    const metaToken = liveConfig.fb_access_token;
    const linkedinToken = liveConfig.linkedin_token;
    const linkedinOrgId = liveConfig.linkedin_org_id;

    // 2. Cecilia genera el concepto publicitario
    const prompt = "Actúa como MARK, el experto en Marketing de Axyntrax. " +
                   "Genera un copy publicitario de alto impacto para redes sociales (FB, IG, LinkedIn). " +
                   "Enfócate en la automatización con IA para PYMES. Usa emojis, hashtags y un CTA fuerte.";
    
    const { reply: adCopy } = await askCecilia(prompt, 'web');

    // 3. Selección de Imagen Premium
    const images = [
      'medical_ai_module_1778798728555.png',
      'legal_tech_module_1778798742435.png',
      'car_wash_tech_module_1778798756312.png',
      'restaurant_ia_module_1778798774214.png'
    ];
    const selectedImage = images[Math.floor(Math.random() * images.length)];

    // 4. Publicar en Facebook
    if (metaToken && fbPageId && fbPageId !== 'PENDIENTE_POR_ADMIN') {
      await fetch(`https://graph.facebook.com/v19.0/${fbPageId}/feed`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${metaToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: adCopy, link: 'https://www.axyntrax-automation.net' })
      });
    }

    // 5. LinkedIn (Placeholder con Token dinámico)
    if (linkedinToken && linkedinOrgId) {
        console.log('MARK: Publicando en LinkedIn con Token de Usuario...');
        // Aquí iría la llamada a LinkedIn API con el token proporcionado por el usuario
    }

    return NextResponse.json({ 
      status: 'SUCCESS', 
      agent: 'MARK', 
      action: 'Publicidad orquestada con credenciales dinámicas',
      image: selectedImage
    });

  } catch (error) {
    console.error('MARK Agent Error:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}
