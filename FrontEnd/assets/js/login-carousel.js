(function () {
  const carousel = document.querySelector('[data-login-carousel]');
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
  const previousButton = document.querySelector('[data-carousel-prev]');
  const nextButton = document.querySelector('[data-carousel-next]');
  const toggleButton = document.querySelector('[data-carousel-toggle]');
  const dots = [...document.querySelectorAll('[data-carousel-go]')];

  if (slides.length < 2) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeIndex = 0;
  let paused = false;
  let timer = null;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      if (dotIndex === activeIndex) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function stopTimer() {
    window.clearInterval(timer);
    timer = null;
  }

  function startTimer() {
    stopTimer();
    if (!paused && !reducedMotion && document.visibilityState === 'visible'
      && !carousel.matches(':hover') && !carousel.contains(document.activeElement)) {
      timer = window.setInterval(() => showSlide(activeIndex + 1), 5000);
    }
  }

  previousButton.addEventListener('click', () => {
    showSlide(activeIndex - 1);
    startTimer();
  });

  nextButton.addEventListener('click', () => {
    showSlide(activeIndex + 1);
    startTimer();
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.carouselGo));
      startTimer();
    });
  });

  toggleButton.hidden = reducedMotion;
  toggleButton.addEventListener('click', () => {
    paused = !paused;
    toggleButton.textContent = paused ? '▶' : 'Ⅱ';
    toggleButton.setAttribute('aria-label', paused ? 'Retomar carrossel' : 'Pausar carrossel');
    if (paused) stopTimer();
    else startTimer();
  });

  carousel.addEventListener('mouseenter', stopTimer);
  carousel.addEventListener('mouseleave', startTimer);
  carousel.addEventListener('focusin', stopTimer);
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) startTimer();
  });
  carousel.addEventListener('pointermove', (event) => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const bounds = carousel.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    carousel.style.setProperty('--parallax-image-x', `${-x * 16}px`);
    carousel.style.setProperty('--parallax-image-y', `${-y * 12}px`);
    carousel.style.setProperty('--parallax-copy-x', `${x * 5}px`);
    carousel.style.setProperty('--parallax-copy-y', `${y * 4}px`);
  });
  carousel.addEventListener('pointerleave', () => {
    carousel.style.removeProperty('--parallax-image-x');
    carousel.style.removeProperty('--parallax-image-y');
    carousel.style.removeProperty('--parallax-copy-x');
    carousel.style.removeProperty('--parallax-copy-y');
  });
  document.addEventListener('visibilitychange', startTimer);
  startTimer();
})();
