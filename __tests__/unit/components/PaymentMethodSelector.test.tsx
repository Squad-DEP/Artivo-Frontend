/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";

describe("PaymentMethodSelector (Requirement 5.7)", () => {
  const defaultProps = {
    value: null as any,
    onChange: vi.fn(),
    disabled: false,
  };

  it("renders all three payment methods", () => {
    render(<PaymentMethodSelector {...defaultProps} />);

    expect(screen.getByText("Mobile Money")).toBeInTheDocument();
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
    expect(screen.getByText("Platform Wallet")).toBeInTheDocument();
  });

  it("renders descriptions for each payment method", () => {
    render(<PaymentMethodSelector {...defaultProps} />);

    expect(
      screen.getByText("Pay via mobile money transfer")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pay via direct bank transfer")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pay from your wallet balance")
    ).toBeInTheDocument();
  });

  it("calls onChange with mobile_money when Mobile Money is clicked", () => {
    const onChange = vi.fn();
    render(<PaymentMethodSelector {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByText("Mobile Money"));
    expect(onChange).toHaveBeenCalledWith("mobile_money");
  });

  it("calls onChange with bank_transfer when Bank Transfer is clicked", () => {
    const onChange = vi.fn();
    render(<PaymentMethodSelector {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByText("Bank Transfer"));
    expect(onChange).toHaveBeenCalledWith("bank_transfer");
  });

  it("calls onChange with wallet when Platform Wallet is clicked", () => {
    const onChange = vi.fn();
    render(<PaymentMethodSelector {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByText("Platform Wallet"));
    expect(onChange).toHaveBeenCalledWith("wallet");
  });

  it("highlights the selected payment method", () => {
    render(
      <PaymentMethodSelector {...defaultProps} value="bank_transfer" />
    );

    const bankButton = screen.getByText("Bank Transfer").closest("button");
    expect(bankButton).toHaveClass("border-primary");
    expect(bankButton).toHaveAttribute("aria-pressed", "true");

    const mobileButton = screen.getByText("Mobile Money").closest("button");
    expect(mobileButton).not.toHaveClass("border-primary");
    expect(mobileButton).toHaveAttribute("aria-pressed", "false");
  });

  it("disables all buttons when disabled prop is true", () => {
    render(<PaymentMethodSelector {...defaultProps} disabled={true} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("does not call onChange when disabled", () => {
    const onChange = vi.fn();
    render(
      <PaymentMethodSelector {...defaultProps} onChange={onChange} disabled={true} />
    );

    fireEvent.click(screen.getByText("Mobile Money"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders the Payment Method label", () => {
    render(<PaymentMethodSelector {...defaultProps} />);
    expect(screen.getByText("Payment Method")).toBeInTheDocument();
  });
});
