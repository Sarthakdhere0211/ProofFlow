# ProofFlow

> Don't trust the claim. Verify the proof.

ProofFlow is a milestone-based project escrow and proof-verification platform.
Clients define milestones, fund an escrow on the Stellar blockchain, workers
submit verifiable proof of completion, clients approve, and the smart contract
releases payment automatically.

## Product Overview

```
Client creates project
  ↓
Defines milestones (amounts, due dates, definitions of done)
  ↓
Funds escrow (Stellar smart contract holds the funds)
  ↓
Worker completes milestone
  ↓
Worker submits proof (GitHub, live URL, file, description)
  ↓
Client verifies proof
  ↓
Milestone approved → smart contract releases payment
  ↓
ProofScore updated
  ↓
Permanent verifiable history
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full architecture.

**Stack:**
- Frontend: React 19, TypeScript, Vite 7, wouter, Tailwind CSS v4
- Backend: Express 5, TypeScript, pino
- API layer: OpenAPI 3.1, orval codegen, TanStack Query v5, Zod
- Database: PostgreSQL via Drizzle ORM (Phase 11)
- Blockchain: Stellar / Soroban (Rust smart contract — Phase 5)
- Wallet: Freighter browser extension (Phase 6)
- Package manager: pnpm workspaces

## Local Setup

### Prerequisites

- Node.js 22+
- pnpm 10+
- Git

### Install

```bash
pnpm install
```

### Environment variables

```bash
cp .env.example .env
# Edit .env with your values
```

Required for frontend dev:
```
PORT=5173
BASE_PATH=/
```

### Development

```bash
# Frontend
pnpm --filter @workspace/proofflow run dev

# API server
pnpm --filter @workspace/api-server run dev

# Typecheck all
pnpm run typecheck
```

## Environment Variables

See [.env.example](.env.example) for all required variables with descriptions.

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Server/dev port |
| `DATABASE_URL` | Phase 11 | PostgreSQL connection string |
| `JWT_SECRET` | Phase 3 | JWT signing secret (64+ random bytes) |
| `STELLAR_NETWORK` | Phase 5 | testnet or mainnet |
| `STELLAR_RPC_URL` | Phase 5 | Soroban RPC endpoint |
| `PROOFFLOW_CONTRACT_ID` | Phase 5 | Deployed contract ID |

## Wallet Setup (Phase 6)

1. Install [Freighter](https://www.freighter.app/) browser extension
2. Create or import a Stellar wallet
3. Switch to Testnet in Freighter settings
4. Fund your testnet account at [friendbot](https://friendbot.stellar.org)

## Testnet Setup (Phase 5)

1. Deploy the Soroban contract (see [docs/smart-contract.md](docs/smart-contract.md))
2. Set `PROOFFLOW_CONTRACT_ID` in your `.env`
3. Set `STELLAR_NETWORK=testnet`

## Smart Contract

See [docs/smart-contract.md](docs/smart-contract.md) for:
- Contract storage layout
- State machine
- Function signatures and authorization rules
- Escrow flow
- Security invariants

## Testing

```bash
# Type checking (runs now)
pnpm run typecheck

# Unit tests (Phase 9)
# pnpm run test

# Contract tests (Phase 9)
# pnpm --filter @workspace/contracts run test
```

## Security

See [docs/security.md](docs/security.md).

Key principles:
- Private keys never touch the server
- Contract is the source of truth for financial state
- Database never overrides on-chain state
- Transaction hash is verified on-chain before updating DB

## Deployment

### Current state (demo)
The frontend deploys as a static site (Vite build).
The API server deploys as a Node.js process.
No database required for the current browser-local demo.

### Production checklist
See [docs/security.md](docs/security.md) for the full pre-production security review.

Additional:
- [ ] Set NODE_ENV=production
- [ ] DATABASE_URL points to production database
- [ ] JWT_SECRET is a unique 64+ byte secret
- [ ] PROOFFLOW_CONTRACT_ID is the mainnet contract
- [ ] STELLAR_NETWORK=mainnet
- [ ] CORS_ORIGINS is set to production frontend URL only

## Known Limitations

- **Demo mode**: Current build uses localStorage only (no real database)
- **Auth**: Login/signup are demo stubs (Phase 3 for real JWT auth)
- **Blockchain**: DemoBlockchainService simulates operations (Phase 5-7 for real Soroban)
- **AI verification**: The checklist panel is illustrative — no AI model is connected
- **File uploads**: Filename is captured but files are not uploaded (Phase 7)
- **ProofScore**: Calculated from local demo data (Phase 11 for on-chain derivation)

## Phase Roadmap

| Phase | Description | Status |
|---|---|---|
| 0 | Repository audit | ✅ Complete |
| 1 | UI audit & cleanup | ✅ Complete |
| 2 | Application architecture | ✅ Complete |
| 3 | JWT authentication | 🔲 Planned |
| 4 | Wallet connection UI | 🔲 Planned |
| 5 | Soroban smart contract | 🔲 Planned |
| 6 | Wallet + blockchain integration | 🔲 Planned |
| 7 | Transaction lifecycle & confirmation | 🔲 Planned |
| 8 | Security hardening | 🔲 Planned |
| 9 | Testing suite | 🔲 Planned |
| 10 | API contract + real client | 🔲 Planned |
| 11 | Database (Drizzle + PostgreSQL) | 🔲 Planned |

## Mainnet Preparation Checklist

- [ ] Smart contract security audit by independent reviewer
- [ ] All Phase 3-11 items complete
- [ ] Full E2E test suite passing on testnet
- [ ] Rate limiting and security headers configured
- [ ] Monitoring and alerting set up
- [ ] Incident response plan documented
- [ ] No secrets in Git history
- [ ] Dependencies audited (pnpm audit)
- [ ] HTTPS enforced
- [ ] Backup strategy for database
