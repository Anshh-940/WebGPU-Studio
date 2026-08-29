/**
 * Structured JSON generation.
 *
 * Uses the same streaming WebLLM path as chat. `generateObject` goes through
 * non-streaming `doGenerate` plus `response_format: json_object`, which the
 * worker engine never completes — the spinner ran forever while chat streamed fine.
 */

import { useState } from "react";
import { streamText } from "ai";
import { z } from "zod";
import { isWebLLMReady, prepareWebLLMSession } from "@/lib/ai/webllm-session";
import { ModelPreset } from "@/lib/ai/models";
import { logger } from "@/lib/utils/logger";

const GENERATE_TIMEOUT_MS = 45_000;

const structuredSchema = z.object({
  title: z.string(),
  summary: z.string(),
  steps: z.array(
    z.object({
      name: z.string(),
      detail: z.string(),
    }),
  ),
});

type StructuredPlan = z.infer<typeof structuredSchema>;

const JSON_SYSTEM = `You generate structured JSON. Reply with a single JSON object and nothing else.
No markdown, no code fences, no commentary.`;

interface UseStructuredProps {
  selectedPreset: ModelPreset;
  effectiveSystemPrompt: string;
  webLLMSupported: boolean | null;
  setModelLoading: (loading: boolean) => void;
  setModelProgress: (progress: number) => void;
  setIsProcessing: (processing: boolean) => void;
  isFeatureDisabled: boolean;
  incrementQueryCount: () => void;
}

export function useStructured({
  selectedPreset,
  webLLMSupported,
  setModelLoading,
  setModelProgress,
  setIsProcessing,
  incrementQueryCount,
}: UseStructuredProps) {
  const [structuredPrompt, setStructuredPrompt] = useState(
    "Generate a 3-step launch plan for a small product.",
  );
  const [structuredResult, setStructuredResult] = useState<object | null>(null);
  const [structuredError, setStructuredError] = useState<string>("");
  const [structuredLoading, setStructuredLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  async function runStructured() {
    if (!webLLMSupported) {
      setStructuredError("WebGPU/WebLLM not supported in this browser. Please use a browser that supports WebGPU.");
      return;
    }

    incrementQueryCount();

    setStructuredError("");
    setStructuredResult(null);
    setStructuredLoading(true);
    setIsProcessing(true);
    setCopySuccess(false);

    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const needsLoad = !isWebLLMReady(selectedPreset.modelId);
      if (needsLoad) {
        setModelLoading(true);
        setModelProgress(1);
      }
      let model;
      try {
        model = await prepareWebLLMSession(selectedPreset.modelId, (progress) => {
          const pct = Math.round(progress.progress * 100);
          setModelProgress(Math.max(1, Math.min(100, pct)));
        });
      } finally {
        if (needsLoad) setModelLoading(false);
      }

      timeout = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

      const userPrompt = structuredPrompt.trim() || "Generate a concise plan with 3 steps.";
      const prompt = `${userPrompt}

Return a JSON object with exactly these keys:
- "title": string
- "summary": string
- "steps": array of {"name": string, "detail": string}

Example:
{"title":"Launch Plan","summary":"A short summary.","steps":[{"name":"Step 1","detail":"Do this."},{"name":"Step 2","detail":"Then this."},{"name":"Step 3","detail":"Ship it."}]}`;

      let text = await collectStream(model, prompt, controller.signal);

      let plan: StructuredPlan;
      try {
        plan = coercePlan(parseModelJson(text));
      } catch {
        if (controller.signal.aborted) throw new Error("aborted");
        text = await collectStream(
          model,
          `Fix this into valid JSON only (title, summary, steps). No markdown.\n\n${text}`,
          controller.signal,
        );
        plan = coercePlan(parseModelJson(text));
      }

      setStructuredResult(plan);
    } catch (error) {
      setStructuredResult(null);
      const errorMessage = (error as Error).message || "Failed to generate JSON";

      if (controller.signal.aborted || /abort/i.test(errorMessage)) {
        setStructuredError("The model took too long to produce JSON. Try a shorter prompt or a smaller model.");
      } else if (/json/i.test(errorMessage)) {
        setStructuredError("The model's response didn't match the expected format. Please try again with a simpler or more specific prompt.");
      } else {
        setStructuredError(errorMessage);
      }

      logger.error("Structured JSON generation error:", error);
    } finally {
      clearTimeout(timeout);
      setStructuredLoading(false);
      setIsProcessing(false);
      setModelLoading(false);
    }
  }

  function copyStructuredJSON() {
    if (!structuredResult) return;

    const jsonString = JSON.stringify(structuredResult, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch((error) => {
      logger.error("Failed to copy:", error);
      setStructuredError("Failed to copy to clipboard");
    });
  }

  function downloadStructuredJSON() {
    if (!structuredResult) return;

    const jsonString = JSON.stringify(structuredResult, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `structured-output-${timestamp}.json`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    structuredPrompt,
    setStructuredPrompt,
    structuredResult,
    structuredError,
    structuredLoading,
    copySuccess,
    runStructured,
    copyStructuredJSON,
    downloadStructuredJSON,
  };
}

async function collectStream(
  model: Awaited<ReturnType<typeof prepareWebLLMSession>>,
  prompt: string,
  abortSignal: AbortSignal,
): Promise<string> {
  const result = streamText({
    model,
    system: JSON_SYSTEM,
    prompt,
    abortSignal,
    temperature: 0.2,
    maxOutputTokens: 450,
  });

  let acc = "";
  for await (const delta of result.textStream) {
    acc += delta;
  }
  if (!acc.trim()) {
    throw new Error("The model returned an empty response.");
  }
  return acc;
}

function parseModelJson(text: string): unknown {
  const stripped = text.replace(/```json/gi, "```").trim();
  const fenced = stripped.match(/```\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? stripped).trim();
  const start = body.indexOf("{");
  if (start === -1) {
    throw new Error("No JSON object returned");
  }
  const fromBrace = body.slice(start);
  try {
    return JSON.parse(fromBrace);
  } catch {
    const end = fromBrace.lastIndexOf("}");
    if (end <= 0) throw new Error("No JSON object returned");
    return JSON.parse(fromBrace.slice(0, end + 1));
  }
}

function asStep(step: unknown, index: number): { name: string; detail: string } {
  if (typeof step === "string") {
    return { name: `Step ${index + 1}`, detail: step };
  }
  const record = step && typeof step === "object" ? (step as Record<string, unknown>) : {};
  return {
    name: String(record.name ?? record.title ?? `Step ${index + 1}`),
    detail: String(record.detail ?? record.description ?? record.content ?? ""),
  };
}

function coercePlan(value: unknown): StructuredPlan {
  if (Array.isArray(value)) {
    return structuredSchema.parse({
      title: "Plan",
      summary: "",
      steps: value.map(asStep),
    });
  }
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const stepsRaw = Array.isArray(record.steps) ? record.steps : [];
  return structuredSchema.parse({
    title: String(record.title ?? record.name ?? "Untitled"),
    summary: String(record.summary ?? record.description ?? ""),
    steps: stepsRaw.map(asStep),
  });
}
