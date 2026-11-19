# Store Listings

Two things live here:

- `app-store/` and `play-store/` — working drafts (listing copy plus App Privacy / Data Safety / review notes). They are not generated into the app and are not uploaded as-is.
- `fastlane/` — the listing tree that is uploaded to App Store Connect (`deliver`) and Google Play (`supply`), driven by [reusable-dev-scripts](https://www.npmjs.com/package/reusable-dev-scripts) (`rds`), the same tooling as the other Logic Edge apps. The shared Fastlane lanes and gems are installed on first use into the ignored `.rds/gems`.

`fastlane/` was generated from the drafts (name, subtitle, promotional text, keywords, description, Play title/short/full description) plus values read from the live App Store listing (URLs, copyright, categories, What's New). Edit the files in `fastlane/` from now on; keep the drafts in step if you still want them as a record.

Public/VPS OpenCode servers should use HTTPS. Local/private and VPN/Tailscale OpenCode servers may use HTTP.

## Commands

| Command | What it does |
| --- | --- |
| `npm run store:doctor` | Checks the credentials and shows the editable store version (add `-- --platform ios`). |
| `npm run store:check` / `store:check:strict` | Validates limits, required fields, layout and media sizes locally (add `-- --scope text`). |
| `npm run store:listing:verify` | Read-only comparison of `fastlane/` with the store drafts, so you know whether an upload is needed. |
| `npm run store:pull` | Downloads the live listing into the ignored `fastlane/downloaded/`. |
| `npm run store -- ios listing` / `android listing` | Uploads listing text (see `rds store run -- lanes` for every lane and its options). |
| `npm run store -- ios internal` / `android internal` | Uploads a build to TestFlight / the Play internal track, then runs `scripts/commit-publish.mjs`. |

`npm run store:verify` is the older, unrelated readiness check (`scripts/verify-store-readiness.mjs`).

Nothing here submits a version for review. Listing uploads only fill the store drafts.

## Credentials

Both keys live outside the checkout and are read from the variables fastlane uses (`allowExternalCredentials` in `reusable-dev-scripts.config.mjs`); nothing is committed.

| Store | Variable | Notes |
| --- | --- | --- |
| App Store | `APP_STORE_CONNECT_API_KEY_PATH` | Fastlane JSON API key of the team. |
| Google Play | `SUPPLY_JSON_KEY` | Service account JSON. It must be invited to this app in Play Console (Users and permissions), otherwise `store:doctor` fails with "The caller does not have permission". |

In Play Console → Users and permissions, invite the service account's email and grant it **App permissions** for this app only (not account-wide, not admin): *View app information and download bulk reports (read-only)*, *Manage store presence* and *Release apps to testing tracks*. Add *Manage testing tracks and edit tester lists* if the internal-track upload is refused. Production release rights are not needed. The App Store key needs the *App Manager* role.

If Ruby fails with `certificate verify failed`, set `SSL_CERT_FILE` to a PEM bundle that includes the antivirus root certificate. `STORE_RUBY` overrides the Ruby used.

## Layout

```
fastlane/metadata/android/<Play locale>/   title, short_description, full_description (.txt), video, changelogs/, images/
fastlane/metadata/ios/<App Store locale>/  name, subtitle, description, keywords, promotional_text, release_notes, *_url (.txt)
fastlane/metadata/ios/{copyright,primary_category,secondary_category}.txt, review_information/notes.txt
fastlane/screenshots/<locale>/, fastlane/previews/<locale>/
```

The locale mapping (draft code → Play folder → App Store folder) is `LOCALES` in `reusable-dev-scripts.config.mjs`. Text files are LF (`.gitattributes`). Review contact and demo-account files are ignored by git; keep them local or enter them in App Store Connect.

## Known gaps

- Store media (Android icon, feature graphic, screenshots; iOS iPhone/iPad screenshots) is not in `fastlane/` yet, so `store:check` without `--scope text` fails on missing media.
- `ar`, `es-419` and `pt-BR` are Google Play-only languages. They are not in `LOCALES` because rds needs every locale on both stores (an empty iOS side fails strict checks, and filling it would add App Store languages), so `store:check` does not validate them. `supply` still uploads every folder under `metadata/android`, and `store:listing:verify` compares them. Keep titles ≤30, short descriptions ≤80 and full descriptions ≤4000 characters by hand. The `es-419` and `pt-BR` text is adapted from `es-ES` and `pt-PT`, and the Arabic is machine-generated: have a native speaker review it.
- Play titles are translated in some languages ("OpenCode Mobil (community)" in `de-DE` and `tr-TR`, and so on), matching the store; the drafts in `play-store/` still show the English title.
- The `hi`, `ru` and `th` iOS keywords were trimmed to fit 100 bytes by dropping the last word ("remote") and the spaces after commas. The other locales still have spaces after commas, which `check` warns about.
