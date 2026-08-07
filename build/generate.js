#!/usr/bin/env node
/* Static site generator for the Solen Software Group concept build.
   Run:  node build/generate.js
   Emits static HTML into the repository root, ready for GitHub Pages. */

const fs = require('fs');
const path = require('path');
const D = require('./data.js');

const ROOT = path.join(__dirname, '..');
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const verticals = [...new Set(D.portfolio.map(c => c.vertical))].sort()
  .map(v => ({ name: v, count: D.portfolio.filter(c => c.vertical === v).length }));

const loc = c => [c.hqCity, c.hqRegion, c.hqCountry].filter(Boolean).join(', ');
const shortLoc = c => c.hqCity ? `${c.hqCity}, ${c.hqRegion || c.hqCountry}` : (c.hqCountry || '—');

// Deployment base. Cloudflare Pages serves from the root; GitHub Pages serves from
// /<repo>/. Override with env vars when deploying elsewhere:
//   SITE_BASE=/raidius-it-solon-software-group-mock-website/ \
//   SITE_ORIGIN=https://shawkyard.github.io node build/generate.js
const SITE_BASE = process.env.SITE_BASE || '/';
const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://solen-concept.pages.dev').replace(/\/$/, '');
const REPO_BASE = SITE_BASE;

const WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten',
  'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const word = n => WORDS[n] || String(n);
const Word = n => { const w = word(n); return w.charAt(0).toUpperCase() + w.slice(1); };

/* SEO helpers — titles <= 60 chars, descriptions 140-160, all unique. */
function fitTitle(base, suffix) {
  const full = suffix ? `${base} ${suffix}` : base;
  if (full.length <= 60) return full;
  if (base.length <= 60) return base;
  let t = base.slice(0, 57);
  t = t.slice(0, Math.max(t.lastIndexOf(' '), 40));
  return t + '…';
}
function fitDesc(parts) {
  let s = (Array.isArray(parts) ? parts : [parts]).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  if (s.length > 160) {
    let cut = s.slice(0, 159);
    const sp = cut.lastIndexOf(' ');
    cut = cut.slice(0, sp > 140 ? sp : 159);
    s = cut.replace(/[,;:.\s]+$/, '') + '.';
  }
  return s;
}

/* ------------------------------------------------------------------ layout */
function layout(o) {
  const depth = o.depth || 0;
  const R = depth ? '../'.repeat(depth) : '';
  const canonical = SITE_ORIGIN + SITE_BASE + (o.path || '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:site_name" content="Solen Software Group">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.desc)}">
<meta name="robots" content="${o.noindex ? 'noindex,nofollow' : 'index,follow'}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;450;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${R}assets/css/site.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%230F1219'/><circle cx='16' cy='16' r='7' fill='%23C98A1E'/></svg>">
${o.jsonld ? `<script type="application/ld+json">${JSON.stringify(o.jsonld)}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${nav(R, o.nav)}
<main id="main">
${o.body}
</main>
${footer(R)}
<script src="${R}assets/js/site.js"></script>
${o.script || ''}
</body>
</html>`;
}

/* --------------------------------------------------------------------- nav */
function nav(R, active) {
  const on = k => active === k ? ' class="active"' : '';
  const megaPanels = verticals.map(v => `
        <div data-vert-panel="${esc(v.name)}" class="mega-cos" style="display:${v === verticals[0] ? 'grid' : 'none'}">
          ${D.portfolio.filter(c => c.vertical === v.name).map(c => `
          <a class="mega-co" href="${R}portfolio/${c.slug}.html"><b>${esc(c.name)}</b><i>${esc(c.tagline)}</i></a>`).join('')}
        </div>`).join('');
  return `<nav class="nav">
  <div class="nav-in">
    <a class="logo" href="${R}index.html">Solen<span class="dot">.</span></a>
    <div class="nav-links">
      <a href="${R}founders.html"${on('founders')}>For Founders</a>
      <a href="${R}portfolio.html" id="megaTrigger" aria-expanded="false" aria-haspopup="true"${on('portfolio')}>Portfolio</a>
      <a href="${R}approach.html"${on('approach')}>Approach</a>
      <a href="${R}people.html"${on('people')}>People</a>
      <a href="${R}insights.html"${on('insights')}>Insights</a>
    </div>
    <div class="nav-right">
      <a class="btn btn-ghost btn-sm" href="${R}hub.html">Portfolio Hub</a>
      <a class="btn btn-sun btn-sm" href="${R}founders.html#talk">Start a conversation</a>
      <button class="nav-toggle" id="navToggle" aria-label="Open menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
    </div>
  </div>
  <div class="mega" id="mega">
    <div class="mega-in">
      <div class="mega-verts">
        ${verticals.map((v, i) => `<button class="mega-vert${i === 0 ? ' on' : ''}" data-vert="${esc(v.name)}">${esc(v.name)}<span>${v.count}</span></button>`).join('\n        ')}
      </div>
      <div>${megaPanels}</div>
      <div class="mega-foot"><a class="arrow-link" href="${R}portfolio.html">View all ${D.portfolio.length} companies</a></div>
    </div>
  </div>
</nav>
<div class="mnav" id="mnav">
  <div class="mnav-top">
    <a class="logo" href="${R}index.html">Solen<span class="dot">.</span></a>
    <button class="nav-toggle" id="mnavClose" aria-label="Close menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </div>
  <a href="${R}founders.html">For Founders</a>
  <a href="${R}advisors.html">For Advisors</a>
  <a href="${R}portfolio.html">Portfolio</a>
  <a href="${R}approach.html">Approach</a>
  <a href="${R}people.html">People</a>
  <a href="${R}careers.html">Careers</a>
  <a href="${R}insights.html">Insights</a>
  <a href="${R}hub.html">Portfolio Hub</a>
  <a class="btn btn-sun" href="${R}founders.html#talk">Start a conversation</a>
</div>`;
}

/* ------------------------------------------------------------------ footer */
function footer(R) {
  return `<footer>
  <div class="wrap">
    <div class="f-grid">
      <div>
        <a class="logo" href="${R}index.html">Solen<span class="dot">.</span></a>
        <p>A permanent home for mission-critical software.</p>
        <p style="margin-top:16px;font-size:13.5px">6995 South Union Park Center, Suite 340<br>Cottonwood Heights, Utah 84047</p>
      </div>
      <div>
        <h5>Company</h5>
        <ul>
          <li><a href="${R}founders.html">For Founders</a></li>
          <li><a href="${R}advisors.html">For Advisors</a></li>
          <li><a href="${R}portfolio.html">Portfolio</a></li>
          <li><a href="${R}approach.html">Approach</a></li>
        </ul>
      </div>
      <div>
        <h5>More</h5>
        <ul>
          <li><a href="${R}people.html">People</a></li>
          <li><a href="${R}careers.html">Careers</a></li>
          <li><a href="${R}insights.html">Insights</a></li>
          <li><a href="${R}hub.html">Portfolio Hub</a></li>
        </ul>
      </div>
      <div>
        <h5>Offices</h5>
        ${D.offices.map(o => `<div class="clock"><span class="c">${esc(o.city)}${o.isHQ ? ' <span style="opacity:.5">HQ</span>' : ''}</span><span class="t${o.isHQ ? ' hq' : ''}" data-tz="${o.tz}">--:--</span></div>`).join('\n        ')}
      </div>
    </div>
    <div class="f-bot">
      <span>&copy; <span data-year></span> Solen Software Group. Concept build — not an official website.</span>
      <span class="links"><a href="${R}portfolio.html">Portfolio</a><a href="${R}careers.html">Careers</a><a href="${R}founders.html#talk">Contact</a></span>
    </div>
  </div>
</footer>`;
}

/* -------------------------------------------------------------- components */
function coCard(c, R) {
  return `<a class="card rise" data-vertical="${esc(c.vertical)}" href="${R}portfolio/${c.slug}.html">
  <span class="ey">${esc(c.vertical)}</span>
  <h3>${esc(c.name)}</h3>
  <p>${esc(c.tagline)}</p>
  <span class="meta"><span>${esc(shortLoc(c))}</span><span>${c.acquired ? esc(c.acquired) : ''}</span></span>
</a>`;
}

/* Working-day overlap band: honest, computed, and more useful than a decorative map. */
function overlapBand() {
  const offsets = { 'America/Denver': -6, 'Europe/Lisbon': 1, 'America/New_York': -4, 'America/Toronto': -4, 'America/Sao_Paulo': -3 };
  const rows = D.offices.map(o => {
    const off = offsets[o.tz];
    const startUTC = 9 - off, endUTC = 18 - off;
    return { city: o.city, tz: o.tz, isHQ: o.isHQ, startUTC, endUTC, off };
  });
  const min = 0, max = 24, W = 100;
  const pct = h => ((h - min) / (max - min)) * W;
  // overlap window across all offices
  const ovStart = Math.max(...rows.map(r => r.startUTC));
  const ovEnd = Math.min(...rows.map(r => r.endUTC));
  const hasOverlap = ovEnd > ovStart;
  return `<div class="mapwrap">
  <div style="position:relative">
    ${hasOverlap ? `<div style="position:absolute;left:${pct(ovStart)}%;width:${pct(ovEnd) - pct(ovStart)}%;top:0;bottom:26px;background:var(--sun-soft);border-left:1px solid var(--sun);border-right:1px solid var(--sun)"></div>` : ''}
    ${rows.map(r => `
    <div style="position:relative;display:flex;align-items:center;gap:14px;margin-bottom:11px">
      <div style="width:120px;flex-shrink:0;font-size:14px;color:var(--ink)">${esc(r.city)}</div>
      <div style="flex:1;position:relative;height:26px;background:var(--bone-deep);border-radius:1px">
        <div style="position:absolute;left:${pct(r.startUTC)}%;width:${pct(r.endUTC) - pct(r.startUTC)}%;top:0;bottom:0;background:${r.isHQ ? 'var(--sun)' : 'var(--slate)'};border-radius:1px"></div>
      </div>
      <div style="width:58px;flex-shrink:0;text-align:right;font-family:var(--mono);font-size:13px;color:var(--ink)" data-tz="${r.tz}">--:--</div>
    </div>`).join('')}
    <div style="display:flex;gap:14px;margin-left:134px;margin-right:72px">
      <div style="flex:1;display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--faint);letter-spacing:.1em">
        <span>00 UTC</span><span>06</span><span>12</span><span>18</span><span>24</span>
      </div>
    </div>
  </div>
  <div class="map-key">
    <span><i style="background:var(--sun)"></i>Headquarters</span>
    <span><i style="background:var(--slate)"></i>Office</span>
    ${hasOverlap ? `<span><i style="background:var(--sun-soft);border:1px solid var(--sun)"></i>All offices online — ${ovStart}:00 to ${ovEnd}:00 UTC</span>` : ''}
  </div>
</div>`;
}

/* ---------------------------------------------------------------- homepage */
function home() {
  const featured = ['track-star', 'champ-software', 'thought-foundry', 'spokane-software', 'trackit', 'spiralinks']
    .map(s => D.portfolio.find(c => c.slug === s)).filter(Boolean);
  const body = `
<section class="hero">
  <div class="wrap">
    <span class="eyebrow accent rise">Permanent capital for vertical software</span>
    <h1 class="rise">We buy software companies and <span class="sun">never sell them</span>.</h1>
    <p class="lede rise">Solen is a permanent home for founder-built, mission-critical software businesses. No fund clock. No exit timeline. We think in decades.</p>
    <div class="btn-row rise">
      <a class="btn btn-sun" href="founders.html#talk">Sell your company</a>
      <a class="btn btn-slate" href="portfolio.html">Explore the portfolio</a>
    </div>
    <div class="hero-strip rise">
      <span><b>${D.portfolio.length}</b> companies</span>
      <span><b>${verticals.length}</b> verticals</span>
      <span><b>8</b> countries</span>
      <span><b>0</b> exits</span>
    </div>
  </div>
</section>

<div class="stats">
  <div class="stat"><div class="n" data-count="${D.portfolio.length}">0</div><div class="l">Companies held</div></div>
  <div class="stat"><div class="n" data-count="${verticals.length}">0</div><div class="l">Verticals served</div></div>
  <div class="stat"><div class="n"><span data-count="45">0</span>–<span data-count="60">0</span></div><div class="l">Days from first meeting to funding</div></div>
  <div class="stat hl"><div class="n" data-count="0">0</div><div class="l">Companies sold</div><div class="sub">and that is the point</div></div>
</div>

<section>
  <div class="wrap two">
    <div class="two-sticky">
      <span class="eyebrow">The thesis</span>
      <h2>Most acquirers are renting. We are buying a home.</h2>
    </div>
    <div>
      <div class="numbered rise">
        <span class="num">01</span>
        <h3>No fund clock.</h3>
        <p>Traditional funds have a defined life. Capital is raised, deployed and returned on a schedule agreed before your company was ever identified. Our capital is permanent, so no schedule applies.</p>
      </div>
      <div class="numbered rise">
        <span class="num">02</span>
        <h3>No forced exit.</h3>
        <p>Nothing in our structure requires us to sell a business. We have never sold one. That is a consequence of how we are capitalised, not a promise about our intentions.</p>
      </div>
      <div class="numbered rise">
        <span class="num">03</span>
        <h3>No dismantling.</h3>
        <p>Your brand, your leadership and your customer relationships continue. We take the back office. We do not take the parts of the business that made it worth buying.</p>
      </div>
    </div>
  </div>
</section>

<section class="sec-bone">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow">The portfolio</span>
      <h2>${Word(D.portfolio.length)} companies. ${Word(verticals.length)} industries. One owner who is not going anywhere.</h2>
    </div>
    <div class="grid g3">${featured.map(c => coCard(c, '')).join('\n      ')}</div>
    <div style="margin-top:34px"><a class="arrow-link" href="portfolio.html">View all ${D.portfolio.length} companies</a></div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow">Across the group</span>
      <h2>Eight countries, one working day.</h2>
      <p class="lede">Our teams span Salt Lake City to Lisbon. The band below shows each office's working hours against UTC, and the window in which all of them are online together.</p>
    </div>
    ${overlapBand()}
  </div>
</section>

<section class="sec-ink">
  <div class="wrap quote-big">
    <blockquote>Solen has demonstrated that they make acquisitions intended to preserve and grow the companies that they acquire rather than to flip them as others in the industry have done.</blockquote>
    <cite>A Solen portfolio founder</cite>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Where to start</span><h2>Three ways in.</h2></div>
    <div class="grid g3">
      <a class="card rise" href="founders.html"><span class="ey">Founders</span><h3>I'm considering a sale</h3><p>Confidential, non-obligating, and at your pace. Most conversations start years before anything happens.</p><span class="meta"><span>For Founders →</span></span></a>
      <a class="card rise" href="advisors.html"><span class="ey">Intermediaries</span><h3>I advise on transactions</h3><p>What makes a good referral, how fast we move, and how to submit an opportunity.</p><span class="meta"><span>For Advisors →</span></span></a>
      <a class="card rise" href="hub.html"><span class="ey">Portfolio</span><h3>I lead a Solen company</h3><p>The Portfolio Hub — directory, playbooks, shared services and the leadership forum.</p><span class="meta"><span>Enter the Hub →</span></span></a>
    </div>
  </div>
</section>

<section class="sec-bone">
  <div class="wrap" style="text-align:center">
    <h2 style="max-width:20ch;margin:0 auto 20px">Conversations here are confidential and non-obligating.</h2>
    <p style="max-width:52ch;margin:0 auto 30px;color:var(--ink-soft)">Most begin years before a transaction. If the timing is not now, we are content to stay in touch until it is.</p>
    <a class="btn btn-sun" href="founders.html#talk">Start a conversation</a>
  </div>
</section>`;

  return layout({
    title: 'Solen Software Group — Permanent Capital Software',
    desc: fitDesc(`Solen is a permanent home for founder-built, mission-critical software businesses. ${Word(D.portfolio.length)} companies, ${word(verticals.length)} verticals, no exit timeline and no companies sold.`),
    path: '', nav: 'home', body,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Organization', name: 'Solen Software Group',
      description: 'A permanent capital holding company acquiring and operating mission-critical vertical software businesses.',
      address: { '@type': 'PostalAddress', streetAddress: '6995 South Union Park Center, Suite 340', addressLocality: 'Cottonwood Heights', addressRegion: 'UT', postalCode: '84047', addressCountry: 'US' },
      founder: { '@type': 'Person', name: 'Alexander Spencer' },
      location: D.offices.map(o => ({ '@type': 'Place', name: `${o.city}, ${o.region}` }))
    }
  });
}

/* ---------------------------------------------------------------- founders */
function founders() {
  const worries = [
    ['What happens to my people?', 'Your team stays. We operate a decentralized model, which means your leadership keeps authority over the day to day, and we invest in the people already there rather than replacing them.'],
    ['Will you break what works?', 'Your brand, your product and your customer relationships continue as they are. We are buying the business precisely because it works.'],
    ['Will you sell it again in five years?', 'No. Our capital is permanent and has no fund clock. We have never sold a company, and the structure of our capital means we are not required to.'],
    ['Will the process drag on and fall apart?', 'Our capital is committed with no financing contingency. Most partnerships move from first meeting to funding in roughly 45 to 60 days.']
  ];
  const steps = [
    ['First conversation', '60 minutes', 'A call to understand the business and what you want for it. No documents, no NDA required, nothing shared with anyone.'],
    ['Mutual fit', '1–2 weeks', 'We share how we operate and what ownership looks like. You talk to founders who have already sold to us — unfiltered, and without us on the call.'],
    ['Valuation', '2–3 weeks', 'We put a number in front of you with the reasoning behind it. If it is not right, we would rather know early.'],
    ['Confirmatory review', '3–4 weeks', 'Financial, legal and technical review. Structured to minimise disruption to your team, most of whom will not know it is happening.'],
    ['Close and continue', '', 'Funding, and then Monday morning looks much like Friday afternoon did.']
  ];
  const quotes = D.portfolio.filter(c => c.quote && ['track-star', 'spiralinks', 'primate-technologies'].includes(c.slug));

  const body = `
<section class="hero">
  <div class="wrap">
    <span class="eyebrow accent">For founders</span>
    <h1>You spent decades building it. Choosing who takes it matters.</h1>
    <p class="lede">Selling your company is usually a first-time decision made under pressure, with advisors who will not be there afterward. We move at your pace, and the conversation stays confidential whether or not anything happens.</p>
    <div class="btn-row">
      <a class="btn btn-sun" href="#talk">Start a confidential conversation</a>
      <a class="btn btn-slate" href="approach.html">See what happens after we buy</a>
    </div>
  </div>
</section>

<section class="sec-bone">
  <div class="wrap two">
    <div class="two-sticky"><span class="eyebrow">Straight answers</span><h2>What founders actually worry about.</h2></div>
    <div>${worries.map((w, i) => `
      <div class="numbered rise">
        <span class="num">0${i + 1}</span>
        <h3>${esc(w[0])}</h3>
        <p>${esc(w[1])}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">The process</span><h2>Five steps, and you can stop at any one of them.</h2></div>
    <div class="steps">${steps.map((s, i) => `
      <div class="step"><span class="n">0${i + 1}</span><h4>${esc(s[0])}</h4>${s[1] ? `<div class="dur">${esc(s[1])}</div>` : '<div class="dur">&nbsp;</div>'}<p>${esc(s[2])}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec-bone">
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Shared services</span><h2>The parts of the job you can hand over.</h2></div>
    <div class="grid g4">
      <div class="card rise"><h3>Finance</h3><p>A shared finance function that absorbs your back-office reporting, accounting and controls.</p></div>
      <div class="card rise"><h3>People</h3><p>Recruiting, onboarding and HR infrastructure across every country you operate in.</p></div>
      <div class="card rise"><h3>Legal</h3><p>In-house counsel for contracts, compliance and the questions that used to go to an outside firm at an hourly rate.</p></div>
      <div class="card rise"><h3>AI Innovation</h3><p>Access to our AI Innovation Center, so your product roadmap gets capability you would otherwise have to hire for.</p></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Founder voices</span><h2>From people who already decided.</h2></div>
    <div class="grid g3">${quotes.map(c => `
      <div class="qcard rise">
        <p>${esc(c.quote.text)}</p>
        <cite><b>${esc(c.quote.author)}</b>${esc(c.quote.role)}<br><a href="portfolio/${c.slug}.html">${esc(c.name)}</a></cite>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="sec-bone">
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Fit</span><h2>We are probably not right for everyone.</h2></div>
    <div class="fit">
      <div class="fit-col">
        <h3>We are a good fit if</h3>
        <ul class="fit-yes">
          <li>Your software is mission-critical to a specific industry</li>
          <li>You have long-tenured customers who renew</li>
          <li>You care what happens after the sale</li>
          <li>Your revenue is recurring or highly repeatable</li>
          <li>You have a team you want protected</li>
        </ul>
      </div>
      <div class="fit-col">
        <h3>We are probably not a fit if</h3>
        <ul class="fit-no">
          <li>You are pre-revenue or pre-product-market-fit</li>
          <li>You want the highest possible number regardless of outcome</li>
          <li>Your business is services-led rather than software-led</li>
          <li>You need to close in under 30 days</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section id="talk">
  <div class="wrap narrow">
    <div class="sec-head"><span class="eyebrow">Get in touch</span><h2>Most conversations start years before anything happens.</h2>
    <p class="lede">There is no obligation and no process to enter. If the timing is not now, we are content to stay in touch until it is.</p></div>
    <div class="form-ok"><strong>Thank you — that has been received.</strong><p style="margin:8px 0 0">Someone from the team will reply personally within two business days. Nothing you have shared goes any further.</p></div>
    <form data-validated="founders">
      <div class="grid g2" style="gap:0 22px">
        <div class="field"><label for="f-name">Your name *</label><input type="text" id="f-name" name="name" required><div class="errmsg">Please tell us your name.</div></div>
        <div class="field"><label for="f-email">Email *</label><input type="email" id="f-email" name="email" required><div class="errmsg">A valid email address is required.</div></div>
        <div class="field"><label for="f-co">Company *</label><input type="text" id="f-co" name="company" required><div class="errmsg">Please tell us the company name.</div></div>
        <div class="field"><label for="f-web">Company website</label><input type="text" id="f-web" name="website" placeholder="example.com"></div>
      </div>
      <div class="field"><label for="f-rev">Approximate annual revenue</label>
        <select id="f-rev" name="revenue">
          <option value="">Prefer not to say</option>
          <option>Under $1M</option><option>$1M – $3M</option><option>$3M – $10M</option>
          <option>$10M – $25M</option><option>Over $25M</option>
        </select></div>
      <div class="field"><label for="f-msg">Anything you would like us to know</label><textarea id="f-msg" name="message"></textarea></div>
      <div class="field"><label class="check"><input type="checkbox" name="founderFirst" value="yes"><span>I would prefer to speak with a founder who has already sold to Solen before speaking with Solen.</span></label></div>
      <button type="submit" class="btn btn-sun">Send</button>
      <p class="form-note">Everything shared here is treated as confidential. We do not add you to a mailing list.</p>
    </form>
  </div>
</section>`;

  return layout({
    title: 'For Founders — Selling Your Software Company | Solen',
    desc: fitDesc('A confidential, non-obligating conversation about selling your software company. What happens to your people, product and customers after a sale.'),
    path: 'founders.html', nav: 'founders', body,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: worries.map(w => ({ '@type': 'Question', name: w[0], acceptedAnswer: { '@type': 'Answer', text: w[1] } }))
    }
  });
}

/* ---------------------------------------------------------------- advisors */
function advisors() {
  const body = `
<section class="hero">
  <div class="wrap">
    <span class="eyebrow accent">For advisors &amp; intermediaries</span>
    <h1>Your client only does this once. We do it monthly.</h1>
    <p class="lede">We are a repeat, structured buyer of vertical software businesses with committed capital and no financing contingency. Standard intermediary fees are honoured.</p>
    <div class="btn-row"><a class="btn btn-sun" href="#submit">Submit an opportunity</a></div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Mandate</span><h2>What we buy.</h2></div>
    <div class="grid g2">
      <div class="card card-bone"><h3>Profile</h3><p>B2B vertical software with mission-critical workflows, recurring or highly repeatable revenue, and long-tenured customers. Typically $1M–$25M revenue. Founder-owned or corporate carve-out.</p></div>
      <div class="card card-bone"><h3>Verticals</h3><p>Sector-agnostic within B2B. Current portfolio spans agriculture, waste, transit, government, banking, public health, defence, media, HR and food and beverage.</p></div>
      <div class="card card-bone"><h3>Structure</h3><p>Permanent capital, committed, no financing contingency and no fund clock. We do not require a control premium narrative or a resale thesis to justify a price.</p></div>
      <div class="card card-bone"><h3>Out of scope</h3><p>Pre-revenue, services-led businesses, consumer software, and situations requiring a close inside 30 days.</p></div>
    </div>
  </div>
</section>

<section class="sec-bone">
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Process</span><h2>How fast we move.</h2></div>
    <div class="steps" style="grid-template-columns:repeat(3,1fr)">
      <div class="step"><span class="n">01</span><h4>Indication</h4><div class="dur">Within 5 business days</div><p>A view on fit and an indicative range from a teaser and summary financials.</p></div>
      <div class="step"><span class="n">02</span><h4>Offer</h4><div class="dur">2–3 weeks</div><p>A written offer with the reasoning behind the number, not a range designed to be retraded.</p></div>
      <div class="step"><span class="n">03</span><h4>Close</h4><div class="dur">45–60 days total</div><p>Committed capital, no financing contingency, no syndication risk.</p></div>
    </div>
    <div class="callout" style="margin-top:36px">
      <span class="k">On retrading</span>
      <p>We are aware of the reputation the category has. Our offer is our offer, and diligence is confirmatory rather than an opportunity to renegotiate. If we find something material we will tell you what it is and why it changes the number.</p>
    </div>
  </div>
</section>

<section id="submit">
  <div class="wrap narrow">
    <div class="sec-head"><span class="eyebrow">Submit</span><h2>Send us something.</h2></div>
    <div class="form-ok"><strong>Received.</strong><p style="margin:8px 0 0">We will come back to you with a view on fit within five business days.</p></div>
    <form data-validated="advisors">
      <div class="grid g2" style="gap:0 22px">
        <div class="field"><label for="a-name">Your name *</label><input type="text" id="a-name" name="name" required><div class="errmsg">Required.</div></div>
        <div class="field"><label for="a-email">Email *</label><input type="email" id="a-email" name="email" required><div class="errmsg">A valid email address is required.</div></div>
        <div class="field"><label for="a-firm">Firm *</label><input type="text" id="a-firm" name="firm" required><div class="errmsg">Required.</div></div>
        <div class="field"><label for="a-vert">Vertical</label><input type="text" id="a-vert" name="vertical"></div>
      </div>
      <div class="field"><label for="a-detail">Opportunity summary *</label>
        <div class="hint">Revenue, growth, customer profile and situation. No names required at this stage.</div>
        <textarea id="a-detail" name="detail" required></textarea><div class="errmsg">Please give us something to react to.</div></div>
      <button type="submit" class="btn btn-sun">Submit opportunity</button>
      <p class="form-note">Treated as confidential. We do not contact companies directly on a represented process.</p>
    </form>
  </div>
</section>`;
  return layout({
    title: 'For Advisors & Intermediaries | Solen Software Group',
    desc: fitDesc('A repeat buyer of vertical B2B software with committed permanent capital, no financing contingency and a 45 to 60 day close. Intermediary fees honoured.'),
    path: 'advisors.html', nav: 'advisors', body
  });
}

/* --------------------------------------------------------------- portfolio */
function portfolioIndex() {
  const earliest = Math.min(...D.portfolio.filter(c => c.founded).map(c => c.founded));
  const body = `
<section class="hero" style="padding-bottom:40px">
  <div class="wrap">
    <span class="eyebrow accent">The portfolio</span>
    <h1>${Word(D.portfolio.length)} companies. ${Word(verticals.length)} industries. One owner who is not going anywhere.</h1>
    <p class="lede">Each company keeps its brand, its leadership and its independence. What changes is what sits behind it.</p>
    <div class="hero-strip">
      <span><b>${D.portfolio.length}</b> companies</span>
      <span><b>${verticals.length}</b> verticals</span>
      <span>oldest founded <b>${earliest}</b></span>
      <span><b>0</b> sold</span>
    </div>
  </div>
</section>

<section style="padding-top:20px">
  <div class="wrap">
    <div class="filters" id="filters">
      <button class="filt on" data-filter="all">All <span class="c">${D.portfolio.length}</span></button>
      ${verticals.map(v => `<button class="filt" data-filter="${esc(v.name)}">${esc(v.name)} <span class="c">${v.count}</span></button>`).join('\n      ')}
      <div class="view-toggle" id="viewToggle">
        <button class="on" data-view="grid">Grid</button>
        <button data-view="table">Table</button>
      </div>
    </div>
    <p style="font-family:var(--mono);font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:22px">
      Showing <span id="shownCount">${D.portfolio.length}</span> of ${D.portfolio.length}
    </p>

    <div id="gridView" class="grid g3">${D.portfolio.map(c => coCard(c, '')).join('\n      ')}</div>

    <div id="tableView" style="display:none">
      <div class="tbl-wrap">
        <table data-sortable>
          <thead><tr>
            <th class="sortable">Company <span class="ind"></span></th>
            <th class="sortable">Vertical <span class="ind"></span></th>
            <th class="sortable">Location <span class="ind"></span></th>
            <th class="sortable">Founded <span class="ind"></span></th>
            <th class="sortable">Joined <span class="ind"></span></th>
          </tr></thead>
          <tbody>${D.portfolio.map(c => `
            <tr data-vertical="${esc(c.vertical)}">
              <td class="strong"><a href="portfolio/${c.slug}.html">${esc(c.name)}</a></td>
              <td>${esc(c.vertical)}</td>
              <td>${esc(shortLoc(c))}</td>
              <td data-sort="${c.founded || 9999}">${c.founded || '—'}</td>
              <td data-sort="${c.acquired || 9999}">${c.acquired || '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>`;
  return layout({
    title: 'Portfolio — 15 Vertical Software Companies | Solen',
    desc: fitDesc(`Solen holds ${word(D.portfolio.length)} mission-critical software companies across ${word(verticals.length)} industries, from agricultural ERP to public health records to studio content entitlements.`),
    path: 'portfolio.html', nav: 'portfolio', body
  });
}

function portfolioDetail(c) {
  const siblings = D.portfolio.filter(x => x.vertical === c.vertical && x.slug !== c.slug);
  const related = (siblings.length >= 2 ? siblings : D.portfolio.filter(x => x.slug !== c.slug)).slice(0, 3);
  const body = `
<div class="wrap">
  <nav class="crumb"><a href="../portfolio.html">Portfolio</a> <span>/</span> <span>${esc(c.vertical)}</span> <span>/</span> <span style="color:var(--ink)">${esc(c.name)}</span></nav>
</div>

<section class="hero" style="padding-top:40px">
  <div class="wrap">
    <span class="eyebrow accent">${esc(c.vertical)}</span>
    <h1 style="font-size:clamp(36px,5.4vw,64px)">${esc(c.name)}</h1>
    <p class="lede">${esc(c.tagline)}</p>
    ${c.accentStat ? `<p style="font-family:var(--mono);font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--sun-text);margin-top:26px">${esc(c.accentStat)}</p>` : ''}
    <div class="metarow">
      ${loc(c) ? `<div><span class="k">Headquarters</span><span class="v">${esc(loc(c))}</span></div>` : ''}
      ${c.secondaryOffice ? `<div><span class="k">Also in</span><span class="v">${esc(c.secondaryOffice)}</span></div>` : ''}
      ${c.founded ? `<div><span class="k">Founded</span><span class="v">${c.founded}</span></div>` : ''}
      ${c.acquired ? `<div><span class="k">Joined Solen</span><span class="v">${c.acquired}</span></div>` : ''}
      ${c.leaderName ? `<div><span class="k">Leadership</span><span class="v">${esc(c.leaderName)}</span></div>` : ''}
    </div>
  </div>
</section>

<section style="padding-top:0">
  <div class="wrap two">
    <div class="two-sticky"><span class="eyebrow">What they do</span></div>
    <div>
      <p style="font-size:19px;line-height:1.6;color:var(--ink-soft)">${esc(c.description)}</p>
      ${c.products.length ? `<div class="chips" style="margin-top:24px">${c.products.map(p => `<span class="chip">${esc(p)}</span>`).join('')}</div>` : ''}
      ${c.customerType ? `<div style="margin-top:38px;padding-top:26px;border-top:1px solid var(--line)">
        <span class="eyebrow">Who they serve</span>
        <p style="font-size:18px;color:var(--ink)">${esc(c.customerType)}</p></div>` : ''}
    </div>
  </div>
</section>

${c.leaderName || c.acquired ? `<section class="sec-bone">
  <div class="wrap two">
    <div class="two-sticky"><span class="eyebrow">Under Solen</span><h2 style="font-size:clamp(26px,3.2vw,38px)">Independent, and staying that way.</h2></div>
    <div>
      <p style="font-size:18px;color:var(--ink-soft)">${c.acquired && c.leaderName
      ? `Operating independently since ${c.acquired}, with ${esc(c.leaderName)} continuing to lead the business.`
      : c.leaderName ? `${esc(c.leaderName)} continues to lead the business.`
        : `Operating independently since ${c.acquired}.`}
      ${esc(c.name)} retains its brand, its roadmap and its customer relationships. Solen provides shared finance, people and legal functions, and long-term ownership with no exit timeline.</p>
      ${c.quote ? `<div class="qcard" style="margin-top:30px"><p>${esc(c.quote.text)}</p><cite><b>${esc(c.quote.author)}</b>${esc(c.quote.role)}, ${esc(c.name)}</cite></div>` : ''}
    </div>
  </div>
</section>` : ''}

<section>
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Elsewhere in the portfolio</span><h2 style="font-size:clamp(26px,3.2vw,38px)">${siblings.length >= 2 ? `Others in ${esc(c.vertical)}` : 'Related companies'}</h2></div>
    <div class="grid g3">${related.map(x => coCard(x, '../')).join('\n      ')}</div>
  </div>
</section>

<section class="sec-bone">
  <div class="wrap" style="text-align:center">
    <h2 style="max-width:22ch;margin:0 auto 20px">Building something similar? We would like to hear about it.</h2>
    <a class="btn btn-sun" href="../founders.html#talk">Start a conversation</a>
  </div>
</section>`;
  return layout({
    title: fitTitle(`${c.name} — ${c.vertical}`, '| Solen'),
    desc: fitDesc([c.tagline, c.description]),
    path: `portfolio/${c.slug}.html`, nav: 'portfolio', depth: 1, body, ogType: 'article',
    jsonld: { '@context': 'https://schema.org', '@type': 'Corporation', name: c.name, description: c.description, parentOrganization: { '@type': 'Organization', name: 'Solen Software Group' } }
  });
}

/* ---------------------------------------------------------------- approach */
function approach() {
  const total = D.checklist.reduce((n, p) => n + p.items.length, 0);
  const body = `
<section class="hero">
  <div class="wrap">
    <span class="eyebrow accent">The approach</span>
    <h1>Decentralized where it matters. Shared where it helps.</h1>
    <p class="lede">Your team keeps authority over product, customers and roadmap. We take the back office off your desk.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">The operating model</span><h2>What moves, and what does not.</h2></div>
    <div class="fit">
      <div class="fit-col">
        <h3>Stays with you</h3>
        <ul class="fit-yes">
          <li>Product roadmap and engineering priorities</li>
          <li>Pricing and packaging</li>
          <li>Customer relationships</li>
          <li>Hiring for your team</li>
          <li>Day-to-day operating decisions</li>
        </ul>
      </div>
      <div class="fit-col">
        <h3>Moves to us</h3>
        <ul class="fit-yes">
          <li>Financial reporting, accounting and controls</li>
          <li>HR infrastructure and recruiting</li>
          <li>Legal, contracts and compliance</li>
          <li>AI capability through the Innovation Center</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="sec-bone">
  <div class="wrap two">
    <div class="two-sticky">
      <span class="eyebrow">The Solen Business System</span>
      <h2>${total} checkpoints, applied to every company we acquire.</h2>
      <p>A systems-based framework rather than a set of intentions. It covers finance onboarding, people, legal, go-to-market and technology, and it improves after every acquisition.</p>
    </div>
    <div>
      <div class="grid99" id="grid99" aria-hidden="true">${Array.from({ length: total }, () => '<div class="sq"></div>').join('')}</div>
      <div class="grid g2" style="margin-top:30px">
        ${D.checklist.map(p => `<div><span class="eyebrow" style="margin-bottom:8px">${esc(p.phase)}</span><p style="font-family:var(--mono);font-size:22px;color:var(--ink);margin:0">${p.items.length}</p></div>`).join('')}
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Integration</span><h2>The first ninety days.</h2></div>
    <div class="steps">
      <div class="step"><span class="n">Day 1</span><h4>Nothing changes</h4><div class="dur">For your customers</div><p>No announcement they need to act on. No migration. No new invoice format.</p></div>
      <div class="step"><span class="n">Week 1</span><h4>Introductions</h4><div class="dur">Shared services</div><p>Your named contacts in finance, people and legal, and how to reach them.</p></div>
      <div class="step"><span class="n">Week 2–4</span><h4>Finance onboarding</h4><div class="dur">Led from Lisbon</div><p>Chart of accounts, reporting cadence and the first supported month-end close.</p></div>
      <div class="step"><span class="n">Month 2</span><h4>Go-to-market review</h4><div class="dur">Sales Mastermind</div><p>Pricing history, discount practice, and where the obvious growth is.</p></div>
      <div class="step"><span class="n">Month 3</span><h4>First QBR</h4><div class="dur">Quarterly thereafter</div><p>A working session, not a board performance. The cadence continues indefinitely.</p></div>
    </div>
  </div>
</section>

<section class="sec-bone">
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Shared services</span><h2>Four functions, run once for everyone.</h2></div>
    <div class="grid g4">
      <div class="card rise"><span class="ey">Led from Lisbon</span><h3>Finance</h3><p>Accounting, controls, month-end close, reporting and budgeting. Newly acquired companies are onboarded into the shared function within the first month.</p></div>
      <div class="card rise"><span class="ey">Led from Lisbon</span><h3>People</h3><p>Recruiting, onboarding, HR infrastructure and employment compliance across every jurisdiction in the group.</p></div>
      <div class="card rise"><span class="ey">Led from Salt Lake City</span><h3>Legal</h3><p>Contracts, commercial terms, corporate governance and regulatory questions, in-house rather than at an hourly rate.</p></div>
      <div class="card rise"><span class="ey">Group function</span><h3>AI Innovation Center</h3><p>Shared AI capability available to portfolio product roadmaps, so individual companies do not each have to hire for it.</p></div>
    </div>
  </div>
</section>`;
  return layout({
    title: 'Our Approach — How Solen Operates After Acquisition',
    desc: 'Decentralized operations with shared finance, people, legal and AI functions. The Solen Business System, the first ninety days, and what stays with your team.',
    path: 'approach.html', nav: 'approach', body
  });
}

/* ------------------------------------------------------------------ people */
function people() {
  const byOffice = D.offices.map(o => ({ office: o, members: D.team.filter(t => t.office === o.city) }))
    .filter(g => g.members.length);
  const body = `
<section class="hero">
  <div class="wrap">
    <span class="eyebrow accent">People</span>
    <h1>The people behind the capital.</h1>
    <p class="lede">Our operating team has run vertical software businesses at Constellation Software, Valsoft, Volaris, Lumine Group and Roper Technologies. We have seen this model work at scale, and we are building it deliberately.</p>
  </div>
</section>
${byOffice.map(g => `
<section${g.office.isHQ ? '' : ' class="sec-bone"'} style="padding-top:clamp(44px,5vw,70px);padding-bottom:clamp(44px,5vw,70px)">
  <div class="wrap">
    <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:30px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:16px">
      <h2 style="font-size:clamp(24px,3vw,34px)">${esc(g.office.city)}</h2>
      <span style="font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">${esc(g.office.region)}${g.office.isHQ ? ' · Headquarters' : ''}</span>
      <span style="margin-left:auto;font-family:var(--mono);font-size:14px;color:var(--sun-text)" data-tz="${g.office.tz}">--:--</span>
    </div>
    <div class="grid g3">${g.members.map(m => `
      <div class="card rise" id="${m.name.toLowerCase().replace(/[^a-z]+/g, '-')}">
        <span class="ey">${esc(m.focus)}</span>
        <h3 style="font-size:23px">${esc(m.name)}</h3>
        <p style="font-family:var(--mono);font-size:11.5px;letter-spacing:.06em;color:var(--sun-text);margin:6px 0 14px;flex:none">${esc(m.title)}</p>
        <p>${esc(m.bio)}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`).join('')}
<section>
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Distribution</span><h2>Where the team sits.</h2></div>
    <div class="grid g4">${D.offices.map(o => `
      <div class="card card-bone">
        <span class="ey">${esc(o.region)}</span>
        <h3>${esc(o.city)}</h3>
        <p style="font-family:var(--mono);font-size:28px;color:var(--ink);margin:10px 0 0;flex:none">${D.team.filter(t => t.office === o.city).length}</p>
        <span class="meta"><span data-tz="${o.tz}">--:--</span><span>${o.isHQ ? 'HQ' : ''}</span></span>
      </div>`).join('')}
    </div>
  </div>
</section>`;
  return layout({
    title: 'People — The Solen Software Group Team',
    desc: fitDesc(`${Word(D.team.length)} people across Salt Lake City, Lisbon, New York, Toronto and São Paulo, with backgrounds at Constellation Software, Valsoft and Roper.`),
    path: 'people.html', nav: 'people', body
  });
}

/* ----------------------------------------------------------------- careers */
function careers() {
  // ILLUSTRATIVE ROLES — replace with the live Breezy HR feed before any real use.
  const roles = [
    { title: 'Corporate Development Associate', office: 'Lisbon', team: 'M&A', type: 'Full-time' },
    { title: 'Controller', office: 'Salt Lake City', team: 'Finance', type: 'Full-time' },
    { title: 'Operating Vice President', office: 'Toronto', team: 'Operations', type: 'Full-time' },
    { title: 'Portfolio Leader', office: 'Salt Lake City', team: 'Operations', type: 'Full-time' },
    { title: 'Talent Acquisition Partner', office: 'Lisbon', team: 'People', type: 'Full-time' },
    { title: 'M&A Analyst', office: 'New York', team: 'M&A', type: 'Full-time' }
  ];
  const body = `
<section class="hero">
  <div class="wrap">
    <span class="eyebrow accent">Careers</span>
    <h1>Small team. Unusual amount of ownership.</h1>
    <p class="lede">We hire people who want to run something, not people who want a defined role.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Why here</span><h2>What is actually different.</h2></div>
    <div class="grid g4">
      <div class="card rise"><h3>Long horizons</h3><p>No fund cycle means no pressure to manufacture an outcome by a date. Decisions get made on merit rather than on timing.</p></div>
      <div class="card rise"><h3>Real ownership</h3><p>People here own a domain outright. The team is small enough that there is nowhere to hide and nothing between you and the work.</p></div>
      <div class="card rise"><h3>Many businesses</h3><p>${Word(D.portfolio.length)} companies across ${word(verticals.length)} industries. Few roles anywhere expose you to that much variety this quickly.</p></div>
      <div class="card rise"><h3>No fund politics</h3><p>We are not raising, not reporting to limited partners, and not managing toward a vintage year.</p></div>
    </div>
  </div>
</section>

<section class="sec-bone">
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Open roles</span><h2>Where we are hiring.</h2></div>
    <div class="tbl-wrap" style="background:var(--paper)">
      <table>
        <thead><tr><th>Role</th><th>Team</th><th>Office</th><th>Type</th><th></th></tr></thead>
        <tbody>${roles.map(r => `
          <tr><td class="strong">${esc(r.title)}</td><td>${esc(r.team)}</td><td>${esc(r.office)}</td><td>${esc(r.type)}</td>
          <td style="text-align:right"><a class="arrow-link" style="font-size:13.5px" href="#apply">Apply</a></td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="form-note">Illustrative listings for this concept build. The live feed is maintained on the Solen careers system.</p>
  </div>
</section>

<section id="apply">
  <div class="wrap narrow">
    <div class="sec-head"><span class="eyebrow">Apply</span><h2>Tell us what you want to run.</h2></div>
    <div class="form-ok"><strong>Thank you.</strong><p style="margin:8px 0 0">We read every application ourselves and will come back to you either way.</p></div>
    <form data-validated="careers">
      <div class="grid g2" style="gap:0 22px">
        <div class="field"><label for="c-name">Name *</label><input type="text" id="c-name" name="name" required><div class="errmsg">Required.</div></div>
        <div class="field"><label for="c-email">Email *</label><input type="email" id="c-email" name="email" required><div class="errmsg">A valid email address is required.</div></div>
      </div>
      <div class="field"><label for="c-role">Role of interest</label>
        <select id="c-role" name="role"><option value="">General interest</option>${roles.map(r => `<option>${esc(r.title)} — ${esc(r.office)}</option>`).join('')}</select></div>
      <div class="field"><label for="c-why">Why you *</label><textarea id="c-why" name="why" required></textarea><div class="errmsg">Tell us something.</div></div>
      <button type="submit" class="btn btn-sun">Send application</button>
    </form>
  </div>
</section>`;
  return layout({
    title: 'Careers at Solen Software Group',
    desc: 'We hire people who want to run something. Roles across Salt Lake City, Lisbon, New York and Toronto in M&A, operations, finance and talent.',
    path: 'careers.html', nav: 'careers', body
  });
}

/* ---------------------------------------------------------------- insights */
function insightsIndex() {
  const [lead, ...rest] = D.insights;
  const fmt = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const body = `
<section class="hero" style="padding-bottom:44px">
  <div class="wrap">
    <span class="eyebrow accent">Insights</span>
    <h1>Announcements, and thinking about permanent capital.</h1>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap">
    <a class="card rise" href="insights/${lead.slug}.html" style="padding:clamp(30px,4vw,52px);margin-bottom:24px">
      <span class="ey">${esc(lead.category)} · ${fmt(lead.date)}</span>
      <h3 style="font-size:clamp(26px,3.4vw,40px);max-width:20ch">${esc(lead.title)}</h3>
      <p style="font-size:18px;max-width:60ch;margin-top:10px">${esc(lead.summary)}</p>
      <span class="meta"><span>Read →</span></span>
    </a>
    <div class="grid g3">${rest.map(i => `
      <a class="card rise" href="insights/${i.slug}.html">
        <span class="ey">${esc(i.category)}</span>
        <h3 style="font-size:22px">${esc(i.title)}</h3>
        <p>${esc(i.summary)}</p>
        <span class="meta"><span>${fmt(i.date)}</span></span>
      </a>`).join('')}
    </div>
  </div>
</section>`;
  return layout({
    title: 'Insights — Solen Software Group',
    desc: fitDesc('Acquisition announcements from Solen Software Group, plus perspectives on permanent capital, decentralized operations and what founders should ask any acquirer.'),
    path: 'insights.html', nav: 'insights', body
  });
}

function insightDetail(i) {
  const fmt = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const words = i.body.join(' ').split(/\s+/).length;
  const others = D.insights.filter(x => x.slug !== i.slug).slice(0, 3);
  const body = `
<div class="wrap"><nav class="crumb"><a href="../insights.html">Insights</a> <span>/</span> <span>${esc(i.category)}</span></nav></div>
<section class="hero" style="padding-top:40px;padding-bottom:36px">
  <div class="wrap narrow">
    <span class="eyebrow accent">${esc(i.category)}</span>
    <h1 style="font-size:clamp(32px,4.6vw,56px);max-width:22ch">${esc(i.title)}</h1>
    <p style="font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:22px">
      ${fmt(i.date)} · ${Math.max(1, Math.round(words / 200))} min read</p>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap narrow">
    ${i.body.map(p => `<p style="font-size:19px;line-height:1.68;color:var(--ink-soft);max-width:66ch">${esc(p)}</p>`).join('\n    ')}
  </div>
</section>
<section class="sec-bone">
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">More</span><h2 style="font-size:clamp(24px,3vw,34px)">Also worth reading</h2></div>
    <div class="grid g3">${others.map(o => `
      <a class="card rise" href="${o.slug}.html"><span class="ey">${esc(o.category)}</span><h3 style="font-size:21px">${esc(o.title)}</h3><p>${esc(o.summary)}</p></a>`).join('')}
    </div>
  </div>
</section>`;
  return layout({
    title: fitTitle(i.title, '| Solen'),
    desc: fitDesc([i.summary, i.body[0]]),
    path: `insights/${i.slug}.html`, nav: 'insights', depth: 1, body, ogType: 'article',
    jsonld: { '@context': 'https://schema.org', '@type': 'Article', headline: i.title, datePublished: i.date, description: i.summary, publisher: { '@type': 'Organization', name: 'Solen Software Group' } }
  });
}

/* --------------------------------------------------------------------- hub */
function hub() {
  const inline = {
    portfolio: D.portfolio, team: D.team, offices: D.offices,
    forum: D.forum, checklist: D.checklist
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Portfolio Hub | Solen Software Group</title>
<meta name="description" content="Internal hub connecting portfolio company leaders and staff across the Solen group.">
<meta name="robots" content="noindex,nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@400;450;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css">
<link rel="stylesheet" href="assets/css/hub.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%230F1219'/><circle cx='16' cy='16' r='7' fill='%23C98A1E'/></svg>">
</head>
<body class="hub-body">
<div id="hubApp"></div>
<div class="modal" id="modal"><div class="modal-in"></div></div>
<script>window.SOLEN_DATA = ${JSON.stringify(inline)};</script>
<script src="assets/js/hub.js"></script>
</body>
</html>`;
}

/* --------------------------------------------------------------------- 404 */
function notFound() {
  const body = `<section class="hero" style="min-height:56vh">
  <div class="wrap">
    <span class="eyebrow accent">404</span>
    <h1>That page is not here.</h1>
    <p class="lede">Which is unusual for us — we tend to hold on to things.</p>
    <div class="btn-row"><a class="btn btn-sun" href="${REPO_BASE}index.html">Back to the homepage</a><a class="btn btn-slate" href="${REPO_BASE}portfolio.html">See the portfolio</a></div>
  </div>
</section>`;
  return layout({ title: 'Page not found | Solen Software Group', desc: 'The page you requested could not be found.', path: '404.html', body, noindex: true });
}

/* ------------------------------------------------------------------- write */
function write(rel, html) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
  return rel;
}

const written = [];
written.push(write('index.html', home()));
written.push(write('founders.html', founders()));
written.push(write('advisors.html', advisors()));
written.push(write('portfolio.html', portfolioIndex()));
D.portfolio.forEach(c => written.push(write(`portfolio/${c.slug}.html`, portfolioDetail(c))));
written.push(write('approach.html', approach()));
written.push(write('people.html', people()));
written.push(write('careers.html', careers()));
written.push(write('insights.html', insightsIndex()));
D.insights.forEach(i => written.push(write(`insights/${i.slug}.html`, insightDetail(i))));
written.push(write('404.html', notFound()));
fs.writeFileSync(path.join(ROOT, 'hub.html'), hub());

/* JSON data mirrors, consumed by the Hub at runtime */
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
['portfolio', 'team', 'offices', 'forum', 'checklist', 'insights'].forEach(k => {
  fs.writeFileSync(path.join(ROOT, 'data', k + '.json'), JSON.stringify(D[k], null, 2));
});

/* sitemap + robots */
const BASE = SITE_ORIGIN + SITE_BASE;
const urls = written.filter(f => f !== '404.html').map(f => f === 'index.html' ? '' : f);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${BASE}${u}</loc></url>`).join('\n') + `\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /hub.html\n\nSitemap: ${BASE}sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

/* Cloudflare Pages security headers. Deliberate: the brief this build accompanies
   flags missing CSP across the real portfolio, so shipping without one would be odd.
   'unsafe-inline' is required for the inlined Hub dataset and JSON-LD blocks. */
fs.writeFileSync(path.join(ROOT, '_headers'), `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'
`);

console.log(`Generated ${written.length} pages + ${urls.length} sitemap entries`);
console.log(written.join('\n'));
