"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PredefinedSkill {
  name: string;
  category: string;
}

interface SkillFallbackSelectorProps {
  predefinedSkills: PredefinedSkill[];
  onSubmit: (skills: { name: string; years_experience: number }[]) => void;
  maxSkills?: number;
}

const DEFAULT_MAX_SKILLS = 20;

export default function SkillFallbackSelector({
  predefinedSkills,
  onSubmit,
  maxSkills = DEFAULT_MAX_SKILLS,
}: SkillFallbackSelectorProps) {
  const [selectedSkills, setSelectedSkills] = useState<
    Map<string, number>
  >(new Map());
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSkills = predefinedSkills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered skills by category
  const groupedSkills = filteredSkills.reduce<Record<string, PredefinedSkill[]>>(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    },
    {}
  );

  const handleToggleSkill = (skillName: string) => {
    const updated = new Map(selectedSkills);
    if (updated.has(skillName)) {
      updated.delete(skillName);
    } else {
      if (updated.size >= maxSkills) return;
      updated.set(skillName, 1);
    }
    setSelectedSkills(updated);
  };

  const handleYearsChange = (skillName: string, years: number) => {
    const value = Math.max(0, Math.min(50, years));
    const updated = new Map(selectedSkills);
    updated.set(skillName, value);
    setSelectedSkills(updated);
  };

  const handleSubmit = () => {
    if (selectedSkills.size === 0) return;
    const skills = Array.from(selectedSkills.entries()).map(
      ([name, years_experience]) => ({ name, years_experience })
    );
    onSubmit(skills);
  };

  return (
    <div className="rounded-xl border border-[#E4E4E4] bg-white p-4 sm:p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[#444]">
          Select Your Skills
        </h3>
        <p className="text-xs text-[#888]">
          Choose from the list below and set your years of experience for each.
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
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
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B4B4B4]"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search skills..."
          className={cn(
            "w-full rounded-lg border border-[#E4E4E4] bg-[#FBFBFB] pl-9 pr-4 py-2.5 text-sm",
            "placeholder:text-[#B4B4B4] outline-none transition-[color,box-shadow]",
            "focus-visible:border-[#FF6200] focus-visible:ring-[#FF6200]/30 focus-visible:ring-[3px]"
          )}
          aria-label="Search skills"
        />
      </div>

      {/* Selected count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#888]">
          {selectedSkills.size} of {maxSkills} skills selected
        </span>
        {selectedSkills.size >= maxSkills && (
          <span className="text-xs text-amber-600 font-medium">
            Maximum reached
          </span>
        )}
      </div>

      {/* Skills list */}
      <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
        {Object.keys(groupedSkills).length === 0 ? (
          <p className="text-sm text-[#888] text-center py-4">
            No skills match your search.
          </p>
        ) : (
          Object.entries(groupedSkills).map(([category, skills]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-medium text-[#666] uppercase tracking-wide">
                {category}
              </h4>
              <div className="space-y-1.5">
                {skills.map((skill) => {
                  const isSelected = selectedSkills.has(skill.name);
                  return (
                    <div
                      key={skill.name}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 border transition-colors cursor-pointer",
                        isSelected
                          ? "border-[var(--orange)] bg-[var(--orange)]/5"
                          : "border-[#E4E4E4] bg-[#FBFBFB] hover:border-[#CCC]"
                      )}
                      onClick={() => handleToggleSkill(skill.name)}
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`Select ${skill.name}`}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggleSkill(skill.name);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-[var(--orange)] bg-[var(--orange)]"
                              : "border-[#CCC] bg-white"
                          )}
                        >
                          {isSelected && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-[#333]">{skill.name}</span>
                      </div>

                      {isSelected && (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={selectedSkills.get(skill.name) ?? 1}
                            onChange={(e) =>
                              handleYearsChange(
                                skill.name,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-14 rounded-md border border-[#E4E4E4] bg-white px-2 py-1 text-sm text-center outline-none focus-visible:border-[#FF6200] focus-visible:ring-[#FF6200]/30 focus-visible:ring-[2px]"
                            aria-label={`Years of experience for ${skill.name}`}
                          />
                          <span className="text-xs text-[#888]">yrs</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit button */}
      <div className="pt-2">
        <Button
          onClick={handleSubmit}
          disabled={selectedSkills.size === 0}
          size="sm"
          className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white disabled:opacity-50"
        >
          Confirm Selected Skills ({selectedSkills.size})
        </Button>
      </div>
    </div>
  );
}
