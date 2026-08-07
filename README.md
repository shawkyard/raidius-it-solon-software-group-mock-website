# Solen Software Group — website &amp; Portfolio Hub

**A concept build.** This is an unsolicited speculative redesign of a real company's
website, produced as a capability demonstration. It is not affiliated with, endorsed by,
or commissioned by Solen Software Group. See [Content &amp; accuracy](#content--accuracy).

Built for **Bonneville IT** (Jeff Gardner, Farmington, Utah).

---

## What this is

A marketing site plus an authenticated internal **Portfolio Hub** for a permanent-capital
holding company that owns fifteen independent software businesses across eight countries.

The Hub is the point. Solen's operating model deliberately keeps each acquired company
independent — which protects the businesses and isolates the people running them. A CEO in
Mankato solving a compliance problem has no way of knowing a CEO in Los Angeles solved the
same one last quarter. The Hub is connective tissue that does not touch anyone's autonomy.

## Run it

No build tooling, no dependencies, no npm install. Static HTML.

```bash
# view it
python3 -m http.server 8000     # then open http://localhost:8000

# regenerate after changing data or templates
node build/generate.js
```

Node 18+ is the only requirement, and only for regeneration.

## Route map

| Route | Access | Notes |
|---|---|---|
| `/index.html` | Public | Homepage |
| `/founders.html` | Public | Primary conversion path |
| `/advisors.html` | Public | M&A intermediaries |
| `/portfolio.html` | Public | Filterable index, grid + sortable table |
| `/portfolio/{slug}.html` | Public | 15 generated pages |
| `/approach.html` | Public | Operating model, 99-point system, first 90 days |
| `/people.html` | Public | 17 people grouped by office with live local time |
| `/careers.html` | Public | Illustrative roles |
| `/insights.html` | Public | Index |
| `/insights/{slug}.html` | Public | 7 generated articles |
| `/hub.html` | **Authenticated** | Portfolio Hub SPA — `noindex`, excluded from sitemap |
| `/404.html` | — | |

Hub routes are hash-based: `#/dashboard`, `#/directory`, `#/companies`, `#/playbooks`,
`#/forum`, `#/services`, `#/onboarding`, `#/slack`.

## Data model

Everything renders from `build/data.js`. Nothing is hardcoded in a template. Adding a
company to the array and re-running the generator produces its detail page, its mega-menu
entry, its filter counts, its sitemap row and its Hub directory record with no other edits.

| Export | Count | Consumed by |
|---|---|---|
| `portfolio` | 15 | Homepage, portfolio index + details, mega-menu, Hub directory/companies |
| `team` | 17 | People page, Hub directory |
| `offices` | 5 | Footer clocks, people page, Hub header, overlap band |
| `forum` | 8 | Hub leadership forum |
| `checklist` | 99 across 5 phases | Approach page grid, Hub playbooks, Hub onboarding |
| `insights` | 7 | Insights index and detail pages |

`data/*.json` mirrors are emitted for external consumption. The Hub reads its data inlined
into `hub.html` at generation time so it works offline and over `file://`.

### Adding a portfolio company

1. Append an object to `portfolio` in `build/data.js`. Required: `slug`, `name`, `vertical`,
   `tagline`, `description`. Everything else is optional — **sections omit themselves when
   a field is absent**, which is why `thingtech` and `dash` still render as complete pages.
2. Run `node build/generate.js`.
3. Do not invent values to fill gaps. An omitted section is correct; a fabricated fact is not.

## Design system

Defined once in `assets/css/site.css` as custom properties. **No raw hex values appear in
any page body** — verified by the audit below.

| Token | Value | Meaning |
|---|---|---|
| `--ink` | `#0F1219` | Primary text, dark sections |
| `--bone` | `#F7F6F3` | Secondary canvas |
| `--sun` | `#C98A1E` | **Action.** Primary buttons, active nav, one headline accent |
| `--sun-text` | `#8F6110` | AA-safe variant for small text on white |
| `--slate` | `#35526E` | **Structure.** Links, icons, secondary buttons, data |

**The accent rule:** `--sun` means *act on this*. `--slate` means *this is structural*.
They never appear in the same component, and no screenful carries more than one `--sun`
element. `--sun` at `#C98A1E` is used for display sizes and fills only; small text on white
uses `--sun-text`, which clears WCAG AA.

Type: **Instrument Serif** for headings, **Inter** for body and UI, **IBM Plex Mono** for
eyebrows, data labels and metadata. No exceptions anywhere.

Motion: 16px fade-and-rise on scroll entry, 60ms sibling stagger, counters on view. All of
it disabled under `prefers-reduced-motion`.

## Timezone handling

The Hub's booking flow converts between IANA zones using a two-pass offset resolution that
handles DST correctly rather than using fixed offsets. Verified:

| Case | Result |
|---|---|
| Salt Lake City 09:00 → Lisbon, August (MDT/WEST) | 16:00 ✓ |
| Salt Lake City 09:00 → Lisbon, January (MST/WET) | 16:00 ✓ |
| Lisbon 09:00 → Salt Lake City | 02:00 ✓ |
| São Paulo 09:00 → Lisbon | 13:00 ✓ |
| Non-existent local time in a DST spring-forward gap | Resolves without crashing ✓ |

Slots are generated in the host's working hours and displayed in the **viewer's** zone with
the host's time underneath. Booking outside the viewer's own working day raises a specific,
named warning rather than a generic one.

## Replacing mock authentication

`assets/js/hub.js` uses a role picker with three roles and no credential check. Role gating
is enforced **at the route level** (`canAccess()` in `render()`), not merely by hiding
navigation links — `#/forum` is unreachable by direct URL as `portfolio_employee`.

To wire a real identity provider: replace `renderLogin()` and the `state.role` assignment
with an OIDC flow against Microsoft Entra ID or Okta, and map the IdP group claim onto the
three role keys in `ROLES`. Route enforcement needs no changes.

## Environment variables

None are required to run. The following are referenced by integration code paths and
documented in [INTEGRATIONS.md](INTEGRATIONS.md):

| Variable | Purpose |
|---|---|
| `SLACK_TEAM_ID` | Slack deep links (`slack://user?team=…`) |
| `SLACK_WEBHOOK_URL` | Incoming webhook for forum and service-request events |
| `FORM_ENDPOINT` | Public form submissions; absent, forms persist to `localStorage` |

## Audit results

Run against the generated output:

- 32 HTML pages
- 0 broken internal links
- 0 raw hex colours in any page body
- 0 missing or duplicate `<title>`
- 0 titles over 60 characters
- All indexable descriptions within 140–160 characters
- `hub.html` is `noindex`, absent from `sitemap.xml`, and disallowed in `robots.txt`

---

## Content &amp; accuracy

**Everything here was compiled from public sources** — Solen's own website and press
releases, portfolio company websites, public DNS records and LinkedIn. Several details
conflict between sources and some are inferred. Treat nothing here as authoritative.

### CONTENT-TODO — replace before any real use

| Item | Location | Status |
|---|---|---|
| Portfolio facts for all 15 companies | `build/data.js` → `portfolio` | Public sources; verify each |
| `thingtech` and `dash` records | `build/data.js` | Very thin — almost no public information exists |
| Acquisition dates for 6 companies | `build/data.js` | Not publicly stated; omitted rather than guessed |
| Team bios and titles (17 people) | `build/data.js` → `team` | From LinkedIn; verify before publishing |
| Per-office headcounts | `build/data.js` → `offices` | **Estimated.** Group total ~50–60 is the only sourced figure |
| All 8 forum threads | `build/data.js` → `forum` | **Entirely fabricated** for demonstration |
| 3 "Perspectives" articles | `build/data.js` → `insights` | **Written for this build.** Not Solen's words |
| 4 acquisition announcements | `build/data.js` → `insights` | Paraphrased from real press releases |
| The 99 checklist items | `build/data.js` → `checklist` | **Invented.** Only the existence of a 99-point checklist is sourced |
| Slack channel list and member counts | `assets/js/hub.js` → `CHANNELS` | **Fabricated** |
| Notifications | `assets/js/hub.js` → `notifications()` | **Fabricated** |
| Shared-service leads and turnaround times | `assets/js/hub.js` → `SERVICES` | Leads are real people; turnaround times invented |
| Open roles | `build/generate.js` → `careers()` | **Illustrative** |
| Homepage founder quote | `build/generate.js` → `home()` | Real quote, attributed generically as sourced |
| "Revenue grew roughly 40%" (Track Star) | `build/data.js` | From Solen's own case study |
| Per-company shared-services status | `assets/js/hub.js` → `viewCompanies()` | **Derived from acquisition year, not from fact** |

### Specifically not claimed

The site does not assert SOC 2, ISO 27001, or any certification on Solen's behalf. The one
compliance claim present — ViaPeople holding SOC 2 Type I — is verifiable from ViaPeople's
own public trust centre.

## Licence

No licence granted. Concept work prepared for Bonneville IT.
