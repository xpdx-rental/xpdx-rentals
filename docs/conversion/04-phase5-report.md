# Phase 5 report — leads

The one flow that actually makes money. `CLAUDE.md` §9.

---

## 1. The ordering was wrong, and is now enforced

§9 specifies **validate → insert → respond → notify**. What Phase 4 shipped was
validate → insert → *notify* → respond: the notification was awaited before the
201.

That could never have *lost* a lead — the insert came first — but it meant a
slow or dead SMTP host became user-visible latency on the single interaction
this business depends on, and a customer watching a spinner does not know the
difference between "sending" and "broken".

The notification now runs inside `after()`, which Next executes once the
response has been flushed.

The pipeline moved into `lib/leads/submit-enquiry.ts` with **injected
dependencies**, which is what makes the guarantee testable rather than merely
asserted. The route handler is now only the HTTP edge: parse, validate, rate
limit, delegate, respond, schedule.

---

## 2. Proof: the notifier is broken deliberately

The brief asks to break the notification service and show the lead still lands.
`src/lib/leads/submit-enquiry.test.ts` does that in every way a notification can
fail — **17 tests, all passing**:

| What breaks | Asserted |
|---|---|
| Notifier **throws** | Lead still inserted; `runNotify()` resolves, does not reject |
| Notifier **rejects** | Lead still inserted; no error escapes |
| Notifier **hangs forever** | `submitEnquiry` still resolves — raced against a 500ms timeout, so a regression that re-blocks the response fails the test |
| Every channel reports failure | Lead still inserted; no `notified` event recorded |
| One channel dead, one alive | The live channel still sends — `allSettled`, not `all` |
| A channel rejects with a non-Error | Dispatch still resolves to an array |

And the converse, which matters just as much:

- **Insert fails → the customer IS told**, with a 500 and copy that names the
  problem and gives them the phone. Asserted to contain "call us" and asserted
  *not* to contain "something went wrong" — §9's explicit instruction.
- **Insert fails → notify never runs.** No staff alert for a lead that does not
  exist.
- **Insert happens strictly before notify**, asserted by recording call order:
  at the moment the route is ready to respond, the notify has not run.

---

## 3. Anti-spam: honeypot and timing, no CAPTCHA

§9: *"Honeypot field plus a timing check. No CAPTCHA unless spam actually
appears — it costs conversions."*

**Turnstile is gone** — the dependency, the module, the env vars and the
orphaned form kit that still referenced it. The site now has no CAPTCHA at all.

Spam is **quarantined, not rejected**: stored with `status = 'spam'` and still
acknowledged with success. Two reasons, both tested:

1. A bot is never taught what tripped the filter.
2. A false positive is still captured and still visible to staff in the Spam
   tab. A rejected false positive is a lost customer; a quarantined one is a
   phone call.

Rate limited 5 per 10 minutes by IP **and** by phone — by phone as well because
a single bad actor behind CGNAT shares an IP with real customers.

Only a salted `ip_hash` is stored, never a raw IP, asserted by a test that scans
the serialised row for anything IP-shaped.

---

## 4. Channels: adding one is an adapter, not a rewrite

§9 asked for the notification path to be behind a clean interface so a WhatsApp
or SMS hook is one adapter later. `lib/leads/channels.ts` defines the contract:

1. **Never throw** — return a result, do not raise.
2. **Never block another channel** — dispatched with `allSettled`.
3. **Report honestly** — `sent: false` with a reason, recorded on the lead
   timeline, so "notified" means notified.

Adding SMS is a new object in `CHANNELS` and nothing else changes.

---

## 5. `tel:` and `wa.me` clicks are now tracked

§9: *"`tel:` and `wa.me` clicks are conversions too. Track them."* They were not
— `/api/v1/cta-clicks` existed but nothing called it after the car-sales VDP was
deleted, so every phone conversion was invisible.

`components/public/contact-link.tsx` wraps those links: `sendBeacon` (which
survives the dialler tearing the page down), falling back to a `keepalive`
fetch, plus a `contact_click` GTM event. Nothing is awaited and nothing can
block or prevent the navigation — if tracking fails the customer still calls,
which is the only outcome that matters.

Wired into the sticky bar, the header, and the van detail page (with `vanId`, so
phone conversions are attributable per van).

---

## 6. Verified live

Against a production build, with no database attached:

| Request | Result |
|---|---|
| `{}` | 400, field-level errors for every missing field |
| Bad phone | 400 "Please enter a valid Australian phone number" |
| Bad email | 400 "Please enter a valid email address" |
| `consent: false` | 400 "Please agree to be contacted about this enquiry" |
| Malformed JSON | 400 "We could not read that request." |
| Valid payload | 500 "We could not save your enquiry. Please call us and we'll take the details." |

That last row is the useful one. With no database the insert genuinely fails,
and the customer gets §9's failure copy — states what happened, gives them a way
through — rather than a bare error or, far worse, a false success.

---

## 7. Also cleaned up

- `lib/leads/notify.ts` — orphaned by `channels.ts`.
- `components/leads/lead-form-kit.tsx` — an unreferenced car-sales form kit that
  was the last thing importing Turnstile.
- The API-usage provider registry still listed **Typesense, Turnstile, Sentry, a
  geocoder, Google Merchant and Meta Catalog** — every one removed in an earlier
  phase. Trimmed to what actually exists (SES and Supabase), and its tests
  updated. Two of those tests were asserting against a vendor's current pricing
  plan, which would fail whenever the vendor changed it; they now assert the
  arithmetic against a synthetic provider.

**One note on process:** my first attempt at trimming that registry used a
regex that over-matched and emptied both arrays. Typecheck stayed clean — empty
arrays are valid — and only the test suite caught it. Reverted and redone with a
brace-matching parser.

---

## 8. Still outstanding

- **End-to-end proof against a real database.** Everything above proves the code
  contract. What it does not prove is that a row reaches Postgres, because there
  is no Postgres — migration 0019 is unapplied pending Q2. The §12 criterion
  *"Lead submitted with the notification service deliberately broken → still in
  the DB"* is proved at the code level and still needs the live confirmation.
- **SMTP is unconfigured**, so the email channel currently reports
  `smtp_not_configured` and no staff alert is sent. Sending identity, SPF, DKIM
  and DMARC are Phase 7 / infra (`REBRAND.md` §7).
- **No notification recipients configured** — `settings.notification_recipients`
  is seeded empty. Until someone sets it, a genuine lead lands in the database
  and the inbox but emails nobody.
