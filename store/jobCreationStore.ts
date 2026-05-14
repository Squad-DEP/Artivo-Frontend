import { create } from "zustand";
import { apiService } from "@/api/api-service";

// --- Interfaces ---

export interface ChatMessage {
  id: string;
  role: "system" | "user";
  content: string;
  timestamp: string;
}

export interface JobExtractionData {
  job_type_id: string;
  title: string;
  description: string;
  location?: string;
  budget?: number;
  confidence?: string;
  language_detected?: string;
}

export interface JobCreationState {
  // State
  messages: ChatMessage[];
  isProcessing: boolean;
  error: string | null;
  extractedJob: JobExtractionData | null;
  isEditing: boolean;
  jobCreated: boolean;
  createdJobId: string | null;

  // Actions
  initJobCreation: () => void;
  submitText: (text: string) => Promise<void>;
  submitVoice: (audioData: string) => Promise<void>;
  updateField: (field: keyof JobExtractionData, value: string | number) => void;
  confirmAndCreate: () => Promise<boolean>;
  reset: () => void;
}

// --- Helper ---

function createMessage(role: "system" | "user", content: string): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

// --- Store ---

export const useJobCreationStore = create<JobCreationState>((set, get) => ({
  // Initial state
  messages: [],
  isProcessing: false,
  error: null,
  extractedJob: null,
  isEditing: false,
  jobCreated: false,
  createdJobId: null,

  initJobCreation: () => {
    const welcomeMessage = createMessage(
      "system",
      "Hi! I'll help you create a job post. Tell me what you need done — you can type or use voice."
    );

    set({
      messages: [welcomeMessage],
      isProcessing: false,
      error: null,
      extractedJob: null,
      isEditing: false,
      jobCreated: false,
      createdJobId: null,
    });
  },

  submitText: async (text: string) => {
    const userMessage = createMessage("user", text);
    set((state) => ({
      messages: [...state.messages, userMessage],
      isProcessing: true,
      error: null,
    }));

    try {
      const response = await apiService.post<{ success: boolean; data: JobExtractionData }>(
        "/ai/extract-job/text",
        {
          body: { text },
        }
      );

      if (response.success && response.data) {
        const confirmMessage = createMessage(
          "system",
          "Great! Here's what I understood. Please review and edit if needed, then confirm to post your job."
        );

        set((state) => ({
          messages: [...state.messages, confirmMessage],
          extractedJob: response.data,
          isProcessing: false,
          isEditing: true,
        }));
      } else {
        throw new Error("Failed to extract job details");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Sorry, I couldn't understand that. Please try describing your job again.";

      const systemError = createMessage("system", errorMessage);

      set((state) => ({
        messages: [...state.messages, systemError],
        isProcessing: false,
        error: errorMessage,
      }));
    }
  },

  submitVoice: async (audioData: string) => {
    const userMessage = createMessage("user", "🎤 Voice message");
    set((state) => ({
      messages: [...state.messages, userMessage],
      isProcessing: true,
      error: null,
    }));

    try {
      const response = await apiService.post<{ success: boolean; data: JobExtractionData }>(
        "/ai/extract-job/voice",
        {
          body: { audioData },
        }
      );

      if (response.success && response.data) {
        const confirmMessage = createMessage(
          "system",
          "Great! Here's what I understood from your voice message. Please review and edit if needed, then confirm to post your job."
        );

        set((state) => ({
          messages: [...state.messages, confirmMessage],
          extractedJob: response.data,
          isProcessing: false,
          isEditing: true,
        }));
      } else {
        throw new Error("Failed to extract job details from voice");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Sorry, I couldn't process your voice message. Please try again or use text.";

      const systemError = createMessage("system", errorMessage);

      set((state) => ({
        messages: [...state.messages, systemError],
        isProcessing: false,
        error: errorMessage,
      }));
    }
  },

  updateField: (field: keyof JobExtractionData, value: string | number) => {
    set((state) => ({
      extractedJob: state.extractedJob
        ? { ...state.extractedJob, [field]: value }
        : null,
    }));
  },

  confirmAndCreate: async (): Promise<boolean> => {
    const { extractedJob } = get();

    if (!extractedJob) {
      set({ error: "No job data to submit" });
      return false;
    }

    set({ isProcessing: true, error: null });

    try {
      // Call the /customer/request-job endpoint
      const response = await apiService.post<{ job_request: { id: string } }>(
        "/customer/request-job",
        {
          body: {
            job_type_id: extractedJob.job_type_id,
            title: extractedJob.title,
            description: extractedJob.description,
            location: extractedJob.location || undefined,
            budget: extractedJob.budget || undefined,
          },
        }
      );

      const successMessage = createMessage(
        "system",
        "Perfect! Your job has been posted successfully. Artisans will start sending proposals soon."
      );

      set((state) => ({
        messages: [...state.messages, successMessage],
        isProcessing: false,
        jobCreated: true,
        createdJobId: response.job_request.id,
        error: null,
      }));

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create job. Please try again.";

      set({
        isProcessing: false,
        error: errorMessage,
      });

      return false;
    }
  },

  reset: () => {
    set({
      messages: [],
      isProcessing: false,
      error: null,
      extractedJob: null,
      isEditing: false,
      jobCreated: false,
      createdJobId: null,
    });
  },
}));
