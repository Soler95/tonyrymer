/* ============================================================
   TONY RYMER — concerts.js
   Reads the Google Sheet "Calendario" and lists upcoming concerts.
   Sheet columns (row 1 = headers):
     Date | City | Venue | Program | Link   (optional: Time)
   Spanish headers also work: Fecha | Ciudad | Sala | Programa | Enlace | Hora
   Date: DD/MM/YYYY (e.g. 15/11/2026) or YYYY-MM-DD.
   The sheet must be shared as "Anyone with the link – Viewer".
   ============================================================ */
(function () {
  var list = document.getElementById('eventsList');
  if (!list) return;

  var de = (document.documentElement.lang || 'en').indexOf('de') === 0;
  var T = de
    ? { none: 'Neue Termine werden in Kürze bekanntgegeben.', error: 'Der Kalender konnte nicht geladen werden. Bitte versuchen Sie es später erneut.', more: 'Tickets & Info', locale: 'de-DE' }
    : { none: 'New dates will be announced soon.', error: 'The calendar could not be loaded. Please try again later.', more: 'Tickets & Info', locale: 'en-GB' };

  var id = list.getAttribute('data-sheet');
  var url = 'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:csv&gid=0';

  function parseCSV(text) {
    var rows = [], row = [], field = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') q = false;
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function parseDate(s) {
    s = (s || '').trim();
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
    if (m) {
      var y = +m[3]; if (y < 100) y += 2000;
      var a = +m[1], b = +m[2];
      if (b > 12 && a <= 12) { var t = a; a = b; b = t; } // M/D/Y written by a US-locale sheet
      return new Date(y, b - 1, a);
    }
    var d = new Date(s);
    return isNaN(d) ? null : d;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function message(text) {
    list.innerHTML = '';
    list.appendChild(el('p', '', text));
  }

  var KEYS = {
    date: ['fecha', 'date'], time: ['hora', 'time'], city: ['ciudad', 'city'],
    venue: ['sala', 'lugar', 'venue'], program: ['programa', 'program', 'programme'], link: ['enlace', 'link', 'url']
  };

  fetch(url)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (text) {
      var rows = parseCSV(text);
      if (!rows.length) return message(T.none);
      var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
      var col = {};
      Object.keys(KEYS).forEach(function (k) {
        col[k] = head.findIndex(function (h) { return KEYS[k].indexOf(h) !== -1; });
      });
      function get(r, k) { return col[k] >= 0 ? (r[col[k]] || '').trim() : ''; }

      var today = new Date(); today.setHours(0, 0, 0, 0);
      var events = rows.slice(1).map(function (r) {
        return { d: parseDate(get(r, 'date')), time: get(r, 'time'), city: get(r, 'city'),
                 venue: get(r, 'venue'), program: get(r, 'program'), link: get(r, 'link') };
      }).filter(function (e) { return e.d && e.d >= today; })
        .sort(function (a, b) { return a.d - b.d; });

      var limit = parseInt(list.getAttribute('data-limit'), 10);
      if (limit > 0) events = events.slice(0, limit);
      if (!events.length) return message(T.none);
      list.innerHTML = '';
      events.forEach(function (e) {
        var card = el('article', 'event');
        var date = el('div', 'event-date');
        date.appendChild(el('span', 'event-day', ('0' + e.d.getDate()).slice(-2)));
        var month = e.d.toLocaleDateString(T.locale, { month: 'short', year: 'numeric' }).replace('.', '');
        date.appendChild(el('span', 'event-month', month + (e.time ? ' · ' + e.time : '')));
        card.appendChild(date);

        var info = el('div', 'event-info');
        info.appendChild(el('h3', '', e.venue || e.city));
        if (e.venue && e.city) info.appendChild(el('p', '', e.city));
        if (e.program) info.appendChild(el('p', 'event-program', e.program));
        card.appendChild(info);

        if (/^https?:\/\//i.test(e.link)) {
          var a = el('a', 'ticket-btn', T.more);
          a.href = e.link; a.target = '_blank'; a.rel = 'noopener noreferrer';
          card.appendChild(a);
        }
        list.appendChild(card);
      });
    })
    .catch(function () { message(T.error); });
})();
