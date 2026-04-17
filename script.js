const themeToggle = document.getElementById('themeToggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');
const scrollProgress = document.getElementById('scrollProgress');
const typeText = document.getElementById('typeText');

const TYPE_LINES = [
    'Analyzing network traffic...',
    'Hunting anomalous behavior...',
    'Building detection rules...',
    'Validating security controls...'
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
            setTimeout(typeLoop, 1200);
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
    setTimeout(typeLoop, deleting ? 45 : 70);
}

function updateTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.dataset.theme = savedTheme;
    themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function toggleTheme() {
    const current = document.body.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    localStorage.setItem('theme', next);
    updateTheme();
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

themeToggle?.addEventListener('click', toggleTheme);
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
    updateTheme();
    typeLoop();
    updateScrollProgress();
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (event) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeMobileNav();
        }
    });
});
