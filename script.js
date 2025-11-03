
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
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = document.querySelector('#header').offsetHeight;
                const elementPosition = target.offsetTop;
                const offsetPosition = elementPosition - headerOffset - 20;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Header au scroll
function initScrollEffects() {
    const header = document.querySelector('#header');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            header.style.background = 'rgba(10, 10, 10, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 255, 157, 0.3)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = '0 2px 10px rgba(0, 255, 157, 0.2)';
        }
        updateActiveNavLink();
    });
}

// Lien actif
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-link');
    const offset = document.querySelector('#header').offsetHeight + 100;

    let current = '';
    sections.forEach(sec => {
        if (window.pageYOffset >= sec.offsetTop - offset) {
            current = sec.getAttribute('id');
        }
    });

    links.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Typewriter
function initTypewriterEffect() {
    const el = document.querySelector('.typewriter');
    if (!el) return;
    const text = el.textContent;
    el.textContent = '';
    let i = 0;
    const type = () => {
        if (i < text.length) {
            el.textContent += text.charAt(i);
            i++;
            setTimeout(type, 80);
        }
    };
    setTimeout(type, 600);
}

// Formulaire
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const btn = this.querySelector('button');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        setTimeout(() => {
            alert('Message sent successfully! (Demo)');
            form.reset();
            btn.innerHTML = original;
            btn.disabled = false;
        }, 1500);
    });
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

// Animations d'entrée
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

    document.querySelectorAll('.skill-category, .certification-card, .project-card, .about-content').forEach(el => {
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
        video.style.transform = `translateY(${window.pageYOffset * -0.4}px)`;
    });
}

// Styles injectés (compatibles avec ton ancien CSS)
const styles = `
    .nav-link.active { color: var(--primary-green) !important; }
    .nav-link.active::after { width: 100% !important; }
    .mobile-menu-open nav ul {
        display: flex !important;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(10,10,10,0.98);
        padding: 1rem;
        gap: 1rem;
        border-top: 1px solid rgba(0,255,157,0.2);
        z-index: 999;
    }
    .mobile-menu-toggle span { transition: all 0.3s ease; }
    .mobile-menu-open .mobile-menu-toggle span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    .mobile-menu-open .mobile-menu-toggle span:nth-child(2) { opacity: 0; }
    .mobile-menu-open .mobile-menu-toggle span:nth-child(3) { transform: rotate(-45deg) translate(7px, -6px); }
    @media (max-width: 768px) { nav ul { display: none; } }
`;
const sheet = document.createElement('style');
sheet.textContent = styles;
document.head.appendChild(sheet);
