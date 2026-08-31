# Kandy Ads — React Website Demo

A multi-page React/Vite website for Kandy Ads, designed around lead generation, premium visual presentation, service-page SEO, and real project proof.

## Pages
- Home
- About
- Services
- Individual Service Detail pages
- Projects / portfolio filters
- Industries
- Process
- Contact
- Quote / estimate

## Animation
- Page transitions with Framer Motion
- Floating hero cards
- Hover elevation and image zoom
- In-view reveal animations
- Animated industry and process sections
- Responsive navigation and sticky action buttons

## Run locally
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```

The production output is generated in `dist/` by Vite.

## Vercel deployment
This repository is prepared for Vercel with `vercel.json` configured as a SPA fallback. This is important because the site uses client-side routing and direct visits/refreshes to routes such as `/about`, `/projects`, `/contact`, and `/quote` must resolve to the application entry point.

### Vercel settings
- Framework preset: **Vite** (or let Vercel detect it automatically)
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

No environment variables are required for the current static site.

After deployment, verify these URLs directly and with a browser refresh:
- `/`
- `/about`
- `/services`
- `/projects`
- `/industries`
- `/process`
- `/contact`
- `/quote`
