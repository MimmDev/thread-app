# application-boilerplate

A Next.js boilerplate with authentication, database, and infrastructure ready to go.

## Stack

- **Framework** — Next.js 16 (App Router, Turbopack)
- **UI** — shadcn/ui, Tailwind CSS
- **Auth** — Auth.js v5 with Auth0
- **Database** — PostgreSQL via Prisma
- **Infrastructure** — Terraform (Auth0)

## Structure

```
apps/
  web/          # Next.js app
infrastructure/ # Terraform (Auth0)
```

## Prerequisites

- Node.js 22+
- npm 10+
- Docker (for local database)
- Terraform (for infrastructure)

## Getting started

### 1. Bootstrap the repo

```bash
make bootstrap-repo
```

This replaces all placeholders throughout the codebase, creates `infrastructure/environments/prod.secrets.tfvars` with your Auth0 M2M credentials, and generates a `.env` file with a random `AUTH_SECRET`.

### 2. Set up environment variables

Copy the example file:

```bash
cp .env.example .env
```

Then fill in the values — see [Environment variables](#environment-variables) below.

### 3. Install dependencies

```bash
npm install
```

### 4. Start the database

```bash
npm run db:up
```

### 5. Run migrations

```bash
npm run db:migrate
```

### 6. Start the dev server

```bash
npm run dev
```

App runs on http://localhost:3000.

---

## Environment variables

### `WEB_PORT`
Port for the Next.js dev server. Default: `3000`.

### `API_PORT`
Reserved for a future API service. Default: `3001`.

### `DATABASE_URL`
PostgreSQL connection string. The default matches the local Docker Compose database:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app?schema=public
```

### `AUTH_SECRET`
Secret used by Auth.js to encrypt session cookies. Generate one with:
```bash
npx auth secret
```

### `AUTH_AUTH0_ID`, `AUTH_AUTH0_SECRET`, `AUTH_AUTH0_ISSUER`
Auth0 credentials for Auth.js. Before running Terraform, you need to create a Machine-to-Machine app in Auth0 manually:

1. Go to Auth0 dashboard → Applications → Create Application → Machine to Machine
2. Authorize it against the **Auth0 Management API** with the `create:clients`, `update:clients`, `read:clients`, `create:connections`, `update:connections`, `read:connections`, `update:branding` scopes
3. Copy the domain, client ID and secret into `infrastructure/environments/prod.tfvars`

4. Run `make bootstrap-repo` — it will prompt for the M2M credentials and create `prod.secrets.tfvars` automatically.

Then deploy and retrieve the app credentials:

```bash
cd infrastructure
terraform init
terraform apply -var-file=environments/prod.tfvars -var-file=environments/prod.secrets.tfvars

terraform output AUTH_AUTH0_ID
terraform output AUTH_AUTH0_ISSUER
# AUTH_AUTH0_SECRET: Auth0 dashboard → Applications → your app → Settings → Client Secret
```

---

## Database

```bash
npm run db:up        # start local Postgres via Docker
npm run db:down      # stop local Postgres
npm run db:migrate   # run migrations
npm run db:generate  # regenerate Prisma client
npm run db:studio    # open Prisma Studio
```

## Build

```bash
npm run build
```
