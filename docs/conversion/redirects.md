# 301 map — xpdx.com.au WordPress → new site

Required by `CLAUDE.md` §10 and the Phase 6 brief: *"Crawl the live xpdx.com.au
WordPress site first and produce docs/conversion/redirects.md before writing any
redirect."*

---

## 1. ⚠ The crawl did not happen. Read this before trusting anything below.

**`xpdx.com.au` is unreachable from this environment.** Both routes were tried:

| Method | Result |
|---|---|
| `WebFetch https://xpdx.com.au` | `connect ECONNREFUSED 77.37.37.225:443` |
| `WebFetch https://www.xpdx.com.au` | `connect ECONNREFUSED 77.37.37.225:443` |
| `WebFetch https://xpdx.com.au/about-us/` | `connect ECONNREFUSED 77.37.37.225:443` |
| `curl` / `nslookup` from the build host | DNS times out — no egress at all |

`ECONNREFUSED` means the host was reached and refused the connection on 443, so
this is either the origin refusing our IP range or the site being down on that
address. Either way **no crawl was possible**, and what follows is a
search-derived inventory, not a crawl.

**This file is therefore incomplete and must not be treated as the redirect
map.** Google only surfaces what it has indexed and chosen to show; a WordPress
site almost always carries more URLs than that — category and tag archives,
attachment pages, paginated archives, `?p=` permalinks, `/privacy-policy/`,
`/terms/`, and individual vehicle pages.

**Run the real crawl before cutover** (§8 of `REBRAND.md` calls this "the only
chance to capture what's indexed"):

```bash
# From a machine that can reach the site.
wget --spider -r -l 10 --no-parent -o crawl.log https://xpdx.com.au/
grep -Eo 'https?://[^ ]*xpdx\.com\.au[^ ]*' crawl.log | sort -u > old-urls.txt

# And the two sources a crawl cannot give you:
#   1. Search Console → Pages → all indexed URLs (export)
#   2. The WordPress sitemap, usually one of:
curl -s https://xpdx.com.au/wp-sitemap.xml
curl -s https://xpdx.com.au/sitemap_index.xml   # Yoast / Rank Math
```

Then complete §4 and add entries to `redirects()` in `next.config.ts`.

---

## 2. What is known, and how

Four independent web searches returned a consistent set of **exactly four**
indexed URLs. Consistency across independent queries is weak evidence the site
is small, but it is not proof of completeness.

| Old URL | Indexed title |
|---|---|
| `https://xpdx.com.au/` | Rental Vans in Sydney \| Condell Park \| XPDX Rentals |
| `https://xpdx.com.au/about-us/` | About Our Van Hire Team \| What We're About \| XPDX Rentals |
| `https://xpdx.com.au/contact-us/` | Contact Xpdx Rentals for Van Hire Help \| Call or Email |
| `https://xpdx.com.au/business-van-rental/` | Easy Business Van Rental Solutions \| XPDX Rentals |

---

## 3. Mapping — and why it is almost a no-op

The Phase 4 route list was designed against `CLAUDE.md` §8, which happens to use
the same slugs the live site already uses. Three of the four old URLs therefore
map onto an existing route with **no redirect entry required**: Next's default
`trailingSlash: false` normalises them.

Verified against a production build:

| Old URL | Status | Lands on | Needs a config entry? |
|---|---|---|---|
| `/` | 200 | `/` | No |
| `/about-us/` | **308** | `/about-us` | No — automatic |
| `/contact-us/` | **308** | `/contact-us` | No — automatic |
| `/business-van-rental/` | **308** | `/business-van-rental` | No — automatic |

Next emits **308**, not 301. Google treats 308 as a permanent redirect
equivalent to 301 for indexing purposes, so this is fine; if you would rather
see literal 301s for the benefit of older tooling, that is a `next.config`
change, not a code change.

**No entry in `redirects()` is needed for any currently-known URL.** The three
inherited Cars365 redirects (`/account/listings`, `/account(.*)`, `/vendor(.*)`)
were removed in Phase 6: no XPDX URL has ever used those paths, one pointed at a
route deleted in Phase 3, and all three advertised the staff portal from public
URLs.

---

## 4. To complete after the crawl

For each old URL, map to the closest genuinely relevant page. **Nothing
bulk-redirects to `/`** — Google reads a mass redirect to the home page as a
soft 404 and drops the ranking (`REBRAND.md` §8).

Likely candidates to look for, with the destination each should take:

| Expected old pattern | Destination | Notes |
|---|---|---|
| `/local-van-hire/` or similar | `/local-van-hire` | A service page exists for this |
| `/delivery-van-for-rent/`, `/courier-van/` | `/delivery-van-for-rent` | Service page exists |
| Individual van pages | `/vans/<slug>` | Match on model, not on position |
| `/privacy-policy/` | `/privacy-policy` | Currently a `noindex` placeholder — see below |
| `/terms/`, `/terms-and-conditions/` | `/terms-of-hire` | Same caveat |
| `/faq/`, `/faqs/` | `/faq` | |
| `/blog/*`, `/category/*`, `/tag/*` | Case by case | Never bulk to `/` |
| `/?p=<id>` permalinks | Resolve individually | WordPress default permalinks |
| `/wp-content/uploads/*` | Leave alone or 410 | Do not redirect assets to pages |

⚠ **`/privacy-policy` and `/terms-of-hire` are `noindex` placeholders** until the
client supplies the text (Phase 4 report §4). If the WordPress site has real
versions of these and they are indexed, redirecting an indexed page to a
`noindex` placeholder **loses the page**. Either publish the real text before
cutover, or point those redirects at `/contact-us` until it exists.

---

## 5. Discrepancies the crawl already exposed

Search snippets from the live site contradict `CLAUDE.md` §3 in three places.
§3 is the authorised source, so the new site follows it — but the client should
know their current site says otherwise, because customers will have read it.

| Live site says | §3 says | Handled how |
|---|---|---|
| "daily, weekly, or monthly rental options" | **28 days minimum, everywhere** | New site says 28 days. §3 records this as already resolved with the client. |
| "three well-maintained vans" | **Six vans** | New site seeds six. Worth confirming the fleet size is now six. |
| "refrigerated vans", "extra-long wheelbase" available on request | Not mentioned | **Not published** on the new site — §1.6 forbids publishing an unverified capability. `TODO(client)`. |
| Serves "Greenacre and Condell Park" | Approved for use within NSW | `/service-area` says NSW and lists nearby suburbs as geography, not coverage. |

Confirmed consistent: the address `16 Ilma Street, Condell Park NSW 2200`, the
phone `0433 418 566`, and `info@xpdx.com.au`.

---

## 6. Cutover checklist (from `REBRAND.md` §8)

- [ ] Full crawl + Search Console export, before touching DNS.
- [ ] Complete §4 of this file and add the entries.
- [ ] Full WordPress backup, downloaded and verified.
- [ ] Confirm MX records for `info@xpdx.com.au` and **carry them across
      unchanged** — changing nameservers without MX kills their email.
- [ ] Lower DNS TTL to 300s at least 48h ahead.
- [ ] Spot-check 20 redirects post-cutover, including the deepest URLs.
- [ ] Keep the WordPress install running, untouched, for 30 days.
