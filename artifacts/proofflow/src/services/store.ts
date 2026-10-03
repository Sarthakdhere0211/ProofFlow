/**
 * ProofFlow store — demo persistence layer (localStorage)
 *
 * This module provides:
 *   - Seed data for the browser demo
 *   - Read/write helpers for localStorage persistence
 *   - Display utilities (money formatting, progress calculation)
 *
 * IMPORTANT: This is the demo persistence layer only.
 * In production, authoritative state comes from the blockchain (financial)
 * and the API server + database (metadata). This store is replaced by
 * real API calls + TanStack Query caching in the production integration phase.
 */

import type {
  Store,
  Project,
  Milestone,
  Transaction,
  Proof,
  ProofStatus,
  PaymentStatus,
  SupportedCurrency,
} from '../types';

export type {
  Store,
  Project,
  Milestone,
  Transaction,
  Proof,
  ProofStatus,
  PaymentStatus,
  SupportedCurrency,
  Role,
  User,
  WalletState,
  TxState,
  TxStatus,
} from '../types';

export { isSupportedCurrency, idleTxState } from '../types';

// ── Seed helpers ──────────────────────────────────────────────────────────────

const ms = (
  id: string,
  title: string,
  description: string,
  amount: number,
  daysFromNow: number,
  status: Milestone['status'],
  proofStatus: ProofStatus,
  paymentStatus: PaymentStatus,
  proof?: Proof,
): Milestone => ({
  id,
  title,
  description,
  amount,
  dueDate: new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10),
  status,
  proofStatus,
  paymentStatus,
  proof,
  contractStatus: null,
  contractMilestoneIndex: null,
});

// ── Seed data ─────────────────────────────────────────────────────────────────

const seed: Store = {
  user: {
    id: 'alex',
    name: 'Alex Sharma',
    email: 'worker@proofflow.demo',
    role: 'worker',
    proofScore: 94,
    walletAddress: null,
  },
  settings: { emailUpdates: true, compactMode: false },
  wallet: {
    status: 'disconnected',
    address: null,
    networkPassphrase: null,
    balance: null,
  },
  transactions: [
    {
      id: 'demo-tx-104',
      projectId: 'butter',
      milestoneId: 'butter-ui',
      amount: 5000,
      status: 'released',
      type: 'release',
      createdAt: '2025-10-01T10:00:00.000Z',
      txHash: null,
      isDemo: true,
    },
    {
      id: 'demo-tx-105',
      projectId: 'butter',
      milestoneId: 'butter-front',
      amount: 10000,
      status: 'released',
      type: 'release',
      createdAt: '2025-10-05T10:00:00.000Z',
      txHash: null,
      isDemo: true,
    },
  ],
  projects: [
    {
      id: 'butter',
      title: 'Butter Brews Bistro Website',
      description:
        'A warm, quick-to-use digital home for a neighbourhood coffee and bakehouse in Pune. Includes menu, online ordering and a story-led brand page.',
      clientId: 'client-1',
      workerId: 'alex',
      category: 'Web development',
      budget: 30000,
      currency: 'INR',
      startDate: '2025-09-18',
      endDate: '2025-11-24',
      status: 'active',
      contractStatus: null,
      contractProjectId: null,
      milestones: [
        ms('butter-ui', 'UI Design', 'Visual system, responsive page layouts and approved design handoff.', 5000, -14, 'verified', 'approved', 'released'),
        ms(
          'butter-front',
          'Frontend Development',
          'Responsive frontend implementation completed.',
          10000,
          -5,
          'verified',
          'approved',
          'released',
          {
            id: 'p-front',
            title: 'Frontend build handoff',
            description: 'Responsive frontend implementation completed, with accessible navigation and menu states.',
            githubUrl: 'https://github.com/demo/butter-brews',
            liveUrl: 'https://butter-brews.demo',
            additionalUrl: '',
            fileName: '',
            contentHash: null,
            notes: 'Ready for client review.',
            submittedAt: '2025-10-05T10:00:00.000Z',
            status: 'approved',
          },
        ),
        ms(
          'butter-back',
          'Backend Development',
          'Ordering flow, menu data and contact form integration.',
          7000,
          6,
          'under_review',
          'submitted',
          'pending',
          {
            id: 'p-back',
            title: 'Ordering flow and menu integration',
            description: 'Menu and ordering flow connected with working form validation and responsive states.',
            githubUrl: 'https://github.com/demo/butter-brews-backend',
            liveUrl: 'https://butter-brews.demo',
            additionalUrl: 'https://docs.example.test/hand-off',
            fileName: 'handoff-notes.pdf',
            contentHash: null,
            notes: 'Please review the order confirmation state.',
            submittedAt: '2025-10-12T09:25:00.000Z',
            status: 'submitted',
          },
        ),
        ms('butter-deploy', 'Deployment', 'Production deployment, smoke test and final handover.', 8000, 19, 'pending', 'not_submitted', 'pending'),
      ],
    },
    {
      id: 'northstar',
      title: 'Northstar Learning Portal',
      description: 'A small learning platform for an independent design school, with course pages and a student resource library.',
      clientId: 'north-client',
      workerId: 'alex',
      category: 'Product design',
      budget: 46000,
      currency: 'INR',
      startDate: '2025-10-01',
      endDate: '2025-12-12',
      status: 'active',
      contractStatus: null,
      contractProjectId: null,
      milestones: [
        ms('north-research', 'Research & structure', 'Discovery and information architecture.', 9000, 2, 'verified', 'approved', 'released'),
        ms('north-design', 'Course experience', 'Responsive course and resource library.', 17000, 12, 'in_progress', 'not_submitted', 'pending'),
        ms('north-build', 'Build & handoff', 'Front-end build and documentation.', 20000, 34, 'pending', 'not_submitted', 'pending'),
      ],
    },
    {
      id: 'mango',
      title: 'Mango House Brand Refresh',
      description: 'A fresh identity and digital storefront for a family-run home goods studio.',
      clientId: 'mango-client',
      workerId: 'alex',
      category: 'Brand & web',
      budget: 22500,
      currency: 'INR',
      startDate: '2025-08-12',
      endDate: '2025-10-20',
      status: 'completed',
      contractStatus: null,
      contractProjectId: null,
      milestones: [
        ms('mango-brand', 'Identity system', 'Brand direction, type and color system.', 7500, -40, 'verified', 'approved', 'released'),
        ms('mango-shop', 'Storefront', 'Shop pages and launch assets.', 15000, -18, 'verified', 'approved', 'released'),
      ],
    },
    {
      id: 'fieldnotes',
      title: 'Fieldnotes Studio Portfolio',
      description: 'Portfolio and case study archive for a small landscape architecture studio.',
      clientId: 'field-client',
      workerId: 'alex',
      category: 'Web development',
      budget: 18000,
      currency: 'INR',
      startDate: '2025-10-06',
      endDate: '2025-11-28',
      status: 'active',
      contractStatus: null,
      contractProjectId: null,
      milestones: [
        ms('field-map', 'Content map', 'Case study structure and page map.', 6000, 8, 'in_progress', 'not_submitted', 'pending'),
        ms('field-build', 'Portfolio build', 'Responsive page implementation.', 12000, 31, 'pending', 'not_submitted', 'pending'),
      ],
    },
  ],
};

// ── Persistence ───────────────────────────────────────────────────────────────

const KEY = 'proofflow.demo.v2';

export type StoreLoadResult = { store: Store; warning: string | null };

export function readStore(): StoreLoadResult {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { store: structuredClone(seed), warning: null };
    const parsed = JSON.parse(raw) as Partial<Store>;
    if (!parsed.user || !Array.isArray(parsed.projects) || !Array.isArray(parsed.transactions)) {
      return {
        store: structuredClone(seed),
        warning: 'Saved demo data could not be read. Sample data has been restored.',
      };
    }
    // Merge so new fields from seed are always present
    return {
      store: {
        ...seed,
        ...parsed,
        settings: { ...seed.settings, ...parsed.settings },
        wallet: { ...seed.wallet, ...parsed.wallet },
      },
      warning: null,
    };
  } catch {
    return {
      store: structuredClone(seed),
      warning: 'Browser storage is unavailable. The demo is usable in memory but changes will not persist.',
    };
  }
}

export function writeStore(store: Store): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export const seedStore = (): Store => structuredClone(seed);

// ── ID generation ─────────────────────────────────────────────────────────────

export const makeId = (prefix = 'id'): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

// ── Display utilities ─────────────────────────────────────────────────────────

export const money = (amount: number, currency: string = 'INR'): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: ['INR', 'USD', 'EUR', 'GBP', 'XLM', 'USDC'].includes(currency) ? currency : 'INR',
    maximumFractionDigits: currency === 'XLM' || currency === 'USDC' ? 2 : 0,
  }).format(amount);

export const progressOf = (project: Project): number =>
  project.milestones.length
    ? Math.round(
        (project.milestones.filter(m => m.status === 'verified').length /
          project.milestones.length) *
          100,
      )
    : 0;

/** Real verified milestone count — no fake inflation */
export const verifiedMilestoneCount = (projects: Project[]): number =>
  projects.reduce(
    (sum, project) => sum + project.milestones.filter(m => m.status === 'verified').length,
    0,
  );

/** Real completed project count — no fake inflation */
export const completedProjectCount = (projects: Project[]): number =>
  projects.filter(p => p.status === 'completed').length;
