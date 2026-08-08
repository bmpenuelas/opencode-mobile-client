# Screenshot Capture Guide

## Required Screens (both stores)

| # | Screen | Route | Device |
|---|--------|-------|--------|
| 1 | Landing — default server ready to connect | `/` | Phone |
| 2 | Server list with profiles | `/servers` | Phone |
| 3 | Add server form (URL + auth fields filled) | `/servers/new` | Phone |
| 4 | Active connection — OpenCode Web UI loaded | `/connect/:id` | Phone |
| 5 | Active connection — TopPullMenu open | `/connect/:id` | Phone |
| 6 | Settings screen | `/settings` | Phone |
| 7 | Help / troubleshooting | `/help` | Phone |
| 8 | Landing on iPad (landscape) | `/` | Tablet |

## Size Requirements

### App Store
| Device | Resolution | Required |
|--------|-----------|----------|
| 6.7" iPhone 15 Pro Max | 1290 × 2796 px | Yes |
| 6.5" iPhone 14 Plus | 1242 × 2688 px | Recommended |
| 5.5" iPhone SE/8 Plus | 1242 × 2208 px | Recommended |
| 12.9" iPad Pro | 2048 × 2732 px | Optional |
| **iOS minimum:** 6.7" + one other size, with each screen above represented at least once | | |

### Google Play
| Device | Resolution | Required |
|--------|-----------|----------|
| Phone (any modern) | 1080 × 1920+ px | Yes (2-8) |
| 7" tablet | 1080 × 1920+ px | Yes (2+) |
| 10" tablet | 1080 × 1920+ px | Yes (2+) |
| **Android minimum:** 2 phone + 2 tablet screenshots | | |

## Setup Prerequisites

1. Have a running OpenCode Web server reachable from your device
2. Add at least 2 server profiles in the app (one default, one secondary)
3. Set the device to light mode for cleaner screenshots
4. Use iOS Simulator or Android Emulator for pixel-perfect captures
5. Set simulator/emulator to 100% scale (not Retina scaling)

## Capture Checklist

### Phone screenshots
- [ ] Landing (default server, ready state, green dot)
- [ ] Server list (2+ profiles, mixed statuses)
- [ ] Add server form (URL filled, auth toggled on)
- [ ] WebView connected (OpenCode interface visible)
- [ ] TopPullMenu (during active connection — shows Options panel)
- [ ] Settings (timeout values visible)
- [ ] Help (troubleshooting sections)

### Tablet screenshots
- [ ] Landing in landscape
- [ ] Server list in landscape
- [ ] WebView connected in landscape
- [ ] Settings in landscape

## Env Setup for Realistic Content

Before capturing:
1. Connect to a real OpenCode server with some files/directories visible
2. Make sure the server has a non-empty workspace
3. Have at least one server profile that shows "Connected" status
4. Have one profile that shows "Offline" (to show status variety on Server List)

## Naming Convention

```
screenshots/
  ios/
    app-store-01-landing.png
    app-store-02-server-list.png
    app-store-03-add-server.png
    app-store-04-connected.png
    app-store-05-pull-menu.png
    app-store-06-settings.png
    app-store-07-help.png
  android/
    play-store-01-landing.png
    play-store-02-server-list.png
    ...
```

## Scripts

Two scripts automate the capture workflow — one per platform.

### Android

```
npm run screenshots:android:open        # Build + sync + launch on connected device/emulator
npm run screenshots:android:capture <name>   # Capture current screen to docs/screenshots/android/<name>.png
npm run screenshots:android:guided      # Build → launch → step through all 7 screens with prompts
```

### iOS (macOS only)

```
npm run screenshots:ios:open            # Build + sync + launch on booted simulator
npm run screenshots:ios:capture <name>       # Capture current screen to docs/screenshots/ios/<name>.png
npm run screenshots:ios:guided          # Build → launch → step through all 7 screens with prompts
```

### Resize iOS store screenshots

The command processes screenshots in `docs/screenshots/design/iphone/` by default:

```
npm run screenshots:ios:resize
```

The command updates PNG, JPEG, and WebP screenshots in place. For each image it
chooses the closest accepted App Store size (`1242 × 2688`, `2688 × 1242`,
`1284 × 2778`, or `2778 × 1284`), center-crops only from the top and bottom,
and scales it to that exact resolution. To process a different directory, pass
it after `--`:

```
npm run screenshots:ios:resize -- path/to/screenshots
```

### Typical workflow

1. Boot your device/emulator first (Android emulator or iOS Simulator)
2. `npm run screenshots:{platform}:open` — builds, syncs, and launches the app
3. Navigate to the desired screen in the app manually
4. `npm run screenshots:{platform}:capture <name>` — captures whatever is on screen

Or use guided mode to step through all 7 screens sequentially:

```
npm run screenshots:android:guided      # Prompts before each capture
```

## After Captures

1. Files are already named per the convention above and saved to `docs/screenshots/{platform}/`
2. Upload to App Store Connect / Google Play Console
3. Reference these files in `store/app-store.md` and `store/play-store.md`
