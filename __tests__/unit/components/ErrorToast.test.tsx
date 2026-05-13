/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ErrorToast, useErrorToast } from "@/components/ui/ErrorToast";

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

describe("ErrorToast", () => {
  it("renders the toast message when visible", () => {
    render(<ErrorToast message="Connection lost" visible={true} />);
    expect(screen.getByText("Connection lost")).toBeInTheDocument();
  });

  it("does not render when not visible", () => {
    render(<ErrorToast message="Connection lost" visible={false} />);
    expect(screen.queryByText("Connection lost")).not.toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(
      <ErrorToast message="Network error" visible={true} onRetry={onRetry} />
    );
    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders dismiss button when onDismiss is provided", () => {
    const onDismiss = vi.fn();
    render(
      <ErrorToast
        message="Network error"
        visible={true}
        onDismiss={onDismiss}
      />
    );
    const dismissButton = screen.getByLabelText("Dismiss notification");
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("auto-dismisses after duration when no retry handler", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <ErrorToast
        message="Timeout"
        visible={true}
        onDismiss={onDismiss}
        duration={3000}
      />
    );

    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not auto-dismiss when retry handler is provided", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const onRetry = vi.fn();
    render(
      <ErrorToast
        message="Timeout"
        visible={true}
        onDismiss={onDismiss}
        onRetry={onRetry}
        duration={3000}
      />
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("applies network variant styles by default", () => {
    render(<ErrorToast message="Error" visible={true} />);
    const alert = screen.getByRole("alert");
    expect(alert.querySelector(".bg-gray-900")).toBeTruthy();
  });

  it("has proper accessibility attributes", () => {
    render(<ErrorToast message="Error" visible={true} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });
});

describe("useErrorToast", () => {
  it("starts with toast not visible", () => {
    const { result } = renderHook(() => useErrorToast());
    expect(result.current.toast.visible).toBe(false);
    expect(result.current.toast.message).toBe("");
  });

  it("shows toast with message", () => {
    const { result } = renderHook(() => useErrorToast());
    act(() => {
      result.current.showToast("Network error");
    });
    expect(result.current.toast.visible).toBe(true);
    expect(result.current.toast.message).toBe("Network error");
  });

  it("shows toast with retry handler", () => {
    const { result } = renderHook(() => useErrorToast());
    const retryFn = vi.fn();
    act(() => {
      result.current.showToast("Error", { onRetry: retryFn });
    });
    expect(result.current.toast.onRetry).toBe(retryFn);
  });

  it("hides toast", () => {
    const { result } = renderHook(() => useErrorToast());
    act(() => {
      result.current.showToast("Error");
    });
    expect(result.current.toast.visible).toBe(true);
    act(() => {
      result.current.hideToast();
    });
    expect(result.current.toast.visible).toBe(false);
  });

  it("shows toast with variant", () => {
    const { result } = renderHook(() => useErrorToast());
    act(() => {
      result.current.showToast("Error", { variant: "error" });
    });
    expect(result.current.toast.variant).toBe("error");
  });
});
