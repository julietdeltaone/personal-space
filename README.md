# Personal Space

[Open dashboard](https://julietdeltaone.github.io/personal-space/)

## Use

The interface runs on GitHub Pages. On a new device, click the sync indicator, Sign in to Google, Connect Sheet, then Open dashboard. No URL or key entry is needed. This grants a seven-day sync session; reconnect when it expires. Your Sheet stays private.

The dashboard tracks a weekly routine against deadlines instead of 1–10 scores. Each item shows a live countdown ("due in 2h", "overdue 30m"); tap it to mark done, tap again to undo. Statuses are done on time, done late, missed, or upcoming, and each item carries its streak of consecutive on-time days. The week view shows seven days of dots per item for at-a-glance accountability.

Routine (all times America/New_York): weeknight prep Mon–Fri due 11:00 PM (water bottle filled in the fridge, drink/snack stocked, car charging); laundry pipeline Sat–Sun (started by Sun 12:00 PM, washed and dried, folded and put away by Sun 9:00 PM); verse + takeaway daily by 11:00 PM.

The dashboard is a single page: Today's routine, the Week grid, and the Ratings meters are stacked sections under one scroll, with a sticky section-jump nav on mobile and desktop. The Ratings meters (the same 22 granular 1–10 metrics the dashboard tracked before the routine rebuild — room, space, car, tasks & habits, tomorrow prep — same order, same codes, so old history stays comparable) sit in the Ratings section below the week view. Tap a number to rate, tap again to clear; mark a slot "Not needed" to exclude it from the score. The section opens prefilled from your last check-in. Use it on Sundays with the reset, not daily — the routine section owns the daily flow.

"Saved to Sheet" confirms a successful server response. Pending changes are queued during connection interruptions.

Open Voice update from the button at the bottom of the page (or press L). Say “water bottle done”, “laundry is all set for the week”, or “undo car charging”; review what was heard, then save. Commands support done/undo per item; unrecognized phrases are flagged, never silently applied. Browser speech recognition varies; keyboard dictation or typed commands work with the same parser. Browser speech services may process microphone audio. No AI API key is required.

## Editing from other AI tools

Give your GitHub-connected AI access to this repository. Edit index.html on main; GitHub Pages automatically publishes it. AGENTS.md documents behavior and compatibility requirements. GitHub access authorizes code edits, not access to your private scores. To record routine events through another AI, separately authorize that AI's Google Sheets integration or a secure API connection; do not publish session tokens or permanent secrets.

## Backend

Code.gs is bound to the private Sheet. Owner-only web app sign-in issues an expiring session. The session is transferred in a URL fragment, removed from the address immediately and retained on the device. The existing key-protected API validates session expiration server-side. Unknown and expired credentials cannot read/write scores. The owner-only connection deployment remains Only myself, executing as Me. The existing public API still requires a valid key. Backend changes require updating both deployments to the same version; GitHub Pages only deploys frontend changes. Current backend version: 6 — adds `action=status` and the `since` filter to the keyed API.

## Keyed API contract (for other web apps)

The keyed deployment (`API_APP` in index.html) is the feed other apps read. Base: the deployment's `/exec` URL, GET with query params, JSON responses. Every request carries `key=<secret>` (Script Properties `SECRET`, or a 7-day session token from the connect flow). The contract is additive-only: new fields may appear, old ones never change meaning. `ping` returns the current `api` version string and `actions` list for feature detection.

- `ping` — `{ok:true, ping:true, api:"2026-10-05", actions:["list","add","status","ping"]}`
- `list` — raw event log, newest-last: `{ok, rows:[[iso_utc_ts, schema, code, details]]}`. Optional `since=ISO-UTC` lower bound keeps reads small (exact string compare on UTC timestamps).
- `add` — append one event: `t=ISO-UTC`, `schema=40`, `code=<1-7>`, `notes={"na":["done"]}` or `{"na":[]}`. Returns `{ok:true}` (or `duplicate:true` within the dedupe window). Only `na` survives server-side sanitizing.
- `status` — derived per-item state for one ET day, as of now: `{ok, api, date:"YYYY-MM-DD", asOf, items:[{id, name, scheduled, due, state, lastEvent}]}`. Optional `date=YYYY-MM-DD` (ET, default today) and `asOf=ISO-UTC`. States mirror the dashboard exactly: `ontime | late | done (no deadline) | missed | upcoming`, plus `off` for items not scheduled that day. **This is the read aggregators should use** — no client state machine needed, and the 7-day internal `since` keeps it small. Only synced rows count; taps queued offline appear after the next sync.

Item ids: 1 water bottle, 2 drink/snack, 3 car charging (Mon–Fri, due 11 PM ET), 4 laundry started (weekend, due Sun 12 PM ET), 5 washed & dried (weekend, no hard deadline), 6 folded & put away (weekend, due Sun 9 PM ET), 7 verse + takeaway (daily, due 11 PM ET). Cycle windows: weekday items run midnight-to-midnight ET; weekend items run Saturday 00:00 ET to Sunday 24:00 ET. A 30-minute grace past the deadline still reads `upcoming`.

Design note for future Sheet apps: expose the same minimal contract (`ping` with `api`/`actions`, `list` with `since`, and a derived `status`) under the app's own key. The aggregator then needs only one fetch pattern per app.

## Data compatibility

Schema 40 (since 2026-10-05): routine events. Each row is `Timestamp, 40, <item id 1-7>, {"na":["done"]}` for done or `{"na":[]}` for undone. Latest event per item per cycle wins. Note: the backend keeps only the `na` array from the Details JSON — a `state` key would be silently dropped, so state is encoded in `na`.

Superseded: schemas 7, 28 (older 1–10 metric ratings formats). Those rows remain in the Sheet untouched.

Schema 31 (restored 2026-10-04): 1–10 metric ratings, written by the Ratings view. Each row is `Timestamp, 31, <31-char code>, {"na":[...ids]}` where the code is 22 score digits (`score-1` per metric in fixed order, `0` for unrated) + a 7-digit rated bitmask + a 2-digit excluded (N/A) bitmask. Read by the Ratings view; the routine tracker ignores these rows. Schemas 7 and 28 (older formats, plain 22-digit codes and the 28-char N/A variant) decode in the same view for history continuity.

## Validation

Syntax, deadline/status/streak logic (13-case harness incl. DST boundary), ratings protocol round-trip (21-case harness: encode/decode, N/A, partial ratings, schema-40 skip, schema 7/28 back-compat), voice parsing, tap/undo, offline queueing, element-ID coverage, and a full-page jsdom harness (22 checks: routine no-regressions + ratings tab build/interaction/save) were checked. Live Google sign-in, automatic Sheet reading and persisted connection after reload were verified on the prior build and are unchanged in this one. Microphone transcription depends on the user's browser/device and should be checked there.
