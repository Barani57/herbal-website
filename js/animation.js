// ==================== GSAP SCROLL ANIMATIONS ====================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  
  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // ===== HERO SECTION =====
  gsap.from('.hero-content', {
    opacity: 0,
    y: 60,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.hero-section',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.hero-image', {
    opacity: 0,
    x: 60,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.hero-section',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  });

  // Hero image parallax
  gsap.to('.hero-image', {
    y: 100,
    scrollTrigger: {
      trigger: '.hero-section',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.5
    }
  });

  // Hero CTA buttons
  gsap.from('.hero-cta', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    delay: 0.3,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.hero-cta',
      start: 'top 85%',
      toggleActions: 'play none none reverse'
    }
  });

  // ===== STATS SECTION =====
  gsap.from('.stat-card', {
    opacity: 0,
    scale: 0.8,
    stagger: 0.15,
    duration: 0.7,
    ease: 'back.out(1.4)',
    scrollTrigger: {
      trigger: '#quickStats',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  });

  // ===== BENEFITS SECTION =====
  gsap.from('.section-header', {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.benefits-section',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.benefit-card', {
    opacity: 0,
    y: 50,
    stagger: 0.15,
    duration: 0.7,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.benefits-grid',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  // ===== PRODUCTS SECTION =====
  gsap.from('.products-header', {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.products-section',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  // Animate product cards after they're rendered
  function animateProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    if (productCards.length > 0) {
      gsap.from(productCards, {
        opacity: 0,
        y: 50,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.products-grid',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });
    }
  }

  // Override renderProducts to add animation
  const originalRenderProducts = window.renderProducts;
  if (originalRenderProducts) {
    window.renderProducts = function() {
      originalRenderProducts();
      setTimeout(animateProductCards, 100);
    };
  }

  // ===== ABOUT SECTION =====
  gsap.from('.about-badge', {
    opacity: 0,
    scale: 0.8,
    duration: 0.6,
    ease: 'back.out(1.5)',
    scrollTrigger: {
      trigger: '.about-section',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.about-title', {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.about-intro',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.about-lead', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    delay: 0.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.about-intro',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.about-card', {
    opacity: 0,
    x: -50,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.about-story',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.value-card', {
    opacity: 0,
    y: 30,
    stagger: 0.1,
    duration: 0.6,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.about-values-grid',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.about-hero-card', {
    opacity: 0,
    x: 50,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.about-visual',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.collage-item', {
    opacity: 0,
    scale: 0,
    stagger: 0.15,
    duration: 0.6,
    ease: 'back.out(1.7)',
    scrollTrigger: {
      trigger: '.about-image-collage',
      start: 'top 85%',
      toggleActions: 'play none none reverse'
    }
  });

  // About orb continuous floating animation
  if (document.querySelector('.about-orb')) {
    gsap.to('.about-orb', {
      y: -20,
      duration: 3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });
  }

  // Parallax background
  gsap.to('.about-bg-pattern', {
    y: -100,
    scrollTrigger: {
      trigger: '.about-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.5
    }
  });

  // ===== TESTIMONIALS SECTION =====
  gsap.from('.section-badge', {
    opacity: 0,
    scale: 0.8,
    duration: 0.6,
    ease: 'back.out(1.5)',
    scrollTrigger: {
      trigger: '.testimonials-section',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.testimonials-title', {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.testimonials-header',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.testimonials-subtitle', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    delay: 0.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.testimonials-header',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.testimonials-3d-slider', {
    opacity: 0,
    y: 60,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.testimonials-3d-slider',
      start: 'top 75%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.testimonials-controls', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.testimonials-controls',
      start: 'top 85%',
      toggleActions: 'play none none reverse'
    }
  });

  // ===== FOOTER SECTION =====
  gsap.from('.footer-col-brand', {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.footer',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.footer-heading', {
    opacity: 0,
    y: 30,
    stagger: 0.15,
    duration: 0.7,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.footer-content',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.contact-block', {
    opacity: 0,
    x: -30,
    stagger: 0.1,
    duration: 0.6,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.footer-col-contact',
      start: 'top 85%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.map-embed', {
    opacity: 0,
    scale: 0.95,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.footer-col-map',
      start: 'top 85%',
      toggleActions: 'play none none reverse'
    }
  });

  gsap.from('.footer-copyright-content', {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.footer-copyright-bar',
      start: 'top 90%',
      toggleActions: 'play none none reverse'
    }
  });

  // ===== HEADER SCROLL EFFECT =====
  ScrollTrigger.create({
    start: 'top -50',
    end: 99999,
    toggleClass: { 
      className: 'scrolled', 
      targets: '.header' 
    }
  });

  // ===== FLOATING CART BUTTON =====
  gsap.from('.floating-cart.show', {
    scale: 0,
    duration: 0.4,
    ease: 'back.out(1.7)'
  });

  // ===== BACK TO TOP BUTTON =====
  if (document.getElementById('backToTop')) {
    gsap.from('#backToTop.show', {
      scale: 0,
      duration: 0.4,
      ease: 'back.out(1.7)'
    });
  }

  // ===== REFRESH SCROLLTRIGGER =====
  // After images load
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

  // On window resize with debounce
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);
  });

  console.log('✨ GSAP ScrollTrigger animations initialized');
});
