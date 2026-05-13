import { describe, it, expect, beforeEach, vi } from "vitest";
import { useOnboardingStore } from "@/store/onboardingStore";
import type { VoiceOnboardResponse } from "@/api/types/marketplace-api";

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

describe("Integration: Onboarding Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.getState().reset();
  });

  describe("Worker Onboarding - Full Flow", () => {
    it("should complete full 5-step worker onboarding with NLP extraction", async () => {
      // Initialize worker onboarding
      useOnboardingStore.getState().initOnboarding("worker");

      let state = useOnboardingStore.getState();
      expect(state.role).toBe("worker");
      expect(state.totalSteps).toBe(5);
      expect(state.currentStep).toBe(0);

      // Step 1: Display Name
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { display_name: "Adebayo Plumber" },
        confidence: 0.95,
      });
      await useOnboardingStore.getState().submitResponse("My name is Adebayo Plumber");

      state = useOnboardingStore.getState();
      expect(state.steps[0].data).toEqual({ display_name: "Adebayo Plumber" });

      // Confirm step 1
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-1", "Adebayo Plumber");

      state = useOnboardingStore.getState();
      expect(state.steps[0].completed).toBe(true);
      expect(state.currentStep).toBe(1);
      expect(state.partialProfile?.display_name).toBe("Adebayo Plumber");

      // Step 2: Skills
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { skills: ["Plumbing", "Pipe Fitting"] },
        confidence: 0.88,
      });
      await useOnboardingStore.getState().submitResponse("I do plumbing and pipe fitting for 5 years");

      // Confirm step 2
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-2", ["Plumbing", "Pipe Fitting"]);

      state = useOnboardingStore.getState();
      expect(state.steps[1].completed).toBe(true);
      expect(state.currentStep).toBe(2);
      expect(state.partialProfile?.skills).toEqual(["Plumbing", "Pipe Fitting"]);

      // Step 3: Categories
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { categories: ["Home Services", "Maintenance"] },
        confidence: 0.92,
      });
      await useOnboardingStore.getState().submitResponse("Home services and maintenance");

      // Confirm step 3
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-3", ["Home Services", "Maintenance"]);

      state = useOnboardingStore.getState();
      expect(state.steps[2].completed).toBe(true);
      expect(state.currentStep).toBe(3);
      expect(state.partialProfile?.categories).toEqual(["Home Services", "Maintenance"]);

      // Step 4: Location
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { location: { city: "Lagos", state: "Lagos", country: "Nigeria" } },
        confidence: 0.97,
      });
      await useOnboardingStore.getState().submitResponse("I'm based in Lagos, Nigeria");

      // Confirm step 4
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore
        .getState()
        .confirmExtraction("step-4", { city: "Lagos", state: "Lagos", country: "Nigeria" });

      state = useOnboardingStore.getState();
      expect(state.steps[3].completed).toBe(true);
      expect(state.currentStep).toBe(4);
      expect(state.partialProfile?.location).toEqual({
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
      });

      // Step 5: Bio
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { bio: "Experienced plumber with 5 years of service." },
        confidence: 0.9,
      });
      await useOnboardingStore
        .getState()
        .submitResponse("Experienced plumber with 5 years of service.");

      // Confirm step 5
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore
        .getState()
        .confirmExtraction("step-5", "Experienced plumber with 5 years of service.");

      state = useOnboardingStore.getState();
      expect(state.steps[4].completed).toBe(true);
      expect(state.currentStep).toBe(5); // Past last step
      expect(state.partialProfile?.bio).toBe("Experienced plumber with 5 years of service.");

      // Complete onboarding
      mockedApiService.post.mockResolvedValueOnce({});
      const result = await useOnboardingStore.getState().completeOnboarding();

      expect(result).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/onboarding/complete", {
        body: {
          profile: expect.objectContaining({
            display_name: "Adebayo Plumber",
            skills: ["Plumbing", "Pipe Fitting"],
            categories: ["Home Services", "Maintenance"],
            location: { city: "Lagos", state: "Lagos", country: "Nigeria" },
            bio: "Experienced plumber with 5 years of service.",
          }),
          role: "worker",
        },
      });
    });

    it("should handle NLP follow-up questions and fallback to manual selection", async () => {
      useOnboardingStore.getState().initOnboarding("worker");

      // Step 1: First attempt fails with low confidence
      mockedApiService.post.mockResolvedValueOnce({
        extracted: {},
        confidence: 0.2,
        followUp: "Could you tell me your preferred display name?",
      });
      await useOnboardingStore.getState().submitResponse("hmm");

      let state = useOnboardingStore.getState();
      expect(state.steps[0].followUpCount).toBe(1);
      expect(state.fallbackMode).toBe(false);

      // Second attempt also fails — triggers fallback
      mockedApiService.post.mockResolvedValueOnce({
        extracted: {},
        confidence: 0.1,
        followUp: "I still need your name.",
      });
      await useOnboardingStore.getState().submitResponse("dunno");

      state = useOnboardingStore.getState();
      expect(state.steps[0].followUpCount).toBe(2);
      expect(state.fallbackMode).toBe(true);

      // User uses fallback (manual selection) and confirms
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-1", "Manual Name");

      state = useOnboardingStore.getState();
      expect(state.steps[0].completed).toBe(true);
      expect(state.currentStep).toBe(1);
      expect(state.fallbackMode).toBe(false); // Reset after advancing
      expect(state.partialProfile?.display_name).toBe("Manual Name");
    });

    it("should persist partial state and resume from last completed step", async () => {
      // Simulate partial onboarding (2 steps completed)
      useOnboardingStore.getState().initOnboarding("worker");

      // Complete steps 1 and 2
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { display_name: "Tunde" },
        confidence: 0.95,
      });
      await useOnboardingStore.getState().submitResponse("Tunde");
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-1", "Tunde");

      mockedApiService.post.mockResolvedValueOnce({
        extracted: { skills: ["Carpentry"] },
        confidence: 0.9,
      });
      await useOnboardingStore.getState().submitResponse("Carpentry");
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-2", ["Carpentry"]);

      // Verify partial state
      let state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(2);
      expect(state.partialProfile?.display_name).toBe("Tunde");
      expect(state.partialProfile?.skills).toEqual(["Carpentry"]);

      // Simulate abandonment and resume
      const resumeData = {
        currentStep: 2,
        steps: state.steps,
        messages: state.messages,
        partialProfile: state.partialProfile,
        role: "worker" as const,
      };

      // Reset and resume
      useOnboardingStore.getState().reset();
      mockedApiService.get.mockResolvedValueOnce(resumeData);
      await useOnboardingStore.getState().resumeOnboarding();

      state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(2);
      expect(state.partialProfile?.display_name).toBe("Tunde");
      expect(state.partialProfile?.skills).toEqual(["Carpentry"]);
      expect(state.role).toBe("worker");
    });
  });

  describe("Customer Onboarding - Full Flow", () => {
    it("should complete full 3-step customer onboarding", async () => {
      // Initialize customer onboarding
      useOnboardingStore.getState().initOnboarding("customer");

      let state = useOnboardingStore.getState();
      expect(state.role).toBe("customer");
      expect(state.totalSteps).toBe(3);
      expect(state.currentStep).toBe(0);

      // Step 1: Name
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { display_name: "Chioma Okafor" },
        confidence: 0.98,
      });
      await useOnboardingStore.getState().submitResponse("My name is Chioma Okafor");

      // Confirm step 1
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-1", "Chioma Okafor");

      state = useOnboardingStore.getState();
      expect(state.steps[0].completed).toBe(true);
      expect(state.currentStep).toBe(1);
      expect(state.partialProfile?.display_name).toBe("Chioma Okafor");

      // Step 2: Location
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { location: { city: "Abuja", state: "FCT", country: "Nigeria" } },
        confidence: 0.95,
      });
      await useOnboardingStore.getState().submitResponse("I live in Abuja, FCT");

      // Confirm step 2
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore
        .getState()
        .confirmExtraction("step-2", { city: "Abuja", state: "FCT", country: "Nigeria" });

      state = useOnboardingStore.getState();
      expect(state.steps[1].completed).toBe(true);
      expect(state.currentStep).toBe(2);

      // Step 3: Service Needs (categories)
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { categories: ["Home Services", "Cleaning"] },
        confidence: 0.85,
      });
      await useOnboardingStore
        .getState()
        .submitResponse("I need someone to fix my plumbing and clean my house");

      // Confirm step 3
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore
        .getState()
        .confirmExtraction("step-3", ["Home Services", "Cleaning"]);

      state = useOnboardingStore.getState();
      expect(state.steps[2].completed).toBe(true);
      expect(state.currentStep).toBe(3); // Past last step

      // Complete onboarding
      mockedApiService.post.mockResolvedValueOnce({});
      const result = await useOnboardingStore.getState().completeOnboarding();

      expect(result).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/onboarding/complete", {
        body: {
          profile: expect.objectContaining({
            display_name: "Chioma Okafor",
            categories: ["Home Services", "Cleaning"],
          }),
          role: "customer",
        },
      });
    });

    it("should handle missing fields with follow-up prompts", async () => {
      useOnboardingStore.getState().initOnboarding("customer");

      // First attempt: user provides incomplete info
      mockedApiService.post.mockResolvedValueOnce({
        extracted: {},
        confidence: 0.3,
        followUp: "I need your full name. What should I call you?",
      });
      await useOnboardingStore.getState().submitResponse("hi");

      let state = useOnboardingStore.getState();
      expect(state.steps[0].followUpCount).toBe(1);

      // Second attempt: user provides valid name
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { display_name: "Emeka" },
        confidence: 0.92,
      });
      await useOnboardingStore.getState().submitResponse("Call me Emeka");

      state = useOnboardingStore.getState();
      const lastMessage = state.messages[state.messages.length - 1];
      expect(lastMessage.requiresConfirmation).toBe(true);
      expect(lastMessage.extractedData).toEqual({ display_name: "Emeka" });
    });

    it("should handle API errors gracefully during onboarding", async () => {
      useOnboardingStore.getState().initOnboarding("customer");

      // API call fails
      mockedApiService.post.mockRejectedValueOnce(new Error("NLP service unavailable"));
      await useOnboardingStore.getState().submitResponse("My name is Test");

      let state = useOnboardingStore.getState();
      expect(state.error).toBe("NLP service unavailable");
      expect(state.isProcessing).toBe(false);

      // User can retry after error
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { display_name: "Test User" },
        confidence: 0.9,
      });
      await useOnboardingStore.getState().submitResponse("My name is Test User");

      state = useOnboardingStore.getState();
      const lastMessage = state.messages[state.messages.length - 1];
      expect(lastMessage.requiresConfirmation).toBe(true);
    });
  });

  describe("Onboarding Edge Cases", () => {
    it("should handle editing extracted data before confirmation", async () => {
      useOnboardingStore.getState().initOnboarding("worker");

      // NLP extracts data
      mockedApiService.post.mockResolvedValueOnce({
        extracted: { display_name: "Adebyo" }, // typo
        confidence: 0.85,
      });
      await useOnboardingStore.getState().submitResponse("Adebayo");

      // User edits the extraction
      useOnboardingStore.getState().editExtraction("step-1", "Adebayo");

      let state = useOnboardingStore.getState();
      expect(state.steps[0].data).toBe("Adebayo");
      const lastMessage = state.messages[state.messages.length - 1];
      expect(lastMessage.requiresConfirmation).toBe(true);
      expect(lastMessage.extractedData).toBe("Adebayo");

      // Now confirm the edited data
      mockedApiService.post.mockResolvedValueOnce({});
      await useOnboardingStore.getState().confirmExtraction("step-1", "Adebayo");

      state = useOnboardingStore.getState();
      expect(state.steps[0].completed).toBe(true);
      expect(state.partialProfile?.display_name).toBe("Adebayo");
    });

    it("should handle complete onboarding failure", async () => {
      useOnboardingStore.getState().initOnboarding("customer");

      // Complete all steps
      mockedApiService.post.mockResolvedValue({});
      await useOnboardingStore.getState().confirmExtraction("step-1", "User");
      await useOnboardingStore.getState().confirmExtraction("step-2", { city: "Lagos", state: "Lagos" });
      await useOnboardingStore.getState().confirmExtraction("step-3", ["Tech"]);

      // Complete onboarding fails
      mockedApiService.post.mockRejectedValueOnce(new Error("Profile creation failed"));
      const result = await useOnboardingStore.getState().completeOnboarding();

      expect(result).toBe(false);
      expect(useOnboardingStore.getState().error).toBe("Profile creation failed");
    });
  });

  describe("Voice Onboarding → Confirm → Save Flow", () => {
    const mockVoiceResponse: VoiceOnboardResponse = {
      message: true,
      data: {
        fullName: "Adebayo Ogunlesi",
        skills: ["Plumbing", "Pipe Fitting", "Water Heater Installation"],
        bio: "Professional plumber with over 8 years of experience in residential and commercial plumbing.",
        experience: "8 years",
        avgPay: "15000",
        location: "Lagos, Nigeria",
      },
    };

    it("should populate confirmationFields after submitVoice with base64 audio", async () => {
      // Validates: Requirements 6.1, 6.3
      useOnboardingStore.getState().reset();

      mockedApiService.post.mockResolvedValueOnce(mockVoiceResponse);

      const base64Audio = "SGVsbG8gV29ybGQ="; // base64 encoded audio
      await useOnboardingStore.getState().submitVoice(base64Audio);

      // Verify API was called with correct payload
      expect(mockedApiService.post).toHaveBeenCalledWith("/ai/onboard/voice", {
        body: {
          audioData: base64Audio,
          userType: "artisan",
        },
      });

      // Verify confirmationFields are populated from AI response
      const state = useOnboardingStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.error).toBeNull();
      expect(state.confirmationFields).toEqual({
        fullName: "Adebayo Ogunlesi",
        skills: "Plumbing, Pipe Fitting, Water Heater Installation",
        bio: "Professional plumber with over 8 years of experience in residential and commercial plumbing.",
        experience: "8 years",
        avgPay: "15000",
        location: "Lagos, Nigeria",
      });
    });

    it("should correct a field locally without making an API call", async () => {
      // Validates: Requirements 7.1, 7.2
      useOnboardingStore.getState().reset();

      // First, populate fields via voice
      mockedApiService.post.mockResolvedValueOnce(mockVoiceResponse);
      await useOnboardingStore.getState().submitVoice("base64audio");

      // Clear mock call history to verify no API call on correction
      vi.clearAllMocks();

      // Correct the fullName field
      useOnboardingStore.getState().correctField("fullName", "Adebayo Ogunlesi Jr.");

      const state = useOnboardingStore.getState();
      expect(state.confirmationFields.fullName).toBe("Adebayo Ogunlesi Jr.");

      // Verify no API calls were made during correction
      expect(mockedApiService.post).not.toHaveBeenCalled();
      expect(mockedApiService.get).not.toHaveBeenCalled();

      // Other fields remain unchanged
      expect(state.confirmationFields.skills).toBe("Plumbing, Pipe Fitting, Water Heater Installation");
      expect(state.confirmationFields.bio).toBe(
        "Professional plumber with over 8 years of experience in residential and commercial plumbing."
      );
      expect(state.confirmationFields.experience).toBe("8 years");
      expect(state.confirmationFields.avgPay).toBe("15000");
      expect(state.confirmationFields.location).toBe("Lagos, Nigeria");
    });

    it("should call POST /user with final fields on confirmAndSave and set saveSuccess", async () => {
      // Validates: Requirements 7.3
      useOnboardingStore.getState().reset();

      // Populate fields via voice
      mockedApiService.post.mockResolvedValueOnce(mockVoiceResponse);
      await useOnboardingStore.getState().submitVoice("base64audio");

      // Correct a field before saving
      useOnboardingStore.getState().correctField("avgPay", "20000");

      // Mock the POST /user call
      mockedApiService.post.mockResolvedValueOnce({});

      // Confirm and save
      const result = await useOnboardingStore.getState().confirmAndSave();

      expect(result).toBe(true);

      // Verify POST /user was called with the final (corrected) fields
      expect(mockedApiService.post).toHaveBeenCalledWith("/user", {
        body: {
          fullName: "Adebayo Ogunlesi",
          skills: "Plumbing, Pipe Fitting, Water Heater Installation",
          bio: "Professional plumber with over 8 years of experience in residential and commercial plumbing.",
          experience: "8 years",
          avgPay: "20000", // corrected value
          location: "Lagos, Nigeria",
        },
      });

      // Verify saveSuccess is true
      const state = useOnboardingStore.getState();
      expect(state.saveSuccess).toBe(true);
      expect(state.isProcessing).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should fall back to submitText when submitVoice fails, and populate confirmationFields", async () => {
      // Validates: Requirements 6.1, 6.3, 6.4
      useOnboardingStore.getState().reset();

      // Voice endpoint fails
      mockedApiService.post.mockRejectedValueOnce(new Error("Voice processing failed. Please try text input."));

      await useOnboardingStore.getState().submitVoice("base64audio");

      // Verify error state after voice failure
      let state = useOnboardingStore.getState();
      expect(state.error).toBe("Voice processing failed. Please try text input.");
      expect(state.isProcessing).toBe(false);
      expect(Object.keys(state.confirmationFields)).toHaveLength(0);

      // Fall back to text input
      const textResponse: VoiceOnboardResponse = {
        message: true,
        data: {
          fullName: "Adebayo Ogunlesi",
          skills: ["Plumbing", "Pipe Fitting"],
          bio: "Experienced plumber based in Lagos.",
          experience: "8 years",
          avgPay: "15000",
          location: "Lagos, Nigeria",
        },
      };
      mockedApiService.post.mockResolvedValueOnce(textResponse);

      const context = [{ role: "user", content: "I am a plumber with 8 years experience in Lagos" }];
      await useOnboardingStore.getState().submitText(
        "I am a plumber with 8 years experience in Lagos",
        context
      );

      // Verify text endpoint was called correctly
      expect(mockedApiService.post).toHaveBeenCalledWith("/ai/onboard/text", {
        body: {
          text: "I am a plumber with 8 years experience in Lagos",
          userType: "artisan",
          context,
        },
      });

      // Verify confirmationFields are now populated from text response
      state = useOnboardingStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.error).toBeNull();
      expect(state.confirmationFields).toEqual({
        fullName: "Adebayo Ogunlesi",
        skills: "Plumbing, Pipe Fitting",
        bio: "Experienced plumber based in Lagos.",
        experience: "8 years",
        avgPay: "15000",
        location: "Lagos, Nigeria",
      });
    });

    it("should handle confirmAndSave failure and preserve form state", async () => {
      // Validates: Requirements 7.5
      useOnboardingStore.getState().reset();

      // Populate fields via voice
      mockedApiService.post.mockResolvedValueOnce(mockVoiceResponse);
      await useOnboardingStore.getState().submitVoice("base64audio");

      // Mock POST /user failure
      mockedApiService.post.mockRejectedValueOnce(new Error("Failed to save profile. Please try again."));

      const result = await useOnboardingStore.getState().confirmAndSave();

      expect(result).toBe(false);

      const state = useOnboardingStore.getState();
      expect(state.saveSuccess).toBe(false);
      expect(state.error).toBe("Failed to save profile. Please try again.");
      expect(state.isProcessing).toBe(false);

      // Confirmation fields are preserved for retry
      expect(state.confirmationFields.fullName).toBe("Adebayo Ogunlesi");
      expect(state.confirmationFields.skills).toBe("Plumbing, Pipe Fitting, Water Heater Installation");
    });

    it("should handle multiple field corrections before saving", async () => {
      // Validates: Requirements 7.1, 7.2, 7.3
      useOnboardingStore.getState().reset();

      // Populate fields via voice
      mockedApiService.post.mockResolvedValueOnce(mockVoiceResponse);
      await useOnboardingStore.getState().submitVoice("base64audio");

      // Correct multiple fields
      useOnboardingStore.getState().correctField("fullName", "Adebayo O.");
      useOnboardingStore.getState().correctField("location", "Ikeja, Lagos");
      useOnboardingStore.getState().correctField("experience", "10 years");

      // Verify all corrections applied locally
      let state = useOnboardingStore.getState();
      expect(state.confirmationFields.fullName).toBe("Adebayo O.");
      expect(state.confirmationFields.location).toBe("Ikeja, Lagos");
      expect(state.confirmationFields.experience).toBe("10 years");
      // Unchanged fields
      expect(state.confirmationFields.skills).toBe("Plumbing, Pipe Fitting, Water Heater Installation");
      expect(state.confirmationFields.bio).toBe(
        "Professional plumber with over 8 years of experience in residential and commercial plumbing."
      );
      expect(state.confirmationFields.avgPay).toBe("15000");

      // Save with corrected fields
      mockedApiService.post.mockResolvedValueOnce({});
      const result = await useOnboardingStore.getState().confirmAndSave();

      expect(result).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/user", {
        body: {
          fullName: "Adebayo O.",
          skills: "Plumbing, Pipe Fitting, Water Heater Installation",
          bio: "Professional plumber with over 8 years of experience in residential and commercial plumbing.",
          experience: "10 years",
          avgPay: "15000",
          location: "Ikeja, Lagos",
        },
      });

      state = useOnboardingStore.getState();
      expect(state.saveSuccess).toBe(true);
    });
  });
});
