/* ══════════════════════════════════════════
   TONY RYMER — site.js
   Header · menu · reveals · progress · YouTube consent · contact form
   ══════════════════════════════════════════ */
(function () {
  var de = (document.documentElement.lang || '').indexOf('de') === 0;

  /* Year */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* Header background + progress bar */
  var header = document.getElementById('header');
  var progress = document.querySelector('.scroll-progress');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 60);
    if (progress) {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (total > 0 ? window.scrollY / total * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var nav = document.getElementById('nav');
  var btn = document.getElementById('menuBtn');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    document.body.classList.toggle('nav-open', open);
  }
  if (nav && btn) {
    btn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* Reveal on scroll */
  var items = document.querySelectorAll('[data-animate]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('visible'); });
  }

  /* YouTube: only loaded after consent or a click on "Play" */
  function getConsent() { try { return localStorage.getItem('cookies'); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem('cookies', v); } catch (e) {} }
  function loadVideo(frame, autoplay) {
    var id = frame.getAttribute('data-video');
    if (!id) return;
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + (autoplay ? '?autoplay=1' : '');
    iframe.title = frame.getAttribute('data-title') || 'Video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    frame.innerHTML = '';
    frame.style.backgroundImage = 'none';
    frame.appendChild(iframe);
    frame.removeAttribute('data-video');
  }
  function loadAll() { document.querySelectorAll('[data-video]').forEach(function (f) { loadVideo(f, false); }); }
  document.querySelectorAll('[data-video] .video-consent').forEach(function (b) {
    b.addEventListener('click', function () { loadVideo(b.parentElement, true); });
  });

  var banner = document.getElementById('cookieBanner');
  window.acceptCookies = function () { setConsent('accepted'); if (banner) banner.style.display = 'none'; loadAll(); };
  window.rejectCookies = function () { setConsent('rejected'); if (banner) banner.style.display = 'none'; };
  document.querySelectorAll('[data-cookie-reset]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); try { localStorage.removeItem('cookies'); } catch (err) {} window.location.reload(); });
  });
  var consent = getConsent();
  if (consent === 'accepted') loadAll();
  else if (!consent && banner && document.querySelector('[data-video]')) banner.style.display = 'flex';

  /* Contact form — Web3Forms */
  var form = document.getElementById('contactForm');
  if (form) {
    var T = de
      ? ['Wird gesendet …', 'Vielen Dank – Ihre Nachricht wurde gesendet.', 'Etwas ist schiefgelaufen. Bitte versuchen Sie es später erneut.', 'Netzwerkfehler. Bitte versuchen Sie es später erneut.']
      : ['Sending…', 'Thank you — your message has been sent.', 'Something went wrong. Please try again later.', 'Network error. Please try again later.'];
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('formStatus');
      var send = document.getElementById('sendBtn');
      status.textContent = T[0];
      send.disabled = true;
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (d) { status.textContent = d.success ? T[1] : T[2]; if (d.success) form.reset(); })
        .catch(function () { status.textContent = T[3]; })
        .then(function () { send.disabled = false; });
    });
  }
})();
