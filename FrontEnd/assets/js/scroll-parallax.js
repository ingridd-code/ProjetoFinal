(function () {
  const hero = document.querySelector('.eco-hero');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const heroPhoto = hero.querySelector('.eco-hero-photo');
  const heroCopy = hero.querySelector('.eco-hero-copy');
  const categoryCards = [...document.querySelectorAll('.eco-category')];
  const impactPhoto = document.querySelector('.eco-impact-photo');
  let animationFrame = null;

  function getProgress(element) {
    const bounds = element.getBoundingClientRect();
    return (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height);
  }

  function updateParallax() {
    animationFrame = null;
    const heroProgress = getProgress(hero);
    const heroOffset = Math.max(-45, Math.min(45, (heroProgress - 0.5) * 90));
    const copyOffset = Math.max(-12, Math.min(12, (heroProgress - 0.5) * 24));
    heroPhoto.style.setProperty('--eco-hero-parallax-y', `${heroOffset}px`);
    heroCopy.style.setProperty('--eco-copy-parallax-y', `${copyOffset}px`);

    categoryCards.forEach((card) => {
      const offset = (getProgress(card) - 0.5) * 36;
      card.style.setProperty('--eco-category-parallax-y', `${offset}px`);
    });

    if (impactPhoto) {
      const offset = (getProgress(impactPhoto) - 0.5) * 48;
      impactPhoto.style.setProperty('--eco-impact-parallax-y', `${offset}px`);
    }
  }

  function scheduleParallax() {
    if (animationFrame === null) animationFrame = window.requestAnimationFrame(updateParallax);
  }

  window.addEventListener('scroll', scheduleParallax, { passive: true });
  window.addEventListener('resize', scheduleParallax);
  updateParallax();

  if ('IntersectionObserver' in window) {
    document.body.classList.add('has-scroll-reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    document.querySelectorAll('[data-scroll-reveal]').forEach((element) => revealObserver.observe(element));
  }
})();
