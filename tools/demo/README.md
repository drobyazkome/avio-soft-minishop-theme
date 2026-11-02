# Checking the theme on Core's demo

Not part of the theme package (`/tools` is export-ignored). These scripts show the theme on a
demo build of Core, the same build the docs site uses, without a server or a login.

1. Check out the Core revision that runs on the server into a scratch folder and let
   `patch-core.py` add two demo conveniences: `?mock=` takes several modes separated by commas,
   and `mock=qr` turns QR sign-in on. Then build the demo:

   ```
   git -C <core-repo> worktree add --detach <scratch>/core <revision>
   python3 tools/demo/patch-core.py <scratch>/core
   (cd <scratch>/core/frontend && npm ci) && node <scratch>/core/docs-site/scripts/build-demo-runtime.mjs
   ```

2. Serve the demo and the theme together: `CORE=<scratch>/core node tools/demo/serve.cjs`
   (port 8130; the theme is served from this repository as `/webapp-theme-css/avio-soft/...`).

3. In a folder with Playwright installed (`npm i playwright`, plus `npx playwright install webkit`
   for Safari's engine), take screenshots:

   ```
   node tools/demo/snap.cjs <out> cases.json [chromium|webkit] [390,1138]
   node tools/demo/sheet.cjs <out>/sheet.png 0.6 <png>...
   ```

   Each case is `{name, path, mock, js, wait, h, full, fx}`: `path` is the app route
   (`/home`, `/settings/payments`...), `mock` the demo modes, `js` runs in the page after the
   theme is applied, `fx: true` mounts `effects/main.js` like Core does. `MODES=light` limits
   the colour modes. A case that sets `window.__dbg` prints it.

The demo user is not an administrator, so `?theme_preview` does not work there; `snap.cjs`
swaps the theme classes and the variant tokens from `theme.json` onto the shell by hand.
