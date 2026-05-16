/**
 * AXYNTRAX AUTOMATION - Welcome Email Template
 * Professional branding and clear call to action.
 */

export const getWelcomeEmailHtml = (nombre: string, empresa: string, demoKey: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0A0A0F; color: #FFFFFF; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0D0D0D; border: 1px solid #1A1A1A; border-radius: 24px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #00D4FF 0%, #7B2FFF 100%); padding: 40px; text-align: center; }
        .content { padding: 40px; }
        .key-box { background: rgba(0, 212, 255, 0.1); border: 1px dashed #00D4FF; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0; }
        .footer { padding: 20px; text-align: center; font-size: 10px; color: #555; }
        .button { display: inline-block; padding: 15px 30px; background-color: #00D4FF; color: #000; text-decoration: none; font-weight: bold; border-radius: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0; font-size: 28px;">AXYNTRAX AUTOMATION</h1>
            <p style="margin:10px 0 0 0; font-size: 12px; letter-spacing: 2px;">IA ECOSYSTEM ACTIVATED</p>
        </div>
        <div class="content">
            <h2 style="color: #00D4FF;">¡Hola ${nombre}!</h2>
            <p>Es un placer darte la bienvenida a la red de orquestación inteligente de <strong>Axyntrax</strong>.</p>
            <p>Tu solicitud para la empresa <strong>${empresa}</strong> ha sido procesada con éxito por nuestro CEO JARVIS.</p>
            
            <div class="key-box">
                <span style="display: block; font-size: 10px; text-transform: uppercase; margin-bottom: 5px;">Tu Llave de Acceso (30 Días):</span>
                <strong style="font-size: 24px; color: #FFF; letter-spacing: 2px;">${demoKey}</strong>
            </div>

            <p>Para comenzar, descarga los módulos correspondientes a tu rubro desde nuestra web oficial y utiliza tu KEY para la activación.</p>
            
            <center>
                <a href="https://www.axyntrax-automation.net" class="button">IR A LA WEB DE DESCARGA</a>
            </center>

            <p style="margin-top: 40px; font-size: 14px;">Si necesitas ayuda técnica, nuestra asistente <strong>Cecilia</strong> está disponible 24/7 vía WhatsApp.</p>
        </div>
        <div class="footer">
            © 2026 Axyntrax Automation S.A.C. | RUC 10406750324 | Arequipa - Perú
        </div>
    </div>
</body>
</html>
`;
