# Clever Cloud Vault

Vite + React app connected to Supabase.

## About

Clever Cloud Vault is an intelligent cloud storage platform that makes file management simple, fast, and secure. It pairs modern encryption and privacy-first access controls with AI-powered organization, so your documents are automatically tagged, categorized, and easy to discover. Instead of hunting through folders, you can search by content and context to find exactly what you need.

Designed for individuals and teams, Clever Cloud Vault supports real-time sync across devices, secure sharing, and scalable storage tiers. The goal is to reduce time spent managing files and increase time spent doing meaningful work, with a clean, modern experience that stays reliable as you grow.

## Local setup

1. Clone the repo:

```sh
git clone https://github.com/aadianand26/clever-cloud-vault.git
cd clever-cloud-vault
```

2. Install dependencies:

```sh
npm install
```

3. Create a local env file:

```sh
cp .env.example .env.local
```

If you are on Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```

4. Start the app:

```sh
npm run dev
```

The app runs locally while still using the connected hosted Supabase project unless you replace the values in `.env.local`.

## Supabase configuration

The frontend expects these variables in `.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

`.env.example` is already filled with the current hosted Supabase project values from this repo so you can boot the app quickly.

## Edge functions and secrets

The local frontend only needs the two `VITE_...` variables above, but some features also rely on hosted Supabase Edge Functions and server-side secrets:

- `extract-text`: `AI_GATEWAY_API_KEY`, `AI_GATEWAY_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `ai-analyze`: `AI_GATEWAY_API_KEY`, `AI_GATEWAY_URL`
- `create-checkout`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`
- `get-shared-file`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

If those secrets are already configured in the connected Supabase project, your local frontend will use them automatically through that hosted project.

## Supabase CLI

This repo already includes:

- `supabase/config.toml`
- `supabase/migrations/*`
- `supabase/functions/*`

So if you want to run Supabase fully local later, these files are the starting point for the Supabase CLI workflow.
