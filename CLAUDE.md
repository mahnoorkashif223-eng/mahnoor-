# Project context — read this first

You are helping build a small admin dashboard as part of an intern hiring
challenge. The full spec is below. Stick to it. Do not add features outside
the spec.

## What we're building

An authenticated admin can:
1. Sign up / sign in (Supabase Auth, email + password).
2. Create organizations of three distinct types: School, Nonprofit, Business.
   Each type has at least one conditional field.
3. From an org detail page, invite members by email. Invitations must be
   created via a Supabase Edge Function (server-side validation).
4. See a directory of all organizations they have created.

## Tech stack — DO NOT deviate

- React 18 + TypeScript strict
- Vite + SWC (not Next.js, not CRA)
- React Router v6
- Tailwind CSS + shadcn/ui (no other component library)
- TanStack React Query for ALL server state (no raw useEffect+fetch)
- React Hook Form + Zod for ALL forms
- Lucide React for icons
- Supabase (Postgres + Auth + Edge Functions)
- RLS enabled on every table

## Data model (target)

- organizations: id, name, type, created_by (FK auth.users), created_at,
  plus type-specific fields:
  - School: school_district (text, required when type='school')
  - Nonprofit: ein (text, required when type='nonprofit')
  - Business: industry (text, required when type='business')
- organization_members: id, organization_id (FK), user_id (nullable),
  email, status ('invited' | 'active'), role, invited_at, joined_at.
  Unique constraint on (organization_id, email) to prevent dupe invites.
- profiles: id (FK auth.users), full_name, is_admin

## RLS rules (must be tested)

- A user can SELECT/UPDATE/DELETE an organization only if
  created_by = auth.uid().
- A user can SELECT/INSERT organization_members only for orgs they own.
- The invite Edge Function uses the service role key, but must verify the
  caller is the org owner before inserting.

## Edge Function: invite-member

- Input: { organization_id, email }
- Steps:
  1. Validate caller's JWT (Supabase auth).
  2. Verify caller is created_by on the organization.
  3. Validate email with Zod.
  4. Check no existing invite for (org_id, email).
  5. Insert row in organization_members with status='invited'.
- Email sending is NOT implemented — leave a TODO comment where it would
  plug in.

## Routes

- /sign-in, /sign-up — public
- / → redirect to /organizations
- /organizations — directory (protected)
- /organizations/new — create form (protected)
- /organizations/:id — detail + members + invite form (protected)

Protected routes redirect to /sign-in when signed out.

## UX must-haves

- Loading, empty, error states across the app
- Sign-out control visible
- Signed-in user's email in the header
- Mobile-tolerable layout
- Type badge on org rows

## Git workflow

- main (prod) ← merges from development only
- development (default) ← feature branches via PR
- At least 2 PRs over the project lifetime
- Conventional Commits style messages

## Deploy

- Vercel: main → prod URL, development → preview URL
- Env vars in Vercel dashboard, not committed
- .env.example is the canonical list of required vars

## Out of scope (do NOT build unless core is done)

- Accepting invitations as a real signed-up user
- Role-based permissions within an org
- Search/filter on directory
- Email delivery
- Playwright E2E
- Dark mode
