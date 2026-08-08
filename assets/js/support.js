/* ===========================================================================
   Bonneville IT — Support Portal application.
   Employee ticket intake with instant AI triage, live SLA countdowns, and a
   technician queue for Jeff. Fully localised via i18n.js.

   Storage is localStorage only. See INTEGRATIONS.md for what must be wired
   before this is a real helpdesk.
   =========================================================================== */
(function () {
  'use strict';

  var T = function (k) { return window.I18N.t(k); };
  var LS = { role: 'bon_role', tickets: 'bon_tickets', read: 'bon_read' };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------- SLA targets */
  /* Deliberately tight. These are the numbers the portal promises and the
     numbers the countdown is measured against. */
  var SLA = {
    P1: { respMin: 15,  resolveHr: 4,  key: 'p1' },
    P2: { respMin: 30,  resolveHr: 8,  key: 'p2' },
    P3: { respMin: 60,  resolveHr: 24, key: 'p3' },
    P4: { respMin: 240, resolveHr: 72, key: 'p4' }
  };
  function respLabel(p) {
    var m = SLA[p].respMin;
    return m < 60 ? m + ' ' + T('min') : (m / 60) + ' ' + (m / 60 === 1 ? T('hr') : T('hrs'));
  }

  /* ------------------------------------------------------------- accounts */
  var ROLES = {
    employee: { kind: 'employee', name: 'Ana Ferreira', title: 'Financial Accountant',
                company: 'Solen — Lisbon', email: 'a.ferreira@solen.example', tz: 'Europe/Lisbon' },
    tech:     { kind: 'tech', name: 'Jeff Gardner', title: 'President, Bonneville IT',
                company: 'Bonneville IT', email: 'jeff@bonnevilleit.example', tz: 'America/Denver' }
  };

  var state = { role: null, route: 'dash', openTicket: null };
  try { state.role = localStorage.getItem(LS.role); } catch (e) {}
  if (!ROLES[state.role]) state.role = null;

  var app = document.getElementById('sup');
  var LOGO = window.BON_LOGO || '';

  /* ---------------------------------------------------------- persistence */
  function get(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Seeded tickets so the queue is never empty on first load.
     ILLUSTRATIVE — see CONTENT-TODO in README.md. */
  function seed() {
    var now = Date.now();
    return [
      { id: 'BON-2041', subject: 'Outlook keeps asking for my password', detail: 'It prompts every 20 minutes and rejects the right password twice before accepting it.',
        cat: 'cat.email', pri: 'P2', status: 'prog', by: 'Ana Ferreira', co: 'Solen — Lisbon',
        created: now - 41 * 60000, responded: now - 24 * 60000,
        thread: [{ who: 'ai', at: now - 41 * 60000 + 4000, body: 'This pattern usually means a stale cached credential after a password change, not a wrong password.' },
                 { who: 'tech', at: now - 24 * 60000, body: 'Looking at it now — I can see the token failing on our side. Clearing the cached credential remotely, give me ten minutes.' }] },
      { id: 'BON-2040', subject: 'Cannot reach the file share from home', detail: 'VPN connects but the mapped drive is not there.',
        cat: 'cat.network', pri: 'P3', status: 'open', by: 'Carter Chytraus', co: 'Solen — Salt Lake City',
        created: now - 12 * 60000, responded: null,
        thread: [{ who: 'ai', at: now - 12 * 60000 + 3000, body: 'The VPN tunnel and the drive mapping are separate steps. The mapping often does not survive a reboot.' }] },
      { id: 'BON-2038', subject: 'Suspicious invoice email from a supplier', detail: 'Looks like our supplier but the bank details changed. I have not replied.',
        cat: 'cat.security', pri: 'P1', status: 'res', by: 'Ana Ferreira', co: 'Solen — Lisbon',
        created: now - 3 * 3600000, responded: now - 3 * 3600000 + 6 * 60000,
        thread: [{ who: 'ai', at: now - 3 * 3600000 + 5000, body: 'Do not reply and do not action the payment. Changed bank details on a familiar invoice is the signature of supplier invoice fraud.' },
                 { who: 'tech', at: now - 3 * 3600000 + 6 * 60000, body: 'Confirmed spoofed sender domain. Blocked at the gateway, alerted the finance team, and reported it. Nothing was paid. Well caught.' }] },
      { id: 'BON-2035', subject: 'New starter needs a laptop in Toronto', detail: 'Starts Monday, fully remote.',
        cat: 'cat.hardware', pri: 'P4', status: 'prog', by: 'Bruna Silva', co: 'Solen — Lisbon',
        created: now - 26 * 3600000, responded: now - 25 * 3600000,
        thread: [{ who: 'tech', at: now - 25 * 3600000, body: 'Ordered, imaged and shipping direct to the address you gave. Tracking on Friday.' }] }
    ];
  }
  var tickets = get(LS.tickets, null);
  if (!tickets) { tickets = seed(); set(LS.tickets, tickets); }

  /* --------------------------------------------------------- AI triage ---
     Rules-based, running locally. This is deliberate: it is fast, works
     offline, and never invents an answer it cannot support. INTEGRATIONS.md
     documents exactly where a hosted model would replace it. */
  var RULES = [
    { id: 'security', pri: 'P1', cat: 'cat.security',
      re: /phish|suspicious|scam|fraud|ransom|malware|virus|hacked|breach|stolen|bank details|wire|gift card|encrypt/i,
      read: 'This looks security-related, so it goes to the front of the queue automatically.',
      steps: ['Do not reply, click anything, or action any payment or bank-detail change.',
              'Leave the message in place — do not delete it. We need it to trace the sender.',
              'If you already clicked or entered credentials, say so in a reply now. Nobody is in trouble; it just changes what we do next.',
              'Disconnect from the network only if you are being asked to and we tell you to.'] },
    { id: 'down', pri: 'P1', cat: 'cat.network',
      re: /everything is down|all down|nothing works|whole office|entire team|no one can|outage|can't work at all/i,
      read: 'This reads as a multi-person outage rather than a single-user fault.',
      steps: ['Tell us roughly how many people are affected and in which office.',
              'Check whether it affects both Wi-Fi and wired connections.',
              'If you can reach any website at all, note which ones.'] },
    { id: 'password', pri: 'P2', cat: 'cat.access',
      re: /password|passcode|locked out|can'?t log ?in|cannot log ?in|sign ?in|mfa|2fa|authenticat|token|expired/i,
      read: 'Access problems are usually a stale cached credential or an expired multi-factor token, not a forgotten password.',
      steps: ['Sign out fully, then close and reopen the application rather than just retrying.',
              'On a phone authenticator, check the device clock is set to automatic — a drifted clock silently breaks codes.',
              'If you changed your password recently, restart the machine once; cached credentials often survive until a reboot.'] },
    { id: 'email', pri: 'P3', cat: 'cat.email',
      re: /outlook|email|e-?mail|mailbox|inbox|smtp|send.*mail|receiv.*mail|spam|bounce/i,
      read: 'Email issues split cleanly into delivery problems and client problems, and they are fixed differently.',
      steps: ['Open your mail in a browser. If it works there, the problem is the desktop app, not the mail service.',
              'Note whether it affects sending, receiving, or both.',
              'If a message bounced, keep the bounce notice — the wording tells us exactly what failed.'] },
    { id: 'vpn', pri: 'P2', cat: 'cat.network',
      re: /vpn|remote access|can'?t connect|cannot connect|wi-?fi|wifi|network|internet|offline|drive|file share|shared folder/i,
      read: 'Connectivity problems are usually the link, the tunnel, or the mapping — and it helps to know which.',
      steps: ['Confirm you have general internet access by loading any public website.',
              'Disconnect and reconnect the VPN once rather than retrying repeatedly.',
              'If a mapped drive is missing, note the exact drive letter — mappings often do not survive a reboot.'] },
    { id: 'slow', pri: 'P3', cat: 'cat.hardware',
      re: /slow|freez|hang|lag|crash|not responding|spinning|fan|hot|battery/i,
      read: 'Slowness has a lot of possible causes, so the first job is narrowing it to the machine or the network.',
      steps: ['Note whether everything is slow or only one application.',
              'Restart once if you have not today — uptime of several weeks is a common cause.',
              'Tell us roughly when it started and whether anything changed just before.'] },
    { id: 'printer', pri: 'P4', cat: 'cat.hardware',
      re: /print|scanner|scan|copier|toner|paper jam/i,
      read: 'Printing faults are usually the queue or the driver rather than the hardware.',
      steps: ['Check the device is on and shows no error on its own display.',
              'Cancel everything in the print queue, then send one test page.',
              'Note the printer name or location so we target the right device.'] },
    { id: 'phone', pri: 'P3', cat: 'cat.phone',
      re: /phone|voip|call|dial|headset|voicemail|extension/i,
      read: 'Voice issues are usually the handset registration or the audio device, not the line.',
      steps: ['Note whether it affects incoming calls, outgoing, or audio quality.',
              'If using a softphone, check the correct headset is selected as input and output.',
              'Tell us your extension number.'] },
    { id: 'software', pri: 'P3', cat: 'cat.software',
      re: /install|licen[cs]e|update|version|app|application|software|excel|word|teams|error message/i,
      read: 'Application faults are usually a version, a licence, or a permission — the error text tells us which.',
      steps: ['Copy the exact error message, word for word, into a reply.',
              'Note whether it worked before and roughly when it last did.',
              'Confirm whether anyone else using the same application sees it too.'] }
  ];

  function triage(subject, detail) {
    var hay = (subject + ' ' + detail).toLowerCase();
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(hay)) return RULES[i];
    }
    return { id: 'generic', pri: 'P3', cat: 'cat.other',
      read: 'We have logged this and an engineer will read it in full.',
      steps: ['Add anything else you remember — an exact error message helps most.',
              'Tell us whether anyone else is affected.',
              'Let us know if it is stopping you working entirely.'] };
  }

  /* --------------------------------------------------------------- timing */
  function respondBy(t) { return t.created + SLA[t.pri].respMin * 60000; }
  function slaState(t) {
    if (t.responded || t.status === 'res') return { done: true, pct: 1 };
    var total = SLA[t.pri].respMin * 60000;
    var left = respondBy(t) - Date.now();
    return { done: false, left: left, breached: left <= 0, pct: Math.max(0, Math.min(1, 1 - left / total)) };
  }
  function fmtLeft(ms) {
    if (ms <= 0) return '00:00';
    var s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
    if (h > 0) return h + 'h ' + String(m % 60).padStart(2, '0') + 'm';
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  function clock(ts, tz) {
    return new Intl.DateTimeFormat(window.I18N.get(), {
      timeZone: tz || undefined, hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date(ts));
  }
  function when(ts) {
    var d = Date.now() - ts, m = Math.round(d / 60000);
    if (m < 1) return 'now';
    if (m < 60) return m + 'm';
    var h = Math.round(m / 60);
    if (h < 24) return h + 'h';
    return Math.round(h / 24) + 'd';
  }

  /* ---------------------------------------------------------------- parts */
  function pulseArt() {
    var nodes = [[100, 30], [162, 68], [162, 142], [100, 180], [38, 142], [38, 68]];
    return '<div class="pulse-art"><svg viewBox="0 0 200 200" role="img" aria-label="Bonneville IT monitoring">' +
      '<circle class="pring" cx="100" cy="100" r="26" fill="none" stroke="var(--neon)"/>' +
      '<circle class="pring" cx="100" cy="100" r="26" fill="none" stroke="var(--neon)"/>' +
      '<circle class="pring" cx="100" cy="100" r="26" fill="none" stroke="var(--cyan)"/>' +
      nodes.map(function (n) {
        return '<line class="spoke" x1="100" y1="100" x2="' + n[0] + '" y2="' + n[1] + '" stroke="var(--edge-lit)" stroke-width="1"/>';
      }).join('') +
      '<g class="scan"><line x1="100" y1="100" x2="100" y2="22" stroke="var(--cyan)" stroke-width="1.4" opacity=".65"/></g>' +
      nodes.map(function (n) {
        return '<circle class="node" cx="' + n[0] + '" cy="' + n[1] + '" r="4" fill="var(--neon-lit)"/>';
      }).join('') +
      '<circle class="core" cx="100" cy="100" r="17" fill="var(--neon)" opacity=".9"/>' +
      '<circle cx="100" cy="100" r="17" fill="none" stroke="var(--cyan)" stroke-width="1.2" opacity=".8"/>' +
      '<path d="M94 100l4.5 4.5L108 95" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></div>';
  }

  function langMenu() {
    var cur = window.I18N.get();
    var me = window.I18N.langs.filter(function (l) { return l.code === cur; })[0] || window.I18N.langs[0];
    return '<div class="lang"><button class="lang-btn" id="langBtn" aria-haspopup="true" aria-expanded="false">' +
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/></svg>' +
      esc(me.native) + '</button><div class="lang-menu" id="langMenu">' +
      window.I18N.langs.map(function (l) {
        return '<button data-lang="' + l.code + '" class="' + (l.code === cur ? 'on' : '') + '">' +
          esc(l.native) + '<span class="fl">' + esc(l.region) + '</span></button>';
      }).join('') + '</div></div>';
  }

  /* ---------------------------------------------------------------- login */
  function renderLogin() {
    app.innerHTML =
      '<div class="aurora"></div><div class="grid-bg"></div>' +
      '<div class="stage login-wrap">' +
      '<div class="login-art">' +
      '<img class="bon-logo lg" src="' + LOGO + '" alt="Bonneville IT">' +
      '<h1>' + esc(T('login.h1a')) + ' <em>' + esc(T('login.h1b')) + '</em></h1>' +
      '<p>' + esc(T('login.blurb')) + '</p>' +
      '<div style="font-family:var(--mono);font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--txt-faint);margin-bottom:10px">' +
      esc(T('login.targets')) + '</div>' +
      '<div class="sla-strip">' +
      ['P1', 'P2', 'P3', 'P4'].map(function (p, i) {
        return '<div class="sla-chip c' + (i + 1) + '"><div class="k">' + esc(T(SLA[p].key)) + '</div>' +
          '<div class="v">' + esc(respLabel(p)) + '</div></div>';
      }).join('') + '</div>' +
      '<div style="margin-top:34px">' + pulseArt() + '</div>' +
      '</div>' +
      '<div class="login-form"><div class="login-card">' +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:22px">' + langMenu() + '</div>' +
      '<h2>' + esc(T('login.signin')) + '</h2><p class="sub">' + esc(T('login.sub')) + '</p>' +
      '<div class="role-pick">' +
      '<button class="role-card emp" data-role="employee"><span class="ic">&#128100;</span>' +
      '<span><b>' + esc(T('login.emp')) + '</b><span>' + esc(T('login.empDesc')) + '</span></span></button>' +
      '<button class="role-card tech" data-role="tech"><span class="ic">&#128737;</span>' +
      '<span><b>' + esc(T('login.tech')) + '</b><span>' + esc(T('login.techDesc')) + '</span></span></button>' +
      '</div>' +
      '<p style="font-size:12.5px;color:var(--txt-faint);border-top:1px solid var(--edge);padding-top:16px">' +
      esc(T('login.demo')) + '</p>' +
      '<p style="font-size:12.5px;color:var(--txt-faint);margin-top:14px">' +
      '<a href="index.html">&#8592; Solen Software Group</a></p>' +
      '</div></div></div>';

    app.querySelectorAll('[data-role]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.role = b.dataset.role;
        set(LS.role, state.role);
        try { localStorage.setItem(LS.role, JSON.stringify(state.role)); } catch (e) {}
        state.route = 'dash';
        location.hash = '#/dash';
        render();
      });
    });
    bindLang();
  }

  /* ---------------------------------------------------------------- shell */
  function nav() {
    var isTech = state.role === 'tech';
    var mine = tickets.filter(function (t) { return isTech || t.by === ROLES.employee.name; });
    var openCount = tickets.filter(function (t) { return t.status !== 'res'; }).length;
    var items = isTech
      ? [['dash', T('nav.dash'), ''], ['queue', T('nav.queue'), openCount], ['help', T('nav.help'), '']]
      : [['dash', T('nav.dash'), ''], ['new', T('nav.new'), ''],
         ['mine', T('nav.mine'), mine.filter(function (t) { return t.status !== 'res'; }).length],
         ['help', T('nav.help'), '']];
    return items.map(function (i) {
      return '<a href="#/' + i[0] + '" class="' + (state.route === i[0] ? 'on' : '') + '">' + esc(i[1]) +
        (i[2] !== '' && i[2] > 0 ? '<span class="cnt">' + i[2] + '</span>' : '') + '</a>';
    }).join('');
  }

  function notifications() {
    var read = get(LS.read, []);
    var items = tickets.filter(function (t) { return t.status !== 'res'; }).map(function (t) {
      var s = slaState(t);
      return { id: t.id, html: '<b>' + esc(t.id) + '</b> — ' + esc(t.subject),
        sub: s.done ? T('st.prog') : (s.breached ? T('sla.breached') : fmtLeft(s.left) + ' ' + T('sla.remaining')),
        read: read.indexOf(t.id) > -1 };
    });
    return items;
  }

  function shell(title, body) {
    var me = ROLES[state.role];
    var un = notifications().filter(function (n) { return !n.read; }).length;
    return '<div class="aurora"></div><div class="grid-bg"></div><div class="stage shell">' +
      '<aside class="side"><div class="side-top">' +
      '<img class="bon-logo" src="' + LOGO + '" alt="Bonneville IT">' +
      '<div style="font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--txt-faint);margin-top:9px">' +
      esc(T('portal')) + '</div></div>' +
      '<nav class="side-nav"><div class="grp">' + esc(T('nav.group')) + '</div>' + nav() + '</nav>' +
      '<div class="side-foot"><div class="who">' + esc(me.name) + '</div>' +
      '<div class="rol">' + esc(me.kind === 'tech' ? T('login.tech') : T('login.emp')) + '</div>' +
      '<button id="out">' + esc(T('signout')) + '</button></div></aside>' +
      '<div class="main"><header class="top"><h1>' + esc(title) + '</h1><div class="sp"></div>' +
      '<div class="live"><i></i>' + esc(T('live')) + '</div>' + langMenu() +
      '<button class="bell" id="bell" aria-label="' + esc(T('notif')) + '">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>' +
      (un ? '<span class="bdg">' + un + '</span>' : '') + '</button></header>' +
      '<div class="notif" id="notif"><h4>' + esc(T('notif')) + '</h4>' +
      (notifications().length ? notifications().map(function (n) {
        return '<div class="it' + (n.read ? '' : ' un') + '">' + n.html + '<div class="t">' + esc(n.sub) + '</div></div>';
      }).join('') : '<div class="it">' + esc(T('notif.none')) + '</div>') + '</div>' +
      '<div class="content">' + body + '</div></div></div>' +
      '<div class="toast" id="toast"></div>';
  }

  /* ------------------------------------------------------------ dashboard */
  function ringSvg(pct, colour, label) {
    var c = 2 * Math.PI * 22;
    return '<div class="ring"><svg width="56" height="56">' +
      '<circle cx="28" cy="28" r="22" fill="none" stroke="var(--edge-2)" stroke-width="4"/>' +
      '<circle cx="28" cy="28" r="22" fill="none" stroke="' + colour + '" stroke-width="4" stroke-linecap="round" ' +
      'stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - pct)) + '"/></svg>' +
      '<span class="val" style="color:' + colour + '">' + esc(label) + '</span></div>';
  }

  function viewDash() {
    var isTech = state.role === 'tech';
    var me = ROLES[state.role];
    var visible = isTech ? tickets : tickets.filter(function (t) { return t.by === ROLES.employee.name; });
    var open = tickets.filter(function (t) { return t.status !== 'res'; });
    var atRisk = open.filter(function (t) { var s = slaState(t); return !s.done && s.left < 10 * 60000; }).length;

    var kpis = isTech
      ? '<div class="kpi"><div class="n">' + open.length + '</div><div class="l">' + esc(T('k.open')) + '</div></div>' +
        '<div class="kpi"><div class="n ' + (atRisk ? 'hot' : 'good') + '">' + atRisk + '</div><div class="l">' + esc(T('k.breach')) + '</div></div>' +
        '<div class="kpi"><div class="n good">6m</div><div class="l">' + esc(T('k.resp')) + '</div></div>' +
        '<div class="kpi"><div class="n">3</div><div class="l">' + esc(T('k.today')) + '</div></div>'
      : '<div class="kpi"><div class="n">' + visible.filter(function (t) { return t.status !== 'res'; }).length + '</div><div class="l">' + esc(T('k.open')) + '</div></div>' +
        '<div class="kpi"><div class="n good">6m</div><div class="l">' + esc(T('k.resp')) + '</div></div>' +
        '<div class="kpi"><div class="n good">98%</div><div class="l">' + esc(T('k.sat')) + '</div></div>';

    return shell(T('nav.dash'),
      '<div class="card glow"><h2>' + esc(T('d.h')) + ', ' + esc(me.name.split(' ')[0]) + '.</h2>' +
      '<p class="sub">' + esc(T('d.sub')) + ' &middot; ' + esc(me.company) + ' &middot; <span class="mono">' + clock(Date.now(), me.tz) + '</span></p>' +
      '<div class="grid g4">' + kpis + '</div></div>' +

      (isTech ? '' :
        '<div class="card"><h2>' + esc(T('d.quick')) + '</h2><div class="grid g3" style="margin-top:14px">' +
        '<a class="tile" href="#/new" style="display:block;padding:18px 20px;border:1px solid var(--edge);border-radius:11px;background:rgba(255,255,255,.025)">' +
        '<b style="display:block;font-size:15px;margin-bottom:5px">' + esc(T('d.qNew')) + '</b>' +
        '<span style="font-size:13px;color:var(--txt-dim)">' + esc(T('d.qNewD')) + '</span></a>' +
        '<a class="tile" href="#/mine" style="display:block;padding:18px 20px;border:1px solid var(--edge);border-radius:11px;background:rgba(255,255,255,.025)">' +
        '<b style="display:block;font-size:15px;margin-bottom:5px">' + esc(T('d.qMine')) + '</b>' +
        '<span style="font-size:13px;color:var(--txt-dim)">' + esc(T('d.qMineD')) + '</span></a>' +
        '<a class="tile" href="tel:8017739777" style="display:block;padding:18px 20px;border:1px solid var(--edge);border-radius:11px;background:rgba(255,255,255,.025)">' +
        '<b style="display:block;font-size:15px;margin-bottom:5px">' + esc(T('d.qCall')) + ' &middot; 801-773-9777</b>' +
        '<span style="font-size:13px;color:var(--txt-dim)">' + esc(T('d.qCallD')) + '</span></a>' +
        '</div></div>') +

      '<div class="card"><h2>' + esc(T('d.recent')) + '</h2><p class="sub">' +
      esc(isTech ? T('q.sub') : T('mine.sub')) + '</p>' +
      (visible.length ? visible.slice(0, 4).map(ticketRow).join('') : '<div class="empty">' + esc(T('mine.none')) + '</div>') +
      '</div>');
  }

  /* ------------------------------------------------------------- ticket UI */
  function ticketRow(t) {
    var s = slaState(t);
    var sla = s.done
      ? '<span class="pill res">' + esc(T('st.res')) + '</span>'
      : (s.breached ? '<span class="pill breach">' + esc(T('sla.breached')) + '</span>'
        : '<span class="mono" style="color:' + (s.left < 10 * 60000 ? 'var(--p1)' : 'var(--txt-dim)') + '">' +
          fmtLeft(s.left) + ' ' + esc(T('sla.remaining')) + '</span>');
    return '<div class="tk" data-open="' + esc(t.id) + '">' +
      '<div class="tk-top"><span class="pill ' + t.pri + '">' + esc(T(SLA[t.pri].key)) + '</span>' +
      '<span class="pill ' + t.status + '">' + esc(T(t.status === 'open' ? 'st.open' : t.status === 'prog' ? 'st.prog' : 'st.res')) + '</span>' +
      '<span class="tk-id">' + esc(t.id) + '</span></div>' +
      '<h4>' + esc(t.subject) + '</h4>' +
      '<p>' + esc(t.detail.slice(0, 130)) + (t.detail.length > 130 ? '…' : '') + '</p>' +
      '<div class="tk-foot"><span><b>' + esc(t.by) + '</b> &middot; ' + esc(t.co) + '</span>' +
      '<span>' + esc(T(t.cat)) + '</span><span>' + when(t.created) + '</span>' +
      '<span style="margin-left:auto">' + sla + '</span></div></div>';
  }

  function viewList(techMode) {
    var list = techMode ? tickets : tickets.filter(function (t) { return t.by === ROLES.employee.name; });
    list = list.slice().sort(function (a, b) { return b.created - a.created; });
    return shell(techMode ? T('q.h') : T('mine.h'),
      '<div class="card"><h2>' + esc(techMode ? T('q.h') : T('mine.h')) + '</h2>' +
      '<p class="sub">' + esc(techMode ? T('q.sub') : T('mine.sub')) + '</p>' +
      '<div class="filters" id="filt">' +
      ['all', 'open', 'prog', 'res'].map(function (f, i) {
        return '<button class="ft' + (i === 0 ? ' on' : '') + '" data-f="' + f + '">' +
          esc(f === 'all' ? T('filter.all') : T(f === 'open' ? 'st.open' : f === 'prog' ? 'st.prog' : 'st.res')) + '</button>';
      }).join('') + '</div>' +
      (list.length ? '<div id="rows">' + list.map(ticketRow).join('') + '</div>'
        : '<div class="empty">' + esc(techMode ? T('q.none') : T('mine.none')) + '</div>') +
      '</div>');
  }

  function viewTicket(id) {
    var t = tickets.filter(function (x) { return x.id === id; })[0];
    if (!t) { location.hash = '#/dash'; return ''; }
    var s = slaState(t);
    var col = s.done ? 'var(--ok)' : (s.breached ? 'var(--p1)' : 'var(--neon-lit)');
    return shell(t.id,
      '<div style="margin-bottom:16px"><button class="b b-ghost b-sm" id="back">&#8592; ' + esc(T('btn.back')) + '</button></div>' +
      '<div class="card glow"><div class="tk-top" style="margin-bottom:12px">' +
      '<span class="pill ' + t.pri + '">' + esc(T(SLA[t.pri].key)) + '</span>' +
      '<span class="pill ' + t.status + '">' + esc(T(t.status === 'open' ? 'st.open' : t.status === 'prog' ? 'st.prog' : 'st.res')) + '</span>' +
      '<span class="tk-id">' + esc(t.id) + '</span></div>' +
      '<h2 style="font-size:22px">' + esc(t.subject) + '</h2>' +
      '<p class="sub">' + esc(T('raised')) + ' ' + when(t.created) + ' ' + esc(T('by')) + ' <b>' + esc(t.by) + '</b> &middot; ' +
      esc(t.co) + ' &middot; ' + esc(T('cat')) + ': ' + esc(T(t.cat)) + '</p>' +
      '<p style="font-size:15px;color:var(--txt);line-height:1.65">' + esc(t.detail) + '</p>' +
      '<div class="sla-box">' +
      ringSvg(s.done ? 1 : s.pct, col, s.done ? '&#10003;' : (s.breached ? '!' : fmtLeft(s.left).split(' ')[0])) +
      '<div class="txt"><b>' + esc(s.done ? T('st.prog') : (s.breached ? T('sla.breached') : T('sla.respBy') + ' ' + clock(respondBy(t)))) + '</b>' +
      '<span>' + esc(T(SLA[t.pri].key)) + ' &middot; ' + esc(respLabel(t.pri)) + ' ' + esc(T('resp')) + '</span></div></div>' +
      '</div>' +
      '<div class="card"><h2>' + esc(T('thread')) + '</h2><div style="margin-top:16px">' +
      t.thread.map(function (m) {
        var who = m.who === 'ai' ? T('ai.who') : m.who === 'tech' ? T('tech.who') : T('you');
        return '<div class="thread-msg ' + (m.who === 'ai' ? 'ai-msg' : m.who === 'tech' ? 'tech-msg' : '') + '">' +
          '<div class="who">' + esc(who) + '</div><div class="when">' + when(m.at) + '</div>' +
          '<div class="body">' + esc(m.body) + '</div></div>';
      }).join('') + '</div>' +
      (t.status !== 'res' ? '<div class="f" style="margin-top:20px"><label for="rep">' + esc(T('btn.reply')) + '</label>' +
        '<textarea id="rep" style="min-height:88px"></textarea></div>' +
        '<button class="b b-neon b-sm" id="sendRep">' + esc(T('btn.send')) + '</button>' : '') +
      '</div>');
  }

  /* ------------------------------------------------------------ new ticket */
  var draft = { pri: 'P3' };
  function viewNew() {
    return shell(T('nav.new'),
      '<div class="card glow"><h2>' + esc(T('new.h')) + '</h2><p class="sub">' + esc(T('new.sub')) + '</p>' +
      '<div class="f" id="f-sub"><label for="sub">' + esc(T('f.subject')) + '</label>' +
      '<input type="text" id="sub" placeholder="' + esc(T('f.subjectPh')) + '"><div class="err">' + esc(T('f.req')) + '</div></div>' +
      '<div class="f" id="f-det"><label for="det">' + esc(T('f.detail')) + '</label>' +
      '<textarea id="det" placeholder="' + esc(T('f.detailPh')) + '"></textarea><div class="err">' + esc(T('f.req')) + '</div></div>' +
      '<div class="f"><label>' + esc(T('f.pri')) + '</label><div class="pri-pick" id="pri">' +
      ['P1', 'P2', 'P3', 'P4'].map(function (p) {
        return '<button class="pri' + (draft.pri === p ? ' on' : '') + '" data-p="' + p + '">' +
          '<b>' + esc(T(SLA[p].key)) + '</b><span>' + esc(T(SLA[p].key + 'd')) + '</span>' +
          '<span style="color:var(--txt-dim);margin-top:6px">' + esc(respLabel(p)) + ' ' + esc(T('resp')) + '</span></button>';
      }).join('') + '</div></div>' +
      '<button class="b b-neon" id="go">' + esc(T('btn.submit')) + '</button>' +
      '<div id="aiBox"></div></div>');
  }

  function runTriage(subject, detail, priChosen) {
    var box = document.getElementById('aiBox');
    box.innerHTML = '<div class="ai"><div class="ai-h"><span class="ai-dot">&#9670;</span>' +
      '<b>' + esc(T('ai.title')) + '</b><span class="tag">' + esc(T('ai.tag')) + '</span></div>' +
      '<p class="typing">' + esc(T('ai.thinking')) + ' <span></span><span></span><span></span></p></div>';
    box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });

    setTimeout(function () {
      var r = triage(subject, detail);
      // The user's own urgency wins if they rated it higher than the rules did.
      var order = { P1: 0, P2: 1, P3: 2, P4: 3 };
      var pri = order[priChosen] < order[r.pri] ? priChosen : r.pri;

      var t = {
        id: 'BON-' + (2042 + tickets.filter(function (x) { return /^BON-20/.test(x.id); }).length),
        subject: subject, detail: detail, cat: r.cat, pri: pri, status: 'open',
        by: ROLES.employee.name, co: ROLES.employee.company,
        created: Date.now(), responded: null,
        thread: [{ who: 'ai', at: Date.now(), body: r.read }]
      };
      tickets.unshift(t);
      set(LS.tickets, tickets);

      box.innerHTML = '<div class="ai"><div class="ai-h"><span class="ai-dot">&#9670;</span>' +
        '<b>' + esc(T('ai.title')) + '</b><span class="tag">' + esc(T('ai.tag')) + '</span></div>' +
        '<p><b>' + esc(T('ai.triaged')) + ' ' + esc(T(SLA[pri].key)) + '.</b> ' + esc(r.read) + '</p>' +
        '<p style="color:var(--txt-dim);font-size:14px">' + esc(T('ai.try')) + '</p>' +
        '<ol>' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
        '<div class="sla-box" style="margin-top:4px">' +
        ringSvg(0.03, 'var(--neon-lit)', fmtLeft(SLA[pri].respMin * 60000).split(' ')[0]) +
        '<div class="txt"><b>' + esc(T('sla.started')) + '</b><span>' + esc(T('sla.respBy')) + ' ' +
        clock(Date.now() + SLA[pri].respMin * 60000) + '</span></div></div>' +
        '<p class="caveat">' + esc(T('ai.caveat')) + '</p>' +
        '<div style="display:flex;gap:9px;margin-top:14px;flex-wrap:wrap">' +
        '<button class="b b-neon b-sm" data-goto="' + esc(t.id) + '">' + esc(T('btn.view')) + '</button>' +
        '<button class="b b-ghost b-sm" id="again">' + esc(T('btn.another')) + '</button></div></div>';

      box.querySelector('[data-goto]').addEventListener('click', function () {
        state.openTicket = t.id; location.hash = '#/t/' + t.id;
      });
      box.querySelector('#again').addEventListener('click', function () { render(); });

      toast(T('toast.sent'), T('toast.sentSub'));
      document.getElementById('go').disabled = true;
    }, reduced ? 60 : 1100);
  }

  function toast(title, sub) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = '<b>' + esc(title) + '</b><span>' + esc(sub) + '</span>';
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 5200);
  }

  /* ----------------------------------------------------------------- help */
  function viewHelp() {
    var items = RULES.filter(function (r) {
      return ['password', 'vpn', 'email', 'slow', 'security'].indexOf(r.id) > -1;
    });
    return shell(T('nav.help'),
      '<div class="card"><h2>' + esc(T('help.h')) + '</h2><p class="sub">' + esc(T('help.sub')) + '</p></div>' +
      items.map(function (r) {
        return '<div class="card"><h2 style="font-size:16.5px">' + esc(T(r.cat)) + '</h2>' +
          '<p style="font-size:14.5px;color:var(--txt);margin:6px 0 12px">' + esc(r.read) + '</p>' +
          '<ol style="font-size:14.5px;color:var(--txt-dim);padding-left:20px;margin:0">' +
          r.steps.map(function (s) { return '<li style="margin-bottom:7px">' + esc(s) + '</li>'; }).join('') +
          '</ol></div>';
      }).join(''));
  }

  /* ---------------------------------------------------------------- router */
  function render() {
    if (!state.role) { renderLogin(); return; }
    var h = (location.hash || '#/dash').replace('#/', '');
    var out;
    if (h.indexOf('t/') === 0) { state.route = 'mine'; out = viewTicket(h.slice(2)); }
    else {
      if (['dash', 'new', 'mine', 'queue', 'help'].indexOf(h) < 0) h = 'dash';
      // employees have no queue; technicians have no personal intake form
      if (state.role === 'employee' && h === 'queue') h = 'dash';
      if (state.role === 'tech' && (h === 'new' || h === 'mine')) h = 'queue';
      state.route = h;
      out = h === 'dash' ? viewDash()
        : h === 'new' ? viewNew()
        : h === 'mine' ? viewList(false)
        : h === 'queue' ? viewList(true)
        : viewHelp();
    }
    app.innerHTML = out;
    bind();
  }

  function bindLang() {
    var btn = document.getElementById('langBtn');
    var menu = document.getElementById('langMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
    menu.querySelectorAll('[data-lang]').forEach(function (b) {
      b.addEventListener('click', function () {
        window.I18N.set(b.dataset.lang);
        render();
      });
    });
    document.addEventListener('click', function () { menu.classList.remove('open'); });
  }

  function bind() {
    bindLang();

    var out = document.getElementById('out');
    if (out) out.addEventListener('click', function () {
      state.role = null;
      try { localStorage.removeItem(LS.role); } catch (e) {}
      location.hash = ''; render();
    });

    var bell = document.getElementById('bell');
    if (bell) bell.addEventListener('click', function (e) {
      e.stopPropagation();
      var p = document.getElementById('notif');
      p.classList.toggle('open');
      if (p.classList.contains('open')) {
        set(LS.read, notifications().map(function (n) { return n.id; }));
        var b = bell.querySelector('.bdg'); if (b) b.remove();
        p.querySelectorAll('.it').forEach(function (i) { i.classList.remove('un'); });
      }
    });
    document.addEventListener('click', function () {
      var p = document.getElementById('notif'); if (p) p.classList.remove('open');
    });

    document.querySelectorAll('[data-open]').forEach(function (r) {
      r.addEventListener('click', function () { location.hash = '#/t/' + r.dataset.open; });
    });

    var back = document.getElementById('back');
    if (back) back.addEventListener('click', function () {
      location.hash = state.role === 'tech' ? '#/queue' : '#/mine';
    });

    var pri = document.getElementById('pri');
    if (pri) pri.addEventListener('click', function (e) {
      var b = e.target.closest('.pri'); if (!b) return;
      pri.querySelectorAll('.pri').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on'); draft.pri = b.dataset.p;
    });

    var go = document.getElementById('go');
    if (go) go.addEventListener('click', function () {
      var s = document.getElementById('sub'), d = document.getElementById('det');
      var ok = true;
      [['f-sub', s], ['f-det', d]].forEach(function (pair) {
        var bad = !pair[1].value.trim();
        document.getElementById(pair[0]).classList.toggle('bad', bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      runTriage(s.value.trim(), d.value.trim(), draft.pri);
    });

    var rep = document.getElementById('sendRep');
    if (rep) rep.addEventListener('click', function () {
      var box = document.getElementById('rep');
      if (!box.value.trim()) return;
      var id = location.hash.replace('#/t/', '');
      tickets.forEach(function (t) {
        if (t.id !== id) return;
        t.thread.push({ who: state.role === 'tech' ? 'tech' : 'me', at: Date.now(), body: box.value.trim() });
        if (state.role === 'tech') { t.responded = t.responded || Date.now(); t.status = 'prog'; }
      });
      set(LS.tickets, tickets);
      render();
    });

    var filt = document.getElementById('filt');
    if (filt) filt.addEventListener('click', function (e) {
      var b = e.target.closest('.ft'); if (!b) return;
      filt.querySelectorAll('.ft').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var f = b.dataset.f;
      document.querySelectorAll('#rows .tk').forEach(function (row) {
        var t = tickets.filter(function (x) { return x.id === row.dataset.open; })[0];
        row.style.display = (f === 'all' || (t && t.status === f)) ? '' : 'none';
      });
    });
  }

  /* live SLA countdowns — re-render lightweight bits every 10s */
  setInterval(function () {
    if (!state.role) return;
    if (!/^#\/(dash|mine|queue|t\/)/.test(location.hash || '#/dash')) return;
    // Never re-render out from under someone who is typing, or the reply box empties.
    var a = document.activeElement;
    if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT')) return;
    var rep = document.getElementById('rep');
    if (rep && rep.value.trim()) return;
    render();
  }, 10000);

  window.addEventListener('hashchange', render);
  render();
})();
