# ProofFlow — Architecture

## System Overview

ProofFlow is a milestone-based project escrow and proof-verification platform.
The blockchain is the source of truth for financial state.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  Landing / Auth / Dashboard / Projects / ProofReview         │
│  Wallet Connection UI / Transaction Status UI                │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / REST (TanStack Query)
┌───────────────────────▼─────────────────────────────────────┐
│                    API Server (Express 5)                     │
│  Auth Routes / Project Routes / Proof Routes / Tx Routes     │
│  JWT Middleware / Validation (Zod) / Error Handler           │
└───────────┬───────────────────────────┬─────────────────────┘
            │ Drizzle ORM               │ Stellar SDK
┌───────────▼──────────┐   ┌───────────▼─────────────────────┐
│   PostgreSQL (DB)     │   │   Stellar Network (Testnet)       │
│   Users / Projects    │   │   ProofFlow Soroban Contract      │
│   Milestones / Proofs │   │   Escrow / State Machine          │
│   Transactions / Logs │   │   Payment Release                 │
└──────────────────────┘   └─────────────────────────────────┘
```

## Layer Separation

### Presentation Layer (`artifacts/proofflow/src/`)
- `pages/` — Route-level page components
- `components/` — Reusable UI components
- `context/` — React context providers

### Application Layer
- `hooks/` — Custom React hooks (data fetching, wallet, form logic)
- `services/store.ts` — Demo persistence (localStorage) — replaced by API calls in Phase 10
- `services/blockchain.ts` — Blockchain service interface + demo stub

### Domain Layer
- `types/index.ts` — Core domain types (mirrors smart contract state machine)

### Infrastructure Layer
- `artifacts/api-server/` — Express 5 backend
- `lib/api-spec/` — OpenAPI 3.1 specification
- `lib/api-client-react/` — Generated TanStack Query client
- `lib/api-zod/` — Generated Zod validators
- `lib/db/` — Drizzle ORM schema + migrations

## State Machine

### Project States
```
DRAFT → FUNDED → ACTIVE → COMPLETED
                        → CANCELLED
                        → DISPUTED
```

### Milestone States
```
PENDING → FUNDED → PROOF_SUBMITTED → UNDER_REVIEW → APPROVED → RELEASED
                                                  → REJECTED (back to FUNDED)
                                                  → DISPUTED
```

## Blockchain Integration (Phase 5-7)

The Soroban smart contract is the source of truth for:
- Escrow balance
- Milestone payment state
- Project ownership (client/worker addresses)
- Contract financial state

The database stores:
- User profiles and authentication
- Project descriptions and metadata
- Proof URLs and file references
- Notifications
- Analytics and caching

**The database must never override authoritative blockchain financial state.**

## Transaction Lifecycle

```
IDLE → PREPARING → AWAITING_SIGNATURE → SUBMITTED → CONFIRMING → CONFIRMED
                 ↓                    ↓
          USER_REJECTED           FAILED | TIMEOUT | NETWORK_ERROR
```

After CONFIRMED:
1. Query blockchain for authoritative state
2. Update database
3. Update UI from confirmed state (not from optimistic local state)

## Wallet Integration

Stellar wallet: Freighter browser extension
- Wallet address comes from connected wallet only
- Private keys never touch the application
- Wallet signs transactions — server never holds user signing keys

## Current Implementation Phase

**Phase 2 complete** — Architecture foundation.

Remaining phases:
- Phase 3: Real JWT authentication with bcrypt
- Phase 4: Freighter wallet connection UI
- Phase 5: Soroban smart contract (Rust)
- Phase 6: Full wallet integration and transaction flow
- Phase 7: Transaction confirmation and reconciliation
- Phase 8: Security hardening (rate limiting, CSP, CSRF)
- Phase 9: Testing suite
- Phase 10: API codegen + real TanStack Query integration
- Phase 11: Database schema and migration
