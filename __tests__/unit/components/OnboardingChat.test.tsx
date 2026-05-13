/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import OnboardingChat from "@/components/onboarding/OnboardingChat";
import { useOnboardingStore } from "@/store/onboardingStore";
import type { ChatMessage } from "@/store/onboardingStore";

// Mock scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock the store
vi.mock("@/store/onboardingStore", () => ({
  useOnboardingStore: vi.fn(),
}));

const mockUseOnboardingStore = vi.mocked(useOnboardingStore);

function createMessage(
  role: "system" | "user",
  content: string,
  overrides?: Partial<ChatMessage>
): ChatMessage {
  return {
    id: `msg-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("OnboardingChat", () => {
  const mockSubmitResponse = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      messages: [],
      isProcessing: false,
      submitResponse: mockSubmitResponse,
    } as unknown as ReturnType<typeof useOnboardingStore>);
  });

  it("renders the chat input and send button", () => {
    render(<OnboardingChat />);
    expect(screen.getByLabelText("Chat message input")).toBeInTheDocument();
    expect(screen.getByLabelText("Send message")).toBeInTheDocument();
  });

  it("renders system messages aligned to the left", () => {
    const messages = [createMessage("system", "Welcome to onboarding!")];
    mockUseOnboardingStore.mockReturnValue({
      messages,
      isProcessing: false,
      submitResponse: mockSubmitResponse,
    } as unknown as ReturnType<typeof useOnboardingStore>);

    render(<OnboardingChat />);
    expect(screen.getByText("Welcome to onboarding!")).toBeInTheDocument();
  });

  it("renders user messages aligned to the right", () => {
    const messages = [createMessage("user", "My name is John")];
    mockUseOnboardingStore.mockReturnValue({
      messages,
      isProcessing: false,
      submitResponse: mockSubmitResponse,
    } as unknown as ReturnType<typeof useOnboardingStore>);

    render(<OnboardingChat />);
    expect(screen.getByText("My name is John")).toBeInTheDocument();
  });

  it("renders both system and user messages in conversation order", () => {
    const messages = [
      createMessage("system", "What is your name?"),
      createMessage("user", "I am Jane"),
      createMessage("system", "Nice to meet you, Jane!"),
    ];
    mockUseOnboardingStore.mockReturnValue({
      messages,
      isProcessing: false,
      submitResponse: mockSubmitResponse,
    } as unknown as ReturnType<typeof useOnboardingStore>);

    render(<OnboardingChat />);
    expect(screen.getByText("What is your name?")).toBeInTheDocument();
    expect(screen.getByText("I am Jane")).toBeInTheDocument();
    expect(screen.getByText("Nice to meet you, Jane!")).toBeInTheDocument();
  });

  it("shows typing indicator when isProcessing is true", () => {
    mockUseOnboardingStore.mockReturnValue({
      messages: [createMessage("user", "Hello")],
      isProcessing: true,
      submitResponse: mockSubmitResponse,
    } as unknown as ReturnType<typeof useOnboardingStore>);

    const { container } = render(<OnboardingChat />);
    // Typing indicator has animated bounce dots
    const dots = container.querySelectorAll(".animate-bounce");
    expect(dots).toHaveLength(3);
  });

  it("does not show typing indicator when isProcessing is false", () => {
    mockUseOnboardingStore.mockReturnValue({
      messages: [createMessage("system", "Hello")],
      isProcessing: false,
      submitResponse: mockSubmitResponse,
    } as unknown as ReturnType<typeof useOnboardingStore>);

    const { container } = render(<OnboardingChat />);
    const dots = container.querySelectorAll(".animate-bounce");
    expect(dots).toHaveLength(0);
  });

  it("disables input and send button when isProcessing is true", () => {
    mockUseOnboardingStore.mockReturnValue({
      messages: [],
      isProcessing: true,
      submitResponse: mockSubmitResponse,
    } as unknown as ReturnType<typeof useOnboardingStore>);

    render(<OnboardingChat />);
    const input = screen.getByLabelText("Chat message input");
    const button = screen.getByLabelText("Send message");
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it("disables send button when input is empty", () => {
    render(<OnboardingChat />);
    const button = screen.getByLabelText("Send message");
    expect(button).toBeDisabled();
  });

  it("enables send button when input has text", () => {
    render(<OnboardingChat />);
    const input = screen.getByLabelText("Chat message input");
    fireEvent.change(input, { target: { value: "Hello" } });
    const button = screen.getByLabelText("Send message");
    expect(button).not.toBeDisabled();
  });

  it("calls submitResponse and clears input on form submit", async () => {
    render(<OnboardingChat />);
    const input = screen.getByLabelText("Chat message input");
    const form = input.closest("form")!;

    fireEvent.change(input, { target: { value: "My name is Pete" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSubmitResponse).toHaveBeenCalledWith("My name is Pete");
    });
    expect(input).toHaveValue("");
  });

  it("does not submit when input is only whitespace", async () => {
    render(<OnboardingChat />);
    const input = screen.getByLabelText("Chat message input");
    const form = input.closest("form")!;

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(form);

    expect(mockSubmitResponse).not.toHaveBeenCalled();
  });

  it("does not submit when isProcessing is true", async () => {
    mockUseOnboardingStore.mockReturnValue({
      messages: [],
      isProcessing: true,
      submitResponse: mockSubmitResponse,
    } as unknown as ReturnType<typeof useOnboardingStore>);

    render(<OnboardingChat />);
    const input = screen.getByLabelText("Chat message input");
    const form = input.closest("form")!;

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.submit(form);

    expect(mockSubmitResponse).not.toHaveBeenCalled();
  });
});
