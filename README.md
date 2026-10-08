# Clothing Delivery Platform

Full-stack platform for browsing clothing, placing orders and getting them
delivered. Customers shop and follow deliveries, riders manage drop-offs, and
administrators run the catalogue, orders and deliveries.

```text
deliveryPlatform/
├── src/            Next.js frontend (this repo root)
│   ├── app/          App Router pages + route groups: (public), later (customer), (rider), (admin)
│   ├── components/   ui/ (design system), layouts/ (shells), auth/ (route protection)
│   ├── context/      AuthContext — current user + role
│   └── lib/          api.js — central API client
├── backend/        Express 5 REST API (see backend/README.md for the full endpoint reference)
├── .env.example    Frontend environment template
└── public/         Static assets
```

## Development setup

```bash
pnpm install          # dependencies
cp .env.example .env.local   # frontend environment (defaults work for local dev)

# backend (terminal 1) — requires its own backend/.env (see backend/README.md)
cd backend && npm install && npm run migrate && npm run seed && npm run dev   # http://localhost:5100

# frontend (terminal 2)
pnpm dev              # http://localhost:3000
```

| Command     | Purpose                    |
| ----------- | -------------------------- |
| `pnpm dev`  | Development server (Turbopack) |
| `pnpm build`| Production build           |
| `pnpm lint` | ESLint                     |

## Environment variables

Frontend env lives in `.env.local` (git-ignored); `.env.example` is the
committed template. Only `NEXT_PUBLIC_*` values reach the browser.

| Variable              | Purpose                          | Example                                   |
| --------------------- | -------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend base URL used by `src/lib/api.js` | `http://localhost:5100/api`         |
|                       | Production                       | `https://your-production-api.com/api`      |

**Never put backend secrets in `NEXT_PUBLIC_*`** (no `DATABASE_URL`,
`APP_SECRET`, JWT secrets or Aiven credentials — those belong to
`backend/.env`, which is git-ignored).

## API configuration

All HTTP access goes through the central client — components never hardcode
URLs:

```js
import { api, getApiErrorMessage } from "@/lib/api";

const { products } = await api.get("/products", { query: { page: 1 } });
const { user, token } = await api.post("/auth/login", { email, password });
```

- Understands the backend envelope `{ success, message, data, errors }` and
  returns `data` directly (`api.raw()` for the full envelope).
- Attaches `Authorization: Bearer <token>` automatically.
- Throws `ApiError { status, message, details }`; use `getApiErrorMessage(err)`
  for user-facing text (401 → session expired, 403 → access denied, 409 →
  business-rule message, 400/422 → validation details, 500/network → generic).
- On a 401 of an authenticated request it clears the token and emits the
  `auth:unauthorized` event; `AuthProvider` reacts by signing the user out.

## Authentication architecture

- `POST /api/auth/login` and `POST /api/auth/register` return
  `{ user, token }` — the JWT is stored in `localStorage` (`cdp.token`) and
  sent as a Bearer header.
- On app start, `AuthProvider` revalidates the session via `GET /api/auth/me`;
  the role always comes fresh from the database on every backend request.
- Frontend access: `useAuth()` → `{ user, loading, isAuthenticated, login,
  register, logout, refreshUser, hasRole }`.
- Protected sections wrap their layout in `<RoleGate roles={[...]}>`, which
  redirects unauthenticated users to `/login` and wrong roles to their area.

## Role structure

```text
PUBLIC REGISTRATION  →  always CUSTOMER   (any "role" field in the payload is ignored)
CUSTOMER             →  rider application workflow (pending → admin approval → RIDER)
RIDER                →  deliveries, availability, history
ADMIN                →  everything; maximum 5 administrator accounts platform-wide
```

Hard rules enforced by the backend (frontend only reflects them):

- **Public registration creates CUSTOMER accounts.** Privileged roles are
  never chosen by the client.
- **Rider accounts are created through the rider application + admin
  approval workflow.** *(The application endpoints are a future backend
  phase — today admins provision riders directly via `POST /api/riders`.)*
- **Maximum 5 administrators** (`409 Conflict` beyond that), enforced in the
  service layer, a database trigger and the seeders.

## Route architecture

| Area     | Route group      | Layout                        | Access                        |
| -------- | ---------------- | ----------------------------- | ----------------------------- |
| Public   | `app/(public)`   | `PublicLayout` (header/footer)| everyone                      |
| Customer | `app/(customer)` | `CustomerLayout` (Phase 2)    | `RoleGate` → CUSTOMER         |
| Rider    | `app/(rider)`    | `RiderLayout` (Phase 2)       | `RoleGate` → RIDER            |
| Admin    | `app/(admin)`    | `AdminLayout` (Phase 2)       | `RoleGate` → ADMIN            |

All dashboards share one `DashboardLayout` (sidebar + topbar, responsive) —
navigation is passed in, never duplicated.

## Backend API (summary)

The full endpoint table, request/response shapes and business rules live in
[`backend/README.md`](backend/README.md). Groups that exist today:

| Area           | Base path                     | Notes |
| -------------- | ----------------------------- | ----- |
| Health         | `GET /api/health`             | public |
| Auth           | `/api/auth/*`                 | register (CUSTOMER), login, me, password |
| Addresses      | `/api/addresses*`             | owner-scoped |
| Categories     | `/api/categories*`            | public read, admin write |
| Products       | `/api/products*`              | public read (ACTIVE), admin CRUD + variants + images |
| Cart           | `/api/cart*`                  | per-user |
| Orders         | `/api/orders*`                | checkout, cancel, admin status + rider assignment |
| Payments       | `/api/payments*`              | CASH / CARD / TRANSFER, amount mirrors order total |
| Riders         | `/api/riders*`                | rider self-service + admin management |
| Deliveries     | `/api/deliveries*`            | scoped lists, assign, status transitions |
| Admin          | `/api/admin/*`                | users, roles, administrators (max 5) |

**Future endpoints** (planned, not implemented — do not call yet):

- `POST /api/rider-applications` — customer submits a rider application
- `GET /api/rider-applications`, `PATCH /api/rider-applications/:id/approve|reject`
  — admin approval workflow that promotes an approved applicant to RIDER

## Frontend status

Phase 1 (foundation) is in place: design tokens + reusable UI components,
public/dashboard layout shells, central API client, auth context and
role-based route protection. Storefront, dashboards, checkout and the rider
application UI arrive in later phases.
