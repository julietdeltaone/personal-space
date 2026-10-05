# Personal Space

[Open dashboard](https://julietdeltaone.github.io/personal-space/)

## Use

The interface runs on GitHub Pages. On a new device, click the sync indicator, Sign in to Google, Connect Sheet, then Open dashboard. No URL or key entry is needed. This grants a seven-day sync session; reconnect when it expires. Your Sheet stays private.

The dashboard tracks a weekly routine against deadlines instead of 1–10 scores. Each item shows a live countdown ("due in 2h", "overdue 30m"); tap it to mark done, tap again to undo. Statuses are done on time, done late, missed, or upcoming, and each item carries its streak of consecutive on-time days. The week view shows seven days of dots per item for at-a-glance accountability.

Routine (all times America/New_York): weeknight prep Mon–Fri due 9:00 PM (water bottle filled in the fridge, drink/snack stocked, car charging); laundry pipeline Sat–Sun (started by Sun 12:00 PM, washed and dried, folded and put away by Sun 9:00 PM); verse + takeaway daily by 9:00 PM.

The Ratings tab is a separate weekly review of the same 22 granular 1–10 metrics the dashboard tracked before the routine rebuild (room, space, car, tasks & habits, tomorrow prep) — same order, same codes, so old history stays comparable. It is the default landing tab. Tap a number to rate, tap again to clear; mark a slot "Not needed" to exclude it from the score. It opens prefilled from your last check-in. Use it on Sundays with the reset, not daily — the routine tab owns the daily flow.

"Saved to Sheet" confirms a successful server response. Pending changes are queued during connection interruptions.

Open Voice update from the button at the bottom of the page (or press L). Say “water bottle done”, “laundry is all set for the week”, or “undo car charging”; review what was heard, then save. Commands support done/undo per item; unrecognized phrases are flagged, never silently applied. Browser speech recognition varies; keyboard dictation or typed commands work with the same parser. Browser speech services may process microphone audio. No AI API key is required.

## Editing from other AI tools

Give your GitHub-connected AI access to this repository. Edit index.html on main; GitHub Pages automatically publishes it. AGENTS.md documents behavior and compatibility requirements. GitHub access authorizes code edits, not access to your private scores. To record routine events through another AI, separately authorize that AI's Google Sheets integration or a secure API connection; do not publish session tokens or permanent secrets.

## Backend

Code.gs is bound to the private Sheet. Owner-only web app sign-in issues an expiring session. The session is transferred in a URL fragment, removed from the address immediately and retained on the device. The existing key-protected API validates session expiration server-side. Unknown and expired credentials cannot read/write scores. The owner-only connection deployment remains Only myself, executing as Me. The existing public API still requires a valid key. Backend changes require updating both deployments to the same version; GitHub Pages only deploys frontend changes. Current backend version: 5 — no backend change was needed for the routine model; the generic add/list API carries schema-40 events.

## Data compatibility

Schema 40 (since 2026-10-05): routine events. Each row is `Timestamp, 40, <item id 1-7>, {"na":["done"]}` for done or `{"na":[]}` for undone. Latest event per item per cycle wins. Note: the backend keeps only the `na` array from the Details JSON — a `state` key would be silently dropped, so state is encoded in `na`.

Superseded: schemas 7, 28 (older 1–10 metric ratings formats). Those rows remain in the Sheet untouched.

Schema 31 (restored 2026-10-04): 1–10 metric ratings, written by the Ratings view. Each row is `Timestamp, 31, <31-char code>, {"na":[...ids]}` where the code is 22 score digits (`score-1` per metric in fixed order, `0` for unrated) + a 7-digit rated bitmask + a 2-digit excluded (N/A) bitmask. Read by the Ratings view; the routine tracker ignores these rows. Schemas 7 and 28 (older formats, plain 22-digit codes and the 28-char N/A variant) decode in the same view for history continuity.

## Validation

Syntax, deadline/status/streak logic (13-case harness incl. DST boundary), ratings protocol round-trip (21-case harness: encode/decode, N/A, partial ratings, schema-40 skip, schema 7/28 back-compat), voice parsing, tap/undo, offline queueing, element-ID coverage, and a full-page jsdom harness (22 checks: routine no-regressions + ratings tab build/interaction/save) were checked. Live Google sign-in, automatic Sheet reading and persisted connection after reload were verified on the prior build and are unchanged in this one. Microphone transcription depends on the user's browser/device and should be checked there.
