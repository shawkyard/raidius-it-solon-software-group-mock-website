/* ===========================================================================
   Solen Portfolio Hub — connective tissue for a deliberately decentralized group.
   Mock auth, live cross-timezone directory, leadership forum, 99-point checklist,
   shared services, Slack deep links and timezone-correct booking with .ics export.
   Data is inlined by the generator as window.SOLEN_DATA (works offline / file://).
   =========================================================================== */
(function () {
  'use strict';

  var D = window.SOLEN_DATA || {};
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LS = { role: 'solen_hub_role', ck: 'solen_hub_checklist', rq: 'solen_hub_requests', nt: 'solen_hub_notifread' };

  /* ------------------------------------------------------ timezone helpers */
  // Offset (minutes) of an IANA zone at a given instant. DST-correct.
  function tzOffset(date, tz) {
    var dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    var p = {};
    dtf.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    var asUTC = Date.UTC(+p.year, p.month - 1, +p.day, p.hour === '24' ? 0 : +p.hour, +p.minute, +p.second);
    return (asUTC - date.getTime()) / 60000;
  }
  // Build the real instant for a wall-clock time in a given zone (two-pass for DST edges).
  function zonedTimeToInstant(y, m, d, hh, mm, tz) {
    var guess = Date.UTC(y, m, d, hh, mm, 0);
    var o1 = tzOffset(new Date(guess), tz);
    var t1 = guess - o1 * 60000;
    var o2 = tzOffset(new Date(t1), tz);
    return o1 === o2 ? new Date(t1) : new Date(guess - o2 * 60000);
  }
  function fmtTime(date, tz) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  }
  function fmtDay(date, tz) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  }
  function localHour(date, tz) {
    return parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(date), 10);
  }
  function isWorking(tz) {
    var now = new Date();
    var h = localHour(now, tz);
    var wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now);
    if (wd === 'Sat' || wd === 'Sun') return false;
    return h >= 9 && h < 18;
  }
  var VIEWER_TZ = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'America/Denver';

  /* ------------------------------------------------------------- directory */
  var REGION_TZ = {
    'Utah': 'America/Denver', 'California': 'America/Los_Angeles', 'Minnesota': 'America/Chicago',
    'Wisconsin': 'America/Chicago', 'North Carolina': 'America/New_York', 'New Jersey': 'America/New_York',
    'Florida': 'America/New_York', 'New York': 'America/New_York', 'New England': 'America/New_York'
  };
  function coTz(c) { return REGION_TZ[c.hqRegion] || 'America/New_York'; }

  function buildDirectory() {
    var out = [];
    (D.team || []).forEach(function (t) {
      var off = (D.offices || []).find(function (o) { return o.city === t.office; });
      out.push({
        name: t.name, title: t.title, company: 'Solen', companySlug: null,
        city: t.office, tz: off ? off.tz : 'America/Denver', func: t.focus,
        tags: [t.focus], isSolen: true, bookable: t.bookable !== false
      });
    });
    (D.portfolio || []).forEach(function (c) {
      if (!c.leaderName) return;
      out.push({
        name: c.leaderName, title: c.leaderTitle || 'Leadership', company: c.name, companySlug: c.slug,
        city: c.hqCity || c.hqCountry || '—', tz: coTz(c), func: 'Leadership',
        tags: (c.expertise || []).slice(0, 4), isSolen: false, bookable: true, vertical: c.vertical
      });
    });
    return out;
  }
  var DIRECTORY = buildDirectory();

  /* ------------------------------------------------------------- app state */
  var ROLES = {
    solen_team: { label: 'Solen Team', name: 'Rafael Mazzeo', title: 'Operating Partner', company: 'Solen', tz: 'America/Denver' },
    portfolio_leader: { label: 'Portfolio Leader', name: 'Scott Dunnewind', title: 'Chief Executive Officer', company: 'Champ Software', tz: 'America/Chicago' },
    portfolio_employee: { label: 'Portfolio Employee', name: 'Alex Rivera', title: 'Implementation Specialist', company: 'Trackit', tz: 'America/New_York' }
  };
  var ROLE_ROUTES = {
    solen_team: ['dashboard', 'directory', 'companies', 'playbooks', 'forum', 'services', 'onboarding', 'slack'],
    portfolio_leader: ['dashboard', 'directory', 'companies', 'playbooks', 'forum', 'services', 'onboarding', 'slack'],
    portfolio_employee: ['dashboard', 'directory', 'companies', 'playbooks', 'services', 'slack']
  };
  var state = { role: null, route: 'dashboard' };
  try { state.role = localStorage.getItem(LS.role); } catch (e) { }
  if (!ROLES[state.role]) state.role = null;

  var app = document.getElementById('hubApp');

  /* --------------------------------------------------------------- helpers */
  function h(html) { return html; }
  function initials(n) { return n.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function get(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }

  function canAccess(route) {
    if (!state.role) return false;
    return ROLE_ROUTES[state.role].indexOf(route) > -1;
  }

  /* ----------------------------------------------------------------- login */
  function renderLogin() {
    app.className = 'login';
    app.innerHTML = h(
      '<div class="login-in">' +
      '<a class="logo" href="index.html">Solen<span class="dot">.</span></a>' +
      '<div class="subt">Portfolio Hub</div>' +
      '<h2>Sign in</h2>' +
      '<p>Choose a role to explore the Hub. Each sees different navigation and content.</p>' +
      Object.keys(ROLES).map(function (k) {
        var r = ROLES[k];
        return '<button class="role-btn" data-role="' + k + '"><b>' + esc(r.label) + '</b>' +
          '<span>' + esc(r.name) + ' · ' + esc(r.title) + ' · ' + esc(r.company) + '</span></button>';
      }).join('') +
      '<div class="demo-note"><strong>Demo authentication.</strong> No credentials are checked and no data leaves your browser. ' +
      'In production this is replaced by OIDC against Microsoft Entra ID or Okta — see INTEGRATIONS.md.</div>' +
      '</div>');
    app.querySelectorAll('.role-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        state.role = b.dataset.role;
        try { localStorage.setItem(LS.role, state.role); } catch (e) { }
        state.route = 'dashboard';
        location.hash = '#/dashboard';
        render();
      });
    });
  }

  /* ---------------------------------------------------------------- shell */
  var NAVI = [
    { k: 'dashboard', label: 'Dashboard', grp: 'Overview' },
    { k: 'directory', label: 'Directory', grp: 'Overview' },
    { k: 'companies', label: 'Companies', grp: 'Overview' },
    { k: 'playbooks', label: 'Playbooks', grp: 'Operate' },
    { k: 'forum', label: 'Leadership Forum', grp: 'Operate' },
    { k: 'services', label: 'Shared Services', grp: 'Operate' },
    { k: 'onboarding', label: 'Onboarding', grp: 'Operate' },
    { k: 'slack', label: 'Slack Channels', grp: 'Connect' }
  ];

  function shell(title, content) {
    var me = ROLES[state.role];
    var grps = [];
    NAVI.forEach(function (n) {
      if (!canAccess(n.k)) return;
      if (!grps.length || grps[grps.length - 1].name !== n.grp) grps.push({ name: n.grp, items: [] });
      grps[grps.length - 1].items.push(n);
    });
    var unread = notifications().filter(function (n) { return !n.read; }).length;

    return h('<div class="hub-shell">' +
      '<aside class="hub-side">' +
      '<a class="logo" href="index.html">Solen<span class="dot">.</span></a>' +
      '<div class="subt">Portfolio Hub</div>' +
      '<nav class="hub-nav">' +
      grps.map(function (g) {
        return '<div class="grp">' + esc(g.name) + '</div>' + g.items.map(function (n) {
          return '<a href="#/' + n.k + '" class="' + (state.route === n.k ? 'on' : '') + '">' + esc(n.label) + '</a>';
        }).join('');
      }).join('') +
      '</nav>' +
      '<div class="hub-side-foot"><div class="who">' + esc(me.name) + '</div>' +
      '<div class="role">' + esc(me.label) + '</div>' +
      '<button id="signout">Switch role</button></div>' +
      '</aside>' +
      '<div class="hub-main">' +
      '<header class="hub-top"><h1>' + esc(title) + '</h1><div class="spacer"></div>' +
      '<div class="hub-clocks">' + (D.offices || []).map(function (o) {
        return '<span>' + esc(o.city.split(' ')[0]) + ' <b data-tz="' + o.tz + '">--:--</b></span>';
      }).join('') + '<span class="me">You <b data-tz="' + VIEWER_TZ + '">--:--</b></span></div>' +
      '<button class="bell" id="bell" aria-label="Notifications">' +
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>' +
      (unread ? '<span class="badge">' + unread + '</span>' : '') + '</button>' +
      '</header>' +
      '<div class="notif" id="notifPanel"><h4>Notifications</h4>' +
      notifications().map(function (n) {
        return '<div class="item' + (n.read ? '' : ' unread') + '">' + esc(n.text) + '<div class="t">' + esc(n.when) + '</div></div>';
      }).join('') + '</div>' +
      '<div class="hub-content">' + content + '</div>' +
      '</div></div>');
  }

  function notifications() {
    var read = get(LS.nt, []);
    var items = [
      { id: 'n1', text: 'Inês Pequeno replied in “Finance onboarding — what to prepare before week two”', when: '18 minutes ago' },
      { id: 'n2', text: 'Mike Hughes answered your question about government procurement cycles', when: '3 hours ago' },
      { id: 'n3', text: 'Your Legal request LEG-0231 has been assigned to Brinton Wilkins', when: 'Yesterday' },
      { id: 'n4', text: 'Trackit completed Phase 1 of onboarding — Finance', when: '2 days ago' }
    ];
    return items.map(function (i) { i.read = read.indexOf(i.id) > -1; return i; });
  }

  /* ------------------------------------------------------------- dashboard */
  function viewDashboard() {
    var me = ROLES[state.role];
    var recent = (D.portfolio || []).filter(function (c) { return c.acquired; })
      .sort(function (a, b) { return b.acquired - a.acquired; })[0];
    var onlineNow = DIRECTORY.filter(function (p) { return isWorking(p.tz); }).length;

    return shell('Dashboard',
      '<div class="panel"><h2>Good day, ' + esc(me.name.split(' ')[0]) + '.</h2>' +
      '<p class="psub">' + esc(me.title) + ' · ' + esc(me.company) + ' · local time <span data-tz="' + me.tz + '">--:--</span></p>' +
      '<div class="hgrid h4c">' +
      '<div class="kpi"><div class="n">' + (D.portfolio || []).length + '</div><div class="l">Companies in the group</div></div>' +
      '<div class="kpi"><div class="n">' + onlineNow + '</div><div class="l">People online right now</div></div>' +
      '<div class="kpi"><div class="n">' + (D.offices || []).length + '</div><div class="l">Solen offices</div></div>' +
      '<div class="kpi"><div class="n">' + (D.forum || []).length + '</div><div class="l">Active forum threads</div></div>' +
      '</div></div>' +

      (recent ? '<div class="panel"><h2>Most recently joined</h2><p class="psub">' + esc(recent.name) +
        ' — ' + esc(recent.vertical) + ', joined ' + recent.acquired + '. ' + esc(recent.tagline) + '</p>' +
        '<a class="btn btn-slate btn-sm" href="#/onboarding">See onboarding progress</a></div>' : '') +

      '<div class="panel"><h2>Quick actions</h2><p class="psub">The things people come here to do.</p>' +
      '<div class="hgrid h4c">' +
      '<a class="tile" href="#/directory"><div class="ic">◎</div><h4>Find someone</h4><p>Search across every company by expertise, not just by name.</p></a>' +
      '<a class="tile" href="#/services"><div class="ic">✦</div><h4>Request shared services</h4><p>Finance, People, Legal or the AI Innovation Center.</p></a>' +
      '<a class="tile" href="#/playbooks"><div class="ic">✓</div><h4>Open the playbooks</h4><p>The Solen Business System checklist and document library.</p></a>' +
      (canAccess('forum')
        ? '<a class="tile" href="#/forum"><div class="ic">◇</div><h4>Leadership forum</h4><p>Ask the other fourteen companies before you solve it alone.</p></a>'
        : '<a class="tile" href="#/slack"><div class="ic">◇</div><h4>Slack channels</h4><p>Find the right channel across the group.</p></a>') +
      '</div></div>' +

      '<div class="panel"><h2>Why this exists</h2>' +
      '<p class="psub" style="max-width:70ch">Solen owns ' + (D.portfolio || []).length + ' companies that deliberately stay independent. ' +
      'That protects each business — and it means a CEO in Mankato solving a compliance problem has no idea a CEO in Los Angeles solved it last quarter. ' +
      'The Hub is the connective tissue. It does not touch anyone&rsquo;s autonomy.</p></div>'
    );
  }

  /* ------------------------------------------------------------- directory */
  var dirState = { q: '', company: 'all', func: 'all' };
  function viewDirectory() {
    var funcs = [].concat.apply([], DIRECTORY.map(function (p) { return [p.func]; }));
    funcs = ['all'].concat(Array.from(new Set(funcs)).sort());
    var companies = ['all', 'Solen'].concat((D.portfolio || []).filter(function (c) { return c.leaderName; }).map(function (c) { return c.name; }));

    return shell('Directory',
      '<div class="panel"><h2>Everyone across the group</h2>' +
      '<p class="psub">' + DIRECTORY.length + ' people across ' + (D.offices || []).length + ' Solen offices and ' +
      (D.portfolio || []).filter(function (c) { return c.leaderName; }).length + ' portfolio companies. ' +
      'Search by name, company, city — or by what someone has actually solved.</p>' +
      '<div class="hsearch">' +
      '<input type="text" id="dirQ" placeholder="Try “SOC 2”, “HIPAA”, “procurement”, or a name…" value="' + esc(dirState.q) + '">' +
      '</div>' +
      '<div class="hfilters" id="dirFunc">' + funcs.map(function (f) {
        return '<button class="hf' + (dirState.func === f ? ' on' : '') + '" data-f="' + esc(f) + '">' + (f === 'all' ? 'All functions' : esc(f)) + '</button>';
      }).join('') + '</div>' +
      '<div class="hfilters" id="dirCo">' + companies.map(function (c) {
        return '<button class="hf' + (dirState.company === c ? ' on' : '') + '" data-c="' + esc(c) + '">' + (c === 'all' ? 'All companies' : esc(c)) + '</button>';
      }).join('') + '</div>' +
      '<div id="dirResults"></div></div>'
    );
  }

  function renderDirResults() {
    var box = document.getElementById('dirResults');
    if (!box) return;
    var q = dirState.q.trim().toLowerCase();
    var list = DIRECTORY.filter(function (p) {
      if (dirState.company !== 'all' && p.company !== dirState.company) return false;
      if (dirState.func !== 'all' && p.func !== dirState.func) return false;
      if (!q) return true;
      var hay = [p.name, p.title, p.company, p.city, p.func].concat(p.tags || []).join(' ').toLowerCase();
      return hay.indexOf(q) > -1;
    });
    if (!list.length) {
      box.innerHTML = '<div class="empty">Nobody matches that. Try a broader term — the expertise tags cover things like SOC 2, HIPAA, DCAA and procurement.</div>';
      return;
    }
    box.innerHTML = '<p style="font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:4px 0 14px">' +
      list.length + ' ' + (list.length === 1 ? 'person' : 'people') + '</p><div class="people">' +
      list.map(function (p, i) {
        var on = isWorking(p.tz);
        return '<div class="person">' +
          '<div class="row1"><div class="av">' + initials(p.name) + '</div>' +
          '<div style="min-width:0"><div class="nm">' + esc(p.name) + '</div>' +
          '<div class="ti">' + esc(p.title) + '</div>' +
          '<div class="co">' + esc(p.company) + ' · ' + esc(p.city) + '</div></div>' +
          '<div class="avail"><i class="' + (on ? 'on' : 'off') + '"></i><span data-tz="' + p.tz + '">--:--</span></div></div>' +
          ((p.tags && p.tags.length) ? '<div class="tags">' + p.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
          '<div class="acts">' +
          '<button data-slack="' + esc(p.name) + '">Slack</button>' +
          (p.bookable ? '<button data-book="' + i + '">Book time</button>' : '') +
          '</div></div>';
      }).join('') + '</div>';

    box.querySelectorAll('[data-book]').forEach(function (b) {
      b.addEventListener('click', function () { openBooking(list[+b.dataset.book]); });
    });
    box.querySelectorAll('[data-slack]').forEach(function (b) {
      b.addEventListener('click', function () { openSlack(b.dataset.slack); });
    });
    if (window.__renderClocks) window.__renderClocks();
  }

  /* ------------------------------------------------------------- companies */
  function viewCompanies() {
    return shell('Companies',
      '<div class="panel"><h2>The group at a glance</h2>' +
      '<p class="psub">Internal view. Who to ask about what, and which shared services each company is onboarded to.</p></div>' +
      '<div class="hgrid h2c">' + (D.portfolio || []).map(function (c) {
        var svc = ['Finance', 'People', 'Legal'];
        if (c.acquired && c.acquired >= 2026) svc = ['Finance'];
        else if (c.acquired && c.acquired >= 2025) svc = ['Finance', 'People'];
        return '<div class="panel" style="margin:0">' +
          '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">' +
          '<h2 style="font-size:18px">' + esc(c.name) + '</h2>' +
          '<span style="font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--slate)">' + esc(c.vertical) + '</span></div>' +
          '<p class="psub" style="margin-bottom:12px">' + esc(c.tagline) + '</p>' +
          '<div style="font-size:13px;color:var(--ink-soft);line-height:1.9">' +
          (c.leaderName ? '<div><strong>Leadership:</strong> ' + esc(c.leaderName) + (c.leaderTitle ? ', ' + esc(c.leaderTitle) : '') + '</div>' : '') +
          '<div><strong>Location:</strong> ' + esc([c.hqCity, c.hqRegion, c.hqCountry].filter(Boolean).join(', ') || '—') + '</div>' +
          '<div><strong>Shared services:</strong> ' + svc.join(', ') + '</div></div>' +
          ((c.expertise && c.expertise.length) ?
            '<div style="margin-top:13px;padding-top:12px;border-top:1px solid var(--line-soft)">' +
            '<div style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:7px">Ask them about</div>' +
            '<div class="tags" style="display:flex;gap:5px;flex-wrap:wrap">' + c.expertise.map(function (t) {
              return '<span style="font-family:var(--mono);font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;background:var(--bone);border:1px solid var(--line);padding:3px 7px;border-radius:2px">' + esc(t) + '</span>';
            }).join('') + '</div></div>' : '') +
          '</div>';
      }).join('') + '</div>'
    );
  }

  /* ------------------------------------------------------------- playbooks */
  function viewPlaybooks() {
    var saved = get(LS.ck, {});
    var total = 0, done = 0;
    (D.checklist || []).forEach(function (p) {
      p.items.forEach(function (it, i) { total++; if (saved[p.phase + '|' + i]) done++; });
    });
    return shell('Playbooks',
      '<div class="panel"><h2>The Solen Business System</h2>' +
      '<p class="psub">' + total + ' checkpoints applied to every company after acquisition. Progress saves in this browser. ' +
      '<strong>' + done + ' of ' + total + ' complete.</strong></p></div>' +
      (D.checklist || []).map(function (p, pi) {
        var pdone = p.items.filter(function (it, i) { return saved[p.phase + '|' + i]; }).length;
        var pct = Math.round(pdone / p.items.length * 100);
        var circ = 2 * Math.PI * 15;
        return '<div class="phase">' +
          '<div class="phase-h" data-phase="' + pi + '">' +
          '<div class="ring"><svg width="38" height="38">' +
          '<circle cx="19" cy="19" r="15" fill="none" stroke="var(--line)" stroke-width="3"/>' +
          '<circle cx="19" cy="19" r="15" fill="none" stroke="var(--slate)" stroke-width="3" ' +
          'stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - pct / 100)) + '" stroke-linecap="round"/>' +
          '</svg><span class="pct">' + pct + '%</span></div>' +
          '<h4>' + esc(p.phase) + '</h4>' +
          '<span style="font-family:var(--mono);font-size:11px;color:var(--muted)">' + pdone + '/' + p.items.length + '</span>' +
          '</div>' +
          '<div class="phase-b" data-body="' + pi + '">' + p.items.map(function (it, i) {
            var k = p.phase + '|' + i, ck = !!saved[k];
            return '<label class="ck' + (ck ? ' done' : '') + '"><input type="checkbox" data-ck="' + esc(k) + '"' + (ck ? ' checked' : '') + '><span>' + esc(it) + '</span></label>';
          }).join('') + '</div></div>';
      }).join('') +
      '<div class="panel"><h2>Document library</h2><p class="psub">Illustrative for this concept build.</p>' +
      '<div class="hgrid h3c">' +
      [['Finance onboarding pack', 'Finance', 'Inês Pequeno'],
      ['Pricing and annual uplift', 'Go-to-Market', 'Rafael Mazzeo'],
      ['Security baseline', 'Technology', 'Solen Team'],
      ['Hiring in Portugal', 'People', 'Bruna Silva'],
      ['Contract templates', 'Legal', 'Brinton Wilkins'],
      ['Sales Mastermind', 'Go-to-Market', 'Solen Team']].map(function (d) {
        return '<div class="tile"><h4>' + esc(d[0]) + '</h4><p>' + esc(d[1]) + ' · ' + esc(d[2]) + '</p></div>';
      }).join('') + '</div></div>'
    );
  }

  /* ----------------------------------------------------------------- forum */
  function viewForum() {
    if (!canAccess('forum')) {
      return shell('Leadership Forum',
        '<div class="gate"><h2>This area is limited to company leadership</h2>' +
        '<p>The leadership forum is visible to portfolio company leaders and the Solen team. ' +
        'If you believe you should have access, speak to your company&rsquo;s leadership or your Solen contact.</p></div>');
    }
    var topics = Array.from(new Set((D.forum || []).map(function (t) { return t.topic; })));
    return shell('Leadership Forum',
      '<div class="panel"><h2>Ask the other fourteen companies first</h2>' +
      '<p class="psub">Cross-company discussion for portfolio leadership and the Solen team. ' +
      topics.length + ' topics, ' + (D.forum || []).length + ' active threads.</p>' +
      '<div class="hfilters">' + ['All'].concat(topics).map(function (t, i) {
        return '<button class="hf' + (i === 0 ? ' on' : '') + '" data-topic="' + esc(t) + '">' + esc(t) + '</button>';
      }).join('') + '</div></div>' +
      '<div id="threads">' + (D.forum || []).map(function (t) {
        return '<div class="thread" data-topic-row="' + esc(t.topic) + '">' +
          '<div class="th-top"><span class="topic">' + esc(t.topic) + '</span>' +
          (t.solenBadge ? '<span class="badge-solen">Solen Team</span>' : '') + '</div>' +
          '<h4>' + esc(t.title) + '</h4><p>' + esc(t.excerpt) + '</p>' +
          '<div class="th-foot"><span><b>' + esc(t.author) + '</b> · ' + esc(t.company) + '</span>' +
          '<span>' + t.replies + ' replies</span><span>' + esc(t.lastActivity) + '</span></div></div>';
      }).join('') + '</div>'
    );
  }

  /* -------------------------------------------------------------- services */
  var SERVICES = [
    { k: 'Finance', lead: 'Jaco Potgieter', office: 'Lisbon', turn: '2 business days', desc: 'Accounting, month-end close, reporting, budgeting and controls.' },
    { k: 'People', lead: 'Bruna Silva', office: 'Lisbon', turn: '3 business days', desc: 'Recruiting, onboarding, HR infrastructure and employment compliance.' },
    { k: 'Legal', lead: 'Brinton Wilkins', office: 'Salt Lake City', turn: '3 business days', desc: 'Contracts, commercial terms, governance and regulatory questions.' },
    { k: 'AI Innovation Center', lead: 'Solen Team', office: 'Group', turn: '5 business days', desc: 'Shared AI capability for product roadmaps and internal tooling.' }
  ];
  function viewServices() {
    var reqs = get(LS.rq, []);
    return shell('Shared Services',
      '<div class="panel"><h2>Request shared services</h2>' +
      '<p class="psub">Four functions run once for the whole group, so each company does not have to build them.</p>' +
      '<div class="hgrid h4c">' + SERVICES.map(function (s) {
        return '<div class="tile" data-svc="' + esc(s.k) + '"><h4>' + esc(s.k) + '</h4><p>' + esc(s.desc) + '</p>' +
          '<p style="margin-top:9px;font-family:var(--mono);font-size:10px;letter-spacing:.08em;color:var(--slate)">' +
          esc(s.lead) + ' · ' + esc(s.office) + ' · ' + esc(s.turn) + '</p></div>';
      }).join('') + '</div></div>' +
      '<div class="panel"><h2>New request</h2>' +
      '<form id="svcForm">' +
      '<div class="field"><label for="svc">Service</label><select id="svc">' +
      SERVICES.map(function (s) { return '<option>' + esc(s.k) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="svcSub">Subject</label><input type="text" id="svcSub" placeholder="Short summary"></div>' +
      '<div class="field"><label for="svcDet">Detail</label><textarea id="svcDet"></textarea></div>' +
      '<button class="btn btn-slate btn-sm" type="submit">Submit request</button>' +
      '<p class="form-note">Routes to a ticketing system in production. See INTEGRATIONS.md.</p>' +
      '</form></div>' +
      '<div class="panel"><h2>My requests</h2>' +
      (reqs.length ? '<div style="font-size:14px">' + reqs.slice().reverse().map(function (r) {
        return '<div style="display:flex;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line-soft);flex-wrap:wrap">' +
          '<span class="stat-pill open">' + esc(r.status) + '</span>' +
          '<strong>' + esc(r.service) + '</strong><span style="color:var(--ink-soft)">' + esc(r.subject || '(no subject)') + '</span>' +
          '<span style="margin-left:auto;font-family:var(--mono);font-size:10.5px;color:var(--faint)">' + esc(r.id) + '</span></div>';
      }).join('') + '</div>'
        : '<p class="psub">No requests yet.</p>') + '</div>'
    );
  }

  /* ------------------------------------------------------------ onboarding */
  function viewOnboarding() {
    var recent = (D.portfolio || []).filter(function (c) { return c.acquired; })
      .sort(function (a, b) { return b.acquired - a.acquired; }).slice(0, 3);
    var saved = get(LS.ck, {});
    return shell('Onboarding',
      '<div class="panel"><h2>Companies in their first ninety days</h2>' +
      '<p class="psub">Each newly acquired company works through the same phases with a named contact in every shared service.</p></div>' +
      recent.map(function (c, idx) {
        var phases = (D.checklist || []).map(function (p) {
          var d = p.items.filter(function (it, i) { return saved[p.phase + '|' + i]; }).length;
          return { name: p.phase, pct: Math.round(d / p.items.length * 100) };
        });
        return '<div class="panel"><div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px">' +
          '<h2 style="font-size:18px">' + esc(c.name) + '</h2>' +
          '<span style="font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Joined ' + c.acquired + '</span></div>' +
          '<div class="hgrid h3c">' + phases.map(function (p) {
            return '<div><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">' +
              '<span>' + esc(p.name) + '</span><span style="font-family:var(--mono);color:var(--muted)">' + p.pct + '%</span></div>' +
              '<div style="height:5px;background:var(--bone-deep);border-radius:3px;overflow:hidden">' +
              '<div style="height:100%;width:' + p.pct + '%;background:var(--slate)"></div></div></div>';
          }).join('') + '</div>' +
          '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line-soft);font-size:13px;color:var(--ink-soft);line-height:1.9">' +
          '<div><strong>Finance:</strong> Inês Pequeno, Lisbon</div>' +
          '<div><strong>People:</strong> Bruna Silva, Lisbon</div>' +
          '<div><strong>Legal:</strong> Brinton Wilkins, Salt Lake City</div></div></div>';
      }).join('')
    );
  }

  /* ----------------------------------------------------------------- slack */
  var CHANNELS = [
    { n: '#solen-general', p: 'Group-wide announcements', m: 214 },
    { n: '#solen-leadership', p: 'Portfolio company leaders and Solen operating team', m: 31 },
    { n: '#solen-security', p: 'Security, compliance and customer questionnaires', m: 48 },
    { n: '#solen-finance', p: 'Shared finance function and company controllers', m: 39 },
    { n: '#solen-engineering', p: 'Cross-company engineering discussion', m: 96 },
    { n: '#solen-gtm', p: 'Pricing, sales and go-to-market', m: 62 },
    { n: '#solen-ai', p: 'AI Innovation Center and portfolio AI work', m: 57 },
    { n: '#solen-m-and-a', p: 'Integration coordination for new acquisitions', m: 22 }
  ];
  function viewSlack() {
    return shell('Slack Channels',
      '<div class="panel"><h2>Where the group talks</h2>' +
      '<p class="psub">Cross-group channels plus one per portfolio company. Deep links open the Slack desktop app where installed.</p></div>' +
      '<div class="panel"><h2>Cross-group</h2><div class="hgrid h2c">' +
      CHANNELS.map(function (c) {
        return '<div class="tile" data-chan="' + esc(c.n) + '"><h4>' + esc(c.n) + '</h4><p>' + esc(c.p) + '</p>' +
          '<p style="margin-top:8px;font-family:var(--mono);font-size:10px;color:var(--slate)">' + c.m + ' members</p></div>';
      }).join('') + '</div></div>' +
      '<div class="panel"><h2>Per company</h2><div class="hgrid h3c">' +
      (D.portfolio || []).map(function (c) {
        var n = '#co-' + c.slug;
        return '<div class="tile" data-chan="' + esc(n) + '"><h4>' + esc(n) + '</h4><p>' + esc(c.name) + '</p></div>';
      }).join('') + '</div></div>' +
      '<div class="panel"><h2>Connection status</h2>' +
      '<p class="psub">Slack workspace is not connected in this build. Channel data is illustrative; deep links are real and will open Slack if a workspace ID is configured. See INTEGRATIONS.md.</p>' +
      '<button class="btn btn-slate btn-sm" id="connectSlack">Connect Slack</button></div>'
    );
  }

  /* --------------------------------------------------------------- booking */
  var bookState = { person: null, slot: null, duration: 30 };
  function openBooking(p) {
    bookState = { person: p, slot: null, duration: 30 };
    var m = document.getElementById('modal');
    m.querySelector('.modal-in').innerHTML =
      '<div class="modal-h"><h3>Book time with ' + esc(p.name) + '</h3><button data-close>&times;</button></div>' +
      '<div class="modal-b">' +
      '<p style="font-size:14px;color:var(--muted);margin-bottom:6px">' + esc(p.title) + ' · ' + esc(p.company) + '</p>' +
      '<p style="font-size:13px;color:var(--muted);margin-bottom:18px">Their timezone: <strong>' + esc(p.tz) + '</strong> · Yours: <strong>' + esc(VIEWER_TZ) + '</strong>. ' +
      'Times below are shown in <strong>your</strong> local time, with theirs underneath.</p>' +
      '<div class="field"><label>Duration</label>' +
      '<div class="hfilters" id="durPick"><button class="hf on" data-dur="30">30 minutes</button><button class="hf" data-dur="60">60 minutes</button></div></div>' +
      '<div class="field"><label>Available slots — next working day</label><div class="slots" id="slots"></div></div>' +
      '<div id="tzwarnBox"></div>' +
      '</div>' +
      '<div class="modal-f"><button class="btn btn-ghost btn-sm" data-close>Cancel</button>' +
      '<button class="btn btn-sun btn-sm" id="confirmBook" disabled>Confirm booking</button></div>';
    m.classList.add('open');
    renderSlots();
    m.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
    m.querySelector('#durPick').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      m.querySelectorAll('#durPick .hf').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on'); bookState.duration = +b.dataset.dur; bookState.slot = null;
      renderSlots(); document.getElementById('confirmBook').disabled = true;
      document.getElementById('tzwarnBox').innerHTML = '';
    });
    m.querySelector('#confirmBook').addEventListener('click', confirmBooking);
  }

  function nextWorkingDay(tz) {
    var d = new Date();
    for (var i = 1; i <= 7; i++) {
      var cand = new Date(d.getTime() + i * 86400000);
      var wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(cand);
      if (wd !== 'Sat' && wd !== 'Sun') return cand;
    }
    return new Date(d.getTime() + 86400000);
  }

  function renderSlots() {
    var p = bookState.person;
    var box = document.getElementById('slots');
    var base = nextWorkingDay(p.tz);
    // Host calendar date, in the host's own zone
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: p.tz, year: 'numeric', month: '2-digit', day: '2-digit' })
      .format(base).split('-');
    var y = +parts[0], mo = +parts[1] - 1, da = +parts[2];

    var slots = [];
    for (var hh = 9; hh < 17; hh++) {
      [0, 30].forEach(function (mm) {
        if (bookState.duration === 60 && mm === 30) return;
        var inst = zonedTimeToInstant(y, mo, da, hh, mm, p.tz);
        var viewerHour = localHour(inst, VIEWER_TZ);
        slots.push({ inst: inst, hostLabel: fmtTime(inst, p.tz), viewerLabel: fmtTime(inst, VIEWER_TZ), awkward: viewerHour < 8 || viewerHour >= 19 });
      });
    }
    box.innerHTML = slots.map(function (s, i) {
      return '<button class="slot' + (s.awkward ? ' late' : '') + '" data-slot="' + i + '">' +
        s.viewerLabel + '<small>' + s.hostLabel + ' their time</small></button>';
    }).join('');
    box.querySelectorAll('.slot').forEach(function (b) {
      b.addEventListener('click', function () {
        box.querySelectorAll('.slot').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        bookState.slot = slots[+b.dataset.slot];
        document.getElementById('confirmBook').disabled = false;
        var warn = document.getElementById('tzwarnBox');
        var s = bookState.slot;
        var vh = localHour(s.inst, VIEWER_TZ);
        var hh2 = localHour(s.inst, p.tz);
        if (s.awkward) {
          warn.innerHTML = '<div class="tzwarn"><strong>Check this one.</strong> ' + s.viewerLabel + ' for you is ' +
            s.hostLabel + ' for ' + esc(p.name.split(' ')[0]) + ' in ' + esc(p.city) + ' — ' +
            (vh < 8 ? 'early in your morning' : 'late in your evening') + '. It is inside their working day, but it may not be inside yours.</div>';
        } else if (hh2 >= 17) {
          warn.innerHTML = '<div class="tzwarn"><strong>Late for them.</strong> ' + s.hostLabel + ' is toward the end of the working day in ' + esc(p.city) + '.</div>';
        } else { warn.innerHTML = ''; }
      });
    });
    if (!slots.length) box.innerHTML = '<div class="empty">No slots available.</div>';
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function icsStamp(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
  }
  function confirmBooking() {
    var p = bookState.person, s = bookState.slot;
    if (!s) return;
    var end = new Date(s.inst.getTime() + bookState.duration * 60000);
    var me = ROLES[state.role];
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Solen Software Group//Portfolio Hub//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + Date.now() + '@solen.hub',
      'DTSTAMP:' + icsStamp(new Date()),
      'DTSTART:' + icsStamp(s.inst),
      'DTEND:' + icsStamp(end),
      'SUMMARY:' + me.name + ' and ' + p.name + ' — Solen Portfolio Hub',
      'DESCRIPTION:Booked via the Solen Portfolio Hub.\\n' + me.name + ' (' + me.company + ') and ' + p.name + ' (' + p.company + ').',
      'LOCATION:Video call', 'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    var m = document.getElementById('modal');
    m.querySelector('.modal-in').innerHTML =
      '<div class="modal-h"><h3>Booking confirmed</h3><button data-close>&times;</button></div>' +
      '<div class="modal-b">' +
      '<p style="font-size:16px;margin-bottom:16px"><strong>' + esc(p.name) + '</strong> · ' + bookState.duration + ' minutes</p>' +
      '<div style="background:var(--bone);padding:16px 18px;font-size:14.5px;line-height:1.9">' +
      '<div><strong>' + esc(fmtDay(s.inst, VIEWER_TZ)) + ', ' + s.viewerLabel + '</strong> — your time (' + esc(VIEWER_TZ) + ')</div>' +
      '<div style="color:var(--muted)">' + esc(fmtDay(s.inst, p.tz)) + ', ' + s.hostLabel + ' — their time (' + esc(p.tz) + ')</div>' +
      '</div>' +
      '<p style="font-size:13px;color:var(--muted);margin-top:16px">A calendar invitation would be sent to both parties in production. Download the .ics below to add it now.</p>' +
      '</div>' +
      '<div class="modal-f"><button class="btn btn-ghost btn-sm" data-close>Close</button>' +
      '<button class="btn btn-sun btn-sm" id="dlIcs">Download .ics</button></div>';
    m.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
    document.getElementById('dlIcs').addEventListener('click', function () {
      try {
        var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'solen-meeting.ics';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } catch (e) { alert('Download blocked by the browser.'); }
    });
  }

  function openSlack(name) {
    var m = document.getElementById('modal');
    m.querySelector('.modal-in').innerHTML =
      '<div class="modal-h"><h3>Message ' + esc(name) + '</h3><button data-close>&times;</button></div>' +
      '<div class="modal-b"><p style="font-size:14.5px">Slack deep links are wired and will open the desktop app when a workspace ID is configured.</p>' +
      '<div style="background:var(--bone);padding:14px 16px;font-family:var(--mono);font-size:12px;color:var(--ink-soft);word-break:break-all;margin:14px 0">' +
      'slack://user?team=${SLACK_TEAM_ID}&amp;id=${SLACK_USER_ID}</div>' +
      '<p style="font-size:13px;color:var(--muted)">No Slack workspace is connected in this build, so the link cannot resolve to a real person. ' +
      'Set SLACK_TEAM_ID and map directory entries to Slack user IDs to enable it. See INTEGRATIONS.md.</p></div>' +
      '<div class="modal-f"><button class="btn btn-ghost btn-sm" data-close>Close</button></div>';
    m.classList.add('open');
    m.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
  }
  function closeModal() { document.getElementById('modal').classList.remove('open'); }

  /* ----------------------------------------------------------------- route */
  var VIEWS = {
    dashboard: viewDashboard, directory: viewDirectory, companies: viewCompanies,
    playbooks: viewPlaybooks, forum: viewForum, services: viewServices,
    onboarding: viewOnboarding, slack: viewSlack
  };

  function render() {
    if (!state.role) { renderLogin(); return; }
    var r = (location.hash || '#/dashboard').replace('#/', '') || 'dashboard';
    if (!VIEWS[r]) r = 'dashboard';
    // route-level enforcement: not just hidden nav links
    if (!canAccess(r) && r !== 'forum') r = 'dashboard';
    state.route = r;
    app.className = '';
    app.innerHTML = VIEWS[r]();
    bind();
    if (window.__renderClocks) window.__renderClocks();
  }

  function bind() {
    var so = document.getElementById('signout');
    if (so) so.addEventListener('click', function () {
      state.role = null;
      try { localStorage.removeItem(LS.role); } catch (e) { }
      location.hash = ''; render();
    });

    var bell = document.getElementById('bell');
    if (bell) bell.addEventListener('click', function (e) {
      e.stopPropagation();
      var pnl = document.getElementById('notifPanel');
      pnl.classList.toggle('open');
      if (pnl.classList.contains('open')) {
        set(LS.nt, notifications().map(function (n) { return n.id; }));
        var b = bell.querySelector('.badge'); if (b) b.remove();
        pnl.querySelectorAll('.item').forEach(function (i) { i.classList.remove('unread'); });
      }
    });
    document.addEventListener('click', function () {
      var pnl = document.getElementById('notifPanel');
      if (pnl) pnl.classList.remove('open');
    });

    if (state.route === 'directory') {
      renderDirResults();
      var q = document.getElementById('dirQ');
      q.addEventListener('input', function () { dirState.q = q.value; renderDirResults(); });
      document.getElementById('dirFunc').addEventListener('click', function (e) {
        var b = e.target.closest('.hf'); if (!b) return;
        dirState.func = b.dataset.f;
        this.querySelectorAll('.hf').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); renderDirResults();
      });
      document.getElementById('dirCo').addEventListener('click', function (e) {
        var b = e.target.closest('.hf'); if (!b) return;
        dirState.company = b.dataset.c;
        this.querySelectorAll('.hf').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); renderDirResults();
      });
    }

    if (state.route === 'playbooks') {
      document.querySelectorAll('.phase-h').forEach(function (ph) {
        ph.addEventListener('click', function () {
          var b = document.querySelector('[data-body="' + ph.dataset.phase + '"]');
          b.classList.toggle('open'); ph.classList.toggle('open');
        });
      });
      document.querySelectorAll('[data-ck]').forEach(function (c) {
        c.addEventListener('change', function () {
          var saved = get(LS.ck, {});
          if (c.checked) saved[c.dataset.ck] = 1; else delete saved[c.dataset.ck];
          set(LS.ck, saved);
          var open = Array.prototype.slice.call(document.querySelectorAll('.phase-b.open')).map(function (x) { return x.dataset.body; });
          render();
          open.forEach(function (i) {
            var b = document.querySelector('[data-body="' + i + '"]');
            var hh = document.querySelector('.phase-h[data-phase="' + i + '"]');
            if (b) b.classList.add('open'); if (hh) hh.classList.add('open');
          });
        });
      });
    }

    if (state.route === 'forum') {
      var fb = document.querySelector('.hfilters');
      if (fb) fb.addEventListener('click', function (e) {
        var b = e.target.closest('.hf'); if (!b) return;
        this.querySelectorAll('.hf').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var t = b.dataset.topic;
        document.querySelectorAll('[data-topic-row]').forEach(function (r) {
          r.style.display = (t === 'All' || r.dataset.topicRow === t) ? '' : 'none';
        });
      });
    }

    if (state.route === 'services') {
      var f = document.getElementById('svcForm');
      if (f) f.addEventListener('submit', function (e) {
        e.preventDefault();
        var reqs = get(LS.rq, []);
        var svc = document.getElementById('svc').value;
        reqs.push({
          id: svc.slice(0, 3).toUpperCase() + '-' + (1000 + reqs.length + Math.floor(Math.random() * 200)),
          service: svc, subject: document.getElementById('svcSub').value,
          detail: document.getElementById('svcDet').value, status: 'Open'
        });
        set(LS.rq, reqs); render();
      });
      document.querySelectorAll('[data-svc]').forEach(function (t) {
        t.addEventListener('click', function () {
          var sel = document.getElementById('svc');
          if (sel) { sel.value = t.dataset.svc; sel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); sel.focus(); }
        });
      });
    }

    if (state.route === 'slack') {
      document.querySelectorAll('[data-chan]').forEach(function (t) {
        t.addEventListener('click', function () { openSlack(t.dataset.chan); });
      });
      var cs = document.getElementById('connectSlack');
      if (cs) cs.addEventListener('click', function () { openSlack('the workspace'); });
    }
  }

  /* clocks (shared with site.js pattern, exposed so re-renders refresh) */
  window.__renderClocks = function () {
    document.querySelectorAll('[data-tz]').forEach(function (el) {
      try {
        el.textContent = new Intl.DateTimeFormat('en-GB', {
          timeZone: el.dataset.tz, hour: '2-digit', minute: '2-digit', hour12: false
        }).format(new Date());
      } catch (e) { el.textContent = '--:--'; }
    });
  };
  setInterval(function () { window.__renderClocks(); }, 30000);

  window.addEventListener('hashchange', render);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  render();
})();
