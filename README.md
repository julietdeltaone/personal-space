# Personal Space

A static personal dashboard with an optional Google Sheets sync backend.

## Deployment

Publish GitHub Pages from the `main` branch, root directory. Changes to `index.html` are published automatically by GitHub Pages after deployment is enabled.

## Google Sheets sync

Open Connection settings and provide your Apps Script web app URL and private secret once per browser. The private secret lives in Apps Script Project Settings > Script properties under `SECRET`; never commit it to this repository. Hosting does not automatically configure sync.

`Code.gs` is the backend source. After backend changes, copy it into the bound Apps Script project and update its web app deployment to a new version. GitHub Pages serves the dashboard; Apps Script reads and writes the Google Sheet.

## Editing

Edit `index.html` for the interface and `Code.gs` for backend behavior. Preserve storage keys and schema compatibility so existing logs remain readable.

## Scoring and compatibility

The dashboard now has 22 scores, grouped into Room, Space, Car, Tasks and habits, and Tomorrow. Bible 10 means today's verse was read and a takeaway can be recalled mentally; no written reflection is collected. Existing seven-score logs keep their original metric order.

New logs use schema 28: the first 22 digits encode scores (0–9 representing 1–10), followed by six 0/1 exclusion flags in this order: charging, camera, packed, food, clothes, equipment. A 1 means not applicable and excludes that metric from averages. This works with the existing three-column Apps Script deployment. The updated backend can additionally preserve a Details column, but deploying it is optional for these scores.

Connection settings remain private to each browser. Check for “Synced” before relying on cross-device persistence; “Local only” means that browser has not been connected.
