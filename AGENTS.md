# Editing Personal Space

User intent: this public GitHub repository is the shared code home for any authorized AI tool. The live frontend belongs on GitHub Pages, without redirecting users to Apps Script.

## Routine model (schema 40, since 2026-10-05)

The dashboard is a deadline-driven routine tracker, not a 1-10 metrics scorer.

- 7 routine items, each with a weekly schedule and deadline (America/New_York):
  1. Water bottle — Mon–Fri — due 21:00 — "Filled and in the fridge"
  2. Drink / snack — Mon–Fri — due 21:00
  3. Car charging — Mon–Fri — due 21:00 — "Plugged in"
  4. Laundry started — Sat–Sun — due Sun 12:00
  5. Laundry washed & dried — Sat–Sun — no hard deadline, follows item 4
  6. Laundry folded & put away — Sat–Sun — due Sun 21:00
  7. Verse + takeaway — daily — due 21:00
- Protocol: `action=add` with `t`=ISO UTC timestamp, `schema=40`, `code`=item id ("1"–"7"), `notes={"na":["done"]}` for done or `{"na":[]}` for undone. Latest event per item per cycle wins; second tap undoes.
- IMPORTANT backend constraint: the deployed Code.gs sanitizes the Details column to `{na:[...]}` only — any extra key (e.g. `state`) is silently dropped server-side and never comes back on `list`. State is therefore encoded in `na` (`"done"` present = done, empty = undone/cleared). Do NOT write a `state` key expecting it to persist.
- Status per scheduled day: done on time (at/before deadline), late (after), missed (past deadline + 30 min grace with no done event), upcoming. Streaks count consecutive on-time scheduled days.
- Old schemas 7/28/31 are read by the Ratings view (added 2026-10-04); see below. Never reinterpret old rating codes — the original encode/decode is restored verbatim in index.html.

## Ratings view (schema 31, since 2026-10-04)

A secondary tab next to the routine home, framed as a weekly review (pairs with the Sunday reset) — not a daily obligation. The routine tracker owns the daily flow.

- The original 22 metrics in their original order/ids (floor, hygiene, laundry, vehicle, homework, business, faith, swept, putaway, bedmade, bedding, nightstand, smart, electronics, charging, camera, interior, exterior, packed, food, clothes, equipment), grouped Room / Space / Car / Tasks and habits / Tomorrow. Order and ids must stay verbatim so history stays continuous and comparable.
- Interaction mirrors the rest of the app: tap a number to set, tap again to clear, keyboard arrows/Home/End/digits/Backspace, N/A checkbox on the six Tomorrow "packed" slots (charging, camera, packed, food, clothes, equipment) which displays 10 but excludes the slot from the score. Instant save through the existing offline pending queue and sync indicator.
- Write protocol (original, verbatim): `action=add` with `t`=ISO UTC, `schema=31`, `code`=(22 score digits, each `score-1`, unrated `'0'`) + (7-digit rated bitmask) + (2-digit excluded bitmask), `notes={"na":[...slot ids]}`. Skips the save when the code is identical to the last pending/confirmed row (dedupe).
- Read protocol (original, verbatim): strips non-digits, pads to max(schema, len); s=28 rows decode na from `code[22+i]==='1'`; s=31 rows set `partial=true`, `rated=Number(code.slice(22,29))`, na from the 2-digit excluded bitmask; plain 22-digit codes decode directly. CRITICAL: the ratings reader must skip schema-40 rows (`Number(raw.s) === 40` → null) — routine events now share the same `confirmed`/`pending` lists and would otherwise parse as bogus all-1 ratings. The routine reader already ignores non-40 schemas.
- Draft behavior: opening the Ratings tab prefills from the latest logged values; switching tabs re-inits only if the draft is untouched (rDirty flag), so in-progress edits survive a tab switch.
- Voice for ratings is out of scope. Do not touch Code.gs for ratings work — its generic add API accepts schema 31 unchanged.

## Editing rules

- Edit index.html for layout, wording and interaction changes. Main publishes automatically to GitHub Pages.
- Preserve instant tap input, second-tap undo, the offline pending queue, voice input with review-before-save (never silently invent updates), compact mobile controls (min 56px targets), and accurate Sheet sync status.
- Keep credentials out of this public repository. Do not widen Google Sheet or Apps Script permissions.
- Code.gs changes are not deployed by GitHub Pages. If a backend change is ever needed, update BOTH Apps Script deployments to the same version and verify live saving. Keep the connection deployment Only myself and the keyed API session tokens protected. Preserve owner identity checks, server-side token expiry, and credential-free public source.
- The two exec URLs in index.html have fixed roles: `SHEET_APP` (owner-only deployment) issues 7-day session tokens via the connect flow; `API_APP` (keyed deployment) serves list/add with a valid token. Do not swap them.
- Distinguish editing app code from recording scores. An outside AI needs separately authorized Sheet/API access to update data.
- Verify syntax and affected behavior. After deploy, verify the URL stays on GitHub Pages and the sync indicator reflects a successful server response.
