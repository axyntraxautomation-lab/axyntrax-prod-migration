import { db, addDoc, collection } from './firebase-config.js';

// 1. Particle Background for Hero
const canvas = document.getElementById('hero-particles');
const ctx = canvas.getContext('2d');
let particles = [];

function initParticles() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speedX: Math.random() * 1 - 0.5,
            speedY: Math.random() * 1 - 0.5,
            color: Math.random() > 0.5 ? '#00A3FF' : '#FFFFFF'
        });
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', initParticles);
initParticles();
animateParticles();

// 2. Scroll Animations (Reveal on scroll)
const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));

// 3. Testimonials Carousel
const testimonials = [
    { text: "AxyntraX cambió la forma en que mi clínica atiende. Recuperamos el 40% de las citas perdidas.", author: "— Dr. Ricardo M., Sector Médico" },
    { text: "La Suite Gold es impresionante. Tenemos control total de las operaciones desde el celular.", author: "— Ing. Elena G., Logística Arequipa" },
    { text: "El DentBot automatizó mis cobros por fase. Ahora el flujo de caja es predecible.", author: "— Dra. Sofía L., Dental Elite" }
];

let currentTest = 0;
const testContainer = document.getElementById('test-carousel');

function rotateTestimonials() {
    currentTest = (currentTest + 1) % testimonials.length;
    testContainer.innerHTML = `
        <div class="carousel-item active reveal-up">
            <p>"${testimonials[currentTest].text}"</p>
            <span>${testimonials[currentTest].author}</span>
        </div>
    `;
}
setInterval(rotateTestimonials, 5000);

// 4. Firebase Form Submission
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const industry = document.getElementById('industry').value;
    
    submitBtn.disabled = true;
    submitBtn.innerText = 'Enviando...';
    
    try {
        await addDoc(collection(db, "leads"), {
            name,
            phone,
            industry,
            timestamp: new Date().toISOString(),
            source: 'web_futuristic'
        });
        
        submitBtn.innerText = '¡Enviado!';
        submitBtn.style.background = '#25D366';
        
        // WhatsApp Redirect
        const msg = `Hola AxyntraX! Mi nombre es ${name}. Me interesa la automatización para el sector ${industry}.`;
        const waUrl = `https://wa.me/51991740590?text=${encodeURIComponent(msg)}`;
        
        setTimeout(() => {
            window.open(waUrl, '_blank');
            contactForm.reset();
            submitBtn.disabled = false;
            submitBtn.innerText = 'Enviar Solicitud';
            submitBtn.style.background = '';
        }, 1500);
        
    } catch (error) {
        console.error("Error al enviar:", error);
        alert("Hubo un error al procesar tu solicitud. Por favor intenta por WhatsApp.");
        submitBtn.disabled = false;
        submitBtn.innerText = 'Enviar Solicitud';
    }
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});
