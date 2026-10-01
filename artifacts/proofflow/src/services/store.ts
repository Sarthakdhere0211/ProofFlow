export type Role = 'client' | 'worker';
export type ProofStatus = 'not_submitted' | 'submitted' | 'changes_requested' | 'approved';
export type PaymentStatus = 'pending' | 'released' | 'failed';
export type Proof = {id:string;title:string;description:string;githubUrl:string;liveUrl:string;additionalUrl:string;fileName:string;notes:string;submittedAt:string;status:ProofStatus};
export type Milestone = {id:string;title:string;description:string;amount:number;dueDate:string;status:'pending'|'in_progress'|'under_review'|'verified';proofStatus:ProofStatus;paymentStatus:PaymentStatus;proof?:Proof};
export type Project = {id:string;title:string;description:string;clientId:string;workerId:string;category:string;budget:number;currency:string;startDate:string;endDate:string;status:'active'|'completed'|'draft';milestones:Milestone[]};
export type User = {id:string;name:string;email:string;role:Role;proofScore:number};
export type Transaction = {id:string;projectId:string;milestoneId:string;amount:number;status:PaymentStatus;type:'release'|'lock';createdAt:string};
export type Store = {user:User;projects:Project[];transactions:Transaction[];settings:{emailUpdates:boolean;compactMode:boolean}};
const today=new Date().toISOString().slice(0,10);
const ms=(id:string,title:string,description:string,amount:number,days:number,status:Milestone['status'],proofStatus:ProofStatus,paymentStatus:PaymentStatus,proof?:Proof):Milestone=>({id,title,description,amount,dueDate:new Date(Date.now()+days*86400000).toISOString().slice(0,10),status,proofStatus,paymentStatus,proof});
const seed:Store={user:{id:'alex',name:'Alex Sharma',email:'worker@proofflow.demo',role:'worker',proofScore:94},settings:{emailUpdates:true,compactMode:false},transactions:[
 {id:'demo-tx-104',projectId:'butter',milestoneId:'butter-ui',amount:5000,status:'released',type:'release',createdAt:'2025-10-01T10:00:00.000Z'},
 {id:'demo-tx-105',projectId:'butter',milestoneId:'butter-front',amount:10000,status:'released',type:'release',createdAt:'2025-10-05T10:00:00.000Z'}
],projects:[
 {id:'butter',title:'Butter Brews Bistro Website',description:'A warm, quick-to-use digital home for a neighbourhood coffee and bakehouse in Pune. Includes menu, online ordering and a story-led brand page.',clientId:'client-1',workerId:'alex',category:'Web development',budget:30000,currency:'INR',startDate:'2025-09-18',endDate:'2025-11-24',status:'active',milestones:[
 ms('butter-ui','UI Design','Visual system, responsive page layouts and approved design handoff.',5000,-14,'verified','approved','released'),
 ms('butter-front','Frontend Development','Responsive frontend implementation completed.',10000,-5,'verified','approved','released',{id:'p-front',title:'Frontend build handoff',description:'Responsive frontend implementation completed, with accessible navigation and menu states.',githubUrl:'https://github.com/demo/butter-brews',liveUrl:'https://butter-brews.demo',additionalUrl:'',fileName:'',notes:'Ready for client review.',submittedAt:'2025-10-05T10:00:00.000Z',status:'approved'}),
 ms('butter-back','Backend Development','Ordering flow, menu data and contact form integration.',7000,6,'under_review','submitted','pending',{id:'p-back',title:'Ordering flow and menu integration',description:'Menu and ordering flow connected with working form validation and responsive states.',githubUrl:'https://github.com/demo/butter-brews-backend',liveUrl:'https://butter-brews.demo',additionalUrl:'https://docs.example.test/hand-off',fileName:'handoff-notes.pdf',notes:'Please review the order confirmation state.',submittedAt:'2025-10-12T09:25:00.000Z',status:'submitted'}),
 ms('butter-deploy','Deployment','Production deployment, smoke test and final handover.',8000,19,'pending','not_submitted','pending')
 ]},
 {id:'northstar',title:'Northstar Learning Portal',description:'A small learning platform for an independent design school, with course pages and a student resource library.',clientId:'north-client',workerId:'alex',category:'Product design',budget:46000,currency:'INR',startDate:'2025-10-01',endDate:'2025-12-12',status:'active',milestones:[ms('north-research','Research & structure','Discovery and information architecture.',9000,2,'verified','approved','released'),ms('north-design','Course experience','Responsive course and resource library.',17000,12,'in_progress','not_submitted','pending'),ms('north-build','Build & handoff','Front-end build and documentation.',20000,34,'pending','not_submitted','pending')]},
 {id:'mango','title':'Mango House Brand Refresh','description':'A fresh identity and digital storefront for a family-run home goods studio.',clientId:'mango-client',workerId:'alex',category:'Brand & web',budget:22500,currency:'INR',startDate:'2025-08-12',endDate:'2025-10-20',status:'completed',milestones:[ms('mango-brand','Identity system','Brand direction, type and color system.',7500,-40,'verified','approved','released'),ms('mango-shop','Storefront','Shop pages and launch assets.',15000,-18,'verified','approved','released')]},
 {id:'fieldnotes','title':'Fieldnotes Studio Portfolio','description':'Portfolio and case study archive for a small landscape architecture studio.',clientId:'field-client',workerId:'alex',category:'Web development',budget:18000,currency:'INR',startDate:'2025-10-06',endDate:'2025-11-28',status:'active',milestones:[ms('field-map','Content map','Case study structure and page map.',6000,8,'in_progress','not_submitted','pending'),ms('field-build','Portfolio build','Responsive page implementation.',12000,31,'pending','not_submitted','pending')]}
]};
const KEY='proofflow.demo.v1';
export type StoreLoadResult={store:Store;warning:string|null};
export function readStore():StoreLoadResult{
 try{const raw=localStorage.getItem(KEY);if(!raw)return {store:structuredClone(seed),warning:null};const p=JSON.parse(raw) as Store;if(!p.user||!Array.isArray(p.projects)||!Array.isArray(p.transactions))return {store:structuredClone(seed),warning:'Saved demo data could not be read. Sample data has been restored in memory; changes may not persist.'};return {store:{...seed,...p,settings:{...seed.settings,...p.settings}},warning:null}}
 catch{return {store:structuredClone(seed),warning:'Browser storage is unavailable or unreadable. The demo is still usable in memory, but changes may not persist.'}}
}
export function writeStore(store:Store):boolean{try{localStorage.setItem(KEY,JSON.stringify(store));return true}catch{return false}}
export const makeId=(prefix='id')=>`${prefix}-${Math.random().toString(36).slice(2,9)}`;
const supportedCurrencies=['INR','USD','EUR','GBP'] as const;
export type SupportedCurrency=typeof supportedCurrencies[number];
export const isSupportedCurrency=(value:string):value is SupportedCurrency=>supportedCurrencies.some(currency=>currency===value);
export const money=(amount:number,currency='INR')=>new Intl.NumberFormat('en-IN',{style:'currency',currency:isSupportedCurrency(currency)?currency:'INR',maximumFractionDigits:0}).format(amount);
export const progressOf=(p:Project)=>p.milestones.length?Math.round(p.milestones.filter(m=>m.status==='verified').length/p.milestones.length*100):0;
export const seedStore=()=>structuredClone(seed);