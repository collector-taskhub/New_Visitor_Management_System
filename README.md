# Visitor Management System — District Collector Office, Jalna

A complete visitor & grievance management system for the District Collector
Office, Jalna, Maharashtra. Ships as a **zero-config local prototype**
(SQLite database, no cloud accounts needed) that upgrades to a **free
production deployment** (Neon Postgres + Vercel) with a two-line change.

## Quick Start — Run the Prototype Locally (5 minutes, no accounts needed)

```bash
npm install
npm run setup     # creates the SQLite database, tables, and seed data
npm run dev
```

Open **http://localhost:3000** in your browser. That's it — the visitor
registration counter, tracking page, and staff dashboards are all live.

Default staff logins (seeded automatically):
- Collector: `collector@jalna.gov.in` / `Jalna@Collector2026`
- PA: `pa@jalna.gov.in` / `Jalna@PA2026`

> **Note on AI classification:** by default `GEMINI_API_KEY` in `.env` is
> blank, so applications register fine but need **manual** department
> assignment by the PA. Add a free key from
> [aistudio.google.com/apikey](https://aistudio.google.com/apikey) to
> `.env` and restart `npm run dev` to turn on automatic AI assignment.

> **Note on file uploads/letters:** in prototype mode (no
> `BLOB_READ_WRITE_TOKEN` set), uploaded applications and generated Marathi
> letters are saved locally to `public/uploads/` — fully working, no cloud
> account required. When you deploy to Vercel, set `BLOB_READ_WRITE_TOKEN`
> and it automatically switches to Vercel Blob storage instead.

## Features
- Role-based accounts: Collector, PA, Department Officers (self-registration + approval workflow)
- Public visitor registration counter with auto-generated token numbers (`JLN/YYYYMMDD/NNNN`)
- Taluka/District dropdowns (Jalna's 8 talukas + "Other" for out-of-district visitors)
- PDF/Image application upload
- Public "Track Application" page (token + optional mobile verification)
- AI-based auto-classification & department assignment (**Google Gemini — free tier**)
- Manual re-assignment by PA/Collector at any time
- Auto-generated Marathi forwarding letter on Collector Office letterhead (PDF)
- Department dashboard: view assigned applications, update status
  (Pending / Assigned / In Progress / Partially Resolved / Resolved / Closed / Rejected)
- PA/Collector dashboard: all visitors, daily Excel/PDF export (with visit-count &
  last-assigned-department columns), charts, staff approval queue
- No Supabase / Firebase — SQLite for local prototyping, upgrades to free-tier
  Neon (Postgres) + Vercel (hosting + Blob storage) + Gmail SMTP for production

## Tech Stack
- Next.js 14 (App Router, TypeScript, Tailwind CSS v4)
- Prisma ORM — SQLite (prototype) / Neon Postgres (production)
- NextAuth v5 (credentials/JWT)
- Google Gemini API — free tier (application classification)
- pdf-lib + Noto Sans Devanagari (Marathi PDF letters)
- ExcelJS (report exports)
- Local disk (prototype) / Vercel Blob (production) file storage

## Moving to Production
See `DEPLOYMENT_GUIDE.md` for the full free-hosting deployment steps
(GitHub → Neon → Vercel → Gmail → Gemini), and `USER_GUIDE_MARATHI.html`
for a Marathi day-to-day usage guide with screenshots.
