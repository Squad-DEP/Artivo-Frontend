/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("ErrorBanner", () => {
  it("renders the error message", () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(
      <ErrorBanner
        message="Error"
        description="Please try again later"
      />
    );
    expect(screen.getByText("Please try again later")).toBeInTheDocument();
  });

  it("renders a retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<ErrorBanner message="Error" onRetry={onRetry} />);
    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders custom retry label", () => {
    render(
      <ErrorBanner message="Error" onRetry={() => {}} retryLabel="Try Again" />
    );
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("renders a dismiss button when onDismiss is provided", () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="Error" onDismiss={onDismiss} />);
    const dismissButton = screen.getByLabelText("Dismiss error");
    expect(dismissButton).toBeInTheDocument();
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not render dismiss button when onDismiss is not provided", () => {
    render(<ErrorBanner message="Error" />);
    expect(screen.queryByLabelText("Dismiss error")).not.toBeInTheDocument();
  });

  it("applies error variant styles by default", () => {
    render(<ErrorBanner message="Error" />);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("bg-red-50");
    expect(alert.className).toContain("border-red-200");
  });

  it("applies warning variant styles", () => {
    render(<ErrorBanner message="Warning" variant="warning" />);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("bg-amber-50");
    expect(alert.className).toContain("border-amber-200");
  });

  it("auto-dismisses after specified duration", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <ErrorBanner message="Error" onDismiss={onDismiss} autoDismiss={3000} />
    );

    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("has proper accessibility attributes", () => {
    render(<ErrorBanner message="Error occurred" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "polite");
  });
});
