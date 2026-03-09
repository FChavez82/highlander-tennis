# CLAUDE.md — Highlander Tennis (Colinas Invitational)

This file documents the codebase for AI assistants. Read it fully before making changes.

---

## Project Overview

A full-stack tennis tournament management app built with **Next.js 14 App Router** and **Vercel Postgres**.
It manages the "Colinas Invitational" (April 6 – June 30, 2026) — a two-phase tournament with male and female categories:

1. **Phase 1 – Round Robin**: All players play each other.
2. **Phase 2 – Bracket Elimination**: Top 4 per category advance (Semifinal → Final + 3rd Place).

The entire UI is in **Spanish**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router, React 18, TypeScript 5) |
| Database | Vercel Postgres (raw SQL via `@vercel/postgres`) |
| Auth | NextAuth 4 — Google OAuth, JWT strategy, email whitelist |
| Styling | Tailwind CSS 3.4 + custom CSS variables (glass-morphism theme) |
| Icons | lucide-react |
| Deployment | Vercel |

---

## Directory Structure

```
app/
  api/                      # Next.js Route Handlers
    auth/[...nextauth]/     # Google OAuth
    players/                # Players REST API
    matches/                # Matches REST API
    schedule/               # Schedule weeks API
    admin/reset/            # Danger: wipes tournament data
  admin/                    # Protected admin pages
    jugadores/              # Player management
    resultados/             # Enter match scores
    calendario/             # Schedule management
    logs/                   # Audit log viewer
  clasificacion/            # Public standings
  jugadores/                # Public player profiles
  resultados/               # Public match results
  calendario/               # Public schedule
  reglas/                   # Tournament rules
  grupos/                   # Format explorer (Groups)
  suizo/                    # Format explorer (Swiss bracket)
  components/               # Shared React components
  layout.tsx                # Root layout (navbar, footer)
  page.tsx                  # Homepage

lib/
  db.ts                     # All database queries (~40 functions, 858 lines)
  constants.ts              # All magic strings, config, metadata
  auth.ts / auth-options.ts # Auth setup
  scheduler.ts              # Bi-weekly matching algorithm
  formats.ts                # Tournament format generators
  score.ts                  # Tennis score parsing & winner logic
  audit.ts                  # Admin action logging
  utils.ts                  # Generic helpers

scripts/
  setup-db.ts               # Creates all tables (run once)
  seed.ts                   # Seeds sample data
  seed-swiss.ts             # Seeds Swiss bracket simulation
  seed-swiss-full.ts        # Seeds full tournament simulation
  seed-players.ts           # Batch player creation
```

---

## Database Schema

Tables are created by `scripts/setup-db.ts`. There is **no ORM** — all queries use `sql` template literals from `@vercel/postgres`.

```sql
players        (id, name, category, created_at)
matches        (id, player_a_id, player_b_id, category, status, score,
                date_played, phase, bracket_round, week_id, created_at)
schedule_weeks (id, week_number, start_date, end_date, status, created_at)
player_availability (id, player_id, week_id, available)
audit_logs     (id, admin_email, action, entity_type, entity_id,
                prev_values, new_values, created_at)
```

**Key constraints**:
- `matches.player_a_id` / `player_b_id` are **nullable** (bracket placeholder slots).
- `matches.status` must be one of: `'pendiente'`, `'jugado'`, `'cancelado'`.
- `matches.phase` defaults to `'round_robin'`; bracket phases use `'bracket'`.
- `matches.bracket_round`: `'semifinal'`, `'final'`, `'third_place'`, or NULL.
- `schedule_weeks.status`: `'draft'`, `'published'`, `'completed'`.
- `player_availability` has a UNIQUE constraint on `(player_id, week_id)`.

---

## Constants (`lib/constants.ts`)

**Never use raw string literals** for categories, phases, statuses, or rounds. Always import from `lib/constants.ts`:

```ts
import { CATEGORY, PHASE, BRACKET_ROUND, MATCH_STATUS, SCHEDULE_STATUS } from '@/lib/constants'

CATEGORY.MALE      // 'M'
CATEGORY.FEMALE    // 'F'
PHASE.ROUND_ROBIN  // 'round_robin'
PHASE.BRACKET      // 'bracket'
BRACKET_ROUND.SEMIFINAL   // 'semifinal'
BRACKET_ROUND.FINAL       // 'final'
BRACKET_ROUND.THIRD_PLACE // 'third_place'
MATCH_STATUS.PENDING    // 'pendiente'
MATCH_STATUS.PLAYED     // 'jugado'
MATCH_STATUS.CANCELLED  // 'cancelado'
SCHEDULE_STATUS.DRAFT      // 'draft'
SCHEDULE_STATUS.PUBLISHED  // 'published'
SCHEDULE_STATUS.COMPLETED  // 'completed'
```

Other important exports from `constants.ts`:
- `REVALIDATE_SECONDS` — ISR cache TTL (60 in prod, 0 in dev).
- `TOURNAMENT_NAME`, `TOURNAMENT_DATES` — display metadata.
- `SCORE_REGEX` — tennis score validation pattern.
- `ADMIN_EMAILS` — derived from `process.env.ADMIN_EMAILS`.

---

## Authentication & Authorization

- **Provider**: Google OAuth via NextAuth.
- **Strategy**: JWT (no session table in DB).
- **Admin whitelist**: Emails listed in `process.env.ADMIN_EMAILS` (comma-separated).
- Admin gate check pattern in Route Handlers:

```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ADMIN_EMAILS } from '@/lib/constants'

const session = await getServerSession(authOptions)
if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## API Routes

All routes live under `app/api/`. They follow standard REST conventions.

| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/api/players` | List (optional `?category=M\|F`) or create |
| GET/PUT/DELETE | `/api/players/[id]` | Single player |
| GET/POST | `/api/matches` | List (filters: `category`, `status`, `phase`) or generate |
| GET/PUT/DELETE | `/api/matches/[id]` | Single match |
| GET/POST | `/api/schedule` | List weeks or generate next N weeks |
| GET/PUT | `/api/schedule/[weekId]` | Get/update week |
| POST | `/api/schedule/[weekId]/generate` | Generate matches for week |
| PUT | `/api/schedule/[weekId]/availability` | Update player availability |
| POST | `/api/admin/reset` | **Danger** — wipes all tournament data |

**`POST /api/matches` body shapes**:
- Generate round-robin: `{ category: 'M' | 'F' }`
- Generate bracket: `{ category: 'M' | 'F', action: 'generate_bracket', qualifiers: Player[] }`

---

## React Component Conventions

### Server vs. Client Components

- **Default to Server Components** — no `"use client"` unless the component uses hooks, event handlers, or browser APIs.
- Client Components are in `app/components/` and marked with `"use client"` at the top.

### Current Client Components

| File | Why it's a Client Component |
|------|------------------------------|
| `NavLinks.tsx` | Mobile menu state (`useState`) |
| `CategoryTabs.tsx` | URL search param updates (`useRouter`, `useSearchParams`) |
| `Providers.tsx` | NextAuth `SessionProvider` |
| `ShaderBackground.tsx` | CSS animation (could be server, kept client for clarity) |

### Data Fetching

- Server pages call `lib/db.ts` functions directly (no `fetch`).
- Use `import { unstable_noStore as noStore } from 'next/cache'` on pages that must always be fresh.
- Use `export const revalidate = REVALIDATE_SECONDS` on pages that can be cached.

---

## Styling Conventions

- **Tailwind CSS** utility classes are preferred over custom CSS.
- Theme colors use HSL CSS variables defined in `app/globals.css`:
  - `--cat-male` / `--cat-female` — blue / pink category tints.
  - `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, etc.
- **Glass-morphism** helper classes (defined in `globals.css`):
  - `glass` — subtle backdrop blur card.
  - `glass-strong` — heavier blur, used for modals/panels.
  - `glass-interactive` — adds hover/active states.
- Font variables: `--font-inter` (body), `--font-oswald` (headings).

---

## Scheduling System (`lib/scheduler.ts`)

The bi-weekly scheduler generates match pairings for a given week:
- Respects `player_availability` records.
- Uses a greedy algorithm that minimizes the number of byes (unmatched players).
- Fairness metric: players with more prior byes are matched first.
- Generates `schedule_weeks` rows then attaches matches to them via `week_id`.

---

## Audit Logging (`lib/audit.ts`)

All admin mutations (create, update, delete players/matches; bracket generation; reset) must call `logAuditAction`. The log stores:
- Admin email.
- Action type string.
- Entity type + ID.
- JSON snapshot of values **before** and **after** the change.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | Yes | Vercel Postgres connection string |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth app ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth app secret |
| `ADMIN_EMAILS` | Yes | Comma-separated admin email whitelist |
| `VERCEL_URL` | Auto | Set by Vercel; used for canonical URLs |
| `NODE_ENV` | Auto | `development` / `production` |

Create a `.env.local` file locally (it is gitignored).

---

## Development Workflow

```bash
# Install dependencies
npm install

# Initialize database (run once against your Vercel Postgres instance)
npm run setup-db

# Seed sample data
npm run seed          # Basic round-robin data
npm run seed-swiss    # Swiss bracket simulation
npm run seed-players  # Batch player creation

# Start dev server (http://localhost:3000)
npm run dev

# Lint
npm run lint

# Production build
npm run build
```

> There are **no automated tests**. Validate changes manually using the seed scripts and the admin UI.

---

## Key Conventions & Rules

1. **No magic strings** — always use constants from `lib/constants.ts` for categories, statuses, phases, and rounds.
2. **Raw SQL only** — no ORM. Write SQL via `sql\`...\`` from `@vercel/postgres`. Always use parameterized queries.
3. **All database logic lives in `lib/db.ts`** — route handlers call db functions, never raw SQL directly.
4. **Server Components by default** — add `"use client"` only when required.
5. **Audit every admin mutation** — call `logAuditAction` from `lib/audit.ts` for all write operations performed by admins.
6. **Spanish UI** — all user-facing text, labels, and DB string values are in Spanish.
7. **ISR caching** — use `export const revalidate = REVALIDATE_SECONDS` on cacheable pages. Use `noStore()` for fully dynamic pages.
8. **TypeScript strict mode** — no `any`, no unchecked type casts.
9. **Path alias** — use `@/` for all imports from the project root (configured in `tsconfig.json`).
10. **Nullable bracket slots** — `player_a_id` / `player_b_id` in `matches` can be NULL for bracket placeholder rows. Handle this in all queries.

---

## Common Pitfalls

- **Forgetting `noStore()`** on admin pages will cause stale data to be served from the ISR cache.
- **Adding raw status/phase strings** instead of constants will break the centralized constant system.
- **Skipping audit logging** on new admin mutations will create accountability gaps.
- **`ADMIN_EMAILS` env var** must be set even locally or all admin routes will return 403.
- **Bracket matches** can have NULL player IDs — never assume both IDs are present.
- The **`/api/admin/reset`** endpoint is destructive; it is protected by admin auth but handle with care in code.
