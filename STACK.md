# Stack & Decisions Log

Short log of what's used and why. Add an entry whenever a new library, service, or major config choice is introduced.

## Frontend

- **Vite + React 19 + TypeScript** — client-heavy, authenticated SPA with no SEO/SSR need; Vite's tooling is simpler than Next.js for this shape of app, and its offline/PWA plugin is more mature for pure SPAs.
- **react-router-dom** — standard client-side routing for the SPA.
- **Tailwind CSS v4** — utility CSS, theme defined in `src/index.css` via `@theme`/CSS variables (emerald/green accent, light theme, matches Brittoo branding).
- **shadcn/ui-style components** (`src/components/ui/`) — hand-written (not CLI-generated: the `shadcn` CLI kept failing with "Could not load the workspace config" on this machine, likely due to the space in the project folder name) but following shadcn's exact conventions (Radix primitives + `cva` + `cn()`), so official shadcn docs/examples still apply directly.
- **Radix UI primitives** (`@radix-ui/react-*`) — accessible unstyled behavior (dialogs, sheets, selects, tabs, labels) underneath the shadcn-style components.
- **class-variance-authority, clsx, tailwind-merge** — variant styling and safe class-name merging for the UI components.
- **lucide-react** — icon set used by the UI components.
- **vite-plugin-pwa** (Workbox) — generates the service worker + manifest for installability and offline app-shell caching.
- **sonner** — toast notifications, used for the add/delete-with-undo pattern (`src/lib/toastActions.ts`'s `notifyWithUndo`): every create/delete of a product, product type, owner, or renter is a soft delete (existing `deleted_at` column) with a few seconds to reverse via the toast's Undo action, rather than a confirm-before-you-act dialog.

## PWA

How it works: `vite-plugin-pwa` runs Workbox at build time to generate a service worker (`dist/sw.js`) plus a `manifest.webmanifest`. The service worker precaches the app shell (JS/CSS/HTML/icons) so the app loads even with no network, and the manifest is what lets a browser treat the site as an installable app (name, icons, theme color, `display: standalone` for a chrome-less window). None of this touches app *data* yet — that's Phase 2/3's Dexie sync engine; this is purely "does the app shell load offline and install like an app."

Extra steps needed beyond a normal Vite app (all in `vite.config.ts`'s `VitePWA({...})` block):
- Register the plugin and set `registerType: 'autoUpdate'` so a new deploy's service worker takes over automatically instead of silently serving a stale cached version.
- Declare a `manifest` (name, short_name, theme/background color, icons) — without real icon files here, "Add to Home Screen" either fails or looks broken.
- List any non-hashed static files (e.g. `fav.png`, `brittoo-logo.png`) in `includeAssets` and in the `workbox.globPatterns` file-type list, or Workbox won't know to precache them.
- Served over HTTPS (or localhost) — service workers refuse to register on plain HTTP, which Netlify's default domain satisfies automatically.

## Dashboard UI

- Products render as a spreadsheet-style table (`ProductTable.tsx`) rather than cards: Name / Available (tick·cross·pause icons) / editable Remarks / delete. The pause icon reuses the existing `maintenance` status value to mean "temporarily unavailable" — no schema change needed for that.
- Data hooks (`useProducts`, `useProductTypes`, `useContacts`) guard against an out-of-order-refresh race: Realtime can fire `refresh()` faster than each request resolves, and without a request-id check, an older response landing after a newer one would flash stale data back onto the screen.
- **Team notes** (`notes` table, `NotesBubble.tsx`) — a floating chat-bubble launcher (bottom-left, visible on every page via `AppShell`) opening a shared note board. Anyone can post; delete is restricted to the note's own author or a coordinator with `role = 'admin'`, enforced in the `notes_update` RLS policy itself (soft-delete via `deleted_at`), not just hidden client-side.

## Data & auth (Phase 1, done — online only)

- **@supabase/supabase-js** — Postgres access, Auth, and Realtime client (`src/lib/supabaseClient.ts`, typed against `src/types/database.types.ts`).
- **`src/lib/auth.tsx`** — thin `AuthProvider`/`useAuth` wrapping Supabase Auth session + the matching `coordinators` row; `ProtectedRoute` redirects to `/login` when signed out.
- **Data hooks** (`src/hooks/`) — `useProducts`, `useProductTypes`, `useOwners`/`useRenters` each fetch once and re-fetch on a **Realtime** `postgres_changes` subscription, so any coordinator's change appears live for everyone without polling. Each hook instance uses a unique channel name (`useId()`) — reusing a static channel name across multiple mounted instances of the same hook crashes Supabase's realtime-js client ("cannot add callbacks after subscribe()"), hit and fixed during Phase 1 testing.
- **`src/lib/productActions.ts`** — calls the `change_product_status` RPC and translates a `version_conflict` error into a `{ conflict: true }` result the UI can show inline; this is the seam Phase 3's offline sync engine will reuse.
- **react-hook-form + zod** — used in `ProductTypeForm` for the dynamic attribute-schema builder; simpler forms (login, product instance, contacts) use plain `useState` since react-hook-form's benefit (schema validation, field arrays) only pays off for that one dynamic form.

## Offline sync (Phase 2/3, not started)

- **Dexie.js + dexie-react-hooks** — planned local IndexedDB layer; the UI will read/write Dexie only, with a sync engine reconciling it against Supabase. This is what will make the app work offline. Already installed, not yet wired in.

## Backend (Supabase project: `brittoo-cycle-manager`, region `ap-southeast-1`)

- **Postgres schema**: `coordinators`, `product_types`, `owners`, `renters`, `products`, `rental_events` — see `supabase/` migrations (applied directly via MCP; local migration files to be added when the Supabase CLI is wired in).
- **Row Level Security** enabled + forced on every table — full read/write for authenticated coordinators, with write-attribution columns (`coordinator_id`, `created_by`) checked against `auth.uid()` so a client can't spoof another coordinator's identity in the audit trail.
- **`change_product_status` RPC** — single atomic function (status update + `rental_events` audit row) used by both the online UI and the offline sync engine, with an optimistic-concurrency `status_version` guard for conflict detection when two coordinators edit the same product offline.
- **Realtime** enabled on `products` and `rental_events` so other coordinators' changes merge in live while online.

## Hosting / deploy

- **Netlify**, auto-deploying from `main` on `INmahi/brittoo.xyz-resource-management` (build: `npm run build`, publish: `dist`). Supabase URL/publishable key are set as Netlify env vars, not committed to the repo.

## Notable constraints

- Commits in this repo should not carry a "Co-Authored-By: Claude" trailer (user preference).
