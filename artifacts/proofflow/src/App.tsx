import { AppProvider, ToastHost } from './context/AppContext';
import { Shell, StorageWarning } from './components/shared';
import { Dashboard } from './pages/Dashboard';
import { MilestoneDetail, ProjectDetail } from './pages/ProjectDetail';
import { ProofReview } from './pages/ProofReview';
import { NewProject, ProjectsPage } from './pages/Projects';
import { AuthPage, Landing } from './pages/PublicPages';
import { NotFoundPage, Profile, Reputation, Settings, Transactions } from './pages/WorkspacePages';
import { Route, Switch } from 'wouter';

function WorkspaceRoutes() {
  return <Shell><Switch>
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/projects" component={ProjectsPage} />
    <Route path="/projects/new" component={NewProject} />
    <Route path="/projects/:id/proof/:milestoneId" component={ProofReview} />
    <Route path="/projects/:id/milestones/:milestoneId" component={MilestoneDetail} />
    <Route path="/projects/:id" component={ProjectDetail} />
    <Route path="/profile" component={Profile} />
    <Route path="/reputation" component={Reputation} />
    <Route path="/transactions" component={Transactions} />
    <Route path="/settings" component={Settings} />
    <Route component={NotFoundPage} />
  </Switch></Shell>;
}

function AppRoutes() {
  return <Switch>
    <Route path="/" component={Landing} />
    <Route path="/login"><AuthPage /></Route>
    <Route path="/signup"><AuthPage signup /></Route>
    <Route><WorkspaceRoutes /></Route>
  </Switch>;
}

function App() {
  return <AppProvider><StorageWarning /><AppRoutes /><ToastHost /></AppProvider>;
}

export default App;