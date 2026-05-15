# Artivo — Frontend

> The customer and artisan-facing web app for Artivo — an AI-powered marketplace connecting informal workers to jobs and financial services across Nigeria.
> Built for the **Squad Hackathon** — *"Design an intelligent economic system that connects informal traders, job seekers, and financial services in one ecosystem."*

---

## What Artivo Does

Most skilled workers in Nigeria — plumbers, electricians, tailors, barbers, mechanics — have no digital presence and no way to accept payments safely. Customers have no reliable way to find them. Artivo fixes both sides at once.

A worker speaks for 30 seconds. AI builds their profile. They start receiving job leads, getting paid through escrow, and accumulating a real credit score — built entirely from work history, not a bank statement.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Auth | Supabase Auth |
| UI Components | shadcn/ui |

---

## Getting Started

```bash
git clone <repo>
cd artivo-fe
npm install
cp .env.local.example .env.local
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_APP_SERVER_URL=https://your-backend.com/api
NEXT_PUBLIC_DEV_SERVER_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## How the App Works

### For Artisans (Workers)

#### Sign Up + Voice Onboarding
The worker registers and is taken straight to an onboarding screen. They tap a button and speak:

> *"My name is Amina, I'm an electrician based in Abuja. Six years' experience. I usually charge between ₦10,000 and ₦25,000 depending on the job."*

The AI transcribes the audio, pulls out the name, trade, location, and rate, and pre-fills a review screen. Amina checks the fields, edits anything that's off, and confirms. Profile is live. No forms filled.

#### Browse Jobs + Apply
The dashboard shows open jobs from customers in their subscribed categories. Workers submit a proposal with a price range — minimum and maximum — not a fixed quote.

#### Get Hired + Get Paid
When a customer hires them, the job moves to `in_progress` and funds are locked in escrow. Both parties mark the job complete when it's done. Once both sides confirm, escrow releases and the payment hits the worker's registered bank account automatically via Squad.

#### Add a Bank Account
Workers register the bank account they want paid into from the dashboard. Before saving it, the backend verifies the account number with Squad's lookup API so there are no surprises when a real payout comes through.

#### Build a Financial Identity
Every completed job and every customer rating feeds into the worker's reputation score and credit score — a financial profile built from real work, visible to banks and lending institutions through an API.

---

### For Customers

#### Sign Up + Virtual Account
When a customer completes onboarding, Squad automatically creates a dedicated Nigerian virtual bank account for them. This is a real account number — any bank transfer to it lands in their Artivo wallet in real time. No manual top-up flow, no payment link needed.

#### Fund the Wallet
The customer transfers money to their virtual account from any Nigerian bank. Squad fires a webhook when it arrives, and their wallet balance updates immediately. They can see the full deposit history in the app.

#### Post a Job by Voice or Text
From the dashboard, a customer taps "Post a Job" and speaks:

> *"I need a plumber to fix a burst pipe in my kitchen in Lekki Phase 1. Budget around ₦15,000."*

The AI extracts the details into a structured job post. They review and confirm — the job is live and visible to subscribed artisans.

#### Review Proposals + AI Suggestions
When proposals arrive, the customer sees each artisan's name, price range, and a link to their public profile. At the top, the AI surfaces the top 5 recommended artisans with a match score out of 100 and a plain-English explanation of why each fits the job. Proposals and AI suggestions load independently — proposals appear immediately, AI suggestions don't block them.

#### Hire with Escrow Protection
Tapping **Hire** on a proposal deducts the amount from the wallet, locks it in escrow, and starts the job. Neither party can touch the money until both confirm completion.

#### Approve Advance Payments
If a worker needs part of the payment mid-job — to buy materials, for example — they can request an advance. The customer sees the request in the dashboard and can approve it. On approval, Squad pays the advance out to the worker's bank account immediately.

---

## Squad Integration — What the UI Exposes

Squad is not a payment plugin here — it's the financial infrastructure the whole app is built on. Here's where that shows up in the UI:

| Screen | What's happening with Squad |
|---|---|
| Customer onboarding complete | Virtual account created — customer sees their unique account number and bank name |
| Wallet / Account screen | Live balance and deposit history pulled from Squad |
| Hire dialog | Escrow funded — amount locked, both parties see the terms before confirming |
| Job completion (both sides confirm) | Squad payout fires automatically to the worker's bank |
| Advance request approval | Squad payout fires immediately, partial escrow released |
| Worker profile setup | Bank account verified via Squad lookup before saving |

---

## Key Screens

### Dashboard
- **Workers** — active jobs, total earned, completion rate, credit score (visual trust dial), recent earnings
- **Customers** — active jobs, total spent, completed jobs, wallet balance, open job posts with proposal counts

### Marketplace (`/marketplace`)
A searchable directory of artisans. Typing a natural-language query like *"fix my AC in Lekki"* triggers the full AI matching pipeline — relevant artisans float to the top with an **AI‑ranked** badge and match explanations on their cards.

### Job Creation (`/dashboard/jobs/new`)
Voice or text. Voice uses the browser microphone with Opus codec compression (mp4 on Safari). Text stays in the box after submission — so the user can reference or tweak it without retyping. AI extracts a full structured job post either way.

### Job Proposals (`/dashboard/jobs`)
Each job post shows proposals and AI-suggested artisans side by side. Proposals load immediately. AI suggestions load independently and are cached per job — reopening the same job is instant.

### Artisan Profile (`/artisan/:slug`)
Public-facing profile page — sharable, shows bio, skills, location, ratings, completed jobs. Has a back button for in-app navigation. Linked from both proposals and AI match cards.

---

## Project Structure

```
app/
├── (auth)/                      # Login, register
├── dashboard/
│   ├── page.tsx                 # Dashboard (worker or customer view based on role)
│   ├── jobs/
│   │   ├── page.tsx             # Job list + proposals + AI suggestions
│   │   └── new/page.tsx         # AI job creation (voice + text)
│   └── profile/                 # Profile editing
├── marketplace/
│   └── page.tsx                 # Artisan discovery + AI search
├── artisan/[username]/
│   └── page.tsx                 # Public artisan profile
└── onboarding/
    ├── customer/page.tsx        # Customer voice/text onboarding
    └── worker/page.tsx          # Worker voice/text onboarding

components/
├── customer/
│   ├── JobProposalsView.tsx     # Proposals + AI suggestions + hire dialog
│   └── HirePaymentDialog.tsx    # Escrow hire confirmation
├── worker/
│   ├── WorkerJobFeed.tsx        # Available jobs + apply with price range
│   └── WorkerApplicationsView.tsx
└── marketplace/
    ├── WorkerCard.tsx           # Artisan card (with AI explanation when ranked)
    └── MarketplaceFilters.tsx

store/                           # Zustand — one store per domain
api/
├── api-service.ts               # Fetch wrapper (JWT, FormData, auto token refresh)
├── types/                       # TypeScript types for all API shapes
└── mappers/                     # Transform backend responses to frontend models
```

---

## Design Decisions

**Voice-first, text fallback.** The primary input for onboarding and job creation is voice. Typing is available and always accessible, but voice is default — because many informal workers are more comfortable speaking than filling out forms. If the browser doesn't support recording, the app falls back to text gracefully with a clear explanation.

**AI suggestions are non-blocking.** On the proposals page, proposals load and display immediately. AI match suggestions load in the background and are cached — they never delay what the user came to see.

**Escrow transparency.** The hire dialog shows the full amount being held, explains the escrow model, and states what triggers release — both parties know exactly what they're agreeing to.

**Role-aware, one codebase.** The app detects whether the user is a `worker` or `customer` and renders the correct dashboard, stats, navigation, and flows. No separate apps to maintain.

---

## Addressing the Problem Statement

| Requirement | How the Frontend Delivers It |
|---|---|
| Onboard informal workers digitally | Voice onboarding removes the literacy and form-filling barrier |
| Match workers to opportunities using AI | AI suggestions on every job post + AI-ranked marketplace search |
| Build financial identity without credit history | Reputation score and credit score on the worker dashboard, built from job history |
| Accessible on basic smartphones | Mobile-first, voice-first, minimal UI |
| Demonstrate Squad as the financial layer | Virtual account display, wallet balance, escrow hire flow, advance requests — all visible and explained in the UI |
