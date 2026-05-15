import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiService } from "@/api/api-service";
import { useAuthStore } from "@/store/authStore";
import type { CreateWorkerProfileRequest } from "@/api/types/worker";
import type {
  VoiceOnboardPayload,
  VoiceOnboardResponse,
  TextOnboardPayload,
} from "@/api/types/marketplace-api";

// --- Interfaces ---

export interface ChatMessage {
  id: string;
  role: "system" | "user";
  content: string;
  timestamp: string;
  extractedData?: Record<string, unknown>;
  requiresConfirmation?: boolean;
}

export interface OnboardingStep {
  id: string;
  stepNumber: number;
  title: string;
  prompt: string;
  field: "display_name" | "skills" | "categories" | "location" | "bio";
  completed: boolean;
  data?: unknown;
  followUpCount: number;
}

interface ProcessResponse {
  extracted: Record<string, unknown>;
  confidence: number;
  followUp?: string;
}

interface ResumeResponse {
  currentStep: number;
  steps: OnboardingStep[];
  messages: ChatMessage[];
  partialProfile: Partial<CreateWorkerProfileRequest> | null;
  role: "worker" | "customer";
}

/** Fields parsed from AI voice/text onboarding */
export interface ConfirmationFields {
  fullName: string;
  skills: string;
  bio: string;
  experience: string;
  avgPay: string;
  location: string;
}

export interface OnboardingState {
  // State
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
  messages: ChatMessage[];
  isProcessing: boolean;
  error: string | null;
  role: "worker" | "customer";
  partialProfile: Partial<CreateWorkerProfileRequest> | null;
  fallbackMode: boolean;
  confirmationFields: Record<string, string>;
  saveSuccess: boolean;

  // Actions
  initOnboarding: (role: "worker" | "customer") => void;
  submitResponse: (text: string) => Promise<void>;
  submitVoice: (audioData: string) => Promise<void>;
  submitText: (text: string, context: Array<{ role: string; content: string }>) => Promise<void>;
  correctField: (fieldName: string, value: string) => void;
  confirmAndSave: () => Promise<boolean>;
  confirmExtraction: (stepId: string, data: unknown) => Promise<void>;
  editExtraction: (stepId: string, data: unknown) => void;
  activateFallback: () => void;
  resumeOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<boolean>;
  reset: () => void;
}

// --- Constants ---

const WORKER_STEPS: Omit<OnboardingStep, "followUpCount" | "completed" | "data">[] = [
  {
    id: "step-1",
    stepNumber: 1,
    title: "Display Name",
    prompt: "What name would you like to go by on the platform? This is how customers will see you.",
    field: "display_name",
  },
  {
    id: "step-2",
    stepNumber: 2,
    title: "Skills",
    prompt: "Tell me about your skills and experience. What services do you offer and for how long have you been doing them?",
    field: "skills",
  },
  {
    id: "step-3",
    stepNumber: 3,
    title: "Categories",
    prompt: "Which service categories best describe your work? For example: Home Services, Tech Services, Personal Services.",
    field: "categories",
  },
  {
    id: "step-4",
    stepNumber: 4,
    title: "Location",
    prompt: "Where are you located? Please share your city, state, and country.",
    field: "location",
  },
  {
    id: "step-5",
    stepNumber: 5,
    title: "Bio",
    prompt: "Write a short bio about yourself. This helps customers understand who you are and what makes you unique.",
    field: "bio",
  },
];

const CUSTOMER_STEPS: Omit<OnboardingStep, "followUpCount" | "completed" | "data">[] = [
  {
    id: "step-1",
    stepNumber: 1,
    title: "Name",
    prompt: "What's your name? This is how workers will address you.",
    field: "display_name",
  },
  {
    id: "step-2",
    stepNumber: 2,
    title: "Location",
    prompt: "Where are you located? Please share your city and state so we can find workers near you.",
    field: "location",
  },
  {
    id: "step-3",
    stepNumber: 3,
    title: "Service Needs",
    prompt: "What services are you looking for? Describe what you need help with.",
    field: "categories",
  },
];

const MAX_FOLLOW_UPS = 2;

// --- Helper ---

function createMessage(role: "system" | "user", content: string, extras?: Partial<ChatMessage>): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    ...extras,
  };
}

// --- Store ---

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 0,
      totalSteps: 5,
      steps: [],
      messages: [],
      isProcessing: false,
      error: null,
      role: "worker",
      partialProfile: null,
      fallbackMode: false,
      confirmationFields: {},
      saveSuccess: false,

      initOnboarding: (role: "worker" | "customer") => {
        const { confirmationFields } = get();

        // If we already have confirmation fields (user came back), just set the role
        if (Object.keys(confirmationFields).length > 0) {
          set({ role });
          return;
        }

        const stepTemplates = role === "worker" ? WORKER_STEPS : CUSTOMER_STEPS;
        const steps: OnboardingStep[] = stepTemplates.map((s) => ({
          ...s,
          completed: false,
          data: undefined,
          followUpCount: 0,
        }));

        const firstStep = steps[0];
        const welcomeMessage = createMessage(
          "system",
          role === "worker"
            ? "Welcome! Let's set up your artisan profile. I'll guide you through a few steps."
            : "Welcome! Let's get you set up so we can find the right workers for you."
        );
        const promptMessage = createMessage("system", firstStep.prompt);

        set({
          currentStep: 0,
          totalSteps: steps.length,
          steps,
          messages: [welcomeMessage, promptMessage],
          isProcessing: false,
          error: null,
          role,
          partialProfile: null,
          fallbackMode: false,
          confirmationFields: {},
          saveSuccess: false,
        });
      },

      submitResponse: async (text: string) => {
        const { currentStep, steps, role, fallbackMode } = get();
        const step = steps[currentStep];

        if (!step) return;

        // Add user message
        const userMessage = createMessage("user", text);
        set((state) => ({
          messages: [...state.messages, userMessage],
          isProcessing: true,
          error: null,
        }));

        try {
          const response = await apiService.post<ProcessResponse>("/onboarding/process", {
            body: {
              text,
              stepId: step.id,
              field: step.field,
              role,
              currentStep: currentStep + 1,
              fallbackMode,
            },
          });

          const { extracted, confidence, followUp } = response;

          // If extraction failed or low confidence and we have a follow-up
          if (followUp && confidence < 0.7) {
            const updatedSteps = [...steps];
            updatedSteps[currentStep] = {
              ...step,
              followUpCount: step.followUpCount + 1,
            };

            // Check if we've exceeded max follow-ups
            if (updatedSteps[currentStep].followUpCount >= MAX_FOLLOW_UPS) {
              const fallbackMessage = createMessage(
                "system",
                "I'm having trouble understanding. Let me give you some options to choose from instead."
              );
              set((state) => ({
                steps: updatedSteps,
                messages: [...state.messages, fallbackMessage],
                isProcessing: false,
                fallbackMode: true,
              }));
            } else {
              const followUpMessage = createMessage("system", followUp);
              set((state) => ({
                steps: updatedSteps,
                messages: [...state.messages, followUpMessage],
                isProcessing: false,
              }));
            }
          } else {
            // Successful extraction — present for confirmation
            const confirmMessage = createMessage("system", "Here's what I understood. Please confirm or edit:", {
              extractedData: extracted,
              requiresConfirmation: true,
            });

            const updatedSteps = [...steps];
            updatedSteps[currentStep] = {
              ...step,
              data: extracted,
            };

            set((state) => ({
              steps: updatedSteps,
              messages: [...state.messages, confirmMessage],
              isProcessing: false,
            }));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
          set((state) => ({
            isProcessing: false,
            error: errorMessage,
            messages: [
              ...state.messages,
              createMessage("system", "Sorry, something went wrong. Please try again."),
            ],
          }));
        }
      },

      submitVoice: async (audioData: string) => {
        set({ isProcessing: true, error: null });

        try {
          const { role } = get();
          const payload: VoiceOnboardPayload = {
            audioData,
            userType: role === "worker" ? "artisan" : "customer",
          };

          const response = await apiService.post<VoiceOnboardResponse>("/ai/onboard/voice", {
            body: payload,
          });

          // Map AI response fields to confirmationFields, dropping nulls/undefined
          const raw = response.data as Record<string, unknown>;
          const confirmationFields: Record<string, string> = {};

          if (role === "worker") {
            const { fullName, profession, skills, yearsOfExperience, cityLocation, avgPay, expectedHourlyRate, bio, tagline } = raw as {
              fullName?: string | null;
              profession?: string | null;
              skills?: string | string[] | null;
              yearsOfExperience?: string | number | null;
              cityLocation?: string | null;
              avgPay?: string | null;
              expectedHourlyRate?: string | null;
              bio?: string | null;
              tagline?: string | null;
            };
            if (fullName) confirmationFields.fullName = fullName;
            const skillsValue = profession
              ? (skills && (Array.isArray(skills) ? skills.length > 0 : true))
                ? `${profession}, ${Array.isArray(skills) ? skills.join(", ") : String(skills)}`
                : profession
              : (skills != null ? (Array.isArray(skills) ? skills.join(", ") : String(skills)) : "");
            if (skillsValue) confirmationFields.skills = skillsValue;
            if (yearsOfExperience != null) confirmationFields.experience = String(yearsOfExperience);
            if (avgPay || expectedHourlyRate) confirmationFields.avgPay = (avgPay || expectedHourlyRate) as string;
            if (cityLocation) confirmationFields.location = cityLocation;
            if (bio) confirmationFields.bio = bio;
          } else {
            const { clientName, serviceRequired } = raw as {
              clientName?: string | null;
              serviceRequired?: string | null;
            };
            if (clientName) confirmationFields.fullName = clientName;
            if (serviceRequired) confirmationFields.skills = serviceRequired;
          }

          set({
            confirmationFields,
            isProcessing: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Voice processing failed. Please try text input.";
          set({
            isProcessing: false,
            error: errorMessage,
          });
        }
      },

      submitText: async (text: string, context: Array<{ role: string; content: string }>) => {
        set({ isProcessing: true, error: null });

        try {
          const { role } = get();
          const payload: TextOnboardPayload = {
            text,
            userType: role === "worker" ? "artisan" : "customer",
            context,
          };

          const response = await apiService.post<VoiceOnboardResponse>("/ai/onboard/text", {
            body: payload,
          });

          // Same normalization as voice
          const raw = response.data as Record<string, unknown>;
          const confirmationFields: Record<string, string> = {};

          if (role === "worker") {
            const { fullName, profession, skills, yearsOfExperience, cityLocation, avgPay, expectedHourlyRate, bio, tagline } = raw as {
              fullName?: string | null;
              profession?: string | null;
              skills?: string | string[] | null;
              yearsOfExperience?: string | number | null;
              cityLocation?: string | null;
              avgPay?: string | null;
              expectedHourlyRate?: string | null;
              bio?: string | null;
              tagline?: string | null;
            };
            if (fullName) confirmationFields.fullName = fullName;
            const skillsValue = profession
              ? (skills && (Array.isArray(skills) ? skills.length > 0 : true))
                ? `${profession}, ${Array.isArray(skills) ? skills.join(", ") : String(skills)}`
                : profession
              : (skills != null ? (Array.isArray(skills) ? skills.join(", ") : String(skills)) : "");
            if (skillsValue) confirmationFields.skills = skillsValue;
            if (yearsOfExperience != null) confirmationFields.experience = String(yearsOfExperience);
            if (avgPay || expectedHourlyRate) confirmationFields.avgPay = (avgPay || expectedHourlyRate) as string;
            if (cityLocation) confirmationFields.location = cityLocation;
            if (bio) confirmationFields.bio = bio;
          } else {
            const { clientName, serviceRequired } = raw as {
              clientName?: string | null;
              serviceRequired?: string | null;
            };
            if (clientName) confirmationFields.fullName = clientName;
            if (serviceRequired) confirmationFields.skills = serviceRequired;
          }

          set({
            confirmationFields,
            isProcessing: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Text processing failed. Please try again.";
          set({
            isProcessing: false,
            error: errorMessage,
          });
        }
      },

      correctField: (fieldName: string, value: string) => {
        // Local-only field correction — no API call
        set((state) => ({
          confirmationFields: {
            ...state.confirmationFields,
            [fieldName]: value,
          },
        }));
      },

      confirmAndSave: async (): Promise<boolean> => {
        const { confirmationFields } = get();

        set({ isProcessing: true, error: null });

        try {
          // /ai/onboard/save is auth-protected and saves both user + worker profile in one shot
          await apiService.post("/ai/onboard/save", {
            body: confirmationFields,
          });

          // Mark onboarded in Supabase metadata + refresh user from backend (sets onboarded=true)
          const { completeOnboarding, fetchUser } = useAuthStore.getState();
          await Promise.all([completeOnboarding(), fetchUser()]);

          set({
            isProcessing: false,
            saveSuccess: true,
            error: null,
          });

          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to save profile. Please try again.";
          set({
            isProcessing: false,
            error: errorMessage,
            saveSuccess: false,
          });
          return false;
        }
      },

      confirmExtraction: async (stepId: string, data: unknown) => {
        const { currentStep, steps, role, partialProfile } = get();
        const step = steps.find((s) => s.id === stepId);

        if (!step) return;

        set({ isProcessing: true, error: null });

        try {
          await apiService.post("/onboarding/confirm", {
            body: {
              stepId,
              field: step.field,
              data,
              role,
              currentStep: currentStep + 1,
            },
          });

          // Mark step as completed and update partial profile
          const updatedSteps = [...steps];
          const stepIndex = updatedSteps.findIndex((s) => s.id === stepId);
          updatedSteps[stepIndex] = {
            ...step,
            completed: true,
            data,
          };

          // Build partial profile from confirmed data
          const updatedProfile: Partial<CreateWorkerProfileRequest> = { ...partialProfile };
          switch (step.field) {
            case "display_name":
              updatedProfile.display_name = data as string;
              break;
            case "skills":
              updatedProfile.skills = data as string[];
              break;
            case "categories":
              updatedProfile.categories = data as string[];
              break;
            case "location":
              updatedProfile.location = data as CreateWorkerProfileRequest["location"];
              break;
            case "bio":
              updatedProfile.bio = data as string;
              break;
          }

          const nextStepIndex = currentStep + 1;
          const isComplete = nextStepIndex >= steps.length;

          if (isComplete) {
            const completeMessage = createMessage(
              "system",
              "All steps completed! Let me finalize your profile."
            );
            set((state) => ({
              steps: updatedSteps,
              currentStep: nextStepIndex,
              partialProfile: updatedProfile,
              messages: [...state.messages, completeMessage],
              isProcessing: false,
              fallbackMode: false,
            }));
          } else {
            const nextStep = updatedSteps[nextStepIndex];
            const nextPromptMessage = createMessage("system", nextStep.prompt);
            set((state) => ({
              steps: updatedSteps,
              currentStep: nextStepIndex,
              partialProfile: updatedProfile,
              messages: [...state.messages, nextPromptMessage],
              isProcessing: false,
              fallbackMode: false,
            }));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to confirm. Please try again.";
          set({
            isProcessing: false,
            error: errorMessage,
          });
        }
      },

      editExtraction: (stepId: string, data: unknown) => {
        const { steps } = get();
        const updatedSteps = [...steps];
        const stepIndex = updatedSteps.findIndex((s) => s.id === stepId);

        if (stepIndex === -1) return;

        updatedSteps[stepIndex] = {
          ...updatedSteps[stepIndex],
          data,
        };

        const editMessage = createMessage("system", "Got it. I've updated the data. Please confirm when ready.", {
          extractedData: data as Record<string, unknown>,
          requiresConfirmation: true,
        });

        set((state) => ({
          steps: updatedSteps,
          messages: [...state.messages, editMessage],
        }));
      },

      activateFallback: () => {
        const fallbackMessage = createMessage(
          "system",
          "No problem! Please select from the options below instead."
        );
        set((state) => ({
          fallbackMode: true,
          messages: [...state.messages, fallbackMessage],
        }));
      },

      resumeOnboarding: async () => {
        set({ isProcessing: true, error: null });

        try {
          const response = await apiService.get<ResumeResponse>("/onboarding/resume");

          const { currentStep, steps, messages, partialProfile, role } = response;

          set({
            currentStep,
            totalSteps: steps.length,
            steps,
            messages,
            partialProfile,
            role,
            isProcessing: false,
            fallbackMode: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to resume onboarding.";
          set({
            isProcessing: false,
            error: errorMessage,
          });
        }
      },

      completeOnboarding: async (): Promise<boolean> => {
        const { partialProfile, role } = get();

        set({ isProcessing: true, error: null });

        try {
          await apiService.post("/onboarding/complete", {
            body: {
              profile: partialProfile,
              role,
            },
          });

          const successMessage = createMessage(
            "system",
            "Your profile has been created successfully! Redirecting you to the dashboard."
          );

          set((state) => ({
            messages: [...state.messages, successMessage],
            isProcessing: false,
          }));

          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to complete onboarding.";
          set({
            isProcessing: false,
            error: errorMessage,
          });
          return false;
        }
      },

      reset: () => {
        set({
          currentStep: 0,
          totalSteps: 5,
          steps: [],
          messages: [],
          isProcessing: false,
          error: null,
          role: "worker",
          partialProfile: null,
          fallbackMode: false,
          confirmationFields: {},
          saveSuccess: false,
        });
      },
    }),
    {
      name: "onboarding-storage",
      partialize: (state) => ({
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        steps: state.steps,
        messages: state.messages,
        role: state.role,
        partialProfile: state.partialProfile,
        fallbackMode: state.fallbackMode,
        confirmationFields: state.confirmationFields,
        saveSuccess: state.saveSuccess,
      }),
    }
  )
);
