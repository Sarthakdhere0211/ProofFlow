import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, Plus, Search, X } from 'lucide-react';
import { notify, useApp } from '../context/AppContext';
import { Button, EmptyState, Field, PageHead, ProjectCard } from '../components/shared';
import { blockchainService } from '../services/blockchain';
import { isSupportedCurrency, makeId, money, type Project, type SupportedCurrency } from '../services/store';

export function ProjectsPage() {
  const { store } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = store.projects.filter(project => (filter === 'all' || project.status === filter) && project.title.toLowerCase().includes(search.toLowerCase()));
  return <>
    <PageHead eyebrow="Workspace" title="Projects" description="Every brief, milestone and handoff in one considered place."
      action={<Link className="btn btn-primary" href="/projects/new" data-testid="button-create-project"><Plus />Create project</Link>} />
    <div className="toolbar"><div className="search-box"><Search /><input className="input" placeholder="Search projects" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-project-search" /></div>
      <select className="select" value={filter} onChange={e => setFilter(e.target.value)} data-testid="select-project-filter"><option value="all">All projects</option><option value="active">Active</option><option value="completed">Completed</option><option value="draft">Draft</option></select>
    </div>
    {filtered.length ? <div className="project-list">{filtered.map(project => <ProjectCard key={project.id} project={project} />)}</div>
      : <div className="card"><EmptyState title="No projects match" body="Try a different search or status filter."
        action={<Button variant="secondary" testId="button-clear-project-filters" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</Button>} /></div>}
  </>;
}

type MilestoneDraft = { title: string; description: string; amount: string; dueDate: string };
const blankMilestone = (): MilestoneDraft => ({ title: '', description: '', amount: '', dueDate: '' });
const currencies: SupportedCurrency[] = ['INR', 'USD', 'EUR', 'GBP'];

export function NewProject() {
  const { update, store } = useApp();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', worker: 'Alex Sharma', category: 'Web development', startDate: new Date().toISOString().slice(0, 10), endDate: '', currency: 'INR' });
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([blankMilestone()]);
  const total = milestones.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const setField = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: key === 'currency' && !isSupportedCurrency(value) ? 'INR' : value }));

  const createProject = async () => {
    if (!form.title.trim() || !form.endDate || milestones.some(item => !item.title.trim() || !Number(item.amount))) {
      setError('Add a project name, completion date and a title and amount for every milestone.');
      return;
    }
    const project: Project = {
      id: makeId('project'), title: form.title.trim(), description: form.description, clientId: 'demo-client',
      workerId: store.user.role === 'worker' ? 'alex' : 'demo-worker', category: form.category,
      budget: total, currency: isSupportedCurrency(form.currency) ? form.currency : 'INR',
      startDate: form.startDate, endDate: form.endDate, status: 'active',
      contractStatus: null,
      contractProjectId: null,
      milestones: milestones.map(item => ({
        id: makeId('milestone'), title: item.title.trim(), description: item.description,
        amount: Number(item.amount), dueDate: item.dueDate || form.endDate, status: 'pending' as const,
        proofStatus: 'not_submitted' as const, paymentStatus: 'pending' as const,
        contractStatus: null,
        contractMilestoneIndex: null,
      })),
    };
    await blockchainService.createProject({
      clientAddress: 'demo-client',
      workerAddress: store.user.id,
      totalAmount: String(total),
      tokenAddress: 'demo-xlm',
      milestoneAmounts: milestones.map(m => String(Number(m.amount))),
    });
    await blockchainService.fundProject('demo-contract-project', String(total));
    update(current => ({ ...current, projects: [project, ...current.projects] }));
    notify('Project created in this browser demo.');
    navigate(`/projects/${project.id}`);
  };

  return <>
    <PageHead eyebrow="New commitment" title="Create a project" description="Build a clear agreement, one milestone at a time."
      action={<Link className="btn btn-quiet" href="/projects" data-testid="link-cancel-project"><ArrowLeft />Back to projects</Link>} />
    <div className="wizard-steps">{['Project details', 'Budget & milestones', 'Review'].map((name, index) =>
      <div className={`wizard-step ${step === index ? 'active' : ''}`} key={name}>{String(index + 1).padStart(2, '0')}　{name}</div>)}</div>
    {error && <div className="alert" role="alert">{error}</div>}
    <section className="card panel">
      {step === 0 && <>
        <h2 className="section-title">Tell us what you’re making</h2><p className="section-sub" style={{ marginBottom: 18 }}>Set the context your worker needs to do their best work.</p>
        <div className="form-grid">
          <Field label="Project name" value={form.title} onChange={value => setField('title', value)} placeholder="e.g. Butter Brews website" testId="input-project-title" />
          <Field label="Category" value={form.category} onChange={value => setField('category', value)} placeholder="Web development" testId="input-project-category" />
          <div className="field full"><label htmlFor="p-desc">Project description</label><textarea id="p-desc" className="textarea" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="What outcome are you looking for?" data-testid="input-project-description" /></div>
          <Field label="Worker" value={form.worker} onChange={value => setField('worker', value)} placeholder="Worker name" testId="input-project-worker" />
          <Field label="Start date" value={form.startDate} onChange={value => setField('startDate', value)} type="date" testId="input-project-start" />
          <Field label="Expected completion" value={form.endDate} onChange={value => setField('endDate', value)} type="date" testId="input-project-end" />
        </div>
      </>}
      {step === 1 && <>
        <h2 className="section-title">Shape the payment plan</h2><p className="section-sub" style={{ marginBottom: 16 }}>A clear split helps both sides know what completion means.</p>
        <div className="field" style={{ maxWidth: 230 }}><label htmlFor="project-currency">Currency</label><select id="project-currency" className="select" style={{ width: '100%' }} value={form.currency} onChange={e => setField('currency', e.target.value)} data-testid="select-project-currency">{currencies.map(currency => <option key={currency} value={currency}>{currency}</option>)}</select></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 8px' }}><h3 className="section-title">Milestones</h3><Button variant="secondary" testId="button-add-milestone" onClick={() => setMilestones(items => [...items, blankMilestone()])}><Plus />Add milestone</Button></div>
        {milestones.map((milestone, index) => <div className="milestone-row" key={index}>
          <Field label={index === 0 ? 'Milestone name' : ''} value={milestone.title} onChange={value => setMilestones(items => items.map((item, i) => i === index ? { ...item, title: value } : item))} placeholder="Milestone name" testId={`input-milestone-title-${index}`} />
          <Field label={index === 0 ? 'Definition of done' : ''} value={milestone.description} onChange={value => setMilestones(items => items.map((item, i) => i === index ? { ...item, description: value } : item))} placeholder="What will be delivered?" testId={`input-milestone-description-${index}`} />
          <Field label={index === 0 ? 'Amount' : ''} value={milestone.amount} onChange={value => setMilestones(items => items.map((item, i) => i === index ? { ...item, amount: value } : item))} placeholder="Amount" type="number" testId={`input-milestone-amount-${index}`} />
          <Field label={index === 0 ? 'Due date' : ''} value={milestone.dueDate} onChange={value => setMilestones(items => items.map((item, i) => i === index ? { ...item, dueDate: value } : item))} type="date" testId={`input-milestone-date-${index}`} />
          <button className="btn btn-quiet" aria-label={`Remove milestone ${index + 1}`} onClick={() => setMilestones(items => items.length > 1 ? items.filter((_, i) => i !== index) : items)} data-testid={`button-remove-milestone-${index}`}><X /></button>
        </div>)}
        <div style={{ textAlign: 'right', paddingTop: 14 }}>Total project budget <strong style={{ marginLeft: 10 }}>{money(total, form.currency)}</strong></div>
      </>}
      {step === 2 && <>
        <h2 className="section-title">Review the commitment</h2><p className="section-sub" style={{ marginBottom: 17 }}>Make sure the scope and amounts look right before creating.</p>
        <div className="notice"><b>{form.title || 'Untitled project'}</b><br />{form.description || 'No description added.'}<br /><br />Worker: {form.worker} · {form.category}<br />Timeline: {form.startDate} — {form.endDate}</div>
        <div style={{ marginTop: 16 }}>{milestones.map((item, index) => <div className="link-row" key={index}><span>{index + 1}. {item.title || 'Untitled milestone'}</span><strong>{money(Number(item.amount) || 0, form.currency)}</strong></div>)}</div>
        <div style={{ textAlign: 'right', paddingTop: 15 }}>Milestone total <strong>{money(total, form.currency)}</strong></div>
      </>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        {step > 0 ? <Button variant="secondary" testId="button-wizard-back" onClick={() => { setStep(step - 1); setError(''); }}><ArrowLeft />Back</Button> : <span />}
        {step < 2 ? <Button testId="button-wizard-next" onClick={() => { setError(''); if (step === 0 && (!form.title || !form.endDate)) { setError('Add a project name and expected completion date to continue.'); return; } setStep(step + 1); }}>Continue <ArrowRight /></Button>
          : <Button testId="button-submit-project" onClick={createProject}><ArrowRight />Create project</Button>}
      </div>
    </section>
    <p className="section-sub" style={{ marginTop: 13 }}>This browser demo does not move or hold real funds. Payment records are simulated.</p>
  </>;
}