# Clothing Delivery Platform

Full-stack platform for browsing clothing, placing orders and getting them
delivered. Customers shop and follow deliveries, riders manage drop-offs, and
administrators run the catalogue, orders and deliveries.

```text
deliveryPlatform/
├── src/            Next.js frontend (this repo root)
│   ├── app/          App Router pages + route groups: (public), later (customer), (rider), (admin)
│   ├── components/   ui/ (design system), layouts/ (shells), storefront/ (catalogue UI), auth/ (route protection)
│   ├── context/      AuthContext — current user + role
│   └── lib/          api.js (API client), catalog.js (storefront fetchers), format.js (currency), url.js (query helpers)
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
| Customer | `app/(customer)` | `CustomerLayout` (nav + role gate)| `RoleGate` → CUSTOMER         |
| Rider    | `app/(rider)`    | `RiderLayout` (later phase)   | `RoleGate` → RIDER            |
| Admin    | `app/(admin)`    | `AdminLayout` (later phase)   | `RoleGate` → ADMIN            |

All dashboards share one `DashboardLayout` (sidebar + topbar, responsive) —
navigation is passed in, never duplicated.

## Public storefront (Phase 2)

| Route                  | Data |
| ---------------------- | ---- |
| `/`                    | hero collage, category covers, featured products (`GET /categories`, `GET /products`), promo, how-it-works |
| `/shop`                | search (`q`), category filter, min/max price, sort (newest/price_asc/price_desc/name), pagination — all via `GET /products` |
| `/categories`          | `GET /categories` (real `productCount`, cover image derived from each category's first product) |
| `/categories/[slug]`   | `GET /categories/:slug` + products, search (`q`), min/max price, sort + pagination |
| `/products/[id]`       | `GET /products/:idOrSlug` — gallery, size/colour variant picker with per-combo stock, discount badge, real `POST /cart/items` add-to-cart (signed-in only), related products |
| `/about`, `/contact`   | static copy; contact form composes a mailto (no backend contact endpoint yet) |
| `/cart`                | interactive — qty stepper (`PATCH /cart/items/:id`), remove, stock/inactive warnings, disabled checkout while blocked items exist |
| `/privacy`, `/terms`   | static |

- Money is formatted by one central constant (`src/lib/format.js` — NGN/`₦`);
  no currency value is scattered through components.
- Header/nav is auth-aware (guest → Sign in/Register; customer → Orders;
  rider/admin → their area) and the cart badge tracks the real `GET /cart`
  count via the `cart:updated` event.
- **Mobile filtering**: on `lg` and below the shop/category filter block is
  replaced by a `[Filters]` button that opens the same `ShopFilters` in a
  sheet (`MobileFilters` + `Modal`).
- **Not faked, not available yet**: contact submission endpoint, popularity
  sort, category cover images (derived client-side from product images),
  wishlist, rider application flow.

## Auth, cart & checkout (Phases 5–6)

| Route                        | Data / behaviour |
| ---------------------------- | ---------------- |
| `/login`, `/register`        | `POST /auth/login`, `POST /auth/register` (server shells + client forms; `?next=` returns you to the page you came from, validated against open redirects and never pointing back at an auth screen) |
| `/customer`                  | dashboard (`GET /orders {limit:5}`) — greeting, totals, recent orders; `/customer/dashboard` redirects here |
| `/customer/orders`           | paginated own-order list (`GET /orders`) |
| `/customer/orders/[id]`      | order detail (`GET /orders/:id`) — items, totals, address, payments; two-step cancel button (`POST /orders/:id/cancel`) while PENDING/CONFIRMED |
| `/checkout`                  | address picker (`GET /addresses`) + add-address modal (`POST /addresses`), payment method (CASH/CARD/TRANSFER), sticky summary. `POST /orders {addressId}` → `POST /payments {method}` → redirect to the success screen; payment failure is reported honestly instead of hidden |
| `/checkout/success`          | confirmation screen (`GET /orders/:id`) — order number, status, totals, payment state |

Notes:

- Order creation is **server-priced**: the backend recomputes every line from
  the database, validates stock under row locks, applies `DELIVERY_FEE` (env,
  default ₦1,500) and clears the cart. The frontend only previews that same
  default constant (`DELIVERY_FEE` in `src/lib/format.js`) — the API response
  is authoritative.
- The order `note` field is accepted by the API but ignored by the service,
  so no note UI is built.
- Backend fix shipped with this phase: cart routes registered `/:itemId`
  while validating `{id}`, making `PATCH`/`DELETE /api/cart/items/:id`
  always 400 — the param is now `:id` end-to-end.

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

Phase 1 (foundation), Phase 2 (public website & storefront), Phase 5
(product catalog & shopping) and Phase 6 (cart & checkout) are in place:
design tokens + reusable UI components, layout shells, central API client,
auth context, role-based route protection, the full public catalogue
experience, interactive cart, address/payment checkout with order
confirmation, and the customer account area (dashboard, order list, order
detail with cancel). The hero on `/` is a full-bleed background image under
a warm-sand overlay. Rider/admin dashboards and the rider application UI
arrive in later phases.
