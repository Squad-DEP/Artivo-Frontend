export const BRAND = {
  name: "Artivo",
  tagline: "Your skills deserve recognition",
  description: "AI-powered marketplace for gig workers and artisans",
  fullDescription:
    "Build your digital identity, get matched to jobs with AI, and access financial services. Artivo empowers artisans and gig workers across Africa.",
  email: "hello@artivo.africa",
  website: "https://artivo.africa",
  social: {
    twitter: "https://twitter.com/artivoafrica",
    instagram: "https://instagram.com/artivoafrica",
    linkedin: "https://linkedin.com/company/artivo",
  },
} as const;

export const HERO_CONTENT = {
  headline: {
    line1: "Your skills",
    line2: "deserve",
    line3: "recognition",
  },
  subheadline:
    "Build your digital identity. Get matched to jobs with AI. Access financial services without traditional credit history.",
  cta: {
    primary: "I'm an artisan",
    secondary: "I need services",
    learn: "How it works",
  },
  labels: {
    workers: "ARTISANS",
    customers: "CUSTOMERS",
  },
} as const;

export const VALUE_PROPS = {
  forWorkers: [
    {
      title: "Digital Identity",
      description: "Create a professional profile that showcases your skills, experience, and past work.",
    },
    {
      title: "AI Job Matching",
      description: "Get matched to relevant jobs based on your skills, location, and availability.",
    },
    {
      title: "Build Trust",
      description: "Earn reputation through completed jobs, reviews, and verification badges.",
    },
    {
      title: "Financial Access",
      description: "Access savings, insurance, and credit based on your work history, not traditional credit.",
    },
  ],
  forCustomers: [
    {
      title: "Find Skilled Workers",
      description: "Browse verified artisans by category, location, and ratings.",
    },
    {
      title: "AI Recommendations",
      description: "Get smart suggestions for the best workers for your specific needs.",
    },
    {
      title: "Trust & Safety",
      description: "Every worker has a trust score based on real job completion and reviews.",
    },
    {
      title: "Secure Payments",
      description: "Pay securely through the platform with trusted payment processing.",
    },
  ],
} as const;

export const STATS = {
  workers: "50,000+",
  workersLabel: "Skilled Artisans",
  jobs: "120,000+",
  jobsLabel: "Jobs Completed",
  countries: "5",
  countriesLabel: "African Countries",
  satisfaction: "98%",
  satisfactionLabel: "Customer Satisfaction",
} as const;

export const HOW_IT_WORKS = {
  forWorkers: [
    {
      step: 1,
      title: "Create Your Profile",
      description:
        "Tell us about your skills in plain language. Our AI helps you build a professional profile in minutes.",
    },
    {
      step: 2,
      title: "Get Verified",
      description:
        "Complete identity verification to earn trust badges and stand out to potential customers.",
    },
    {
      step: 3,
      title: "Get Matched",
      description:
        "Receive job matches based on your skills, location, and availability. Accept jobs that fit your schedule.",
    },
    {
      step: 4,
      title: "Get Paid & Build Credit",
      description:
        "Complete jobs, receive secure payments, and build your alternative credit score for financial services.",
    },
  ],
  forCustomers: [
    {
      step: 1,
      title: "Describe Your Need",
      description: "Tell us what service you need. Our AI understands and finds the right professionals.",
    },
    {
      step: 2,
      title: "Review Matches",
      description: "Browse recommended artisans with trust scores, portfolios, and verified reviews.",
    },
    {
      step: 3,
      title: "Book & Pay Securely",
      description: "Book the artisan and pay through our secure payment system.",
    },
    {
      step: 4,
      title: "Rate & Review",
      description: "After the job is done, leave a review to help other customers and boost the worker's reputation.",
    },
  ],
} as const;

export const FAQ_ITEMS = [
  {
    question: "What is Artivo?",
    answer:
      "Artivo is an AI-powered marketplace that connects skilled artisans and gig workers with customers who need their services. We help workers build digital identities, get matched to jobs, and access financial services based on their work history.",
  },
  {
    question: "How does the trust score work?",
    answer:
      "Your trust score is calculated based on job completion rate, customer reviews, response time, verification status, and time on the platform. A higher score helps you get more jobs and access better financial services.",
  },
  {
    question: "What is alternative credit scoring?",
    answer:
      "Traditional credit scores require bank accounts and credit history that many workers don't have. Artivo's alternative credit score is based on your job history, earnings consistency, and trust score, helping you access loans, savings products, and insurance.",
  },
  {
    question: "How do payments work?",
    answer:
      "Customers pay through mobile money or bank transfer. Payments are processed securely through the platform, ensuring workers get paid for completed work and customers only pay for satisfactory service.",
  },
  {
    question: "Is Artivo free for workers?",
    answer:
      "Creating a profile and getting matched to jobs is free. We only charge a small service fee when you successfully complete a paid job. Premium features like highlighted profiles are optional.",
  },
  {
    question: "What categories of workers are on Artivo?",
    answer:
      "We support all types of skilled workers including electricians, plumbers, carpenters, tailors, barbers, beauticians, photographers, drivers, delivery personnel, phone repair technicians, caterers, and many more.",
  },
  {
    question: "How do I get verified?",
    answer:
      "Complete your profile, upload a valid ID, and optionally add proof of qualifications. Our team reviews submissions within 24-48 hours. Verified workers get a trust badge and appear higher in search results.",
  },
  {
    question: "Which countries is Artivo available in?",
    answer:
      "Artivo is currently available in Nigeria, Ghana, Kenya, South Africa, and Egypt. We're expanding to more African countries soon.",
  },
] as const;
