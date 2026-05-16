/**
 * AxyntraX Automation - Cecilia Assistant & WhatsApp Hub
 * Repaired from scratch v2.0
 */

class CeciliaAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [
            { role: 'bot', text: '¡Hola! Soy Cecilia, tu asistente virtual de AxyntraX. 🤖' },
            { role: 'bot', text: '¿Te gustaría agendar una demo gratuita de 30 días o tienes alguna duda sobre nuestros módulos?' }
        ];
        this.init();
    }

    init() {
        this.renderStyles();
        this.renderHTML();
        this.setupEventListeners();
    }

    renderStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            #cecilia-hub { position: fixed; bottom: 30px; right: 30px; z-index: 9999; font-family: 'Outfit', sans-serif; }
            .hub-buttons { display: flex; flex-direction: column; gap: 12px; align-items: flex-end; }
            
            .hub-btn { 
                width: 50px; height: 50px; border-radius: 50%; border: none; 
                cursor: pointer; display: flex; align-items: center; justify-content: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative; overflow: visible; text-decoration: none;
            }
            .hub-btn:hover { transform: scale(1.1) translateY(-5px); }
            
            .btn-wsp { background: #25D366; color: white; font-size: 24px; }
            .btn-fb { background: #1877F2; color: white; font-size: 24px; }
            .btn-ig { background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: white; font-size: 24px; }
            .btn-cecilia { width: 65px; height: 65px; background: #00E5FF; color: #0D0D0D; font-size: 30px; margin-top: 5px; }
            
            .btn-status { 
                position: absolute; top: 0; right: 0; width: 15px; height: 15px; 
                background: #10B981; border: 3px solid #0D0D0D; border-radius: 50%;
                animation: pulse-green 2s infinite;
            }

            @keyframes pulse-green {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }

            .cecilia-window {
                position: absolute; bottom: 85px; right: 0; width: 350px; height: 500px;
                background: rgba(13, 13, 13, 0.95); backdrop-filter: blur(20px);
                border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 30px;
                display: flex; flex-direction: column; overflow: hidden;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                transform-origin: bottom right; transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                opacity: 0; transform: scale(0.8) translateY(20px); pointer-events: none;
            }
            .cecilia-window.active { opacity: 1; transform: scale(1) translateY(0); pointer-events: all; }

            .cecilia-header { 
                padding: 20px; background: rgba(0, 229, 255, 0.1); 
                border-bottom: 1px solid rgba(255,255,255,0.05);
                display: flex; items-center: center; gap: 12px;
            }
            .cecilia-header .avatar { width: 45px; height: 45px; background: #00E5FF; border-radius: 50%; overflow: hidden; display: flex; items-center: center; justify-content: center; border: 2px solid #00E5FF; }
            .cecilia-header .avatar img { width: 100%; height: 100%; object-fit: cover; }
            .cecilia-header .info { line-height: 1.2; }
            .cecilia-header .name { font-weight: 800; font-size: 14px; color: #00E5FF; }
            .cecilia-header .status { font-size: 10px; color: #10B981; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }

            .cecilia-messages { flex-grow: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
            .msg { max-width: 85%; padding: 12px 16px; border-radius: 20px; font-size: 13px; line-height: 1.5; animation: msgIn 0.3s ease-out forwards; }
            .msg-bot { background: rgba(255,255,255,0.05); color: #FFF; align-self: flex-start; border-bottom-left-radius: 5px; border: 1px solid rgba(255,255,255,0.05); }
            .msg-user { background: #00E5FF; color: #0D0D0D; font-weight: 600; align-self: flex-end; border-bottom-right-radius: 5px; }

            @keyframes msgIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

            .cecilia-input { padding: 20px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 10px; }
            .cecilia-input input { 
                flex-grow: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
                border-radius: 15px; padding: 12px 15px; color: white; font-size: 13px; outline: none;
                transition: border-color 0.3s;
            }
            .cecilia-input input:focus { border-color: #00E5FF; }
            .cecilia-input button { 
                width: 45px; height: 45px; background: #00E5FF; color: #0D0D0D; 
                border: none; border-radius: 15px; cursor: pointer; font-size: 18px;
                transition: transform 0.2s;
            }
            .cecilia-input button:hover { transform: scale(1.05); }

            .typing { display: flex; gap: 4px; padding: 12px 16px; background: rgba(255,255,255,0.05); border-radius: 20px; align-self: flex-start; }
            .dot { width: 6px; height: 6px; background: #00E5FF; border-radius: 50%; opacity: 0.4; animation: blink 1.4s infinite both; }
            .dot:nth-child(2) { animation-delay: 0.2s; }
            .dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

            @media (max-width: 480px) {
                #cecilia-hub { bottom: 20px; right: 20px; }
                .cecilia-window { width: calc(100vw - 40px); height: calc(100vh - 120px); bottom: 75px; }
            }
        `;
        document.head.appendChild(style);
    }

    renderHTML() {
        const hub = document.createElement('div');
        hub.id = 'cecilia-hub';
        hub.innerHTML = `
            <div class="cecilia-window" id="ceciliaWindow">
                <div class="cecilia-header">
                    <div class="avatar"><img src="assets/cecilia-avatar.png" alt="Cecilia"></div>
                    <div class="info">
                        <div class="name">Cecilia Assistant</div>
                        <div class="status">En línea</div>
                    </div>
                </div>
                <div class="cecilia-messages" id="msgContainer"></div>
                <div class="cecilia-input">
                    <input type="text" id="ceciliaInput" placeholder="Escribe tu mensaje..." autocomplete="off">
                    <button id="ceciliaSend"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
            <div class="hub-buttons">
                <a href="https://facebook.com/axyntrax.automation" target="_blank" class="hub-btn btn-fb" title="Síguenos en Facebook">
                    <i class="fa-brands fa-facebook-f"></i>
                </a>
                <a href="https://instagram.com/axyntrax.automation" target="_blank" class="hub-btn btn-ig" title="Síguenos en Instagram">
                    <i class="fa-brands fa-instagram"></i>
                </a>
                <a href="https://wa.me/51991740590" target="_blank" class="hub-btn btn-wsp" title="WhatsApp Directo">
                    <i class="fa-brands fa-whatsapp"></i>
                </a>
                <button class="hub-btn btn-cecilia" id="ceciliaToggle" title="Hablar con Cecilia" style="padding: 0; overflow: hidden; border: 3px solid #00E5FF;">
                    <img src="assets/cecilia-avatar.png" alt="Cecilia" style="width: 100%; height: 100%; object-fit: cover;">
                    <span class="btn-status"></span>
                </button>
            </div>
        `;
        document.body.appendChild(hub);
        this.renderMessages();
    }

    setupEventListeners() {
        const toggle = document.getElementById('ceciliaToggle');
        const input = document.getElementById('ceciliaInput');
        const sendBtn = document.getElementById('ceciliaSend');

        toggle.addEventListener('click', () => this.toggleWindow());
        
        sendBtn.addEventListener('click', () => this.handleSendMessage());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });
    }

    toggleWindow() {
        this.isOpen = !this.isOpen;
        const win = document.getElementById('ceciliaWindow');
        win.classList.toggle('active', this.isOpen);
        if (this.isOpen) {
            document.getElementById('ceciliaInput').focus();
            this.scrollToBottom();
        }
    }

    renderMessages() {
        const container = document.getElementById('msgContainer');
        container.innerHTML = '';
        this.messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `msg msg-${msg.role}`;
            div.innerText = msg.text;
            container.appendChild(div);
        });
        this.scrollToBottom();
    }

    addMessage(role, text) {
        this.messages.push({ role, text });
        this.renderMessages();
    }

    handleSendMessage() {
        const input = document.getElementById('ceciliaInput');
        const text = input.value.trim();
        if (!text) return;

        this.addMessage('user', text);
        input.value = '';
        
        this.showTyping();

        // Simulación de respuesta inteligente
        setTimeout(() => {
            this.hideTyping();
            this.processAIResponse(text);
        }, 1500);
    }

    showTyping() {
        const container = document.getElementById('msgContainer');
        const typing = document.createElement('div');
        typing.id = 'typingIndicator';
        typing.className = 'typing';
        typing.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        container.appendChild(typing);
        this.scrollToBottom();
    }

    hideTyping() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    scrollToBottom() {
        const container = document.getElementById('msgContainer');
        container.scrollTop = container.scrollHeight;
    }

    processAIResponse(userInput) {
        const input = userInput.toLowerCase();
        let response = "";

        if (input.includes('hola') || input.includes('buenos')) {
            response = "¡Hola de nuevo! ¿En qué puedo ayudarte con la automatización de tu negocio hoy?";
        } else if (input.includes('precio') || input.includes('costo') || input.includes('cuanto')) {
            response = "Nuestros planes van desde S/199 al mes. Puedes ver el detalle completo en la sección de PLANES de esta página. ¿Te gustaría agendar una demo?";
        } else if (input.includes('demo') || input.includes('prueba') || input.includes('gratis')) {
            response = "¡Excelente! Ofrecemos 30 días de prueba sin costo. Solo ve a la sección de REGISTRO o haz clic en el botón de arriba. 🚀";
        } else if (input.includes('taller') || input.includes('mecanico')) {
            response = "Nuestro módulo de Talleres es líder en el Perú. Permite gestionar órdenes de trabajo, repuestos y clientes de forma automática.";
        } else {
            response = "Entiendo. Para darte una atención más personalizada sobre ese tema, ¿te gustaría que un especialista te contacte por WhatsApp?";
        }

        this.addMessage('bot', response);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.cecilia = new CeciliaAssistant();
});
