# Admin Dashboard — Organizations & Invitations

Intern hiring challenge for ImpactOps. A small admin dashboard where
authenticated admins create organizations of multiple types, invite members
by email, and manage the organizations they own.

## Stack

- React 18 + TypeScript (strict mode)
- Vite (SWC)
- React Router v6
- Tailwind CSS + shadcn/ui
- TanStack React Query
- React Hook Form + Zod
- Supabase — Postgres, Auth, Edge Functions, RLS
- Deployed on Vercel (main → production, development → preview)

## Local setup

\`\`\`bash
git clone https://github.com/mahnoorkashif223-eng/mahnoor.git
cd mahnoor
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm run dev
\`\`\`

Open http://localhost:5173

## Branching workflow

- \`main\` — production, deploys to production Vercel URL
- \`development\` — default working branch, deploys to preview Vercel URL
- Feature branches: \`feat/<short-name>\` off \`development\`, merged via PR

## Supabase

- Schema migrations: \`supabase/migrations/\`
- Edge Functions: \`supabase/functions/\`
- RLS enabled on every table; admins can only access their own data.

## Live URLs

- Production: _TBD_
- Preview (development): _TBD_

## Seeded admin credentials

_To be added before submission._

## Tradeoffs & what I'd do with another day

_To be filled in._
