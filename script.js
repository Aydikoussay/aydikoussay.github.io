const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');
const scrollProgress = document.getElementById('scrollProgress');
const typeText = document.getElementById('typeText');

const TYPE_LINES = [
    'whoami',
    'red-team-operator',
    'nmap -A target.local',
    'privilege escalation successful'
];
let lineIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
    const currentLine = TYPE_LINES[lineIndex];
    if (!deleting) {
        typeText.textContent = currentLine.slice(0, charIndex + 1);
        charIndex += 1;
        if (charIndex === currentLine.length) {
            deleting = true;
            setTimeout(typeLoop, 1000);
            return;
        }
    } else {
        typeText.textContent = currentLine.slice(0, charIndex - 1);
        charIndex -= 1;
        if (charIndex === 0) {
            deleting = false;
            lineIndex = (lineIndex + 1) % TYPE_LINES.length;
        }
    }
    setTimeout(typeLoop, deleting ? 45 : 75);
}

function updateScrollProgress() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    scrollProgress.style.width = `${progress}%`;
}

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

window.addEventListener('scroll', updateScrollProgress);
window.addEventListener('load', () => {
    typeLoop();
    updateScrollProgress();
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(event) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeMobileNav();
        }
    });
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -100px 0px' });

document.querySelectorAll('.fade-up').forEach(el => {
    observer.observe(el);
});
