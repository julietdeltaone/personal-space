# Personal Space

A static personal dashboard with an optional Google Sheets sync backend.

## Deployment

Publish GitHub Pages from the `main` branch, root directory. Changes to `index.html` are published automatically by GitHub Pages after deployment is enabled.

## Google Sheets sync

Open Connection settings and provide your Apps Script web app URL and private secret once per browser. The private secret lives in Apps Script Project Settings > Script properties under `SECRET`; never commit it to this repository. Hosting does not automatically configure sync.

`Code.gs` is the backend source. After backend changes, copy it into the bound Apps Script project and update its web app deployment to a new version. GitHub Pages serves the dashboard; Apps Script reads and writes the Google Sheet.

## Editing

Edit `index.html` for the interface and `Code.gs` for backend behavior. Preserve storage keys and schema compatibility so existing logs remain readable.
