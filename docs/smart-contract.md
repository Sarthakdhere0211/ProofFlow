# ProofFlow — Smart Contract Specification

## Overview

The ProofFlow escrow contract is a Soroban smart contract on the Stellar network.
It is the authoritative source of truth for all financial state.

## Target: Stellar Soroban (Rust)

- Network: Stellar Testnet (development), Stellar Mainnet (production)
- Language: Rust with soroban-sdk
- Token: XLM native or USDC (SEP-41 / Stellar Asset Contract)
- Wallet: Freighter browser extension

## Contract Storage

```rust
// Project storage key
#[contracttype]
pub enum DataKey {
    Project(u64),          // project_id -> ProjectState
    Milestone(u64, u32),   // (project_id, milestone_index) -> MilestoneState
    ProjectCount,          // Global counter for project IDs
}

#[contracttype]
pub struct ProjectState {
    pub client: Address,
    pub worker: Address,
    pub token: Address,
    pub total_amount: i128,
    pub status: ProjectStatus,
    pub created_at: u64,    // ledger timestamp
    pub milestone_count: u32,
}

#[contracttype]
pub struct MilestoneState {
    pub project_id: u64,
    pub amount: i128,
    pub status: MilestoneStatus,
    pub proof_hash: BytesN<32>,  // SHA-256 of proof content (32 bytes)
    pub created_at: u64,
    pub approved_at: u64,
    pub paid_at: u64,
}

#[contracttype]
pub enum ProjectStatus {
    Draft = 0,
    Funded = 1,
    Active = 2,
    Completed = 3,
    Cancelled = 4,
    Disputed = 5,
}

#[contracttype]
pub enum MilestoneStatus {
    Pending = 0,
    Funded = 1,
    ProofSubmitted = 2,
    UnderReview = 3,
    Approved = 4,
    Released = 5,
    Rejected = 6,
    Disputed = 7,
}
```

## Contract Functions

### `create_project`
```rust
pub fn create_project(
    env: Env,
    client: Address,
    worker: Address,
    token: Address,
    milestone_amounts: Vec<i128>,
) -> u64  // Returns project_id
```
- Authorization: `client.require_auth()`
- Creates project in DRAFT state
- Validates: amounts > 0, at least 1 milestone
- Returns the new project ID

### `fund_project`
```rust
pub fn fund_project(env: Env, project_id: u64, caller: Address)
```
- Authorization: `caller.require_auth()`, caller must be `project.client`
- Transfers `total_amount` of `token` from client to contract escrow
- Transitions: DRAFT → FUNDED → ACTIVE
- Validates: project is in DRAFT state

### `submit_proof_reference`
```rust
pub fn submit_proof_reference(
    env: Env,
    project_id: u64,
    milestone_index: u32,
    caller: Address,
    proof_hash: BytesN<32>,
)
```
- Authorization: `caller.require_auth()`, caller must be `project.worker`
- Stores proof hash on-chain
- Transitions: FUNDED/REJECTED → PROOF_SUBMITTED → UNDER_REVIEW
- Validates: milestone is in FUNDED or REJECTED state

### `approve_milestone`
```rust
pub fn approve_milestone(
    env: Env,
    project_id: u64,
    milestone_index: u32,
    caller: Address,
)
```
- Authorization: `caller.require_auth()`, caller must be `project.client`
- Transitions: UNDER_REVIEW → APPROVED → RELEASED (atomic)
- Releases payment to worker (inline with approval)
- Validates: milestone is in UNDER_REVIEW state

### `release_milestone_payment`
```rust
// Internal — called by approve_milestone
fn release_payment(env: &Env, project: &ProjectState, milestone: &MilestoneState)
```
- Transfers milestone amount from contract escrow to `project.worker`
- Double-release protection: checks milestone.status == APPROVED, then sets RELEASED
- Uses token.transfer(contract, worker, amount)

### `reject_milestone`
```rust
pub fn reject_milestone(
    env: Env,
    project_id: u64,
    milestone_index: u32,
    caller: Address,
)
```
- Authorization: caller must be `project.client`
- Transitions: UNDER_REVIEW → REJECTED
- Does NOT release funds — worker must resubmit

### `raise_dispute`
```rust
pub fn raise_dispute(
    env: Env,
    project_id: u64,
    milestone_index: u32,
    caller: Address,
)
```
- Authorization: caller must be client or worker
- Transitions: milestone → DISPUTED, project → DISPUTED
- Freezes affected milestone payment

### `resolve_dispute`
```rust
pub fn resolve_dispute(
    env: Env,
    project_id: u64,
    milestone_index: u32,
    release_to_worker: bool,
    caller: Address,
)
```
- Authorization: Designated arbitrator/admin address
- If release_to_worker: transfers funds to worker
- If not: refunds to client

### `cancel_project`
```rust
pub fn cancel_project(env: Env, project_id: u64, caller: Address)
```
- Authorization: caller must be `project.client`
- Only valid in DRAFT or FUNDED state
- If FUNDED: refunds all escrowed funds to client
- Transitions: DRAFT/FUNDED → CANCELLED

### Read functions
```rust
pub fn get_project(env: Env, project_id: u64) -> ProjectState
pub fn get_milestone(env: Env, project_id: u64, milestone_index: u32) -> MilestoneState
pub fn get_project_status(env: Env, project_id: u64) -> ProjectStatus
pub fn get_milestone_status(env: Env, project_id: u64, milestone_index: u32) -> MilestoneStatus
```

## Access Control Rules

| Function | Who can call |
|---|---|
| create_project | Anyone (becomes client) |
| fund_project | Client only |
| submit_proof_reference | Worker only |
| approve_milestone | Client only |
| reject_milestone | Client only |
| raise_dispute | Client or Worker |
| resolve_dispute | Arbitrator address only |
| cancel_project | Client only (DRAFT/FUNDED state) |

## Security Invariants

1. **Double payment prevention**: `release_payment` checks status == APPROVED before setting RELEASED
2. **No re-release**: Once status == RELEASED, no further payment transitions allowed
3. **No amount manipulation**: Amounts are set at project creation and cannot change after FUNDED
4. **Ownership immutability**: client and worker addresses cannot change after project creation
5. **State gate on all transitions**: Every function validates current state before transitioning
6. **Integer safety**: i128 type with explicit bounds checking; no unchecked arithmetic
7. **Authorization on every function**: require_auth() on every state-changing call

## Events

```rust
// Emitted on key state transitions for off-chain indexing
env.events().publish(
    (symbol_short!("project"), symbol_short!("created")),
    (project_id, client, worker),
);
env.events().publish(
    (symbol_short!("milestone"), symbol_short!("released")),
    (project_id, milestone_index, amount, worker),
);
```

## Escrow Flow

```
Client wallet
    │
    ▼ (fund_project)
Contract escrow account
    │
    ├── Milestone 1 amount (held)
    ├── Milestone 2 amount (held)
    └── Milestone N amount (held)
                │
                ▼ (approve_milestone → release_payment)
           Worker wallet
```

## Known Limitations (MVP)

- Dispute resolution requires a centralized arbitrator address (future: DAO governance)
- No partial refund on active milestones during cancellation
- Proof hash is SHA-256; future versions could use IPFS CID
- No time-locked auto-release mechanism (future feature)
