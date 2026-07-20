# Deployment Guide — Visitor Management System, Jalna Collector Office

This guide covers two things:
1. **Running the prototype locally** (5 minutes, zero cloud accounts) — good for demoing to the Collector/PA before going live.
2. **Deploying to production for free**: GitHub (code), Neon (database), Vercel (hosting + file storage), Gmail (email), and Google Gemini (AI classification). No Supabase, no Firebase, no credit card required for the core stack.

---

## Part A — Run the prototype locally (5 minutes)

```bash
npm install
npm run setup     # creates prisma/dev.db (SQLite), tables, and seed data
npm run dev
```

Open http://localhost:3000. The homepage is the visitor registration
counter; `/track` is the public status page; `/login` is staff login
(seeded Collector/PA accounts are in `README.md`). Uploaded files and
generated letters are saved to `public/uploads/` automatically — nothing
else to configure.

To turn on AI auto-classification, get a **free** key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey), paste it
into `.env` as `GEMINI_API_KEY=...`, and restart `npm run dev`.

This local/SQLite setup is meant for **demoing and testing** — for the real
office rollout (multiple staff logging in from different computers, data
that must survive redeployments), follow Part B below.

---

## Part B — Deploy to production (free hosting)

Total time: ~45-60 minutes for first-time setup. After that, it runs itself.

### Overview of accounts you will create (all free)

| Service | Purpose | Cost |
|---|---|---|
| GitHub | Stores your code, triggers deployments | Free |
| Neon.tech | PostgreSQL database | Free tier (0.5 GB storage, enough for years of visitor records) |
| Vercel | Hosts the website + serverless functions + file storage (Blob) | Free "Hobby" tier |
| Gmail | Sends password-reset emails | Free (uses an App Password, not your real password) |
| Google AI Studio | Powers the AI department-classification (Gemini) | Free tier — generous daily quota, no card needed |

---

### Step 0 — Switch from SQLite to Postgres

The prototype ships with SQLite for easy local testing. Before deploying to
production, switch the database provider:

1. Open `prisma/schema.prisma`.
2. Change:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   to:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```
3. That's the only required change — all the `String` fields used in place
   of enums work identically on Postgres, so nothing else needs editing.

---

### Step 1 — Push the code to GitHub

1. Install [Git](https://git-scm.com/) and [Node.js 20+](https://nodejs.org/) if you don't have them.
2. Create a **new empty repository** on [github.com/new](https://github.com/new) — name it `vms-jalna`, keep it **Private**.
3. In a terminal, inside the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - VMS Jalna"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/vms-jalna.git
   git push -u origin main
   ```

---

### Step 2 — Create a free Neon Postgres database

1. Go to [neon.tech](https://neon.tech) → Sign up (free, GitHub login works).
2. Click **New Project** → name it `vms-jalna` → region: pick the one closest to India (e.g. Singapore/Mumbai if offered).
3. On the project dashboard, click **Connect** → copy the **connection string** (it looks like `postgresql://user:pass@ep-xxxx.neon.tech/dbname?sslmode=require`).
4. Neon gives you two useful strings — a **pooled** connection (for `DATABASE_URL`) and a **direct** connection (for `DIRECT_URL`, used only during migrations). Copy both; if Neon only shows one, use the same value for both.

---

### Step 3 — Create a Vercel project

1. Go to [vercel.com](https://vercel.com) → Sign up with your GitHub account.
2. Click **Add New → Project** → import your `vms-jalna` GitHub repository.
3. Framework preset: Vercel auto-detects **Next.js**. Leave build settings as default.
4. **Before clicking Deploy**, open the "Environment Variables" section and add the variables from Step 4 below.

---

### Step 4 — Environment variables

Add these in Vercel (Project → Settings → Environment Variables), and also keep a local `.env` copy for your own machine:

```bash
DATABASE_URL="<Neon pooled connection string>"
DIRECT_URL="<Neon direct connection string>"

NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
NEXTAUTH_URL="https://your-project-name.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-project-name.vercel.app"

GEMINI_API_KEY="<from aistudio.google.com/apikey>"

GMAIL_USER="youroffice@gmail.com"
GMAIL_APP_PASSWORD="<16-character App Password, see Step 5>"

BLOB_READ_WRITE_TOKEN="<created automatically in Step 6>"
```

To generate `NEXTAUTH_SECRET` on Windows without openssl, use any online
"random 32 character string" generator, or run this in the browser console:
`crypto.randomUUID() + crypto.randomUUID()`.

---

### Step 5 — Gmail App Password (free email sending)

1. Use (or create) a Gmail account for the office, e.g. `jalnacollectorvms@gmail.com`.
2. Turn on **2-Step Verification**: Google Account → Security → 2-Step Verification.
3. Go to **Google Account → Security → App Passwords** (search "App Passwords" in the account search bar if you don't see it directly).
4. Create an app password for "Mail" / "Other (Custom name)" → name it `VMS Jalna`.
5. Copy the 16-character password shown — this goes into `GMAIL_APP_PASSWORD`. (Your normal Gmail password does NOT go anywhere in this system.)

---

### Step 6 — Vercel Blob storage (for uploaded PDFs/images and letters)

1. In your Vercel project → **Storage** tab → **Create Database** → choose **Blob**.
2. Name it `vms-jalna-files` → Create.
3. Vercel automatically creates a `BLOB_READ_WRITE_TOKEN` and can auto-link it to your project's environment variables — accept that, or copy the token manually into Step 4's variable.

---

### Step 7 — Google Gemini API key (free AI department classification)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → sign in with any Google account.
2. Click **Create API Key** → copy it into `GEMINI_API_KEY`. No payment details needed for the free tier, which comfortably covers typical district-office visitor volumes.
3. If you skip this step entirely, leave `GEMINI_API_KEY` blank — the system still works, but every application will need **manual** department assignment by the PA instead of automatic AI assignment.

---

### Step 8 — Deploy

1. Back in Vercel, click **Deploy**. First deploy takes 2-3 minutes.
2. Once deployed, open the live URL Vercel gives you (e.g. `https://vms-jalna.vercel.app`).
3. Go back to Environment Variables and make sure `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` exactly match this live URL (with `https://`, no trailing slash), then **redeploy** (Deployments tab → ... → Redeploy) so the change takes effect.

---

### Step 9 — Set up the database tables and seed data

You need to run this **once**, from your own computer (it connects to Neon directly):

```bash
cd vms-jalna
npm install
# create a local .env with the same DATABASE_URL / DIRECT_URL as Vercel
npx prisma db push
npm run db:seed
```

This creates all tables, plus:
- 17 default departments (Revenue, Agriculture, PWD, Health, etc. — edit `src/lib/masterData.ts` and re-run to customize)
- Jalna's 8 talukas + Maharashtra district list
- Two starter logins:
  - Collector: `collector@jalna.gov.in` / `Jalna@Collector2026`
  - PA: `pa@jalna.gov.in` / `Jalna@PA2026`

**Log in immediately and change both passwords** (there isn't yet a "change password" screen in this MVP — easiest is to use "Forgot Password" from the login page to reset them via email).

---

### Step 10 — Onboard department officers

Each department officer visits your live site → **Staff Login → New Staff
Registration** → selects their department → registers. Their account stays
inactive until the PA or Collector approves it from **Dashboard → Staff
Approvals**.

---

## Day-to-day operation (fully automated, no maintenance)

- The **counter operator** (PA or a clerk) opens the homepage, fills the
  visitor's details, uploads their application if any, and hands them the
  printed/shown token number.
- The **AI** silently classifies and assigns a department within a few
  seconds of registration — no one needs to do anything.
- The **PA** can review/correct any assignment any time from Dashboard → Visitors.
- The **department officer** logs in, sees only their assigned applications,
  and updates status as work progresses.
- The **visitor** checks `yoursite.vercel.app/track` any time with their
  token number.
- At day's end, the PA clicks **Excel** or **PDF** on the Visitors tab to
  download that day's full report.

No servers to restart, no database backups to run manually (Neon backs up
automatically on the free tier), no scheduled jobs required.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| "Invalid email/password" on login for a new department officer | Account not yet approved | PA/Collector: Dashboard → Staff Approvals → Approve |
| AI doesn't assign a department | `GEMINI_API_KEY` missing/invalid, or free quota exhausted for the day | Check the key in Vercel env vars; assign manually meanwhile |
| Password reset email never arrives | Gmail App Password wrong, or 2FA not enabled on that Gmail account | Redo Step 5 |
| File upload fails | Blob token missing, or file > 8 MB | Re-check Step 6; ask visitor for a smaller file |
| Marathi text looks like boxes/garbled in the letter PDF | Should not happen — the Devanagari font is bundled in `src/assets/`. If it does, confirm `src/assets/*.ttf` were included in your GitHub push (check they're not excluded by `.gitignore`) |
| First `npx prisma generate` seems to hang or needs internet | Normal — Prisma downloads a small one-time engine binary on first run. Just needs a working internet connection; no action needed after that. |

---

## Extending the system later
- Add SMS notifications: [Fast2SMS](https://www.fast2sms.com) has a free trial credit; wire it into a `src/lib/mailer.ts`-style module and call it wherever `sendMail` is called.
- Multi-district reuse: everything Jalna-specific lives in `src/lib/masterData.ts` — change the district name, talukas, and department list to redeploy for any other district.
- Custom domain: Vercel → Project → Settings → Domains → add e.g. `vms.jalna.gov.in` (needs your NIC/domain DNS access) — free on Vercel's side.

