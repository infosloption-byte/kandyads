# Kandy Ads Admin

Internal React operations platform for Kandy Ads.

## Local development
```bash
npm install
npm run dev
```

The admin app currently includes the operations shell, authenticated login/session flow, dashboard API integration and the first API-backed Clients module. The remaining modules are scaffolded and tracked in the root `/TASKS.md`.

## API connection
Create `.env` from `.env.example` when needed:
```text
VITE_API_URL=http://localhost:4000/api/v1
```

## Development login
The backend seed creates a development Administrator account:
```text
Email: admin@kandyads.lk
Password: ChangeMe!123
```
Change this password before any real deployment.

## Stack
React + Vite + React Router + Lucide icons. API access is centralized in `src/api.js` and authenticated with the backend JWT session.
