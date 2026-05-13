/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

describe("OnboardingProgress", () => {
  it("displays the current step and total steps text", () => {
    render(<OnboardingProgress currentStep={2} totalSteps={5} />);
    expect(screen.getByText("2/5")).toBeInTheDocument();
  });

  it("renders the correct number of step indicators for worker (5 steps)", () => {
    const { container } = render(
      <OnboardingProgress currentStep={1} totalSteps={5} />
    );
    const bars = container.querySelectorAll(".rounded-full");
    expect(bars).toHaveLength(5);
  });

  it("renders the correct number of step indicators for customer (3 steps)", () => {
    const { container } = render(
      <OnboardingProgress currentStep={1} totalSteps={3} />
    );
    const bars = container.querySelectorAll(".rounded-full");
    expect(bars).toHaveLength(3);
  });

  it("has correct aria attributes for accessibility", () => {
    render(<OnboardingProgress currentStep={3} totalSteps={5} />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "3");
    expect(progressbar).toHaveAttribute("aria-valuemin", "1");
    expect(progressbar).toHaveAttribute("aria-valuemax", "5");
    expect(progressbar).toHaveAttribute("aria-label", "Step 3 of 5");
  });

  it("applies the active style to the current step", () => {
    const { container } = render(
      <OnboardingProgress currentStep={3} totalSteps={5} />
    );
    const bars = container.querySelectorAll(".rounded-full");
    // Step 3 (index 2) should have the active orange color
    expect(bars[2].className).toContain("bg-[var(--orange)]");
    expect(bars[2].className).not.toContain("bg-[var(--orange)]/60");
  });

  it("applies the completed style to steps before current", () => {
    const { container } = render(
      <OnboardingProgress currentStep={3} totalSteps={5} />
    );
    const bars = container.querySelectorAll(".rounded-full");
    // Steps 1 and 2 (index 0, 1) should have the completed style
    expect(bars[0].className).toContain("bg-[var(--orange)]/60");
    expect(bars[1].className).toContain("bg-[var(--orange)]/60");
  });

  it("applies the inactive style to steps after current", () => {
    const { container } = render(
      <OnboardingProgress currentStep={3} totalSteps={5} />
    );
    const bars = container.querySelectorAll(".rounded-full");
    // Steps 4 and 5 (index 3, 4) should have the inactive gray style
    expect(bars[3].className).toContain("bg-gray-200");
    expect(bars[4].className).toContain("bg-gray-200");
  });

  it("accepts a custom className prop", () => {
    const { container } = render(
      <OnboardingProgress currentStep={1} totalSteps={5} className="mt-4" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("mt-4");
  });
});
