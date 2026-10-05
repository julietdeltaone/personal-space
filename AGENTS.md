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
- Old schemas 7/28/31 remain in the Sheet untouched; the UI ignores them. Never reinterpret old rating codes.

## Editing rules

- Edit index.html for layout, wording and interaction changes. Main publishes automatically to GitHub Pages.
- Preserve instant tap input, second-tap undo, the offline pending queue, voice input with review-before-save (never silently invent updates), compact mobile controls (min 56px targets), and accurate Sheet sync status.
- Keep credentials out of this public repository. Do not widen Google Sheet or Apps Script permissions.
- Code.gs changes are not deployed by GitHub Pages. If a backend change is ever needed, update BOTH Apps Script deployments to the same version and verify live saving. Keep the connection deployment Only myself and the keyed API session tokens protected. Preserve owner identity checks, server-side token expiry, and credential-free public source.
- The two exec URLs in index.html have fixed roles: `SHEET_APP` (owner-only deployment) issues 7-day session tokens via the connect flow; `API_APP` (keyed deployment) serves list/add with a valid token. Do not swap them.
- Distinguish editing app code from recording scores. An outside AI needs separately authorized Sheet/API access to update data.
- Verify syntax and affected behavior. After deploy, verify the URL stays on GitHub Pages and the sync indicator reflects a successful server response.
