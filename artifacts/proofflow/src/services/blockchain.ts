/**
 * ProofFlow - Blockchain service layer
 */
import type { Project, Milestone, Transaction, TxState, TxStatus } from '../types';
import { makeId } from './store';

export function buildTxState(
  status: TxStatus,
  txHash: string | null = null,
  message = '',
): TxState {
  const terminal: TxStatus[] = ['CONFIRMED', 'USER_REJECTED', 'FAILED', 'TIMEOUT', 'NETWORK_ERROR'];
  return {
    status,
    txHash,
    message,
    confirmedAt: status === 'CONFIRMED' ? new Date().toISOString() : null,
    pending: !terminal.includes(status) && status !== 'IDLE',
  };
}

export const TX_MESSAGES: Record<TxStatus, string> = {
  IDLE: '',
  PREPARING: 'Preparing transaction...',
  AWAITING_SIGNATURE: 'Waiting for wallet signature...',
  SUBMITTED: 'Transaction submitted to the network...',
  CONFIRMING: 'Waiting for confirmation...',
  CONFIRMED: 'Transaction confirmed.',
  USER_REJECTED: 'Transaction rejected by wallet.',
  FAILED: 'Transaction failed. Please try again.',
  TIMEOUT: 'Transaction timed out. Check your wallet for the current status.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
};

export interface CreateProjectParams {
  clientAddress: string;
  workerAddress: string;
  totalAmount: string;
  tokenAddress: string;
  milestoneAmounts: string[];
}

export interface SubmitProofParams {
  projectContractId: string;
  milestoneIndex: number;
  proofHash: string;
}

export interface ApproveParams {
  projectContractId: string;
  milestoneIndex: number;
}

export interface DisputeParams {
  projectContractId: string;
  milestoneIndex: number;
  reason: string;
}

export interface BlockchainService {
  isLive(): boolean;
  createProject(params: CreateProjectParams): Promise<string>;
  fundProject(contractProjectId: string, amount: string): Promise<TxState>;
  submitProof(params: SubmitProofParams): Promise<TxState>;
  approveMilestone(params: ApproveParams): Promise<TxState>;
  rejectMilestone(params: ApproveParams): Promise<TxState>;
  raiseDispute(params: DisputeParams): Promise<TxState>;
  cancelProject(contractProjectId: string): Promise<TxState>;
  releasePayment(project: Project, milestone: Milestone): Promise<Transaction>;
  getProjectState(contractProjectId: string): Promise<string | null>;
  getMilestoneState(contractProjectId: string, milestoneIndex: number): Promise<string | null>;
}

export class DemoBlockchainService implements BlockchainService {
  private delay(ms = 900): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isLive(): boolean { return false; }

  async createProject(_params: CreateProjectParams): Promise<string> {
    await this.delay();
    return makeId('demo-contract-project');
  }

  async fundProject(_id: string, _amount: string): Promise<TxState> {
    await this.delay(1200);
    return buildTxState('CONFIRMED', makeId('demo-tx'), 'Demo project funded.');
  }

  async submitProof(_params: SubmitProofParams): Promise<TxState> {
    await this.delay();
    return buildTxState('CONFIRMED', makeId('demo-tx'), 'Demo proof submitted.');
  }

  async approveMilestone(_params: ApproveParams): Promise<TxState> {
    await this.delay(1400);
    return buildTxState('CONFIRMED', makeId('demo-tx'), 'Demo milestone approved.');
  }

  async rejectMilestone(_params: ApproveParams): Promise<TxState> {
    await this.delay();
    return buildTxState('CONFIRMED', makeId('demo-tx'), 'Demo milestone rejected.');
  }

  async raiseDispute(_params: DisputeParams): Promise<TxState> {
    await this.delay();
    return buildTxState('CONFIRMED', makeId('demo-tx'), 'Demo dispute raised.');
  }

  async cancelProject(_id: string): Promise<TxState> {
    await this.delay();
    return buildTxState('CONFIRMED', makeId('demo-tx'), 'Demo project cancelled.');
  }

  async releasePayment(project: Project, milestone: Milestone): Promise<Transaction> {
    await this.delay();
    return {
      id: makeId('demo-tx'),
      projectId: project.id,
      milestoneId: milestone.id,
      amount: milestone.amount,
      status: 'released',
      type: 'release',
      createdAt: new Date().toISOString(),
      txHash: null,
      isDemo: true,
    };
  }

  async getProjectState(_id: string): Promise<string | null> { return null; }

  async getMilestoneState(_id: string, _index: number): Promise<string | null> { return null; }
}

export const blockchainService: BlockchainService = new DemoBlockchainService();