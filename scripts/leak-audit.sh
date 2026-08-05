#!/usr/bin/env bash
# REBRAND.md §9 — final leak audit.
#
# Every line verified, not assumed. Checks the SOURCE TREE and the BUILT BUNDLE,
# because a brand string can survive minification inside a template literal or a
# string-keyed lookup long after it has left the source you were reading.
#
#   npm run build && bash scripts/leak-audit.sh
#
# NOTE ON THE SEARCH TOOL. REBRAND.md specifies `rg`, but `rg` is not always on
# PATH for a spawned script even when it is available interactively — on the
# machine this was written on it was not, and the first version of this script
# reported a clean PASS having searched nothing at all. A missing search tool
# must fail loudly, never quietly return no matches. The control check below
# asserts that, and `grep -rinE` is used when `rg` is absent. A second control
# asserts the fallback is actually case-insensitive — it was not, for a while,
# and that alone hid a leak through a full PASS.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
warned=0
hit()  { printf '  FAIL  %s\n' "$1"; fail=1; }
ok()   { printf '   ok   %s\n' "$1"; }
# A known, documented deferral. Reported loudly on every run so it cannot be
# forgotten, but it does not fail the gate — a check that is always red trains
# people to stop reading it.
warn() { printf '  WARN  %s\n' "$1"; warned=1; }

if command -v rg >/dev/null 2>&1; then SEARCH=rg; else SEARCH=grep; fi

# search <pattern> <path...> — case-insensitive, recursive, prints file:line.
search() {
  local pat="$1"; shift
  local paths=()
  for p in "$@"; do [ -e "$p" ] && paths+=("$p"); done
  [ ${#paths[@]} -eq 0 ] && return 0
  if [ "$SEARCH" = rg ]; then
    rg -i -n --hidden --glob '!.git' --glob '!node_modules' "$pat" "${paths[@]}" 2>/dev/null || true
  else
    # `-i` (ignore case) is NOT optional and is easy to lose next to `-I`
    # (binary-files=without-match), which is a different flag. An earlier
    # version of this line had `-rInE` and no `-i`: on any machine without
    # `rg` — which is this one — every check below silently became
    # case-sensitive, and `sender_name = "Cars365"` sat in supabase/config.toml
    # through a full PASS. The case-fold control below fails the run if this
    # regresses.
    grep -rinE --binary-files=without-match \
      --exclude-dir=.git --exclude-dir=node_modules "$pat" "${paths[@]}" 2>/dev/null || true
  fi
}

# searchcs <pattern> <path...> — same, but CASE-SENSITIVE. Two checks below
# distinguish an identifier from prose using capitalisation alone (`VehicleCard`
# vs "our vehicles", `Card` vs "card"). Folding case destroys that distinction
# and makes them fire on the client's own approved copy, so they use this.
searchcs() {
  local pat="$1"; shift
  local paths=()
  for p in "$@"; do [ -e "$p" ] && paths+=("$p"); done
  [ ${#paths[@]} -eq 0 ] && return 0
  if [ "$SEARCH" = rg ]; then
    rg -n --hidden --glob '!.git' --glob '!node_modules' "$pat" "${paths[@]}" 2>/dev/null || true
  else
    grep -rnE --binary-files=without-match       --exclude-dir=.git --exclude-dir=node_modules "$pat" "${paths[@]}" 2>/dev/null || true
  fi
}

count()   { local pat="$1"; shift; search   "$pat" "$@" | wc -l | tr -cd '0-9'; }
countcs() { local pat="$1"; shift; searchcs "$pat" "$@" | wc -l | tr -cd '0-9'; }

# Drops hits that are explanatory comments. A comment recording "the finance
# funnel was removed here" is documentation; a STRING or identifier carrying the
# same word is a leak. Matches comment bodies after the `path:line:` prefix.
strip_comments() {
  grep -vE '^[^:]+:[0-9]+:[[:space:]]*([*]|/[*]|//|#|--)' || true
}

# Drops this script and the conversion write-ups, which quote every pattern.
strip_selfrefs() {
  grep -v -e 'leak-audit' -e 'docs/conversion' -e 'docs\\conversion' || true
}

none() {
  local label="$1" pat="$2"; shift 2
  local out
  out=$(search "$pat" "$@" | strip_comments | strip_selfrefs)
  if [ -n "$out" ]; then
    hit "$label"
    printf '%s\n' "$out" | head -8 | sed 's/^/        /'
  else
    ok "$label"
  fi
}

echo "── Search tool control ──────────────────────────────────────"
sanity=$(count 'XPDX' src)
if [ "${sanity:-0}" -gt 0 ]; then
  ok "$SEARCH works (control: 'XPDX' matches $sanity lines in src)"
else
  hit "$SEARCH found no 'XPDX' in src — the tool is broken and every result below would be meaningless"
  echo "LEAK AUDIT: ABORTED"
  exit 1
fi

# Case-fold control. Every pattern below is written lowercase and relies on the
# search being case-insensitive; a brand name in a config file is capitalised.
# Search for a string that exists in the tree ONLY in mixed case.
fold=$(count 'xpdx rentals' src)
if [ "${fold:-0}" -gt 0 ]; then
  ok "search is case-insensitive (control: lowercase 'xpdx rentals' matches $fold lines)"
else
  hit "search is CASE-SENSITIVE — every lowercase pattern below would miss a capitalised leak"
  echo "LEAK AUDIT: ABORTED"
  exit 1
fi

echo
echo "── Source tree ──────────────────────────────────────────────"
none "no cars365 / car365 / cars-365"        'cars?-?365'  src public supabase/config.toml supabase/functions scripts package.json next.config.ts .env.example
none "no dealership / showroom / test drive" 'dealership|showroom|test.drive|drive.away'  src public
none "no repayment / trade-in"               'repayment|trade-in'  src public
none "no odometer"                           'odometer'  src
none "no vendor"                             'vendor'  src
none "no other-client contact details"       '61451344477|1800 ?CAR|cars365\.info|Granville'  src public supabase/config.toml

# CLAUDE.md §12: "zero references to cars, sales, finance, dealers". These are
# checked as words in code and copy — `strip_comments` already exempts the
# engineering history in doc comments, which is deliberately kept. Word
# boundaries matter: `cargo`, `carry`, `Card` and `Carousel` must not match
# (REBRAND.md §1), and the counts below prove they still don't.
none "no 'cars' / 'used-cars' outside comments"  '\bcars\b|\bused-cars?\b'  src public supabase/config.toml next.config.ts package.json
none "no 'sales' outside comments"               '\bsales\b|\bsalesperson\b'  src public supabase/config.toml
none "no 'finance' outside comments"             '\bfinanc(e|ing|ial)\b'  src public supabase/config.toml
none "no 'dealer' outside comments"              '\bdealers?\b|\bdealership\b'  src public supabase/config.toml

echo
echo "── Historical migrations 0001–0018 ──────────────────────────"
# Forward-only and already applied, so they are not edited (CLAUDE.md §9).
# They DO still carry the other client's naming. Surfaced separately rather than
# hidden, because the fix is a decision — see docs/conversion/06-phase7-report.md.
oldmig=$(search 'cars?-?365' supabase/migrations | grep -v '0019_' | strip_comments)
if [ -n "$oldmig" ]; then
  n=$(printf '%s\n' "$oldmig" | wc -l | tr -cd '0-9')
  warn "historical migrations still name the other client ($n line(s)) — MUST be resolved before handover, see docs/conversion/06-phase7-report.md"
  printf '%s\n' "$oldmig" | head -4 | sed 's/^/        /'
else
  ok "no other-client naming in migrations"
fi

echo
echo "── Built bundle (.next) ─────────────────────────────────────"
if [ -d .next ]; then
  # Served assets only. `.map` files are excluded here and checked below —
  # they are not sent to browsers, but they do travel with a deployment.
  # -i as well as -I here, for the same reason as `search()` above: `-I` is
  # binary-files, `-i` is ignore-case, and only one of them was present.
  served=$(grep -rIloEi 'cars?-?365|61451344477' .next/static .next/server \
             --include='*.js' --include='*.css' --include='*.html' 2>/dev/null || true)
  if [ -n "$served" ]; then
    hit "brand or other-client strings in SERVED build output"
    printf '%s\n' "$served" | head -5 | sed 's/^/        /'
  else
    ok "no cars365 or other-client phone in served build output"
  fi

  maps=$(grep -rIloEi 'cars?-?365' .next --include='*.map' 2>/dev/null || true)
  if [ -n "$maps" ]; then
    hit "brand strings in sourcemaps (not served, but they ship with a deploy)"
    printf '%s\n' "$maps" | head -3 | sed 's/^/        /'
  else
    ok "no brand strings in sourcemaps"
  fi

  none "no old brand yellow in bundle"   'FFCC00'       .next/static
else
  hit "no .next — run a build first"
fi

echo
echo "── Proof nobody ran a blind 'car' replace (REBRAND.md §9) ───"
# These MUST be non-zero: Card is shadcn, cargo is core domain vocabulary,
# carry is ordinary English. Zero here means someone replaced the substring.
for token in Card Cargo cargo carry; do
  n=$(countcs "$token" src)
  if [ "${n:-0}" -gt 0 ]; then
    ok "'$token' returns $n hits — not blind-replaced"
  else
    hit "'$token' returns nothing — a blind 'car' replace may have run"
  fi
done

echo
echo "── 'vehicle' as an IDENTIFIER, not as prose ─────────────────"
# REBRAND.md §1: "`vehicle` is legitimate in customer copy, wrong in code." The
# client's own approved copy says "commercial vehicle rental", so prose hits are
# correct and must NOT fail. What must not exist is `vehicle` as an identifier:
# a column, table, type, component or route. Those are what this matches.
#
#   vehicle_id / vehicles table refs / VehicleCard / vehicleId / used-cars
v=$(searchcs 'vehicle_[a-z]|from\(.(vehicles|vehicle_images|vehicle_features).\)|[A-Za-z]Vehicle|Vehicle[A-Z(]|vehicle(Id|Slug|Title|Card)|/used-cars' src \
     | strip_comments || true)
if [ -z "$v" ]; then
  ok "no 'vehicle' identifiers — prose usages are correct and were not counted"
else
  hit "'vehicle' used as an identifier"
  printf '%s\n' "$v" | head -8 | sed 's/^/        /'
fi

echo
if [ "$fail" -ne 0 ]; then
  echo "LEAK AUDIT: FAIL"
elif [ "$warned" -ne 0 ]; then
  echo "LEAK AUDIT: PASS with warnings — the WARN lines above still block handover"
else
  echo "LEAK AUDIT: PASS"
fi
exit "$fail"
