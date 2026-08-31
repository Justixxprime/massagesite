/* ==========================================================================
   AMARA VALE — Shared JS
   Every interaction on the site lives here. Organized by feature so it's
   easy to find and edit one piece without touching the others.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------------
     -1. SAFETY RESET — if a browser restores this page from back/forward
         cache (common on iOS Safari) while the body was mid-scroll-lock
         from a previous visit, this guarantees scrolling is never left
         stuck. Runs before anything else touches body overflow.
  --------------------------------------------------------------------- */
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      const menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.remove('open');
    }
  });

  /* ---------------------------------------------------------------------
     -1b. SCROLL LOCK HELPER — shared by the mobile menu and the gallery
          lightbox. Freezes the page in place while an overlay is open.

          Why not just `body { overflow: hidden }`? On iOS Safari, that
          alone does NOT reliably stop the page underneath from moving,
          and a `position: fixed` overlay is positioned against the
          on-screen viewport, which iOS Safari recalculates lazily. Net
          effect: open the menu after scrolling down, and the overlay can
          render in the wrong spot until the next scroll forces Safari to
          recompute it — exactly the "looks broken until you scroll"
          mobile menu bug.

          Fix: instead of hiding overflow, we pin the body itself with
          `position: fixed` at its current scroll offset. That makes the
          body incapable of moving at all while the overlay is open, on
          every browser, so the fixed overlay always lines up. On close,
          we undo the pin and jump back to the saved scroll position so
          the page doesn't appear to move.
  --------------------------------------------------------------------- */
  let scrollLockY = 0;
  function lockBodyScroll() {
    scrollLockY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollLockY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  function unlockBodyScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollLockY);
  }

  /* ---------------------------------------------------------------------
     0. THEME SYSTEM — Light / Dark / System / Auto (time-of-day)
        Cycles through modes on click, remembers choice in localStorage.
        "Auto" reads the visitor's own device clock and switches to dark
        after sunset-ish hours (7pm–7am) — this is the closest a static
        site can get to a real location-based day/night mode without a
        geolocation + sunrise/sunset API (see TEACHING-GUIDE.md).
  --------------------------------------------------------------------- */
  const THEME_KEY = 'amara-theme-mode';
  const modes = ['light', 'dark', 'system', 'auto'];
  const modeIcons = {
    light: 'fa-sun',
    dark: 'fa-moon',
    system: 'fa-desktop',
    auto: 'fa-clock'
  };

  function resolveTheme(mode) {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (mode === 'auto') {
      const hour = new Date().getHours();
      return (hour >= 19 || hour < 7) ? 'dark' : 'light';
    }
    return 'light';
  }

  function applyTheme(mode) {
    const resolved = resolveTheme(mode);
    if (resolved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    document.querySelectorAll('#theme-icon, .theme-icon-mobile').forEach(icon => {
      Object.values(modeIcons).forEach(cls => icon.classList.remove(cls));
      icon.classList.add(modeIcons[mode]);
    });
    const labelText = { light: 'Light', dark: 'Dark', system: 'System', auto: 'Auto' }[mode] || 'Theme';
    const labelEl = document.getElementById('theme-toggle-label');
    if (labelEl) labelEl.textContent = labelText;
  }

  let currentMode = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(currentMode);

  function cycleTheme() {
    const idx = modes.indexOf(currentMode);
    currentMode = modes[(idx + 1) % modes.length];
    localStorage.setItem(THEME_KEY, currentMode);
    applyTheme(currentMode);
  }

  document.getElementById('theme-toggle')?.addEventListener('click', cycleTheme);
  document.getElementById('theme-toggle-mobile')?.addEventListener('click', cycleTheme);

  // Keep in sync if system preference changes while "system" mode is active
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentMode === 'system') applyTheme('system');
  });

  // Re-check "auto" mode every 10 minutes in case day turns to night mid-visit
  setInterval(() => { if (currentMode === 'auto') applyTheme('auto'); }, 10 * 60 * 1000);

  /* ---------------------------------------------------------------------
     0b. SCROLL PROGRESS BAR
  --------------------------------------------------------------------- */
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      progressBar.style.width = scrolled + '%';
    });
  }

  /* ---------------------------------------------------------------------
     0c. CURSOR GLOW (desktop only, purely decorative)
  --------------------------------------------------------------------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    document.body.appendChild(glow);
    document.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
      glow.classList.add('active');
    });
    document.addEventListener('mouseleave', () => glow.classList.remove('active'));
  }

  /* ---------------------------------------------------------------------
     0d. MAGNETIC BUTTONS — buttons subtly follow the cursor on hover
  --------------------------------------------------------------------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.btn-primary, .btn-outline, .btn-rose').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------------
     0f. VIDEO SLOTS — click-to-play overlay behavior. Falls back
         gracefully (shows the poster image) if no video file is present
         yet, since the <video> src simply won't resolve until you add
         real files to the /videos folder.
  --------------------------------------------------------------------- */
  document.querySelectorAll('.video-slot').forEach(slot => {
    const video = slot.querySelector('video');
    const overlay = slot.querySelector('.video-play-overlay');
    if (!video || !overlay) return;
    overlay.addEventListener('click', () => {
      video.play().then(() => {
        slot.classList.add('playing');
        video.setAttribute('controls', 'controls');
      }).catch(() => {
        // No video file present yet, nothing to play
      });
    });
    video.addEventListener('pause', () => slot.classList.remove('playing'));
    video.addEventListener('ended', () => slot.classList.remove('playing'));
  });

  /* ---------------------------------------------------------------------
     0g. BACK TO TOP — appears after scrolling, smooth-scrolls to top
  --------------------------------------------------------------------- */
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 600) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------------------------------------------------------------
     0h. CUSTOM DROPDOWNS — replaces every native <select> on the page,
         since browsers won't let CSS restyle the native dropdown panel
         itself. Works generically for any .custom-select found, so it
         covers the service picker, "how did you hear about us", and any
         future custom dropdown added the same way.
  --------------------------------------------------------------------- */
  document.querySelectorAll('.custom-select').forEach(customSelect => {
    const trigger = customSelect.querySelector('.custom-select-trigger');
    const label = trigger.querySelector('span');
    const hiddenInput = customSelect.querySelector('input[type="hidden"]');
    const options = customSelect.querySelectorAll('.custom-select-option');
    if (!trigger || !label || !hiddenInput) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close any other open custom-selects first
      document.querySelectorAll('.custom-select.open').forEach(other => {
        if (other !== customSelect) other.classList.remove('open');
      });
      customSelect.classList.toggle('open');
    });

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        options.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        label.textContent = opt.dataset.value;
        hiddenInput.value = opt.dataset.value;
        customSelect.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!customSelect.contains(e.target)) customSelect.classList.remove('open');
    });
  });

  /* ---------------------------------------------------------------------
     0i. CUSTOM DATE PICKER — a real month-view calendar built from
         scratch, since the native date picker's calendar popup can't be
         restyled with CSS (it's rendered by the OS/browser, not the page).
  --------------------------------------------------------------------- */
  const datepicker = document.getElementById('booking-datepicker');
  if (datepicker) {
    const trigger = datepicker.querySelector('.custom-select-trigger');
    const label = document.getElementById('datepicker-label');
    const hiddenInput = document.getElementById('datepicker-value');
    const monthLabel = document.getElementById('datepicker-month-label');
    const daysGrid = document.getElementById('datepicker-days');
    const prevBtn = document.getElementById('datepicker-prev');
    const nextBtn = document.getElementById('datepicker-next');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();
    let selectedDate = null;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function renderCalendar() {
      monthLabel.textContent = `${monthNames[viewMonth]} ${viewYear}`;
      daysGrid.innerHTML = '';

      const firstDay = new Date(viewYear, viewMonth, 1).getDay();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'datepicker-day empty';
        daysGrid.appendChild(empty);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'datepicker-day';
        cell.textContent = d;
        const cellDate = new Date(viewYear, viewMonth, d);
        cellDate.setHours(0, 0, 0, 0);

        if (cellDate < today) {
          cell.classList.add('disabled');
        } else {
          if (cellDate.getTime() === today.getTime()) cell.classList.add('today');
          if (selectedDate && cellDate.getTime() === selectedDate.getTime()) cell.classList.add('selected');
          cell.addEventListener('click', () => {
            selectedDate = cellDate;
            const iso = cellDate.toISOString().split('T')[0];
            hiddenInput.value = iso;
            label.textContent = cellDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            datepicker.classList.remove('open');
            renderCalendar();
          });
        }
        daysGrid.appendChild(cell);
      }
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      datepicker.classList.toggle('open');
    });
    prevBtn.addEventListener('click', () => {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      renderCalendar();
    });
    nextBtn.addEventListener('click', () => {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderCalendar();
    });
    document.addEventListener('click', (e) => {
      if (!datepicker.contains(e.target)) datepicker.classList.remove('open');
    });

    renderCalendar();
  }

  /* ---------------------------------------------------------------------
     0j. PREFERRED TIME PILLS (booking form)
  --------------------------------------------------------------------- */
  const timePills = document.querySelectorAll('.time-pill');
  if (timePills.length) {
    const timeValue = document.getElementById('preferred-time-value');
    timePills.forEach(pill => {
      pill.addEventListener('click', () => {
        timePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        if (timeValue) timeValue.value = pill.dataset.time;
      });
    });
  }

  /* ---------------------------------------------------------------------
     1. STICKY NAV — adds a background once you scroll past the hero
  --------------------------------------------------------------------- */
  const nav = document.getElementById('site-nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
  }

  /* ---------------------------------------------------------------------
     1b. "MORE" DROPDOWN — animated overflow menu in the nav
  --------------------------------------------------------------------- */
  const moreDropdown = document.getElementById('more-dropdown');
  const moreTrigger = document.getElementById('more-trigger');
  if (moreDropdown && moreTrigger) {
    moreTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = moreDropdown.classList.toggle('open');
      moreTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (!moreDropdown.contains(e.target)) {
        moreDropdown.classList.remove('open');
        moreTrigger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        moreDropdown.classList.remove('open');
        moreTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------------------------------------------------------------
     2. MOBILE MENU TOGGLE — full-screen animated overlay
  --------------------------------------------------------------------- */
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileMenuBackdrop = mobileMenu ? mobileMenu.querySelector('.mobile-menu-backdrop') : null;

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    lockBodyScroll();
  }
  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    unlockBodyScroll();
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      if (mobileMenu.classList.contains('open')) closeMobileMenu();
      else openMobileMenu();
    });
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
    if (mobileMenuBackdrop) mobileMenuBackdrop.addEventListener('click', closeMobileMenu);
    // Close menu when a link is tapped
    mobileMenu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', closeMobileMenu)
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });
  }

  /* ---------------------------------------------------------------------
     3. SCROLL REVEAL — fades/slides elements in as they enter the screen
  --------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ---------------------------------------------------------------------
     4. VINE DIVIDER — the signature line-drawing motif, animates once
        when it scrolls into view
  --------------------------------------------------------------------- */
  const vines = document.querySelectorAll('.vine-divider');
  if (vines.length) {
    const vineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          vineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    vines.forEach(el => vineObserver.observe(el));
  }

  /* ---------------------------------------------------------------------
     5. GALLERY LIGHTBOX — click a photo, see it full-screen, with
        prev/next arrows and keyboard navigation
  --------------------------------------------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item img'));

  if (lightbox && lightboxImg && galleryItems.length) {
    let currentIndex = 0;

    const visibleItems = () => galleryItems.filter(img => !img.closest('.gallery-item').classList.contains('filtered-out'));

    const openAt = (img) => {
      const list = visibleItems();
      currentIndex = list.indexOf(img);
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('open');
      lockBodyScroll();
    };

    const showIndex = (i) => {
      const list = visibleItems();
      currentIndex = (i + list.length) % list.length;
      lightboxImg.src = list[currentIndex].src;
      lightboxImg.alt = list[currentIndex].alt;
    };

    galleryItems.forEach(img => img.addEventListener('click', () => openAt(img)));

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      unlockBodyScroll();
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showIndex(currentIndex - 1); });
    if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showIndex(currentIndex + 1); });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showIndex(currentIndex + 1);
      if (e.key === 'ArrowLeft') showIndex(currentIndex - 1);
    });
  }

  /* ---------------------------------------------------------------------
     5b. GALLERY FILTERS — show/hide by category
  --------------------------------------------------------------------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.gallery-item').forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.classList.remove('filtered-out');
          } else {
            item.classList.add('filtered-out');
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     6. TESTIMONIAL SLIDER — simple auto-advancing carousel
  --------------------------------------------------------------------- */
  const track = document.getElementById('testimonial-track');
  if (track) {
    const slides = track.children;
    let index = 0;
    const dotsWrap = document.getElementById('testimonial-dots');
    const dots = [];

    if (dotsWrap) {
      Array.from(slides).forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'w-2.5 h-2.5 rounded-full transition-all duration-300';
        dot.style.background = i === 0 ? 'var(--forest)' : 'var(--cream-line)';
        dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.style.background = di === index ? 'var(--forest)' : 'var(--cream-line)');
    }

    document.querySelectorAll('[data-testimonial-next]').forEach(b => b.addEventListener('click', () => goTo(index + 1)));
    document.querySelectorAll('[data-testimonial-prev]').forEach(b => b.addEventListener('click', () => goTo(index - 1)));

    let autoplay = setInterval(() => goTo(index + 1), 6000);
    track.parentElement.addEventListener('mouseenter', () => clearInterval(autoplay));
    track.parentElement.addEventListener('mouseleave', () => { autoplay = setInterval(() => goTo(index + 1), 6000); });
  }

  /* ---------------------------------------------------------------------
     7. FAQ ACCORDION
  --------------------------------------------------------------------- */
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ---------------------------------------------------------------------
     8. BOOKING FORM — real submission via Web3Forms (free form backend).
        Get a free access key at https://web3forms.com and paste it into
        the hidden "access_key" input in booking.html. Until you do that,
        the form will show an error instead of silently failing.
  --------------------------------------------------------------------- */
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';

    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const confirmation = document.getElementById('form-confirmation');
      const errorBox = document.getElementById('form-error');

      if (submitBtn) { submitBtn.textContent = 'Sending…'; submitBtn.disabled = true; }
      if (errorBox) errorBox.classList.add('hidden');

      try {
        const formData = new FormData(bookingForm);
        const res = await fetch(bookingForm.action, { method: 'POST', body: formData });
        const result = await res.json();

        if (result.success) {
          bookingForm.classList.add('hidden');
          if (confirmation) confirmation.classList.remove('hidden');
        } else {
          throw new Error(result.message || 'Submission failed');
        }
      } catch (err) {
        if (errorBox) {
          errorBox.textContent = 'Something went wrong sending your request — please call or WhatsApp us directly, or try again in a moment.';
          errorBox.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) { submitBtn.textContent = originalBtnText; submitBtn.disabled = false; }
      }
    });
  }

  /* ---------------------------------------------------------------------
     8b. GIFT CARD FORM — amount selector + real submission via Web3Forms
  --------------------------------------------------------------------- */
  const amountBtns = document.querySelectorAll('.amount-btn');
  if (amountBtns.length) {
    amountBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        amountBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const amount = btn.dataset.amount;
        const displayEl = document.getElementById('card-amount-display');
        const fieldEl = document.getElementById('giftcard-amount-field');
        const readonlyEl = document.getElementById('giftcard-amount-readonly');
        if (displayEl) displayEl.textContent = '$' + amount;
        if (fieldEl) fieldEl.value = amount;
        if (readonlyEl) readonlyEl.value = '$' + amount;
      });
    });
  }

  const giftcardForm = document.getElementById('giftcard-form');
  if (giftcardForm) {
    const submitBtn = giftcardForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    giftcardForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const confirmation = document.getElementById('giftcard-confirmation');
      const errorBox = document.getElementById('giftcard-error');
      if (submitBtn) { submitBtn.textContent = 'Sending…'; submitBtn.disabled = true; }
      if (errorBox) errorBox.classList.add('hidden');
      try {
        const formData = new FormData(giftcardForm);
        const res = await fetch(giftcardForm.action, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
          giftcardForm.classList.add('hidden');
          if (confirmation) confirmation.classList.remove('hidden');
        } else {
          throw new Error(result.message || 'Submission failed');
        }
      } catch (err) {
        if (errorBox) {
          errorBox.textContent = 'Something went wrong, please message on WhatsApp instead.';
          errorBox.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
      }
    });
  }

  /* ---------------------------------------------------------------------
     9. ACTIVE NAV LINK — highlights the current page in the nav (desktop
        AND mobile menu, since both share the .nav-link class)
  --------------------------------------------------------------------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .footer-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
  });

  /* ---------------------------------------------------------------------
     9b. SMOOTH PAGE TRANSITIONS — fade out before navigating to another
         page on this site, so the switch feels like one continuous UI
         instead of a hard reload.
  --------------------------------------------------------------------- */
  document.querySelectorAll('a[href$=".html"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (link.target === '_blank' || href.startsWith('http')) return;
      e.preventDefault();
      document.body.classList.add('page-leaving');
      setTimeout(() => { window.location.href = href; }, 180);
    });
  });

  /* ---------------------------------------------------------------------
     10b. PARALLAX BACKGROUNDS — subtle scroll-linked image movement
  --------------------------------------------------------------------- */
  const parallaxEls = document.querySelectorAll('.parallax-img');
  if (parallaxEls.length) {
    let ticking = false;
    const updateParallax = () => {
      parallaxEls.forEach(el => {
        const rect = el.closest('.parallax-wrap').getBoundingClientRect();
        const speed = parseFloat(el.dataset.speed || 0.15);
        const offset = (rect.top - window.innerHeight / 2) * speed;
        el.style.transform = `translateY(${offset}px) scale(1.15)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    });
    updateParallax();
  }

  /* ---------------------------------------------------------------------
     10c. MASK REVEAL — curtain-wipe images, trigger once visible
  --------------------------------------------------------------------- */
  const maskEls = document.querySelectorAll('.mask-reveal');
  if (maskEls.length) {
    const maskObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          maskObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    maskEls.forEach(el => maskObserver.observe(el));
  }

  /* ---------------------------------------------------------------------
     10. COUNT-UP STATS — numbers animate upward once visible
  --------------------------------------------------------------------- */
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.countTo, 10);
        const duration = 1600;
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target).toLocaleString();
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  /* ---------------------------------------------------------------------
     11. SMOOTH-SCROLL TO BOOKING FORM — any link to booking.html#booking-form
         (used by every "Book a Session" button site-wide) scrolls smoothly
         to the actual form and gives it a soft highlight flash so it's
         obvious where you landed.
  --------------------------------------------------------------------- */
  if (window.location.hash === '#booking-form') {
    const target = document.getElementById('booking-form');
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('target-flash');
        setTimeout(() => target.classList.remove('target-flash'), 1500);
      }, 400);
    }
  }

});
