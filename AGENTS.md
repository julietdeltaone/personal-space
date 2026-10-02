# Editing Personal Space

User intent: this public GitHub repository is the shared code home for any authorized AI tool. The live frontend belongs on GitHub Pages, without redirecting users to Apps Script.

- Edit index.html for layout, metric wording and interaction changes. Main publishes automatically to GitHub Pages.
- Preserve instant input, second-tap clearing, compact mobile controls, edge-to-edge desktop layout and accurate Sheet sync status.
- Keep the 22 metric order and schemas 7, 28 and 31 compatible with historical Sheet logs. Never interpret an unset rated bit as score 1.
- Voice input must show parsed metric/value pairs for review, report ambiguous commands, and save through the same pending queue as meter input. Never silently invent scores.
- Keep credentials out of this public repository. Do not widen Google Sheet or Apps Script permissions.
- Code.gs changes are not deployed by GitHub Pages. Update the existing owner-only Apps Script deployment to a new version, then verify live saving. Preserve owner identity checks and origin/source validation.
- Distinguish editing app code from recording scores. An outside AI needs separately authorized Sheet/API access to update data.
- Verify syntax and affected behavior. After deploy, verify the URL stays on GitHub Pages and the sync indicator reflects a successful server response.
