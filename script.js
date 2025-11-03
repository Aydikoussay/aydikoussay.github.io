// Portfolio JavaScript - Interactions et animations
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initScrollEffects();
    initTypewriterEffect();
    initContactForm();
    initMobileMenu();
    initAnimations();
    initVideoParallax();
});

// Navigation fluide
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const headerHeight = document.querySelector('#header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Effets de défilement
function initScrollEffects() {
    const header = document.querySelector('#header');
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        if (scrollTop > 50) {
            header.style.background = 'rgba(10, 10, 10, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 255, 157, 0.3)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = '0 2px 10px rgba(0, 255, 157, 0.2)';
        }
        updateActiveNavLink();
    });
}

// Mise à jour du lien actif
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const headerHeight = document.querySelector('#header').offsetHeight;

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerHeight - 100;
        const sectionHeight = section.offsetHeight;
        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Typewriter
function initTypewriterEffect() {
    const elements = document.querySelectorAll('.typewriter');
    elements.forEach(el => {
        const text = el.textContent;
        el.textContent = '';
        let i = 0;
        const type = () => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, 80);
            } else {
                el.style.borderRight = 'none';
            }
        };
        setTimeout(type, 500);
    });
}

// Formulaire
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const btn = this.querySelector('button');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
        btn.disabled = true;

        setTimeout(() => {
            showNotification('Message envoyé avec succès !', 'success');
            form.reset();
            btn.innerHTML = original;
            btn.disabled = false;
        }, 1800);
    });
}

// Notifications
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    notif.style.cssText = `
        position: fixed; top: 100px; right: 20px; background: ${type === 'success' ? 'linear-gradient(135deg, #00ff9d, #00a8ff)' : 'linear-gradient(135deg, #ff3860, #ff6b9d)'};
        color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000;
        display: flex; align-items: center; gap: 1rem; min-width: 300px; animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 4000);

    notif.querySelector('.notification-close').onclick = () => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    };
}

// Menu mobile
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav ul');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        document.body.classList.toggle('mobile-menu-open');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            document.body.classList.remove('mobile-menu-open');
        });
    });
}

// Animations
function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.skill-category, .certification-card, .project-card, .about-content, .contact-content').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Parallaxe vidéo
function initVideoParallax() {
    const video = document.getElementById('video-background');
    if (!video) return;
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        video.style.transform = `translateY(${scrolled * -0.4}px)`;
    });
}

// Styles injectés
const styles = `
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    .nav-link.active { color: var(--primary-green) !important; }
    .nav-link.active::after { width: 100% !important; }
    .mobile-menu-toggle span { transition: all 0.3s ease; }
    .mobile-menu-open .mobile-menu-toggle span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    .mobile-menu-open .mobile-menu-toggle span:nth-child(2) { opacity: 0; }
    .mobile-menu-open .mobile-menu-toggle span:nth-child(3) { transform: rotate(-45deg) translate(7px, -6px); }
    @media (max-width: 768px) {
        nav ul { display: none; }
        .mobile-menu-open nav ul {
            display: flex !important; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0;
            background: rgba(10,10,10,0.98); backdrop-filter: blur(10px); padding: 1rem; gap: 1rem;
            border-top: 1px solid rgba(0,255,157,0.2);
        }
    }
    .notification-close { background: none; border: none; color: white; cursor: pointer; }
    .notification-close:hover { background: rgba(255,255,255,0.2); border-radius: 4px; }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Easter egg console
console.log(`
╔══════════════════════════════════════════════════════════════╗
║ Bienvenue dans le portfolio de Koussay Aydi                 ║
║ Cybersecurity Engineering Student | Ethical Hacker          ║
║ Contact: koussayaydi2009@gmail.com                          ║
╚══════════════════════════════════════════════════════════════╝
`);
console.log('%cSecurity is not a product, but a process.', 'color: #00ff9d; font-weight: bold;');
