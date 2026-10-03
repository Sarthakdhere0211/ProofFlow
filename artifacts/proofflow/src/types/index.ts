/**
 * ProofFlow — Core domain types
 *
 * These types mirror the smart contract state machine.
 * Blockchain is the source of truth for financial state.
 * The frontend derives display state from authoritative blockchain data.
 */

// ── Roles ────────────────────────────────────────────────────────────────────

export type Role = 'client' | 'worker';

// ── Blockchain / Transaction lifecycle ───────────────────────────────────────

/** The lifecycle of a transaction submitted to the blockchain. */
export type TxStatus =
  | 'IDLE'
  | 'PREPARING'
  | 'AWAITING_SIGNATURE'
  | 'SUBMITTED'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'USER_REJECTED'
  | 'FAILED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR';

export interface TxState {
  status: TxStatus;
  txHash: string | null;
  /** Human-readable message safe to display to the user */
  message: string;
  /** Timestamp when the transaction reached CONFIRMED */
  confirmedAt: string | null;
  /** True while any non-terminal, non-idle status is active */
  pending: boolean;
}

export function idleTxState(): TxState {
  return {
    status: 'IDLE',
    txHash: null,
    message: '',
    confirmedAt: null,
    pending: false,
  };
}

// ── Smart contract state machine ─────────────────────────────────────────────

/**
 * Project states on-chain.
 * Transitions: DRAFT → FUNDED → ACTIVE → COMPLETED | CANCELLED | DISPUTED
 */
export type ProjectContractStatus =
  | 'DRAFT'
  | 'FUNDED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

/**
 * Milestone states on-chain.
 * Transitions: PENDING → FUNDED → PROOF_SUBMITTED → UNDER_REVIEW
 *              → APPROVED → RELEASED | REJECTED | DISPUTED
 */
export type MilestoneContractStatus =
  | 'PENDING'
  | 'FUNDED'
  | 'PROOF_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'RELEASED'
  | 'REJECTED'
  | 'DISPUTED';

// ── Application-layer statuses (UI display) ───────────────────────────────────

export type ProofStatus = 'not_submitted' | 'submitted' | 'changes_requested' | 'approved';
export type PaymentStatus = 'pending' | 'released' | 'failed';
export type MilestoneStatus = 'pending' | 'in_progress' | 'under_review' | 'verified';
export type ProjectStatus = 'draft' | 'active' | 'completed';

// ── Currencies ───────────────────────────────────────────────────────────────

const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'XLM', 'USDC'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.some(c => c === value);
}

// ── Proof ────────────────────────────────────────────────────────────────────

export interface Proof {
  id: string;
  title: string;
  description: string;
  githubUrl: string;
  liveUrl: string;
  additionalUrl: string;
  /** Filename of attached file (upload feature in later phase) */
  fileName: string;
  /** SHA-256 hash of proof content for on-chain verification */
  contentHash: string | null;
  notes: string;
  submittedAt: string;
  status: ProofStatus;
}

// ── Milestone ────────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  // UI-layer status (derived from contract status when integrated)
  status: MilestoneStatus;
  proofStatus: ProofStatus;
  paymentStatus: PaymentStatus;
  proof?: Proof;
  // On-chain references (populated after blockchain integration)
  contractStatus: MilestoneContractStatus | null;
  contractMilestoneIndex: number | null;
}

// ── Project ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
  workerId: string;
  category: string;
  budget: number;
  currency: SupportedCurrency;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  milestones: Milestone[];
  // On-chain references (populated after blockchain integration)
  contractStatus: ProjectContractStatus | null;
  contractProjectId: string | null;
}

// ── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  proofScore: number;
  /** Connected Stellar wallet address */
  walletAddress: string | null;
}

// ── Transaction (payment record) ─────────────────────────────────────────────

export interface Transaction {
  id: string;
  projectId: string;
  milestoneId: string;
  amount: number;
  status: PaymentStatus;
  type: 'release' | 'lock' | 'refund';
  createdAt: string;
  /** Real blockchain transaction hash — null until confirmed on-chain */
  txHash: string | null;
  /** True if this record is demo/seed data — must never be true in production */
  isDemo: boolean;
}

// ── Wallet ───────────────────────────────────────────────────────────────────

export type WalletConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'wrong_network'
  | 'locked'
  | 'not_installed'
  | 'rejected';

export interface WalletState {
  status: WalletConnectionStatus;
  address: string | null;
  networkPassphrase: string | null;
  balance: string | null;
}

// ── Store ────────────────────────────────────────────────────────────────────

export interface AppSettings {
  emailUpdates: boolean;
  compactMode: boolean;
}

export interface Store {
  user: User;
  projects: Project[];
  transactions: Transaction[];
  settings: AppSettings;
  wallet: WalletState;
}
