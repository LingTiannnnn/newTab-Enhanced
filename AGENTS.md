# AGENTS.md

Firefox new-tab page extension: plain HTML/CSS/JS, no framework, no build.

## Run and verify

- There is no `package.json`, bundler, or test runner. Edit the files directly and reload the extension; do not add npm/node/build tooling without explicit approval.
- Load it in Firefox via `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → select `manifest.json`. Click **Reload** after changes.
- There are no automated tests. Verify behavior by opening a new tab and exercising the settings menu.

## Storage contract (`script.js`)

- `browser.storage.sync` uses two keys: `index` (number, `-1` means no background) and `logo` (`firefox` | `nightly` | `developer`, applied as a `logo-<name>` class on `.logo`).
- `browser.storage.local` uses `customImage` (compressed data URL of an uploaded wallpaper). The legacy `image` key is only read for migration.
- `index` is the raw child position inside `.img-list`, and the `<span>` category headers count as children. Adding, removing, or reordering any child shifts stored selections; append new entries at the end of a category instead of inserting or reordering.
- The click listener is attached to every `.img-list` child, spans included. Any change to that list structure needs a matching change in `script.js`.
- The custom upload tile must stay the **last** `.img-list` child; its position is the stored `index` for uploaded wallpapers. Never put uploaded photos in `storage.sync` (100 KB total quota) — they belong in `storage.local`, compressed by `compressImage()`.
- When the custom tile is not active but `local.customImage` exists, clicking it reuses the cached wallpaper; the × badge only clears the background (`index = -1`) and keeps the cache.
- `logoSwitch(name)` is a global function with no UI wiring. Do not assume a control for it exists.

## Adding a background

- Put the image in `images/`, then append an entry inside the matching category in `index.html`:

```html
<li>
  <button class="img-btn"><img src="images/example.jpg"></button>
  <a href="https://pixabay.com/users/...">Author</a>
  <a href="https://pixabay.com/...">Pixabay</a>
</li>
```

- Both anchors are required: credits are rebuilt from `img.children[1]` and `img.children[2]`, and the `.credits` block keeps its existing structure (`<svg>` then a `<span>` with two `<a>`).

## Manifest boundaries

- Keep `manifest_version: 2`, `chrome_url_overrides`/`chrome_settings_overrides` pointing at `./index.html`, and `browser.*` APIs; this is a Firefox package, not a Chrome MV3 one.
- Keep `permissions` at `["storage"]`. Every added permission enlarges the review surface, so justify it first.
- This fork uses the gecko id `newtab-enhanced@lingtiannnnn`, deliberately different from the upstream id to avoid conflicts. Keep it stable: changing it again disconnects this fork's existing `storage.*` data.
- Montserrat (weights 400–500) is self-hosted from `fonts/montserrat-latin.woff2` via `@font-face` in `css/style.css`; `fonts/OFL.txt` must ship alongside it. The page must make **zero** network requests on load — any new remote asset breaks the `data_collection_permissions: ["none"]` claim.
- Bump `version` in `manifest.json` (currently `1.7.1`) for a release.
