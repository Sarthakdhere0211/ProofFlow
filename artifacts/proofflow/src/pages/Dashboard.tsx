import { Link } from 'wouter';
import { BadgeCheck, Banknote, BriefcaseBusiness, CheckCircle2, ChevronRight, Plus, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, PageHead, ProjectCard, Stat, dateLabel } from '../components/shared';
import { money } from '../services/store';

function localizedGreeting(now = new Date()) {
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const date = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
  return { greeting, date };
}

export function Dashboard() {
  const { store } = useApp();
  const projects = store.projects;
  const active = projects.filter(project => project.status === 'active');
  const completed = projects.filter(project => project.status === 'completed');
  const verified = projects.reduce((sum, project) => sum + project.milestones.filter(milestone => milestone.status === 'verified').length, 0);
  const awaiting = projects.flatMap(project => project.milestones.filter(milestone => milestone.proofStatus === 'submitted').map(milestone => ({ project, milestone })));
  const total = projects.reduce((sum, project) => sum + project.budget, 0);
  const { greeting, date } = localizedGreeting();

  return <>
    <PageHead eyebrow={date} title={`${greeting}, ${store.user.name.split(' ')[0]}`} description="A clear view of what’s moving, what needs review, and what’s next."
      action={<Link className="btn btn-primary" href="/projects/new" data-testid="button-new-project"><Plus />New project</Link>} />
    <div className="notice"><b>Demo workspace.</b> Project and payment records are stored only in this browser. All generated payment records are clearly marked Demo Transaction.</div>
    <div className="stats-grid">
      <Stat label="Active projects" value={`${active.length}`} detail="In progress now" Icon={BriefcaseBusiness} />
      <Stat label="Completed projects" value={`${completed.length + 17}`} detail="Demo history included" Icon={CheckCircle2} />
      <Stat label="Project value" value={money(total)} detail="Across all visible projects" Icon={Banknote} />
      <Stat label="Verified milestones" value={`${verified + 63}`} detail="MVP demo reputation metric" Icon={BadgeCheck} />
    </div>
    <div className="dash-grid">
      <section className="card"><div className="panel-head"><div><h2 className="section-title">Your projects</h2><p className="section-sub">A quick pulse on active commitments.</p></div><Link className="btn btn-quiet" href="/projects" data-testid="link-all-projects">All projects <ArrowRight size={14} /></Link></div>
        <div className="project-list" style={{ padding: '0 15px 15px' }}>{active.slice(0, 3).map(project => <ProjectCard project={project} key={project.id} />)}</div>
      </section>
      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <section className="card score-card"><div className="eyebrow">Your ProofScore</div><div className="score-number">{store.user.proofScore}</div><div className="score-label">Excellent verification history</div>
          <div className="score-stats"><div><b>{verified + 63}</b>verified milestones</div><div><b>94%</b>on-time demo rate</div></div>
          <Link href="/reputation" className="btn btn-quiet" style={{ paddingLeft: 0, marginTop: 9 }} data-testid="link-score-details">View reputation <ArrowRight size={14} /></Link>
        </section>
        <section className="card panel"><h2 className="section-title">Needs your attention</h2><p className="section-sub">{awaiting.length ? `${awaiting.length} proof${awaiting.length === 1 ? '' : 's'} waiting for review.` : 'Nothing waiting for review.'}</p>
          {awaiting.length ? awaiting.slice(0, 2).map(({ project, milestone }) => <Link key={milestone.id} href={`/projects/${project.id}/proof/${milestone.id}`} className="activity-item" style={{ paddingTop: 15 }} data-testid={`link-review-${milestone.id}`}><span className="activity-dot" /><span><strong>{milestone.title}</strong><br /><span className="activity-time">{project.title} · {money(milestone.amount)}</span></span><ChevronRight size={14} /></Link>)
            : <div className="activity-item" style={{ paddingTop: 16 }}>All caught up. Your next milestone is on track.</div>}
        </section>
      </div>
    </div>
    <section style={{ marginTop: 24 }}><div className="panel-head" style={{ paddingLeft: 0 }}><div><h2 className="section-title">Recent activity</h2><p className="section-sub">The latest milestones across your workspace.</p></div></div>
      <div className="card panel"><div className="activity-list">{store.transactions.slice(-3).reverse().map(transaction => {
        const project = projects.find(item => item.id === transaction.projectId);
        const milestone = project?.milestones.find(item => item.id === transaction.milestoneId);
        return <div key={transaction.id} className="activity-item"><span className="activity-dot" /><span><strong>{milestone?.title ?? 'Milestone payment'} released</strong><br /><span className="activity-time">{project?.title} · {money(transaction.amount, project?.currency)} · Demo Transaction</span></span><span className="activity-time" style={{ marginLeft: 'auto' }}>{new Date(transaction.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>;
      })}</div></div>
    </section>
  </>;
}