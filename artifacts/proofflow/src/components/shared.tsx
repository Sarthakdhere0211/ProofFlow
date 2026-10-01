import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, ArrowRight, ChevronRight, FolderKanban, Gauge, LayoutDashboard, LogOut, Menu, ShieldCheck, UserRound, WalletCards, Settings as SettingsIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { money, progressOf, type Project, type Role } from '../services/store';

export const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const displayStatus = (status: string) => status.replaceAll('_', ' ');
export const statusClass = (status: string) => ['verified', 'released', 'approved', 'completed'].includes(status) ? 'good' : ['under_review', 'submitted'].includes(status) ? 'review' : ['changes_requested', 'failed'].includes(status) ? 'red' : 'wait';

const navItems = [['/dashboard', 'Overview', LayoutDashboard], ['/projects', 'Projects', FolderKanban], ['/transactions', 'Transactions', WalletCards], ['/reputation', 'ProofScore', Gauge], ['/profile', 'Profile', UserRound], ['/settings', 'Settings', SettingsIcon]] as const;

export function Brand() {
  return <div className="brand"><span className="brand-mark"><ShieldCheck /></span><span>ProofFlow</span></div>;
}

function SideNavigation({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const [location] = useLocation();
  return <nav className={mobile ? 'mobile-nav' : 'nav-list'} aria-label="Main navigation">{navItems.map(([href, label, Icon]) =>
    <Link key={href} href={href} onClick={onNavigate} className={`nav-link ${location === href ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase()}`}><Icon /><span>{label}</span></Link>)}</nav>;
}

export function Shell({ children }: { children: ReactNode }) {
  const { store, update } = useApp();
  const [mobile, setMobile] = useState(false);
  const [, navigate] = useLocation();
  return <div className="app-shell">
    <aside className="sidebar"><Link href="/dashboard"><Brand /></Link><div className="nav-label">Workspace</div><SideNavigation />
      <div className="side-bottom"><div className="demo-note"><strong>Browser-local demo</strong>Changes stay in this browser and do not sync across devices. Login is not production authentication.</div>
        <button className="nav-link" style={{ width: '100%', border: 0, background: 'transparent', marginTop: 12 }} onClick={() => navigate('/')} data-testid="button-signout"><LogOut /><span>Exit demo</span></button>
      </div>
    </aside>
    <main className="main"><header className="topbar">
      <button className="btn btn-quiet mobile-menu" aria-label="Toggle navigation" onClick={() => setMobile(!mobile)} data-testid="button-mobile-menu"><Menu /></button>
      <div className="topbar-left">Workspace <ChevronRight size={13} /> <span style={{ color: 'var(--ink)' }}>Proof, then payment.</span></div>
      <div className="top-actions"><label className="topbar-left" htmlFor="role-switch">Viewing as</label>
        <select id="role-switch" className="role-select" value={store.user.role} onChange={e => update(s => ({ ...s, user: { ...s.user, role: e.target.value as Role } }))} data-testid="select-role"><option value="worker">Worker</option><option value="client">Client</option></select>
        <Link href="/profile" className="avatar" aria-label="Open profile" data-testid="link-avatar">{store.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Link>
      </div>
    </header>{mobile && <SideNavigation mobile onNavigate={() => setMobile(false)} />}<div className="content">{children}</div></main>
  </div>;
}

export function StorageWarning() {
  const { persistenceWarning } = useApp();
  return persistenceWarning ? <div className="storage-warning" role="alert" data-testid="status-storage-warning"><strong>Browser-only persistence warning</strong><span>{persistenceWarning}</span></div> : null;
}

export function PageHead({ eyebrow, title, description, action }: { eyebrow?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}
export function Button({ children, onClick, variant = 'primary', testId, type = 'button', disabled = false }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; testId: string; type?: 'button' | 'submit'; disabled?: boolean }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant}`} data-testid={testId}>{children}</button>;
}
export function Badge({ children, status }: { children: ReactNode; status: string }) {
  return <span className={`badge ${statusClass(status)}`} data-testid={`status-${status.replaceAll('_', '-')}`}>{children}</span>;
}
export function Stat({ label, value, detail, Icon }: { label: string; value: string; detail: string; Icon: typeof Activity }) {
  return <div className="card stat-card"><div className="stat-head"><span>{label}</span><span className="stat-icon"><Icon /></span></div><div className="stat-value" data-testid={`value-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</div><div className="stat-foot">{detail}</div></div>;
}
export function ProjectCard({ project }: { project: Project }) {
  const progress = progressOf(project);
  return <Link href={`/projects/${project.id}`} className="project-row" data-testid={`card-project-${project.id}`}>
    <div><div className="project-title">{project.title}</div><div className="project-meta">{project.category} · {project.milestones.length} milestones</div></div>
    <div className="progress-wrap"><div className="progress"><span style={{ width: `${progress}%` }} /></div><span className="progress-num">{progress}%</span></div>
    <span className={`badge ${statusClass(project.status)}`}>{displayStatus(project.status)}</span><span className="currency">{money(project.budget, project.currency)}</span><span className="project-date project-meta">{dateLabel(project.endDate)}</span>
  </Link>;
}
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="empty"><div className="empty-icon"><FolderKanban /></div><h3>{title}</h3><p>{body}</p>{action}</div>;
}
export function Field({ label, value, onChange, placeholder = '', type = 'text', testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; testId: string }) {
  return <div className="field">{label && <label>{label}</label>}<input className="input" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} data-testid={testId} /></div>;
}
export function Timeline({ text, detail }: { text: string; detail: string }) {
  return <div className="timeline-item"><span className="timeline-mark" /><span><b>{text}</b><br /><span className="activity-time">{detail}</span></span></div>;
}
export function PageLink({ href, children, testId }: { href: string; children: ReactNode; testId: string }) {
  return <Link className="btn btn-quiet" href={href} data-testid={testId}>{children}<ArrowRight size={14} /></Link>;
}