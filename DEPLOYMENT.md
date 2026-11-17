# Deployment

The MVP is a static single-page app (no server, no environment variables).

```bash
npm run build
```
Output: `dist/` (~430 kB gzipped JS + fonts). Serve it from any static host with an SPA fallback to `index.html`
(routes: `/`, `/profiles`, `/worlds`, `/play`, `/parent`, `/settings`, `/privacy`).

## Requirements
- **HTTPS** — WebXR (and therefore Quest VR) only works on secure origins (or `localhost`).
- SPA rewrite: every unknown path → `/index.html`.
- Recommended headers: `Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' https://cdn.jsdelivr.net; worker-src 'self' blob:`
  (`cdn.jsdelivr.net` is used by the XR library to load Quest controller/hand models; self-host
  `@webxr-input-profiles/assets` later to drop it), `Permissions-Policy: xr-spatial-tracking=(self)`,
  `Referrer-Policy: no-referrer`.

## Testing on a Quest from your computer (LAN)
1. Quest and computer on the same Wi-Fi.
2. Serve over HTTPS, e.g. add `@vitejs/plugin-basic-ssl` locally or use `npx vite --host` behind an HTTPS tunnel.
   Alternatively connect the Quest by USB and use `adb reverse tcp:5193 tcp:5193`, then open
   `http://localhost:5193` in Meta Quest Browser (localhost counts as secure).
3. Open the page in **Meta Quest Browser**, create a profile, tap **Enter VR**.

## Hosting options (need your approval — external accounts)
Any static host works (Vercel, Netlify, Cloudflare Pages, GitHub Pages with a 404→index fallback).
No deployment has been made yet. Phase 5 will add a Node API + PostgreSQL; that requires choosing a provider and
creating accounts, which I will not do without explicit approval.
