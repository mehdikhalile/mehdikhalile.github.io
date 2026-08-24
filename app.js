/* Mehdi Khalile , CV site.
   No build step. Language and a GSAP motion layer whose centrepiece is
   the pinned journey: scrolling down moves the track left, forward through time. */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /*  language 
     French lives in data-fr on the element that owns the text. The English is
     captured into data-en on the first switch, so the markup stays the single
     source for it and nothing is duplicated by hand. */

  var LANG_META = {
    en: {
      title: 'Mehdi Khalile, Marketing & Strategy',
      desc: 'Mehdi Khalile. Marketing professional based in Casablanca. Market analysis, project coordination, reporting, and AI-assisted operations.',
      toolLabel: 'Passer en français'
    },
    fr: {
      title: 'Mehdi Khalile, Marketing & Stratégie',
      desc: 'Mehdi Khalile. Professionnel du marketing basé à Casablanca. Analyse de marché, coordination de projets, reporting et opérations assistées par l’IA.',
      toolLabel: 'Switch to English'
    }
  };

  var syncMenu = function () {};

  function applyLang(lang) {
    var fr = lang === 'fr';

    document.querySelectorAll('[data-fr]').forEach(function (el) {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      el.innerHTML = fr ? el.dataset.fr : el.dataset.en;
    });

    /* An icon-only link says what it is in its aria-label and nowhere else, so
       the label is the whole of its text and it has to switch too. LinkedIn
       carries none: it is a name, not a word. */
    document.querySelectorAll('[data-fr-label]').forEach(function (el) {
      if (el.dataset.enLabel === undefined) el.dataset.enLabel = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', fr ? el.dataset.frLabel : el.dataset.enLabel);
    });


    root.lang = fr ? 'fr' : 'en';

    var meta = LANG_META[fr ? 'fr' : 'en'];
    document.title = meta.title;
    var d = document.querySelector('meta[name="description"]');
    if (d) d.setAttribute('content', meta.desc);

    /* The menu button says one of two words and which one is not a property of
       the markup, so it cannot carry data-fr like everything else. It is
       repainted here instead, and the placeholder above means the first
       applyLang can run before the menu block has defined it. */
    syncMenu();

    var btn = document.getElementById('lang');
    if (btn) {
      btn.setAttribute('aria-label', meta.toolLabel);
      btn.setAttribute('title', fr ? 'English' : 'Français');
      var codes = btn.querySelectorAll('.mono');
      if (codes.length === 2) {
        codes[0].classList.toggle('off', fr);
        codes[1].classList.toggle('off', !fr);
      }
    }


    // The cord's label depends on which way it is about to go, so applyLang
    // cannot reach it through data-fr like everything else.
    if (window.__cordLabel) window.__cordLabel();

    try { localStorage.setItem('mk-lang', fr ? 'fr' : 'en'); } catch (e) {}

    // The statement is a different sentence in French, so its words have to be
    // cut again and their scrub range re-measured.
    if (window.__statements) window.__statements();

    // French runs about a third longer, so a piece is a different height here
    // and the strip around it has to be remeasured. Nothing else tells it to.
    if (window.__wrSize) window.__wrSize();

    // French runs about a third longer, so the journey track is a different
    // width in each language and the pin has to be measured again.
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  var startLang =
    new URLSearchParams(location.search).get('lang') ||
    (function () { try { return localStorage.getItem('mk-lang'); } catch (e) { return null; } })() ||
    'en';

  applyLang(startLang === 'fr' ? 'fr' : 'en');

  var langBtn = document.getElementById('lang');
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      applyLang(root.lang === 'fr' ? 'en' : 'fr');
    });
  }

  /*  menu overlay 
      The links live here below 920 and nowhere else, so this is the only way to
      reach a section on a phone. Escape closes it, a link closes it, and the
      scroll is locked while it is open or the page moves behind the panel. */
  var menubtn = document.getElementById('menubtn');
  var ovl = document.getElementById('ovl');
  var MENU_WORDS = { en: ['Menu', 'Close'], fr: ['Menu', 'Fermer'] };

  syncMenu = function () {
    if (!menubtn) return;
    var open = document.body.classList.contains('menu');
    var words = MENU_WORDS[root.lang === 'fr' ? 'fr' : 'en'] || MENU_WORDS.en;
    menubtn.textContent = open ? words[1] : words[0];
  };

  function setMenu(open) {
    if (!menubtn || !ovl) return;
    document.body.classList.toggle('menu', open);
    document.body.classList.toggle('lock', open);
    menubtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    /* aria-hidden on a panel that still holds focusable links is a panel a
       screen reader is told to ignore and a keyboard can still tab into. */
    ovl.setAttribute('aria-hidden', open ? 'false' : 'true');
    ovl.querySelectorAll('a').forEach(function (a) {
      if (open) a.removeAttribute('tabindex');
      else a.setAttribute('tabindex', '-1');
    });
    syncMenu();
  }

  if (menubtn && ovl) {
    setMenu(false);
    menubtn.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('menu'));
    });
    ovl.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu')) setMenu(false);
    });
    /* Crossing back above the breakpoint with the panel open leaves a full
       screen of links over a layout that has its own nav back. */
    addEventListener('resize', function () {
      if (innerWidth > 920 && document.body.classList.contains('menu')) setMenu(false);
    });
  }

  /*  the cutout 
     A missing or broken file must not leave a torn image icon standing in
     the hero. Hide it and the layout closes up around the text. */

  var shot = document.getElementById('shot');
  if (shot) {
    var hide = function () {
      shot.classList.add('gone');
      var t = document.querySelector('.torch');
      if (t) t.style.display = 'none';
    };
    shot.addEventListener('error', hide);
    if (shot.complete && shot.naturalWidth === 0) hide();
  }


  /*  bar, progress bar, current section  */

  var bar = document.querySelector('.bar');
  var fill = document.querySelector('.progress i');
  var links = Array.prototype.slice.call(document.querySelectorAll('.bar-nav a'));
  var secs = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  var ticking = false;

  function frame() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;

    if (bar) bar.classList.toggle('stuck', y > 8);

    if (fill) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.width = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + '%';
    }

    // The section whose top has passed the bar most recently is the one being
    // read, which a plain IntersectionObserver gets wrong on the short sections
    // at the end of the page. offsetTop is unusable once a section is pinned,
    // so this measures against the live rect instead.
    var line = parseFloat(getComputedStyle(root).getPropertyValue('--bar-h') || 64) + 60;
    var idx = -1;
    for (var i = 0; i < secs.length; i++) {
      if (secs[i].getBoundingClientRect().top <= line) idx = i;
    }
    if (y + window.innerHeight >= document.documentElement.scrollHeight - 4) idx = secs.length - 1;

    links.forEach(function (a, i) { a.classList.toggle('on', i === idx); });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* the pull cord
     The spotlight above him turns on and off from a cord, and the cord swings
     when it is pulled. The swing is a CSS keyframe, so it is a transform the
     compositor owns; JS only restarts it, which needs the class off, a forced
     reflow, and the class back on, or a second pull does nothing. */

  var cord = document.getElementById('cord');
  var heroEl = document.querySelector('.hero');

  if (cord && heroEl) {
    var LABEL = {
      en: { on: 'Turn the light off', off: 'Turn the light on' },
      fr: { on: 'Eteindre la lumiere', off: 'Allumer la lumiere' }
    };

    function label() {
      var on = heroEl.classList.contains('lit-on');
      var l = LABEL[root.lang === 'fr' ? 'fr' : 'en'];
      cord.setAttribute('aria-label', on ? l.on : l.off);
      cord.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    window.__cordLabel = label;
    label();

    cord.addEventListener('click', function () {
      heroEl.classList.toggle('lit-on');
      label();
      cord.classList.remove('pull');
      void cord.offsetWidth;
      cord.classList.add('pull', 'used');
    });
    /* Keyed to the lower segment, which starts a beat late and so finishes last.
       Keyed to the cord it would strip the class while the tip was still
       moving. */
    cord.addEventListener('animationend', function (e) {
      if (e.animationName === 'lag') cord.classList.remove('pull');
    });
  }

  /*  the pager

     One card fills the rail and the dots say where you are. Used twice: by the
     writing strip at every width, and by the skills deck on a phone only, so
     the two behave identically and there is one implementation of it.

     It runs under reduced motion too. Knowing which card you are on is the
     section working, not an arrival effect. With no script the rail is still a
     scroller and every card is still readable, which is why nothing here
     writes content. */
  function pager(rail, dotBox, sel, opts) {
    if (!rail || !dotBox) return null;
    var cards = [].slice.call(rail.querySelectorAll(sel));
    var dots = [].slice.call(dotBox.children);
    if (!cards.length || dots.length !== cards.length) return null;
    opts = opts || {};

    var at = -1, queued = false, live = true;

    function mark() {
      queued = false;
      if (!live) return;
      /* Every rect in one pass, then the classes in a second. Interleaving is
         a forced reflow per card per frame and this runs on every scrolled
         frame, the same reason trace() is written this way. */
      var box = rail.getBoundingClientRect();
      var mid = box.left + box.width / 2;
      var best = 0, bestD = Infinity, i, r, d;
      for (i = 0; i < cards.length; i++) {
        r = cards[i].getBoundingClientRect();
        d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best === at) return;
      at = best;
      for (i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('is-on', i === at);
        dots[i].setAttribute('aria-current', i === at ? 'true' : 'false');
      }
      size();
    }

    function queue() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(mark);
    }

    function go(i) {
      /* Clamped, because the wheel and the arrow keys both ask for at ± 1 and
         the ends of the list are exactly where a reader pushes hardest.
         scrollLeft rather than scrollIntoView, which walks up the ancestors and
         scrolls the page as well as the rail. */
      i = Math.max(0, Math.min(cards.length - 1, i));
      rail.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
    }

    /* The rail is the height of the card being shown, where the caller asks
       for it. Recomputed on resize and on a language switch, which is the case
       with no event of its own: applyLang rewrites the text, so a card's height
       changes without its box ever being resized and a ResizeObserver would
       never fire. */
    function size() {
      if (!opts.fit || at < 0 || !cards[at] || !live) return;
      rail.style.height = cards[at].offsetHeight + 'px';
    }

    /* ONE GESTURE MOVES ONE CARD, and this is why the wheel is taken over
       rather than left to CSS. `scroll-snap-stop: always` is set and it holds
       for a touch swipe and for a single wheel notch, but a trackpad fling
       arrives as a long burst of deltas: the rail travels past several snap
       points and then settles on whichever is nearest, which is Mehdi's report
       that it scrolls too far and does not stop at the next card. Headless
       cannot reproduce inertia, so this is not something a test would have
       caught.

       Only a horizontally dominant gesture is taken. A vertical wheel over the
       rail belongs to the page, and it was verified to reach it: the rail must
       never become a place where the page stops scrolling. */
    var busy = false, quiet;
    rail.addEventListener('wheel', function (e) {
      /* A pager that is standing down is not a scroller, and swallowing a
         sideways gesture over one would be taking an input it cannot use. */
      if (!live) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      /* The lock lifts on a quiet gap rather than on a timer, or the tail of
         one fling is read as the start of the next. */
      clearTimeout(quiet);
      quiet = setTimeout(function () { busy = false; }, 140);
      if (busy || Math.abs(e.deltaX) < 8) return;
      busy = true;
      go(at + (e.deltaX > 0 ? 1 : -1));
    }, { passive: false });

    /* ONE SWIPE MOVES ONE CARD, and the finger drives it rather than the
       browser. `scroll-snap-stop: always` is set and is simply not honoured
       everywhere on mobile, and where momentum outlives it a single swipe
       crossed four cards or more, which is what Mehdi reported. The rail
       carries `touch-action: pan-y`, so the browser keeps the vertical axis
       and never scrolls this horizontally; the horizontal axis is moved here.

       The card still follows the finger, because a pager that only jumps when
       you let go feels like a button rather than a surface. What it will not
       do is carry on afterwards: the landing is always the card you started
       on, plus or minus one. */
    var tX = 0, tY = 0, tScroll = 0, tAt = 0, drag = null, settle;

    rail.addEventListener('touchstart', function (e) {
      if (!live || e.touches.length !== 1) return;
      clearTimeout(settle);
      tX = e.touches[0].clientX;
      tY = e.touches[0].clientY;
      tScroll = rail.scrollLeft;
      tAt = at < 0 ? 0 : at;
      drag = null;
    }, { passive: true });

    rail.addEventListener('touchmove', function (e) {
      if (!live || e.touches.length !== 1) return;
      var dx = e.touches[0].clientX - tX;
      var dy = e.touches[0].clientY - tY;
      /* The axis is decided once, on the first movement that is big enough to
         mean anything. Deciding it per event lets a diagonal swipe flicker
         between scrolling the page and dragging the rail. */
      if (drag === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        drag = Math.abs(dx) > Math.abs(dy);
        if (drag) rail.classList.add('is-drag');
      }
      if (!drag) return;
      rail.scrollLeft = tScroll - dx;
    }, { passive: true });

    function land() {
      if (!drag) return;
      drag = null;
      var moved = rail.scrollLeft - tScroll;
      var step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : rail.clientWidth;
      var far = Math.max(40, step * 0.12);
      go(tAt + (moved > far ? 1 : moved < -far ? -1 : 0));
      /* Snap comes back only once the landing has settled. Restored at
         touchend it snaps to whatever is nearest first, which after a long
         drag is several cards away, and the correction reads as a bounce. */
      settle = setTimeout(function () { rail.classList.remove('is-drag'); }, 520);
    }

    rail.addEventListener('touchend', land, { passive: true });
    rail.addEventListener('touchcancel', land, { passive: true });

    rail.addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', function () { queue(); size(); });

    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { go(i); });
    });

    /* A card takes a tab stop, so tabbing to one has to page the rail to it.
       The browser still nudges the page a little to bring the focused card
       fully into view, which is its own behaviour and is left alone. */
    cards.forEach(function (c, i) {
      if (c.tabIndex >= 0) c.addEventListener('focus', function () { go(i); });
    });

    mark();

    return {
      refresh: function () { at = -1; mark(); },
      /* The skills deck only pages on a phone, so its pager has to be able to
         stand down and give the height back rather than be rebuilt. */
      enable: function (on) {
        live = on;
        if (on) { at = -1; mark(); }
        else { rail.style.height = ''; dots.forEach(function (d) { d.classList.remove('is-on'); }); }
      }
    };
  }

  var wrPager = pager(
    document.querySelector('.wr-strip'),
    document.querySelector('.wr-dots'),
    '.wr-c',
    { fit: true }
  );

  /* The skills deck pages on a phone and nowhere else. Above 620px it is two
     columns, which uses the width better than one card at a time would, and on
     the desktop it is the hover deck it has always been. So the pager is built
     once and stood down outside that width rather than rebuilt on every
     resize. 620px is the number the stylesheet already breaks on and the two
     have to move together. */
  var skPager = pager(
    document.querySelector('.skx'),
    document.querySelector('.skx-dots'),
    '.skx-c',
    { fit: true }
  );
  if (skPager) {
    var phone = matchMedia('(max-width:620px)');
    var syncSk = function () { skPager.enable(phone.matches); };
    if (phone.addEventListener) phone.addEventListener('change', syncSk);
    syncSk();
  }

  /* French runs about a third longer, so every card is a different height and
     both rails have to be remeasured. applyLang has no event of its own. */
  window.__wrSize = function () {
    if (wrPager) wrPager.refresh();
    if (skPager) skPager.refresh();
  };

  /*  motion  */

  var hasGsap = window.gsap && window.ScrollTrigger;

  // Without GSAP, or under reduced motion, everything sits in its final state.
  // The page is complete at that point; the motion layer only adds arrival.
  function settle() {
    document.querySelectorAll('.rv').forEach(function (el) {
      el.style.opacity = 1; el.style.transform = 'none';
    });
    document.querySelectorAll('.sec-head .rule, .wide-head .rule').forEach(function (r) {
      r.style.transform = 'none';
    });
  }

  if (!hasGsap || reduce) {
    settle();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* No smooth-scroll library. Lenis was tuned three times and the scroll still
     read as slow, because the honest answer is that any easing between the
     wheel and the page is latency you can feel. Native scroll is the fastest
     the machine can be. */

  /* Hero arrival. The two name lines slide out from behind their own masks;
     everything else is a short stagger under them. */
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.08 });
  intro
    .from('.kicker', { y: 12, opacity: 0, duration: 0.55 })
    /* .name went to the panel and .role became .hero-h in the rebuild. GSAP does
       not throw on a selector that matches nothing, it just silently animates
       nothing, so these were dead lines rather than errors. */
    /* The wrapper, not the image. Tweening the image's opacity leaves GSAP's end
       value pinned inline on it, and that inline value beats --dim in every
       state: he printed and reduced-motion'd at a quarter opacity.
       Opacity only: a scale and a rise is the portrait moving, which is the one
       thing it is now supposed to never do. */
    .from('.fig-base', { opacity: 0, duration: 1 }, 0.06)
    .from('.hero-h', { y: 12, opacity: 0, duration: 0.55 }, 0.2)
    .from('.lede', { y: 14, opacity: 0, duration: 0.6 }, 0.42)
    .from('.hero-act > *', { y: 14, opacity: 0, duration: 0.55, stagger: 0.06 }, 0.48)
    .from('.scroller', { opacity: 0, duration: 0.5 }, 0.62);

  /* No parallax on the portrait. It drifted 9% of its own height against the
     scroll, which was depth for a cutout inside a hero and is just a moving
     photograph now that it is a standing panel. */

  /* The surname behind the contact plate rises slower than the page. */
  if (document.querySelector('.end-mark')) {
    gsap.fromTo('.end-mark', { yPercent: 16 }, {
      yPercent: -6, ease: 'none',
      scrollTrigger: { trigger: '.sec-end', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });
  }

  /* Section arrivals. Short: a reveal you can watch finish is a reveal that is
     holding up the page. */
  ScrollTrigger.batch('.rv', {
    start: 'top 90%',
    onEnter: function (batch) {
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: 'expo.out', overwrite: true });
    }
  });

  /* The four contact icons each play their gesture as the row arrives, one
     after the next. A class rather than a tween: the animation is the same one
     hover uses and it lives in CSS, so there is one definition of what a handset
     or a pin does. Once, because a row that re-fires every time it scrolls past
     is a row that fidgets. */
  /* The strengths. The spine is scrubbed and the steps are not, deliberately: a
     scrubbed colour on the text flickers under a trackpad, and a step is a state
     the reader has arrived at rather than a position they are part way through.
     Once, so scrolling back up does not unlight what has already been read. */
  var spine = document.querySelector('.mt-spine i');
  if (spine) {
    gsap.to(spine, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '.strengths', start: 'top 76%', end: 'bottom 74%', scrub: true }
    });
  }
  /* The signoff fills as the foot of the page arrives. Scrubbed, because this
     one is a position: how far in you are is exactly what it is reporting. */
  var soFill = document.querySelector('.signoff .so-f');
  if (soFill) {
    gsap.to(soFill, {
      clipPath: 'inset(0 0% 0 0)', ease: 'none',
      scrollTrigger: { trigger: '.signoff', start: 'top 92%', end: 'bottom bottom', scrub: true }
    });
  }

  /* Each language's meter draws to its level as the row arrives, one after the
     next. A class rather than a tween, the same as .mt-i above: the animation
     is a CSS transition on the compositor, and this only decides when. Once,
     so scrolling back does not empty and refill them.

     It is created on every screen even though the meter is mobile-only. The
     class is inert where the bar is display:none, and gating it on a width here
     would need re-running on resize. */
  /* Each tool's mark plays its gesture as the grid arrives. Touch only: a
     device with a pointer gets it on hover instead, and the two cannot both
     apply or the hover would never restart the animation. --i is the stagger's
     index, set here rather than written into fourteen CSS rules. */
  var tiles = document.querySelectorAll('.tk-g li');
  tiles.forEach(function (li, i) {
    li.style.setProperty('--i', i);
    ScrollTrigger.create({
      trigger: li, start: 'top 92%', once: true,
      onEnter: function () { li.classList.add('on'); }
    });
  });

  document.querySelectorAll('.lang').forEach(function (li) {
    ScrollTrigger.create({
      trigger: li, start: 'top 88%', once: true,
      onEnter: function () { li.classList.add('on'); }
    });
  });

  document.querySelectorAll('.mt-i').forEach(function (li) {
    ScrollTrigger.create({
      trigger: li, start: 'top 80%', once: true,
      onEnter: function () { li.classList.add('on'); }
    });
  });

  [['.reach', 130], ['.facts', 110]].forEach(function (pair) {
    var row = document.querySelector(pair[0]);
    if (!row) return;
    ScrollTrigger.create({
      trigger: row, start: 'top 88%', once: true,
      onEnter: function () {
        Array.prototype.forEach.call(row.children, function (li, i) {
          setTimeout(function () { li.classList.add('on'); }, 120 + i * pair[1]);
        });
      }
    });
  });

  document.querySelectorAll('.sec-head .rule, .wide-head .rule').forEach(function (r) {
    gsap.to(r, {
      scaleX: 1, duration: 0.7, ease: 'expo.out',
      scrollTrigger: { trigger: r.closest('.sec'), start: 'top 80%' }
    });
  });

  /*  the statements 
     Each is cut into words and their opacity is scrubbed against the scroll, so
     the sentence is read at the pace it is scrolled rather than arriving whole.
     Splitting has to happen after applyLang, which rewrites innerHTML and would
     throw the spans away, and again on every switch. */

  var statements = Array.prototype.slice.call(document.querySelectorAll('.statement'));
  var stTriggers = [];

  function buildStatements() {
    stTriggers.forEach(function (t) { t.kill(); });
    stTriggers.length = 0;

    statements.forEach(function (el) {
      /* Read the text every time, never cached. applyLang has just rewritten
         this element, so a value kept from the first build is the sentence in
         the language you have left. */
      var raw = el.textContent.replace(/\s+/g, ' ').trim();
      el.innerHTML = raw.split(' ').map(function (w) {
        return '<span class="w">' + w + ' </span>';
      }).join('');

      var words = el.querySelectorAll('.w');
      var tw = gsap.fromTo(words, { opacity: 0.16 }, {
        opacity: 1, ease: 'none', stagger: 0.4,
        scrollTrigger: {
          trigger: el,
          start: 'top 82%',
          end: 'bottom 58%',
          scrub: true
        }
      });
      if (tw.scrollTrigger) stTriggers.push(tw.scrollTrigger);
    });
  }

  window.__statements = buildStatements;
  buildStatements();

  /*  the journey 
     A vertical timeline, so nothing is pinned and nothing hijacks the scroll.
     Two things follow the page: the accent line growing down the rule, which is
     a scaleY on one element, and the entry nearest the reading line. */

  var tl = document.querySelector('.tl');
  var fillLine = document.querySelector('.tl-line i');
  var items = Array.prototype.slice.call(document.querySelectorAll('.tl-i'));

  if (tl && fillLine && items.length) {
    var READ = 0.42;                 // the reading line, down the viewport
    var current = -1;

    /* One read pass, then one write pass. Interleaving them is a forced reflow
       per entry per frame, and this runs on every scrolled frame. */
    function trace() {
      var line = window.innerHeight * READ;
      var box = tl.getBoundingClientRect();
      var tops = [];
      for (var i = 0; i < items.length; i++) tops.push(items[i].getBoundingClientRect().top);

      var first = tops[0], last = tops[tops.length - 1];
      var span = last - first;
      var p = span > 0 ? (line - first) / span : (line > first ? 1 : 0);
      fillLine.style.transform = 'scaleY(' + Math.max(0, Math.min(1, p)) + ')';

      var best = 0, bestD = Infinity;
      for (var j = 0; j < tops.length; j++) {
        var d = Math.abs(tops[j] - line);
        if (d < bestD) { bestD = d; best = j; }
      }
      // Nothing is current until the section is actually on screen.
      if (box.bottom < 0 || box.top > window.innerHeight) best = -1;
      if (best !== current) {
        if (current > -1) items[current].classList.remove('on');
        if (best > -1) items[best].classList.add('on');
        current = best;
      }
    }

    var traceQueued = false;
    function onTrace() {
      if (traceQueued) return;
      traceQueued = true;
      requestAnimationFrame(function () { traceQueued = false; trace(); });
    }
    window.addEventListener('scroll', onTrace, { passive: true });
    window.addEventListener('resize', onTrace);
    trace();
  }

  /* Nothing above sets .rv on a section already above the fold when the page
     loads, and ScrollTrigger.batch only fires on entry. */
  ScrollTrigger.refresh();
})();
