# Personal Space

[Open the dashboard](https://julietdeltaone.github.io/personal-space/) · [Direct connected dashboard](https://script.google.com/macros/s/AKfycbwzWh-aAMVgTnohCvaQN2dqEOgDlRoF9Kwn7QDVj4nZOdz1GAz17hNulUtYw1Ml0qb5/exec)

## Use

Sign in with the Google account that owns the Sheet. GitHub Pages opens the private Apps Script dashboard automatically. No Sheet URL or secret entry is needed. Tap a meter number to score; tap the selected number again to clear. Every edit updates immediately, queues safely during network interruptions, and saves to Google Sheets automatically. “Saved to Sheet” confirms a successful response; a waiting/error indicator does not claim remote persistence.

The dashboard has 22 scores grouped into Room, Space, Car, Tasks and habits, and Tomorrow. Bible 10 means today's verse was read and a takeaway can be recalled mentally; no written reflection is collected. Optional tomorrow items can be excluded.

## Architecture and editing

GitHub stores and deploys the interface. The private Apps Script deployment fetches the interface from GitHub Pages and serves it with its authenticated `google.script.run` connection to the bound Sheet. The server checks the signed-in account against the owner. Keep this deployment “Only myself”, executing as Me. Secrets must never be committed.

Edit `index.html` for interface changes. They become available after GitHub Pages publishes; the connected dashboard fetches them on opening. For backend changes, copy `Code.gs` and `appsscript.json` into the bound Apps Script project, authorize the stated scopes, then update the private web app deployment to a new version. The manifest requests access to the current spreadsheet, account email, and external requests to load the public interface.

The original keyed deployment remains at version 1 for backward compatibility. Do not update it with the private dashboard version or widen the private deployment's access.

## Log compatibility

Existing seven-score logs retain the original order: floor, hygiene, laundry, vehicle, homework, business, faith. Additional scores are appended.

Schema 28 encodes 22 score digits (0–9 representing 1–10), then six 0/1 exclusion flags: charging, camera, packed, food, clothes, equipment.

Schema 31 supports partial and cleared inputs: 22 score digits, a seven-digit decimal bitmask indicating which scores are rated, and a two-digit decimal exclusion bitmask in the same optional-item order. A zero bit in the rated mask means unset, including an explicitly cleared score. Placeholders must not be interpreted as a score of 1. This fits the existing backend's 40-digit limit. The Details column additionally preserves metadata.

Keep storage keys and schema readers compatible. Browser storage is a temporary cache and pending-write queue; the Sheet is the cross-device record. `?preview` on GitHub Pages is for interface development only and does not connect automatically.
