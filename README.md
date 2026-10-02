# Personal Space

[Open dashboard](https://julietdeltaone.github.io/personal-space/)

## Use

The interface is hosted on GitHub Pages. Sign in with the Google account that owns the Sheet if prompted, then retry the connection. No Sheet URL or secret entry is required. Tap a number to score; tap the selected number again to clear. Inputs update immediately. The Saved to Sheet indicator confirms remote persistence; pending inputs stay queued during connection interruptions.

Open Log update → Voice update to speak or dictate several ratings, such as “floor nine, bed ten, car interior seven.” Review the interpreted ratings and press Save ratings. Unknown or ambiguous commands are flagged rather than guessed. Browser speech recognition availability varies; keyboard dictation and typed commands use the same parser. No AI API key is required.

## Edit with any GitHub-connected AI

Edit index.html on main and GitHub Pages automatically publishes the change. The app has 22 metrics; keep existing metric order and schemas compatible. Code.gs is the Sheet backend. Backend changes require a new version of the existing Apps Script deployment. Keep that deployment Only myself, executing as Me. Never commit credentials or change the Sheet to public access.

The browser connects to an authenticated Apps Script iframe relay. Both ends validate message origin; the server verifies the signed-in Sheet owner. Cross-site cookie restrictions may prevent the embedded connection; verify on the target device. The older keyed API remains for existing authorized integrations. GitHub access alone does not authorize an outside AI to read or write Sheet data; it needs its own approved Google Sheets connection or securely configured API credential.

## Data compatibility

The original seven metrics are floor, hygiene, laundry, vehicle, homework, business, faith. Additional metrics are appended. Bible 10 means today's verse was read and a takeaway can be recalled; there is no written reflection.

Schema 31: 22 score digits (0–9 encode scores 1–10), seven decimal digits encoding the rated bitmask, then two decimal digits encoding exclusions for charging, camera, packed, food, clothes, equipment. An unset rated bit means cleared/unrated, not score 1. Readers retain schemas 7 and 28. Browser cache and pending queue are recovery tools; Google Sheets is the cross-device record.
