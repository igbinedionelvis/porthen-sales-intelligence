# Porthen — Sales Intelligence & Lead Management

Porthen is a modern SaaS sales intelligence and lead management dashboard designed to help teams organize prospects, track pipeline activity, monitor sales performance, and manage outreach workflows.

🔗 **Live Demo:** https://porthen-sales-intelligence.vercel.app

## Overview

Porthen provides a centralized workspace for sales teams to manage leads and monitor pipeline performance through a clean, analytics-focused dashboard.

Sign-in is backed by Supabase Auth. Each new user receives a personal workspace in Postgres. The dashboard, leads, analytics, and settings screens are available only to a signed-in user. The leads page reads that user's owner-workspace leads from Supabase. The dashboard, analytics, and settings screens still render local demo data.

## Implemented

- Email and password sign-up, sign-in, and sign-out through Supabase Auth
- Protected application routes
- Automatic profile, workspace, and owner-membership provisioning on signup
- Workspace-owned `leads` rows, with `workspace_id` required
- Row Level Security so authenticated members can reach only their workspace data
- Leads page reads `public.leads` for the signed-in user's owner workspace
- Versioned SQL migrations in `supabase/migrations`

## Frontend demo data

These screens still read data shipped with the app:

- Sales performance dashboard, including its recent-leads list
- Pipeline and analytics charts
- Header search
- Settings screen

The leads page loads rows from `public.leads` for the signed-in user's owner workspace. Search, filters, and the details drawer on that page use the fetched rows. The page does not create, update, or delete leads.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth and Postgres
- Zustand
- Recharts
- React Router

## Database

Supabase Postgres is the system of record for accounts and workspace ownership. The hosted project is managed with the Supabase CLI. Migration files live in `supabase/migrations` and run in filename order.

### Authentication and provisioning

The app uses the Supabase anon key and `supabase.auth`. Sign-up stores the person's name in `raw_user_meta_data.full_name`.

`public.handle_new_user()` runs after insert on `auth.users`. It creates:

- a `public.profiles` row for that user
- a personal `public.workspaces` row named `My Workspace`
- an `owner` row in `public.workspace_members`

The trigger function is `SECURITY DEFINER`, uses an empty `search_path`, and is not executable by `PUBLIC`, `anon`, or `authenticated`.

### Ownership and row-level security

| Table | Access model |
|---|---|
| `profiles` | One row per auth user. A user can read and update only that row. |
| `workspaces` | A member can read workspaces where they have a membership. |
| `workspace_members` | A member can read memberships in their workspaces. |
| `leads` | Every lead belongs to one workspace (`workspace_id` is `NOT NULL`). A member can select, insert, update, and delete leads in their workspaces. |

`public.is_workspace_member(uuid)` is `STABLE` and `SECURITY DEFINER`, with an empty `search_path`. It returns true when `auth.uid()` has a membership in the given workspace. Only `authenticated` may execute it.

Production policies, all for `authenticated`:

| Table | Policy | Command |
|---|---|---|
| `leads` | Workspace members can read leads | `SELECT` |
| `leads` | Workspace members can insert leads | `INSERT` |
| `leads` | Workspace members can update leads | `UPDATE` |
| `leads` | Workspace members can delete leads | `DELETE` |
| `profiles` | Users can read own profile | `SELECT` |
| `profiles` | Users can update own profile | `UPDATE` |
| `workspaces` | Workspace members can read workspaces | `SELECT` |
| `workspace_members` | Workspace members can read memberships | `SELECT` |

Lead, workspace, and membership policies call `public.is_workspace_member` for that row's workspace. Update policies check both the existing row and the new row. Profile policies require `id` to equal `auth.uid()` for both read and update. Anonymous policies on these tables are removed.

### Table privileges

`anon` has no privileges on `leads`, `profiles`, `workspaces`, or `workspace_members`.

`authenticated` has only these privileges:

- `leads`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- `profiles`: `SELECT`, `UPDATE`
- `workspaces`: `SELECT`
- `workspace_members`: `SELECT`

`anon` and `authenticated` do not have `TRUNCATE`, `REFERENCES`, `TRIGGER`, or `MAINTAIN` on these tables. `service_role` privileges were left unchanged.

### Migration history

These four migrations are present in the local migration files and recorded as applied on the hosted database:

| Version | Migration | Local | Remote |
|---|---|---|---|
| `20261107000100` | `create_leads` | Applied | Applied |
| `20261107000200` | `add_workspace_ownership` | Applied | Applied |
| `20261107000300` | `create_signup_provisioning` | Applied | Applied |
| `20261109000400` | `secure_workspace_access` | Applied | Applied |

`20261109000400_secure_workspace_access.sql` is applied in production. It installs `public.is_workspace_member`, the policies above, `NOT NULL` on `leads.workspace_id`, and the table privileges above.

### Migration workflow

1. Add a new file under `supabase/migrations`. Do not edit a version that is already recorded in `supabase_migrations.schema_migrations`.
2. Review the SQL. Migrations should be safe to run in one transaction and should not delete or rewrite existing business data.
3. Apply a reviewed migration to the hosted database with the Supabase CLI (`supabase db push`) only when that deploy is intended.
4. Use `supabase db reset` only against a local database. That command rebuilds the local database from the migration files.

Local CLI settings are in `supabase/config.toml`. The app reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the environment.

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

```bash
git clone https://github.com/igbinedionelvis/porthen-sales-intelligence.git
cd porthen-sales-intelligence
npm install
```

Create a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase project settings.

### Run locally

```bash
npm run dev
```

### Production build

```bash
npm run build
```

## Planned

- Create, update, and delete leads from the leads page
- Show the signed-in user's real workspace in settings
- Add workspace invites and role-specific permissions beyond membership
- Replace demo dashboard and analytics numbers with database reporting
- Add automated migration checks to CI

## License

MIT
