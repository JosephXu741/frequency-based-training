# Installable PWA shell

The app can be added to the iPhone home screen. It opens full screen with its own icon and loads with no network.

## Sub-features

- `install-tags` covers the manifest link, `apple-touch-icon` and `apple-mobile-web-app-capable=yes`.
- `manifest` covers `display: standalone`, `start_url: /` and the 192, 512 and maskable icons.
- `sw-offline` loads the app shell from the service worker precache with the network off.

## How to get to it (user POV)

- In Safari, tap Share, then Add to Home Screen, then open the icon. Later, open it with no signal.

## Driving it with Playwright

- **Tags.** Read the `<head>` with `page.evaluate`, and check `navigator.serviceWorker.controller` is set.
- **Manifest and icons.** Fetch `/manifest.webmanifest` and every icon. Each one is a 200 `image/png`.
- **Offline cold load.** Run `ctx.setOffline(true)`, then `page.reload()`. `resetTimerButtons(page).first()` becomes visible.
- **Proof.** Run `node scripts/journeys/pwa-shell.mjs`.

## Gotchas

- `vite preview` serves over plain http on 127.0.0.1, which browsers treat as secure. On a phone, the app must be served over HTTPS.
- Nothing here can open the real iOS Add to Home Screen sheet or prove there's no Safari bar. Ask the user to check on a device.
