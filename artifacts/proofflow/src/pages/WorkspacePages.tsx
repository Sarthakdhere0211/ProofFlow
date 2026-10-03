import { useState } from 'react';
import { Link } from 'wouter';
import { BadgeCheck, CircleHelp, Search, Settings as SettingsIcon } from 'lucide-react';
import { notify, useApp } from '../context/AppContext';
import { Badge, Button, EmptyState, Field, PageHead, dateLabel, displayStatus } from '../components/shared';
import { money, seedStore, verifiedMilestoneCount, completedProjectCount } from '../services/store';

export function Transactions() {
  const { store } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const rows = store.transactions.filter(item => filter === 'all' || item.status === filter).filter(item => {
    const project = store.projects.find(projectItem => projectItem.id === item.projectId);
    return `${project?.title ?? ''}${item.id}`.toLowerCase().includes(search.toLowerCase());
  });
  return <>
    <PageHead eyebrow="Payment record" title="Transactions" description="A transparent history of simulated milestone payment updates." />
    <div className="notice" style={{ marginBottom: 16 }}>Every record here is a <b>Demo Transaction</b>. There are no real transactions, hashes, wallets or explorer links.</div>
    <div className="toolbar"><div className="search-box"><Search /><input className="input" placeholder="Search project or record" value={search} onChange={event => setSearch(event.target.value)} data-testid="input-transaction-search" /></div>
      <select className="select" value={filter} onChange={event => setFilter(event.target.value)} data-testid="select-transaction-filter"><option value="all">All statuses</option><option value="pending">Pending</option><option value="released">Released</option><option value="failed">Failed</option></select>
    </div>
    <div className="card panel" style={{ padding: 0 }}>{rows.length ? <table className="table"><thead><tr><th>Date</th><th>Project / milestone</th><th>Amount</th><th>Status</th><th>Record type</th></tr></thead><tbody>{rows.map(transaction => {
      const project = store.projects.find(item => item.id === transaction.projectId);
      const milestone = project?.milestones.find(item => item.id === transaction.milestoneId);
      return <tr key={transaction.id}><td data-label="Date">{dateLabel(transaction.createdAt.slice(0, 10))}</td><td data-label="Project / milestone"><b>{project?.title ?? 'Project'}</b><br /><span className="activity-time">{milestone?.title}</span></td><td data-label="Amount"><b>{money(transaction.amount, project?.currency)}</b></td><td data-label="Status"><Badge status={transaction.status}>{displayStatus(transaction.status)}</Badge></td><td data-label="Record type"><Badge status="review">Demo Transaction</Badge></td></tr>;
    })}</tbody></table> : <EmptyState title="No matching transactions" body="Approved milestones create a Demo Transaction entry here." />}</div>
  </>;
}

export function Profile() {
  const { store, update } = useApp();
  return <>
    <PageHead eyebrow="Your identity" title="Profile" description="The person behind the proof." />
    <div className="detail-grid"><section className="card panel"><div style={{ display: 'flex', alignItems: 'center', gap: 15 }}><div className="avatar" style={{ width: 54, height: 54, fontSize: 17 }}>{store.user.name.split(' ').map(part => part[0]).join('').slice(0, 2)}</div><div><h2 className="section-title">{store.user.name}</h2><p className="section-sub">{store.user.email}</p></div></div>
      <div className="form-grid" style={{ marginTop: 24 }}><Field label="Display name" value={store.user.name} onChange={name => update(current => ({ ...current, user: { ...current.user, name } }))} testId="input-profile-name" /><Field label="Email address (demo)" value={store.user.email} onChange={email => update(current => ({ ...current, user: { ...current.user, email } }))} testId="input-profile-email" /></div>
      <div className="notice" style={{ marginTop: 18 }}>Profile details are stored in this browser only. This is not a production identity or authentication system.</div>
    </section><section className="card score-card"><div className="eyebrow">Current demo role</div><div style={{ font: '700 23px Manrope', margin: '12px 0' }}>{store.user.role === 'worker' ? 'Independent worker' : 'Project client'}</div><p className="score-label">Switch role any time from the top navigation to explore both sides of a project.</p><div style={{ marginTop: 18 }}><Link href="/settings" className="btn btn-secondary" data-testid="link-profile-settings"><SettingsIcon />Preferences</Link></div></section></div>
  </>;
}

export function Reputation() {
  const { store } = useApp();
  const verified = verifiedMilestoneCount(store.projects);
  const completed = completedProjectCount(store.projects);
  const work = store.projects.filter(project => project.status === 'completed' || project.milestones.some(milestone => milestone.status === 'verified'));
  return <>
    <PageHead eyebrow="Work you can stand behind" title="ProofScore" description="A readable summary of your verified work history." />
    <div className="detail-grid"><section className="card score-card"><div className="eyebrow">Reputation metric</div><div className="score-number">{store.user.proofScore}</div><div className="score-label">Based on verified milestones in this workspace</div><div className="score-stats"><div><b>{completed}</b>projects completed</div><div><b>{verified}</b>verified milestones</div></div></section>
      <section className="card panel"><div className="eyebrow">Recognition</div><h2 className="section-title">Built on clear outcomes</h2>
        {verified >= 5 && <div className="link-row"><span><b>Verified Builder</b><br /><small className="activity-time">{verified} verified milestones</small></span><BadgeCheck size={18} color="#438b76" /></div>}
        {completed >= 1 && <div className="link-row"><span><b>Project Completer</b><br /><small className="activity-time">{completed} project{completed === 1 ? '' : 's'} completed</small></span><BadgeCheck size={18} color="#438b76" /></div>}
        {verified === 0 && completed === 0 && <p className="section-sub" style={{ padding: '12px 0' }}>Complete and verify milestones to earn recognition badges.</p>}
      </section>
    </div>
    <div className="disclaimer" style={{ marginTop: 17 }}>ProofScore reflects verified milestones in this browser demo. In the production version, it will be derived from on-chain events. It is not a credit score.</div>
    <section style={{ marginTop: 24 }}><div className="panel-head" style={{ paddingLeft: 0 }}><div><h2 className="section-title">Verified work history</h2><p className="section-sub">Milestones verified in this workspace.</p></div></div>
      <div className="project-list">{work.length ? work.map(project => <div key={project.id} className="project-row"><div><div className="project-title">{project.title}</div><div className="project-meta">Category: {project.category}</div></div><div><span className="project-meta">{project.milestones.filter(milestone => milestone.status === 'verified').length} verified milestones</span></div><span className="badge good">Verified</span><span className="currency">{money(project.budget, project.currency)}</span></div>) : <div className="card"><EmptyState title="No verified work yet" body="Approve milestones to build your reputation." /></div>}</div>
    </section>
  </>;
}

export function Settings() {
  const { store, update } = useApp();
  return <>
    <PageHead eyebrow="Workspace preferences" title="Settings" description="Choose how this browser demo behaves." />
    <section className="card panel"><h2 className="section-title">Your experience</h2><p className="section-sub">Preferences save locally with your demo workspace.</p><div className="settings-list">
      {[
        ['Email updates', 'Notifications are simulated. No email will be sent.', 'emailUpdates'],
        ['Compact data view', 'Use a denser layout for project records.', 'compactMode'],
      ].map(([title, description, key]) => <div className="setting-row" key={key}><div><strong>{title}</strong><p>{description}</p></div>
        <button className={`switch ${store.settings[key as keyof typeof store.settings] ? 'on' : ''}`} role="switch" aria-checked={store.settings[key as keyof typeof store.settings]} onClick={() => update(current => ({ ...current, settings: { ...current.settings, [key]: !current.settings[key as keyof typeof current.settings] } }))} data-testid={`switch-${key}`}><span /></button>
      </div>)}
    </div></section>
    <section className="card panel" style={{ marginTop: 16 }}><h2 className="section-title">Demo data</h2><p className="section-sub">Reset the browser-local workspace to its original sample projects and review states.</p><div className="notice" style={{ margin: '15px 0' }}>Your changes do not sync across devices. Login and signup are demo access only, not production authentication.</div>
      <Button variant="danger" testId="button-reset-demo" onClick={() => { if (window.confirm('Reset all ProofFlow demo data in this browser?')) { update(() => seedStore()); notify('Demo workspace reset.'); } }}>Reset demo workspace</Button>
    </section>
  </>;
}

export function NotFoundPage() {
  return <div className="card empty"><div className="empty-icon"><CircleHelp /></div><h3>We couldn’t find that page</h3><p>The route may have moved or the project may no longer exist in this browser.</p><Link href="/dashboard" className="btn btn-primary" data-testid="link-not-found-home">Back to workspace</Link></div>;
}