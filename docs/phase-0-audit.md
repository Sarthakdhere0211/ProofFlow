# ProofFlow — Phase 0 Architecture Audit

## Repository Structure

```
pnpm monorepo (workspace root)
├── artifacts/
│   ├── proofflow/          — React frontend (Vite + wouter + Tailwind v4 + React 19)
│   ├── api-server/         — Express 5 backend (TypeScript + pino logging)
│   └── mockup-sandbox/     — Separate design sandbox (not part of ProofFlow runtime)
├── lib/
│   ├── api-spec/           — OpenAPI 3.1 spec + orval codegen config
│   ├── api-client-react/   — Generated React Query client (TanStack Query v5)
│   ├── api-zod/            — Generated Zod validators from OpenAPI spec
│   └── db/                 — Drizzle ORM + pg (PostgreSQL) — schema is empty placeholder
└── scripts/                — Workspace automation scripts
```

## Technology Stack

| Layer             | Technology                                   |
|-------------------|----------------------------------------------|
| Frontend          | React 19, TypeScript, Vite 7, wouter         |
| Styling           | Tailwind CSS v4 (via @tailwindcss/vite), plain CSS variables |
| State             | React Context + localStorage (demo only)     |
| Routing           | wouter v3                                    |
| Forms             | react-hook-form + zod                        |
| API Client        | TanStack Query v5 + orval-generated fetchers |
| Backend           | Express 5, pino logging                      |
| Database layer    | Drizzle ORM + pg — SCHEMA IS EMPTY           |
| Blockchain        | **MockBlockchainService** — fully mocked     |
| Auth              | **None** — demo role-select only             |
| Package manager   | pnpm workspaces                              |
| Build             | Vite (frontend), esbuild (backend)           |
| TypeScript        | 5.9.x, strict null checks, noImplicitAny    |

## Current State Assessment

### What Works Well (Preserve)
- Solid visual design: cohesive CSS system with design tokens, responsive layout
- Complete routing structure: Landing, Auth, Dashboard, Projects, ProjectDetail, MilestoneDetail, ProofReview, Transactions, Reputation, Settings, Profile
- Good component decomposition: shared.tsx with reusable primitives
- Two-sided role model: client/worker role switching in UI
- Multi-step project creation wizard with milestone budget validation
- Proof submission and review flow (client approve / request changes)
- Responsive design with mobile nav
- Error boundary in place
- pino structured logging in backend
- OpenAPI spec → orval codegen pipeline already wired
- Drizzle + pg already chosen (just needs schema)
- Clean API layer foundation (Express 5, cors, json, urlencoded)
- Supply-chain security: minimumReleaseAge pnpm setting

### Critical Issues (Must Fix)

#### Blockchain (CRITICAL)
- `blockchain.ts` is 100% mock — `MockBlockchainService` does nothing
- No wallet integration whatsoever
- No real blockchain target identified yet (spec says Stellar/Soroban as possibility)
- Fake transaction IDs generated with `makeId('demo-tx')`
- No escrow logic anywhere
- No real state machine — milestone states are managed purely client-side in localStorage

#### Authentication (CRITICAL)
- No real auth — "login" only updates localStorage role
- No passwords, no JWT, no sessions, no protected routes
- No server-side validation of identity
- Role trust comes entirely from client

#### State Management (CRITICAL)
- All state stored in `localStorage` only
- No persistence layer (DB schema is empty)
- No API calls made from the frontend — zero real API integration despite generated client existing
- Store is a single flat object — no normalized entities

#### API / Backend (CRITICAL)
- API server only has `/api/healthz` endpoint
- No authentication endpoints
- No project/milestone endpoints
- No blockchain transaction endpoints
- OpenAPI spec only defines HealthStatus
- Generated API client and Zod validators only cover health check

#### Security Issues
- No `.env.example` file — environment variables undocumented
- `.gitignore` does not exclude `.env` files (HIGH — must fix)
- No rate limiting, CSRF protection, security headers
- No input validation on any API endpoints (none exist yet)
- No IDOR protection (no real API yet)
- Role determined by client-side select — trivially bypassable

#### Fake/Mock Functionality (All to be replaced)
- Transaction hashes are random strings like `demo-tx-abc1234`
- Payment records labeled "Demo Transaction" throughout
- ProofScore is a hardcoded number (94) with fake deltas (+17 projects, +63 milestones)
- "AI Verification Preview" is entirely fake — hardcoded checklist items
- Blockchain explorer links are absent (correctly — because there's nothing real)
- File uploads store only filename, no actual upload

#### Missing Features Required for Production
- Wallet connection (Stellar / Freighter wallet or equivalent)
- Real escrow contract
- Transaction lifecycle (PREPARING → SUBMITTED → CONFIRMING → CONFIRMED)
- Network/wallet status display
- Blockchain failure recovery (reconciliation on reconnect)
- Dispute mechanism (no UI, no contract logic)
- ProofScore calculation from on-chain events
- Content hash for proof submissions (file/URL integrity)
- Admin/arbiter role for dispute resolution
- Audit log
- Email notifications (even basic)
- Pagination on lists
- Protected routes (auth guard)

#### Dead Code / Placeholders
- `scripts/src/hello.ts` — placeholder only
- `lib/db/src/schema/index.ts` — empty export
- `lib/api-zod/src/generated/` — only health check generated
- `lib/api-client-react/src/generated/` — only health check generated

#### Missing Validation
- Project form: no server-side validation
- Milestone amounts: only client-side SUM check
- Proof submission: no URL validation, no file type validation, no size limits
- Dates: no past-date validation on milestone due dates

#### Missing Error/Loading States
- No loading spinners on async operations (blockchain calls)
- No retry mechanisms
- No skeleton screens on initial load
- No network error display
- No wallet-not-installed state
- No insufficient-balance state

## Phase Execution Order

Following the CRITICAL DEVELOPMENT RULE from the brief:

1. **Phase 1** — UI Audit & cleanup (fix dead buttons, add missing states, clean up fake data labels for dev mode)
2. **Phase 2** — Application architecture (layer separation: services, domain, hooks, API contract)
3. **Phase 3** — Authentication architecture (real JWT + bcrypt auth on the backend, protected frontend routes)
4. **Phase 4** — Blockchain architecture (wallet integration interface, transaction lifecycle, Stellar/Soroban decision)
5. **Phase 5** — Smart contract (Soroban contract in Rust: escrow, milestones, state machine)
6. **Phase 6** — Wallet integration (Freighter wallet, network detection, error handling)
7. **Phase 7** — Transaction lifecycle (full state machine, confirmation polling, reconciliation)
8. **Phase 8** — Security hardening (headers, rate limiting, CSRF, input validation, IDOR)
9. **Phase 9** — Testing (unit, integration, API, contract, E2E)
10. **Phase 10** — API contracts (full OpenAPI spec, regenerate client and Zod validators)
11. **Phase 11** — Database (Drizzle schema, migrations, Mongoose if needed, connect to architecture)

## Blockchain Target Decision

The existing code has a `MockBlockchainService` with Stellar/Soroban mentioned in comments.
The repo targets Replit deployment (Linux x64 only, as evidenced by pnpm overrides).
Stellar Soroban is the correct target because:
- Mentioned explicitly in `blockchain.ts` comments ("Replace this adapter with a Stellar/Soroban service later")
- Rust smart contracts are well-supported on Replit Linux
- Freighter browser wallet is the standard Stellar wallet extension
- Stellar Testnet (Futurenet/Testnet) is free and publicly available
- XLM/USDC transfers are natively supported

## Immediate Priorities (Phase 1 starts now)

1. Fix `.gitignore` to exclude `.env*` files
2. Create `.env.example` with all required variables documented
3. Add `docs/` directory with architecture documents
4. Establish layer separation in frontend source tree
5. Fix all broken UI states (loading, error, empty)
6. Remove hardcoded fake numbers from Reputation/Dashboard
7. Add transaction lifecycle state type to the domain model
