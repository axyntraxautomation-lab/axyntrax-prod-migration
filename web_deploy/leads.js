document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    
    // Sanitización básica de inputs
    const rawName = formData.get('nombre') || "";
    const rawWhatsapp = formData.get('whatsapp') || "";
    const cleanName = rawName.replace(/[<>]/g, "").trim();
    const cleanWhatsapp = rawWhatsapp.replace(/\D/g, "");

    const data = {
        nombre: cleanName,
        whatsapp: cleanWhatsapp,
        sector: formData.get('sector'),
        necesidad: formData.get('necesidad'),
        timestamp: new Date().toISOString(),
        source: 'web_form'
    };

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = 'Procesando...';

    try {
        // 1. Persistir Lead en Firestore (Evitar fuga de datos)
        console.log('Persistiendo lead en Firestore:', data);
        try {
            const { db, addDoc, collection } = await import('./firebase-config.js');
            await addDoc(collection(db, "leads"), data);
        } catch (dbError) {
            console.error('Error persistiendo en DB:', dbError);
            // Continuamos con WhatsApp aunque falle la DB para no perder la venta inmediata
        }

        // 2. Armar mensaje de WhatsApp
        const mensaje = `Hola AxyntraX! Mi nombre es ${data.nombre}.%0A%0A` +
                        `Vengo de la web y estoy interesado en automatizar mi negocio.%0A%0A` +
                        `*Detalles:*%0A` +
                        `- Sector: ${data.sector}%0A` +
                        `- Necesidad: ${data.necesidad}%0A%0A` +
                        `*Nota:* He aceptado la Política de Protección de Datos.%0A%0A` +
                        `¿Podemos agendar una breve llamada?`;

        const phone = "51991740590";
        const whatsappUrl = `https://wa.me/${phone}?text=${mensaje}`;

        // 3. Feedback visual
        submitBtn.innerText = '¡Todo listo!';
        submitBtn.style.background = '#25D366';

        // 4. Redirigir después de un breve delay
        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
            this.reset();
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
            submitBtn.style.background = '';
        }, 1500);

    } catch (error) {
        console.error('Error al capturar lead:', error);
        alert('Hubo un problema al enviar tus datos. Por favor intenta por el botón de WhatsApp directo.');
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
});
