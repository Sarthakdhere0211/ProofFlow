import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, FileCheck2, FilePlus2, LockKeyhole, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { notify, useApp } from '../context/AppContext';
import { Brand, Button } from '../components/shared';
import type { Role } from '../services/store';

export function Landing() {
  return <div className="landing">
    <nav className="landing-nav"><Link href="/"><Brand /></Link><div className="landing-links"><a href="#how" data-testid="link-how-it-works">How it works</a><a href="#trust" data-testid="link-why-proofflow">Why ProofFlow</a><Link className="btn btn-quiet" href="/login" data-testid="link-login">Log in</Link><Link className="btn btn-primary" href="/signup" data-testid="button-start-project">Start a project <ArrowRight /></Link></div></nav>
    <section className="landing-hero"><div><div className="eyebrow">Clear work. Considered payments.</div><h1>Don’t trust the claim.<br /><em>Verify the proof.</em></h1><p>ProofFlow turns project milestones into verifiable work, structured payments, and portable reputation.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Link className="btn btn-primary" href="/signup" data-testid="button-hero-start">Start a project <ArrowRight /></Link><Link className="btn btn-secondary" href="/dashboard" data-testid="button-explore-demo">Explore the demo</Link></div>
      <p style={{ fontSize: 10, marginTop: 18 }}>Browser-only demo · No real authentication or funds movement</p>
    </div><div className="hero-visual" aria-label="Milestone review process"><div className="eyebrow">A more dependable handoff</div>{[['PROJECT CREATED', '01'], ['MILESTONE DEFINED', '02'], ['PROOF SUBMITTED', '03'], ['CLIENT REVIEW', '04']].map(([label, number]) => <div className="flow-paper" key={number}><div className="flow-step"><span className="flow-circle">{number}</span>{label}</div></div>)}</div></section>
    <section className="landing-section" id="how"><div className="eyebrow">The flow stays visible</div><h2>Agree on the work.<br />Review before release.</h2><p>Each milestone has its own definition, proof and payment state. Both people can see exactly what happens next.</p>
      <div className="feature-grid"><Feature Icon={FilePlus2} title="Define the outcome" text="Break a project into specific milestones with clear amounts, due dates and completion notes." /><Feature Icon={FileCheck2} title="Show the work" text="Workers submit relevant links, files and context against the agreed milestone." /><Feature Icon={LockKeyhole} title="Review before release" text="The client approves or requests changes. Payment status is updated only after review." /><Feature Icon={ShieldCheck} title="Keep a work record" text="Verified milestones build a more useful history than a rating without context." /><Feature Icon={WalletCards} title="Structured payments" text="Track payment states alongside the proof that earned them. Mock records are always labeled." /><Feature Icon={Sparkles} title="Assisted review, later" text="AI-assisted review is a future direction. The current AI Verification Preview is illustrative only." /></div>
    </section>
    <section className="landing-section" id="trust"><div className="landing-cta"><div><div className="eyebrow" style={{ color: '#cbe29c' }}>A calmer way to work together</div><h2>Good work deserves<br />a clear record.</h2><p style={{ color: '#c0d2ca' }}>Explore a complete project flow using local demo data. Nothing leaves your browser.</p></div><Link href="/dashboard" className="btn btn-primary" style={{ background: '#d3e89f', color: '#183a3b' }} data-testid="button-cta-demo">Explore ProofFlow <ArrowRight /></Link></div>
      <p style={{ fontSize: 10, textAlign: 'center', margin: '22px auto' }}>Payments are simulated in this browser demo. Blockchain integration is not active. AI review is not active. Login is not production authentication.</p>
    </section>
  </div>;
}

function Feature({ Icon, title, text }: { Icon: typeof FilePlus2; title: string; text: string }) {
  return <article className="feature"><Icon /><h3>{title}</h3><p>{text}</p></article>;
}

export function AuthPage({ signup = false }: { signup?: boolean }) {
  const { store, update } = useApp();
  const [, navigate] = useLocation();
  const [role, setRole] = useState<Role>(store.user.role);
  const [name, setName] = useState(store.user.name);
  const [email, setEmail] = useState(store.user.email);
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes('@') || (signup && !name.trim())) {
      setError('Enter a valid email and name to continue.');
      return;
    }
    update(current => ({ ...current, user: { ...current.user, name: signup ? name : current.user.name, email, role } }));
    notify('Demo access ready in this browser.');
    navigate('/dashboard');
  };
  return <div className="auth-page"><aside className="auth-aside"><Link href="/"><Brand /></Link><div><div className="eyebrow" style={{ color: '#cbe29c' }}>Work with clarity</div><h1>Good work.<br />Clear proof.<br />Fair outcomes.</h1><p>Explore a complete milestone workspace using local demo data. No accounts or payment details are sent anywhere.</p></div><div style={{ fontSize: 10, color: '#92ada5' }}>ProofFlow · Browser-only demonstration</div></aside>
    <div className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><div className="eyebrow">{signup ? 'Create demo access' : 'Welcome back'}</div><h2>{signup ? 'Start a project' : 'Enter the workspace'}</h2><p>{signup ? 'Choose a role to explore the ProofFlow demo.' : 'Use any email to enter. This is not production authentication.'}</p>
      {error && <div className="alert" role="alert">{error}</div>}
      {signup && <div className="field"><label htmlFor="auth-name">Your name</label><input id="auth-name" className="input" value={name} onChange={event => setName(event.target.value)} data-testid="input-auth-name" /></div>}
      <div className="field"><label htmlFor="auth-email">Email</label><input id="auth-email" type="email" className="input" value={email} onChange={event => setEmail(event.target.value)} data-testid="input-auth-email" /></div>
      <div className="field"><label htmlFor="auth-role">Explore as</label><select id="auth-role" className="select" style={{ width: '100%' }} value={role} onChange={event => setRole(event.target.value as Role)} data-testid="select-auth-role"><option value="client">Client — create and review work</option><option value="worker">Worker — submit milestone proof</option></select></div>
      <Button type="submit" testId="button-auth-submit">{signup ? 'Create demo access' : 'Continue to demo'} <ArrowRight /></Button>
      <div className="notice" style={{ marginTop: 16 }}>Login is a browser demo only, not production authentication. Demo records remain on this device.</div>
      <p style={{ marginTop: 20 }}>{signup ? 'Already have access?' : 'New to ProofFlow?'} <Link href={signup ? '/login' : '/signup'} style={{ color: 'var(--teal)', fontWeight: 700 }} data-testid="link-auth-switch">{signup ? 'Log in' : 'Create demo access'}</Link></p>
      <Link href="/" className="btn btn-quiet" data-testid="link-auth-home"><ArrowLeft />Back to homepage</Link>
    </form></div>
  </div>;
}