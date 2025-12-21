// Portfolio JavaScript - Koussay Aydi
document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initScrollEffects();
    initTypewriterEffect();
    initContactForm();
    initMobileMenu();
    initAnimations();
    initVideoParallax();
    initExternalLinks();
    consoleEasterEgg();
    initSecretAccess();
});

// Navigation fluide
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                const headerHeight = document.querySelector('#header').offsetHeight;
                const offset = target.offsetTop - headerHeight - 20;
                window.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Effets au scroll (header + lien actif)
function initScrollEffects() {
    const header = document.querySelector('#header');
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        if (scrollY > 50) {
            header.style.background = 'rgba(10, 10, 10, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 255, 157, 0.3)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = '0 2px 10px rgba(0, 255, 157, 0.2)';
        }
        updateActiveNavLink();
    });
}

// Mettre à jour le lien actif dans la navbar
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-link');
    const offset = document.querySelector('#header').offsetHeight + 100;

    let current = '';
    sections.forEach(section => {
        if (window.pageYOffset >= section.offsetTop - offset) {
            current = section.getAttribute('id');
        }
    });

    links.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Effet machine à écrire
function initTypewriterEffect() {
    const el = document.querySelector('.typewriter');
    if (!el) return;
    const text = el.textContent.trim();
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
    setTimeout(type, 600);
}

// ✅ Nouvelle fonction : ouvrir un e-mail pré-rempli
function initContactForm() {
    const button = document.getElementById('emailButton');
    if (!button) return;

    button.addEventListener('click', function () {
        const email = 'koussayaydi2009@gmail.com';
        const subject = encodeURIComponent('Portfolio Contact');
        const body = encodeURIComponent(
            'Hello Koussay,\n\n' +
            'I found your portfolio interesting and would like to get in touch.\n\n' +
            'Best regards,\n'
        );
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    });
}
// Notification toast
function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

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
        position: fixed; top: 100px; right: 20px; z-index: 10000;
        background: ${type === 'success' ? 'linear-gradient(135deg, #00ff9d, #00a8ff)' : 'linear-gradient(135deg, #ff3860, #ff6b9d)'};
        color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
    const body = document.body;
    if (!toggle) return;

    toggle.addEventListener('click', () => {
        body.classList.toggle('mobile-menu-open');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            body.classList.remove('mobile-menu-open');
        });
    });
}

// Animations d'apparition au scroll
function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.skill-category, .certification-card, .project-card, .about-content, .contact-content').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Parallaxe vidéo légère
function initVideoParallax() {
    const video = document.getElementById('video-background');
    if (!video) return;
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        video.style.transform = `translateY(${scrolled * -0.4}px)`;
    });
}

// Liens externes → nouvel onglet
function initExternalLinks() {
    document.addEventListener('click', e => {
        const link = e.target.closest('a[href^="http"]');
        if (link && link.hostname !== location.hostname) {
            e.preventDefault();
            window.open(link.href, '_blank', 'noopener,noreferrer');
        }
    });
}

// Easter egg console
function consoleEasterEgg() {
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║     Bienvenue dans le portfolio de Koussay Aydi             ║
    ║                                                              ║
    ║     Cybersecurity Engineering Student                       ║
    ║     Passionné par la sécurité informatique                  ║
    ║     Ethical Hacker & Penetration Tester                     ║
    ║                                                              ║
    ║     Email: koussayaydi2009@gmail.com                        ║
    ║     GitHub: https://github.com/Aydikoussay                    ║
    ║                                                              ║
    ║     Merci de visiter mon portfolio!                        ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
    console.log('%cSecurity Note: Ce portfolio a été développé avec les meilleures pratiques de sécurité web.', 'color: #00ff9d; font-weight: bold; font-size: 14px;');
}

// 🔐 Fonction secrète pour voir les messages
function initSecretAccess() {
    window.viewMessages = function(password = '') {
        const SECRET = 'cybersec2025'; // ← MODIFIE CE MOT DE PASSE
        if (password === SECRET) {
            const messages = JSON.parse(localStorage.getItem('koussay_contact_messages') || '[]');
            if (messages.length === 0) {
                console.log('%c🔒 Aucun message sauvegardé.', 'color: #ff9d00; font-weight: bold;');
            } else {
                console.log(`%c🔐 ${messages.length} message(s) sauvegardé(s) :`, 'color: #00ff9d; font-weight: bold;');
                messages.forEach((msg, i) => {
                    console.log(`\n--- Message #${i+1} (${msg.timestamp}) ---`);
                    console.log(`Name: ${msg.name}`);
                    console.log(`Email: ${msg.email}`);
                    console.log(`Subject: ${msg.subject}`);
                    console.log(`Message: ${msg.message}`);
                });
            }
            return messages;
        } else {
            console.warn('🔒 Accès refusé. Utilise : viewMessages("cybersec2025")');
            return null;
        }
    };
}

// Injection des animations CSS nécessaires
const animationCSS = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .notification-close {
        background: none; border: none; color: white; cursor: pointer; padding: 0.25rem; border-radius: 4px;
    }
    .notification-close:hover { background: rgba(255,255,255,0.2); }
`;
const style = document.createElement('style');
style.textContent = animationCSS;
document.head.appendChild(style);
