"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { MODEL_PRESETS } from "@/lib/ai/models";
import type { ModelPreset } from "@/lib/ai/models";

interface ModelSelectorProps {
  modelId: string;
  onModelChange: (modelId: string) => void;
  activeSection: string;
  disabled?: boolean;
}

function getGroupLabel(preset: ModelPreset, isVision: boolean): string {
  const id = preset.id;
  if (isVision) {
    if (id.startsWith("smolvlm2")) return "SmolVLM2 500M";
    if (id.startsWith("smolvlm")) return "SmolVLM 256M";
    return "Vision";
  }
  if (id.startsWith("llama32")) return "Llama 3.2";
  if (id.startsWith("qwen25")) return "Qwen2.5";
  if (id.startsWith("gemma")) return "Gemma";
  return "Models";
}

export function ModelSelector({ modelId, onModelChange, activeSection, disabled }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isVision = activeSection === "vision";
  const availablePresets = MODEL_PRESETS.filter((p) =>
    isVision ? p.kind === "vision" : p.kind === "webllm"
  );

  const groupedPresets = useMemo(() => {
    const groups = new Map<string, ModelPreset[]>();
    for (const preset of availablePresets) {
      const label = getGroupLabel(preset, isVision);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(preset);
    }
    return Array.from(groups.entries()).map(([label, models]) => ({ label, models }));
  }, [availablePresets, isVision]);

  const currentPreset = availablePresets.find((p) => p.id === modelId) || availablePresets[0];

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownPosition) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.top,
            right: window.innerWidth - rect.right,
            width: rect.width,
          });
        }
      };
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, dropdownPosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const dropdownContent = isOpen && dropdownPosition ? (
    <div
      ref={dropdownRef}
      className="fixed left-auto bottom-auto z-[10000] min-w-[260px] max-w-[320px] max-h-[320px] overflow-y-auto rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-xl shadow-gray-300/50 dark:shadow-black/50 font-[family-name:var(--font-aspekta)]"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
        width: `${Math.max(dropdownPosition.width, 260)}px`,
        transform: "translateY(calc(-100% - 8px))",
        marginBottom: "8px",
      }}
    >
      {groupedPresets.map(({ label: groupLabel, models }) => (
        <div key={groupLabel} className="py-1.5 first:pt-2">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {groupLabel}
          </div>
          {models.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium transition-colors ${
                modelId === preset.id
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-semibold"
                  : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => {
                onModelChange(preset.id);
                setIsOpen(false);
              }}
            >
              <span className="min-w-0 flex-1 truncate">{preset.label}</span>
              {preset.id.includes("general") && <span className="ml-2 text-xs">⭐</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  ) : null;

  const handleToggle = () => {
    if (!disabled) {
      const newIsOpen = !isOpen;
      if (newIsOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.top,
          right: window.innerWidth - rect.right,
          width: rect.width,
        });
      } else {
        setDropdownPosition(null);
      }
      setIsOpen(newIsOpen);
    }
  };

  return (
    <div className="relative inline-flex max-w-full">
      <button
        ref={buttonRef}
        type="button"
        className={`inline-flex h-6 max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        } ${isOpen ? "border-violet-500 dark:border-violet-400 bg-violet-50/80 dark:bg-violet-900/20" : ""}`}
        onClick={handleToggle}
        disabled={disabled}
        title="Select model"
      >
        <span className="min-w-0 max-w-[140px] truncate">
          {currentPreset?.label || "Select model"}
        </span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`flex-shrink-0 opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {typeof window !== "undefined" && createPortal(dropdownContent, document.body)}
    </div>
  );
}
