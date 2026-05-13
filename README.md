# Artivo

**AI-Powered Marketplace for Gig Workers & Artisans in Africa**

Build your digital identity. Get matched to jobs with AI. Access financial services without traditional credit history.

## Features

- **Digital Identity** - Professional profiles for artisans and gig workers
- **AI Job Matching** - Smart matching based on skills, location, and availability
- **Trust & Reputation** - Score-based system built on job completion and reviews
- **Alternative Credit Scoring** - Access financial services based on work history
- **Marketplace** - Browse and hire verified artisans by category
- **Secure Payments** - Mobile money and bank transfer integration

## Tech Stack

- [Next.js 15](https://nextjs.org) - React framework with App Router
- [TypeScript](https://typescriptlang.org) - Type safety
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Framer Motion](https://framer.com/motion) - Animations
- [Zustand](https://zustand-demo.pmnd.rs) - State management
- [Supabase](https://supabase.com) - Authentication & database

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/artivo-frontend.git
cd artivo-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
artivo-frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # User dashboards (worker/customer)
│   ├── marketplace/       # Browse artisans
│   ├── artisan/          # Public artisan profiles
│   └── onboarding/       # User onboarding flows
├── api/types/             # TypeScript type definitions
├── components/            # Reusable UI components
├── lib/                   # Utilities and constants
├── store/                 # Zustand state management
└── public/               # Static assets
```

## User Types

- **Workers/Artisans** - Skilled professionals offering services
- **Customers** - Users seeking services
- **Businesses** - Companies accessing worker data via API

## License

Copyright 2024 Artivo. All rights reserved.
