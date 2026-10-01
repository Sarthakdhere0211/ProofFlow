import { useParams } from 'wouter';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { notify, useApp } from '../context/AppContext';
import { Badge, Button, PageHead, Timeline, dateLabel, displayStatus } from '../components/shared';
import { money, progressOf, type Milestone, type Project } from '../services/store';
import { Link } from 'wouter';

function MilestoneRow({ project, milestone, index }: { project: Project; milestone: Milestone; index: number }) {
  const { store } = useApp();
  const actionLabel = store.user.role === 'client' ? 'Review proof' : 'Submit proof';
  return <div className="milestone-card"><span className="milestone-index">{String(index + 1).padStart(2, '0')}</span>
    <div className="milestone-main"><Link href={`/projects/${project.id}/milestones/${milestone.id}`}><strong>{milestone.title}</strong></Link>
      <small>{milestone.description || 'Milestone deliverable'} · Due {dateLabel(milestone.dueDate)}</small>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}><Badge status={milestone.status}>{displayStatus(milestone.status)}</Badge><Badge status={milestone.proofStatus}>{milestone.proofStatus === 'not_submitted' ? 'proof pending' : displayStatus(milestone.proofStatus)}</Badge><Badge status={milestone.paymentStatus}>{displayStatus(milestone.paymentStatus)}</Badge></div>
    </div>
    <div className="milestone-right"><strong className="currency">{money(milestone.amount, project.currency)}</strong><Link className="btn btn-quiet" href={`/projects/${project.id}/proof/${milestone.id}`} data-testid={`link-milestone-action-${milestone.id}`}>{actionLabel}<ChevronRight size={14} /></Link></div>
  </div>;
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { store, update } = useApp();
  const project = store.projects.find(item => item.id === id);
  if (!project) return <NotFound />;
  const progress = progressOf(project);
  const editProject = () => {
    const title = window.prompt('Edit project name', project.title);
    if (title === null) return;
    const description = window.prompt('Edit project description', project.description);
    update(current => ({ ...current, projects: current.projects.map(item => item.id === project.id ? { ...item, title: title.trim() || item.title, description: description ?? item.description, budget: item.milestones.reduce((sum, milestone) => sum + milestone.amount, 0) } : item) }));
    notify('Project details updated.');
  };
  return <>
    <PageHead eyebrow={project.category} title={project.title} description={project.description}
      action={<div style={{ display: 'flex', gap: 8 }}><Button variant="secondary" testId="button-edit-project" onClick={editProject}>Edit project</Button><Link href="/projects" className="btn btn-secondary" data-testid="link-project-list"><ArrowLeft />Projects</Link></div>} />
    <div className="card project-hero"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}><div><Badge status={project.status}>{displayStatus(project.status)}</Badge><p className="section-sub" style={{ marginTop: 12 }}>Clear expectations. Work reviewed before payment is marked released.</p></div><div className="hero-stat"><label>Project progress</label><strong>{progress}%</strong></div></div>
      <div className="progress" style={{ height: 8, marginTop: 16 }}><span style={{ width: `${progress}%` }} /></div>
      <div className="hero-stats"><div className="hero-stat"><label>Milestone total</label><strong>{money(project.milestones.reduce((sum, item) => sum + item.amount, 0), project.currency)}</strong></div><div className="hero-stat"><label>Target completion</label><strong>{dateLabel(project.endDate)}</strong></div><div className="hero-stat"><label>Milestones</label><strong>{project.milestones.length}</strong></div></div>
    </div>
    <div className="detail-grid" style={{ marginTop: 18 }}><section className="card"><div className="panel-head"><div><h2 className="section-title">Milestone plan</h2><p className="section-sub">Each payment is reviewed against its own deliverable.</p></div></div>{project.milestones.map((milestone, index) => <MilestoneRow key={milestone.id} project={project} milestone={milestone} index={index} />)}</section>
      <aside className="card panel"><h2 className="section-title">Project agreement</h2><p className="section-sub">A shared record for client and worker.</p><div className="timeline"><Timeline text="Project created" detail={dateLabel(project.startDate)} /><Timeline text="Milestones agreed" detail={`${project.milestones.length} deliverables`} /><Timeline text="Proof review" detail="Client checks submitted work" /><Timeline text="Payment marked released" detail="Demo transaction only" /></div><div className="disclaimer">Funds are not escrowed in this demo. No real payment or blockchain transaction is performed.</div></aside>
    </div>
  </>;
}

export function MilestoneDetail() {
  const { id, milestoneId } = useParams<{ id: string; milestoneId: string }>();
  const { store } = useApp();
  const project = store.projects.find(item => item.id === id);
  const milestone = project?.milestones.find(item => item.id === milestoneId);
  if (!project || !milestone) return <NotFound />;
  return <>
    <PageHead eyebrow={`Milestone · ${project.title}`} title={milestone.title} description={milestone.description}
      action={<Link className="btn btn-secondary" href={`/projects/${project.id}`} data-testid="link-back-project"><ArrowLeft />Project</Link>} />
    <div className="detail-grid"><section className="card panel"><h2 className="section-title">Milestone definition</h2><p className="section-sub">Agreed deliverable and review details.</p>
      <div className="hero-stats"><div className="hero-stat"><label>Milestone amount</label><strong>{money(milestone.amount, project.currency)}</strong></div><div className="hero-stat"><label>Due date</label><strong>{dateLabel(milestone.dueDate)}</strong></div></div>
      <div className="link-row" style={{ marginTop: 18 }}><span>Work status</span><Badge status={milestone.status}>{displayStatus(milestone.status)}</Badge></div><div className="link-row"><span>Proof status</span><Badge status={milestone.proofStatus}>{displayStatus(milestone.proofStatus)}</Badge></div><div className="link-row"><span>Payment status</span><Badge status={milestone.paymentStatus}>{displayStatus(milestone.paymentStatus)}</Badge></div>
      <div style={{ marginTop: 18 }}><Link className="btn btn-primary" href={`/projects/${project.id}/proof/${milestone.id}`} data-testid="button-open-proof">{store.user.role === 'client' ? 'Review proof' : 'Submit proof'} <ArrowRight /></Link></div>
    </section><aside className="card panel"><h2 className="section-title">Proof & payment path</h2><div className="timeline"><Timeline text="Milestone defined" detail={dateLabel(project.startDate)} /><Timeline text={milestone.proof ? 'Proof submitted' : 'Proof submission'} detail={milestone.proof ? dateLabel(milestone.proof.submittedAt.slice(0, 10)) : 'Awaiting worker'} /><Timeline text="Client review" detail={milestone.status === 'under_review' ? 'Ready for review' : 'After submission'} /><Timeline text="Payment marked released" detail={milestone.paymentStatus === 'released' ? 'Demo transaction created' : 'Only after approval'} /></div></aside></div>
  </>;
}

function NotFound() {
  return <div className="card empty"><h3>We couldn’t find that project</h3><p>The route may have moved or the project may no longer exist in this browser.</p><Link href="/projects" className="btn btn-primary" data-testid="link-project-not-found">Back to projects</Link></div>;
}