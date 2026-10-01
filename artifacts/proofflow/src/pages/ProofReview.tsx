import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Check, CheckCircle2, Clock3, CircleHelp, FileCheck2, Sparkles, X } from 'lucide-react';
import { notify, useApp } from '../context/AppContext';
import { Badge, Button, EmptyState, Field, PageHead, Timeline, dateLabel, displayStatus } from '../components/shared';
import { blockchainService } from '../services/blockchain';
import { makeId, money, type Milestone, type Proof, type Project } from '../services/store';

const blankProof = (): Proof => ({ id: '', title: '', description: '', githubUrl: '', liveUrl: '', additionalUrl: '', fileName: '', notes: '', submittedAt: '', status: 'submitted' });

export function ProofReview() {
  const { id, milestoneId } = useParams<{ id: string; milestoneId: string }>();
  const { store, update } = useApp();
  const project = store.projects.find(item => item.id === id);
  const milestone = project?.milestones.find(item => item.id === milestoneId);
  const [confirmation, setConfirmation] = useState<'approve' | 'changes' | null>(null);
  const [error, setError] = useState('');
  const isClient = store.user.role === 'client';
  if (!project || !milestone) return <MissingMilestone />;
  return <ProofReviewView
    project={project}
    milestone={milestone}
    isClient={isClient}
    confirmation={confirmation}
    setConfirmation={setConfirmation}
    error={error}
    setError={setError}
  />;
}

function ProofReviewView({ project, milestone, isClient, confirmation, setConfirmation, error, setError }: {
  project: Project;
  milestone: Milestone;
  isClient: boolean;
  confirmation: 'approve' | 'changes' | null;
  setConfirmation: (value: 'approve' | 'changes' | null) => void;
  error: string;
  setError: (value: string) => void;
}) {
  const { update } = useApp();
  const [form, setForm] = useState<Proof>(() => milestone.proof ?? blankProof());
  const edit = (key: keyof Proof, value: string) => setForm(current => ({ ...current, [key]: value }));

  const submitProof = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Add a proof title and a short description before submitting.');
      return;
    }
    const proof: Proof = { ...form, id: form.id || makeId('proof'), submittedAt: new Date().toISOString(), status: 'submitted' };
    update(current => ({ ...current, projects: current.projects.map(item => item.id === project.id ? {
      ...item, milestones: item.milestones.map(m => m.id === milestone.id ? { ...m, proof, status: 'under_review', proofStatus: 'submitted' } : m),
    } : item) }));
    setForm(proof);
    setError('');
    notify('Proof submitted for client review.');
  };
  const requestChanges = () => {
    update(current => ({ ...current, projects: current.projects.map(item => item.id === project.id ? {
      ...item, milestones: item.milestones.map(m => m.id === milestone.id ? {
        ...m, status: 'in_progress', proofStatus: 'changes_requested',
        proof: m.proof ? { ...m.proof, status: 'changes_requested' } : undefined,
      } : m),
    } : item) }));
    setConfirmation(null);
    notify('Changes requested. Worker can revise and resubmit.');
  };
  const approve = async () => {
    await blockchainService.approveMilestone(project.id, milestone.id);
    const transaction = await blockchainService.releasePayment(project, milestone);
    update(current => ({
      ...current,
      projects: current.projects.map(item => item.id === project.id ? {
        ...item, milestones: item.milestones.map(m => m.id === milestone.id ? {
          ...m, status: 'verified', proofStatus: 'approved', paymentStatus: 'released',
          proof: m.proof ? { ...m.proof, status: 'approved' } : undefined,
        } : m),
      } : item),
      transactions: [...current.transactions, transaction],
    }));
    setConfirmation(null);
    notify('Milestone approved. Demo Transaction recorded.');
  };

  return <>
    <PageHead eyebrow={`${project.title} · ${milestone.title}`} title={isClient ? 'Review submitted proof' : 'Submit milestone proof'}
      description={isClient ? 'Review the submitted work against the agreed milestone.' : 'Share clear, verifiable evidence of your completed work.'}
      action={<Link href={`/projects/${project.id}`} className="btn btn-secondary" data-testid="link-proof-back"><ArrowLeft />Project milestones</Link>} />
    <div className="notice" style={{ marginBottom: 18 }}>ProofFlow is a browser-local demo. No real funds move. All generated payment records are labeled <b>Demo Transaction</b>.</div>
    <div className="proof-layout">
      <section className="card panel">{isClient
        ? <ReviewEvidence project={project} milestone={milestone} />
        : <form onSubmit={submitProof}><h2 className="section-title">Proof details</h2><p className="section-sub" style={{ marginBottom: 18 }}>Make it easy for your client to see what is complete.</p>
          {error && <div className="alert" role="alert">{error}</div>}
          <div className="form-grid"><Field label="Proof title" value={form.title} onChange={value => edit('title', value)} placeholder="e.g. Frontend build handoff" testId="input-proof-title" />
            <Field label="GitHub repository URL" value={form.githubUrl} onChange={value => edit('githubUrl', value)} placeholder="https://github.com/..." testId="input-proof-github" />
            <div className="field full"><label>Description</label><textarea className="textarea" value={form.description} onChange={event => edit('description', event.target.value)} placeholder="What did you complete? Mention specific deliverables." data-testid="input-proof-description" /></div>
            <Field label="Live deployment URL" value={form.liveUrl} onChange={value => edit('liveUrl', value)} placeholder="https://" testId="input-proof-live" />
            <Field label="Additional proof URL" value={form.additionalUrl} onChange={value => edit('additionalUrl', value)} placeholder="Design file, documentation, etc." testId="input-proof-additional" />
            <div className="field full"><label>Attach a file (demo preview only)</label><input className="input" type="file" onChange={event => edit('fileName', event.target.files?.[0]?.name ?? '')} data-testid="input-proof-file" /></div>
            <div className="field full"><label>Notes for the client</label><textarea className="textarea" value={form.notes} onChange={event => edit('notes', event.target.value)} placeholder="Anything else they should know?" data-testid="input-proof-notes" /></div>
          </div>
          <div className="preview-box" style={{ marginTop: 16 }}><h3>Submission preview</h3><div className="link-row"><span>{form.title || 'Proof title'}</span><span>{form.fileName || 'No file attached'}</span></div><p className="section-sub">{form.description || 'Your completion notes will appear here.'}</p></div>
          <div style={{ marginTop: 16 }}><Button type="submit" testId="button-submit-proof"><FileCheck2 />Submit for review</Button></div>
        </form>}
      </section>
      <aside style={{ display: 'grid', gap: 15, alignContent: 'start' }}>
        <section className="card panel"><div className="eyebrow"><Sparkles size={13} style={{ verticalAlign: 'middle' }} /> AI Verification Preview</div><h2 className="section-title">A review checklist</h2><p className="section-sub">A demo-only illustration of how review signals could be organized.</p>
          {['Scope matches milestone', 'Evidence links are present', 'Delivery notes are clear', 'Client review is still required'].map((item, index) => <div className="review-check" key={item}><span>{item}</span>{index < 3 ? <Check size={15} color="#438b76" /> : <Clock3 size={15} color="#b3863d" />}</div>)}
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 13 }}>Preview only · no model analyzed this proof</div>
        </section>
        <div className="disclaimer"><b>Demo disclaimer:</b> Real AI verification is not connected. This preview is illustrative only and is not a quality verdict.</div>
        <section className="card panel"><h2 className="section-title">Payment follows review</h2><p className="section-sub">The client checks the proof. Approval then records a simulated payment status.</p><Timeline text="Worker submits proof" detail="Evidence is attached to milestone" /><Timeline text="Client reviews work" detail="Approve or request changes" /><Timeline text="Payment status updates" detail="Demo Transaction only" /></section>
      </aside>
    </div>
    {isClient && milestone.proof && milestone.paymentStatus !== 'released' && <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', marginTop: 16 }}><Button variant="secondary" testId="button-request-changes" onClick={() => setConfirmation('changes')}>Request changes</Button><Button testId="button-approve-milestone" onClick={() => setConfirmation('approve')}><CheckCircle2 />Approve milestone</Button></div>}
    {milestone.paymentStatus === 'released' && <div className="notice" style={{ marginTop: 16 }}><b>Payment released — Demo Transaction</b><br />{money(milestone.amount, project.currency)} · No real funds moved.</div>}
    {confirmation && <ReviewConfirmation mode={confirmation} milestone={milestone} project={project} onClose={() => setConfirmation(null)} onConfirm={() => confirmation === 'approve' ? void approve() : requestChanges()} />}
  </>;
}

function ReviewEvidence({ project, milestone }: { project: Project; milestone: Milestone }) {
  return <><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><h2 className="section-title">{milestone.proof?.title ?? 'No proof submitted yet'}</h2><p className="section-sub">Submitted by Alex Sharma · {milestone.proof ? dateLabel(milestone.proof.submittedAt.slice(0, 10)) : 'Waiting on worker'}</p></div><Badge status={milestone.proofStatus}>{displayStatus(milestone.proofStatus)}</Badge></div>
    {milestone.proof ? <><p style={{ fontSize: 12, lineHeight: 1.7, marginTop: 18 }}>{milestone.proof.description}</p>{milestone.proof.notes && <div className="notice" style={{ marginTop: 15 }}><b>Worker notes</b><br />{milestone.proof.notes}</div>}<ProofLinks proof={milestone.proof} /></>
      : <EmptyState title="Proof has not arrived" body="Switch to the worker role to submit a proof for this milestone." />}
    <div className="link-row"><span>Milestone amount</span><b>{money(milestone.amount, project.currency)}</b></div>
  </>;
}
function ProofLinks({ proof }: { proof: Proof }) {
  const entries = [['GitHub', proof.githubUrl], ['Live demo', proof.liveUrl], ['Additional proof', proof.additionalUrl], ['Attached file', proof.fileName]].filter(([, value]) => value);
  return <div className="preview-box" style={{ marginTop: 17 }}><h3>Submitted evidence</h3>{entries.map(([label, value]) => <div key={label} className="link-row"><span>{label}</span><span style={{ color: 'var(--teal)', overflowWrap: 'anywhere' }}>{value}</span></div>)}</div>;
}
function ReviewConfirmation({ mode, milestone, project, onClose, onConfirm }: { mode: 'approve' | 'changes'; milestone: Milestone; project: Project; onClose: () => void; onConfirm: () => void }) {
  const approving = mode === 'approve';
  return <div role="dialog" aria-modal="true" className="modal-backdrop"><div className="card modal">
    <button className="btn btn-quiet close-modal" aria-label="Close dialog" onClick={onClose} data-testid="button-close-confirm"><X /></button><div className="empty-icon"><CircleHelp /></div>
    <h2 className="section-title" style={{ textAlign: 'center' }}>{approving ? `Approve ${milestone.title}?` : 'Request changes?'}</h2>
    <p className="section-sub" style={{ textAlign: 'center', margin: '9px auto 20px' }}>{approving ? `${money(milestone.amount, project.currency)} will be marked released as a Demo Transaction. No funds move.` : 'The worker will be able to update and resubmit their proof.'}</p>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 9 }}><Button variant="secondary" testId="button-cancel-review" onClick={onClose}>Cancel</Button><Button testId="button-confirm-review" onClick={onConfirm}>{approving ? 'Approve & mark released' : 'Request changes'}</Button></div>
  </div></div>;
}
function MissingMilestone() {
  return <div className="card empty"><div className="empty-icon"><CircleHelp /></div><h3>Milestone not found</h3><p>It may have been removed from this browser’s demo data.</p><Link href="/projects" className="btn btn-primary" data-testid="link-proof-not-found">Back to projects</Link></div>;
}