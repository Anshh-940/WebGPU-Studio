/**
 * Section-scoped hook for the structured page.
 * Runs useAuth, useModel("structured"), useChat, useStructured (not useVision, useEmbeddings, useFinetune).
 */

import { useAuth } from "./useAuth";
import { useModel } from "./useModel";
import { useChat } from "./useChat";
import { useStructured } from "./useStructured";

export function useStructuredSection() {
  const auth = useAuth();
  const model = useModel("structured");
  const defaultSystemPrompt =
    model.systemPrompt ??
    "You are WebGPU Studio, a concise local-first copilot. Be clear, structured, and brief.";
  const effectiveSystemPrompt = defaultSystemPrompt;

  const chat = useChat({
    activeSection: "structured",
    selectedPreset: model.selectedPreset,
    effectiveSystemPrompt,
    webLLMSupported: model.webLLMSupported,
    transformersJSSupported: model.transformersJSSupported,
    transformersJSWorkerRef: model.transformersJSWorkerRef,
    visionModelRef: model.visionModelRef,
    visionImage: null,
    modelId: model.modelId,
    ensureModelReady: model.ensureModelReady,
    setModelLoading: model.setModelLoading,
    setModelProgress: model.setModelProgress,
    setWebLLMStatus: model.setWebLLMStatus,
    isFeatureDisabled: auth.isFeatureDisabled,
    incrementQueryCount: auth.incrementQueryCount,
  });

  const structured = useStructured({
    selectedPreset: model.selectedPreset,
    effectiveSystemPrompt,
    webLLMSupported: model.webLLMSupported,
    setModelLoading: model.setModelLoading,
    setModelProgress: model.setModelProgress,
    setIsProcessing: chat.setIsProcessing,
    isFeatureDisabled: auth.isFeatureDisabled,
    incrementQueryCount: auth.incrementQueryCount,
  });

  return {
    auth,
    structured,
    chat,
  };
}
