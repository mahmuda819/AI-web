/**
 * Cortex — Complete Homepage Script
 * Merged from: hero, about, services, features, pricing, testimonials,
 * faq, blog, contact, footer.
 *
 * Shared once here (previously duplicated per-section):
 *   - prefersReducedMotion
 *   - initReveal()        — used by about, services, features, pricing,
 *                            testimonials, faq, blog, contact
 *   - initStatCounters()  — used by hero and about (same [data-count-to]
 *                            convention)
 *
 * Everything below that is unique per section keeps its own function,
 * and every function is called exactly once from the single
 * DOMContentLoaded handler at the bottom of this file.
 */

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

/* ==========================================================================
   Shared: scroll reveal
   Fades/slides any [data-reveal] element in the first time it enters
   the viewport. features.css additionally uses [data-reveal-from] to
   pick a slide direction — that's CSS-only and needs no JS support.
   ========================================================================== */
function initReveal() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   Shared: stat counters
   Counts every [data-count-to] element up to its target once visible.
   Used by both the hero stat row and the About section's stat bar.
   ========================================================================== */
function initStatCounters() {
  const nodes = document.querySelectorAll('[data-count-to]');
  if (!nodes.length) return;

  function animateNode(node) {
    const target = parseFloat(node.dataset.countTo);
    const decimals = parseInt(node.dataset.decimals || '0', 10);
    const suffix = node.dataset.suffix || '';

    if (prefersReducedMotion) {
      node.textContent = target.toFixed(decimals) + suffix;
      return;
    }

    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      node.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (!('IntersectionObserver' in window)) {
    nodes.forEach(animateNode);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateNode(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  nodes.forEach((node) => observer.observe(node));
}

/* ==========================================================================
   HERO SECTION
   ========================================================================== */

/**
 * hero.js
 * Self-contained, dependency-free behavior for the Cortex hero section:
 *   1. initParticleField  — interactive constellation canvas background
 *   2. initMagneticButtons — CTA buttons that lean toward the cursor
 *   3. initStatCounters    — count up the stat numbers once visible
 *   4. initScrollCue       — smooth-scrolls to the next section on click
 *
 * Everything respects prefers-reduced-motion and no-ops gracefully if an
 * expected element isn't on the page, so this file is safe to include
 * on any page that only has part of the hero markup.
 */

/* ==========================================================================
   1. Particle constellation
   ========================================================================== */
function initParticleField() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  let width, height, dpr;
  let particles = [];
  let animationId = null;
  let paused = false;

  const mouse = { x: null, y: null, radius: 140 };

  const CONFIG = {
    linkDistance: 130,
    baseSpeed: 0.18,
    colorLine: 'rgba(148, 163, 255, 0.35)',
    colorDot: 'rgba(200, 208, 255, 0.6)',
  };

  function particleCountForWidth(w) {
    if (w < 640) return 34;
    if (w < 1200) return 60;
    return 90;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedParticles();
  }

  function seedParticles() {
    const count = particleCountForWidth(width);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * CONFIG.baseSpeed,
      vy: (Math.random() - 0.5) * CONFIG.baseSpeed,
      r: Math.random() * 1.4 + 0.6,
    }));
  }

  function step() {
    if (paused) return;
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      // Drift
      p.x += p.vx;
      p.y += p.vy;

      // Wrap at edges
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      // Gentle repulsion from the cursor
      if (mouse.x !== null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x += (dx / (dist || 1)) * force * 1.2;
          p.y += (dy / (dist || 1)) * force * 1.2;
        }
      }
    }

    // Links between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < CONFIG.linkDistance) {
          ctx.globalAlpha = 1 - dist / CONFIG.linkDistance;
          ctx.strokeStyle = CONFIG.colorLine;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Dots
    ctx.globalAlpha = 1;
    ctx.fillStyle = CONFIG.colorDot;
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    animationId = requestAnimationFrame(step);
  }

  function handlePointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  function handlePointerLeave() {
    mouse.x = null;
    mouse.y = null;
  }

  let resizeTimer;
  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }

  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) {
      cancelAnimationFrame(animationId);
      step();
    }
  });

  window.addEventListener('resize', handleResize);
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerleave', handlePointerLeave);

  resize();
  step();
}

/* ==========================================================================
   2. Magnetic buttons
   Nudges each .hero-btn--magnetic toward the cursor within a radius, using
   CSS custom properties so hero.css owns the actual transform.
   Skipped on touch-only devices (no meaningful "hover" to react to).
   ========================================================================== */
function initMagneticButtons() {
  if (prefersReducedMotion) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const buttons = document.querySelectorAll('.hero-btn--magnetic');
  const STRENGTH = 0.35;
  const MAX_OFFSET = 10;

  buttons.forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      const mx = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relX * STRENGTH));
      const my = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relY * STRENGTH));
      btn.style.setProperty('--mx', `${mx}px`);
      btn.style.setProperty('--my', `${my}px`);
    });

    btn.addEventListener('pointerleave', () => {
      btn.style.setProperty('--mx', '0px');
      btn.style.setProperty('--my', '0px');
    });
  });
}

/* ==========================================================================
   3. Stat counters
   Animates each [data-count-to] from 0 to its target once it scrolls
   into view (or immediately if it's already visible, since the hero
   is above the fold on load).
   ========================================================================== */


/* ==========================================================================
   4. Scroll cue
   ========================================================================== */
function initScrollCue() {
  const cue = document.querySelector('.hero__scroll-cue');
  if (!cue) return;

  cue.addEventListener('click', () => {
    const targetSelector = cue.dataset.scrollTarget;
    const target = targetSelector && document.querySelector(targetSelector);
    if (target) {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  });
}

/* ==========================================================================
   Init
   ========================================================================== */

/* ==========================================================================
   ABOUT SECTION
   ========================================================================== */

/**
 * about.js
 * Self-contained, dependency-free behavior for the Cortex About section:
 *   1. initReveal        — fades/slides each [data-reveal] block in on scroll
 *   2. initStatCounters   — counts [data-count-to] numbers up once visible
 *
 * Both respect prefers-reduced-motion and no-op safely if their target
 * elements aren't present, so this file is safe to include on any page
 * that only has part of the About markup.
 */

/* ==========================================================================
   1. Scroll reveal
   ========================================================================== */
/* ==========================================================================
   2. Stat counters
   ========================================================================== */
/* ==========================================================================
   Init
   ========================================================================== */

/* ==========================================================================
   SERVICES SECTION
   ========================================================================== */

/**
 * services.js
 * Self-contained, dependency-free behavior for the Cortex Services section:
 *   1. initTiltCards — spotlight + subtle 3D tilt that follows the cursor
 *   2. initReveal     — staggered fade/slide-in as the grid scrolls into view
 *
 * Both respect prefers-reduced-motion and no-op safely if their target
 * elements aren't present.
 */

const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

/* ==========================================================================
   1. Tilt + spotlight
   Updates --x/--y (spotlight position) and --rx/--ry (tilt angle) as
   CSS custom properties; services.css owns the actual visual effect.
   ========================================================================== */
function initTiltCards() {
  const cards = document.querySelectorAll('[data-tilt]');
  if (!cards.length || prefersReducedMotion || !hasFinePointer) return;

  const MAX_TILT = 6; // degrees

  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // Spotlight position, in pixels relative to the card
      card.style.setProperty('--x', `${px}px`);
      card.style.setProperty('--y', `${py}px`);

      // Tilt: normalize pointer position to -1..1 on each axis
      const nx = px / rect.width - 0.5;
      const ny = py / rect.height - 0.5;
      card.style.setProperty('--ry', `${nx * MAX_TILT * 2}deg`);
      card.style.setProperty('--rx', `${-ny * MAX_TILT * 2}deg`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--x', '50%');
      card.style.setProperty('--y', '50%');
    });
  });
}

/* ==========================================================================
   2. Staggered scroll reveal
   Assigns each [data-reveal] element inside the grid a small
   incremental delay (via --stagger) so the cards arrive in sequence
   rather than all at once, then reveals on intersection.
   ========================================================================== */
/* ==========================================================================
   Init
   ========================================================================== */

/* ==========================================================================
   FEATURES SECTION
   ========================================================================== */

/**
 * features.js
 * Self-contained, dependency-free behavior for the Cortex Features section:
 *   1. initReveal    — fades/slides [data-reveal] blocks in from their
 *                       declared direction (data-reveal-from="left|right")
 *   2. initMockAnims — starts each UI mock's internal animation (bars
 *                       filling, checklist ticking in) once it's visible
 *
 * Both respect prefers-reduced-motion and no-op safely if their target
 * elements aren't present.
 */

/* ==========================================================================
   1. Directional scroll reveal
   ========================================================================== */
/* ==========================================================================
   2. Mock panel internal animations
   Adds .is-animated to each .feature-mock the first time it enters the
   viewport, which is what features.css uses to trigger bar widths and
   the eval checklist stagger.
   ========================================================================== */
function initMockAnims() {
  const mocks = document.querySelectorAll('.feature-mock');
  if (!mocks.length) return;

  // Stagger the eval checklist rows inside each mock via a CSS var,
  // same pattern used elsewhere in the Cortex components.
  mocks.forEach((mock) => {
    mock.querySelectorAll('.eval-row').forEach((row, i) => {
      row.style.setProperty('--eval-delay', `${i * 120}ms`);
    });
  });

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    mocks.forEach((mock) => mock.classList.add('is-animated'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Small delay so the panel's own fade/slide reveal reads first
          setTimeout(() => entry.target.classList.add('is-animated'), 200);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  mocks.forEach((mock) => observer.observe(mock));
}

/* ==========================================================================
   Init
   ========================================================================== */

/* ==========================================================================
   PRICING SECTION
   ========================================================================== */

/**
 * pricing.js
 * Self-contained, dependency-free behavior for the Cortex Pricing section:
 *   1. initBillingToggle — switches every [data-monthly]/[data-yearly]
 *      price between the two states, with a small fade/slide swap
 *   2. initReveal         — fades/slides pricing cards in on scroll
 *
 * Respects prefers-reduced-motion and no-ops safely if elements are
 * missing, so this file is safe to include on a page with only part
 * of the Pricing markup.
 */

/* ==========================================================================
   1. Monthly / Yearly toggle
   ========================================================================== */
function initBillingToggle() {
  const toggle = document.getElementById('billingToggle');
  if (!toggle) return;

  const amounts = document.querySelectorAll('.pricing-card__amount[data-monthly]');
  const billedNotes = document.querySelectorAll('[data-billed-note]');
  const monthlyLabel = document.querySelector('[data-toggle-label="monthly"]');
  const yearlyLabel = document.querySelector('[data-toggle-label="yearly"]');
  const saveBadge = document.getElementById('saveBadge');

  let isYearly = false;

  function formatPrice(node, value) {
    const numeric = parseFloat(value);
    if (numeric === 0) return '$0';
    return `$${numeric}`;
  }

  function applyState(yearly) {
    amounts.forEach((node) => {
      const value = yearly ? node.dataset.yearly : node.dataset.monthly;
      const text = formatPrice(node, value);

      if (prefersReducedMotion) {
        node.textContent = text;
        return;
      }

      node.classList.add('is-swapping');
      setTimeout(() => {
        node.textContent = text;
        node.classList.remove('is-swapping');
      }, 180);
    });

    billedNotes.forEach((note) => {
      note.textContent = yearly ? 'billed annually' : '\u00A0';
    });

    monthlyLabel && monthlyLabel.classList.toggle('is-active', !yearly);
    yearlyLabel && yearlyLabel.classList.toggle('is-active', yearly);
    saveBadge && saveBadge.classList.toggle('is-visible', yearly);

    toggle.setAttribute('aria-checked', String(yearly));
  }

  function setYearly(next) {
    isYearly = next;
    applyState(isYearly);
  }

  toggle.addEventListener('click', () => setYearly(!isYearly));
  monthlyLabel && monthlyLabel.addEventListener('click', () => setYearly(false));
  yearlyLabel && yearlyLabel.addEventListener('click', () => setYearly(true));

  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') setYearly(false);
    if (e.key === 'ArrowRight') setYearly(true);
  });

  // Initial paint (monthly by default)
  applyState(isYearly);
}

/* ==========================================================================
   2. Scroll reveal
   ========================================================================== */
/* ==========================================================================
   Init
   ========================================================================== */

/* ==========================================================================
   TESTIMONIALS SECTION
   ========================================================================== */

/**
 * testimonials.js
 * Hand-built vanilla JS slider (no Bootstrap carousel component):
 *   - Auto-advances every 5s, pauses on hover/focus/drag/tab-hidden
 *   - Prev/next arrows + clickable dot indicators
 *   - Pointer-based drag/swipe for touch and mouse
 *   - Responsive: measures actual card position (offsetLeft) rather
 *     than assuming a fixed items-per-view, so it self-corrects on resize
 *   - Announces the active slide via an aria-live region
 *   - Respects prefers-reduced-motion (no autoplay, instant transitions)
 */

function initTestimonialSlider() {
  const viewport = document.getElementById('sliderViewport');
  const track = document.getElementById('sliderTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsWrap = document.getElementById('sliderDots');
  const status = document.getElementById('sliderStatus');

  if (!viewport || !track || !track.children.length) return;

  const cards = Array.from(track.children);
  const AUTOPLAY_MS = 5000;

  let currentIndex = 0;
  let maxIndex = 0;
  let itemsPerView = 1;
  let autoplayTimer = null;
  let isPointerDown = false;
  let dragStartX = 0;
  let dragStartTranslate = 0;

  /* ---- Layout math ---- */
  function computeLayout() {
    const cardWidth = cards[0].getBoundingClientRect().width;
    const viewportWidth = viewport.getBoundingClientRect().width;
    itemsPerView = Math.max(1, Math.round(viewportWidth / cardWidth));
    maxIndex = Math.max(0, cards.length - itemsPerView);
    if (currentIndex > maxIndex) currentIndex = maxIndex;
  }

  /* ---- Dots ---- */
  function buildDots() {
    dotsWrap.innerHTML = '';
    const dotCount = maxIndex + 1;
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'testimonial-slider__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.setAttribute('aria-selected', String(i === currentIndex));
      dot.addEventListener('click', () => goTo(i, true));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    Array.from(dotsWrap.children).forEach((dot, i) => {
      dot.setAttribute('aria-selected', String(i === currentIndex));
    });
  }

  /* ---- Move to a slide index ---- */
  function goTo(index, userInitiated) {
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    const targetCard = cards[currentIndex];
    const offset = targetCard.offsetLeft;

    track.style.transform = `translateX(-${offset}px)`;
    updateDots();

    const author = targetCard.querySelector('.testimonial-card__name');
    if (status && author) {
      status.textContent = `Showing testimonial from ${author.textContent}`;
    }

    if (userInitiated) restartAutoplay();
  }

  function next() {
    goTo(currentIndex >= maxIndex ? 0 : currentIndex + 1);
  }

  function prev() {
    goTo(currentIndex <= 0 ? maxIndex : currentIndex - 1);
  }

  /* ---- Autoplay ---- */
  function startAutoplay() {
    if (prefersReducedMotion || maxIndex === 0) return;
    stopAutoplay();
    autoplayTimer = setInterval(next, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  /* ---- Controls ---- */
  nextBtn && nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });
  prevBtn && prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });

  /* ---- Pause on hover / keyboard focus ---- */
  const slider = viewport.closest('.testimonial-slider');
  ['mouseenter', 'focusin'].forEach((evt) => slider.addEventListener(evt, stopAutoplay));
  ['mouseleave', 'focusout'].forEach((evt) => slider.addEventListener(evt, startAutoplay));

  /* ---- Pause when tab is hidden ---- */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  /* ---- Drag / swipe (pointer events cover mouse + touch + pen) ---- */
  track.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    dragStartX = e.clientX;

    const computedTransform = getComputedStyle(track).transform;
    dragStartTranslate =
      computedTransform && computedTransform !== 'none'
        ? new DOMMatrixReadOnly(computedTransform).m41
        : 0;

    track.classList.add('is-dragging');
    stopAutoplay();
  });

  track.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    const delta = e.clientX - dragStartX;
    track.style.transform = `translateX(${dragStartTranslate + delta}px)`;
  });

  function endDrag(e) {
    if (!isPointerDown) return;
    isPointerDown = false;
    track.classList.remove('is-dragging');

    const delta = e.clientX - dragStartX;
    const THRESHOLD = 50;
    if (delta < -THRESHOLD) next();
    else if (delta > THRESHOLD) prev();
    else goTo(currentIndex); // snap back

    restartAutoplay();
  }

  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointerleave', (e) => { if (isPointerDown) endDrag(e); });

  /* ---- Keyboard arrows when the slider region has focus ---- */
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { next(); restartAutoplay(); }
    if (e.key === 'ArrowLeft') { prev(); restartAutoplay(); }
  });

  /* ---- Resize handling ---- */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      computeLayout();
      buildDots();
      goTo(currentIndex);
    }, 150);
  });

  /* ---- Init ---- */
  if (prefersReducedMotion) {
    track.style.transition = 'none';
  }

  computeLayout();
  buildDots();
  goTo(0);
  startAutoplay();
}

/* ==========================================================================
   Scroll reveal (shared pattern with other Cortex sections)
   ========================================================================== */

/* ==========================================================================
   FAQ SECTION
   ========================================================================== */

/**
 * faq.js
 * Accessible, animated accordion (WAI-ARIA Accordion pattern):
 *   - Only one panel open at a time
 *   - aria-expanded toggles immediately on click (screen readers get
 *     the state change right away, not after the animation finishes)
 *   - The `hidden` attribute is added back to a closed panel only
 *     once its collapse transition actually finishes, and removed
 *     immediately when opening — so a closed panel is truly out of
 *     the Tab order / accessibility tree, not just visually squashed
 *   - Arrow Up/Down move focus between headers, Home/End jump to the
 *     first/last header, per the APG accordion keyboard pattern
 */

function initFaqAccordion() {
  const accordion = document.querySelector('.faq-accordion');
  if (!accordion) return;

  const items = Array.from(accordion.querySelectorAll('.faq-item'));
  const triggers = items.map((item) => item.querySelector('.faq-item__trigger'));

  function openPanel(trigger) {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;

    trigger.setAttribute('aria-expanded', 'true');
    panel.hidden = false;

    // Force a reflow so the browser registers the 0fr state before we
    // switch to 1fr — otherwise it can jump straight to open with no
    // transition, since `hidden` and the transition would resolve in
    // the same frame.
    // eslint-disable-next-line no-unused-expressions
    panel.offsetHeight;

    panel.classList.add('is-open');
  }

  function closePanel(trigger) {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;

    trigger.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');

    if (prefersReducedMotion) {
      panel.hidden = true;
      return;
    }

    const onTransitionEnd = (e) => {
      if (e.target !== panel || e.propertyName !== 'grid-template-rows') return;
      panel.removeEventListener('transitionend', onTransitionEnd);
      // Only hide if it wasn't reopened before the collapse finished
      if (!panel.classList.contains('is-open')) panel.hidden = true;
    };
    panel.addEventListener('transitionend', onTransitionEnd);
  }

  function toggle(trigger) {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';

    // Single-open accordion: close every other panel first
    triggers.forEach((t) => {
      if (t !== trigger && t.getAttribute('aria-expanded') === 'true') {
        closePanel(t);
      }
    });

    if (isOpen) {
      closePanel(trigger);
    } else {
      openPanel(trigger);
    }
  }

  triggers.forEach((trigger, index) => {
    trigger.addEventListener('click', () => toggle(trigger));

    trigger.addEventListener('keydown', (e) => {
      let targetIndex = null;

      switch (e.key) {
        case 'ArrowDown':
          targetIndex = (index + 1) % triggers.length;
          break;
        case 'ArrowUp':
          targetIndex = (index - 1 + triggers.length) % triggers.length;
          break;
        case 'Home':
          targetIndex = 0;
          break;
        case 'End':
          targetIndex = triggers.length - 1;
          break;
        default:
          return; // let all other keys behave normally
      }

      e.preventDefault();
      triggers[targetIndex].focus();
    });
  });
}

/* ==========================================================================
   Scroll reveal (shared pattern with other Cortex sections)
   ========================================================================== */

/* ==========================================================================
   BLOG SECTION
   ========================================================================== */

/**
 * blog.js
 * Self-contained, dependency-free behavior for the Cortex Blog section:
 *   1. initCardClickThrough — clicking anywhere on a card (that isn't
 *      already a link) activates the post's title link, matching the
 *      "whole card is clickable" pattern readers expect from modern
 *      blog grids — without sacrificing the real, individually
 *      focusable links underneath for keyboard and screen reader users
 *   2. initReveal — fades/slides cards in on scroll
 */

/* ==========================================================================
   1. Whole-card click-through
   ========================================================================== */
function initCardClickThrough() {
  const cards = document.querySelectorAll('.blog-card');

  cards.forEach((card) => {
    const titleLink = card.querySelector('.blog-card__title a');
    if (!titleLink) return;

    card.addEventListener('click', (e) => {
      // If the click already landed on a real link or button, let it
      // behave normally — don't double-navigate or hijack the read-more link.
      if (e.target.closest('a, button')) return;
      titleLink.click();
    });

    // Makes the "whole card" affordance obvious without a native cursor
    // hint fighting the real links' own pointer cursor.
    card.style.cursor = 'pointer';
  });
}

/* ==========================================================================
   2. Scroll reveal (shared pattern with other Cortex sections)
   ========================================================================== */

/* ==========================================================================
   CONTACT SECTION
   ========================================================================== */

/**
 * contact.js
 * Self-contained, dependency-free behavior for the Cortex Contact form:
 *   1. initContactForm — accessible validation (aria-invalid + per-field
 *      error text), a live character counter, and a simulated submit
 *      flow (loading state -> success state) since this is a static
 *      template with no backend wired up
 *   2. initReveal — fades/slides the section in on scroll
 *
 * Replace the setTimeout in handleSubmit with a real fetch() to your
 * form endpoint when you wire this up to a backend.
 */

/* ==========================================================================
   1. Contact form
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('cf-submit');
  const status = document.getElementById('cf-status');
  const messageField = document.getElementById('cf-message');
  const counter = document.getElementById('cf-counter');

  const fields = ['name', 'email', 'reason', 'message'].map((name) => ({
    name,
    input: document.getElementById(`cf-${name}`),
    error: document.getElementById(`cf-${name}-error`),
  }));

  const messages = {
    name: 'Please enter your name.',
    email: 'Please enter a valid email address.',
    reason: 'Please choose a reason for contacting us.',
    message: 'Please add a short message.',
  };

  /* ---- Character counter ---- */
  if (messageField && counter) {
    const max = messageField.getAttribute('maxlength') || '600';
    const updateCounter = () => {
      counter.textContent = `${messageField.value.length} / ${max}`;
    };
    messageField.addEventListener('input', updateCounter);
    updateCounter();
  }

  /* ---- Validation ---- */
  function validateField(field) {
    const { input, error, name } = field;
    if (!input) return true;

    const isValid = input.checkValidity();
    input.setAttribute('aria-invalid', String(!isValid));
    if (error) error.textContent = isValid ? '' : messages[name];
    return isValid;
  }

  fields.forEach((field) => {
    if (!field.input) return;
    field.input.addEventListener('blur', () => validateField(field));
    field.input.addEventListener('input', () => {
      // Clear the error as soon as the field becomes valid again,
      // but don't nag the user before they've left the field once.
      if (field.input.getAttribute('aria-invalid') === 'true') {
        validateField(field);
      }
    });
  });

  /* ---- Submit ---- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const allValid = fields.map(validateField).every(Boolean);
    if (!allValid) {
      status.textContent = 'Please fix the highlighted fields.';
      status.classList.remove('is-success');
      const firstInvalid = fields.find((f) => f.input && !f.input.checkValidity());
      firstInvalid && firstInvalid.input.focus();
      return;
    }

    // No backend in this template — simulate a submit so the UI has
    // somewhere real to land. Swap this block for a fetch() call.
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    status.textContent = '';
    status.classList.remove('is-success');

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
      status.textContent = "Message sent — we'll get back to you within a business day.";
      status.classList.add('is-success');
      form.reset();
      if (counter) counter.textContent = `0 / ${messageField.getAttribute('maxlength') || '600'}`;
      fields.forEach((f) => f.input && f.input.removeAttribute('aria-invalid'));
    }, prefersReducedMotion ? 200 : 1100);
  });
}

/* ==========================================================================
   2. Scroll reveal (shared pattern with other Cortex sections)
   ========================================================================== */

/* ==========================================================================
   FOOTER SECTION
   ========================================================================== */

/**
 * footer.js
 * Self-contained, dependency-free behavior for the Cortex footer:
 *   1. initNewsletter — validates the email, simulates a submit
 *      (loading -> success/error state) since there's no backend
 *      wired up in this template
 *   2. initBackToTop  — shows/hides the button past a scroll
 *      threshold, animates its ring to reflect overall scroll
 *      progress, and smooth-scrolls to top on click
 *
 * Replace the setTimeout in the newsletter handler with a real
 * fetch() call to your list provider when you wire this up.
 */

/* ==========================================================================
   1. Newsletter
   ========================================================================== */
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  const input = document.getElementById('newsletter-email');
  const submitBtn = form.querySelector('.newsletter__submit');
  const status = document.getElementById('newsletter-status');
  const defaultStatusText = status ? status.textContent : '';

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!input.checkValidity()) {
      input.setAttribute('aria-invalid', 'true');
      status.textContent = 'Please enter a valid email address.';
      status.classList.remove('is-success');
      status.classList.add('is-error');
      input.focus();
      return;
    }

    input.removeAttribute('aria-invalid');
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    status.classList.remove('is-error', 'is-success');
    status.textContent = 'Subscribing…';

    // No backend in this template — simulate a submit so the UI has
    // somewhere real to land. Swap this block for a fetch() call.
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
      status.classList.add('is-success');
      status.textContent = "You're subscribed — check your inbox to confirm.";
      form.reset();

      // Quietly restore the default helper text after a while so the
      // form doesn't say "you're subscribed" forever if left open.
      setTimeout(() => {
        status.classList.remove('is-success');
        status.textContent = defaultStatusText;
      }, 6000);
    }, prefersReducedMotion ? 200 : 900);
  });
}

/* ==========================================================================
   2. Back to top
   ========================================================================== */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  const SHOW_AFTER_PX = 400;
  let ticking = false;

  function updateOnScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

    btn.style.setProperty('--progress', progress.toFixed(3));
    btn.classList.toggle('is-visible', scrollTop > SHOW_AFTER_PX);

    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
    // Move focus to the top of the page for keyboard/screen-reader
    // users once the jump happens, rather than leaving focus stuck
    // on a now-hidden button.
    const heading = document.querySelector('h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  });

  updateOnScroll();
}

/* ==========================================================================
   Init — every section's setup runs once, in page order.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Hero
  initParticleField();
  initMagneticButtons();
  initStatCounters();
  initScrollCue();

  // Services
  initTiltCards();

  // Features
  initMockAnims();

  // Pricing
  initBillingToggle();

  // Testimonials
  initTestimonialSlider();

  // FAQ
  initFaqAccordion();

  // Blog
  initCardClickThrough();

  // Contact
  initContactForm();

  // Footer
  initNewsletter();
  initBackToTop();

  // Shared scroll-reveal — runs last so every [data-reveal] element
  // from every section above has already been placed in the DOM.
  initReveal();
});
