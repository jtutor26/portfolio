// Dark mode: honor a saved preference, falling back to the OS-level
// color scheme. Applied immediately (before the rest of the page logic)
// so there's no flash of the wrong theme.
const THEME_STORAGE_KEY = 'jt-portfolio-theme';
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) {
        const isDark = theme === 'dark';
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle.innerHTML = isDark ? '<span aria-hidden="true">&#9728;</span>' : '<span aria-hidden="true">&#127769;</span>';
    }
}

let storedTheme = null;
try {
    storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
} catch (err) {
    // Privacy mode or storage disabled — fall back to the OS preference below.
}

const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
applyTheme(storedTheme || (prefersDarkScheme.matches ? 'dark' : 'light'));

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (err) {
            // Nothing to persist to if storage is unavailable — theme still applies for this session.
        }
    });
}

// Dynamic Greeting based on time of day
const greetingElement = document.getElementById('greeting');
const hour = new Date().getHours();
let greetingText = 'Hello!';

if (hour < 12) {
    greetingText = 'Good Morning, I\'m JT Tutor.';
} else if (hour < 18) {
    greetingText = 'Good Afternoon, I\'m JT Tutor.';
} else {
    greetingText = 'Good Evening, I\'m JT Tutor.';
}

greetingElement.innerText = greetingText;

// Collapsible project cards: start collapsed on mobile, expanded on desktop
const MOBILE_BREAKPOINT = 800;
const startCollapsed = window.innerWidth < MOBILE_BREAKPOINT;

document.querySelectorAll('.project-card').forEach((card) => {
    const header = card.querySelector('.project-header');
    if (!header) return;

    if (startCollapsed) {
        card.classList.add('collapsed');
    }

    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', String(!startCollapsed));

    const toggleCard = () => {
        const isCollapsed = card.classList.toggle('collapsed');
        header.setAttribute('aria-expanded', String(!isCollapsed));
    };

    header.addEventListener('click', toggleCard);
    header.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleCard();
        }
    });
});

// Scroll reveal: content rises up and fades in as it enters from the
// bottom of the screen, then keeps drifting up and fades out once it
// exits off the top — and reverses naturally when scrolling back up.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealTargets = document.querySelectorAll(
    '.about-container, .timeline-item, .project-card, .skills-category, .certifications-list li, footer'
);

revealTargets.forEach((el) => el.classList.add('reveal'));

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                entry.target.classList.remove('exited-up');
            } else {
                entry.target.classList.remove('in-view');
                // Above the viewport (scrolled past going down) keeps
                // drifting up; below the viewport (not reached yet, or
                // scrolled back down past it) waits in the "rising up"
                // start position — that's just the base .reveal state.
                entry.target.classList.toggle('exited-up', entry.boundingClientRect.top < 0);
            }
        });
    }, {
        threshold: 0,
        rootMargin: '0px 0px 150px 0px'
    });

    revealTargets.forEach((el) => revealObserver.observe(el));
} else {
    revealTargets.forEach((el) => el.classList.add('in-view'));
}

// Mobile nav dropdown: the name + arrow toggles a slide-down menu
// listing all 5 sections (kept separate here even though the desktop
// nav consolidates Experience/Education into one link, since on mobile
// they're stacked as distinct sections rather than side-by-side columns).
const navMenuToggle = document.getElementById('nav-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (navMenuToggle && mobileMenu) {
    const closeMobileMenu = () => {
        navMenuToggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        navMenuToggle.setAttribute('aria-expanded', 'false');
    };

    const openMobileMenu = () => {
        navMenuToggle.classList.add('open');
        mobileMenu.classList.add('open');
        navMenuToggle.setAttribute('aria-expanded', 'true');
    };

    navMenuToggle.addEventListener('click', () => {
        if (mobileMenu.classList.contains('open')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('click', (event) => {
        if (!mobileMenu.classList.contains('open')) return;
        if (mobileMenu.contains(event.target) || navMenuToggle.contains(event.target)) return;
        closeMobileMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
            closeMobileMenu();
            navMenuToggle.focus();
        }
    });
}

// Active nav link: highlights whichever section is currently near the
// top of the viewport as you scroll. The desktop "Experience & Education"
// link covers two sections at once (via data-sections); everything else
// is a direct one-to-one match on its href.
const allNavLinks = document.querySelectorAll('.nav-links a[href^="#"], .mobile-menu-inner a[href^="#"]');
const navSectionIds = ['about', 'experience', 'education', 'projects', 'skills'];
const navSections = navSectionIds.map((id) => document.getElementById(id)).filter(Boolean);

if ('IntersectionObserver' in window && navSections.length) {
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            allNavLinks.forEach((link) => {
                const sections = link.dataset.sections
                    ? link.dataset.sections.split(' ')
                    : [link.getAttribute('href').slice(1)];
                link.classList.toggle('active', sections.includes(id));
            });
        });
    }, {
        threshold: 0,
        rootMargin: '-40% 0px -55% 0px'
    });

    navSections.forEach((section) => navObserver.observe(section));
}

// Back to top button: appears once you've scrolled past the first
// screenful, scrolls smoothly back to the top on click.
const backToTopButton = document.getElementById('back-to-top');

if (backToTopButton) {
    let ticking = false;

    const updateBackToTopVisibility = () => {
        backToTopButton.classList.toggle('visible', window.scrollY > 400);
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateBackToTopVisibility);
            ticking = true;
        }
    });

    updateBackToTopVisibility();

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
}

// Show More: each project column only shows its first 3 cards until toggled.
document.querySelectorAll('[data-show-more]').forEach((button) => {
    const column = button.closest('.project-column');
    if (!column) return;

    button.addEventListener('click', () => {
        const expanded = column.classList.toggle('expanded');
        button.textContent = expanded ? 'Show Less' : 'Show More';
    });
});