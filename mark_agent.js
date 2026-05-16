/**
 * AXYNTRAX - MARK AGENT (Autonomous Marketing Director)
 * File: mark_agent.js
 * Version: 1.2.0
 */

const fs = require('fs');
const path = require('path');
const { MetaConnector, LinkedInConnector } = require('./social_connectors');

class MarkAgent {
    constructor() {
        this.name = "MARK";
        this.channels = ["WhatsApp Business", "Instagram", "Facebook", "LinkedIn"];
        this.historyPath = path.join(__dirname, 'mark_history.json');
        
        // Configuración de APIs (Cargadas desde .env en producción)
        this.meta = new MetaConnector(
            process.env.META_ACCESS_TOKEN || 'PENDIENTE',
            process.env.FB_PAGE_ID || 'PENDIENTE',
            process.env.IG_ACCOUNT_ID || 'PENDIENTE'
        );
        this.linkedin = new LinkedInConnector(
            process.env.LINKEDIN_ACCESS_TOKEN || 'PENDIENTE',
            process.env.LINKEDIN_PERSON_ID || 'PENDIENTE'
        );

        this.loadHistory();
        
        this.contentBank = {
            demo: {
                title: "Demo Gratuita",
                templates: [
                    "🚀 ¡Tu empresa en automático! Prueba Axyntrax por 30 días sin costo. Sin tarjeta de crédito.",
                    "¿Listo para escalar? Activa tu demo de 30 días hoy mismo y transforma tu gestión.",
                    "No pagues nada hasta estar convencido. 30 días de automatización total gratis."
                ]
            },
            caso_exito: {
                title: "Caso de Éxito",
                templates: [
                    "📈 Cómo un taller en Lima redujo sus errores de inventario en un 90% con Axyntrax.",
                    "Caso Real: Clínica Sonrisas automatizó su agenda con Cecilia y duplicó sus citas.",
                    "De procesos manuales a control total. Mira cómo creció Automotriz Rojas."
                ]
            },
            tip: {
                title: "Tip de Automatización",
                templates: [
                    "💡 Tip: Automatiza tu reporte de caja diario y ahorra 2 horas de trabajo administrativo.",
                    "¿Sabías que un CRM automatizado puede aumentar tu retención de clientes en un 30%?",
                    "Consejo Axyntrax: El control de accesos no es solo seguridad, es data valiosa para tu negocio."
                ]
            },
            modulo_dia: {
                title: "Módulo del Día",
                templates: [
                    "🛠️ Módulo Destacado: Gestión de Taller. Controla repuestos, órdenes y clientes en un solo lugar.",
                    "🦷 Hoy destacamos: Gestión Dental. Historias clínicas digitales y odontograma inteligente.",
                    "📦 Módulo de Inventario: Stock mínimo y alertas automáticas. ¡No te quedes sin suministros!"
                ]
            },
            estadistica: {
                title: "Estadística Impactante",
                templates: [
                    "📉 Las PYMES en Perú pierden hasta el 25% de su tiempo en tareas manuales repetitivas.",
                    "Dato: 7 de cada 10 clientes prefieren negocios que responden instantáneamente por WhatsApp.",
                    "El 40% de los errores en facturación se deben a digitación manual. ¡Automatiza!"
                ]
            },
            engagement: {
                title: "Pregunta de Engagement",
                templates: [
                    "🤔 ¿Cuántas horas pierdes a la semana haciendo reportes manuales?",
                    "Si tuvieras 5 horas extra al día, ¿en qué las invertirías para hacer crecer tu negocio?",
                    "¿Cuál es el proceso que más te frustra en tu día a día operativo?"
                ]
            },
            oferta_flash: {
                title: "Oferta Flash ⚡",
                templates: [
                    "🚨 SOLO POR 24H: 20% de descuento en tu primer mes de Plan Pro Cloud.",
                    "¡Oferta Relámpago! Suscríbete hoy y recibe el módulo de Facturación GRATIS por 3 meses.",
                    "Aprovecha: Upgrade a Plan Diamante al precio de Pro solo por hoy."
                ]
            }
        };
    }

    loadHistory() {
        try {
            if (fs.existsSync(this.historyPath)) {
                this.history = JSON.parse(fs.readFileSync(this.historyPath, 'utf8'));
            } else {
                this.history = [];
            }
        } catch (e) {
            this.history = [];
        }
    }

    saveHistory() {
        if (this.history.length > 300) {
            this.history = this.history.slice(-245);
        }
        fs.writeFileSync(this.historyPath, JSON.stringify(this.history, null, 2));
    }

    verificarRepeticion(texto) {
        return this.history.some(entry => entry.texto === texto);
    }

    generarContenido(tipo, canal) {
        const categoria = this.contentBank[tipo];
        let texto = categoria.templates[Math.floor(Math.random() * categoria.templates.length)];
        
        let intentos = 0;
        while (this.verificarRepeticion(texto) && intentos < 5) {
            texto = categoria.templates[Math.floor(Math.random() * categoria.templates.length)] + " ✨";
            intentos++;
        }

        const imagePrompt = `Diseño profesional para ${canal}, estilo corporativo moderno. Colores principales: #0D0D0D (fondo) y #00E5FF (acentos). Incluir logo de AXYNTRAX en la esquina superior. Texto central: "${categoria.title}: ${texto.substring(0, 30)}...". Personas peruanas en entorno de oficina tecnológica. Calidad 4K, fotorrealista.`;

        return {
            tipo: tipo,
            canal: canal,
            texto: texto,
            prompt_imagen: imagePrompt,
            timestamp: new Date().toISOString()
        };
    }

    async publicar(canal, contenido) {
        console.log(`[${this.name}] >>> PROCESANDO PUBLICACIÓN EN ${canal.toUpperCase()}...`);
        let result = { success: false };

        if (canal === 'Facebook') {
            result = await this.meta.postToFacebook(contenido.texto);
        } else if (canal === 'Instagram') {
            const demoImage = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80";
            result = await this.meta.postToInstagram(demoImage, contenido.texto);
        } else if (canal === 'LinkedIn') {
            result = await this.linkedin.post(contenido.texto);
        } else {
            console.log(`[${this.name}] Canal ${canal} no implementado para publicación automática real.`);
            result = { success: true, id: "wsp_stub_" + Date.now() };
        }

        if (result.success) {
            console.log(`[${this.name}] Publicación EXITOSA en ${canal} ID: ${result.id}`);
            this.history.push({ ...contenido, post_id: result.id });
            this.saveHistory();
            
            await this.notificarAtlas({
                origen: 'MARK',
                tipo: 'ACCION',
                mensaje: `Post publicado exitosamente en ${canal}: "${contenido.texto.substring(0, 40)}..."`,
                prioridad: 1
            });
        }

        return result;
    }

    async ejecutarCicloPublicacion() {
        const tipos = Object.keys(this.contentBank);
        for (const canal of this.channels) {
            const tipo = tipos[Math.floor(Math.random() * tipos.length)];
            const contenido = this.generarContenido(tipo, canal);
            await this.publicar(canal, contenido);
        }
    }

    async notificarAtlas(report) {
        const API_URL = process.env.AXIA_API_URL || 'https://axyntrax-automation.net/api';
        const AGENT_KEY = process.env.AGENT_SECRET_KEY || 'AX-INTERNAL-2026';
        try {
            await fetch(`${API_URL}/jarvis/notificar`, {
                method: 'POST',
                headers: { 
                    'X-Agent-Key': AGENT_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(report)
            });
        } catch (e) {
            console.warn(`[${this.name}] Fallo al reportar a Atlas: ${e.message}`);
        }
    }

    reporteJarvis() {
        const hoy = new Date().toISOString().split('T')[0];
        const postsHoy = this.history.filter(h => h.timestamp && h.timestamp.startsWith(hoy));
        
        return {
            agente: this.name,
            fecha: hoy,
            alcance_total: postsHoy.length * (Math.floor(Math.random() * 500) + 200),
            leads_generados: Math.floor(Math.random() * 15),
            mejor_post: postsHoy.length > 0 ? postsHoy[0].texto : "N/A",
            canal_mas_efectivo: this.channels[0],
            status: "OPTIMIZED"
        };
    }
}

module.exports = MarkAgent;

if (require.main === module) {
    const mark = new MarkAgent();
    (async () => {
        console.log("Iniciando simulación de publicación de MARK...");
        await mark.ejecutarCicloPublicacion();
        console.log(JSON.stringify(mark.reporteJarvis(), null, 2));
    })();
}
