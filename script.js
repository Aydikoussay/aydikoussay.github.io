// ============================================
// NAVIGATION & SIDEBAR FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeTheme();
    initializeScrollSpy();
});

// Initialize Navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const collapsibleLinks = document.querySelectorAll('.nav-link.collapsible');

    // Handle collapsible menus
    collapsibleLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const submenu = this.nextElementSibling;
            
            if (submenu && submenu.classList.contains('submenu')) {
                submenu.classList.toggle('open');
                this.classList.toggle('open');
            }
        });
    });

    // Handle nav link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!this.classList.contains('collapsible')) {
                e.preventDefault();
                const href = this.getAttribute('href');
                
                if (href && href.startsWith('#')) {
                    const target = document.querySelector(href);
                    if (target) {
                        // Remove active class from all links
                        navLinks.forEach(l => l.classList.remove('active'));
                        // Add active class to clicked link
                        this.classList.add('active');
                        // Scroll to target
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    });
}

// ============================================
// THEME TOGGLE
// ============================================

function initializeTheme() {
    const lightThemeBtn = document.getElementById('lightTheme');
    const darkThemeBtn = document.getElementById('darkTheme');
    const body = document.body;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        darkThemeBtn.classList.add('active');
    } else {
        lightThemeBtn.classList.add('active');
    }

    // Light theme button
    lightThemeBtn.addEventListener('click', function() {
        body.classList.remove('dark-mode');
        lightThemeBtn.classList.add('active');
        darkThemeBtn.classList.remove('active');
        localStorage.setItem('theme', 'light');
    });

    // Dark theme button
    darkThemeBtn.addEventListener('click', function() {
        body.classList.add('dark-mode');
        darkThemeBtn.classList.add('active');
        lightThemeBtn.classList.remove('active');
        localStorage.setItem('theme', 'dark');
    });
}

// ============================================
// SCROLL SPY - Update active nav link on scroll
// ============================================

function initializeScrollSpy() {
    const sections = document.querySelectorAll('[id]');
    const navLinks = document.querySelectorAll('.nav-link:not(.collapsible)');

    window.addEventListener('scroll', function() {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

const searchBtn = document.querySelector('.search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', function() {
        const query = prompt('Search portfolio...');
        if (query) {
            searchPortfolio(query);
        }
    });
}

function searchPortfolio(query) {
    const sections = document.querySelectorAll('.content-section');
    const searchTerm = query.toLowerCase();
    let found = false;

    sections.forEach(section => {
        const text = section.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            section.style.display = 'block';
            section.scrollIntoView({ behavior: 'smooth' });
            found = true;
        } else {
            section.style.display = 'none';
        }
    });

    if (!found) {
        alert(`No results found for "${query}"`);
        // Reset display
        sections.forEach(section => {
            section.style.display = 'block';
        });
    }
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// ANIMATION ON SCROLL
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all project cards and writeup items
document.querySelectorAll('.project-card, .writeup-item, .cert-item').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const query = prompt('Search portfolio...');
        if (query) {
            searchPortfolio(query);
        }
    }

    // Ctrl/Cmd + / for help
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        alert('Keyboard Shortcuts:\n\nCtrl/Cmd + K: Search\nCtrl/Cmd + /: Help\n\nUse the sidebar to navigate sections.');
    }
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('mobile-open');
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('mobile-open');
        }
    });
});

// ============================================
// PERFORMANCE: Lazy load images
// ============================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ============================================
// UTILITY: Copy to clipboard
// ============================================

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// ============================================
// UTILITY: Print page
// ============================================

function printPage() {
    window.print();
}

// ============================================
// UTILITY: Share page
// ============================================

function sharePage() {
    if (navigator.share) {
        navigator.share({
            title: 'Koussay Aydi - Cybersecurity Portfolio',
            text: 'Check out my cybersecurity portfolio!',
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        alert('Share functionality not supported on this browser.');
    }
}

console.log('Portfolio loaded successfully!');
