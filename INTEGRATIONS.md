# Integrations — status and what each one needs

Every integration below is either **LIVE** (genuinely working) or **MOCK** (a functional
interface over seeded data). Nothing in this build silently no-ops while appearing to work.
Where something is mocked, the exact credential and API call needed to make it real is named.

---

## Slack

### Deep links — LIVE (logic), needs one variable
`assets/js/hub.js` → `openSlack()`

Every directory entry and channel tile opens a `slack://` deep link with an
`https://slack.com` fallback for users without the desktop app. The link construction is
real. It cannot resolve to an actual person until two things exist:

- `SLACK_TEAM_ID` — the workspace ID, currently rendered as a visible `${SLACK_TEAM_ID}`
  placeholder so the gap is obvious rather than hidden.
- A Slack user ID per directory record. Add a `slackUserId` field to `team` and to
  portfolio leader records in `build/data.js`, populated from `users.list`.

The modal shows the exact link that *would* be opened. That is deliberate — it demonstrates
the mechanism honestly instead of pretending to launch Slack.

### Channel directory — MOCK
`assets/js/hub.js` → `CHANNELS`

Eight cross-group channels plus one per portfolio company, with member counts. All
fabricated. Replace with a `conversations.list` call using a bot token with
`channels:read`. Member counts come from `conversations.info` with `include_num_members`.

### Event notifications — LIVE logic, credential absent
Forum replies, shared-service requests and onboarding milestones are the intended triggers.
Set `SLACK_WEBHOOK_URL` to post them. With the variable absent the payload is logged to the
console rather than failing silently, and the Hub's Slack page states plainly that no
workspace is connected.

**Not built:** OAuth install flow. The "Connect Slack" button opens an explanatory modal
rather than pretending to authenticate.

---

## Scheduling &amp; calendar

### Timezone conversion — LIVE
`assets/js/hub.js` → `tzOffset()`, `zonedTimeToInstant()`

Genuinely correct, and the most important technical detail in the build. Uses
`Intl.DateTimeFormat` with IANA zone identifiers and a two-pass offset resolution that
handles DST transitions, including non-existent local times inside a spring-forward gap.
No fixed offsets anywhere.

Verified: SLC 09:00 → Lisbon 16:00 in both August and January; Lisbon 09:00 → SLC 02:00;
São Paulo 09:00 → Lisbon 13:00; a 02:30 booking on a US spring-forward date resolves
without crashing.

### Availability — MOCK
Working hours are assumed to be 09:00–18:00 local, Monday to Friday, for everyone. Slots
are generated for the next working day in the host's own zone.

Replace with a real free/busy query:
- Microsoft 365 → Graph `/me/calendar/getSchedule`
- Google Workspace → Calendar API `freebusy.query`

Both need delegated or application permissions and a per-person calendar identifier. Add a
`calendarId` field alongside `slackUserId`.

### .ics generation — LIVE
`assets/js/hub.js` → `confirmBooking()`

Produces a valid RFC 5545 `VCALENDAR` with UTC timestamps and downloads it. This genuinely
works and opens in a calendar application.

**Not built:** sending the invitation to both parties. That requires a mail transport or
calendar write scope.

---

## Authentication

### Role-based access — MOCK auth, LIVE enforcement
`assets/js/hub.js` → `renderLogin()`, `canAccess()`, `render()`

Three roles: `solen_team`, `portfolio_leader`, `portfolio_employee`. No credentials are
checked; the role persists in `localStorage`.

**Route enforcement is real.** `canAccess()` is evaluated inside `render()` before a view is
constructed, so `#/forum` is unreachable by direct URL as `portfolio_employee` — the
restriction is not merely a hidden navigation link.

To make authentication real, replace `renderLogin()` with an OIDC redirect against Entra ID
or Okta and map the group claim onto the three role keys. No changes to enforcement needed.

---

## Shared services requests — MOCK
`assets/js/hub.js` → `viewServices()`

Requests persist to `localStorage` with a generated reference and an Open status. Nothing is
transmitted. Route to a real ticketing system (Jira Service Management, Zendesk, Freshservice)
via its create-issue endpoint, and post the resulting reference back to Slack using the
webhook above.

---

## Public forms — LIVE with local fallback
`assets/js/site.js` → the `form[data-validated]` handler

Client-side validation, inline errors, loading state and confirmation are all real. With no
`FORM_ENDPOINT` configured, submissions persist to `localStorage` under `solen_submissions`
so the flow is demonstrable end to end. Point `FORM_ENDPOINT` at a real handler to send them.

Inspect captured submissions in the browser console:

```js
JSON.parse(localStorage.getItem('solen_submissions'))
```

---

## Checklist state — LIVE, local only
The 99-point checklist persists to `localStorage` and survives reload. It is per-browser,
not per-company and not shared. Real use needs a backend keyed by company.

---

## Not built at all

Named here so nothing is mistaken for working:

- Full-text search across the site
- Real forum posting or replies (threads are read-only seeded data)
- Email notifications of any kind
- Document upload or storage in the playbook library
- Any server-side component whatsoever — this is a static site

---

## Summary

| Integration | Status | Needed to go live |
|---|---|---|
| Slack deep links | LIVE logic | `SLACK_TEAM_ID` + per-person `slackUserId` |
| Slack channel list | MOCK | Bot token, `conversations.list` |
| Slack notifications | LIVE logic | `SLACK_WEBHOOK_URL` |
| Slack OAuth install | Not built | — |
| Timezone conversion | **LIVE** | Nothing |
| Availability slots | MOCK | Graph `getSchedule` or Calendar `freebusy` |
| .ics download | **LIVE** | Nothing |
| Calendar invitations | Not built | Mail transport or calendar write scope |
| Authentication | MOCK | OIDC against Entra ID or Okta |
| Route-level role gating | **LIVE** | Nothing |
| Service requests | MOCK | Ticketing system endpoint |
| Public forms | LIVE + local fallback | `FORM_ENDPOINT` |
| Checklist persistence | LIVE, local only | Backend keyed by company |

---

## Support portal (`support.html`)

### AI first response — LIVE, rules-based
`assets/js/support.js` → `RULES`, `triage()`

Genuinely working, and deliberately **not** a hosted language model. It is a keyword rules
engine that runs locally: instant, works offline, costs nothing, and cannot invent a remedy it
has no basis for. Nine rule sets cover security, multi-person outage, access/password, email,
connectivity, performance, printing, voice and applications, with a generic fallback.

It sets a **priority floor** — security and outage reports are forced to P1 regardless of what
the reporter chose — while still honouring a reporter who rates something more urgent than the
rules do.

To swap in a hosted model: replace the body of `triage()` with a call to your provider and keep
the same return shape (`{ pri, cat, read, steps }`). Keep the rules engine as the fallback for
when the API is slow or unavailable — a helpdesk that stops triaging when an API times out is
worse than one that never called an API. The UI already labels output as an automated first
response, so no copy changes are needed.

### SLA countdown — LIVE
Response deadlines are computed from the ticket's creation timestamp against the P1–P4 targets,
and the countdown re-renders every ten seconds. Breach state is real, not decorative. The
refresh deliberately skips re-rendering while a field has focus or a reply is part-written.

### Localisation — LIVE
`assets/js/i18n.js`. Eight complete language packs with automatic detection from
`navigator.language`, exact-tag matching before base-language matching, a manual switcher, and
English fallback for any missing key.

### Authentication — MOCK
Two roles, no credential check, persisted in `localStorage`. Replace with the same OIDC flow
described above for the Hub. Note the portal currently does **not** enforce roles at the route
level the way the Hub does — an employee cannot reach the queue through the UI, and the router
redirects them, but this needs real server-side authorisation before it handles real tickets.

### Ticket storage — MOCK
`localStorage` only. Nothing is transmitted. Tickets, replies and read state are per-browser
and will not appear on another device. Wire to a real ticketing backend, or to Jeff's PSA
(Autotask, ConnectWise, HaloPSA, Syncro) via its API.

### Notifying Jeff — NOT BUILT
The portal shows an in-app notification badge and count, which is real UI over local data. It
does **not** send anything. For a real deployment Jeff needs at minimum:

- an email or SMS on every P1 at creation, not on a polling interval;
- a push or Slack message on P1/P2;
- an escalation if a P1 is unacknowledged at 10 minutes, i.e. before the 15-minute target is
  missed rather than after.

That last one is the difference between a tight SLA and a stated SLA. The `SLA` object in
`support.js` is the single place those thresholds are defined.

### Summary

| Feature | Status | Needed to go live |
|---|---|---|
| AI first response | **LIVE** (rules) | Optional: hosted model, keeping rules as fallback |
| Priority floor on security/outage | **LIVE** | Nothing |
| SLA countdown and breach state | **LIVE** | Nothing |
| Eight-language localisation | **LIVE** | Native review of each pack |
| Real logo and branding | **LIVE** | Nothing |
| Authentication | MOCK | OIDC + server-side authorisation |
| Ticket storage | MOCK | Ticketing backend or PSA API |
| Notifying Jeff | Not built | Email/SMS/Slack on P1 + unacknowledged escalation |
