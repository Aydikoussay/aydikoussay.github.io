const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');
const scrollProgress = document.getElementById('scrollProgress');

// --- Particles ---
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = document.documentElement.scrollHeight;
}

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 180, 255, ${this.opacity})`;
        ctx.fill();
    }
}

function initParticles() {
    const count = Math.min(80, Math.floor(canvas.width * canvas.height / 12000));
    particles = Array.from({ length: count }, () => new Particle());
}

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(0, 180, 255, ${0.06 * (1 - dist / 120)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    animationId = requestAnimationFrame(animateParticles);
}

function startParticles() {
    resizeCanvas();
    initParticles();
    animateParticles();
}

window.addEventListener('resize', () => {
    cancelAnimationFrame(animationId);
    startParticles();
});

// Recalc canvas height on scroll (for dynamic content)
window.addEventListener('scroll', () => {
    const newH = document.documentElement.scrollHeight;
    if (Math.abs(canvas.height - newH) > 50) {
        canvas.height = newH;
    }
});

// --- Scroll Progress ---
function updateScrollProgress() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    scrollProgress.style.width = `${progress}%`;
}

// --- Mobile Nav ---
function closeMobileNav() {
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
}

function openMobileNav() {
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
}

mobileMenuBtn?.addEventListener('click', () => {
    if (mobileNav.classList.contains('open')) {
        closeMobileNav();
    } else {
        openMobileNav();
    }
});

document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', closeMobileNav);
});

// --- Smooth Scroll ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeMobileNav();
        }
    });
});

// --- Scroll Animations (Intersection Observer) ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-up').forEach(el => {
    observer.observe(el);
});

// --- Skill Bars ---
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const fills = entry.target.querySelectorAll('.skill-bar-fill');
            fills.forEach(fill => {
                const w = fill.getAttribute('data-width');
                if (w) {
                    fill.style.width = w + '%';
                }
            });
            skillObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('.skills-categories').forEach(el => {
    skillObserver.observe(el);
});

// --- Custom Cursor Dot ---
const cursorRing = document.getElementById('cursorRing');

document.addEventListener('mousemove', (e) => {
    cursorRing.style.left = e.clientX + 'px';
    cursorRing.style.top = e.clientY + 'px';
});

document.addEventListener('mouseenter', () => cursorRing.style.opacity = '1');
document.addEventListener('mouseleave', () => cursorRing.style.opacity = '0');

// Hide ring on touch devices
if ('ontouchstart' in window) {
    cursorRing.style.display = 'none';
} else {
    document.body.classList.add('has-custom-cursor');
}

// Hover effect for interactive elements
document.querySelectorAll('a, button, .btn, .project-card, .skill-category, .exp-item, .social-btn, .highlight-card, .contact-detail-item, input, textarea, label').forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('cursor-ring--hover'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('cursor-ring--hover'));
});

// --- Events ---
window.addEventListener('scroll', updateScrollProgress);
window.addEventListener('load', () => {
    updateScrollProgress();
    startParticles();
});
