(function () {
  const hero = document.querySelector('.eco-hero');
  if (!hero) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = motionPreference.matches;
  const heroPhoto = hero.querySelector('.eco-hero-photo');
  const motionToggle = document.querySelector('[data-motion-toggle]');
  let motionOverride = null;
  const categoryCards = [...document.querySelectorAll('.eco-category')];
  const productGrid = document.querySelector('.eco-product-grid');
  const impactPhoto = document.querySelector('.eco-impact-photo');
  let animationFrame = null;

  function getProgress(element) {
    const bounds = element.getBoundingClientRect();
    return (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height);
  }

  function updateParallax() {
    animationFrame = null;
    if (reduceMotion) return;

    const heroOffset = window.scrollY * 0.3;
    heroPhoto.style.setProperty('--eco-hero-parallax-y', `${heroOffset}px`);

    categoryCards.forEach((card) => {
      const offset = (getProgress(card) - 0.5) * 36;
      card.style.setProperty('--eco-category-parallax-y', `${offset}px`);
    });

    if (productGrid) {
      const gridBounds = productGrid.getBoundingClientRect();
      const gridCenter = gridBounds.left + gridBounds.width / 2;
      productGrid.querySelectorAll('.product-image > img').forEach((image) => {
        const bounds = image.parentElement.getBoundingClientRect();
        const verticalOffset = (getProgress(image.parentElement) - 0.5) * 34;
        const horizontalOffset = Math.max(-20, Math.min(20, (gridCenter - (bounds.left + bounds.width / 2)) * 0.07));
        image.style.setProperty('--eco-product-parallax-x', `${horizontalOffset}px`);
        image.style.setProperty('--eco-product-parallax-y', `${verticalOffset}px`);
      });
    }

    if (impactPhoto) {
      const offset = (getProgress(impactPhoto) - 0.5) * 48;
      impactPhoto.style.setProperty('--eco-impact-parallax-y', `${offset}px`);
    }
  }

  function scheduleParallax() {
    if (!reduceMotion && animationFrame === null) animationFrame = window.requestAnimationFrame(updateParallax);
  }

  function updateMotionControl() {
    if (!motionToggle) return;
    motionToggle.hidden = !motionPreference.matches && motionOverride === null;
    motionToggle.textContent = reduceMotion ? 'Ativar parallax do fundo' : 'Desativar parallax do fundo';
    motionToggle.setAttribute('aria-pressed', String(!reduceMotion));
    document.body.classList.toggle('motion-enabled', motionPreference.matches && !reduceMotion);
  }

  window.addEventListener('scroll', scheduleParallax, { passive: true });
  window.addEventListener('resize', scheduleParallax);
  if (productGrid) productGrid.addEventListener('scroll', scheduleParallax, { passive: true });
  updateMotionControl();
  scheduleParallax();

  if (motionToggle) {
    motionToggle.addEventListener('click', () => {
      motionOverride = reduceMotion;
      reduceMotion = !motionOverride;
      updateMotionControl();
      scheduleParallax();
    });
  }

  function handleMotionPreferenceChange(event) {
    if (motionOverride === null) reduceMotion = event.matches;
    updateMotionControl();
    scheduleParallax();
  }

  if (motionPreference.addEventListener) {
    motionPreference.addEventListener('change', handleMotionPreferenceChange);
  } else if (motionPreference.addListener) {
    motionPreference.addListener(handleMotionPreferenceChange);
  }

  let revealObserver = null;
  if ('IntersectionObserver' in window) {
    document.body.classList.add('has-scroll-reveal');
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    document.querySelectorAll('[data-scroll-reveal]').forEach((element) => revealObserver.observe(element));
    if (productGrid) {
      productGrid.querySelectorAll('[data-product-reveal]').forEach((element) => revealObserver.observe(element));
    }
  }

  if (productGrid && 'MutationObserver' in window) {
    const productObserver = new MutationObserver(() => {
      if (!reduceMotion) scheduleParallax();
      if (revealObserver) {
        productGrid.querySelectorAll('[data-product-reveal]:not(.is-visible)').forEach((element) => revealObserver.observe(element));
      }
    });
    productObserver.observe(productGrid, { childList: true, subtree: true });
  }
})();
