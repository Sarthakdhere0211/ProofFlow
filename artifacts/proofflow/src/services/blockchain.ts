import { makeId, type Milestone, type Project, type Transaction } from './store';

export interface BlockchainService {
  createProject(project: Project): Promise<void>;
  lockFunds(project: Project): Promise<void>;
  approveMilestone(projectId: string, milestoneId: string): Promise<void>;
  releasePayment(project: Project, milestone: Milestone): Promise<Transaction>;
}

/** Browser-only mock. Replace this adapter with a Stellar/Soroban service later. */
export class MockBlockchainService implements BlockchainService {
  async createProject(_project: Project): Promise<void> {}
  async lockFunds(_project: Project): Promise<void> {}
  async approveMilestone(_projectId: string, _milestoneId: string): Promise<void> {}
  async releasePayment(project: Project, milestone: Milestone): Promise<Transaction> {
    return {
      id: makeId('demo-tx'),
      projectId: project.id,
      milestoneId: milestone.id,
      amount: milestone.amount,
      status: 'released',
      type: 'release',
      createdAt: new Date().toISOString(),
    };
  }
}

export const blockchainService: BlockchainService = new MockBlockchainService();