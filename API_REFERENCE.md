# Artivo Frontend — API Reference & MVP Task Plan

**Base URL:** `http://localhost:8080/api/v1`  
**Auth:** All endpoints (except Auth & Public) require `Authorization: Bearer <token>`

---

## Table of Contents

1. [MVP Pages](#mvp-pages)
2. [Task List](#task-list)
3. [API by Page](#api-by-page)
4. [Error Handling](#error-handling)
5. [Payment Integration (Squad)](#payment-integration-squad)
6. [Dev Environment](#dev-environment)

---

## MVP Pages

| # | Route | Purpose |
|---|-------|---------|
| 1 | `/` | Landing page |
| 2 | `/login` | User login |
| 3 | `/register` | Sign up (combined with profile) |
| 4 | `/onboarding/worker` | AI voice onboarding (differentiator) |
| 5 | `/onboarding/customer` | Quick customer setup |
| 6 | `/marketplace` | Browse/search artisans (feed) |
| 7 | `/artisan/[username]` | Public profile + Hire + Payment modal |
| 8 | `/dashboard` | Overview — active jobs, quick stats |
| 9 | `/dashboard/jobs/[id]` | Job detail — stages, complete, rate |
| 10 | `/dashboard/payments` | Payment history + virtual account |
| 11 | `/dashboard/reputation` | Score + badges |

### Pages Scrapped for MVP

- `/forgot-password` — not needed for demo
- `/dashboard/settings/*` (all 7 pages) — zero demo value
- `/dashboard/credit` — not core to hire→pay→rate loop
- `/onboarding/*/complete` — just redirect to dashboard

---

## Task List

### Marketplace UI — Customer APIs

| # | Task | API Endpoint |
|---|------|--------------|
| 1 | Fetch marketplace feed | `GET /customer/feed` |
| 2 | Post a job request | `POST /customer/request-job` |
| 3 | Hire an artisan (pick + pay) | `POST /customer/hire` |
| 4 | Log payment after Squad | `POST /customer/payment` |
| 5 | Mark job complete | `POST /customer/complete-job/:job_id` |
| 6 | Rate an artisan | `POST /customer/rate` |

### Marketplace UI — Artisan APIs

| # | Task | API Endpoint |
|---|------|--------------|
| 7 | Subscribe to job type | `POST /worker/subscribe` |
| 8 | Get real-time jobs (SSE) | `GET /worker/jobs/stream` |
| 9 | Accept a job | `POST /worker/accept-job` |
| 10 | Mark job complete | `POST /worker/complete-job/:job_id` |
| 11 | Rate customer | `POST /worker/rate-customer` |

### AI Onboarding

| # | Task | Details |
|---|------|---------|
| 12 | Real-time transcription display | Show AI transcription back to user |
| 13 | Single-prompt input | "Describe yourself" — name, services, pay, experience |
| 14 | Confirmation step | Show parsed fields, user confirms |
| 15 | Field-level correction | Tap a field to re-state |
| 16 | Submit & persist | Save to DB on confirmation |

### Payment Integration

| # | Task | Details |
|---|------|---------|
| 17 | Payment modal (Squad) | Build modal using Squad SDK |
| 18 | Virtual account display | Show account info (don't create from FE) |

### Outstanding / Shared

| # | Task | Details |
|---|------|---------|
| 19 | Signup → shareable public profile link | Full registration to public URL flow |
| 20 | Business card creation form | Digital business card for artisans |
| 21 | End-to-end marketplace test | Discovery → hire → rating flow |

---

## API by Page

### 1. Login (`/login`)

```
POST /auth/login
Body: { "email": "user@example.com", "password": "Password@1234" }
Response: { "accessToken": "eyJ..." }
```

```
POST /auth/login/mfa
Body: { "email": "user@example.com" }
Response: { "mfa": false }
```

---

### 2. Register (`/register`)

```
POST /auth/sign-up
Body: {
  "email": "user@example.com",
  "password": "Password@1234",
  "firstName": "John",
  "lastName": "Doe",
  "role": "worker",  // or "customer"
  "tos": true
}
Response: { "accessToken": "eyJ..." }
```

```
POST /auth/verify-email-manual
Body: { "email": "user@example.com" }
Response: { "verified": true, "id": "uuid", "virtual_account": { ... } }
```

```
GET /auth/verify-email/:emailVerificationKey
Response: { "verified": true, "id": "uuid" }
```

---

### 3. AI Onboarding — Worker (`/onboarding/worker`)

```
POST /ai/onboard/voice
Body: {
  "audioData": "base64_encoded_audio",
  "userType": "artisan"
}
Response: {
  "message": true,
  "data": {
    "fullName": "John Doe",
    "skills": ["plumbing", "pipe fitting"],
    "bio": "10 years experience...",
    "experience": "10 years",
    "avgPay": "15000",
    "location": "Lagos"
  }
}
```

```
POST /ai/onboard/text
Body: {
  "text": "My name is John, I do plumbing...",
  "userType": "artisan",
  "context": []  // previous conversation
}
Response: { "success": true, "data": { ... } }
```

```
POST /user
Body: { "fullName": "John Doe", "phone": "08012345678" }
Response: { updated user object }
```

---

### 4. AI Onboarding — Customer (`/onboarding/customer`)

```
POST /ai/onboard/text
Body: {
  "text": "I need a plumber in Lagos...",
  "userType": "customer",
  "context": []
}
Response: { "success": true, "data": { ... } }
```

```
POST /user
Body: { "fullName": "Jane Smith", "phone": "08098765432" }
Response: { updated user object }
```

---

### 5. Marketplace (`/marketplace`)

```
GET /customer/feed?location=Lagos&job_type_id=uuid&limit=20
Response: {
  "workers": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "display_name": "John the Plumber",
      "photo_url": "https://...",
      "bio": "10 years experience",
      "skills": ["plumbing", "pipe fitting"],
      "location": "Lagos",
      "credit_score": 85,
      "completion_rate": 95,
      "total_jobs": 20,
      "average_rating": 4.5,
      "match_score": 0.87,
      "match_explanation": "..."
    }
  ]
}
```

```
GET /matching/job-types
Response: [
  { "id": "uuid", "name": "Plumbing", "description": "..." },
  { "id": "uuid", "name": "Electrical", "description": "..." }
]
```

---

### 6. Artisan Profile + Hire (`/artisan/[username]`)

```
GET /profile/:slug
Response: {
  "worker": {
    "id": "uuid",
    "full_name": "John Doe",
    "bio": "...",
    "skills": [...],
    "credit_score": 85,
    "completion_rate": 95,
    "total_jobs": 20,
    "average_rating": 4.5
  }
}
```

```
POST /customer/request-job
Body: {
  "job_type_id": "uuid",
  "title": "Fix leaking sink",
  "description": "Urgent repair needed in kitchen",
  "location": "Lagos, Ikeja",
  "budget": 15000
}
Response: {
  "job_request": {
    "id": "uuid",
    "status": "open",
    "created_at": "2026-05-12T..."
  }
}
```

```
POST /customer/hire
Body: {
  "job_request_id": "uuid",
  "worker_id": "uuid",
  "amount": 15000
}
Response: {
  "job": {
    "id": "uuid",
    "status": "pending",
    "created_at": "2026-05-12T..."
  }
}
```

```
POST /customer/payment
Body: {
  "job_id": "uuid",
  "squad_transaction_id": "SQ_12345",
  "amount": 15000,
  "status": "success"
}
Response: {
  "payment_log": {
    "id": "uuid",
    "squad_transaction_id": "SQ_12345",
    "amount": 15000,
    "status": "success"
  }
}
```

---

### 7. Dashboard (`/dashboard`)

```
GET /user
Response: { id, email, fullName, role, emailVerified, ... }
```

```
GET /customer/my-jobs
Response: { "jobs": [...] }
```

```
GET /customer/my-job-requests
Response: { "job_requests": [...] }
```

```
GET /worker/my-jobs        (if role === "worker")
Response: { "jobs": [...] }
```

```
GET /worker/subscriptions  (if role === "worker")
Response: { "subscriptions": [...] }
```

---

### 8. Job Detail (`/dashboard/jobs/[id]`)

**Complete Job (both sides must confirm):**

```
POST /customer/complete-job/:job_id
Response: { "success": true, "msg": "Job marked as completed" }
```

```
POST /worker/complete-job/:job_id
Response: { "success": true, "msg": "Job marked as in progress. Waiting for customer confirmation." }
```

**Rate (after completion):**

```
POST /customer/rate
Body: { "job_id": "uuid", "rating": 5, "comment": "Excellent work!" }
Response: { "review": { ... }, "msg": "Rating submitted successfully" }
```

```
POST /worker/rate-customer
Body: { "job_id": "uuid", "rating": 5, "comment": "Great customer!" }
Response: { "review": { ... }, "msg": "Customer rated successfully" }
```

---

### 9. Payments (`/dashboard/payments`)

```
GET /user/virtual-account
Response: {
  "virtual_account": {
    "virtual_account_number": "7834927713",
    "virtual_account_name": "John Doe",
    "bank_name": "GTCO",
    "bank_code": "058"
  }
}
```

---

### 10. Reputation (`/dashboard/reputation`)

Reputation data comes from the user/profile endpoints:

- `credit_score`: (Average rating × 20) = 0–100
- `completion_rate`: (Completed / Total) × 100
- `total_jobs`: Count of completed jobs
- `average_rating`: Mean of all ratings (1–5)

---

### 11. Artisan Job Discovery (Worker-specific)

```
POST /worker/subscribe
Body: { "job_type_id": "uuid" }
Response: { "subscription": { ... }, "msg": "Successfully subscribed" }
```

```
POST /worker/unsubscribe
Body: { "job_type_id": "uuid" }
Response: { "success": true, "msg": "Successfully unsubscribed" }
```

```
GET /worker/jobs
Response: { "jobs": [...] }
```

```
GET /worker/jobs/stream   (SSE — Server-Sent Events)
Events:
  data: {"type":"connected","message":"Connected to job stream"}
  data: {"type":"jobs","data":[...]}
```

```
POST /worker/accept-job
Body: { "job_request_id": "uuid", "proposed_amount": 15000 }
Response: { "job": { ... }, "msg": "Job accepted successfully" }
```

---

## Error Handling

All errors follow this format:

```json
{
  "msg": "Error message here",
  "code": 400
}
```

Validation errors include field details:

```json
{
  "msg": "Validation error",
  "code": 422,
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Not found |
| 409 | Conflict (duplicate record) |
| 422 | Validation error |
| 500 | Server error |

---

## Payment Integration (Squad)

### Flow

1. Customer hires worker → `POST /customer/hire`
2. Show Squad payment modal (client-side)
3. On success → `POST /customer/payment` to log transaction
4. Backend updates job status to "paid"

### Frontend Squad Modal

```typescript
import { SquadPay } from '@squadco/squad-modal';

SquadPay({
  key: process.env.NEXT_PUBLIC_SQUAD_PUBLIC_KEY, // 'sandbox_pk_...'
  email: customer.email,
  amount: amountInNaira * 100, // Squad expects kobo
  currency: 'NGN',
  onSuccess: (response) => {
    // Log payment to backend
    await fetch('/api/v1/customer/payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_id: jobId,
        squad_transaction_id: response.transaction_ref,
        amount: amountInNaira,
        status: 'success'
      })
    });
  },
  onClose: () => {
    // User closed modal without paying
  }
});
```

### Environment Variable

```env
NEXT_PUBLIC_SQUAD_PUBLIC_KEY=sandbox_pk_...
```

### Important Notes

- Do NOT create virtual accounts from the frontend — that's backend only
- Virtual accounts are auto-created after email verification
- Use `GET /user/virtual-account` to display account details

---

## Dev Environment

### Backend

```bash
cd /Users/petemz/Downloads/artivo-be
npm install
npm start
```

- No DB migrations needed (Supabase schema is up to date)
- Runs on `http://localhost:8080`
- API base: `http://localhost:8080/api/v1`

### Frontend

```bash
cd /Users/petemz/Downloads/artivo-frontend
npm run dev
```

- Runs on `http://localhost:3000`

### Environment Variables (Backend .env)

```env
NODE_ENV="development"
PORT=8080
BACKEND_URL="http://localhost:8080/api/v1"
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="artivo-super-secret-key-change-in-production-2026"
DB_DIALECT="postgres"
DB_HOST="aws-0-eu-west-1.pooler.supabase.com"
DB_PORT="5432"
DB_USERNAME="postgres.unrdomjmthytkkdvfvxj"
DB_PASSWORD="4o1WLpinUKy5jvqa"
DB_DATABASE="postgres"
```

### Reference Docs (in backend root)

- `MARKETPLACE_API.md` — Full marketplace endpoint docs
- `SQUAD_INTEGRATION.md` — Payment integration guide
- `OpenApiSpec.yml` — OpenAPI spec

---

## Demo Flow (for Hackathon Judges)

1. **AI Onboarding** → Artisan signs up, speaks into mic, AI transcribes, confirm & submit
2. **Marketplace** → Customer browses, finds the artisan
3. **Hire & Pay** → Clicks hire, Squad payment modal, money moves
4. **Job Completion** → Both sides mark done
5. **Rating** → Mutual review, reputation score updates live

---

## AI Matching Algorithm

When browsing with `job_type_id` parameter:

- **70% Traditional:** Skills match, location proximity, reputation
- **30% AI Semantic:** LLM analyzes job description vs artisan profiles

Result: Workers ranked by combined score with AI-generated explanation.
