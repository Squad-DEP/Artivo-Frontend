"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ExtractedSkill {
  name: string;
  years_experience: number;
}

interface SkillConfirmationProps {
  skills: ExtractedSkill[];
  onAccept: (skills: ExtractedSkill[]) => void;
  onEdit: (skills: ExtractedSkill[]) => void;
}

export default function SkillConfirmation({
  skills,
  onAccept,
  onEdit,
}: SkillConfirmationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSkills, setEditedSkills] = useState<ExtractedSkill[]>(skills);

  const handleSkillNameChange = (index: number, name: string) => {
    const updated = [...editedSkills];
    updated[index] = { ...updated[index], name };
    setEditedSkills(updated);
  };

  const handleYearsChange = (index: number, years: string) => {
    const parsed = parseInt(years, 10);
    const value = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    const updated = [...editedSkills];
    updated[index] = { ...updated[index], years_experience: value };
    setEditedSkills(updated);
  };

  const handleRemoveSkill = (index: number) => {
    const updated = editedSkills.filter((_, i) => i !== index);
    setEditedSkills(updated);
  };

  const handleAddSkill = () => {
    if (editedSkills.length >= 20) return;
    setEditedSkills([...editedSkills, { name: "", years_experience: 1 }]);
  };

  const handleSaveEdits = () => {
    const validSkills = editedSkills.filter((s) => s.name.trim().length > 0);
    if (validSkills.length === 0) return;
    setIsEditing(false);
    onEdit(validSkills);
  };

  const handleAccept = () => {
    onAccept(skills);
  };

  if (isEditing) {
    return (
      <div className="rounded-xl border border-[#E4E4E4] bg-white p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#444]">Edit Your Skills</h3>

        <div className="space-y-3">
          {editedSkills.map((skill, index) => (
            <div
              key={index}
              className="flex items-center gap-2 sm:gap-3"
            >
              <Input
                value={skill.name}
                onChange={(e) => handleSkillNameChange(index, e.target.value)}
                placeholder="Skill name"
                className="flex-1 !py-2 !px-3 !text-sm !rounded-lg"
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={skill.years_experience}
                  onChange={(e) => handleYearsChange(index, e.target.value)}
                  className="w-16 !py-2 !px-2 !text-sm !rounded-lg text-center"
                />
                <span className="text-xs text-[#888] whitespace-nowrap">yrs</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSkill(index)}
                className="text-[#B4B4B4] hover:text-red-500 transition-colors p-1"
                aria-label={`Remove ${skill.name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {editedSkills.length < 20 && (
          <button
            type="button"
            onClick={handleAddSkill}
            className="text-sm text-[var(--orange)] hover:underline font-medium"
          >
            + Add another skill
          </button>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSaveEdits}
            size="sm"
            className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
          >
            Save Changes
          </Button>
          <Button
            onClick={() => {
              setEditedSkills(skills);
              setIsEditing(false);
            }}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E4E4E4] bg-white p-4 sm:p-6 space-y-4">
      <h3 className="text-sm font-semibold text-[#444]">
        Extracted Skills
      </h3>

      <div className="space-y-2">
        {skills.map((skill, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center justify-between rounded-lg bg-[#FBFBFB] px-4 py-3 border border-[#E4E4E4]"
            )}
          >
            <span className="text-sm font-medium text-[#333]">
              {skill.name}
            </span>
            <span className="text-xs text-[#888] bg-[#F0F0F0] px-2 py-1 rounded-full">
              {skill.years_experience} {skill.years_experience === 1 ? "year" : "years"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleAccept}
          size="sm"
          className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
        >
          Confirm Skills
        </Button>
        <Button
          onClick={() => setIsEditing(true)}
          variant="outline"
          size="sm"
        >
          Edit
        </Button>
      </div>
    </div>
  );
}
