document.addEventListener('DOMContentLoaded', function () {

  // ── Scroll-based fade-in animation ──────────────────────────────────────

  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate once
      }
    });
  }, observerOptions);

  // Observe all animatable elements
  document.querySelectorAll(
    '.step-card, .service-card, .status-card, .section-header, .hero-inner'
  ).forEach(function (el, i) {
    el.classList.add('fade-up');
    // Stagger children inside grids
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
    observer.observe(el);
  });

});
