import { describe, it, expect, beforeEach, vi } from "vitest";
import { useOnboardingStore } from "@/store/onboardingStore";

// Mock the API service
vi.mock("@/api/api-service", () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock zustand persist middleware to use in-memory storage
vi.mock("zustand/middleware", () => ({
  persist: (config: any) => config,
}));

import { apiService } from "@/api/api-service";

const mockedApiService = vi.mocked(apiService);

describe("onboardingStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.getState().reset();
  });

  describe("initOnboarding", () => {
    it("should initialize worker onboarding with 5 steps", () => {
      useOnboardingStore.getState().initOnboarding("worker");
      const state = useOnboardingStore.getState();

      expect(state.role).toBe("worker");
      expect(state.totalSteps).toBe(5);
      expect(state.steps).toHaveLength(5);
      expect(state.currentStep).toBe(0);
      expect(state.messages.length).toBeGreaterThanOrEqual(2);
      expect(state.fallbackMode).toBe(false);
      expect(state.partialProfile).toBeNull();
      expect(state.error).toBeNull();
    });

    it("should initialize customer onboarding with 3 steps", () => {
      useOnboardingStore.getState().initOnboarding("customer");
      const state = useOnboardingStore.getState();

      expect(state.role).toBe("customer");
      expect(state.totalSteps).toBe(3);
      expect(state.steps).toHaveLength(3);
      expect(state.currentStep).toBe(0);
    });

    it("should set all steps as not completed with followUpCount 0", () => {
      useOnboardingStore.getState().initOnboarding("worker");
      const state = useOnboardingStore.getState();

      for (const step of state.steps) {
        expect(step.completed).toBe(false);
        expect(step.followUpCount).toBe(0);
        expect(step.data).toBeUndefined();
      }
    });

    it("should include a welcome message and first step prompt", () => {
      useOnboardingStore.getState().initOnboarding("worker");
      const state = useOnboardingStore.getState();

      expect(state.messages[0].role).toBe("system");
      expect(state.messages[0].content).toContain("Welcome");
      expect(state.messages[1].role).toBe("system");
      expect(state.messages[1].content).toBe(state.steps[0].prompt);
    });
  });

  describe("submitResponse", () => {
    beforeEach(() => {
      useOnboardingStore.getState().initOnboarding("worker");
    });

    it("should add user message and call API", async () => {
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { display_name: "John" },
        confidence: 0.9,
      });

      await useOnboardingStore.getState().submitResponse("My name is John");
      const state = useOnboardingStore.getState();

      expect(mockedApiService.post).toHaveBeenCalledWith("/onboarding/process", {
        body: expect.objectContaining({
          text: "My name is John",
          field: "display_name",
          role: "worker",
        }),
      });

      // Should have user message + confirmation message
      const userMessages = state.messages.filter((m) => m.role === "user");
      expect(userMessages).toHaveLength(1);
      expect(userMessages[0].content).toBe("My name is John");
    });

    it("should present extracted data for confirmation on successful extraction", async () => {
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { display_name: "John" },
        confidence: 0.9,
      });

      await useOnboardingStore.getState().submitResponse("My name is John");
      const state = useOnboardingStore.getState();

      const lastMessage = state.messages[state.messages.length - 1];
      expect(lastMessage.requiresConfirmation).toBe(true);
      expect(lastMessage.extractedData).toEqual({ display_name: "John" });
      expect(state.isProcessing).toBe(false);
    });

    it("should ask follow-up when confidence is low", async () => {
      mockedApiService.post.mockResolvedValueOnce({
        extracted: {},
        confidence: 0.3,
        followUp: "Could you be more specific about your name?",
      });

      await useOnboardingStore.getState().submitResponse("hmm");
      const state = useOnboardingStore.getState();

      const lastMessage = state.messages[state.messages.length - 1];
      expect(lastMessage.content).toBe("Could you be more specific about your name?");
      expect(state.steps[0].followUpCount).toBe(1);
      expect(state.fallbackMode).toBe(false);
    });

    it("should activate fallback after 2 failed extractions", async () => {
      // First failed attempt
      mockedApiService.post.mockResolvedValueOnce({
        extracted: {},
        confidence: 0.3,
        followUp: "Could you clarify?",
      });
      await useOnboardingStore.getState().submitResponse("hmm");

      // Second failed attempt
      mockedApiService.post.mockResolvedValueOnce({
        extracted: {},
        confidence: 0.2,
        followUp: "I still don't understand.",
      });
      await useOnboardingStore.getState().submitResponse("still unclear");

      const state = useOnboardingStore.getState();
      expect(state.steps[0].followUpCount).toBe(2);
      expect(state.fallbackMode).toBe(true);
    });

    it("should set error state on API failure", async () => {
      mockedApiService.post.mockRejectedValueOnce(new Error("Network error"));

      await useOnboardingStore.getState().submitResponse("test");
      const state = useOnboardingStore.getState();

      expect(state.error).toBe("Network error");
      expect(state.isProcessing).toBe(false);
    });
  });

  describe("confirmExtraction", () => {
    beforeEach(() => {
      useOnboardingStore.getState().initOnboarding("worker");
    });

    it("should mark step as completed and advance to next step", async () => {
      mockedApiService.post.mockResolvedValueOnce({});

      await useOnboardingStore.getState().confirmExtraction("step-1", "John Doe");
      const state = useOnboardingStore.getState();

      expect(state.steps[0].completed).toBe(true);
      expect(state.steps[0].data).toBe("John Doe");
      expect(state.currentStep).toBe(1);
      expect(state.partialProfile?.display_name).toBe("John Doe");
    });

    it("should call the confirm API endpoint", async () => {
      mockedApiService.post.mockResolvedValueOnce({});

      await useOnboardingStore.getState().confirmExtraction("step-1", "John Doe");

      expect(mockedApiService.post).toHaveBeenCalledWith("/onboarding/confirm", {
        body: expect.objectContaining({
          stepId: "step-1",
          field: "display_name",
          data: "John Doe",
        }),
      });
    });

    it("should build partial profile with skills", async () => {
      // Complete step 1 first
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-1", "John");

      // Now confirm skills
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-2", ["Plumbing", "Electrical"]);

      const state = useOnboardingStore.getState();
      expect(state.partialProfile?.skills).toEqual(["Plumbing", "Electrical"]);
      expect(state.currentStep).toBe(2);
    });

    it("should show completion message on last step", async () => {
      // Set up state as if we're on the last step
      useOnboardingStore.getState().initOnboarding("customer");
      mockedApiService.post.mockResolvedValue({});

      await useOnboardingStore.getState().confirmExtraction("step-1", "Jane");
      await useOnboardingStore.getState().confirmExtraction("step-2", { city: "Lagos", state: "Lagos", country: "Nigeria" });
      await useOnboardingStore.getState().confirmExtraction("step-3", ["Home Services"]);

      const state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(3); // Past last step
      const lastMessage = state.messages[state.messages.length - 1];
      expect(lastMessage.content).toContain("completed");
    });

    it("should reset fallbackMode when advancing to next step", async () => {
      // Activate fallback
      useOnboardingStore.getState().activateFallback();
      expect(useOnboardingStore.getState().fallbackMode).toBe(true);

      // Confirm extraction
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-1", "John");

      const state = useOnboardingStore.getState();
      expect(state.fallbackMode).toBe(false);
    });
  });

  describe("editExtraction", () => {
    beforeEach(() => {
      useOnboardingStore.getState().initOnboarding("worker");
    });

    it("should update step data and add confirmation message", () => {
      useOnboardingStore.getState().editExtraction("step-1", "Updated Name");
      const state = useOnboardingStore.getState();

      expect(state.steps[0].data).toBe("Updated Name");
      const lastMessage = state.messages[state.messages.length - 1];
      expect(lastMessage.requiresConfirmation).toBe(true);
      expect(lastMessage.extractedData).toBe("Updated Name");
    });

    it("should not modify state for non-existent step", () => {
      const beforeMessages = useOnboardingStore.getState().messages.length;
      useOnboardingStore.getState().editExtraction("non-existent", "data");
      const afterMessages = useOnboardingStore.getState().messages.length;

      expect(afterMessages).toBe(beforeMessages);
    });
  });

  describe("activateFallback", () => {
    it("should set fallbackMode to true and add message", () => {
      useOnboardingStore.getState().initOnboarding("worker");
      useOnboardingStore.getState().activateFallback();
      const state = useOnboardingStore.getState();

      expect(state.fallbackMode).toBe(true);
      const lastMessage = state.messages[state.messages.length - 1];
      expect(lastMessage.role).toBe("system");
      expect(lastMessage.content).toContain("options");
    });
  });

  describe("resumeOnboarding", () => {
    it("should restore state from API response", async () => {
      const resumeData = {
        currentStep: 2,
        steps: [
          { id: "step-1", stepNumber: 1, title: "Name", prompt: "Name?", field: "display_name" as const, completed: true, data: "John", followUpCount: 0 },
          { id: "step-2", stepNumber: 2, title: "Skills", prompt: "Skills?", field: "skills" as const, completed: true, data: ["Plumbing"], followUpCount: 1 },
          { id: "step-3", stepNumber: 3, title: "Categories", prompt: "Categories?", field: "categories" as const, completed: false, followUpCount: 0 },
        ],
        messages: [{ id: "msg-1", role: "system" as const, content: "Welcome back!", timestamp: new Date().toISOString() }],
        partialProfile: { display_name: "John", skills: ["Plumbing"] },
        role: "worker" as const,
      };

      mockedApiService.get.mockResolvedValueOnce(resumeData);

      await useOnboardingStore.getState().resumeOnboarding();
      const state = useOnboardingStore.getState();

      expect(state.currentStep).toBe(2);
      expect(state.steps).toHaveLength(3);
      expect(state.steps[0].completed).toBe(true);
      expect(state.steps[1].completed).toBe(true);
      expect(state.partialProfile?.display_name).toBe("John");
      expect(state.role).toBe("worker");
      expect(state.isProcessing).toBe(false);
    });

    it("should set error on API failure", async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error("Not found"));

      await useOnboardingStore.getState().resumeOnboarding();
      const state = useOnboardingStore.getState();

      expect(state.error).toBe("Not found");
      expect(state.isProcessing).toBe(false);
    });
  });

  describe("completeOnboarding", () => {
    beforeEach(() => {
      useOnboardingStore.getState().initOnboarding("worker");
    });

    it("should call complete API and return true on success", async () => {
      mockedApiService.post.mockResolvedValueOnce({});

      const result = await useOnboardingStore.getState().completeOnboarding();

      expect(result).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/onboarding/complete", {
        body: expect.objectContaining({ role: "worker" }),
      });
    });

    it("should return false and set error on failure", async () => {
      mockedApiService.post.mockRejectedValueOnce(new Error("Server error"));

      const result = await useOnboardingStore.getState().completeOnboarding();

      expect(result).toBe(false);
      expect(useOnboardingStore.getState().error).toBe("Server error");
    });
  });

  describe("reset", () => {
    it("should reset all state to initial values", () => {
      useOnboardingStore.getState().initOnboarding("worker");
      useOnboardingStore.getState().reset();
      const state = useOnboardingStore.getState();

      expect(state.currentStep).toBe(0);
      expect(state.steps).toHaveLength(0);
      expect(state.messages).toHaveLength(0);
      expect(state.partialProfile).toBeNull();
      expect(state.fallbackMode).toBe(false);
      expect(state.error).toBeNull();
      expect(state.role).toBe("worker");
    });
  });

  describe("followUpCount tracking", () => {
    beforeEach(() => {
      useOnboardingStore.getState().initOnboarding("worker");
    });

    it("should increment followUpCount on each failed extraction", async () => {
      mockedApiService.post.mockResolvedValueOnce({
        extracted: {},
        confidence: 0.2,
        followUp: "Please clarify",
      });

      await useOnboardingStore.getState().submitResponse("unclear");
      expect(useOnboardingStore.getState().steps[0].followUpCount).toBe(1);

      mockedApiService.post.mockResolvedValueOnce({
        extracted: {},
        confidence: 0.2,
        followUp: "Still unclear",
      });

      await useOnboardingStore.getState().submitResponse("still unclear");
      expect(useOnboardingStore.getState().steps[0].followUpCount).toBe(2);
      expect(useOnboardingStore.getState().fallbackMode).toBe(true);
    });

    it("should not increment followUpCount on successful extraction", async () => {
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { display_name: "John" },
        confidence: 0.95,
      });

      await useOnboardingStore.getState().submitResponse("My name is John");
      expect(useOnboardingStore.getState().steps[0].followUpCount).toBe(0);
    });
  });
});
