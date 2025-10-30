# Changelog Entry Template

Use this template when adding new entries to `CHANGELOG.md`.

## Copy-Paste Template

```markdown
### [YYYY-MM-DD] - [Brief Descriptive Title]

**Type**: [🔴 BREAKING CHANGE | 🟠 MAJOR CHANGE | 🟢 DIRECTION CHANGE | 🔵 MIGRATION REQUIRED | 🟡 DEPRECATED]

**Summary**: One-line description of what changed and why.

#### Breaking Changes
- **Component/Feature**: Specific breaking change description
  - **Impact**: What functionality/component will be affected
  - **Action Required**: What developers/users need to do
  - **Migration**: Migration filename if applicable (e.g., `20251021_description`)
  - **Related Files**: List of files that must be updated

#### Major Changes
- **Feature/Component**: Description of significant changes
- **Feature/Component**: Additional major changes...

#### Direction Changes
- **Theme/Area**: Description of strategic shift or architectural change
- **Theme/Area**: Additional directional shifts...

#### Files Affected
- `path/to/new-file.ts` (NEW)
- `path/to/modified-file.ts` (MODIFIED)
- `path/to/deleted-file.ts` (REMOVED)

#### Migration Notes
⚠️⚠️⚠️ **Important Note**: Any special instructions, pre-migration checks, or post-migration steps required.

**Related Documentation**: `docs/RELATED_FILE.md` (if applicable)
```

---

## Example Entry

```markdown
### 2025-10-25 - API Authentication Refactoring

**Type**: 🔴 BREAKING CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Refactored authentication system to use JWT tokens instead of session-based auth.

#### Breaking Changes
- **Authentication Method**: Replaced session-based auth with JWT tokens
  - **Impact**: All API endpoints now require `Authorization: Bearer <token>` header
  - **Action Required**: 
    - Update all API clients to include JWT token
    - Migrate existing sessions to JWT tokens
    - Update authentication middleware
  - **Migration**: `20251025_jwt_authentication_refactor`
  - **Related Files**: 
    - `src/routes/api/*.ts` (all API routes)
    - `src/hooks/authHooks.ts`
    - Frontend API client files

#### Major Changes
- **New Service**: `jwtService.ts` - Handles token generation, validation, and refresh
- **New Middleware**: `authMiddleware.ts` - Validates JWT tokens on protected routes
- **Token Refresh**: Implemented automatic token refresh mechanism
- **Security**: Added token expiration and refresh token rotation

#### Direction Changes
- **Authentication Strategy**: Shift from server-side session to stateless JWT authentication
- **Scalability**: Enables horizontal scaling without shared session store
- **API Design**: RESTful authentication pattern

#### Files Affected
- `src/services/jwtService.ts` (NEW)
- `src/middleware/authMiddleware.ts` (NEW)
- `src/hooks/authHooks.ts` (MODIFIED)
- `src/routes/api/index.ts` (MODIFIED)
- `src/config/session.ts` (REMOVED)

#### Migration Notes
⚠️⚠️⚠️ **Pre-Migration Steps**:
1. Generate JWT secret key: `openssl rand -base64 32`
2. Set `JWT_SECRET` environment variable
3. Backup existing session data if needed

⚠️⚠️⚠️ **Post-Migration Steps**:
1. Invalidate all existing sessions
2. Force all users to re-authenticate
3. Update API documentation with new authentication flow

**Related Documentation**: `docs/JWT_AUTHENTICATION.md`
```

---

## Category Guidelines

### 🔴 BREAKING CHANGE
Use when:
- API contracts change in incompatible ways
- Database schema changes require code updates
- Configuration format changes
- Dependencies are removed or significantly changed
- Default behaviors change

### 🟠 MAJOR CHANGE
Use when:
- New significant features are added
- Existing features are substantially modified
- Performance optimizations with side effects
- New dependencies added
- Major refactoring that doesn't break compatibility

### 🟢 DIRECTION CHANGE
Use when:
- Architectural patterns change
- Development approach shifts
- Business logic direction changes
- Technology stack decisions
- Design philosophy changes

### 🔵 MIGRATION REQUIRED
Use when:
- Database schema changes
- Configuration file structure changes
- Data format changes requiring migration scripts
- Always include migration filename

### 🟡 DEPRECATED
Use when:
- Features are being phased out
- APIs are marked for removal
- Should include deprecation timeline and replacement

---

## Quick Checklist

Before submitting a changelog entry, ensure:

- [ ] Date is in YYYY-MM-DD format
- [ ] Title is clear and descriptive
- [ ] All relevant categories are tagged
- [ ] Breaking changes include impact and action required
- [ ] Migration notes are clear and actionable
- [ ] All affected files are listed
- [ ] Related documentation is referenced
- [ ] Pre/post-migration steps are documented
- [ ] Entry follows chronological order (newest first)

---

## Adding to CHANGELOG.md

1. Copy the template above
2. Fill in all sections relevant to your change
3. Add entry at the top of the relevant year section in `CHANGELOG.md`
4. Update the "Quick Reference" section if needed
5. Update the "Last Updated" date at the bottom

