"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ChevronLeft,
  Star,
  Shield,
  Wallet,
  Users,
  Briefcase,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
  AccordionItem,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useInView } from "react-intersection-observer";
import { BRAND, FAQ_ITEMS, STATS, HOW_IT_WORKS } from "@/lib/constants";
import { SERVICE_CATEGORIES, POPULAR_SKILLS } from "@/lib/constants/categories";
import { OrgApplyModal } from "./_components/OrgApplyModal";

export default function Home() {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [userType, setUserType] = useState<"worker" | "customer">("worker");
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  const currentSteps =
    userType === "worker" ? HOW_IT_WORKS.forWorkers : HOW_IT_WORKS.forCustomers;

  return (
    <div className="min-h-screen w-full max-w-[1450px] overflow-x-hidden mx-auto gap-16 font-[family-name:var(--font-geist-sans)]">
      <Header />

      {/* Hero */}
      <section
        style={{
          backgroundImage: "url('/hero-grid.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="w-full min-h-[800px] pt-16 sm:pt-[100px] px-6 sm:px-8 md:px-14 xl:px-20 bg-white relative"
      >
        <div className="absolute z-0 top-0 left-0 w-full h-full bg-white/50" />
        <div className="absolute z-0 top-0 left-0 w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0)_0%,rgba(255,255,255,0.43)_32%,rgba(255,255,255,1)_100%)]" />
        <div className="relative z-10 w-full h-full">
          <div className="relative max-md:mb-10 group cursor-default uppercase">
            <p className="text-[80px] sm:text-[110px] lg:text-[135.83px] tracking-[-6.69px] sm:tracking-[-9.69] leading-[86.5%] font-medium text-left group-hover:text-[var(--orange)] group-hover:has-[:hover]:text-black transition-colors duration-300">
              Your skills{" "}
              <span className="text-black/70 hover:text-[var(--orange)] transition-colors duration-300">
                deserve
              </span>{" "}
              <br className="max-sm:hidden" />
              recognition
            </p>
            <div className="relative w-max h-14 sm:h-14 ml-8 lg:ml-10 px-2.5 flex items-center justify-center text-black/20">
              <ChevronLeft className="absolute top-0 left-0 w-6 h-6 rotate-45" />
              <ChevronLeft className="absolute top-0 right-0 w-6 h-6 rotate-135" />
              <ChevronLeft className="absolute bottom-0 left-0 w-6 h-6 rotate-315" />
              <ChevronLeft className="absolute bottom-0 right-0 w-6 h-6 rotate-225" />

              <span className="py-2.5 px-2.5 block w-max text-base md:text-lg lg:text-[22.3px] font-light text-black tracking-[3px] leading-[86.5%]">
                ARTISANS
              </span>
            </div>
          </div>

          <div className="relative flex flex-col items-end group cursor-default uppercase">
            <div className="relative w-max h-12 sm:h-14 px-2.5 flex items-center justify-center text-black/20">
              <ChevronLeft className="absolute top-0 left-0 w-6 h-6 rotate-45" />
              <ChevronLeft className="absolute top-0 right-0 w-6 h-6 rotate-135" />
              <ChevronLeft className="absolute bottom-0 left-0 w-6 h-6 rotate-315" />
              <ChevronLeft className="absolute bottom-0 right-0 w-6 h-6 rotate-225" />

              <span className="py-2.5 px-2.5 block w-max text-base md:text-lg lg:text-[22.3px] font-light text-black tracking-[3px] leading-[86.5%]">
                CUSTOMERS
              </span>
            </div>
            <p className="text-[80px] sm:text-[110px] lg:text-[135.83px] tracking-[-6.69px] sm:tracking-[-9.69] leading-[86.5%] font-medium text-right group-hover:text-[var(--orange)] group-hover:has-[:hover]:text-black transition-colors duration-300">
              Build trust <br />
              access{" "}
              <span className="text-black/70 hover:text-[var(--orange)] transition-colors duration-300">
                opportunity
              </span>
            </p>
          </div>

          <div className="relative">
            <p className="max-w-[400px] md:max-w-[470px] lg:max-w-[541px] mt-12 xl:mt-7 text-base sm:text-xl leading-[149%] tracking-[0px]">
              {BRAND.fullDescription}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button
                onClick={() => router.push("/onboarding/select-type")}
                className="h-[56px] sm:h-[64px] px-8 sm:px-10 text-lg sm:text-xl font-bold text-white leading-[22px] rounded-[13px] bg-[var(--orange)] hover:bg-[var(--orange)]/90 shadow-lg shadow-[var(--orange)]/25 hover:shadow-xl hover:shadow-[var(--orange)]/30 transition-all"
              >
                Get started here!
              </Button>
              {user && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="h-[56px] sm:h-[64px] px-6 sm:px-8 text-base sm:text-lg text-[var(--orange)] leading-[22px] rounded-[13px] border border-[var(--orange)]"
                >
                  Dashboard
                </Button>
              )}
            </div>
            {/* Floating Element */}
            <motion.div
              className="max-sm:hidden absolute -top-[82px] md:-top-[96px] lg:-top-[106px] -right-[100px] md:-right-[100px] lg:-right-[46px] w-[308px] h-[308px]"
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                className="max-md:w-[260px] max-lg:w-[260px] max-md:h-[280px] max-lg:h-[280px]"
                src="/cube.webp"
                alt="Artivo"
                width={308}
                height={308}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Opportunity */}
      <section className="pt-10 pb-24 px-6 sm:px-8 md:px-14 xl:px-20">
        <div>
          <div className="w-max mb-3 flex items-center gap-2.5 border border-black/5 rounded-[64.5px] px-5 py-2.5">
            <div className="h-[5px] w-[5px] rounded-full bg-[var(--orange)]"></div>
            <span className="text-xl uppercase tracking-[0px] leading-[139%]">
              THE OPPORTUNITY
            </span>
          </div>

          <div className="flex max-lg:flex-col lg:items-center justify-between gap-6 md:gap-10 lg:gap-20">
            <h1 className="text-[60px] sm:text-[80px] md:text-[90px] lg:text-[100px] font-medium leading-[105%] sm:leading-[87%] tracking-[-4.69px] sm:tracking-[-6.7px]">
              Africa&apos;s Workforce
              <br className="max-sm:hidden" /> Is Going Digital
            </h1>
            <p className="max-w-[400px] md:ml-auto text-base sm:text-lg lg:text-xl leading-[139%] tracking-[0px] md:text-right">
              Millions of skilled workers lack digital presence, verified
              credentials, and access to financial services. Artivo changes
              that.
            </p>
          </div>
        </div>

        <div className="py-12 sm:py-16 grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
          <DigitalIdentityCard />
          <TrustGapCard />
          <FinancialAccessCard />
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="py-16 px-6 sm:px-8 md:px-14 xl:px-20 bg-[#FBFBFB]">
        <div className="mb-12">
          <div className="w-max mb-3 flex items-center gap-2.5 border border-black/5 rounded-[64.5px] px-5 py-2.5">
            <div className="h-[5px] w-[5px] rounded-full bg-[var(--orange)]"></div>
            <span className="text-base sm:text-xl uppercase tracking-[0px] leading-[139%]">
              FIND SKILLED WORKERS
            </span>
          </div>
          <h2 className="text-[50px] sm:text-[70px] md:text-[80px] font-medium leading-[87%] tracking-[-4.7px]">
            Every skill you need
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {SERVICE_CATEGORIES.slice(0, 10).map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-6 border border-black/5 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--orange)]/10 flex items-center justify-center mb-4">
                <CategoryIcon name={category.icon} />
              </div>
              <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
              <p className="text-sm text-gray-500">
                {category.subcategories.length}+ services
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {POPULAR_SKILLS.map((skill) => (
            <span
              key={skill}
              className="px-4 py-2 bg-white rounded-full text-sm border border-black/5 hover:border-[var(--orange)] hover:text-[var(--orange)] transition-colors cursor-pointer"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative pt-6 sm:pt-[104px] pb-12 px-6 sm:px-8 md:px-14 xl:px-20 space-y-14 bg-white"
      >
        <div className="relative z-10">
          <div className="w-max mb-3 flex items-center gap-2.5 border border-black/5 rounded-[64.5px] px-5 py-2.5">
            <div className="h-[5px] w-[5px] rounded-full bg-[var(--orange)]"></div>
            <span className="text-base sm:text-xl uppercase tracking-[0px] leading-[139%]">
              HOW IT WORKS
            </span>
          </div>

          <div className="flex max-lg:flex-col lg:items-center justify-between gap-6">
            <h1 className="text-[60px] md:text-[80px] lg:text-[100px] font-medium leading-[87%] tracking-[-6.7px]">
              From signup to success
              <br className="max-lg:hidden" /> in four steps
            </h1>

            {/* User Type Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => {
                  setUserType("worker");
                  setSelectedStep(0);
                }}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-medium transition-all",
                  userType === "worker"
                    ? "bg-[var(--orange)] text-white"
                    : "text-gray-600 hover:text-black"
                )}
              >
                I&apos;m an Artisan
              </button>
              <button
                onClick={() => {
                  setUserType("customer");
                  setSelectedStep(0);
                }}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-medium transition-all",
                  userType === "customer"
                    ? "bg-[var(--orange)] text-white"
                    : "text-gray-600 hover:text-black"
                )}
              >
                I&apos;m a Customer
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex max-xl:flex-col items-start justify-between gap-9 z-10">
          <div className="space-y-6 w-full xl:w-auto">
            {currentSteps.map((step, index) => (
              <button
                key={step.step}
                className={cn(
                  "max-xl:w-full p-6 sm:p-8 flex items-start gap-5 rounded-3xl text-left cursor-pointer group transition-all",
                  selectedStep === index
                    ? "bg-[#FBFBFB] shadow-sm"
                    : "hover:bg-gray-50"
                )}
                onClick={() => setSelectedStep(index)}
              >
                <span
                  className={cn(
                    "w-12 h-12 sm:w-[60px] sm:h-[60px] rounded-full text-xl sm:text-2xl text-white font-semibold leading-[86.5%] tracking-[-1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-300",
                    selectedStep === index
                      ? "bg-[var(--orange)]"
                      : "bg-[#EAEAEA] group-hover:bg-[var(--orange)]/20"
                  )}
                >
                  0{step.step}
                </span>
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-2xl sm:text-[28px] font-semibold leading-[99%] tracking-[-1.2px]">
                    {step.title}
                  </p>
                  <p className="text-base sm:text-lg leading-[139%] text-gray-600">
                    {step.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Visual showcase */}
          <div className="flex-shrink-0 w-full xl:w-[45%] bg-gradient-to-br from-[var(--orange)]/5 to-[var(--orange)]/10 rounded-3xl p-8 min-h-[500px] flex items-center justify-center">
            <motion.div
              key={`${userType}-${selectedStep}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--orange)] flex items-center justify-center">
                {selectedStep === 0 && (
                  <Users className="w-12 h-12 text-white" />
                )}
                {selectedStep === 1 && (
                  <Shield className="w-12 h-12 text-white" />
                )}
                {selectedStep === 2 && (
                  <Briefcase className="w-12 h-12 text-white" />
                )}
                {selectedStep === 3 && (
                  <Wallet className="w-12 h-12 text-white" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {currentSteps[selectedStep].title}
              </h3>
              <p className="text-gray-600 max-w-sm">
                {currentSteps[selectedStep].description}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pt-36 sm:pt-[184px] pb-48 sm:pb-[230px] px-6 sm:px-8 md:px-14 xl:px-20 flex flex-col items-center bg-[#1D1D1D] rounded-3xl sm:rounded-[40px]">
        <h2 className="mb-16 sm:mb-24 text-[55px] md:text-[90px] lg:text-[110px] font-medium leading-[86.5%] tracking-[-4.69px] text-white text-center">
          Empowering Africa&apos;s informal workforce
        </h2>

        <div className="mt-8 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-[50px] text-white text-center w-full max-w-5xl">
          <div className="flex flex-col items-center gap-3 sm:gap-5">
            <h3 className="text-[50px] sm:text-[70px] leading-[86.5%] tracking-[-4px] text-[var(--orange)]">
              {STATS.workers}
            </h3>
            <p className="text-base sm:text-lg leading-[139%]">
              {STATS.workersLabel}
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:gap-5">
            <h3 className="text-[50px] sm:text-[70px] leading-[86.5%] tracking-[-4px] text-[var(--orange)]">
              {STATS.jobs}
            </h3>
            <p className="text-base sm:text-lg leading-[139%]">
              {STATS.jobsLabel}
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:gap-5">
            <h3 className="text-[50px] sm:text-[70px] leading-[86.5%] tracking-[-4px] text-[var(--orange)]">
              {STATS.countries}
            </h3>
            <p className="text-base sm:text-lg leading-[139%]">
              {STATS.countriesLabel}
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:gap-5">
            <h3 className="text-[50px] sm:text-[70px] leading-[86.5%] tracking-[-4px] text-[var(--orange)]">
              {STATS.satisfaction}
            </h3>
            <p className="text-base sm:text-lg leading-[139%]">
              {STATS.satisfactionLabel}
            </p>
          </div>
        </div>
      </section>

      {/* Perks / Features */}
      <section className="relative pt-24 pb-40 sm:pb-[200px] px-6 sm:px-8 md:px-14 xl:px-20">
        <div className="text-center mb-16">
          <div className="w-max mx-auto mb-3 flex items-center gap-2.5 border border-black/5 rounded-[64.5px] px-5 py-2.5">
            <div className="h-[5px] w-[5px] rounded-full bg-[var(--orange)]"></div>
            <span className="text-base sm:text-xl uppercase tracking-[0px] leading-[139%]">
              WHY ARTIVO
            </span>
          </div>
          <p className="text-[45px] sm:text-[70px] md:text-[80px] lg:text-[90px] font-medium leading-[105%] sm:leading-[86.5%] tracking-[-4.69px] sm:tracking-[-5.5px]">
            Built for trust, designed for growth
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCardOne />
          <FeatureCardTwo />
          <FeatureCardThree />
          <FeatureCardFour />
        </div>
      </section>

      <FAQSection />

      {/* CTA Section */}
      <section className="relative min-h-[800px] sm:min-h-[900px] pt-22 sm:pt-[103px] pb-[103px] px-6 sm:px-8 md:px-14 xl:px-20 flex flex-col items-center rounded-t-[40px] overflow-hidden bg-[#1D1D1D]">
        <div className="z-10 text-white text-center flex flex-col items-center">
          <p className="mb-4 px-5 py-2.5 inline-flex items-center gap-2 text-base sm:text-xl uppercase leading-[139%] bg-white/[3%] rounded-full">
            <span className="w-[5px] h-[5px] bg-[var(--orange)] rounded-full"></span>
            Start now
            <span className="w-[5px] h-[5px] bg-[var(--orange)] rounded-full"></span>
          </p>
          <p className="max-w-[800px] mb-8 text-[40px] sm:text-[60px] md:text-[70px] lg:text-[80px] font-medium leading-[105%] sm:leading-[86.5%] tracking-[-4.69px] sm:tracking-[-6.69px]">
            Your skills deserve recognition. Start building your future today.
          </p>
          <p className="max-w-[500px] mb-10 text-lg text-white/70">
            Join thousands of artisans already earning more and building their
            reputation on Artivo.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              onClick={() => router.push("/onboarding/select-type")}
              className="h-[56px] sm:h-[64px] px-10 sm:px-14 text-lg sm:text-xl font-bold text-white hover:bg-[var(--orange)]/90 leading-[22px] rounded-[13px] bg-[var(--orange)] shadow-xl shadow-black/20"
            >
              Get started here!
            </Button>
            <Button
              onClick={() => setApplyModalOpen(true)}
              variant="outline"
              className="h-[56px] sm:h-[64px] px-8 sm:px-12 text-lg sm:text-xl font-bold text-white border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50 leading-[22px] rounded-[13px]"
            >
              Apply via Association
            </Button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-[var(--orange)]/20 to-transparent" />
      </section>

      <OrgApplyModal open={applyModalOpen} onClose={() => setApplyModalOpen(false)} />

      <Footer />
    </div>
  );
}

const CategoryIcon = ({ name }: { name: string }) => {
  const iconClass = "w-6 h-6 text-[var(--orange)]";
  switch (name) {
    case "home":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      );
    case "scissors":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
          />
        </svg>
      );
    case "smartphone":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    case "truck":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      );
    case "briefcase":
      return <Briefcase className={iconClass} />;
    case "utensils":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      );
    case "sparkles":
      return <Sparkles className={iconClass} />;
    case "heart":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      );
    case "graduation-cap":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      );
    case "car":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M8 17h.01M16 17h.01M3 11l1.585-4.755A2 2 0 016.479 5h11.042a2 2 0 011.894 1.245L21 11M3 11h18M3 11v6a1 1 0 001 1h1m14-7v6a1 1 0 01-1 1h-1m-9 0h6" />
        </svg>
      );
    default:
      return <Briefcase className={iconClass} />;
  }
};

const Header = () => {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <header className="pt-6 sm:pt-12 pb-8 px-4 sm:px-8 md:px-14 xl:px-20 flex justify-between items-center w-full font-medium">
      <div className="flex items-center gap-2">
        <Image src="/logo_primary.svg" alt={BRAND.name} width={36} height={36} />
        <h1 className="max-sm:hidden text-[28px] tracking-[-1.5px] leading-[123%] text-[#444444] font-semibold">
          {BRAND.name}
        </h1>
      </div>

      <nav className="max-lg:hidden flex items-center gap-[60px] text-lg">
        <Link href="/" className="tracking-[-0.5px] hover:text-[var(--orange)] transition-colors">
          Home
        </Link>
        <Link href="/marketplace" className="tracking-[-0.5px] hover:text-[var(--orange)] transition-colors">
          Find Artisans
        </Link>
        <button
          onClick={() =>
            document
              .getElementById("how-it-works")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="tracking-[-0.5px] cursor-pointer hover:text-[var(--orange)] transition-colors"
        >
          How it works
        </button>
        <button
          onClick={() =>
            document
              .getElementById("faqs")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="tracking-[-0.5px] cursor-pointer hover:text-[var(--orange)] transition-colors"
        >
          FAQ&apos;s
        </button>
      </nav>

      <div className="flex items-center gap-2.5">
        {user ? (
          <Button
            onClick={() => router.push("/dashboard")}
            className="h-10 sm:h-[52px] px-5 sm:px-7 text-sm sm:text-base font-semibold text-white leading-[22px] rounded-lg sm:rounded-[13px] bg-[var(--orange)] hover:bg-[var(--orange)]/90"
          >
            Dashboard
          </Button>
        ) : (
          <>
            <Button
              onClick={() => router.push("/login")}
              className="h-10 sm:h-[52px] px-4 sm:px-6 text-sm sm:text-base text-[var(--orange)] leading-[22px] border border-[var(--orange)] bg-transparent rounded-lg sm:rounded-[13px] hover:bg-[var(--orange)]/5"
            >
              Login
            </Button>
            <Button
              onClick={() => router.push("/onboarding/select-type")}
              className="h-10 sm:h-[52px] px-5 sm:px-7 text-sm sm:text-base font-bold text-white leading-[22px] rounded-lg sm:rounded-[13px] bg-[var(--orange)] hover:bg-[var(--orange)]/90 shadow-md shadow-[var(--orange)]/20"
            >
              Get started here!
            </Button>
          </>
        )}
      </div>
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="relative min-h-[500px] pt-20 sm:pt-[120px] pb-8 px-6 sm:px-8 md:px-14 xl:px-20 w-full bg-[#1D1D1D] text-white">
      <div className="pb-16 sm:pb-[100px] flex max-md:flex-col md:items-start max-lg:justify-between gap-y-12 lg:gap-[200px]">
        <div className="flex items-center gap-4 sm:gap-6">
          <Image src="/logo_primary.svg" alt={BRAND.name} width={64} height={64} />
          <div className="max-w-[257px] space-y-2 text-white">
            <p className="text-3xl sm:text-4xl font-semibold leading-[86.5%] tracking-[-2px]">
              {BRAND.name}
            </p>
            <p className="text-sm sm:text-base leading-[139%] text-white/70">
              {BRAND.tagline}
            </p>
          </div>
        </div>

        <nav className="min-w-max">
          <ul className="grid grid-cols-2 gap-x-16 gap-y-3">
            <li>
              <Link
                href="/"
                className="text-lg font-medium leading-[139%] hover:text-[var(--orange)] transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href={BRAND.social.twitter}
                className="text-lg leading-[139%] flex items-center gap-2 hover:text-[var(--orange)] transition-colors"
              >
                X/Twitter
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </li>
            <li>
              <Link
                href="/marketplace"
                className="text-lg leading-[139%] hover:text-[var(--orange)] transition-colors"
              >
                Find Artisans
              </Link>
            </li>
            <li>
              <Link
                href={BRAND.social.linkedin}
                className="text-lg leading-[139%] flex items-center gap-2 hover:text-[var(--orange)] transition-colors"
              >
                LinkedIn
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </li>
            <li>
              <button
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="text-lg leading-[139%] cursor-pointer hover:text-[var(--orange)] transition-colors"
              >
                How it works
              </button>
            </li>
            <li>
              <Link
                href={BRAND.social.instagram}
                className="text-lg leading-[139%] flex items-center gap-2 hover:text-[var(--orange)] transition-colors"
              >
                Instagram
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="flex max-sm:flex-col justify-between sm:items-center gap-x-2 gap-y-6 text-sm border-t border-white/10 pt-8">
        <Link
          href={`mailto:${BRAND.email}`}
          className="w-max py-2.5 px-5 leading-[139%] bg-white/[6%] backdrop-blur-sm rounded-full hover:bg-white/10 transition-colors"
        >
          {BRAND.email}
        </Link>
        <div className="flex max-sm:justify-between items-center gap-4">
          <p className="py-2.5 px-5 leading-[139%] bg-white/[6%] backdrop-blur-sm rounded-full">
            ©2025
          </p>
          <p className="py-2.5 px-5 leading-[139%] bg-white/[6%] backdrop-blur-sm rounded-full">
            {BRAND.name}
          </p>
        </div>
      </div>
    </footer>
  );
};

const FAQSection = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
  };

  return (
    <div
      id="faqs"
      className="mx-auto pt-16 max-w-7xl pb-[103px] px-6 sm:px-8 md:px-14 xl:px-20"
    >
      <div className="w-full flex max-md:flex-col justify-between gap-16">
        <div className="space-y-9">
          <div className="w-20 h-20 rounded-2xl bg-[var(--orange)]/10 flex items-center justify-center">
            <span className="text-4xl">?</span>
          </div>

          <h2 className="text-[60px] lg:text-[80px] font-medium leading-[86.5%] tracking-[-4px]">
            FAQ&apos;S
          </h2>
        </div>

        <div className="w-full md:max-w-[632px] lg:mr-16">
          <Accordion type="multiple" className="w-full space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-2xl border border-black/10 transition-all duration-200 hover:shadow-md overflow-hidden"
              >
                <AccordionTrigger
                  icon={openItems.includes(index) ? <Minus /> : <Plus />}
                  className="cursor-pointer flex w-full items-center justify-between px-6 sm:px-8 p-5 text-left transition-colors duration-200 hover:bg-gray-50 hover:no-underline"
                  onClick={() => toggleItem(index)}
                >
                  <h3 className="text-base sm:text-lg font-semibold leading-[139%] tracking-[-0.5px]">
                    {item.question}
                  </h3>
                </AccordionTrigger>
                <AccordionContent className="border-t border-gray-100 px-6 sm:px-8 pb-5 pt-4">
                  <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

const isTouchDevice = () => {
  return (
    typeof window !== "undefined" &&
    (navigator.maxTouchPoints > 0 || "ontouchstart" in window)
  );
};

/* Opportunity Cards */
const DigitalIdentityCard = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.8,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isTouchDevice());
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{ willChange: "transform, opacity" }}
      className="min-h-[450px] sm:min-h-[507px] flex flex-col relative overflow-hidden rounded-[30px] bg-[#2C2C2C] p-6 text-white"
      initial="initial"
      animate={isMobile && inView ? "hover" : "initial"}
      whileHover={!isMobile ? "hover" : undefined}
    >
      <div className="relative z-10">
        <div className="mb-7 flex items-center justify-between">
          <span className="rounded-full bg-white text-black px-4 sm:px-5 py-2 sm:py-2.5 text-[13px] sm:text-sm uppercase tracking-[0px] leading-[139%]">
            Digital Identity
          </span>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[var(--orange)] flex items-center justify-center">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>

        <div className="space-y-5 text-3xl sm:text-4xl font-medium leading-[99%] tracking-[-2.69px]">
          <p>
            85% of African
            <span className="inline-flex mx-2 px-2 py-1 bg-[var(--orange)]/20 rounded-lg text-[var(--orange)]">
              gig workers
            </span>
            lack any digital presence or portfolio.
          </p>
        </div>
      </div>
      <motion.span
        className="mt-auto text-[90px] 2xl:text-[110px] bg-clip-text bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(255,255,255,0))] font-medium leading-[99%] tracking-[-7px] text-white/0"
        variants={{
          initial: { y: 80, opacity: 0 },
          hover: { y: 0, opacity: 0.15 },
        }}
        transition={{
          y: { duration: 0.5 },
          opacity: { duration: 0.25 },
        }}
        style={{ willChange: "transform, opacity" }}
      >
        Identity
      </motion.span>
    </motion.div>
  );
};

const TrustGapCard = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.8,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isTouchDevice());
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{
        willChange: "transform, opacity",
      }}
      className="min-h-[450px] sm:min-h-[507px] relative overflow-hidden rounded-[30px] p-6 pb-9 text-white bg-gradient-to-br from-[var(--orange)] to-[var(--orange)]/80"
      initial="initial"
      animate={isMobile && inView ? "hover" : "initial"}
      whileHover={!isMobile ? "hover" : undefined}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-7 flex justify-between">
          <span className="w-max rounded-full bg-white/20 text-white px-4 sm:px-5 py-2 sm:py-2.5 text-[13px] sm:text-sm uppercase tracking-[0px] leading-[139%]">
            Trust Gap
          </span>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white flex items-center justify-center">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--orange)]" />
          </div>
        </div>

        <motion.span
          className="mt-auto z-10 text-[90px] sm:text-[110px] bg-clip-text bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(255,255,255,0))] font-medium leading-[99%] tracking-[-7px] text-white/0"
          variants={{
            initial: { y: 80, opacity: 0 },
            hover: { y: 0, opacity: 0.2 },
          }}
          transition={{
            y: { duration: 0.5 },
            opacity: { duration: 0.25 },
          }}
          style={{ willChange: "transform, opacity" }}
        >
          Trust
        </motion.span>

        <p className="text-3xl sm:text-4xl font-medium leading-[99%] tracking-[-2.69px]">
          No way to verify skills, track record, or build
          <span className="inline-flex mx-2 px-2 py-1 bg-white/20 rounded-lg">
            reputation
          </span>
          across platforms.
        </p>
      </div>
    </motion.div>
  );
};

const FinancialAccessCard = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.8,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isTouchDevice());
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{ willChange: "transform, opacity" }}
      className="min-h-[450px] sm:min-h-[507px] flex flex-col relative overflow-hidden border border-black/10 rounded-[30px] p-6 text-black"
      initial="initial"
      animate={isMobile && inView ? "hover" : "initial"}
      whileHover={!isMobile ? "hover" : undefined}
    >
      <div className="relative z-10">
        <div className="mb-7 flex items-center justify-between">
          <span className="w-max rounded-full bg-[var(--orange)]/10 text-[var(--orange)] px-4 sm:px-5 py-2 sm:py-2.5 text-[13px] sm:text-sm uppercase tracking-[0px] leading-[139%]">
            Financial Access
          </span>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[var(--orange)] flex items-center justify-center">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-3xl sm:text-4xl font-medium leading-[99%] tracking-[-2.69px]">
            Without credit history, workers can&apos;t access
            <span className="inline-flex mx-2 px-2 py-1 bg-[var(--orange)]/10 rounded-lg text-[var(--orange)]">
              loans
            </span>
            savings, or insurance.
          </p>
        </div>
      </div>
      <motion.span
        className="mt-auto text-[90px] sm:text-[110px] bg-clip-text bg-[linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,0))] font-medium leading-[99%] tracking-[-7px] text-white/0"
        variants={{
          initial: { y: 80, opacity: 0 },
          hover: { y: 0, opacity: 0.08 },
        }}
        transition={{
          y: { duration: 0.5 },
          opacity: { duration: 0.25 },
        }}
        style={{ willChange: "transform, opacity" }}
      >
        Access
      </motion.span>
    </motion.div>
  );
};

/* Feature Cards */
const FeatureCardOne = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.8,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isTouchDevice());
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{ willChange: "transform, opacity" }}
      className="relative min-h-[360px] sm:min-h-[400px] bg-[#FAFAFA] rounded-[30px] pt-8 px-6 pb-6 overflow-hidden"
      initial="initial"
      animate={isMobile && inView ? "hover" : "initial"}
      whileHover={!isMobile ? "hover" : undefined}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="w-12 h-12 sm:w-[57px] sm:h-[54px] mb-4 bg-white border border-[var(--orange)]/10 rounded-[18px] flex items-center justify-center">
          <Star className="w-6 h-6 text-[var(--orange)]" />
        </div>
        <p className="text-2xl sm:text-3xl font-medium leading-[99%] tracking-[-2px]">
          Build a verified trust score based on real work history
        </p>
        <motion.div
          className="mt-auto pt-6 flex justify-center"
          variants={{
            initial: { y: 20, opacity: 0.5 },
            hover: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-8 h-8 text-[var(--orange)] fill-[var(--orange)]"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const FeatureCardTwo = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.8,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isTouchDevice());
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{ willChange: "transform, opacity" }}
      className="relative min-h-[360px] sm:min-h-[400px] bg-[#FAFAFA] rounded-[30px] pt-8 px-6 pb-6 overflow-hidden"
      initial="initial"
      animate={isMobile && inView ? "hover" : "initial"}
      whileHover={!isMobile ? "hover" : undefined}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="w-12 h-12 sm:w-[57px] sm:h-[54px] mb-4 bg-white border border-[var(--orange)]/10 rounded-[18px] flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-[var(--orange)]" />
        </div>
        <p className="text-2xl sm:text-3xl font-medium leading-[99%] tracking-[-2px]">
          AI-powered job matching finds the right opportunities
        </p>
        <motion.div
          className="mt-auto pt-6 flex justify-center"
          variants={{
            initial: { y: 20, opacity: 0.5 },
            hover: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--orange)]/10 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-[var(--orange)]" />
            <span className="text-sm font-medium text-[var(--orange)]">
              95% match accuracy
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const FeatureCardThree = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.8,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isTouchDevice());
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{ willChange: "transform, opacity" }}
      className="relative min-h-[360px] sm:min-h-[400px] bg-[#FAFAFA] rounded-[30px] pt-8 px-6 pb-6 overflow-hidden"
      initial="initial"
      animate={isMobile && inView ? "hover" : "initial"}
      whileHover={!isMobile ? "hover" : undefined}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="w-12 h-12 sm:w-[57px] sm:h-[54px] mb-4 bg-white border border-[var(--orange)]/10 rounded-[18px] flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-[var(--orange)]" />
        </div>
        <p className="text-2xl sm:text-3xl font-medium leading-[99%] tracking-[-2px]">
          Alternative credit scoring unlocks financial services
        </p>
        <motion.div
          className="mt-auto pt-6 flex justify-center"
          variants={{
            initial: { y: 20, opacity: 0.5 },
            hover: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--orange)] to-green-500"
              variants={{
                initial: { width: "30%" },
                hover: { width: "85%" },
              }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const FeatureCardFour = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.8,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isTouchDevice());
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{ willChange: "transform, opacity" }}
      className="relative min-h-[360px] sm:min-h-[400px] bg-[#FAFAFA] rounded-[30px] pt-8 px-6 pb-6 overflow-hidden"
      initial="initial"
      animate={isMobile && inView ? "hover" : "initial"}
      whileHover={!isMobile ? "hover" : undefined}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="w-12 h-12 sm:w-[57px] sm:h-[54px] mb-4 bg-white border border-[var(--orange)]/10 rounded-[18px] flex items-center justify-center">
          <Wallet className="w-6 h-6 text-[var(--orange)]" />
        </div>
        <p className="text-2xl sm:text-3xl font-medium leading-[99%] tracking-[-2px]">
          Secure payments via mobile money and bank transfer
        </p>
        <motion.div
          className="mt-auto pt-6 flex justify-center gap-3"
          variants={{
            initial: { y: 20, opacity: 0.5 },
            hover: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.4 }}
        >
          <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm font-medium">
            M-Pesa
          </div>
          <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm font-medium">
            OPay
          </div>
          <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm font-medium">
            Bank
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
