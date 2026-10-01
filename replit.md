# ProofFlow

A browser-based demo for client–worker milestone planning, proof submission, human review, demo payment records, and ProofScore.

## Run & Operate

- `pnpm --filter @workspace/proofflow run dev` — run the ProofFlow web app
- `pnpm --filter @workspace/proofflow run typecheck` — typecheck the app
- `pnpm run typecheck` — typecheck all workspace packages
- No database or third-party credentials are required for the current demo.

## Stack

- pnpm workspaces, React, TypeScript, Vite, and wouter
- Plain CSS, Lucide icons, and browser `localStorage` for demo persistence

## Where things live

- `artifacts/proofflow/src/pages/` — public pages and client/worker workspace routes
- `artifacts/proofflow/src/services/store.ts` — demo data, browser persistence, and domain types
- `artifacts/proofflow/src/services/blockchain.ts` — mock payment service abstraction
- `artifacts/proofflow/src/index.css` — app theme and responsive styles

## Architecture decisions

- Keep the current MVP browser-only; do not add a database until the user asks to resume that work.
- Treat sign-in and role switching as demo access, not production authentication.
- Label simulated payment records as `Demo Transaction`; never present them as real blockchain activity.
- Keep the AI Verification Preview illustrative and make clear no model analyzed the proof.
- Proof attachments currently retain only the selected filename in the browser demo.

## Product

Clients can create projects and milestones, review worker-submitted proof, approve work or request changes, and track demo payment status. Workers can switch roles, submit proof links/notes, and view project progress and reputation. The landing page explains the product and its future-facing Web3 direction without claiming those features are live.

## User preferences

- The user asked not to build a database for now.

## Gotchas

- Browser-local demo records do not sync across devices or browsers.
- File selection is a preview only; no file bytes are uploaded or persisted.
- Mock approval only changes local demo state; it does not escrow or move funds.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
