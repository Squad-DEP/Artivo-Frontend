export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "home-services",
    name: "Home Services",
    slug: "home-services",
    icon: "home",
    description: "Repairs, installations, and maintenance for your home",
    subcategories: [
      "Electrician",
      "Plumber",
      "Carpenter",
      "Painter",
      "Mason",
      "Welder",
      "HVAC Technician",
      "Tiler",
      "Roofer",
      "Locksmith",
    ],
  },
  {
    id: "personal-services",
    name: "Personal Services",
    slug: "personal-services",
    icon: "scissors",
    description: "Personal care and fashion services",
    subcategories: [
      "Tailor",
      "Barber",
      "Hairstylist",
      "Makeup Artist",
      "Nail Technician",
      "Spa & Massage",
      "Personal Trainer",
      "Fashion Designer",
    ],
  },
  {
    id: "tech-services",
    name: "Tech Services",
    slug: "tech-services",
    icon: "smartphone",
    description: "Technology repair and digital services",
    subcategories: [
      "Phone Repair",
      "Computer Repair",
      "TV & Electronics Repair",
      "Network Installation",
      "CCTV Installation",
      "Software Support",
      "Web Developer",
      "Graphic Designer",
    ],
  },
  {
    id: "transport-delivery",
    name: "Transport & Delivery",
    slug: "transport-delivery",
    icon: "truck",
    description: "Moving, driving, and delivery services",
    subcategories: [
      "Driver",
      "Delivery Rider",
      "Moving Services",
      "Dispatch Rider",
      "Logistics",
      "Courier",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    slug: "professional",
    icon: "briefcase",
    description: "Creative and business professional services",
    subcategories: [
      "Photographer",
      "Videographer",
      "Event Planner",
      "DJ & MC",
      "Interior Designer",
      "Architect",
      "Accountant",
      "Lawyer",
    ],
  },
  {
    id: "food-catering",
    name: "Food & Catering",
    slug: "food-catering",
    icon: "utensils",
    description: "Food preparation and catering services",
    subcategories: [
      "Caterer",
      "Chef",
      "Baker",
      "Event Catering",
      "Meal Prep",
      "Food Vendor",
    ],
  },
  {
    id: "cleaning-domestic",
    name: "Cleaning & Domestic",
    slug: "cleaning-domestic",
    icon: "sparkles",
    description: "Cleaning and household help",
    subcategories: [
      "House Cleaner",
      "Laundry Services",
      "Fumigation",
      "Gardener",
      "Housekeeper",
      "Nanny",
      "Elderly Care",
    ],
  },
  {
    id: "health-wellness",
    name: "Health & Wellness",
    slug: "health-wellness",
    icon: "heart",
    description: "Health, fitness, and wellness services",
    subcategories: [
      "Nurse",
      "Physiotherapist",
      "Fitness Trainer",
      "Yoga Instructor",
      "Nutritionist",
      "Traditional Healer",
    ],
  },
  {
    id: "education-tutoring",
    name: "Education & Tutoring",
    slug: "education-tutoring",
    icon: "graduation-cap",
    description: "Teaching and tutoring services",
    subcategories: [
      "Home Tutor",
      "Music Teacher",
      "Language Teacher",
      "Driving Instructor",
      "Skills Trainer",
    ],
  },
  {
    id: "automotive",
    name: "Automotive",
    slug: "automotive",
    icon: "car",
    description: "Vehicle repair and maintenance",
    subcategories: [
      "Mechanic",
      "Auto Electrician",
      "Panel Beater",
      "Car Wash",
      "Vulcanizer",
      "Auto Detailer",
    ],
  },
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  "home-services": "Home",
  "personal-services": "Scissors",
  "tech-services": "Smartphone",
  "transport-delivery": "Truck",
  professional: "Briefcase",
  "food-catering": "UtensilsCrossed",
  "cleaning-domestic": "Sparkles",
  "health-wellness": "Heart",
  "education-tutoring": "GraduationCap",
  automotive: "Car",
} as const;

export const POPULAR_SKILLS = [
  "Electrician",
  "Plumber",
  "Tailor",
  "Barber",
  "Phone Repair",
  "Carpenter",
  "Mechanic",
  "Photographer",
  "Caterer",
  "Driver",
  "Hairstylist",
  "Painter",
] as const;

export const getCategoryBySlug = (slug: string): ServiceCategory | undefined => {
  return SERVICE_CATEGORIES.find((cat) => cat.slug === slug);
};

export const getCategoryById = (id: string): ServiceCategory | undefined => {
  return SERVICE_CATEGORIES.find((cat) => cat.id === id);
};

export const getAllSubcategories = (): string[] => {
  return SERVICE_CATEGORIES.flatMap((cat) => cat.subcategories);
};

export const searchCategories = (query: string): ServiceCategory[] => {
  const lowerQuery = query.toLowerCase();
  return SERVICE_CATEGORIES.filter(
    (cat) =>
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.subcategories.some((sub) => sub.toLowerCase().includes(lowerQuery))
  );
};
