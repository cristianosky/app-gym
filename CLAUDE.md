# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Mi Entrenamiento" — a Spanish-language (Colombian) gym app for Smart Fit users. React Native/Expo client + Node/Express/SQLite backend. Gemini (Google) generates each user's workout routine, meal plan, and powers a chat assistant.

Two independent processes, run separately:
- **App** (repo root): Expo/React Native — `App.js`, `src/`
- **Server** (`server/`): Express API — `server/src/`

## Commands

### Server (`cd server`)
- `npm install`
- `npm run dev` — runs with `node --watch` (auto-reload)
- `npm start` — plain `node src/index.js`
- `npm test` — `node --test "src/**/*.test.js"` (Node's built-in test runner; co-located `*.test.js` files)
- `npm run probar:ia` — manual script to exercise the Gemini integration (`scripts/probar-ia.mjs`)
- Requires Node **>=22.5.0** (uses the built-in experimental `node:sqlite` module — the "ExperimentalWarning" on boot is expected, not a bug)
- Config comes from `server/.env` (see `server/.env.example`); needs `GEMINI_API_KEY` and `JWT_SECRET`. Without a valid `GEMINI_API_KEY` the server still runs but serves the fallback routine, and chat/meal-plan generation won't respond.
- SQLite DB lives at `server/data/app.db` (gitignored). Delete it to reset all data.

### App (repo root)
- `npm install`
- `npm start` (= `expo start`), `npm run android`, `npm run ios`, `npm run web`
- The app auto-discovers the server via the LAN IP Expo serves on; to point at a deployed server set `extra.apiUrl` in `app.json`.

### Production (this host)
The backend runs under **PM2** as process `app-gym` (cwd `server/`, entry `server/src/index.js`). After pulling changes:
```bash
cd /root/app-gym && git pull
cd server && npm install   # only if dependencies changed
pm2 restart app-gym
```
There is no build/compile step — it's plain Node ESM, "recompiling" just means reinstalling deps and restarting the process.

## Architecture

### Server layering (`server/src/`)
`routes/` → `services/` → `repositories/` (SQLite access) → `db/`. `ai/` holds the Gemini client, prompts, and response schemas; `validation/` holds Zod schemas for both incoming requests and AI output. `middleware/` has auth (JWT), rate limiting, and error handling.

### Key design decision: closed exercise catalog
**The AI never invents exercises.** `server/src/data/catalog/` (split by muscle group) is the reviewed source of truth; Gemini only picks exercise IDs from it and decides sets/reps/rest/order. This keeps "Ver ejemplo" videos always valid, keeps technique/common-mistake copy human-reviewed, and keeps AI responses small/cheap since the server hydrates full exercise details afterward. To add an exercise, edit the relevant file under `server/src/data/catalog/` — it's live immediately, no app release needed.

### AI fallback behavior
If Gemini fails, routine generation falls back to template-based plans in `server/src/services/fallback-routine.js`, chosen by the user's training days/level/goal; the app shows this as a "base" routine with a regenerate option. Meal-plan generation has **no** automatic fallback (deliberate — inventing meals without nutritional judgment was considered worse than asking the user to retry).

### Security model
PINs (4-digit) are hashed with scrypt + per-user salt, never stored plain; escalating lockout (1/5/15/60 min) on top of per-IP rate limiting; obvious PINs (1234, 0000, years) rejected. Sessions are JWTs stored on-device. Chat photos are sent to Gemini inline and never persisted — only a flag that the message included an image is kept in history.

### Client structure (`src/`)
`store/AuthStore.js` (session/token) and `store/PlanStore.js` (routine, meals, progress) are the state layer; `api/` is the HTTP client; `screens/` are the five main tabs (Today/Week/Food/Coach/Progress) plus the multi-step `screens/auth/` registration flow.

### Endpoints
All routes except `/health`, `/api/options`, and `/api/auth/*` require `Authorization: Bearer <token>`. Full list of routes/methods is in `README.md` under "Endpoints".
