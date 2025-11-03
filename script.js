document.addEventListener('DOMContentLoaded', () => {
    // Menu mobile
    const toggle = document.querySelector('.mobile-menu-toggle');
    const body = document.body;

    toggle?.addEventListener('click', () => {
        body.classList.toggle('mobile-menu-open');
    });

    // Fermer au clic sur lien
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            body.classList.remove('mobile-menu-open');
        });
    });

    // Typewriter
    const typewriter = document.querySelector('.typewriter');
    if (typewriter) {
        const text = typewriter.textContent;
        typewriter.textContent = '';
        let i = 0;
        const type = () => {
            if (i < text.length) {
                typewriter.textContent += text.charAt(i);
                i++;
                setTimeout(type, 80);
            }
        };
        setTimeout(type, 500);
    }

    // Formulaire (démo)
    const form = document.getElementById('contactForm');
    form?.addEventListener('submit', e => {
        e.preventDefault();
        alert('Message envoyé ! (Démo)');
        form.reset();
    });
});
