# ProofFlow — Security Documentation

## Current Security Status

**Phase 2** — Architecture established. Real security controls land in Phase 3+.

## Authentication Security (Phase 3)

### Password handling
- bcrypt with cost factor 12 minimum
- NEVER store plaintext passwords
- NEVER log passwords or auth tokens
- Unique salt per password (bcrypt handles this)

### JWT architecture
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days) in httpOnly, Secure, SameSite=Strict cookie
- Refresh tokens stored in DB (for revocation)
- Logout invalidates refresh token in DB

### Brute force protection
- Rate limit auth endpoints: 5 attempts per IP per 15 minutes
- Lockout after sustained attack
- Generic error messages ("Invalid email or password" — never reveal which is wrong)

## API Security

### Input validation
All endpoints use Zod schemas. Implemented in Phase 2.

### Authentication
`requireAuth` middleware on all protected routes. Stub in Phase 2, real JWT in Phase 3.

### Authorization (IDOR prevention)
Every data access checks that the requesting user is the project client or worker.
Example:
```typescript
if (project.clientId !== req.userId && project.workerId !== req.userId) {
  throw new AppError(403, 'forbidden', 'You do not have permission to view this project.');
}
```

### Rate limiting (Phase 8)
- `/auth/*`: 5 req/15min per IP
- `/api/*`: 100 req/min per authenticated user
- Global: 1000 req/min per IP

### HTTP Security Headers (Phase 8)
```
Content-Security-Policy: (custom — matches actual frontend dependencies)
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
X-Frame-Options: DENY
```
Note: CSP is built to match actual application dependencies. Do not blindly copy a restrictive CSP.

### CORS
Allowlisted origins only (CORS_ORIGINS env var). Credentials allowed.

## Blockchain Security

### Key principles
- Private keys NEVER touch the server
- Private keys NEVER appear in frontend code, localStorage, or Git
- Server only holds fee-bump signing key (STELLAR_FEE_ACCOUNT_SECRET_KEY)
  — this key only pays transaction fees, it does not control escrow funds
- User wallets sign transactions via Freighter — server never sees the key

### Transaction verification
Before marking a milestone as approved in the database:
1. Receive txHash from client
2. Query Stellar Horizon to verify the transaction
3. Verify the transaction called the correct contract function
4. Verify the milestone index matches
5. Only then update database state

### Escrow security
- Contract holds funds — not a server account
- Double-payment prevention enforced in contract (status == APPROVED check)
- Amount immutable after funding
- No re-release possible (RELEASED is terminal state)

## Secrets Management

### Required environment variables
See `.env.example` for the complete list.

### What must NEVER be committed
- `.env`, `.env.*` — blocked by .gitignore
- Private keys
- JWT secrets
- Database passwords
- Wallet seeds

### If a secret is found in Git history
1. Rotate the secret immediately (generate a new one)
2. Revoke/regenerate the old credential in all services
3. Audit for unauthorized use
4. Consider git history rewrite (coordinate with team)

## Known Issues to Fix (Phase 8)

- [ ] Rate limiting not yet implemented
- [ ] Auth middleware is a stub (Phase 3)
- [ ] CSRF protection not yet added
- [ ] Security headers not yet set
- [ ] NoSQL/SQL injection prevention relies on ORM only (add allowlist validation)
- [ ] File upload validation not implemented (Phase 7)
- [ ] Audit log not yet implemented

## Security Review Checklist (pre-production)

- [ ] No secrets in source code or Git history
- [ ] All endpoints have authentication where required
- [ ] All endpoints have authorization (IDOR checks)
- [ ] Input validation on all request fields
- [ ] Rate limiting on auth and sensitive endpoints
- [ ] Security headers configured
- [ ] HTTPS enforced in production
- [ ] Blockchain txHash verification before DB update
- [ ] No transaction hash displayed until on-chain confirmed
- [ ] No fake blockchain links
- [ ] File uploads validate MIME type (not just extension)
- [ ] Dependency audit (pnpm audit)
- [ ] Contract security review (reentrancy, integer safety, authorization)
