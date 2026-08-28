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

## Data & offline sync (Phase 2/3, in progress)

- **@supabase/supabase-js** — Postgres access, Auth, and Realtime client.
- **Dexie.js + dexie-react-hooks** — local IndexedDB layer; the UI reads/writes Dexie only, with a sync engine reconciling it against Supabase. This is what makes the app work offline.
- **react-hook-form + zod** — forms, including attribute forms generated dynamically from a product type's schema.

## Backend (Supabase project: `brittoo-cycle-manager`, region `ap-southeast-1`)

- **Postgres schema**: `coordinators`, `product_types`, `owners`, `renters`, `products`, `rental_events` — see `supabase/` migrations (applied directly via MCP; local migration files to be added when the Supabase CLI is wired in).
- **Row Level Security** enabled + forced on every table — full read/write for authenticated coordinators, with write-attribution columns (`coordinator_id`, `created_by`) checked against `auth.uid()` so a client can't spoof another coordinator's identity in the audit trail.
- **`change_product_status` RPC** — single atomic function (status update + `rental_events` audit row) used by both the online UI and the offline sync engine, with an optimistic-concurrency `status_version` guard for conflict detection when two coordinators edit the same product offline.
- **Realtime** enabled on `products` and `rental_events` so other coordinators' changes merge in live while online.

## Hosting / deploy

- Not yet wired up. Plan: Netlify (pending the user authorizing the Netlify connector) deploying from the GitHub repo `INmahi/brittoo.xyz-resource-management`.

## Notable constraints

- Commits in this repo should not carry a "Co-Authored-By: Claude" trailer (user preference).
