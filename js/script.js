document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const tabButtons = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.menu-panel');

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    tabButtons.forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== target;
    });
  });
});

const form = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formNote.textContent = 'Grazie! La tua richiesta è stata inviata (sito dimostrativo, nessun dato viene realmente trasmesso).';
  form.reset();
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  document.querySelectorAll('.tilt').forEach((card) => {
    const maxTilt = parseFloat(card.dataset.tiltMax || '16');
    const scale = parseFloat(card.dataset.tiltScale || '1.04');
    const baseTransform = getComputedStyle(card).transform;
    const base = baseTransform === 'none' ? '' : ` ${baseTransform}`;

    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = px * maxTilt;
      const rotateX = -py * maxTilt;
      card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})${base}`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });

    card.addEventListener('focus', () => {
      card.style.transform = `perspective(700px) scale(${scale})${base}`;
    });

    card.addEventListener('blur', () => {
      card.style.transform = '';
    });
  });
}

const drinksRow = document.getElementById('drinksRow');

if (drinksRow) {
  document.querySelectorAll('.row-arrow').forEach((btn) => {
    btn.addEventListener('click', () => {
      const direction = btn.id === 'rowLeft' ? -1 : 1;
      drinksRow.scrollBy({ left: direction * 320, behavior: 'smooth' });
    });
  });
}
