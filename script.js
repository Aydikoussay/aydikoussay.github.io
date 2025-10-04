// Portfolio JavaScript - Interactions et animations

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation
    initNavigation();
    initScrollEffects();
    initTypewriterEffect();
    initContactForm();
    initMobileMenu();
    initAnimations();
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
                const targetPosition = targetSection.offsetTop - headerHeight;
                
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
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Header background opacity
        if (scrollTop > 50) {
            header.style.background = 'rgba(10, 10, 10, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 255, 157, 0.3)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = '0 2px 10px rgba(0, 255, 157, 0.2)';
        }
        
        // Active navigation link
        updateActiveNavLink();
        
        lastScrollTop = scrollTop;
    });
}

// Mise à jour du lien de navigation actif
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const headerHeight = document.querySelector('#header').offsetHeight;
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerHeight - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Effet machine à écrire
function initTypewriterEffect() {
    const typewriterElements = document.querySelectorAll('.typewriter');
    
    typewriterElements.forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        element.style.borderRight = '2px solid var(--primary-green)';
        
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
                // Garder le curseur clignotant
                setTimeout(() => {
                    element.style.borderRight = 'none';
                }, 1000);
            }
        }, 100);
    });
}

// Formulaire de contact
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Récupération des données du formulaire
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Validation simple
            if (!name || !email || !subject || !message) {
                showNotification('Veuillez remplir tous les champs.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Veuillez entrer une adresse email valide.', 'error');
                return;
            }
            
            // Simulation d'envoi (remplacer par une vraie implémentation)
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
            submitButton.disabled = true;
            
            setTimeout(() => {
                showNotification('Message envoyé avec succès!', 'success');
                contactForm.reset();
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }, 2000);
        });
    }
}

// Validation email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Système de notifications
function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Créer la nouvelle notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Styles de la notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Fermeture automatique
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return 'linear-gradient(135deg, #00ff9d, #00a8ff)';
        case 'error': return 'linear-gradient(135deg, #ff3860, #ff6b9d)';
        case 'warning': return 'linear-gradient(135deg, #ffdd57, #ffa726)';
        default: return 'linear-gradient(135deg, #00a8ff, #9c27b0)';
    }
}

// Menu mobile
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav ul');
    
    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', function() {
            nav.classList.toggle('mobile-active');
            this.classList.toggle('active');
        });
        
        // Fermer le menu lors du clic sur un lien
        const navLinks = nav.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('mobile-active');
                mobileToggle.classList.remove('active');
            });
        });
    }
}

// Animations d'entrée
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observer les éléments à animer
    const animatedElements = document.querySelectorAll(
        '.skill-category, .certification-card, .project-card, .about-content, .contact-content'
    );
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        observer.observe(element);
    });
}

// Effet de parallaxe léger pour le fond vidéo
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const videoBackground = document.getElementById('video-background');
    
    if (videoBackground) {
        const rate = scrolled * -0.5;
        videoBackground.style.transform = `translateY(${rate}px)`;
    }
});

// Gestion des liens externes
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="http"]') || e.target.closest('a[href^="http"]')) {
        const link = e.target.matches('a') ? e.target : e.target.closest('a');
        if (link.hostname !== window.location.hostname) {
            e.preventDefault();
            window.open(link.href, '_blank', 'noopener,noreferrer');
        }
    }
});

// Ajout des styles CSS pour les animations
const animationStyles = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .nav-link.active {
        color: var(--primary-green) !important;
    }
    
    .nav-link.active::after {
        width: 100% !important;
    }
    
    .mobile-menu-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .mobile-menu-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .mobile-menu-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
    
    @media (max-width: 768px) {
        nav ul.mobile-active {
            display: flex !important;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(10px);
            padding: 1rem;
            border-top: 1px solid rgba(0, 255, 157, 0.2);
            gap: 1rem;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.3s ease;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

// Injection des styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Console easter egg
console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   🚀 Bienvenue dans le portfolio de Koussay Aydi            ║
    ║                                                              ║
    ║   👨‍💻 Cybersecurity Engineering Student                       ║
    ║   🔐 Passionné par la sécurité informatique                 ║
    ║   🛡️  Ethical Hacker & Penetration Tester                   ║
    ║                                                              ║
    ║   📧 Contact: koussay.aydi@example.com                       ║
    ║   🔗 GitHub: github.com/Aydikoussay                         ║
    ║                                                              ║
    ║   Merci de visiter mon portfolio! 🎯                        ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
`);

console.log('%c🔒 Security Note: Ce portfolio a été développé avec les meilleures pratiques de sécurité web.', 'color: #00ff9d; font-weight: bold;');
