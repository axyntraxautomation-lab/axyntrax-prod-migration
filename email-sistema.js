/**
 * AXYNTRAX Automation — Sistema de Emails y Registro
 * Integración con EmailJS para envío de KEY y notificaciones.
 */

// Configuración de EmailJS (Reemplazar con tus credenciales)
const EMAILJS_PUBLIC_KEY = "TU_PUBLIC_KEY"; 
const EMAILJS_SERVICE_ID = "service_axyntrax";
const EMAILJS_TEMPLATE_CLIENTE = "template_bienvenida";
const EMAILJS_TEMPLATE_ADMIN = "template_notificacion_admin";

/**
 * Genera una KEY de licencia aleatoria con formato AXY-XXXX-XXXX-XXXX
 */
function generarKEY() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Evitamos O, 0, I, 1 por confusión
    const segment = () => Array.from({length: 4}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `AXY-${segment()}-${segment()}-${segment()}`;
}

/**
 * Procesa el registro de un nuevo cliente
 */
async function procesarRegistro(event) {
    event.preventDefault();
    
    // 1. Obtener y Validar Datos
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    const datos = {
        nombre: document.querySelector('[placeholder="Nombre completo"]').value,
        empresa: document.querySelector('[placeholder="Empresa"]').value,
        rubro: document.querySelector('select:nth-of-type(1)').value,
        modulo: document.querySelector('select:nth-of-type(2)').value,
        whatsapp: document.querySelector('[placeholder="WhatsApp"]').value,
        email: document.querySelector('[placeholder="Email"]').value,
        fecha: new Date().toLocaleDateString('es-PE'),
        hora: new Date().toLocaleTimeString('es-PE')
    };

    if (!datos.email.includes('@')) return alert("Ingresa un email válido");
    if (datos.whatsapp.length < 9) return alert("Ingresa un WhatsApp válido con código de país");

    // 2. Estado de Carga
    btn.disabled = true;
    btn.innerText = "Creando tu cuenta...";
    
    try {
        // 3. Generar KEY
        const key = generarKEY();
        datos.key = key;

        // 4. Enviar Email al Cliente (vía EmailJS)
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CLIENTE, {
            to_name: datos.nombre,
            to_email: datos.email,
            user_company: datos.empresa,
            user_rubro: datos.rubro,
            user_modulo: datos.modulo,
            user_whatsapp: datos.whatsapp,
            license_key: key,
            reg_date: datos.fecha
        });

        // 5. Enviar Notificación Interna a Axyntrax
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ADMIN, {
            subject: `🆕 Nuevo registro — ${datos.nombre} — ${datos.modulo}`,
            client_name: datos.nombre,
            client_email: datos.email,
            client_whatsapp: datos.whatsapp,
            client_company: datos.empresa,
            client_modulo: datos.modulo,
            client_key: key,
            reg_time: `${datos.fecha} ${datos.hora}`
        });

        // 6. Persistencia Local
        const perfil = {
            ...datos,
            plan: "demo",
            diasRestantes: 30,
            modulosActivos: [datos.modulo],
            registroCompleto: true
        };
        localStorage.setItem('axy_user_profile', JSON.stringify(perfil));
        localStorage.setItem('axy_key', key);
        localStorage.setItem('axy_email', datos.email);

        // 7. Pantalla de Éxito
        mostrarExito(datos);

    } catch (error) {
        console.error("Error en el registro:", error);
        alert("Hubo un problema al procesar tu registro. Por favor, escribe a Cecilia o a axyntraxautomation@gmail.com");
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

/**
 * Reemplaza el formulario por una vista de éxito
 */
function mostrarExito(datos) {
    const formContainer = document.querySelector('#registro-rapido .glass') || document.querySelector('#form-registro');
    
    formContainer.innerHTML = `
        <div class="text-center py-10 animate-in fade-in zoom-in duration-500">
            <div class="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                <i class="fa-solid fa-check"></i>
            </div>
            <h2 class="text-3xl font-bold mb-4">¡Cuenta creada con éxito!</h2>
            <p class="text-gray-400 text-sm mb-8 leading-relaxed">
                Hola ${datos.nombre}, te enviamos tu KEY al email <span class="text-white font-bold">${datos.email}</span>.<br>
                <span class="text-[10px] text-gray-500 uppercase tracking-widest">(Revisa también tu carpeta de spam)</span>
            </p>
            
            <div class="bg-white/5 border border-cyan/30 p-6 rounded-2xl mb-8">
                <div class="text-[10px] text-cyan font-bold tracking-[0.3em] uppercase mb-2">TU KEY DE LICENCIA</div>
                <div class="text-2xl font-mono font-black tracking-widest">${datos.key}</div>
            </div>

            <div class="space-y-4">
                <a href="/descargar" class="w-full block py-4 cyan-gradient text-dark font-black rounded-xl text-lg shadow-xl shadow-cyan/20 transition-all hover:scale-105">
                    Ir a descargar mi módulo
                </a>
                <button onclick="document.getElementById('chat-window').classList.remove('hidden')" class="text-cyan text-sm font-bold hover:underline">
                    ¿Tienes dudas? Habla con Cecilia
                </button>
            </div>
        </div>
    `;
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#registro-rapido form') || document.querySelector('#form-registro form');
    if(form) form.addEventListener('submit', procesarRegistro);
});
