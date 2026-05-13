/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import SkillConfirmation, {
  type ExtractedSkill,
} from "@/components/onboarding/SkillConfirmation";

const mockSkills: ExtractedSkill[] = [
  { name: "Plumbing", years_experience: 5 },
  { name: "Electrical Wiring", years_experience: 3 },
  { name: "Carpentry", years_experience: 8 },
];

describe("SkillConfirmation", () => {
  it("renders all extracted skills with names and experience years", () => {
    render(
      <SkillConfirmation
        skills={mockSkills}
        onAccept={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText("Plumbing")).toBeInTheDocument();
    expect(screen.getByText("5 years")).toBeInTheDocument();
    expect(screen.getByText("Electrical Wiring")).toBeInTheDocument();
    expect(screen.getByText("3 years")).toBeInTheDocument();
    expect(screen.getByText("Carpentry")).toBeInTheDocument();
    expect(screen.getByText("8 years")).toBeInTheDocument();
  });

  it("displays singular 'year' for 1 year of experience", () => {
    const skills: ExtractedSkill[] = [{ name: "Painting", years_experience: 1 }];
    render(
      <SkillConfirmation
        skills={skills}
        onAccept={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText("1 year")).toBeInTheDocument();
  });

  it("calls onAccept with original skills when Confirm Skills is clicked", () => {
    const onAccept = vi.fn();
    render(
      <SkillConfirmation
        skills={mockSkills}
        onAccept={onAccept}
        onEdit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Confirm Skills"));
    expect(onAccept).toHaveBeenCalledWith(mockSkills);
  });

  it("enters edit mode when Edit button is clicked", () => {
    render(
      <SkillConfirmation
        skills={mockSkills}
        onAccept={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByText("Edit Your Skills")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("allows editing skill names in edit mode", () => {
    const onEdit = vi.fn();
    render(
      <SkillConfirmation
        skills={mockSkills}
        onAccept={vi.fn()}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByText("Edit"));

    const nameInputs = screen.getAllByPlaceholderText("Skill name");
    fireEvent.change(nameInputs[0], { target: { value: "Advanced Plumbing" } });
    fireEvent.click(screen.getByText("Save Changes"));

    expect(onEdit).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: "Advanced Plumbing" }),
      ])
    );
  });

  it("cancels editing and reverts to original skills", () => {
    render(
      <SkillConfirmation
        skills={mockSkills}
        onAccept={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Cancel"));

    // Should be back in confirmation mode
    expect(screen.getByText("Confirm Skills")).toBeInTheDocument();
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
  });

  it("allows removing skills in edit mode", () => {
    const onEdit = vi.fn();
    render(
      <SkillConfirmation
        skills={mockSkills}
        onAccept={vi.fn()}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByText("Edit"));

    const removeButtons = screen.getAllByLabelText(/Remove/);
    fireEvent.click(removeButtons[0]); // Remove first skill (Plumbing)
    fireEvent.click(screen.getByText("Save Changes"));

    expect(onEdit).toHaveBeenCalledWith(
      expect.not.arrayContaining([
        expect.objectContaining({ name: "Plumbing" }),
      ])
    );
  });

  it("shows add skill button when under 20 skills", () => {
    render(
      <SkillConfirmation
        skills={mockSkills}
        onAccept={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByText("+ Add another skill")).toBeInTheDocument();
  });
});
