# Personal Space

[Open dashboard](https://julietdeltaone.github.io/personal-space/)

## Use

The interface runs on GitHub Pages. On a new device, click the sync indicator, Sign in to Google, Connect Sheet, then Open dashboard. No URL or key entry is needed. This grants a seven-day sync session; reconnect when it expires. Your Sheet stays private. Tap a score to update instantly; tap the same number again to clear. Saved to Sheet confirms a successful server response. Pending changes are queued during connection interruptions.

Open Log update → Voice update. Say “floor nine, bed ten, car interior seven,” review the recognized ratings and press Save ratings. Commands support score words/numbers, clear/reset, and not applicable for optional tomorrow metrics. Unrecognized commands are flagged. Browser speech recognition varies; keyboard dictation or typed commands work with the same parser. Browser speech services may process microphone audio. No AI API key is required.

## Editing from other AI tools

Give your GitHub-connected AI access to this repository. Edit index.html on main; GitHub Pages automatically publishes it. AGENTS.md documents behavior and compatibility requirements. GitHub access authorizes code edits, not access to your private scores. To record scores through another AI, separately authorize that AI's Google Sheets integration or a secure API connection; do not publish session tokens or permanent secrets.

## Backend

Code.gs is bound to the private Sheet. Owner-only web app sign-in issues an expiring session. The session is transferred in a URL fragment, removed from the address immediately and retained on the device. The existing key-protected API validates session expiration server-side. Unknown and expired credentials cannot read/write scores. The owner-only connection deployment remains Only myself, executing as Me. The existing public API still requires a valid key. Backend changes require updating both deployments to the same version; GitHub Pages only deploys frontend changes. Current backend version: 5.

## Data compatibility

22 metrics. Original first seven remain floor, hygiene, laundry, vehicle, homework, business, faith. Bible 10 means today's verse was read with a takeaway in mind; no written reflection.

Schema 31: 22 digits (0–9 encode 1–10), seven decimal digits for the rated bitmask, two decimal digits for exclusions in order charging, camera, packed, food, clothes, equipment. Unset rated bits mean cleared/unrated. Readers retain schemas 7 and 28. Google Sheets is the cross-device source; browser cache/pending queue provide recovery.

## Validation

Syntax, historical schemas, persisted clears, instant autosave, voice parsing and batched voice saving were checked. Live Google sign-in, automatic Sheet reading and persisted connection after reload were verified. Microphone transcription depends on the user's browser/device and should be checked there.
