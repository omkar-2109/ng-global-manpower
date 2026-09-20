/**
 * NG Global Manpower Services
 * Core Client UI Controller, Navigation & Interactions
 */
(function() {
  'use strict';

  // Toggle Mobile Navigation Drawer
  window.toggleMobileMenu = function() {
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer && overlay) {
      drawer.classList.toggle('active');
      overlay.classList.toggle('active');
      document.body.style.overflow = drawer.classList.contains('active') ? 'hidden' : '';
    }
  };

  // Timeline Processing Track Switcher
  window.switchTimelineTrack = function(track) {
    const tabBtns = document.querySelectorAll('.timeline-tab-btn');
    const trackGulf = document.getElementById('track-gulf');
    const trackWestern = document.getElementById('track-western');

    if (tabBtns.length >= 2) {
      if (track === 'gulf') {
        tabBtns[0].classList.add('active');
        tabBtns[1].classList.remove('active');
        if (trackGulf) trackGulf.classList.add('active');
        if (trackWestern) trackWestern.classList.remove('active');
      } else {
        tabBtns[1].classList.add('active');
        tabBtns[0].classList.remove('active');
        if (trackWestern) trackWestern.classList.add('active');
        if (trackGulf) trackGulf.classList.remove('active');
      }
    }
  };

  // FAQ Accordion Toggle
  window.toggleFaq = function(element) {
    if (!element) return;
    const parent = element.parentElement;
    const isOpen = parent.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));
    if (!isOpen) {
      parent.classList.add('active');
    }
  };

  // 3D Luxury Golden-Cyan Scroll Progress Indicator
  function handle3DScroll() {
    const bar = document.getElementById('scrollProgress3D');
    if (!bar) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    bar.style.width = scrollPercent + '%';
  }

  let isScrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!isScrollTicking) {
      window.requestAnimationFrame(() => {
        handle3DScroll();
        isScrollTicking = false;
      });
      isScrollTicking = true;
    }
  }, { passive: true });

  // Job Carousel Controller
  window.slideCarousel = function(direction) {
    const viewport = document.getElementById('jobCarouselViewport');
    if (!viewport) return;

    const card = viewport.querySelector('.job-carousel-card');
    const scrollAmount = card ? card.offsetWidth + 24 : 340;

    if (direction === 'next') {
      viewport.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      viewport.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  function initCarouselDots() {
    const viewport = document.getElementById('jobCarouselViewport');
    const dotsWrap = document.getElementById('carouselDotsWrap');
    if (!viewport || !dotsWrap) return;

    const cards = viewport.querySelectorAll('.job-carousel-card');
    if (cards.length === 0) return;

    dotsWrap.innerHTML = '';
    cards.forEach((card, idx) => {
      const dot = document.createElement('div');
      dot.className = 'carousel-dot' + (idx === 0 ? ' active' : '');
      dot.onclick = () => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      };
      dotsWrap.appendChild(dot);
    });

    viewport.addEventListener('scroll', () => {
      const scrollLeft = viewport.scrollLeft;
      const cardWidth = (cards[0] ? cards[0].offsetWidth : 320) + 24;
      const activeIdx = Math.min(Math.round(scrollLeft / cardWidth), cards.length - 1);
      const dots = dotsWrap.querySelectorAll('.carousel-dot');
      dots.forEach((d, i) => {
        if (i === activeIdx) d.classList.add('active');
        else d.classList.remove('active');
      });
    }, { passive: true });
  }

  // Live Client-Side Job Filtering for Search & Categories
  window.filterJobsLive = function(query, country, category) {
    const cards = document.querySelectorAll('.job-filter-target');
    let visibleCount = 0;

    const q = (query || '').trim().toLowerCase();
    const c = (country || '').trim().toLowerCase();
    const cat = (category || '').trim().toLowerCase();

    cards.forEach(card => {
      const cardTitle = (card.getAttribute('data-title') || '').toLowerCase();
      const cardCountry = (card.getAttribute('data-country') || '').toLowerCase();
      const cardCat = (card.getAttribute('data-category') || '').toLowerCase();

      const matchQuery = !q || cardTitle.includes(q) || cardCat.includes(q);
      const matchCountry = !c || cardCountry.includes(c);
      const matchCat = !cat || cardCat.includes(cat);

      if (matchQuery && matchCountry && matchCat) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    const countEl = document.getElementById('liveJobsCountLabel');
    if (countEl) {
      countEl.textContent = `${visibleCount} openings available`;
    }

    const noResults = document.getElementById('liveJobsNoResults');
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  };

  window.handleHeroSearch = function(e) {
    if (e) e.preventDefault();
    const qInput = document.getElementById('heroSearchInput');
    const cSelect = document.getElementById('heroCountrySelect');
    const q = qInput ? qInput.value : '';
    const c = cSelect ? cSelect.value : '';

    filterJobsLive(q, c, '');

    // Scroll to openings section smoothly
    const openingsSec = document.getElementById('live-openings') || document.getElementById('hot-openings');
    if (openingsSec) {
      openingsSec.scrollIntoView({ behavior: 'smooth' });
    }
  };

  window.filterByCountryPill = function(countryName, element) {
    document.querySelectorAll('.hero-country-chip').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    const cSelect = document.getElementById('heroCountrySelect');
    if (cSelect) cSelect.value = countryName || '';

    const qInput = document.getElementById('heroSearchInput');
    const q = qInput ? qInput.value : '';

    filterJobsLive(q, countryName, '');

    const openingsSec = document.getElementById('live-openings') || document.getElementById('hot-openings');
    if (openingsSec) {
      openingsSec.scrollIntoView({ behavior: 'smooth' });
    }
  };

  window.filterByCategoryPill = function(categoryName, element) {
    document.querySelectorAll('.category-chip-card').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    filterJobsLive('', '', categoryName);

    const openingsSec = document.getElementById('live-openings') || document.getElementById('hot-openings');
    if (openingsSec) {
      openingsSec.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Smooth scroll helper for internal anchor links
  document.addEventListener('DOMContentLoaded', () => {
    handle3DScroll();
    initCarouselDots();

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || !href) return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Delegated click listeners as a robust backup to inline handlers
    document.addEventListener('click', (e) => {
      // Mobile Drawer Toggle
      if (e.target.closest('.mobile-menu-btn') || e.target.closest('.mobile-drawer-close') || e.target.closest('.mobile-drawer-overlay')) {
        toggleMobileMenu();
        return;
      }

      // Hero Search Submit Button
      if (e.target.closest('.search-submit-btn')) {
        e.preventDefault();
        handleHeroSearch(e);
        return;
      }

      // Timeline Switcher
      const timelineBtn = e.target.closest('.timeline-tab-btn');
      if (timelineBtn) {
        const isGulf = timelineBtn.textContent.toLowerCase().includes('gulf');
        switchTimelineTrack(isGulf ? 'gulf' : 'western');
        return;
      }
    });

    // Hero search form submit
    const heroForm = document.querySelector('.hero-search-form');
    if (heroForm) {
      heroForm.addEventListener('submit', (e) => {
        handleHeroSearch(e);
      });
    }
  });
})();
