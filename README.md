# Veridex Product Studio (Next.js SaaS)

Dynamic Product Studio: session-cookie auth, per-user workspace on the server, and full create / edit / delete on every field.

## Run

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3001 (or http://localhost:3000). The dashboard loads immediately — there is no login or signup screen.

Your products are saved in `data/workspaces/USR-LOCAL.json`.

## How data is stored

Cookies cannot hold a full product catalogue (browser limit ~4KB). This app uses:

- **httpOnly session cookie** (`ps_session`) — signed user identity (email, name, role, active product).
- **Server workspace files** — `data/workspaces/{userId}.json` for products, studios, audit, quotes, team, pricing, glossary.

Each registered user gets an isolated workspace.

## Scripts

- `npm run dev` — development
- `npm run build` — production build
- `npm start` — run production server
