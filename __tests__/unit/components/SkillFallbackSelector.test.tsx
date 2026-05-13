/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import SkillFallbackSelector, {
  type PredefinedSkill,
} from "@/components/onboarding/SkillFallbackSelector";

const mockPredefinedSkills: PredefinedSkill[] = [
  { name: "Plumbing", category: "Home Services" },
  { name: "Electrical Wiring", category: "Home Services" },
  { name: "Carpentry", category: "Home Services" },
  { name: "Web Development", category: "Tech Services" },
  { name: "Mobile App Development", category: "Tech Services" },
  { name: "Hair Styling", category: "Personal Services" },
  { name: "Makeup Artistry", category: "Personal Services" },
];

describe("SkillFallbackSelector", () => {
  it("renders the component with title and description", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Select Your Skills")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Choose from the list below and set your years of experience for each."
      )
    ).toBeInTheDocument();
  });

  it("groups skills by category", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Home Services")).toBeInTheDocument();
    expect(screen.getByText("Tech Services")).toBeInTheDocument();
    expect(screen.getByText("Personal Services")).toBeInTheDocument();
  });

  it("displays all predefined skills", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Plumbing")).toBeInTheDocument();
    expect(screen.getByText("Web Development")).toBeInTheDocument();
    expect(screen.getByText("Hair Styling")).toBeInTheDocument();
  });

  it("allows selecting a skill by clicking", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    const plumbingCheckbox = screen.getByRole("checkbox", {
      name: "Select Plumbing",
    });
    fireEvent.click(plumbingCheckbox);

    expect(plumbingCheckbox).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("1 of 20 skills selected")).toBeInTheDocument();
  });

  it("shows years input when a skill is selected", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Plumbing" }));

    expect(
      screen.getByLabelText("Years of experience for Plumbing")
    ).toBeInTheDocument();
  });

  it("allows deselecting a skill by clicking again", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    const plumbingCheckbox = screen.getByRole("checkbox", {
      name: "Select Plumbing",
    });
    fireEvent.click(plumbingCheckbox);
    fireEvent.click(plumbingCheckbox);

    expect(plumbingCheckbox).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("0 of 20 skills selected")).toBeInTheDocument();
  });

  it("filters skills by search query", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search skills...");
    fireEvent.change(searchInput, { target: { value: "web" } });

    expect(screen.getByText("Web Development")).toBeInTheDocument();
    expect(screen.queryByText("Plumbing")).not.toBeInTheDocument();
    expect(screen.queryByText("Hair Styling")).not.toBeInTheDocument();
  });

  it("filters skills by category name", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search skills...");
    fireEvent.change(searchInput, { target: { value: "personal" } });

    expect(screen.getByText("Hair Styling")).toBeInTheDocument();
    expect(screen.getByText("Makeup Artistry")).toBeInTheDocument();
    expect(screen.queryByText("Plumbing")).not.toBeInTheDocument();
  });

  it("shows empty state when no skills match search", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search skills...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(
      screen.getByText("No skills match your search.")
    ).toBeInTheDocument();
  });

  it("enforces maximum skill selection limit", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
        maxSkills={2}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Plumbing" }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select Web Development" })
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select Hair Styling" })
    );

    // Third skill should not be selected
    expect(
      screen.getByRole("checkbox", { name: "Select Hair Styling" })
    ).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Maximum reached")).toBeInTheDocument();
  });

  it("submit button is disabled when no skills are selected", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    const submitButton = screen.getByRole("button", {
      name: /Confirm Selected Skills/,
    });
    expect(submitButton).toBeDisabled();
  });

  it("calls onSubmit with selected skills and years when confirmed", () => {
    const onSubmit = vi.fn();
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={onSubmit}
      />
    );

    // Select Plumbing
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Plumbing" }));

    // Change years for Plumbing
    const yearsInput = screen.getByLabelText(
      "Years of experience for Plumbing"
    );
    fireEvent.change(yearsInput, { target: { value: "5" } });

    // Select Web Development
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select Web Development" })
    );

    // Submit
    fireEvent.click(
      screen.getByRole("button", { name: /Confirm Selected Skills/ })
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.arrayContaining([
        { name: "Plumbing", years_experience: 5 },
        { name: "Web Development", years_experience: 1 },
      ])
    );
  });

  it("supports keyboard interaction for skill selection", () => {
    render(
      <SkillFallbackSelector
        predefinedSkills={mockPredefinedSkills}
        onSubmit={vi.fn()}
      />
    );

    const plumbingCheckbox = screen.getByRole("checkbox", {
      name: "Select Plumbing",
    });
    fireEvent.keyDown(plumbingCheckbox, { key: "Enter" });

    expect(plumbingCheckbox).toHaveAttribute("aria-checked", "true");
  });
});
